%TEST_STEP4  Full pipeline: sensors -> tracker -> IMM -> costmap -> plan -> drive.
%
%   Usage:  cd D:\Adaptive_Planner\test
%           test_step4
%
%   The difference from step 3: prediction is no longer fed exact agent
%   positions. It is fed CONFIRMED TRACKS reconstructed from noisy,
%   occluded, intermittent detections. Everything downstream is unchanged
%   -- that is what freezing the interfaces in week one bought us.
%
%   WATCH FOR THIS. When the auto passes behind the parked truck its track
%   is deleted. When it reappears it comes back as a NEW track with a new
%   ID and a fresh IMM that knows nothing about its motion, so for a few
%   hundred milliseconds the prediction is garbage -- precisely as the
%   agent emerges into your path. That is a real autonomous-driving
%   problem, not a bug in this code, and how you handle it is worth a
%   paragraph in the report. The track ID trace printed at the end shows
%   it happening.

clear; clc; close all;
addpath(fullfile(fileparts(mfilename('fullpath')), '..', 'core'));

if exist('multiObjectTracker','class') ~= 8
    error(['multiObjectTracker not found. Automated Driving Toolbox (or ' ...
           'Sensor Fusion and Tracking Toolbox) is not installed or not ' ...
           'licensed. Run "ver" to check what you have.']);
end

p = params();
rng(7);                      % fixed seed: reproducible runs. Change it to
                             % test robustness; see the note at the bottom.

ANIMATE    = true;
MAKE_VIDEO = false;
T_END      = 26.0;

%% ---- scene ------------------------------------------------------------
staticObs = [  0  0 120  4;
               0 52 120 56;
              30 20  36 34;
              78 18  84 32 ];

[staticCost, gi] = costmapLayers(staticObs, p);

agents  = agentScripts();
nAg     = numel(agents);
agRad   = arrayfun(@(a) a.radius,  agents)';
agClass = arrayfun(@(a) a.classID, agents)';

goalState = [112, 28, 0];
V_DES     = 8.0;

%% ---- init -------------------------------------------------------------
tracker = trackerSetup(p);

state = [6; 28; 0; 0];
deltaPrev = 0;  integ = 0;

filtMap = containers.Map('KeyType','double','ValueType','any');   % TrackID -> IMM

pathX = zeros(p.MAX_PATH_PTS,1); pathY = pathX; pathK = pathX; nPts = 0;

nSteps      = round(T_END / p.dt_vehicle);
replanEvery = round(p.replan.period / p.dt_vehicle);

lat = []; nReplan = 0; nFail = 0;
minDist = inf; collided = false;
nDetLog = []; nTrkLog = []; idLog = {};

logT = zeros(nSteps,1); logX = logT; logY = logT; logCte = logT;
kEnd = 0;
trks = [];

if ANIMATE
    fh = figure('Name','Step 4 - sensors, tracking, planning', ...
                'Position',[60 60 1150 620],'Color','w');
    if MAKE_VIDEO
        vw = VideoWriter(fullfile(fileparts(mfilename('fullpath')),'step4.mp4'),'MPEG-4');
        vw.FrameRate = 20; open(vw);
    end
end

