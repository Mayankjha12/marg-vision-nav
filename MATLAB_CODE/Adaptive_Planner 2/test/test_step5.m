%TEST_STEP5  The complete Part 1 pipeline.
%
%   sensors -> tracker -> IMM -> behaviour -> costmap -> planner cascade
%           -> smoother -> controller -> vehicle -> back to sensors
%
%   Usage:  cd D:\Adaptive_Planner\test
%           test_step5
%
%   NEW IN STEP 5
%   1. A behaviour state machine that decides HOW to drive, and sets the
%      target speed, safety margin and costmap weights accordingly.
%   2. A Frenet planner for roads that have a centreline.
%   3. A planner CASCADE: try Frenet, fall back to hybrid A*. Watch the
%      title bar -- it shows which planner produced the current path.
%
%   The scene has a centreline for the first stretch and none after
%   x = 60 m, so you can watch the cascade hand over from Frenet to
%   hybrid A* as the road structure disappears. That handover IS the
%   contribution of this project.

clear; clc; close all;
addpath(fullfile(fileparts(mfilename('fullpath')), '..', 'core'));

p = params();
rng(7);

ANIMATE    = true;
MAKE_VIDEO = false;
T_END      = 32.0;

%% ---- scene ------------------------------------------------------------
staticObs = [  0  0 120  4;      % lower verge
               0 52 120 56;      % upper verge
              30 20  36 34;      % parked truck, in the structured section
              78 18  84 32 ];    % obstruction in the unstructured section

[staticCost, gi] = costmapLayers(staticObs, p);

% Centreline exists only over the first 60 m. Past that the road becomes
% an unmarked village track and there is nothing to follow.
sRef = (0:0.5:62)';
ref  = buildRefPath(sRef, 28 + 4*sin(2*pi*sRef/140));
REF_ENDS_AT = 60;

agents  = agentScripts();
nAg     = numel(agents);
agRad   = arrayfun(@(a) a.radius,  agents)';
agClass = arrayfun(@(a) a.classID, agents)';

goalState = [112, 28, 0];

%% ---- init -------------------------------------------------------------
trk   = trackerInit(p);
state = [6; 28; 0; 0];
deltaPrev = 0;  integ = 0;

filtMap = containers.Map('KeyType','double','ValueType','any');
pathX = zeros(p.MAX_PATH_PTS,1); pathY = pathX; pathK = pathX; nPts = 0;

sm.state    = 1;        % start in LANE_FOLLOW
sm.tEntered = 0;
sm.mergeZone = false;

bhv.plannerMode = 1; bhv.targetSpeed = p.bhv.vLane; bhv.lateralMargin = 0.3;
bhv.stateID = 1; bhv.emergencyStop = false; bhv.minTTC = inf; bhv.nNear = 0;

nSteps      = round(T_END / p.dt_vehicle);
replanEvery = round(p.replan.period / p.dt_vehicle);

lat=[]; nReplan=0; planFails=0; totalFails=0;
usedFrenet=0; usedAStar=0; nRetry=0; whichPlanner='-';
minDist=inf; collided=false;
stateLog=[]; ttcLog=[];

logT=zeros(nSteps,1); logX=logT; logY=logT; logV=logT; logCte=logT;
kEnd=0; nTrk=0; preds=struct('px',{},'py',{},'sigma',{},'radius',{});
tid=[]; tpos=[];

STATE_NAMES = {'LANE','UNSTR','YIELD','CREEP','MERGE','ESTOP'};

if ANIMATE
    fh = figure('Name','Step 5 - full pipeline','Position',[50 50 1200 640],'Color','w');
    if MAKE_VIDEO
        vw=VideoWriter(fullfile(fileparts(mfilename('fullpath')),'step5.mp4'),'MPEG-4');
        vw.FrameRate=20; open(vw);
    end
end

