function [px, py, pyaw, numPts, success, nExpanded] = hybridAStar(startState, goalState, cost, gi, p)
%HYBRIDASTAR  Kinematically feasible path search over a cost grid.
%
%   startState  [x y yaw]
%   goalState   [x y yaw]
%   cost, gi    from costmapLayers()
%
%   HOW THIS DIFFERS FROM THE A* YOU ALREADY KNOW
%   Ordinary A* on a grid expands to the 8 neighbouring cells. The path it
%   returns is made of 45-degree steps and no car can drive it.
%
%   Hybrid A* expands by DRIVING THE BICYCLE MODEL FORWARD for a short arc
%   at each of a few steering angles. Every edge in the search graph is
%   therefore something the vehicle can physically execute, so the result
%   needs no post-processing to be feasible. That is the whole idea.
%
%   The second difference: the search state is (x, y, yaw), not (x, y).
%   Arriving at a cell heading north is a different situation from
%   arriving heading east, so the grid gets a third dimension of heading
%   bins. Continuous state, discrete bookkeeping -- hence "hybrid".
%
%   COST FUNCTION
%     arc length                      -- prefer short paths
%   + steering penalty                -- prefer straight paths
%   + steering-change penalty         -- prefer smooth paths, no weaving
%   + costmap penalty along the arc   -- prefer distance from obstacles
%
%   PERFORMANCE NOTE (read this before you "tidy" the code)
%   Everything from params is hoisted into local scalars before the loop,
%   the heap swaps use temporaries instead of deal(), the grid is indexed
%   linearly, and there are no nested function calls in the hot path.
%   Each of those is ugly and each of them is worth real milliseconds:
%   struct field access, deal(), and nested-function calls are all
%   expensive in the MATLAB interpreter and this code runs them hundreds
%   of thousands of times. Do not refactor them back for readability.
%
%   If you still need it faster, compile it -- see the codegen note in
%   the README. That is worth another 50x and is the real answer.

LETHAL = 255.0;

%% ---- hoist EVERYTHING into locals ------------------------------------
res   = gi.res;      ox = gi.origin(1);  oy = gi.origin(2);
gnx   = gi.nx;       gny = gi.ny;

sres  = p.plan.searchRes;
NYAW  = p.plan.yawBins;
stepLen  = p.plan.stepLen;
subStep  = p.plan.subStep;
nSteerL  = p.plan.nSteer;
hWeight  = p.plan.hWeight;
goalR    = p.plan.goalRadius;
goalYawT = p.plan.goalYawTol;
maxExp   = p.plan.maxExpand;
maxHeap  = p.plan.maxHeap;
wSteer   = p.plan.wSteer;
wSwitch  = p.plan.wSwitch;
wCost    = p.plan.wCost;
L        = p.veh.L;
dMax     = p.veh.deltaMax;
MAXPTS   = p.MAX_PATH_PTS;

% Vehicle footprint sample points, measured forward from the rear axle.
% Three discs spanning the body length. See the collision check below.
footOff = p.veh.footOffsets;
nFoot   = numel(footOff);

gx = goalState(1);  gy = goalState(2);  gyaw = goalState(3);

NX = ceil(gnx * res / sres);
NY = ceil(gny * res / sres);
nNode = NX * NY * NYAW;
dyaw  = 2*pi / NYAW;
TWOPI = 2*pi;

steers = linspace(-dMax, dMax, nSteerL);
absSteer = abs(steers);
nSub   = max(2, round(stepLen / subStep));
ds     = stepLen / nSub;

%% ---- node bookkeeping ------------------------------------------------
gScore  = inf(nNode, 1);
parent  = zeros(nNode, 1);
closed  = false(nNode, 1);
nodeX   = zeros(nNode, 1);
nodeY   = zeros(nNode, 1);
nodeYaw = zeros(nNode, 1);
nodeStr = zeros(nNode, 1);

%% ---- binary min-heap --------------------------------------------------
heapKey = inf(maxHeap, 1);
heapVal = zeros(maxHeap, 1);
heapN   = 0;

%% ---- seed -------------------------------------------------------------
px = zeros(MAXPTS,1); py = px; pyaw = px;
numPts = 0; success = false; nExpanded = 0;

sx0 = startState(1); sy0 = startState(2); sa0 = startState(3);
ix = floor((sx0-ox)/sres);  iy = floor((sy0-oy)/sres);
ia = mod(floor((mod(sa0+pi,TWOPI)-pi+pi)/dyaw), NYAW);
if ix < 0 || ix >= NX || iy < 0 || iy >= NY
    return;
end
s0 = (iy*NX + ix)*NYAW + ia + 1;

gScore(s0)  = 0;
nodeX(s0)   = sx0;  nodeY(s0) = sy0;  nodeYaw(s0) = sa0;
parent(s0)  = -1;

heapN = 1;
heapKey(1) = hWeight * sqrt((gx-sx0)^2 + (gy-sy0)^2);
heapVal(1) = s0;

goalNode = -1;

