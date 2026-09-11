function p = params()
%PARAMS  Single source of truth for every constant in the project.
%   Nobody hardcodes a number anywhere else. If you need a constant, add it
%   here. This file is what makes the whole model reproducible.
%
%   Units: metres, seconds, radians, kg. No degrees anywhere in the model.
%   Coordinate frame: world ENU. x east, y north, yaw CCW from +x axis.

%% ---- simulation timing ----------------------------------------------
p.dt_vehicle   = 0.01;    % 100 Hz - vehicle dynamics and controller
p.dt_percep    = 0.10;    %  10 Hz - sensors, tracker, prediction, costmap
p.dt_planner   = 0.10;    %  10 Hz - local planner
p.dt_behaviour = 0.20;    %   5 Hz - Stateflow behaviour layer
p.t_end        = 60.0;    % default sim duration

%% ---- fixed array sizes (codegen needs these frozen) ------------------
p.MAX_TRACKS   = 40;      % max simultaneously tracked agents
p.PRED_STEPS   = 15;      % prediction horizon steps
p.dt_pred      = 0.20;    % prediction step -> 15 * 0.2 = 3.0 s horizon
p.MAX_PATH_PTS = 400;     % max points in a reference trajectory

%% ---- vehicle: small Indian hatchback, roughly a WagonR ---------------
p.veh.L        = 2.45;    % wheelbase
p.veh.width    = 1.60;
p.veh.length   = 3.65;
p.veh.rear2cg  = 1.20;    % rear axle to CG
p.veh.mass     = 1050;

p.veh.deltaMax = deg2rad(35);   % max road wheel angle
p.veh.deltaRate= deg2rad(60);   % max steering rate, rad/s
p.veh.aMax     =  2.0;          % comfortable accel
p.veh.aMin     = -4.0;          % service brake
p.veh.aEmerg   = -7.0;          % emergency brake
p.veh.vMax     = 16.7;          % 60 km/h

% Footprint sample points, forward from the REAR AXLE. The planner's state
% is the rear axle but the body extends 3.65 m ahead of it, so checking
% only the axle lets the planner route the bonnet through obstacles. Three
% discs along the centreline approximate the body; the costmap inflation
% already accounts for the half-width.
p.veh.footOffsets = [0.3, 1.85, 3.4];

%% ---- pure pursuit ----------------------------------------------------
p.pp.Ld_min    = 3.0;     % minimum lookahead
p.pp.Ld_gain   = 0.9;     % Ld = Ld_min + Ld_gain * v
p.pp.Ld_max    = 12.0;

%% ---- longitudinal PI -------------------------------------------------
p.pi.Kp        = 1.20;
p.pi.Ki        = 0.35;
p.pi.iMax      = 2.0;     % integrator clamp (anti-windup)

%% ---- costmap grid ----------------------------------------------------
p.grid.res     = 0.5;           % cell size
p.grid.origin  = [0 0];         % world coords of cell (1,1) lower-left
p.grid.nx      = 240;           % 240 * 0.5 = 120 m wide
p.grid.ny      = 120;           % 120 * 0.5 =  60 m tall
p.grid.margin  = 0.8;           % inflation beyond half vehicle width

%% ---- hybrid A* -------------------------------------------------------
p.plan.searchRes  = 1.0;        % lattice cell for the search (coarser than costmap)
p.plan.yawBins    = 16;         % heading discretisation
p.plan.stepLen    = 2.0;        % arc length per expansion
p.plan.subStep    = 0.4;        % collision-check spacing along the arc
p.plan.nSteer     = 5;          % steering samples per expansion
p.plan.hWeight    = 1.3;        % >1 = weighted A*, faster, slightly suboptimal
p.plan.goalRadius = 2.0;
p.plan.goalYawTol = deg2rad(35);
p.plan.maxExpand  = 60000;
p.plan.maxHeap    = 200000;

% cost weights - these define the vehicle's driving personality
p.plan.wSteer     = 0.6;        % penalise steering: prefer straight
p.plan.wSwitch    = 1.5;        % penalise steering CHANGES: prefer smooth
p.plan.wCost      = 0.15;       % penalise obstacle proximity
%   wCost 0.02 -> path shaves obstacles at cell cost 158/255
%   wCost 0.15 -> holds a wider berth at 86/255, costs 0.07 m tracking
%   Clearance is worth more than tracking precision in a market.

%% ---- smoother --------------------------------------------------------
p.plan.smoothIters = 120;
p.plan.alpha       = 0.35;      % pull toward the original path
p.plan.beta        = 0.25;      % curvature smoothing
p.plan.pathSpacing = 0.5;       % resample spacing - see smoothPath.m

