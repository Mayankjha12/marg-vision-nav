%TEST_STEP3  Moving agents, IMM prediction, replanning at 10 Hz, animated.
%
%   Usage:  cd D:\Adaptive_Planner\test
%           test_step3
%
%   This is the first version that actually REPLANS. Steps 1 and 2 planned
%   once and drove. Here the planner re-runs every 100 ms against a costmap
%   that changed because the agents moved. Watch the cyan path snap to a
%   new route when the pedestrian steps out at t = 6 s and when the cow
%   walks in at t = 9 s. That redraw is the demo video's money shot.
%
%   Set MAKE_VIDEO = true to write an .mp4 you can put in the submission.

clear; clc; close all;
addpath(fullfile(fileparts(mfilename('fullpath')), '..', 'core'));

p = params();

ANIMATE    = true;
MAKE_VIDEO = false;          % true -> writes step3.mp4 in this folder
T_END      = 26.0;

%% ---- static scene ----------------------------------------------------
staticObs = [  0  0 120  4;      % lower verge
               0 52 120 56;      % upper verge
              30 20  36 34;      % parked truck
              78 18  84 32 ];    % building corner

[staticCost, gi] = costmapLayers(staticObs, p);

agents = agentScripts();
nAg    = numel(agents);

goalState = [112, 28, 0];
V_DES     = 8.0;

%% ---- initial vehicle state -------------------------------------------
state = [6; 28; 0; 0];
deltaPrev = 0;
integ     = 0;

filt      = [];
haveFilt  = false(nAg,1);
pathX = zeros(p.MAX_PATH_PTS,1); pathY = pathX; pathK = pathX; nPts = 0;

nSteps    = round(T_END / p.dt_vehicle);
replanEvery = round(p.replan.period / p.dt_vehicle);

lat      = [];
minDist  = inf;
nReplan  = 0;
nFail    = 0;
collided = false;

logT = zeros(nSteps,1); logX = logT; logY = logT; logV = logT; logCte = logT;
kEnd = 0;

%% ---- figure -----------------------------------------------------------
if ANIMATE
    fh = figure('Name','Step 3 - replanning with moving agents', ...
                'Position',[60 60 1150 620], 'Color','w');
    if MAKE_VIDEO
        vw = VideoWriter(fullfile(fileparts(mfilename('fullpath')),'step3.mp4'),'MPEG-4');
        vw.FrameRate = 20;
        open(vw);
    end
end