%% ---- main loop ---------------------------------------------------------
while heapN > 0 && nExpanded < maxExp

    % ---- heap pop (inlined) ------------------------------------------
    ci = heapVal(1);
    heapKey(1) = heapKey(heapN);  heapVal(1) = heapVal(heapN);
    heapKey(heapN) = inf;         heapVal(heapN) = 0;
    heapN = heapN - 1;
    i = 1;
    while true
        l = 2*i;  r = l + 1;  sm = i;
        if l <= heapN && heapKey(l) < heapKey(sm), sm = l; end
        if r <= heapN && heapKey(r) < heapKey(sm), sm = r; end
        if sm == i, break; end
        tk = heapKey(sm); heapKey(sm) = heapKey(i); heapKey(i) = tk;
        tv = heapVal(sm); heapVal(sm) = heapVal(i); heapVal(i) = tv;
        i = sm;
    end

    if closed(ci), continue; end
    closed(ci) = true;
    nExpanded  = nExpanded + 1;

    x = nodeX(ci);  y = nodeY(ci);  yaw = nodeYaw(ci);
    gCur = gScore(ci);  strCur = nodeStr(ci);

    % ---- goal test: position AND heading -----------------------------
    % Position alone lets the planner declare victory while pointing the
    % wrong way down the road.
    dgx = gx - x;  dgy = gy - y;
    if dgx*dgx + dgy*dgy < goalR*goalR
        dA = mod(gyaw - yaw + pi, TWOPI) - pi;
        if abs(dA) < goalYawT
            goalNode = ci;
            break;
        end
    end

    % ---- expand -------------------------------------------------------
    for si = 1:nSteerL
        d     = steers(si);
        tanDL = tan(d) / L;

        nx_ = x;  ny_ = y;  nyaw_ = yaw;
        blocked = false;
        accCost = 0;

        for k = 1:nSub
            nx_   = nx_   + ds * cos(nyaw_);
            ny_   = ny_   + ds * sin(nyaw_);
            nyaw_ = nyaw_ + ds * tanDL;

            % --- VEHICLE FOOTPRINT, not a point --------------------------
            % The state is the REAR AXLE but the body extends 3.65 m ahead
            % of it. Checking only the rear axle lets the planner route
            % paths where the axle clears an obstacle and the bonnet goes
            % straight through it. Three overlapping discs along the
            % centreline approximate the body closely enough, and the
            % costmap inflation already accounts for the half-width.
            cyaw = cos(nyaw_);  syaw = sin(nyaw_);
            worst = 0;
            for fi = 1:nFoot
                fx = nx_ + footOff(fi)*cyaw;
                fy = ny_ + footOff(fi)*syaw;
                cx = floor((fx-ox)/res) + 1;
                cy = floor((fy-oy)/res) + 1;
                if cx < 1 || cx > gnx || cy < 1 || cy > gny
                    blocked = true; break;
                end
                c = cost(cy + (cx-1)*gny);   % linear index is faster
                if c >= LETHAL
                    blocked = true; break;
                end
                if c > worst, worst = c; end
            end
            if blocked, break; end
            accCost = accCost + worst;
        end
        if blocked, continue; end

        nyaw_ = mod(nyaw_ + pi, TWOPI) - pi;

        ix = floor((nx_-ox)/sres);  iy = floor((ny_-oy)/sres);
        if ix < 0 || ix >= NX || iy < 0 || iy >= NY, continue; end
        ia = mod(floor((nyaw_+pi)/dyaw), NYAW);
        nn = (iy*NX + ix)*NYAW + ia + 1;
        if closed(nn), continue; end

        edge = stepLen + wSteer*absSteer(si)*stepLen ...
                       + wCost*(accCost/nSub)*stepLen;
        dSw = d - strCur;
        if dSw > 1e-6 || dSw < -1e-6
            edge = edge + wSwitch*abs(dSw);
        end

        ng = gCur + edge;
        if ng < gScore(nn) - 1e-9
            gScore(nn)  = ng;
            nodeX(nn)   = nx_;
            nodeY(nn)   = ny_;
            nodeYaw(nn) = nyaw_;
            nodeStr(nn) = d;
            parent(nn)  = ci;

            if heapN < maxHeap
                % ---- heap push (inlined) -----------------------------
                f = ng + hWeight * sqrt((gx-nx_)^2 + (gy-ny_)^2);
                heapN = heapN + 1;
                heapKey(heapN) = f;  heapVal(heapN) = nn;
                i = heapN;
                while i > 1
                    par = floor(i/2);
                    if heapKey(par) <= heapKey(i), break; end
                    tk = heapKey(par); heapKey(par) = heapKey(i); heapKey(i) = tk;
                    tv = heapVal(par); heapVal(par) = heapVal(i); heapVal(i) = tv;
                    i = par;
                end
            end
        end
    end
end

%% ---- reconstruct --------------------------------------------------------
if goalNode > 0
    tmpX = zeros(MAXPTS,1);  tmpY = tmpX;  tmpA = tmpX;
    m = 0;  c = goalNode;
    while c > 0 && m < MAXPTS
        m = m + 1;
        tmpX(m) = nodeX(c);  tmpY(m) = nodeY(c);  tmpA(m) = nodeYaw(c);
        c = parent(c);
    end
    px(1:m)   = tmpX(m:-1:1);   % parents chain back from the goal, so flip
    py(1:m)   = tmpY(m:-1:1);
    pyaw(1:m) = tmpA(m:-1:1);
    numPts    = m;
    success   = true;
end
end