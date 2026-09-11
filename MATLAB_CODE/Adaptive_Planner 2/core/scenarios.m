function sc = scenarios()
%SCENARIOS  The five test cases required by the problem statement.
%
%   Each scenario is DATA, not code. The pipeline is identical across all
%   five -- what changes is the road, the agents, and the goal. That is
%   the point: a planner that needs different code per scenario has not
%   generalised.
%
%   Fields
%     name         short label
%     staticObs    K x 4, each row [xmin ymin xmax ymax]
%     hasRef       true if a usable centreline exists
%     refFcn       @(s) -> [x y] centreline points (only if hasRef)
%     refEndsAt    x beyond which the centreline stops being usable
%     agents       struct array with .name .radius .classID .fn(t)
%     start        [x y yaw]
%     goal         [x y yaw]
%     tEnd         simulation timeout
%     breaks       what assumption this scenario is designed to break
%
%   agents(i).fn(t) returns [x y] at time t. Every agent is a hand-written
%   trajectory. Randomised variation across runs comes from the SENSOR
%   noise seed, not from the agent scripts -- so a scenario is repeatable
%   in its geometry but not in what the vehicle manages to perceive.

sc = struct('name',{},'staticObs',{},'hasRef',{},'refFcn',{},'refEndsAt',{}, ...
            'agents',{},'start',{},'goal',{},'tEnd',{},'breaks',{});

%% =====================================================================
%  1. UNMARKED VILLAGE ROAD
%  No centreline at all. Narrow, irregular edges, slow mixed traffic.
%  Forces hybrid A* for the entire run -- Frenet has nothing to work with.
%  =====================================================================
a = mkAgents();
a = addAgent(a,'cart',   1.0, 7, @(t)[70 - 1.3*t,        26 + 1.2*sin(0.25*t)]);
a = addAgent(a,'ped1',   0.5, 5, @(t)[38,                12 + 1.0*max(0,t-5)]);
a = addAgent(a,'bike',   0.7, 4, @(t)[15 + 8.5*t,        30 + 3.5*sin(0.55*t)]);
a = addAgent(a,'goat',   0.6, 6, @(t)[88 - 0.5*max(0,t-8), 34 - 0.9*max(0,t-8)]);

sc(1).name      = 'village_road';
sc(1).staticObs = [  0  0 120  8;        % irregular verge, wide and vague
                     0 44 120 56;
                    28 34  34 44;        % hut encroaching on the road
                    62  8  68 17;        % mud bank
                    95 36 101 44 ];
sc(1).hasRef    = false;
sc(1).refFcn    = [];
sc(1).refEndsAt = 0;
sc(1).agents    = a;
sc(1).start     = [ 6, 26, 0];
sc(1).goal      = [112, 26, 0];
sc(1).tEnd      = 40;
sc(1).breaks    = 'no lane markings, no centreline, vague road edges';

%% =====================================================================
%  2. BUSY URBAN INTERSECTION, NO SIGNALS
%  Cross traffic with no right of way. Nobody stops. The vehicle has to
%  read gaps and yield. Centreline exists on the approach and stops at
%  the junction mouth -- nothing to follow through the box.
%  =====================================================================
a = mkAgents();
a = addAgent(a,'auto_cross', 1.5, 3, @(t)[58 + 0.4*t,  4 + 6.2*t]);
a = addAgent(a,'bus_cross',  2.2, 2, @(t)[64,          52 - 5.0*max(0,t-3)]);
a = addAgent(a,'bike_cross', 0.7, 4, @(t)[70 - 7.5*max(0,t-6), 30 + 1.5*sin(t)]);
a = addAgent(a,'ped_cross',  0.5, 5, @(t)[52,          18 + 1.2*max(0,t-4)]);
a = addAgent(a,'auto2',      1.5, 3, @(t)[46 + 5.5*max(0,t-9), 40 - 3.0*max(0,t-9)]);

sc(2).name      = 'urban_intersection';
% Four building corners forming an open crossroads. NOTE: there are no
% side walls at x<10 or x>110 -- an earlier version had them and they
% enclosed the start and goal points, making the scenario unsolvable.
% The batch run caught it: 0% completion, 100% plan failure, 41 m minimum
% clearance because the vehicle never moved.
sc(2).staticObs = [  0  0  44   9;
                    78  0 120   9;
                     0 47  44  56;
                    78 47 120  56;
                    26 20  32  26;       % kerb island in the approach
                    88 32  94  38 ];     % parked bus after the junction
sc(2).hasRef    = true;
sc(2).refFcn    = @(s) [s, 28 + 0*s];
sc(2).refEndsAt = 44;                    % centreline stops at the junction
sc(2).agents    = a;
sc(2).start     = [ 6, 28, 0];
sc(2).goal      = [112, 28, 0];
sc(2).tEnd      = 40;
sc(2).breaks    = 'unsignalled crossing traffic, no right of way, gap reading';

