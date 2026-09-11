%TEST_STEP1  Closed-loop vehicle + controller, no Simulink required.
%
%   Run this first. If this works, your algorithms are right and any
%   later problem is a Simulink wiring problem -- which is a much easier
%   thing to debug when you already know the maths is sound.
%
%   Usage:  addpath('../core'); test_step1
%
%   What "working" looks like:
%     - cross-track error settles below ~0.3 m on the straight
%     - speed drops before each corner, not during it
%     - steering trace is smooth, no buzzing at the limits
%     - vehicle reaches the goal

clear; clc; close all;
addpath(fullfile(fileparts(mfilename('fullpath')), '..', 'core'));

p     = params();
SHAPE = 'tight';        % try 'sweep', 'tight', 'chicane'
V_DES = 10.0;           % m/s requested by the (not yet built) behaviour layer

[pathX, pathY, pathK, numPts] = makeStubPath(p, SHAPE);

%% ---- initial condition ----------------------------------------------
% Deliberately offset 2 m laterally and 10 deg off heading. Starting
% perfectly on the path hides controller bugs.
state = [ pathX(1);
          pathY(1) - 2.0;
          deg2rad(10);
          0.0 ];

deltaPrev = 0;
integ     = 0;

nSteps = round(p.t_end / p.dt_vehicle);
log = struct( ...
    't',      zeros(nSteps,1), ...
    'x',      zeros(nSteps,1), ...
    'y',      zeros(nSteps,1), ...
    'yaw',    zeros(nSteps,1), ...
    'v',      zeros(nSteps,1), ...
    'delta',  zeros(nSteps,1), ...
    'a',      zeros(nSteps,1), ...
    'cte',    zeros(nSteps,1), ...
    'vTgt',   zeros(nSteps,1), ...
    'Ld',     zeros(nSteps,1));

goalX = pathX(numPts);
goalY = pathY(numPts);
kSteps = 0;

%% ---- main loop -------------------------------------------------------
for k = 1:nSteps
    t = (k-1) * p.dt_vehicle;

    % lateral
    [delta, tgtIdx, Ld, cte] = purePursuit(state, pathX, pathY, numPts, p);

    % longitudinal: curvature at the lookahead point, not at the vehicle.
    % Using curvature at the vehicle means braking starts inside the
    % corner, which is exactly one corner too late.
    kappa = pathK(double(tgtIdx));
    [aCmd, integ, vTgt] = speedControl(state(4), V_DES, kappa, integ, p.dt_vehicle, p);

    % plant
    [state, deltaPrev] = bicycleStep(state, delta, aCmd, deltaPrev, p.dt_vehicle, p);

    log.t(k)     = t;
    log.x(k)     = state(1);
    log.y(k)     = state(2);
    log.yaw(k)   = state(3);
    log.v(k)     = state(4);
    log.delta(k) = deltaPrev;
    log.a(k)     = aCmd;
    log.cte(k)   = cte;
    log.vTgt(k)  = vTgt;
    log.Ld(k)    = Ld;
    kSteps = k;

    if hypot(state(1)-goalX, state(2)-goalY) < p.goalRadius
        fprintf('Goal reached at t = %.2f s\n', t);
        break;
    end
end

f = fieldnames(log);
for i = 1:numel(f)
    log.(f{i}) = log.(f{i})(1:kSteps);
end

%% ---- metrics ---------------------------------------------------------
fprintf('\n--- step 1 metrics ---\n');
fprintf('duration            : %6.2f s\n',   log.t(end));
fprintf('mean |cross-track|  : %6.3f m\n',   mean(abs(log.cte)));
fprintf('max  |cross-track|  : %6.3f m\n',   max(abs(log.cte)));
fprintf('max  |steer|        : %6.2f deg\n', rad2deg(max(abs(log.delta))));
fprintf('max steer rate      : %6.2f deg/s\n', ...
        rad2deg(max(abs(diff(log.delta)))/p.dt_vehicle));
yawRate = [0; diff(unwrap(log.yaw))] / p.dt_vehicle;
aLat    = log.v .* yawRate;
fprintf('max lateral accel   : %6.2f m/s^2\n', max(abs(aLat)));
fprintf('goal reached        : %s\n', ...
        string(hypot(log.x(end)-goalX, log.y(end)-goalY) < p.goalRadius));

%% ---- plots -----------------------------------------------------------
figure('Name','Step 1 - closed loop','Position',[80 80 1180 720]);

subplot(2,3,[1 4]);
plot(pathX(1:numPts), pathY(1:numPts), 'k--', 'LineWidth', 1.2); hold on;
plot(log.x, log.y, 'b-', 'LineWidth', 1.6);
plot(log.x(1), log.y(1), 'go', 'MarkerFaceColor','g');
plot(goalX, goalY, 'rs', 'MarkerFaceColor','r');
axis equal; grid on;
legend('reference','vehicle','start','goal','Location','best');
title('Path tracking'); xlabel('x [m]'); ylabel('y [m]');

subplot(2,3,2);
plot(log.t, log.cte, 'LineWidth', 1.3); grid on;
title('Cross-track error'); ylabel('m');

subplot(2,3,3);
plot(log.t, log.v, 'LineWidth', 1.3); hold on;
plot(log.t, log.vTgt, '--', 'LineWidth', 1.1); grid on;
legend('actual','target','Location','best');
title('Speed'); ylabel('m/s');

subplot(2,3,5);
plot(log.t, rad2deg(log.delta), 'LineWidth', 1.3); grid on;
title('Steer angle'); ylabel('deg'); xlabel('t [s]');

subplot(2,3,6);
plot(log.t, log.a, 'LineWidth', 1.3); hold on;
plot(log.t, log.Ld, '--', 'LineWidth', 1.1); grid on;
legend('accel [m/s^2]','lookahead [m]','Location','best');
title('Accel and lookahead'); xlabel('t [s]');