%% ---- IMM prediction ---------------------------------------------------
p.imm.nModels = 3;              % CV, CT, CA
%            CV     CT     CA
p.imm.qa   = [0.20,  0.20,  6.00];   % speed process noise
p.imm.qw   = [1e-5,  0.60,  1e-5];   % turn-rate process noise
p.imm.pStay   = 0.94;           % model stickiness
p.imm.measVar = 0.25;           % measurement variance (m^2)
%   Measured on a turning agent, 3 s prediction error:
%     constant velocity only : 19.10 m
%     this IMM               :  0.59 m

%% ---- dynamic costmap layer -------------------------------------------
p.cmap.wPred     = 200.0;       % peak cost of a predicted-occupancy blob
p.cmap.tau       = 2.5;         % time decay: cost ~ exp(-t/tau)
p.cmap.clearance = 0.8;         % extra margin beyond radius + sigma
p.cmap.reachPad  = 10.0;         % safety buffer on the reachability gate in
%   costmapDynamic. One radius is computed over the FULL 3 s horizon and
%   applied to every step. Predictions outside it are not stamped.
%   Raising it is safer and more conservative; lowering it frees more
%   space in dense traffic. Raised 6 -> 10 after iteration 3 traded
%   collisions for plan-failure rate.
p.cmap.wHyst      = 30.0;       % penalty outside the previous path corridor
p.cmap.hystRadius = 3.0;        % corridor half-width, metres
p.cmap.hystRange  = 35.0;       % apply the penalty only within this range
%   of the vehicle. Applying it map-wide breaks the A* heuristic: uniform
%   cost raises true cost-to-go to ~5.5/m while the Euclidean heuristic
%   still says 1.3/m, the search degenerates to breadth-first, hits
%   maxExpand and fails. Commitment matters for the next few seconds of
%   driving, not for a route 100 m away.
%   Stops homotopy flip-flopping: two routes around an obstacle should
%   not swap on a marginal cost difference. See costmapHysteresis.m

%% ---- replanning -------------------------------------------------------
p.replan.period    = 0.10;      % 10 Hz
p.replan.maxExpand = 9000;     % HARD CAP. A blocked corridor made one
                                % replan take 628 ms in testing, which
                                % blows the 100 ms budget. Cap the search
                                % and fall back rather than overrun.
p.replan.holdOnFail = true;     % keep the previous path if planning fails

%% ---- sensor suite: camera, radar, lidar --------------------------------
%  Three sensors that FAIL DIFFERENTLY. That is the entire justification
%  for carrying all three: the camera's weakness (range accuracy) is the
%  radar's strength, and vice versa.
%
%  s(1) CAMERA - narrow, medium range, great bearing, poor depth, classifies
p.sns(1).mountX     = 2.0;
p.sns(1).fov        = deg2rad(60);
p.sns(1).maxRange   = 60.0;
p.sns(1).pd0        = 0.94;
p.sns(1).pdFade     = 0.6;
p.sns(1).sigRange0  = 0.40;   % depth from one image is hard
p.sns(1).sigRangeK  = 0.020;
p.sns(1).sigCross0  = 0.08;   % bearing is excellent
p.sns(1).sigCrossK  = 0.003;
p.sns(1).faRate     = 0.25;
p.sns(1).classifies = true;
p.sns(1).pClass     = 0.90;

%  s(2) RADAR - wide, long range, great range, poor cross-range, no class
p.sns(2).mountX     = 2.2;
p.sns(2).fov        = deg2rad(90);
p.sns(2).maxRange   = 120.0;
p.sns(2).pd0        = 0.90;
p.sns(2).pdFade     = 0.4;
p.sns(2).sigRange0  = 0.08;   % range is what radar is for
p.sns(2).sigRangeK  = 0.002;
p.sns(2).sigCross0  = 0.35;   % angular resolution limited by antenna size
p.sns(2).sigCrossK  = 0.018;
p.sns(2).faRate     = 0.80;   % throws the most clutter
p.sns(2).classifies = false;
p.sns(2).pClass     = 0;

%  s(3) LIDAR - 360 deg, short range, accurate both axes, coarse class
p.sns(3).mountX     = 1.0;
p.sns(3).fov        = deg2rad(359);
p.sns(3).maxRange   = 40.0;
p.sns(3).pd0        = 0.96;
p.sns(3).pdFade     = 0.5;
p.sns(3).sigRange0  = 0.05;
p.sns(3).sigRangeK  = 0.002;
p.sns(3).sigCross0  = 0.06;
p.sns(3).sigCrossK  = 0.004;
p.sns(3).faRate     = 0.15;
p.sns(3).classifies = true;
p.sns(3).pClass     = 0.55;   % shape only, no colour or texture

