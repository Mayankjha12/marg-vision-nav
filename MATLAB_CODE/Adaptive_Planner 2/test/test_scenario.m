%TEST_SCENARIO  Watch ONE scenario run, with animation.
%
%   Usage:  cd D:\Adaptive_Planner\test
%           test_scenario
%
%   Change PICK below to choose which of the five to watch:
%     1 village_road         no centreline at all, hybrid A* throughout
%     2 urban_intersection   unsignalled cross traffic, gap reading
%     3 highway_merge        structured, Frenet should dominate
%     4 dense_market         12 agents, should drive the layer into CREEP
%     5 cattle_crossing      cattle emerge from behind a parked truck
%
%   PRETTY = true uses the presentation renderer (road surface, sensor
%   cones, class-coloured agents, HUD panel) -- use this for the video.
%   PRETTY = false gives the raw costmap view, which is better for
%   debugging because you can see the cost field directly.
%
%   To produce the submission footage: set MAKE_VIDEO = true and PRETTY =
%   true, then run once for each PICK from 1 to 5. Five mp4 files appear
%   in this folder, named after the scenarios.

clear; clc; close all;
addpath(fullfile(fileparts(mfilename('fullpath')), '..', 'core'));

PICK       = 1;
SEED       = 7;
MAKE_VIDEO = true;
PRETTY     = true;    % presentation renderer. false = debug costmap view.

p  = params();
sc = scenarios();
s  = sc(PICK);

fprintf('Scenario %d: %s\n', PICK, s.name);
fprintf('  designed to break: %s\n', s.breaks);
fprintf('  agents: %d   centreline: %s\n\n', numel(s.agents), string(s.hasRef));

opts.animate = true;
opts.video   = MAKE_VIDEO;
opts.pretty  = PRETTY;
opts.name    = fullfile(fileparts(mfilename('fullpath')), s.name);

res = runScenario(s, SEED, opts, p);

fprintf('\n--- %s (seed %d) ---\n', res.scenario, res.seed);
fprintf('COMPLETED           : %s\n',      string(res.completed));
fprintf('  reached goal      : %s\n',      string(res.reached));
fprintf('  collision         : %s\n',      string(res.collided));
fprintf('  static hits       : %6d   (vehicle body inside an obstacle)\n', res.staticHits);
fprintf('duration            : %6.2f s\n', res.duration);
fprintf('mean speed          : %6.2f m/s\n', res.meanSpeed);
fprintf('min clearance       : %6.2f m\n', res.minClear);
fprintf('max cell cost       : %6.1f / 255\n', res.maxCell);
fprintf('replans             : %6d\n',     res.replans);
fprintf('  Frenet / A* / fail: %5.0f%% / %3.0f%% / %3.0f%%\n', ...
        res.frenetPct, res.astarPct, res.failPct);
fprintf('  rescued by retry  : %6d\n',     res.nRetry);
fprintf('latency mean/p95/max: %5.1f / %5.1f / %5.1f ms\n', ...
        res.latMean, res.latP95, res.latMax);
fprintf('perception          : %.2f dets, %.2f tracks per scan (%d true agents)\n', ...
        res.meanDets, res.meanTracks, res.nAgents);
fprintf('distinct track IDs  : %6d\n',     res.distinctID);
fprintf('time in CREEP       : %6.1f %%\n', res.pctCreep);
fprintf('time in ESTOP       : %6.1f %%\n', res.pctEstop);

if MAKE_VIDEO
    fprintf('\nVideo written to %s.mp4\n', opts.name);
end