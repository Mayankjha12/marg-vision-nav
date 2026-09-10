function busDefs()
%BUSDEFS  Creates the four interface buses in the base workspace.
%
%   RUN THIS BEFORE OPENING THE SIMULINK MODEL. Nothing works without it.
%   Put it in the model's PreLoadFcn callback so it runs automatically.
%
%   THESE ARE FROZEN. Changing a field breaks every block downstream, so
%   changes go through owner 1 only. Every array is fixed size because
%   Simulink and codegen cannot handle variable-length signals cleanly.
%
%   Units everywhere: metres, seconds, radians. World ENU frame.
%   All poses are world frame, NOT ego frame. Do not mix.

p = params();
N = p.MAX_TRACKS;
H = p.PRED_STEPS;
M = p.MAX_PATH_PTS;

%% =====================================================================
%  TrackList  -  output of the tracker, input to prediction
%  =====================================================================
%  classID: 0 unknown, 1 car, 2 truck/bus, 3 autorickshaw,
%           4 two-wheeler, 5 pedestrian, 6 animal, 7 cart
e = [];
e = addElem(e, 'numTracks', 'uint8',   1);
e = addElem(e, 'valid',     'boolean', [N 1]);
e = addElem(e, 'id',        'uint32',  [N 1]);
e = addElem(e, 'classID',   'uint8',   [N 1]);
e = addElem(e, 'pos',       'double',  [N 2]);   % [x y]
e = addElem(e, 'vel',       'double',  [N 2]);   % [vx vy]
e = addElem(e, 'yaw',       'double',  [N 1]);
e = addElem(e, 'dims',      'double',  [N 2]);   % [length width]
e = addElem(e, 'posCov',    'double',  [N 4]);   % 2x2 flattened row-major
makeBus('TrackList', e);

%% =====================================================================
%  PredictionSet  -  output of prediction, input to costmap
%  =====================================================================
%  posX(i,k) is the predicted x of track i at k*dt_pred seconds ahead.
%  sigma(i,k) is the 1-sigma positional uncertainty and GROWS with k.
%  The costmap inflates each agent by sigma, so an agent we are unsure
%  about is automatically given more room. No special-case code needed.
e = [];
e = addElem(e, 'valid',     'boolean', [N 1]);
e = addElem(e, 'posX',      'double',  [N H]);
e = addElem(e, 'posY',      'double',  [N H]);
e = addElem(e, 'sigma',     'double',  [N H]);
e = addElem(e, 'modeProb',  'double',  [N 3]);   % IMM: [CV CTRV CA]
e = addElem(e, 'crossProb', 'double',  [N 1]);   % pedestrian intent to cross
makeBus('PredictionSet', e);

%% =====================================================================
%  BehaviourCommand  -  output of Stateflow, input to costmap + planner
%  =====================================================================
%  plannerMode: 1 = structured (Frenet lattice)
%               2 = unstructured (hybrid A*)
%  stateID:     1 laneFollow 2 unstructuredTraverse 3 yield
%               4 merge 5 creep 6 emergencyStop
e = [];
e = addElem(e, 'plannerMode',   'uint8',   1);
e = addElem(e, 'stateID',       'uint8',   1);
e = addElem(e, 'targetSpeed',   'double',  1);
e = addElem(e, 'lateralMargin', 'double',  1);
e = addElem(e, 'wObstacle',     'double',  1);   % costmap layer weights
e = addElem(e, 'wPredicted',    'double',  1);
e = addElem(e, 'wSurface',      'double',  1);
e = addElem(e, 'emergencyStop', 'boolean', 1);
makeBus('BehaviourCommand', e);

%% =====================================================================
%  TrajectoryRef  -  output of planner, input to controller
%  =====================================================================
e = [];
e = addElem(e, 'numPts',    'uint8',   1);
e = addElem(e, 'valid',     'boolean', 1);   % false = planner failed, hold
e = addElem(e, 'x',         'double',  [M 1]);
e = addElem(e, 'y',         'double',  [M 1]);
e = addElem(e, 'v',         'double',  [M 1]);   % target speed at each point
e = addElem(e, 'heading',   'double',  [M 1]);
e = addElem(e, 'curvature', 'double',  [M 1]);
e = addElem(e, 'planLatency','double', 1);   % seconds, logged as a metric
makeBus('TrajectoryRef', e);

fprintf('busDefs: created TrackList, PredictionSet, BehaviourCommand, TrajectoryRef\n');
end

% ------------------------------------------------------------------
function e = addElem(e, name, dtype, dims)
el = Simulink.BusElement;
el.Name       = name;
el.Dimensions = dims;
el.DataType   = dtype;
el.Complexity = 'real';
if isempty(e)
    e = el;
else
    e(end+1) = el; %#ok<AGROW>
end
end

% ------------------------------------------------------------------
function makeBus(name, elems)
b = Simulink.Bus;
b.Elements = elems;
assignin('base', name, b);
end
