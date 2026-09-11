function [px, py, sigma] = immPredictAhead(filt, p)
%IMMPREDICTAHEAD  Roll the IMM forward over the planning horizon.
%
%   Returns PRED_STEPS predicted positions and a 1-sigma uncertainty at
%   each step. No measurements here -- pure propagation.
%
%   WHY SIGMA IS THE IMPORTANT OUTPUT
%   The predicted positions alone are a guess and will be wrong. What the
%   planner actually needs is "how wrong might this be", because that is
%   what it inflates the obstacle by. An agent the filter is confident
%   about gets a tight blob; one it is unsure about gets a wide one and
%   the planner automatically gives it more room.
%
%   Sigma has two sources, and both matter:
%     1. each model's own covariance growing as it extrapolates
%     2. DISAGREEMENT BETWEEN the models
%   The second is the interesting one. When a pedestrian starts turning,
%   the straight-line model and the turning model diverge, sigma spikes,
%   and the planner backs off before any single model is confident about
%   what is happening. That is the behaviour we want on an Indian road.

NM = p.imm.nModels;
H  = p.PRED_STEPS;
dt = p.dt_pred;
qa = p.imm.qa;
qw = p.imm.qw;

px    = zeros(H,1);
py    = zeros(H,1);
sigma = zeros(H,1);

xs = filt.x;          % 5 x NM, working copies
Ps = filt.P;          % 5 x 5 x NM
mu = filt.mu;

for k = 1:H
    mx = 0;  my = 0;
    for j = 1:NM
        [xn, F, Q] = ctrvModel(xs(:,j), dt, qa(j), qw(j));
        xs(:,j)   = xn;
        Ps(:,:,j) = F * Ps(:,:,j) * F' + Q;
        mx = mx + mu(j)*xn(1);
        my = my + mu(j)*xn(2);
    end

    % total variance = within-model variance + between-model spread
    v = 0;
    for j = 1:NM
        d = (xs(1,j) - mx)^2 + (xs(2,j) - my)^2;
        v = v + mu(j) * (Ps(1,1,j) + Ps(2,2,j) + d);
    end

    px(k)    = mx;
    py(k)    = my;
    sigma(k) = sqrt(max(v/2, 1e-6));
end
end
