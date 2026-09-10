function [cost, gi] = costmapLayers(obstacles, p)
%COSTMAPLAYERS  Builds the cost grid the planner searches over.
%
%   STEP 2 VERSION: hard-obstacle layer only, static obstacles, fixed
%   world grid. Steps 4 and 5 add the predicted-occupancy layer and the
%   road-surface layer, and make the grid roll with the vehicle.
%
%   obstacles  K x 4 array, each row [xmin ymin xmax ymax] in world metres
%   cost       ny x nx grid, 0 = free, LETHAL = never enter
%   gi         grid info struct: origin, res, nx, ny
%
%   WHY INFLATION EXISTS
%   The planner treats the vehicle as a point. That is only safe if every
%   obstacle is first grown by the vehicle's half-width plus a margin.
%   Inflate correctly and a point-collision check is exact; skip it and
%   your planner will happily route the centreline 10 cm from a wall.
%
%   The inflation is graded, not binary. Cells right at the obstacle edge
%   cost nearly LETHAL and the cost falls to zero at the inflation radius.
%   That gradient is what makes the planner prefer the middle of a gap
%   instead of scraping one side of it.

LETHAL = 255.0;

gi.res    = p.grid.res;
gi.origin = p.grid.origin;      % [x y] of cell (1,1) lower-left corner
gi.nx     = p.grid.nx;
gi.ny     = p.grid.ny;

cost   = zeros(gi.ny, gi.nx);
lethal = false(gi.ny, gi.nx);

%% ---- rasterise the hard obstacles ------------------------------------
for k = 1:size(obstacles, 1)
    [i0, j0] = world2grid(obstacles(k,1), obstacles(k,2), gi);
    [i1, j1] = world2grid(obstacles(k,3), obstacles(k,4), gi);
    i0 = max(1, i0);  i1 = min(gi.nx, i1);
    j0 = max(1, j0);  j1 = min(gi.ny, j1);
    if i1 >= i0 && j1 >= j0
        lethal(j0:j1, i0:i1) = true;
    end
end
cost(lethal) = LETHAL;

%% ---- graded inflation -------------------------------------------------
% Inflation radius = half the vehicle width + safety margin. The margin is
% what the behaviour layer will later widen in a market and narrow on a
% highway, via BehaviourCommand.lateralMargin.
infl = p.veh.width/2 + p.grid.margin;
r    = ceil(infl / gi.res);

[js, is] = find(lethal);
for n = 1:numel(is)
    i = is(n);  j = js(n);
    for dj = -r:r
        for di = -r:r
            ii = i + di;  jj = j + dj;
            if ii < 1 || ii > gi.nx || jj < 1 || jj > gi.ny, continue; end
            if lethal(jj, ii), continue; end
            d = hypot(di, dj) * gi.res;
            if d > infl, continue; end
            c = LETHAL * (1 - d/infl) * 0.9;   % 0.9 so it never equals LETHAL
            if c > cost(jj, ii)
                cost(jj, ii) = c;
            end
        end
    end
end
end

% ----------------------------------------------------------------------
function [ix, iy] = world2grid(x, y, gi)
ix = floor((x - gi.origin(1)) / gi.res) + 1;   % +1 for MATLAB 1-indexing
iy = floor((y - gi.origin(2)) / gi.res) + 1;
end
