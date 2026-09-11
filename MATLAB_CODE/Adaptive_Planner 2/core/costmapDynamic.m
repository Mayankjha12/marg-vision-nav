function cost = costmapDynamic(staticCost, gi, preds, nPred, egoState, p)
%COSTMAPDYNAMIC  Adds the predicted-occupancy layer on top of the static one.
%
%   staticCost  precomputed once by costmapLayers()
%   preds       struct array, one per tracked agent, with fields
%                 px, py  (PRED_STEPS x 1) predicted positions
%                 sigma   (PRED_STEPS x 1) 1-sigma uncertainty
%                 radius  agent physical radius
%
%   WHY THIS IS A SEPARATE FILE FROM costmapLayers
%   The static layer costs 21 ms to build and never changes. The dynamic
%   layer changes every 100 ms. Rebuilding both every cycle wastes 21 ms
%   of a 100 ms budget. Build static once, add dynamic each cycle. This
%   split is the whole point of calling it a LAYERED costmap.
%
%   TWO ZONES PER PREDICTION
%   Inside the agent's physical radius: LETHAL. Never drive there.
%   Out to radius + sigma + clearance: graded cost that falls to zero.
%   The graded zone is what makes the planner leave room rather than
%   skimming past at exactly the collision boundary.
%
%   TIME DECAY
%   A prediction 0.2 s ahead is nearly certain; one 3 s ahead is a guess.
%   Cost is weighted by exp(-t/tau) so near-term predictions dominate.
%
%   REACHABILITY GATE  (this replaced a serious over-conservatism bug)
%   The naive version stamped ALL horizon steps into one 2D grid, so the
%   planner avoided everywhere an agent MIGHT be over 3 s rather than where
%   it would be when the vehicle actually arrived. Measured effect in the
%   dense market: 47.8% of replans found no path at all, the vehicle held
%   stale paths, and 9 runs in 10 ended in a collision. At 2 m/s the
%   vehicle covers 6 m in 3 s, so it was blocking itself out of space it
%   could not have reached.
%
%   The gate below stamps a prediction at time tk only if the vehicle
%   could plausibly BE there at tk, given its current speed plus a margin
%   for acceleration. That is a cheap approximation of a true space-time
%   costmap: it keeps the safety of predicting ahead while dropping the
%   parts of the prediction that are irrelevant to where we can go.
%
%   Still a limitation, and worth stating: a real space-time (x, y, t)
%   costmap with a planner that searches time as a dimension is the
%   correct solution. This is a 2D projection with a reachability filter.

LETHAL = 255.0;

cost = staticCost;
res  = gi.res;
ox   = gi.origin(1);
oy   = gi.origin(2);
gnx  = gi.nx;
gny  = gi.ny;

H   = p.PRED_STEPS;
dtp = p.dt_pred;
tau = p.cmap.tau;
w0  = p.cmap.wPred;
clr = p.cmap.clearance;

ex = egoState(1);
ey = egoState(2);
ev = egoState(4);

% --- reachability radius, computed ONCE over the FULL horizon ----------
% The first version computed this per prediction step, comparing each
% step against how far the vehicle travels BY that step. That prunes the
% near field and keeps the far field -- exactly inverted. Near-term
% predictions carry the highest cost weight and are the safety-critical
% ones. Measured: plan failures halved and latency halved, but collisions
% rose 20 -> 24 and the highway merge went from 80% and zero collisions
% to 30% and five, because a truck 20 m ahead had its 1-second prediction
% gated away.
%
% One radius over the whole horizon keeps every near-term prediction and
% prunes only what is genuinely too far to matter. At 10 m/s that is
% about 45 m; creeping at 2 m/s it is about 21 m, which is where the
% dense-market benefit came from.
Tmax     = H * dtp;
reachMax = ev*Tmax + 0.5*p.veh.aMax*Tmax*Tmax + p.cmap.reachPad;

for a = 1:nPred
    px  = preds(a).px;
    py  = preds(a).py;
    sg  = preds(a).sigma;
    rad = preds(a).radius;

    for k = 1:H
        tk = k * dtp;

        % --- reachability gate: one radius for every step ----------------
        if hypot(px(k)-ex, py(k)-ey) > reachMax
            continue;
        end

        r  = rad + sg(k) + clr;
        w  = w0 * exp(-tk / tau);

        ci = floor((px(k) - ox)/res) + 1;
        cj = floor((py(k) - oy)/res) + 1;
        rr = ceil(r / res);

        i0 = max(1, ci-rr);  i1 = min(gnx, ci+rr);
        j0 = max(1, cj-rr);  j1 = min(gny, cj+rr);

        for jj = j0:j1
            for ii = i0:i1
                d = hypot(ii-ci, jj-cj) * res;
                if d > r, continue; end
                if d < rad
                    c = LETHAL;
                else
                    c = w * (1 - d/r);
                end
                if c > cost(jj,ii)
                    cost(jj,ii) = c;
                end
            end
        end
    end
end

cost = min(cost, LETHAL);
end