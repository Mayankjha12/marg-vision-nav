function cost = costmapHysteresis(cost, gi, prevX, prevY, prevN, egoXY, p)
%COSTMAPHYSTERESIS  Biases the planner toward the path it chose last time.
%
%   THE PROBLEM THIS SOLVES
%   Each replan runs from scratch with no memory. When two routes around
%   an obstacle have nearly equal cost -- one above, one below -- a
%   one-metre change in an agent's position can flip the planner's choice.
%   The planner is behaving correctly. The vehicle is not: it has already
%   committed several metres in the old direction and has a steering rate
%   limit, so it ends up cutting across the middle following neither
%   route well. This is homotopy flip-flopping.
%
%   THE FIX
%   Add a penalty everywhere EXCEPT inside a corridor around the previous
%   path. Switching routes is still allowed -- if an agent walks into the
%   old corridor, LETHAL there dwarfs this penalty and the planner
%   reroutes immediately.
%
%   WHY THE PENALTY IS RANGE-LIMITED  (this was a bug, do not remove it)
%   Applying the penalty over the WHOLE map breaks hybrid A*. The uniform
%   cost raises the true cost-to-go to roughly 5.5 per metre while the
%   Euclidean heuristic still estimates 1.3 per metre. A heuristic that
%   underestimates by 4x stops guiding the search: A* degenerates toward
%   breadth-first, blows through maxExpand, and returns failure. The
%   vehicle then emergency-stops for no reason.
%
%   Range-limiting is also the more principled choice. Commitment matters
%   for the next few seconds of driving, not for a route 100 m away that
%   will be replanned fifty times before we get there.

if prevN < 3
    return;                 % no previous path yet, nothing to bias toward
end

res = gi.res;
ox  = gi.origin(1);
oy  = gi.origin(2);
gnx = gi.nx;
gny = gi.ny;

R  = p.cmap.hystRadius;
rr = ceil(R / res);

inCorridor = false(gny, gnx);
for i = 1:prevN
    ci = floor((prevX(i) - ox)/res) + 1;
    cj = floor((prevY(i) - oy)/res) + 1;
    i0 = max(1, ci-rr);  i1 = min(gnx, ci+rr);
    j0 = max(1, cj-rr);  j1 = min(gny, cj+rr);
    if i1 < i0 || j1 < j0, continue; end
    inCorridor(j0:j1, i0:i1) = true;
end

% --- range limit: only penalise near the vehicle ----------------------
er  = ceil(p.cmap.hystRange / res);
eci = floor((egoXY(1) - ox)/res) + 1;
ecj = floor((egoXY(2) - oy)/res) + 1;

inRange = false(gny, gnx);
i0 = max(1, eci-er);  i1 = min(gnx, eci+er);
j0 = max(1, ecj-er);  j1 = min(gny, ecj+er);
if i1 >= i0 && j1 >= j0
    inRange(j0:j1, i0:i1) = true;
end

% Not applied to lethal cells -- they are already maxed out and adding to
% them would blow past the 255 ceiling and break the collision test.
pen  = p.cmap.wHyst;
mask = ~inCorridor & inRange & (cost < 255);
cost(mask) = min(cost(mask) + pen, 254);
end