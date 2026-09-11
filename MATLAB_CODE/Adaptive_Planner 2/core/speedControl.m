function [aCmd, integNext, vTarget] = speedControl(v, vDesired, kappa, integ, dt, p)
%SPEEDCONTROL  PI longitudinal control with a lateral-accel speed cap.
%#codegen
%
%   v         current speed
%   vDesired  speed the behaviour layer asked for
%   kappa     path curvature at the lookahead point (1/m)
%   integ     PI integrator state
%
%   The curvature cap is the part that matters. Cornering at speed v on
%   curvature kappa produces lateral acceleration a_lat = v^2 * kappa.
%   Cap a_lat at a comfortable value and you get v_max = sqrt(a_lat/kappa)
%   for free. Without this the vehicle enters every tight turn at full
%   speed, pure pursuit saturates the steering, and it runs wide -- which
%   looks exactly like a planner bug and will waste a day of your time.

A_LAT_MAX = 2.5;   % m/s^2, comfortable cornering

% --- curvature speed cap ---------------------------------------------
if abs(kappa) > 1e-4
    vCurve = sqrt(A_LAT_MAX / abs(kappa));
else
    vCurve = p.veh.vMax;
end

vTarget = min([vDesired, vCurve, p.veh.vMax]);
vTarget = max(0, vTarget);

% --- PI ---------------------------------------------------------------
err       = vTarget - v;
integNext = integ + err * dt;
integNext = max(-p.pi.iMax, min(p.pi.iMax, integNext));   % anti-windup

aCmd = p.pi.Kp * err + p.pi.Ki * integNext;
aCmd = max(p.veh.aMin, min(p.veh.aMax, aCmd));

% Conditional integration: if the output is saturated and the error would
% push it further into saturation, freeze the integrator. Clamping alone
% is not enough -- the integrator still winds toward the clamp and adds
% lag on the way back.
if (aCmd >= p.veh.aMax && err > 0) || (aCmd <= p.veh.aMin && err < 0)
    integNext = integ;
end
end
