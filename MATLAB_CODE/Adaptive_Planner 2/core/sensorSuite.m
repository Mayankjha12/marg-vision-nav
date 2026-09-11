function [detPos, detCls, detSns, nDet] = sensorSuite(egoState, agPos, agRadius, agClass, staticObs, p)
%SENSORSUITE  Camera + radar + lidar, each with its own error signature.
%
%   Replaces the single generic sensor of step 4. The problem statement
%   asks for a multi-sensor setup, and more importantly the three sensors
%   FAIL DIFFERENTLY -- which is the whole reason real vehicles carry all
%   three. Fusing them is only worth doing because their weaknesses do
%   not overlap.
%
%     CAMERA  narrow cone, medium range, excellent BEARING accuracy but
%             poor range accuracy (depth from a single image is hard).
%             The only sensor that classifies -- it is what tells an
%             autorickshaw from a pushcart.
%
%     RADAR   wide cone, long range, excellent RANGE accuracy but poor
%             cross-range (angular resolution is limited by antenna
%             size). Sees through dust and low light. Reports no class,
%             and throws the most clutter.
%
%     LIDAR   full 360 degrees, short range, accurate in both axes.
%             Coarse classification from shape. Few false alarms.
%
%   Note the complementarity: the camera's weakness (range) is the
%   radar's strength, and vice versa. A tracker fusing both gets a better
%   position estimate than either alone. That is the argument to make
%   when asked why three sensors instead of one.
%
%   OUTPUT
%   detSns  which sensor produced each detection (1 cam, 2 radar, 3 lidar).
%           The tracker associates each sensor's detections separately,
%           because three sensors seeing the same object produce three
%           detections and a naive tracker would spawn two spurious tracks.

maxDet = p.MAX_TRACKS * 3;
detPos = zeros(maxDet, 2);
detCls = zeros(maxDet, 1);
detSns = zeros(maxDet, 1);
nDet   = 0;

ex = egoState(1);  ey = egoState(2);  eyaw = egoState(3);
nAg = size(agPos, 1);

for s = 1:3
    cfg = p.sns(s);

    sx = ex + cfg.mountX * cos(eyaw);
    sy = ey + cfg.mountX * sin(eyaw);

    %% ---- real detections -------------------------------------------
    for a = 1:nAg
        dx = agPos(a,1) - sx;
        dy = agPos(a,2) - sy;
        rng_ = hypot(dx, dy);

        if rng_ > cfg.maxRange || rng_ < 0.4, continue; end

        bearing = wrapToPiLocal(atan2(dy, dx) - eyaw);
        if abs(bearing) > cfg.fov/2, continue; end

        if segmentHitsAnyRect(sx, sy, agPos(a,1), agPos(a,2), staticObs), continue; end

        occluded = false;
        for b = 1:nAg
            if b == a, continue; end
            db = hypot(agPos(b,1)-sx, agPos(b,2)-sy);
            if db >= rng_, continue; end
            if pointToSegDist(agPos(b,1), agPos(b,2), sx, sy, agPos(a,1), agPos(a,2)) < agRadius(b)
                occluded = true;  break;
            end
        end
        if occluded, continue; end

        pd = cfg.pd0 * (1 - cfg.pdFade*rng_/cfg.maxRange);
        if rand > pd, continue; end

        % anisotropic noise in the sensor's own range/cross-range frame
        sigR = cfg.sigRange0 + cfg.sigRangeK * rng_;
        sigC = cfg.sigCross0 + cfg.sigCrossK * rng_;
        nR = sigR*randn;   nC = sigC*randn;
        ux = dx/rng_;  uy = dy/rng_;

        nDet = nDet + 1;
        detPos(nDet,1) = agPos(a,1) + nR*ux - nC*uy;
        detPos(nDet,2) = agPos(a,2) + nR*uy + nC*ux;
        detSns(nDet)   = s;

        % Classification: only some sensors classify, and only reliably
        % at close range. A misclassification is worse than none, so a
        % failed classification reports 0 (unknown) and the planner then
        % assumes the largest plausible agent.
        if cfg.classifies && rand < cfg.pClass * (1 - 0.6*rng_/cfg.maxRange)
            detCls(nDet) = agClass(a);
        else
            detCls(nDet) = 0;
        end

        if nDet >= maxDet, return; end
    end

    %% ---- false alarms ------------------------------------------------
    nFA = poissKnuth(cfg.faRate);
    for i = 1:nFA
        if nDet >= maxDet, break; end
        r  = 0.4 + rand*(cfg.maxRange - 0.4);
        br = (rand - 0.5) * cfg.fov;
        nDet = nDet + 1;
        detPos(nDet,1) = sx + r*cos(eyaw + br);
        detPos(nDet,2) = sy + r*sin(eyaw + br);
        detCls(nDet)   = 0;
        detSns(nDet)   = s;
    end
end
end

%% ======================================================================
function n = poissKnuth(lambda)
% Poisson sample, Knuth's method. poissrnd() needs Statistics and Machine
% Learning Toolbox; this needs nothing and is exact, not an approximation.
n = 0;
L = exp(-lambda);
q = rand;
while q > L
    n = n + 1;
    q = q * rand;
end
end

function hit = segmentHitsAnyRect(x1, y1, x2, y2, rects)
hit = false;
for k = 1:size(rects,1)
    if segRect(x1,y1,x2,y2, rects(k,1),rects(k,2),rects(k,3),rects(k,4))
        hit = true;  return;
    end
end
end

function h = segRect(x1,y1,x2,y2, xmin,ymin,xmax,ymax)
h = false;
dx = x2-x1;  dy = y2-y1;
t0 = 0;  t1 = 1;
pq = [-dx, x1-xmin; dx, xmax-x1; -dy, y1-ymin; dy, ymax-y1];
for i = 1:4
    pp = pq(i,1);  qq = pq(i,2);
    if abs(pp) < 1e-12
        if qq < 0, return; end
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
    d = hypot(px-x1, py-y1);  return;
end
t = ((px-x1)*ex + (py-y1)*ey) / L2;
t = max(0, min(1, t));
d = hypot(px - (x1+t*ex), py - (y1+t*ey));
end

function a = wrapToPiLocal(a)
a = mod(a + pi, 2*pi) - pi;
end