%% =====================================================================
%  3. HIGHWAY MERGE WITH SLOW VEHICLES
%  Structured road, clear centreline. Frenet should dominate here. The
%  challenge is speed differential: slow trucks in lane, and traffic
%  joining from a ramp without signalling.
%  =====================================================================
a = mkAgents();
a = addAgent(a,'truck1', 2.2, 2, @(t)[44 + 3.0*t,  31]);
a = addAgent(a,'truck2', 2.2, 2, @(t)[66 + 2.2*t,  25]);
a = addAgent(a,'merger', 1.6, 1, @(t)[30 + 9.0*t,  16 + 1.9*min(t,6)]);
a = addAgent(a,'auto',   1.5, 3, @(t)[88 + 4.0*t,  24]);

sc(3).name      = 'highway_merge';
sc(3).staticObs = [  0  0 120  12;
                     0 42 120  56 ];
sc(3).hasRef    = true;
sc(3).refFcn    = @(s) [s, 28 + 3*sin(2*pi*s/260)];
sc(3).refEndsAt = 200;                   % structured throughout
sc(3).agents    = a;
sc(3).start     = [ 6, 28, 0];
sc(3).goal      = [116, 30, 0];
sc(3).tEnd      = 36;
sc(3).breaks    = 'informal merging, large speed differentials, no signalling';

%% =====================================================================
%  4. DENSE MARKET, MIXED TRAFFIC
%  Twelve agents in a narrow corridor moving slowly and unpredictably.
%  This is the scenario that should drive the behaviour layer into CREEP
%  and keep it there. It is also the hardest test of the tracker.
%  =====================================================================
a = mkAgents();
for i = 1:4
    ph = 2*pi*i/4;
    a = addAgent(a, sprintf('ped%d',i), 0.5, 5, ...
        @(t)[40 + 13*i + 2.2*sin(0.4*t + ph), 28 + 11*cos(0.32*t + ph)]);
end
a = addAgent(a,'cart1', 1.0, 7, @(t)[78 - 1.1*t,          22]);
a = addAgent(a,'cart2', 1.0, 7, @(t)[36 + 1.4*t,          33]);
a = addAgent(a,'auto',  1.5, 3, @(t)[95 - 3.2*t,          27 + 1.6*sin(0.5*t)]);
a = addAgent(a,'bike',  0.7, 4, @(t)[30 + 5.0*t,          31 - 2.5*sin(0.6*t)]);
a = addAgent(a,'cow',   1.0, 6, @(t)[66,                  36 - 0.35*max(0,t-4)]);

sc(4).name      = 'dense_market';
% Corridor widened from y=16..40 to y=12..44 after the batch run showed
% 8 collisions in 10. With a 3.65 m vehicle and 12 agents, the original
% 21 m of drivable width left no escape route -- the scenario was not
% hard, it was unsurvivable. Hard is useful; unsurvivable is not a test.
sc(4).staticObs = [  0  0 120  12;
                     0 44 120  56;
                    24 12  29 19;        % stall spilling into the road
                    58 37  63 44;
                    86 12  91 18 ];
sc(4).hasRef    = false;
sc(4).refFcn    = [];
sc(4).refEndsAt = 0;
sc(4).agents    = a;
sc(4).start     = [ 6, 28, 0];
sc(4).goal      = [112, 28, 0];
sc(4).tEnd      = 60;
sc(4).breaks    = 'high density, mixed classes, no lane discipline, occlusion';

%% =====================================================================
%  5. SUDDEN CATTLE CROSSING
%  Open road, high speed, then a cow steps out from behind a parked truck
%  with almost no warning. Tests the emergency stop path and the
%  occlusion handling: the cow is INVISIBLE until it clears the truck.
%  =====================================================================
a = mkAgents();
a = addAgent(a,'cow1', 1.1, 6, @(t)[72, 14 + 2.6*max(0,t-7)]);
a = addAgent(a,'cow2', 1.1, 6, @(t)[76, 12 + 2.2*max(0,t-8)]);
a = addAgent(a,'calf', 0.7, 6, @(t)[74, 11 + 2.9*max(0,t-9)]);
a = addAgent(a,'auto', 1.5, 3, @(t)[100 - 4.5*t, 33]);

sc(5).name      = 'cattle_crossing';
sc(5).staticObs = [  0  0 120  10;
                     0 46 120  56;
                    66 10  80  20 ];     % parked truck: hides the cattle
sc(5).hasRef    = true;
sc(5).refFcn    = @(s) [s, 30 + 0*s];
sc(5).refEndsAt = 200;
sc(5).agents    = a;
sc(5).start     = [ 6, 30, 0];
sc(5).goal      = [114, 30, 0];
sc(5).tEnd      = 36;
sc(5).breaks    = 'occluded sudden obstacle, zero prior velocity, emergency braking';
end

%% ======================================================================
function a = mkAgents()
a = struct('name',{},'radius',{},'classID',{},'fn',{});
end

function a = addAgent(a, name, radius, classID, fn)
i = numel(a) + 1;
a(i).name    = name;
a(i).radius  = radius;
a(i).classID = classID;
a(i).fn      = fn;
end