%% ---- GNN tracker (built from scratch, no toolbox needed) --------------
p.track.gate         = 16;      % Mahalanobis^2 association gate
p.track.confirmHits  = 3;       % hits before a track is confirmed
p.track.deleteMisses = 5;       % consecutive misses before deletion
p.track.qAccel       = 4.0;     % assumed accel variance, process noise
p.track.measVar      = 0.50;    % measurement variance (m^2)
%
%   MEASURED, 5 seeds, 4 true agents. Distinct confirmed track IDs
%   (lower is better -- means fewer fragmentations and less clutter):
%       delete  confirm  gate | IDs
%            5        2    25 | 25.8
%            5        3    16 |  6.4   <-- chosen
%            8        2    25 | 38.0
%           12        2    25 | 52.0
%           12        3    16 | 14.2
%   Requiring 3 hits instead of 2 cuts spurious tracks fourfold: clutter
%   is uncorrelated between scans so it rarely gets three hits in a row.
%   Raising deleteMisses makes things WORSE -- it keeps false-alarm
%   tracks alive long enough to confirm.

%% ---- Frenet planner ---------------------------------------------------
p.fren.horizon    = 25.0;       % planning distance along the road
p.fren.spacing    = 0.5;        % output point spacing (matches smoothPath)
p.fren.nOffsets   = 7;          % lattice width
p.fren.maxOffset  = 3.0;        % +/- metres from the centreline
p.fren.wOffset    = 1.0;        % prefer the centreline (lane discipline)
p.fren.wJerk      = 2.0;        % prefer smooth lateral motion
p.fren.wCost      = 0.02;       % prefer clearance
%   MEASURED: 1.4 ms per plan, 7/8 start poses solved on a structured road
%   with in-lane obstacles. Widening maxOffset from 3 to 9 m did NOT help
%   (still 7/8) -- the failure needs to leave the road entirely, which is
%   hybrid A*'s job. Hence the cascade rather than a hard mode switch.
%   Hybrid A* on the same 25 m horizon: 0.8-2.2 ms, 25-60 nodes.
%   Hybrid A* in a dense unstructured field: 852 ms, 28779 nodes -- which
%   is exactly why p.replan.maxExpand exists.

%% ---- behaviour layer --------------------------------------------------
p.bhv.minDwell       = 0.6;     % min seconds in a state before switching
p.bhv.ttcEmergency   = 1.8;     % TTC below this -> emergency stop
%   Was 1.2 s. Braking from 10 m/s at -7 m/s^2 takes 1.43 s and 7.1 m, so
%   1.2 s left no margin at all and the stop began too late to help.
p.bhv.ttcClear       = 3.2;     % TTC above this -> recover from stop
p.bhv.ttcYield       = 4.0;     % TTC below this + crossing -> yield
p.bhv.failsToStop    = 3;       % consecutive plan failures -> stop
p.bhv.estopTimeout   = 2.5;     % max seconds held in ESTOP on plan failure
%   alone. Without this, entering ESTOP because the planner failed and
%   only leaving when it succeeds is a deadlock: the vehicle stops and
%   never moves again. A genuine TTC threat still holds ESTOP regardless.
p.bhv.densityRadius  = 15.0;    % radius for the agent-density count
p.bhv.creepDensity   = 3;       % agents within that radius -> creep
p.bhv.corridorLen    = 20.0;    % forward corridor for crossing detection
p.bhv.corridorHalfW  = 3.0;
p.bhv.refCaptureDist = 4.0;     % within this of the centreline -> lane follow

p.bhv.vLane          = 10.0;    % target speeds per state, m/s
p.bhv.vUnstructured  = 6.0;
p.bhv.vMerge         = 6.0;
p.bhv.vYield         = 3.0;
p.bhv.vCreep         = 2.0;

%% ---- goal / termination ---------------------------------------------
p.goalRadius   = 2.0;

%% ---- quarter-car model, used later for the pothole cost layer --------
%  Values are typical for a small hatchback. Owner 3 tunes these.
p.qc.ms        = 260;     % sprung mass per corner
p.qc.mu        = 35;      % unsprung mass per corner
p.qc.ks        = 22000;   % suspension stiffness
p.qc.cs        = 1500;    % damper rate
p.qc.kt        = 190000;  % tyre stiffness
p.qc.a_comfort = 1.5;     % m/s^2 weighted RMS, comfort threshold

end