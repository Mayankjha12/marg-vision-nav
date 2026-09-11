%TEST_STEP2  Plan a path through static obstacles, then drive it.
%
%   Usage:  cd D:\Adaptive_Planner\test
%           test_step2
%
%   What this proves: the planner produces a path the vehicle can actually
%   execute, and the closed loop follows it without hitting anything.
%   makeStubPath is now dead. Nothing hardcodes a route any more.
%
%   What "working" looks like:
%     - a path is found (success = true)
%     - min turn radius comfortably above 3.5 m (the vehicle's limit)
%     - max cell cost on the driven path well below 255
%     - the vehicle reaches the goal

clear; clc; close all;
addpath(fullfile(fileparts(mfilename('fullpath')), '..', 'core'));

p = params();

%% ---- scene: static obstacles ----------------------------------------
% [xmin ymin xmax ymax]. Stand-ins for parked vehicles, carts, a median.
% Step 5 replaces this with actors from a real scenario.
obstacles = [ 20 18  26 30;
              20 34  26 46;
              45  0  52 26;
              45 36  52 60;
              70 20  76 44;
              92  0  98 34;
              30 50  40 56 ];

startState = [  5, 30, 0 ];
goalState  = [112, 30, 0 ];
V_DES      = 8.0;

%% ---- build the costmap ----------------------------------------------
tBuild = tic;
[cost, gi] = costmapLayers(obstacles, p);
tBuild = toc(tBuild);

%% ---- plan ------------------------------------------------------------
tPlan = tic;
[rx, ry, ryaw, nRaw, success, nExp] = hybridAStar(startState, goalState, cost, gi, p);
tPlan = toc(tPlan);

if ~success
    error(['No path found after %d expansions. Either the goal is walled ' ...
           'off, or maxExpand is too low. Plot the costmap and look.'], nExp);
end

%% ---- smooth and resample ---------------------------------------------
tSm = tic;
[sx, sy, sk, nPts] = smoothPath(rx, ry, nRaw, cost, gi, p);
tSm = toc(tSm);

%% ---- drive it --------------------------------------------------------
state = [sx(1); sy(1); atan2(sy(2)-sy(1), sx(2)-sx(1)); 0];
deltaPrev = 0;
integ     = 0;

nSteps = round(p.t_end / p.dt_vehicle);
log = struct('t',zeros(nSteps,1), 'x',zeros(nSteps,1), 'y',zeros(nSteps,1), ...
             'yaw',zeros(nSteps,1), 'v',zeros(nSteps,1), 'delta',zeros(nSteps,1), ...
             'cte',zeros(nSteps,1), 'cellCost',zeros(nSteps,1));
kEnd = 0;

for k = 1:nSteps
    [delta, tgtIdx, ~, cte] = purePursuit(state, sx, sy, nPts, p);
    kappa = sk(double(tgtIdx));
    [aCmd, integ, ~] = speedControl(state(4), V_DES, kappa, integ, p.dt_vehicle, p);
    [state, deltaPrev] = bicycleStep(state, delta, aCmd, deltaPrev, p.dt_vehicle, p);

    ix = floor((state(1) - gi.origin(1))/gi.res) + 1;
    iy = floor((state(2) - gi.origin(2))/gi.res) + 1;
    cc = 0;
    if ix>=1 && ix<=gi.nx && iy>=1 && iy<=gi.ny
        cc = cost(iy, ix);
    end

    log.t(k)=(k-1)*p.dt_vehicle; log.x(k)=state(1); log.y(k)=state(2);
    log.yaw(k)=state(3); log.v(k)=state(4); log.delta(k)=deltaPrev;
    log.cte(k)=cte; log.cellCost(k)=cc;
    kEnd = k;

    if hypot(state(1)-sx(nPts), state(2)-sy(nPts)) < p.goalRadius
        break;
    end
end

f = fieldnames(log);
for i = 1:numel(f), log.(f{i}) = log.(f{i})(1:kEnd); end

%% ---- metrics ---------------------------------------------------------
kMax = max(abs(sk(1:nPts)));
yawRate = [0; diff(unwrap(log.yaw))] / p.dt_vehicle;

fprintf('\n--- step 2 metrics ---\n');
fprintf('costmap build       : %6.1f ms\n', tBuild*1000);
fprintf('PLAN LATENCY        : %6.1f ms   <-- graded metric\n', tPlan*1000);
fprintf('smooth + resample   : %6.1f ms\n', tSm*1000);
fprintf('nodes expanded      : %6d\n', nExp);
fprintf('raw path points     : %6d\n', nRaw);
fprintf('final path points   : %6d\n', nPts);
fprintf('max |curvature|     : %6.3f  (min radius %.1f m, vehicle limit %.1f m)\n', ...
        kMax, 1/max(kMax,1e-6), p.veh.L/tan(p.veh.deltaMax));
fprintf('mean |cross-track|  : %6.3f m\n', mean(abs(log.cte)));
fprintf('max  |cross-track|  : %6.3f m\n', max(abs(log.cte)));
fprintf('MAX CELL COST       : %6.1f / 255   <-- 255 means collision\n', max(log.cellCost));
fprintf('max lateral accel   : %6.2f m/s^2\n', max(abs(log.v .* yawRate)));
fprintf('duration            : %6.2f s\n', log.t(end));
fprintf('goal reached        : %s\n', ...
        string(hypot(log.x(end)-sx(nPts), log.y(end)-sy(nPts)) < p.goalRadius));

%% ---- plots -----------------------------------------------------------
figure('Name','Step 2 - planning + tracking','Position',[60 60 1250 720]);

subplot(2,3,[1 2 4 5]);
imagesc([gi.origin(1) gi.origin(1)+gi.nx*gi.res], ...
        [gi.origin(2) gi.origin(2)+gi.ny*gi.res], cost);
set(gca,'YDir','normal'); colormap(flipud(gray)); hold on;
plot(rx(1:nRaw), ry(1:nRaw), '.-', 'Color',[1 .5 0], 'MarkerSize',8);
plot(sx(1:nPts), sy(1:nPts), 'c-',  'LineWidth', 1.8);
plot(log.x, log.y, 'b-', 'LineWidth', 1.6);
plot(startState(1), startState(2), 'go','MarkerFaceColor','g','MarkerSize',9);
plot(goalState(1),  goalState(2),  'rs','MarkerFaceColor','r','MarkerSize',9);
axis equal tight;
legend('raw A*','smoothed','driven','start','goal','Location','southeast');
title('Costmap, plan and executed path'); xlabel('x [m]'); ylabel('y [m]');

subplot(2,3,3);
plot(log.t, log.cte, 'LineWidth',1.3); grid on;
title('Cross-track error'); ylabel('m');

subplot(2,3,6);
plot(log.t, log.cellCost, 'LineWidth',1.3); hold on;
yline(255,'r--','LETHAL'); grid on;
title('Cell cost under the vehicle'); ylabel('cost'); xlabel('t [s]');
