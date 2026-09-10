function ref = buildRefPath(cx, cy)
%BUILDREFPATH  Turns a centreline into a Frenet reference.
%
%   cx, cy  the road centreline, any spacing
%
%   The Frenet frame reparameterises the world in road coordinates:
%       s = how far along the road you are
%       d = how far to the left of the centreline you are
%   In those coordinates "stay in your lane" is just "keep d near zero",
%   and a lane change is a smooth curve in d. That is why every
%   structured-road planner uses it.
%
%   It requires a centreline. On a village road or in a market there is
%   none, which is the entire reason this project also has hybrid A*.
%
%   ref.th(i) is the road heading at point i. It defines the local
%   left-normal direction [-sin(th), cos(th)], which is the direction d
%   is measured along.

cx = cx(:);  cy = cy(:);
n  = numel(cx);

seg = hypot(diff(cx), diff(cy));
ref.s = [0; cumsum(seg)];
ref.x = cx;
ref.y = cy;
ref.n = n;

dx = gradient(cx);
dy = gradient(cy);
ref.th = atan2(dy, dx);

ddx = gradient(dx);
ddy = gradient(dy);
den = (dx.^2 + dy.^2).^1.5;
k   = zeros(n,1);
ok  = den > 1e-9;
k(ok) = (dx(ok).*ddy(ok) - dy(ok).*ddx(ok)) ./ den(ok);
ref.k = k;
end
