function res = runScenario(sc, seed, opts, p)
%RUNSCENARIO  Runs one scenario once and returns a metrics struct.
%
%   sc    one element of scenarios()
%   seed  RNG seed. Geometry is fixed per scenario; the seed changes the
%         SENSOR noise, misses and false alarms. So the same scenario at
%         different seeds tests whether the vehicle copes with different
%         perception failures, not different traffic.
%   opts  .animate  draw the live figure
%         .video    write an mp4 (requires animate)
%         .name     video filename
%
%   Everything that was inline in test_step5 lives here now, because the
%   metrics harness needs to call it 50 times without a figure.

if ~isfield(opts,'animate'), opts.animate = false; end
if ~isfield(opts,'video'),   opts.video   = false; end
if ~isfield(opts,'name'),    opts.name    = 'run'; end
if ~isfield(opts,'pretty'),  opts.pretty  = false; end

rng(seed);

%% ---- scene ------------------------------------------------------------
staticObs = sc.staticObs;
[staticCost, gi] = costmapLayers(staticObs, p);

if sc.hasRef
    sRef = (0:0.5:sc.refEndsAt+2)';
    rp   = sc.refFcn(sRef);
    ref  = buildRefPath(rp(:,1), rp(:,2));
else
    ref  = [];
end

agents  = sc.agents;
nAg     = numel(agents);
agRad   = arrayfun(@(a) a.radius,  agents)';
agClass = arrayfun(@(a) a.classID, agents)';

goalState = sc.goal;

%% ---- init -------------------------------------------------------------
trk   = trackerInit(p);
state = [sc.start(1); sc.start(2); sc.start(3); 0];
deltaPrev = 0;  integ = 0;

filtMap = containers.Map('KeyType','double','ValueType','any');
pathX = zeros(p.MAX_PATH_PTS,1); pathY = pathX; pathK = pathX; nPts = 0;

sm.state = 1;  sm.tEntered = 0;  sm.mergeZone = false;
bhv.plannerMode=1; bhv.targetSpeed=p.bhv.vLane; bhv.lateralMargin=0.3;
bhv.stateID=1; bhv.emergencyStop=false; bhv.minTTC=inf; bhv.nNear=0;
bhv.wObstacle=1; bhv.wPredicted=1; bhv.wSurface=1;

nSteps      = round(sc.tEnd / p.dt_vehicle);
replanEvery = round(p.replan.period / p.dt_vehicle);

lat=[]; nReplan=0; planFails=0; totalFails=0;
usedFrenet=0; usedAStar=0; nRetry=0; whichPlanner='-';
minDist=inf; collided=false; stuckCycles=0; staticHits=0;
stateLog=[]; nTrkLog=[]; nDetLog=[]; allIDs=[];
maxCell=0;

logX=zeros(nSteps,1); logY=logX; logV=logX; kEnd=0;
nTrk=0; preds=struct('px',{},'py',{},'sigma',{},'radius',{});
tid=[]; tpos=[]; reached=false;

STATE_NAMES = {'LANE','UNSTR','YIELD','CREEP','MERGE','ESTOP'};

if opts.animate
    fh = figure('Name',['Scenario: ' sc.name],'Position',[50 50 1200 620],'Color','w');
    if opts.video
        vw = VideoWriter([opts.name '.mp4'],'MPEG-4');
        vw.FrameRate = 20;  open(vw);
    end
end

