function filt = immInit(z0, T, p)
%IMMINIT  Creates an IMM filter for one newly seen agent.
%
%   z0  [x y] first observed position
%   T   filter update interval (p.dt_percep)
%
%   THE IDEA BEHIND IMM
%   You do not know whether the auto ahead is going straight, turning, or
%   accelerating. So run three filters in parallel, one per assumption,
%   and keep a probability for each. Every update, the model that
%   explained the measurement best gains probability. The output is the
%   probability-weighted blend.
%
%   All three models share the SAME state vector and the SAME CTRV
%   equations. They differ only in process noise:
%       CV  low speed noise, near-zero turn noise   -> believes straight
%       CT  moderate speed noise, high turn noise   -> believes turning
%       CA  high speed noise, near-zero turn noise  -> believes accel
%   Sharing the state space is deliberate: it makes the mixing step
%   trivial. Mixing across different state spaces needs transformations
%   and is where most textbook IMM implementations go wrong.

NM = p.imm.nModels;

filt.T  = T;
filt.x  = zeros(5, NM);
filt.P  = zeros(5, 5, NM);
filt.mu = ones(NM,1) / NM;

x0 = [z0(1); z0(2); 0; 0; 0];
% Large initial variance on v, yaw and omega: we have seen one position
% and genuinely know nothing about motion yet. Starting confident here
% makes the filter slow to latch onto the truth.
P0 = diag([1, 1, 25, pi^2, 1]);

for j = 1:NM
    filt.x(:,j)   = x0;
    filt.P(:,:,j) = P0;
end

% Markov transition matrix: probability of switching model between steps.
% pStay high = models are sticky, less chatter, slower to react.
pStay = p.imm.pStay;
filt.PI = ones(NM,NM) * (1 - pStay)/(NM - 1);
for j = 1:NM
    filt.PI(j,j) = pStay;
end

filt.xc  = x0;      % combined estimate
filt.age = 0;
end
