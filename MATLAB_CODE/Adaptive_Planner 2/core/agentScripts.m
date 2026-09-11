function agents = agentScripts()
%AGENTSCRIPTS  Scripted moving agents for step 3.
%
%   THESE ARE TEST CASES, NOT SCENARIOS. Four hand-written behaviours
%   chosen because each one breaks a different assumption that a
%   Western-road planner would make. The real Indian scenarios are Part 2
%   and come from RoadRunner.
%
%   Each agent: .name .radius .classID .fn(t) -> [x y]
%   classID matches the TrackList convention in busDefs.m:
%     3 autorickshaw, 5 pedestrian, 6 animal, 7 cart

agents = struct('name',{},'radius',{},'classID',{},'fn',{});

% --- 1. autorickshaw cutting diagonally across, no signal ---------------
% Breaks: lane-following assumption. It leaves its lane mid-manoeuvre.
% This is the agent the IMM's turning model exists for.
agents(1).name    = 'auto';
agents(1).radius  = 1.4;
agents(1).classID = 3;
agents(1).fn      = @(t) [20 + 7*min(t,3) + 5.3*max(0,t-3), ...
                          12 + 5.4*max(0, t-3)];

% --- 2. pedestrian standing at the kerb, then stepping out at t = 6 -----
% Breaks: constant-velocity prediction. Velocity is exactly zero right up
% until it isn't. No kinematic filter can predict this from motion alone,
% which is why crossProb exists as a separate field in PredictionSet.
% What the filter CAN do is react within one or two updates, and the
% sigma spike from model disagreement makes the planner back off fast.
agents(2).name    = 'ped';
agents(2).radius  = 0.5;
agents(2).classID = 5;
agents(2).fn      = @(t) [58, 8.5 + 1.3*max(0, t-6)];

% --- 3. slow cart moving against the flow -------------------------------
% Breaks: the assumption that traffic on your side moves your way.
agents(3).name    = 'cart';
agents(3).radius  = 1.0;
agents(3).classID = 7;
agents(3).fn      = @(t) [95 - 1.6*t, 24];

% --- 4. cattle wandering in from the verge at t = 9 ---------------------
% Breaks: the assumption that obstacles appear at road edges and stay
% there. Slow, unpredictable, and enters the carriageway.
agents(4).name    = 'cow';
agents(4).radius  = 0.9;
agents(4).classID = 6;
agents(4).fn      = @(t) [70 - 0.4*max(0,t-9), 47 - 1.1*max(0,t-9)];
end