%% ---- main loop --------------------------------------------------------
for k = 1:nSteps
    t = (k-1)*p.dt_vehicle;

    if mod(k-1, replanEvery) == 0
        % --- truth (simulation only) --------------------------------
        agPos = zeros(nAg,2);
        % Clearance is measured to the vehicle's LONGITUDINAL AXIS, not to
        % the rear axle. Measuring to the axle reports 2 m of clearance for
        % an agent standing on the bonnet, because the body extends 3.65 m
        % ahead of the reference point. The first batch run under-counted
        % collisions for exactly this reason.
        ax1 = state(1);
        ay1 = state(2);
        ax2 = state(1) + p.veh.length*cos(state(3));
        ay2 = state(2) + p.veh.length*sin(state(3));
        for a = 1:nAg
            agPos(a,:) = agents(a).fn(t);
            d = pointSegDistLocal(agPos(a,1), agPos(a,2), ax1, ay1, ax2, ay2);
            minDist = min(minDist, d);
            if d < agRad(a) + p.veh.width/2, collided = true; end
        end

        % --- sensors -------------------------------------------------
        [detPos, detCls, detSns, nDet] = ...
            sensorSuite(state, agPos, agRad, agClass, staticObs, p);

        % --- tracker -------------------------------------------------
        [trk, tid, tpos, ~, tcls, nTrk] = ...
            trackerUpdate(trk, detPos, detCls, detSns, nDet, p);
        nDetLog(end+1)=nDet; nTrkLog(end+1)=nTrk; %#ok<AGROW>
        allIDs = union(allIDs, tid(1:nTrk));

        % --- prediction ----------------------------------------------
        preds = struct('px',{},'py',{},'sigma',{},'radius',{});
        liveIDs = zeros(nTrk,1);
        for i = 1:nTrk
            id = tid(i);  liveIDs(i)=id;
            z = tpos(i,:)';
            if isKey(filtMap,id), f=filtMap(id); else, f=immInit(z,p.replan.period,p); end
            f = immStep(f, z, p);
            filtMap(id) = f;
            [px_,py_,sg_] = immPredictAhead(f, p);
            preds(i).px=px_; preds(i).py=py_; preds(i).sigma=sg_;
            switch tcls(i)
                case 5, preds(i).radius=0.6;
                case 6, preds(i).radius=1.0;
                case 7, preds(i).radius=1.1;
                case 3, preds(i).radius=1.5;
                case 2, preds(i).radius=2.2;
                otherwise, preds(i).radius=1.5;   % unknown: assume large
            end
        end
        ks = cell2mat(keys(filtMap));
        for kk = ks
            if ~any(liveIDs==kk), remove(filtMap,kk); end
        end

        % --- behaviour -----------------------------------------------
        refOK = sc.hasRef && state(1) < sc.refEndsAt;
        if refOK
            dR = min(hypot(ref.x - state(1), ref.y - state(2)));
        else
            dR = inf;
        end
        [bhv, sm] = behaviourLayer(sm, state, preds, nTrk, refOK, dR, planFails, t, p);
        stateLog(end+1) = bhv.stateID; %#ok<AGROW>

        % --- costmap --------------------------------------------------
        pC = p;
        pC.cmap.wPred = p.cmap.wPred * bhv.wPredicted;
        cost = costmapDynamic(staticCost, gi, preds, nTrk, state, pC);
        cost = costmapHysteresis(cost, gi, pathX, pathY, nPts, state(1:2)', p);

        % --- planner cascade ------------------------------------------
        tic;
        gotPath = false;
        if bhv.plannerMode == 1 && refOK
            [fx,fy,fk,fn,fok,~] = frenetPlanner(ref, cost, gi, state, bhv, p);
            if fok && fn > 3
                pathX=fx; pathY=fy; pathK=fk; nPts=fn;
                gotPath=true; usedFrenet=usedFrenet+1; whichPlanner='Frenet';
            end
        end
        if ~gotPath
            pPlan = p;  pPlan.plan.maxExpand = p.replan.maxExpand;
            [rx,ry,~,nRaw,aok,~] = hybridAStar(state(1:3)', goalState, cost, gi, pPlan);
            if ~aok
                % Hysteresis is the only layer present for smoothness
                % rather than safety, so it is the one we drop under
                % pressure. Obstacle and prediction layers never go.
                cNo = costmapDynamic(staticCost, gi, preds, nTrk, state, pC);
                [rx,ry,~,nRaw,aok,~] = hybridAStar(state(1:3)', goalState, cNo, gi, pPlan);
                if aok, nRetry = nRetry+1; end
            end
            if aok && nRaw > 3
                [sx,sy,sk,m] = smoothPath(rx, ry, nRaw, cost, gi, p);
                if m > 2
                    pathX=sx; pathY=sy; pathK=sk; nPts=m;
                    gotPath=true; usedAStar=usedAStar+1; whichPlanner='A*';
                end
            end
        end
        lat(end+1)=toc*1000; %#ok<AGROW>
        nReplan = nReplan+1;
        if gotPath, planFails=0; else, planFails=planFails+1; totalFails=totalFails+1; whichPlanner='FAIL'; end

        if state(4) < 0.2, stuckCycles = stuckCycles+1; else, stuckCycles = 0; end
    end

    % --- control and vehicle -----------------------------------------
    if nPts > 2 && ~bhv.emergencyStop
        [delta,tgtIdx,~,~] = purePursuit(state, pathX, pathY, nPts, p);
        kappa = pathK(double(tgtIdx));
        [aCmd,integ,~] = speedControl(state(4), bhv.targetSpeed, kappa, integ, p.dt_vehicle, p);
        [state,deltaPrev] = bicycleStep(state, delta, aCmd, deltaPrev, p.dt_vehicle, p);
    else
        [state,deltaPrev] = bicycleStep(state, 0, p.veh.aEmerg, deltaPrev, p.dt_vehicle, p);
    end

    % --- static-obstacle collision and cost, over the FOOTPRINT ---------
    % Sampling the rear axle alone is the same mistake the planners had:
    % the body extends 3.65 m ahead of it, so a vehicle clipping a building
    % corner with its bonnet reported clean. Static collisions were not
    % being counted at all -- agent distance was the only check.
    cy_ = cos(state(3));  sy_ = sin(state(3));
    for fi = 1:numel(p.veh.footOffsets)
        fx = state(1) + p.veh.footOffsets(fi)*cy_;
        fy = state(2) + p.veh.footOffsets(fi)*sy_;
        ix = floor((fx-gi.origin(1))/gi.res)+1;
        iy = floor((fy-gi.origin(2))/gi.res)+1;
        if ix>=1 && ix<=gi.nx && iy>=1 && iy<=gi.ny
            maxCell = max(maxCell, cost(iy,ix));
            if staticCost(iy,ix) >= 255
                collided   = true;
                staticHits = staticHits + 1;
            end
        else
            collided = true;          % left the map entirely
        end
    end

    logX(k)=state(1); logY(k)=state(2); logV(k)=state(4); kEnd=k;

    % --- animation -----------------------------------------------------
    if opts.animate && mod(k-1,5)==0 && opts.pretty
        drawFrame(sc, gi, cost, ref, state, pathX, pathY, nPts, ...
                  logX, logY, kEnd, agents, agRad, tpos, nTrk, preds, ...
                  bhv, whichPlanner, t, lat(end), minDist, p);
        drawnow limitrate;
        if opts.video, writeVideo(vw, getframe(fh)); end
    elseif opts.animate && mod(k-1,5)==0
        clf;
        imagesc([gi.origin(1) gi.origin(1)+gi.nx*gi.res], ...
                [gi.origin(2) gi.origin(2)+gi.ny*gi.res], cost);
        set(gca,'YDir','normal'); colormap(flipud(gray)); caxis([0 255]); hold on;
        if sc.hasRef
            plot(ref.x, ref.y, 'g--','LineWidth',1);
            if sc.refEndsAt < 150, xline(sc.refEndsAt,'g:','ref ends'); end
        end
        if nPts>2, plot(pathX(1:nPts),pathY(1:nPts),'c-','LineWidth',2.2); end
        plot(logX(1:kEnd),logY(1:kEnd),'b-','LineWidth',1.5);
        th = linspace(0,2*pi,20);
        for a = 1:nAg
            z = agents(a).fn(t);
            plot(z(1)+agRad(a)*cos(th), z(2)+agRad(a)*sin(th),'r--','LineWidth',1);
        end
        for i = 1:nTrk
            plot(tpos(i,1),tpos(i,2),'go','MarkerFaceColor','g','MarkerSize',6);
            plot(preds(i).px,preds(i).py,'m:','LineWidth',1.1);
        end
        drawVehicleLocal(state,p);
        plot(goalState(1),goalState(2),'gs','MarkerFaceColor','g','MarkerSize',10);
        axis equal; axis([0 120 0 56]);
        title(sprintf('%s  t=%5.2f  %s  planner=%-6s  v=%4.1f  TTC=%4.1f  lat=%5.1f ms', ...
              strrep(sc.name,'_',' '), t, STATE_NAMES{bhv.stateID}, whichPlanner, ...
              state(4), min(bhv.minTTC,9.9), lat(end)));
        xlabel('x [m]'); ylabel('y [m]');
        drawnow limitrate;
        if opts.video, writeVideo(vw, getframe(fh)); end
    end

    if hypot(state(1)-goalState(1), state(2)-goalState(2)) < 2.5
        reached = true;  break;
    end
    if stuckCycles > 60      % 6 s at zero speed = genuinely stuck
        break;
    end
end

if opts.animate && opts.video, close(vw); end

%% ---- results ----------------------------------------------------------
lat = lat(:);
ls  = sort(lat);
res.scenario   = sc.name;
res.seed       = seed;
res.completed  = reached && ~collided;
res.collided   = collided;
res.staticHits = staticHits;
res.reached    = reached;
res.duration   = (kEnd-1)*p.dt_vehicle;
res.minClear   = minDist;
res.maxCell    = maxCell;
res.meanSpeed  = mean(logV(1:kEnd));
res.replans    = nReplan;
res.frenetPct  = 100*usedFrenet/max(nReplan,1);
res.astarPct   = 100*usedAStar/max(nReplan,1);
res.failPct    = 100*totalFails/max(nReplan,1);
res.nRetry     = nRetry;
res.latMean    = mean(lat);
res.latP95     = ls(max(1,ceil(0.95*numel(ls))));
res.latMax     = max(lat);
res.meanTracks = mean(nTrkLog);
res.meanDets   = mean(nDetLog);
res.distinctID = numel(allIDs);
res.nAgents    = nAg;
res.stateLog   = stateLog;
res.pctCreep   = 100*sum(stateLog==4)/max(numel(stateLog),1);
res.pctEstop   = 100*sum(stateLog==6)/max(numel(stateLog),1);
end

%% ----------------------------------------------------------------------
function d = pointSegDistLocal(px, py, x1, y1, x2, y2)
ex = x2-x1;  ey = y2-y1;
L2 = ex*ex + ey*ey;
if L2 < 1e-12
    d = hypot(px-x1, py-y1);  return;
end
t = ((px-x1)*ex + (py-y1)*ey) / L2;
t = max(0, min(1, t));
d = hypot(px - (x1+t*ex), py - (y1+t*ey));
end

function drawVehicleLocal(state, p)
L = p.veh.length; W = p.veh.width;
c = [ 0 -W/2; L -W/2; L W/2; 0 W/2 ]';
R = [cos(state(3)) -sin(state(3)); sin(state(3)) cos(state(3))];
c = R*c + [state(1); state(2)];
fill(c(1,:), c(2,:), 'b','FaceAlpha',0.75,'EdgeColor','b');
end