%% ---- main loop --------------------------------------------------------
for k = 1:nSteps
    t = (k-1)*p.dt_vehicle;

    if mod(k-1, replanEvery) == 0
        %% --- 1. truth (simulation only) --------------------------------
        agPos = zeros(nAg,2);
        for a = 1:nAg
            agPos(a,:) = agents(a).fn(t);
            d = hypot(agPos(a,1)-state(1), agPos(a,2)-state(2));
            minDist = min(minDist, d);
            if d < agRad(a) + p.veh.width/2, collided = true; end
        end

        %% --- 2. sensors -----------------------------------------------
        [detPos, detCls, nDet] = sensorModel(state, agPos, agRad, agClass, staticObs, p);

        %% --- 3. tracker -----------------------------------------------
        [trk, tid, tpos, ~, tcls, nTrk] = trackerUpdate(trk, detPos, detCls, nDet, p);

        %% --- 4. IMM prediction ----------------------------------------
        preds = struct('px',{},'py',{},'sigma',{},'radius',{});
        liveIDs = zeros(nTrk,1);
        for i = 1:nTrk
            id = tid(i);  liveIDs(i) = id;
            z = tpos(i,:)';
            if isKey(filtMap,id), f = filtMap(id); else, f = immInit(z, p.replan.period, p); end
            f = immStep(f, z, p);
            filtMap(id) = f;
            [px_, py_, sg_] = immPredictAhead(f, p);
            preds(i).px = px_;  preds(i).py = py_;  preds(i).sigma = sg_;
            switch tcls(i)
                case 5, preds(i).radius = 0.6;
                case 6, preds(i).radius = 1.0;
                case 7, preds(i).radius = 1.1;
                case 3, preds(i).radius = 1.5;
                otherwise, preds(i).radius = 1.5;
            end
        end
        ks = cell2mat(keys(filtMap));
        for kk = ks
            if ~any(liveIDs == kk), remove(filtMap, kk); end
        end

        %% --- 5. behaviour layer ---------------------------------------
        % Is there a usable centreline here, and are we near it?
        refOK = state(1) < REF_ENDS_AT;
        if refOK
            dR = min(hypot(ref.x - state(1), ref.y - state(2)));
        else
            dR = inf;
        end
        [bhv, sm] = behaviourLayer(sm, state, preds, nTrk, refOK, dR, planFails, t, p);
        stateLog(end+1) = bhv.stateID;  %#ok<SAGROW>
        ttcLog(end+1)   = min(bhv.minTTC, 10); %#ok<SAGROW>

        %% --- 6. costmap, weighted by the behaviour state --------------
        pC = p;
        pC.cmap.wPred = p.cmap.wPred * bhv.wPredicted;
        cost = costmapDynamic(staticCost, gi, preds, nTrk, pC);
        cost = costmapHysteresis(cost, gi, pathX, pathY, nPts, state(1:2)', p);

        %% --- 7. PLANNER CASCADE ---------------------------------------
        % Try Frenet first when the behaviour layer prefers it and a
        % centreline exists. Fall back to hybrid A* whenever Frenet fails
        % -- which it correctly does when the answer requires leaving the
        % road. The fallback is automatic, so the behaviour layer does not
        % have to get the mode exactly right.
        tic;
        gotPath = false;
        if bhv.plannerMode == 1 && refOK
            [fx, fy, fk, fn, fok, ~] = frenetPlanner(ref, cost, gi, state, bhv, p);
            if fok && fn > 3
                pathX=fx; pathY=fy; pathK=fk; nPts=fn;
                gotPath=true; usedFrenet=usedFrenet+1; whichPlanner='Frenet';
            end
        end
        if ~gotPath
            pPlan = p;
            pPlan.plan.maxExpand = p.replan.maxExpand;
            [rx, ry, ~, nRaw, aok, ~] = hybridAStar(state(1:3)', goalState, cost, gi, pPlan);

            % Stage 3 of the cascade. If A* failed, the hysteresis layer is
            % the most likely culprit -- it is the only thing in the costmap
            % that is there for smoothness rather than safety. Drop it and
            % retry once. Never drop the obstacle or prediction layers.
            if ~aok
                costNoHyst = costmapDynamic(staticCost, gi, preds, nTrk, pC);
                [rx, ry, ~, nRaw, aok, ~] = hybridAStar(state(1:3)', goalState, ...
                                                        costNoHyst, gi, pPlan);
                if aok, nRetry = nRetry + 1; end
            end

            if aok && nRaw > 3
                [sx, sy, sk, m] = smoothPath(rx, ry, nRaw, cost, gi, p);
                if m > 2
                    pathX=sx; pathY=sy; pathK=sk; nPts=m;
                    gotPath=true; usedAStar=usedAStar+1; whichPlanner='A*';
                end
            end
        end
        lat(end+1) = toc*1000; %#ok<SAGROW>
        nReplan = nReplan + 1;

        if gotPath
            planFails = 0;
        else
            planFails  = planFails + 1;
            totalFails = totalFails + 1;
            whichPlanner = 'FAIL';
        end
    end

    %% --- 8. control and vehicle -------------------------------------
    if nPts > 2 && ~bhv.emergencyStop
        [delta, tgtIdx, ~, cte] = purePursuit(state, pathX, pathY, nPts, p);
        kappa = pathK(double(tgtIdx));
        [aCmd, integ, ~] = speedControl(state(4), bhv.targetSpeed, kappa, integ, p.dt_vehicle, p);
        [state, deltaPrev] = bicycleStep(state, delta, aCmd, deltaPrev, p.dt_vehicle, p);
    else
        cte = 0;
        [state, deltaPrev] = bicycleStep(state, 0, p.veh.aEmerg, deltaPrev, p.dt_vehicle, p);
    end

    logT(k)=t; logX(k)=state(1); logY(k)=state(2); logV(k)=state(4); logCte(k)=cte;
    kEnd = k;

    %% --- animation ---------------------------------------------------
    if ANIMATE && mod(k-1,5)==0
        clf;
        imagesc([gi.origin(1) gi.origin(1)+gi.nx*gi.res], ...
                [gi.origin(2) gi.origin(2)+gi.ny*gi.res], cost);
        set(gca,'YDir','normal'); colormap(flipud(gray)); caxis([0 255]); hold on;

        plot(ref.x, ref.y, 'g--', 'LineWidth', 1);          % centreline
        xline(REF_ENDS_AT, 'g:', 'centreline ends');

        if nPts > 2, plot(pathX(1:nPts), pathY(1:nPts), 'c-','LineWidth',2.2); end
        plot(logX(1:kEnd), logY(1:kEnd), 'b-','LineWidth',1.5);

        for a = 1:nAg
            z = agents(a).fn(t);
            th = linspace(0,2*pi,20);
            plot(z(1)+agRad(a)*cos(th), z(2)+agRad(a)*sin(th),'r--','LineWidth',1);
        end
        for i = 1:nTrk
            plot(tpos(i,1), tpos(i,2),'go','MarkerFaceColor','g','MarkerSize',6);
            plot(preds(i).px, preds(i).py,'m:','LineWidth',1.1);
        end

        drawVehicle(state, p);
        plot(goalState(1), goalState(2),'gs','MarkerFaceColor','g','MarkerSize',10);

        axis equal; axis([0 120 0 56]);
        title(sprintf(['t=%5.2f  STATE=%-5s  planner=%-6s  v=%4.1f  ' ...
                       'TTC=%4.1f  near=%d  lat=%5.1f ms'], ...
              t, STATE_NAMES{bhv.stateID}, whichPlanner, state(4), ...
              min(bhv.minTTC,9.9), bhv.nNear, lat(end)));
        xlabel('x [m]'); ylabel('y [m]');
        drawnow limitrate;
        if MAKE_VIDEO, writeVideo(vw, getframe(fh)); end
    end

    if hypot(state(1)-goalState(1), state(2)-goalState(2)) < 2.5
        fprintf('Goal reached at t = %.2f s\n', t);
        break;
    end
end

if ANIMATE && MAKE_VIDEO, close(vw); fprintf('Video written to step5.mp4\n'); end

%% ---- metrics ----------------------------------------------------------
lat = lat(:);
fprintf('\n--- step 5 metrics ---\n');
fprintf('replans             : %6d\n', nReplan);
fprintf('  solved by Frenet  : %6d  (%.0f%%)\n', usedFrenet, 100*usedFrenet/max(nReplan,1));
fprintf('  solved by A*      : %6d  (%.0f%%)\n', usedAStar,  100*usedAStar/max(nReplan,1));
fprintf('  rescued by retry  : %6d  (hysteresis dropped)\n', nRetry);
fprintf('  failed entirely   : %6d\n', totalFails);
fprintf('REPLAN LATENCY mean : %6.1f ms\n', mean(lat));
ls_ = sort(lat);
fprintf('REPLAN LATENCY p95  : %6.1f ms\n', ls_(max(1,ceil(0.95*numel(ls_)))));
fprintf('REPLAN LATENCY max  : %6.1f ms\n', max(lat));
fprintf('min clearance       : %6.2f m\n', minDist);
fprintf('COLLISION           : %s\n', string(collided));
fprintf('mean |cross-track|  : %6.3f m\n', mean(abs(logCte(1:kEnd))));
fprintf('duration            : %6.2f s\n', logT(kEnd));
fprintf('\nbehaviour state occupancy:\n');
for i = 1:6
    n = sum(stateLog==i);
    if n>0, fprintf('  %-6s : %5.1f %%\n', STATE_NAMES{i}, 100*n/numel(stateLog)); end
end

figure('Name','Step 5 - behaviour and timing','Position',[70 70 1000 380],'Color','w');
subplot(1,3,1);
stairs(stateLog,'LineWidth',1.4); ylim([0.5 6.5]);
set(gca,'YTick',1:6,'YTickLabel',STATE_NAMES); grid on;
xlabel('cycle'); title('Behaviour state');
subplot(1,3,2);
plot(ttcLog,'LineWidth',1.2); hold on;
yline(p.bhv.ttcEmergency,'r--','emergency'); yline(p.bhv.ttcYield,'--','yield');
grid on; xlabel('cycle'); ylabel('s'); title('Min time to collision');
subplot(1,3,3);
plot(lat,'.-'); yline(100,'r--','budget'); grid on;
xlabel('cycle'); ylabel('ms'); title('Replan latency');

%% ----------------------------------------------------------------------
function drawVehicle(state, p)
L = p.veh.length; W = p.veh.width;
c = [ 0 -W/2; L -W/2; L W/2; 0 W/2 ]';
R = [cos(state(3)) -sin(state(3)); sin(state(3)) cos(state(3))];
c = R*c + [state(1); state(2)];
fill(c(1,:), c(2,:), 'b','FaceAlpha',0.75,'EdgeColor','b');
end