function [detPos, detClass, nDet] = sensorModel(egoState, agPos, agRadius, agClass, staticObs, p)
%SENSORMODEL  Turns known agent positions into realistic noisy detections.
%
%   THIS IS THE POINT OF STEP 4. Until now the prediction block was fed
%   exact positions. That makes the whole system look far better than it
%   is. A real sensor cannot see behind a truck, has a limited cone and
%   range, reports positions a few centimetres off, misses objects at
%   random, and occasionally reports something that is not there.
%
%   Note what this function does NOT do: it does not render pixels and it
%   does not run a neural network. Inside a simulation the actor states
%   are already known exactly, so a detector would be recovering
%   information we already have while costing 200 ms. We degrade the
%   ground truth directly instead, which models the same error sources at
%   a fraction of the cost. The CNN detector is validated separately on
%   real IDD footage -- a different deliverable, not part of this loop.
%
%   OUTPUT
%   detPos    nDet x 2 noisy positions, world frame
%   detClass  nDet x 1 class id (0 for false alarms)
%   nDet      how many. NOT the same as the number of agents -- some are
%             missed, some are invented. That mismatch is the whole point.

maxDet = p.MAX_TRACKS;
detPos   = zeros(maxDet, 2);
detClass = zeros(maxDet, 1);
nDet     = 0;

ex = egoState(1);  ey = egoState(2);  eyaw = egoState(3);

% Sensor sits at the front bumper, not the rear axle. Getting this wrong
% gives a small constant bias that is maddening to find later.
sx = ex + p.sensor.mountX * cos(eyaw);
sy = ey + p.sensor.mountX * sin(eyaw);

nAg = size(agPos, 1);

%% ---- real detections ---------------------------------------------------
for a = 1:nAg
    dx = agPos(a,1) - sx;
    dy = agPos(a,2) - sy;
    rng = hypot(dx, dy);

    % --- range gate ---
    if rng > p.sensor.maxRange || rng < 0.5
        continue;
    end

    % --- field of view ---
    bearing = wrapToPiLocal(atan2(dy, dx) - eyaw);
    if abs(bearing) > p.sensor.fov/2
        continue;
    end

    % --- occlusion by static obstacles ---
    if segmentHitsAnyRect(sx, sy, agPos(a,1), agPos(a,2), staticObs)
        continue;
    end

    % --- occlusion by other agents ---
    occluded = false;
    for b = 1:nAg
        if b == a, continue; end
        db = hypot(agPos(b,1)-sx, agPos(b,2)-sy);
        if db >= rng, continue; end          % behind the target, irrelevant
        if pointToSegDist(agPos(b,1), agPos(b,2), sx, sy, agPos(a,1), agPos(a,2)) < agRadius(b)
            occluded = true;
            break;
        end
    end
    if occluded, continue; end

    % --- random miss ---
    % Detection probability falls with range. A pedestrian at 70 m is
    % genuinely harder to see than one at 10 m.
    pd = p.sensor.pd0 * (1 - 0.5*rng/p.sensor.maxRange);
    if rand > pd
        continue;
    end

    % --- measurement noise ---
    % Range error grows with distance, cross-range error grows faster.
    % That anisotropy is real and it is why a distant object's track
    % wobbles sideways more than it wobbles in depth.
    sigR = p.sensor.sigRange0 + p.sensor.sigRangeK * rng;
    sigC = p.sensor.sigCross0 + p.sensor.sigCrossK * rng;
    nR = sigR * randn;
    nC = sigC * randn;
    ux = dx/rng;  uy = dy/rng;              % unit along range
    px_ = -uy;    py_ = ux;                 % unit across range

    nDet = nDet + 1;
    detPos(nDet,1) = agPos(a,1) + nR*ux + nC*px_;
    detPos(nDet,2) = agPos(a,2) + nR*uy + nC*py_;
    detClass(nDet) = agClass(a);

    if nDet >= maxDet, return; end
end

%% ---- false alarms ------------------------------------------------------
% Clutter. Radar returns off a manhole cover, a lidar return off exhaust.
% These are what force the tracker to have a confirmation threshold
% instead of trusting every detection immediately.
% Poisson sample by Knuth's method. poissrnd() needs Statistics and
% Machine Learning Toolbox; this needs nothing. Multiply uniforms until
% the product falls below exp(-lambda); the count is Poisson distributed.
nFA = 0;
Lp  = exp(-p.sensor.faRate);
prod_ = rand;
while prod_ > Lp
    nFA   = nFA + 1;
    prod_ = prod_ * rand;
end
for i = 1:nFA
    if nDet >= maxDet, break; end
    r  = 0.5 + rand * (p.sensor.maxRange - 0.5);
    br = (rand - 0.5) * p.sensor.fov;
    nDet = nDet + 1;
    detPos(nDet,1) = sx + r*cos(eyaw + br);
    detPos(nDet,2) = sy + r*sin(eyaw + br);
    detClass(nDet) = 0;                      % unknown class
end
end

%% ======================================================================
function hit = segmentHitsAnyRect(x1, y1, x2, y2, rects)
hit = false;
for k = 1:size(rects,1)
    if segRect(x1,y1,x2,y2, rects(k,1),rects(k,2),rects(k,3),rects(k,4))
        hit = true;
        return;
    end
end
end

function h = segRect(x1,y1,x2,y2, xmin,ymin,xmax,ymax)
% Liang-Barsky segment vs axis-aligned rectangle.
h = false;
dx = x2-x1;  dy = y2-y1;
t0 = 0;  t1 = 1;
pq = [-dx, x1-xmin; dx, xmax-x1; -dy, y1-ymin; dy, ymax-y1];
for i = 1:4
    pp = pq(i,1);  qq = pq(i,2);
    if abs(pp) < 1e-12
        if qq < 0, return; end               % parallel and outside
    else
        r = qq/pp;
        if pp < 0
            if r > t1, return; end
            if r > t0, t0 = r; end
        else
            if r < t0, return; end
            if r < t1, t1 = r; end
        end
    end
end
h = true;
end

function d = pointToSegDist(px, py, x1, y1, x2, y2)
ex = x2-x1;  ey = y2-y1;
L2 = ex*ex + ey*ey;
if L2 < 1e-12
    d = hypot(px-x1, py-y1);
    return;
end
t = ((px-x1)*ex + (py-y1)*ey) / L2;
t = max(0, min(1, t));
d = hypot(px - (x1+t*ex), py - (y1+t*ey));
end

function a = wrapToPiLocal(a)
a = mod(a + pi, 2*pi) - pi;
end