%% ---- main loop --------------------------------------------------------
for k = 1:nSteps
    t = (k-1)*p.dt_vehicle;

    if mod(k-1, replanEvery) == 0
        %% ===== 10 Hz: agents, prediction, costmap, replan =============
        preds = struct('px',{},'py',{},'sigma',{},'radius',{});
        agPos = zeros(nAg,2);

        for a = 1:nAg
            z = agents(a).fn(t);
            agPos(a,:) = z;

            if ~haveFilt(a)
                filt(a).f = immInit(z, p.replan.period, p); %#ok<SAGROW>
                haveFilt(a) = true;
            end
            filt(a).f = immStep(filt(a).f, z, p);

            [px, py, sg] = immPredictAhead(filt(a).f, p);
            preds(a).px     = px;
            preds(a).py     = py;
            preds(a).sigma  = sg;
            preds(a).radius = agents(a).radius;

            d = hypot(z(1)-state(1), z(2)-state(2));
            minDist = min(minDist, d);
            if d < agents(a).radius + p.veh.width/2
                collided = true;
            end
        end

        cost = costmapDynamic(staticCost, gi, preds, nAg, p);

        % Bias toward the route chosen last cycle. Without this the
        % planner swaps between routes above and below an obstacle on
        % marginal cost differences, and the vehicle -- which has already
        % committed and has a steering rate limit -- ends up following
        % neither properly.
        cost = costmapHysteresis(cost, gi, pathX, pathY, nPts, p);

        % --- replan from the CURRENT vehicle pose ----------------------
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
            % Planning failed. Hold the previous path rather than
            % stopping dead -- a stale path for 100 ms is safer than no
            % path at all. If this persists, the behaviour layer in
            % step 5 will trigger emergency stop.
            nFail = nFail + 1;
        end
    end

    %% ===== 100 Hz: control and vehicle ================================
    if nPts > 2
        [delta, tgtIdx, ~, cte] = purePursuit(state, pathX, pathY, nPts, p);
        kappa = pathK(double(tgtIdx));
        [aCmd, integ, ~] = speedControl(state(4), V_DES, kappa, integ, p.dt_vehicle, p);
        [state, deltaPrev] = bicycleStep(state, delta, aCmd, deltaPrev, p.dt_vehicle, p);
    else
        cte = 0;
        [state, deltaPrev] = bicycleStep(state, 0, p.veh.aMin, deltaPrev, p.dt_vehicle, p);
    end

    logT(k)=t; logX(k)=state(1); logY(k)=state(2); logV(k)=state(4); logCte(k)=cte;
    kEnd = k;

    %% ===== animation ==================================================
    if ANIMATE && mod(k-1, 5) == 0
        clf;
        imagesc([gi.origin(1) gi.origin(1)+gi.nx*gi.res], ...
                [gi.origin(2) gi.origin(2)+gi.ny*gi.res], cost);
        set(gca,'YDir','normal'); colormap(flipud(gray)); caxis([0 255]); hold on;

        if nPts > 2
            plot(pathX(1:nPts), pathY(1:nPts), 'c-', 'LineWidth', 2);
        end
        plot(logX(1:kEnd), logY(1:kEnd), 'b-', 'LineWidth', 1.5);

        for a = 1:nAg
            z = agents(a).fn(t);
            th = linspace(0,2*pi,20);
            fill(z(1)+agents(a).radius*cos(th), z(2)+agents(a).radius*sin(th), ...
                 'r', 'FaceAlpha',0.6, 'EdgeColor','r');
            text(z(1), z(2)+2, agents(a).name, 'Color','r', 'FontSize',8, ...
                 'HorizontalAlignment','center');
            plot(preds(a).px, preds(a).py, 'm:', 'LineWidth',1.2);
        end

        drawVehicle(state, p);
        plot(goalState(1), goalState(2), 'gs','MarkerFaceColor','g','MarkerSize',10);

        axis equal; axis([0 120 0 56]);
        title(sprintf('t = %5.2f s   v = %4.1f m/s   replan = %5.1f ms   min clearance = %4.2f m', ...
              t, state(4), lat(end), minDist));
        xlabel('x [m]'); ylabel('y [m]');
        drawnow limitrate;

        if MAKE_VIDEO
            writeVideo(vw, getframe(fh));
        end
    end

    if hypot(state(1)-goalState(1), state(2)-goalState(2)) < 2.5
        fprintf('Goal reached at t = %.2f s\n', t);
        break;
    end
end

if ANIMATE && MAKE_VIDEO
    close(vw);
    fprintf('Video written to step3.mp4\n');
end

%% ---- metrics ----------------------------------------------------------
lat = lat(:);
fprintf('\n--- step 3 metrics ---\n');
fprintf('replans             : %6d\n', nReplan);
fprintf('planning failures   : %6d\n', nFail);
fprintf('REPLAN LATENCY mean : %6.1f ms\n', mean(lat));
fprintf('REPLAN LATENCY p95  : %6.1f ms\n', prctile(lat,95));
fprintf('REPLAN LATENCY max  : %6.1f ms   <-- must stay under 100\n', max(lat));
fprintf('min clearance       : %6.2f m\n', minDist);
fprintf('COLLISION           : %s\n', string(collided));
fprintf('mean |cross-track|  : %6.3f m\n', mean(abs(logCte(1:kEnd))));
fprintf('duration            : %6.2f s\n', logT(kEnd));

%% ----------------------------------------------------------------------
function drawVehicle(state, p)
L = p.veh.length; W = p.veh.width;
c = [ 0 -W/2; L -W/2; L W/2; 0 W/2 ]';
R = [cos(state(3)) -sin(state(3)); sin(state(3)) cos(state(3))];
c = R*c + [state(1); state(2)];
fill(c(1,:), c(2,:), 'b', 'FaceAlpha',0.75, 'EdgeColor','b');
end