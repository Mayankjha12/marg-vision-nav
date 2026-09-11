function [pathX, pathY, pathK, numPts] = makeStubPath(p, shape)
%MAKESTUBPATH  Hardcoded reference path for step 1.
%
%   THIS IS A STUB. In step 2 the local planner replaces it entirely and
%   this file gets deleted. Its only job is to give the controller
%   something to follow so we can prove the closed loop works.
%
%   shape: 'sweep'  gentle S-curve, sanity check
%          'tight'  decreasing-radius turn, exercises the curvature cap
%          'chicane' sharp reversals, breaks a badly tuned lookahead

if nargin < 2
    shape = 'sweep';
end

ds = 0.5;   % path point spacing

switch shape
    case 'sweep'
        s  = (0:ds:120)';
        xs = s;
        ys = 8 * sin(2*pi*s/80);

    case 'tight'
        s  = (0:ds:90)';
        xs = zeros(size(s));
        ys = zeros(size(s));
        % straight, then a turn whose radius shrinks 40 m -> 12 m
        for i = 1:numel(s)
            if s(i) < 25
                xs(i) = s(i);
                ys(i) = 0;
            else
                sc = s(i) - 25;
                R  = max(12, 40 - 0.45*sc);
                th = sc / R;
                xs(i) = 25 + R*sin(th);
                ys(i) = R - R*cos(th);
            end
        end

    case 'chicane'
        s  = (0:ds:100)';
        xs = s;
        ys = 5*sin(2*pi*s/30) .* exp(-s/150);

    otherwise
        error('makeStubPath: unknown shape "%s"', shape);
end

n = min(numel(xs), p.MAX_PATH_PTS);
xs = xs(1:n);
ys = ys(1:n);

% --- curvature by finite difference -----------------------------------
% kappa = (x' y'' - y' x'') / (x'^2 + y'^2)^(3/2)
dx  = gradient(xs);
dy  = gradient(ys);
ddx = gradient(dx);
ddy = gradient(dy);
den = (dx.^2 + dy.^2).^1.5;
k   = zeros(n,1);
ok  = den > 1e-9;
k(ok) = (dx(ok).*ddy(ok) - dy(ok).*ddx(ok)) ./ den(ok);

% --- pad to fixed size ------------------------------------------------
pathX = zeros(p.MAX_PATH_PTS, 1);
pathY = zeros(p.MAX_PATH_PTS, 1);
pathK = zeros(p.MAX_PATH_PTS, 1);
pathX(1:n) = xs;
pathY(1:n) = ys;
pathK(1:n) = k;
numPts = n;
end