%% ---- main loop --------------------------------------------------------
for k = 1:nSteps
    t = (k-1)*p.dt_vehicle;

    if mod(k-1, replanEvery) == 0
        %% ===== 1. true agent positions (simulation only) =============
        agPos = zeros(nAg,2);
        for a = 1:nAg
            agPos(a,:) = agents(a).fn(t);
            d = hypot(agPos(a,1)-state(1), agPos(a,2)-state(2));
            minDist = min(minDist, d);
            if d < agRad(a) + p.veh.width/2, collided = true; end
        end

        %% ===== 2. sensor model: degrade the truth ====================
        [detPos, detCls, nDet] = sensorModel(state, agPos, agRad, agClass, staticObs, p);

        %% ===== 3. tracker: reconstruct objects from the mess =========
        dets = cell(nDet,1);
        R    = diag([0.5, 0.5]);
        for i = 1:nDet
            dets{i} = objectDetection(t, detPos(i,:)', ...
                        'MeasurementNoise', R, ...
                        'SensorIndex', 1, ...
                        'ObjectClassID', detCls(i));
        end
        trks = tracker(dets, t);
        nTrk = numel(trks);

        nDetLog(end+1) = nDet;   %#ok<SAGROW>
        nTrkLog(end+1) = nTrk;   %#ok<SAGROW>
        idLog{end+1}   = [trks.TrackID]; %#ok<SAGROW>

        %% ===== 4. IMM prediction, one filter per confirmed track =====
        preds = struct('px',{},'py',{},'sigma',{},'radius',{});
        liveIDs = zeros(nTrk,1);

        for i = 1:nTrk
            id = trks(i).TrackID;
            liveIDs(i) = id;

            % initcvkf state is [x; vx; y; vy]
            z = [trks(i).State(1); trks(i).State(3)];

            if isKey(filtMap, id)
                f = filtMap(id);
            else
                f = immInit(z, p.replan.period, p);
            end
            f = immStep(f, z, p);
            filtMap(id) = f;

            [px, py, sg] = immPredictAhead(f, p);
            preds(i).px    = px;
            preds(i).py    = py;
            preds(i).sigma = sg;

            % We no longer know the true radius -- that was ground truth.
            % Use the tracker's class if it has one, else assume the
            % largest plausible agent. Assuming small is how you hit things.
            cls = trks(i).ObjectClassID;
            switch cls
                case 5,      preds(i).radius = 0.6;    % pedestrian
                case 6,      preds(i).radius = 1.0;    % animal
                case 7,      preds(i).radius = 1.1;    % cart
                case 3,      preds(i).radius = 1.5;    % autorickshaw
                otherwise,   preds(i).radius = 1.5;    % unknown: assume big
            end
        end

        % drop filters for tracks the tracker has deleted
        ks = cell2mat(keys(filtMap));
        for kk = ks
            if ~any(liveIDs == kk), remove(filtMap, kk); end
        end

        %% ===== 5. costmap and replan =================================
        cost = costmapDynamic(staticCost, gi, preds, nTrk, p);
        cost = costmapHysteresis(cost, gi, pathX, pathY, nPts, p);

        pPlan = p;
        pPlan.plan.maxExpand = p.replan.maxExpand;

        tic;
        [rx, ry, ~, nRaw, ok, ~] = hybridAStar(state(1:3)', goalState, cost, gi, pPlan);
        lat(end+1) = toc*1000; %#ok<SAGROW>
        nReplan = nReplan + 1;

        if ok && nRaw > 3
            [sx, sy, sk, m] = smoothPath(rx, ry, nRaw, cost, gi, p);
            if m > 2
                pathX = sx; pathY = sy; pathK = sk; nPts = m;
            end
        else
            nFail = nFail + 1;
        end
    end

    %% ===== 6. control and vehicle at 100 Hz ==========================
    if nPts > 2
        [delta, tgtIdx, ~, cte] = purePursuit(state, pathX, pathY, nPts, p);
        kappa = pathK(double(tgtIdx));
        [aCmd, integ, ~] = speedControl(state(4), V_DES, kappa, integ, p.dt_vehicle, p);
        [state, deltaPrev] = bicycleStep(state, delta, aCmd, deltaPrev, p.dt_vehicle, p);
    else
        cte = 0;
        [state, deltaPrev] = bicycleStep(state, 0, p.veh.aMin, deltaPrev, p.dt_vehicle, p);
    end

    logT(k)=t; logX(k)=state(1); logY(k)=state(2); logCte(k)=cte;
    kEnd = k;

    %% ===== animation =================================================
    if ANIMATE && mod(k-1,5)==0
        clf;
        imagesc([gi.origin(1) gi.origin(1)+gi.nx*gi.res], ...
                [gi.origin(2) gi.origin(2)+gi.ny*gi.res], cost);
        set(gca,'YDir','normal'); colormap(flipud(gray)); caxis([0 255]); hold on;

        if nPts > 2, plot(pathX(1:nPts), pathY(1:nPts), 'c-','LineWidth',2); end
        plot(logX(1:kEnd), logY(1:kEnd), 'b-','LineWidth',1.5);

        % true agents: hollow. tracks: filled. The gap between them IS
        % the perception error, and it is the thing to look at.
        for a = 1:nAg
            z = agents(a).fn(t);
            th = linspace(0,2*pi,20);
            plot(z(1)+agRad(a)*cos(th), z(2)+agRad(a)*sin(th), 'r--','LineWidth',1);
        end
        if nDet > 0
            plot(detPos(1:nDet,1), detPos(1:nDet,2), 'y.','MarkerSize',12);
        end
        for i = 1:nTrk
            tx = trks(i).State(1); ty = trks(i).State(3);
            plot(tx, ty, 'go','MarkerFaceColor','g','MarkerSize',7);
            text(tx, ty+2.2, sprintf('T%d', trks(i).TrackID), ...
                 'Color',[0 0.6 0],'FontSize',8,'HorizontalAlignment','center');
            plot(preds(i).px, preds(i).py, 'm:','LineWidth',1.1);
        end

        drawVehicle(state, p);
        plot(goalState(1), goalState(2),'gs','MarkerFaceColor','g','MarkerSize',10);

        axis equal; axis([0 120 0 56]);
        title(sprintf(['t=%5.2f s   dets=%d  tracks=%d  replan=%5.1f ms  ' ...
                       'min clearance=%4.2f m'], t, nDet, nTrk, lat(end), minDist));
        xlabel('x [m]'); ylabel('y [m]');
        drawnow limitrate;
        if MAKE_VIDEO, writeVideo(vw, getframe(fh)); end
    end

    if hypot(state(1)-goalState(1), state(2)-goalState(2)) < 2.5
        fprintf('Goal reached at t = %.2f s\n', t);
        break;
    end
end

if ANIMATE && MAKE_VIDEO, close(vw); fprintf('Video written to step4.mp4\n'); end

%% ---- metrics ----------------------------------------------------------
lat = lat(:);
allIDs = unique(cell2mat(cellfun(@(v) v(:)', idLog, 'UniformOutput', false)));

fprintf('\n--- step 4 metrics ---\n');
fprintf('replans             : %6d\n', nReplan);
fprintf('planning failures   : %6d\n', nFail);
fprintf('REPLAN LATENCY mean : %6.1f ms\n', mean(lat));
fprintf('REPLAN LATENCY p95  : %6.1f ms\n', prctile(lat,95));
fprintf('REPLAN LATENCY max  : %6.1f ms\n', max(lat));
fprintf('min clearance       : %6.2f m\n', minDist);
fprintf('COLLISION           : %s\n', string(collided));
fprintf('mean |cross-track|  : %6.3f m\n', mean(abs(logCte(1:kEnd))));
fprintf('duration            : %6.2f s\n', logT(kEnd));
fprintf('\n--- perception quality ---\n');
fprintf('true agents         : %6d\n', nAg);
fprintf('mean detections/scan: %6.2f\n', mean(nDetLog));
fprintf('mean tracks/scan    : %6.2f\n', mean(nTrkLog));
fprintf('DISTINCT TRACK IDs  : %6d   <-- should be near %d\n', numel(allIDs), nAg);
fprintf('  (many more than %d means tracks are fragmenting through\n', nAg);
fprintf('   occlusion and being reborn with new IDs)\n');

figure('Name','Step 4 - tracking quality','Position',[80 80 900 350],'Color','w');
subplot(1,2,1);
plot(nDetLog,'.-'); hold on; plot(nTrkLog,'.-'); yline(nAg,'k--','true');
grid on; legend('detections','confirmed tracks','Location','best');
xlabel('cycle'); ylabel('count'); title('Detections vs confirmed tracks');
subplot(1,2,2);
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
