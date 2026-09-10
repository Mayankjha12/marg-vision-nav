function [delta, tgtIdx, Ld, crossTrackErr] = purePursuit(state, pathX, pathY, numPts, p)
%PUREPURSUIT  Geometric lateral controller.
%#codegen
%
%   state  = [x; y; yaw; v] at the REAR AXLE, world frame
%   pathX, pathY  fixed-size MAX_PATH_PTS x 1 arrays
%   numPts number of valid points at the front of those arrays
%
%   The idea in one line: pick a point on the path a distance Ld ahead,
%   then find the circular arc from the rear axle through that point.
%   delta = atan(2 L sin(alpha) / Ld) is exactly the steer angle that
%   makes the bicycle model follow that arc.
%
%   Ld scales with speed because a fixed lookahead is unstable fast and
%   sluggish slow. Short Ld = tight tracking, oscillation at speed.
%   Long Ld = smooth, cuts corners. This is the single knob that most
%   affects how the vehicle "feels" in the demo video.

delta         = 0;
tgtIdx        = int32(1);
crossTrackErr = 0;

Ld = p.pp.Ld_min + p.pp.Ld_gain * state(4);
Ld = max(p.pp.Ld_min, min(p.pp.Ld_max, Ld));

n = double(numPts);
if n < 2
    return;   % no usable path, hold straight
end

x   = state(1);
y   = state(2);
yaw = state(3);

% --- nearest point on the path ---------------------------------------
bestD  = inf;
nearIdx = 1;
for i = 1:n
    d = (pathX(i) - x)^2 + (pathY(i) - y)^2;
    if d < bestD
        bestD   = d;
        nearIdx = i;
    end
end
% --- cross-track error: distance to nearest SEGMENT ------------------
% Distance to the nearest sample POINT sawtooths at (speed / point
% spacing) as the closest sample flips from one to the next. That shows
% up as buzz on the metric even when the vehicle is perfectly smooth.
% Projecting onto the two adjacent segments removes the artifact.
crossTrackErr = sqrt(bestD);
i0 = max(1, nearIdx - 1);
i1 = min(n, nearIdx + 1);
for i = i0:(i1-1)
    ax = pathX(i);
    ay = pathY(i);
    ex = pathX(i+1) - ax;
    ey = pathY(i+1) - ay;
    len2 = ex*ex + ey*ey;
    if len2 < 1e-9
        continue;
    end
    tt = ((x - ax)*ex + (y - ay)*ey) / len2;
    tt = max(0, min(1, tt));      % clamp to the segment, not the line
    d  = sqrt((x - (ax + tt*ex))^2 + (y - (ay + tt*ey))^2);
    if d < crossTrackErr
        crossTrackErr = d;
    end
end

% --- walk forward until we are Ld away --------------------------------
% Search forward only. Searching the whole path lets the controller latch
% onto a point behind the vehicle on a path that loops back on itself,
% which produces a spectacular and hard-to-diagnose spin.
tgt = nearIdx;
for i = nearIdx:n
    d = sqrt((pathX(i) - x)^2 + (pathY(i) - y)^2);
    tgt = i;
    if d >= Ld
        break;
    end
end
tgtIdx = int32(tgt);

% --- steer angle ------------------------------------------------------
dx = pathX(tgt) - x;
dy = pathY(tgt) - y;
Ldact = sqrt(dx*dx + dy*dy);
if Ldact < 1e-3
    return;
end

alpha = wrapToPiLocal(atan2(dy, dx) - yaw);
delta = atan2(2 * p.veh.L * sin(alpha), Ldact);
delta = max(-p.veh.deltaMax, min(p.veh.deltaMax, delta));
end

% ----------------------------------------------------------------------
function a = wrapToPiLocal(a)
%#codegen
a = mod(a + pi, 2*pi) - pi;
end