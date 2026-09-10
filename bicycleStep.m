function [stateNext, deltaAct] = bicycleStep(state, deltaCmd, aCmd, deltaPrev, dt, p)
%BICYCLESTEP  Kinematic bicycle model, one integration step. RK4.
%#codegen
%
%   state = [x; y; yaw; v]  -- rear axle reference point, world frame
%   deltaCmd  commanded road wheel angle (rad)
%   aCmd      commanded longitudinal acceleration (m/s^2)
%   deltaPrev previous actual steer angle, for rate limiting
%   dt        integration step
%   p         params() struct
%
%   Why kinematic and not dynamic: below about 40 km/h with normal
%   steering the tyre slip angles are small enough that a kinematic model
%   tracks a dynamic one closely. Every one of our five scenarios is
%   low speed. The extra fidelity of a dynamic model is not graded and
%   costs a week of solver tuning.
%
%   Rear axle reference (not CG) is deliberate: the kinematic equations
%   are exact at the rear axle, and pure pursuit is derived there too.

% --- actuator limits: rate first, then position -----------------------
dDeltaMax = p.veh.deltaRate * dt;
deltaAct  = deltaPrev + max(-dDeltaMax, min(dDeltaMax, deltaCmd - deltaPrev));
deltaAct  = max(-p.veh.deltaMax, min(p.veh.deltaMax, deltaAct));

a = max(p.veh.aEmerg, min(p.veh.aMax, aCmd));

% --- RK4 --------------------------------------------------------------
k1 = deriv(state,              deltaAct, a, p);
k2 = deriv(state + 0.5*dt*k1,  deltaAct, a, p);
k3 = deriv(state + 0.5*dt*k2,  deltaAct, a, p);
k4 = deriv(state + dt*k3,      deltaAct, a, p);

stateNext = state + (dt/6) * (k1 + 2*k2 + 2*k3 + k4);

% --- constraints ------------------------------------------------------
% No reversing in step 1. Clamp instead of letting v go negative, which
% would silently flip the steering sign and produce a very confusing bug.
if stateNext(4) < 0
    stateNext(4) = 0;
end
stateNext(4) = min(stateNext(4), p.veh.vMax);
stateNext(3) = wrapToPiLocal(stateNext(3));
end

% ----------------------------------------------------------------------
function d = deriv(s, delta, a, p)
%#codegen
yaw = s(3);
v   = s(4);
d = [ v * cos(yaw);
      v * sin(yaw);
      v * tan(delta) / p.veh.L;
      a ];
end

% ----------------------------------------------------------------------
function a = wrapToPiLocal(a)
%#codegen
% Local copy so the block does not depend on Mapping Toolbox.
a = mod(a + pi, 2*pi) - pi;
end
