function [trk, tid, tpos, tvel, tcls, nOut] = trackerUpdate(trk, detPos, detCls, detSns, nDet, p)
%TRACKERUPDATE  One tracker cycle over ALL sensors. Returns confirmed tracks.
%
%   Four steps: predict, associate, update, manage.
%
%   ON ASSOCIATION, because this is the part worth understanding.
%   The obvious approach is greedy: each track takes its nearest
%   detection. That fails exactly when it matters -- two agents passing
%   close together, where greedy can hand both tracks the same detection
%   and permanently swap their identities. Instead we build a cost matrix
%   of every track against every detection and solve for the GLOBALLY
%   cheapest set of pairings. matchpairs() is the Hungarian algorithm and
%   is in base MATLAB, no toolbox required.
%
%   Distance is Mahalanobis squared, not metres. A track whose position
%   is uncertain should accept a detection further away than one the
%   filter is confident about. Using raw distance ignores the covariance
%   and fragments exactly the tracks that are emerging from occlusion.
%
%   WHY ASSOCIATION IS DONE PER SENSOR  (this is the multi-sensor part)
%   Three sensors seeing the same object produce three detections in one
%   cycle. A single global assignment can only match ONE of them to the
%   track -- the other two look unmatched and spawn two spurious tracks.
%   So we run the assignment separately for each sensor's detections,
%   sequentially, each update refining the track further. Predict happens
%   once at the start and management once at the end, so a track seen by
%   any sensor counts as one hit, not three.

N     = p.MAX_TRACKS;
gate  = p.track.gate;
confM = p.track.confirmHits;
delP  = p.track.deleteMisses;

F = trk.F;  H = trk.H;  Q = trk.Q;  R = trk.R;

%% ---- 1. predict (ONCE, before any sensor) ------------------------------
act = find(trk.id > 0);
for i = 1:numel(act)
    s = act(i);
    trk.x(:,s)   = F * trk.x(:,s);
    trk.P(:,:,s) = F * trk.P(:,:,s) * F' + Q;
end

seenThisCycle = false(N,1);
usedDet       = false(max(nDet,1),1);

%% ---- 2 & 3. associate and update, one sensor at a time -----------------
if nDet > 0
    nSensors = max(detSns(1:nDet));
else
    nSensors = 0;
end

for sns = 1:nSensors
    idx = find(detSns(1:nDet) == sns);
    if isempty(idx), continue; end

    act = find(trk.id > 0);
    nA  = numel(act);
    nD  = numel(idx);
    if nA == 0, continue; end

    BIG = 10 * gate;
    C = BIG * ones(nA, nD);
    for i = 1:nA
        s  = act(i);
        S  = H * trk.P(:,:,s) * H' + R;
        Si = S \ eye(2);
        zp = H * trk.x(:,s);
        for j = 1:nD
            y  = detPos(idx(j),:)' - zp;
            d2 = y' * Si * y;
            if d2 < gate, C(i,j) = d2; end
        end
    end

    M = matchpairs(C, gate/2);
    for r = 1:size(M,1)
        i = M(r,1);  j = M(r,2);
        if C(i,j) >= gate, continue; end
        s  = act(i);
        dj = idx(j);

        S = H * trk.P(:,:,s) * H' + R;
        K = trk.P(:,:,s) * H' / S;
        y = detPos(dj,:)' - H * trk.x(:,s);

        trk.x(:,s)   = trk.x(:,s) + K*y;
        trk.P(:,:,s) = (eye(4) - K*H) * trk.P(:,:,s);

        % Only camera and lidar report a class. A class-0 detection must
        % not erase a class we already learned from another sensor.
        if detCls(dj) > 0
            trk.cls(s) = detCls(dj);
        end

        seenThisCycle(s) = true;
        usedDet(dj)      = true;
    end
end

%% ---- 4. track management (ONCE, after all sensors) ---------------------
act = find(trk.id > 0);
for i = 1:numel(act)
    s = act(i);
    if seenThisCycle(s)
        trk.hits(s) = trk.hits(s) + 1;
        trk.miss(s) = 0;
    else
        trk.miss(s) = trk.miss(s) + 1;
    end
    trk.age(s) = trk.age(s) + 1;

    if trk.hits(s) >= confM, trk.conf(s) = true; end

    if trk.miss(s) >= delP
        trk.id(s)=0; trk.conf(s)=false; trk.hits(s)=0; trk.miss(s)=0; trk.age(s)=0;
    end
end

% --- births -----------------------------------------------------------
for j = 1:nDet
    if usedDet(j), continue; end
    s = find(trk.id == 0, 1);
    if isempty(s), break; end
    trk.id(s)    = trk.nextID;
    trk.nextID   = trk.nextID + 1;
    trk.x(:,s)   = [detPos(j,1); 0; detPos(j,2); 0];
    trk.P(:,:,s) = trk.P0;
    trk.hits(s)  = 1;
    trk.miss(s)  = 0;
    trk.age(s)   = 1;
    trk.conf(s)  = false;
    trk.cls(s)   = detCls(j);
end

%% ---- output: confirmed tracks only -------------------------------------
% Tentative tracks are deliberately withheld. A single false alarm must
% never become an obstacle the planner swerves around.
tid  = zeros(N,1);
tpos = zeros(N,2);
tvel = zeros(N,2);
tcls = zeros(N,1);
nOut = 0;

for s = 1:N
    if trk.id(s) > 0 && trk.conf(s)
        nOut = nOut + 1;
        tid(nOut)    = trk.id(s);
        tpos(nOut,:) = [trk.x(1,s), trk.x(3,s)];
        tvel(nOut,:) = [trk.x(2,s), trk.x(4,s)];
        tcls(nOut)   = trk.cls(s);
    end
end
trk.n = nOut;
end