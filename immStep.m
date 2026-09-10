function filt = immStep(filt, z, p)
%IMMSTEP  One IMM measurement update. z = [x y] observed position.
%
%   The four standard steps. Learn these -- they are the same in every
%   IMM implementation you will ever read:
%
%     1. MIXING     each model starts from a blend of all models,
%                   weighted by how likely a switch into it was
%     2. FILTERING  each model does its own EKF predict + update
%     3. WEIGHTING  model probabilities updated by how well each one
%                   predicted the measurement (its likelihood)
%     4. COMBINING  probability-weighted blend = the output estimate
%
%   The angle handling in steps 1 and 4 exists because yaw is circular.
%   Averaging 179 deg and -179 deg naively gives 0, which points the
%   agent backwards. Every blend below is done relative to a base angle.

NM = p.imm.nModels;
T  = filt.T;
qa = p.imm.qa;      % 1 x NM
qw = p.imm.qw;      % 1 x NM

H = [1 0 0 0 0;
     0 1 0 0 0];
R = diag([p.imm.measVar, p.imm.measVar]);

%% ---- 1. mixing --------------------------------------------------------
cbar = filt.PI' * filt.mu;
x0 = zeros(5, NM);
P0 = zeros(5, 5, NM);

for j = 1:NM
    w = filt.PI(:,j) .* filt.mu / max(cbar(j), 1e-12);

    [~, iBase] = max(w);
    base = filt.x(4, iBase);            % reference angle for the blend

    xm = zeros(5,1);
    for i = 1:NM
        xi = filt.x(:,i);
        xi(4) = base + wrapToPiLocal(xi(4) - base);
        xm = xm + w(i)*xi;
    end
    xm(4) = wrapToPiLocal(xm(4));

    Pm = zeros(5,5);
    for i = 1:NM
        d = filt.x(:,i) - xm;
        d(4) = wrapToPiLocal(d(4));
        Pm = Pm + w(i)*(filt.P(:,:,i) + d*d');
    end

    x0(:,j)   = xm;
    P0(:,:,j) = Pm;
end

%% ---- 2. model-conditioned EKF predict + update -------------------------
L = zeros(NM,1);
for j = 1:NM
    [xp, F, Q] = ctrvModel(x0(:,j), T, qa(j), qw(j));
    Pp = F * P0(:,:,j) * F' + Q;

    S = H*Pp*H' + R;
    y = z(:) - H*xp;
    K = Pp * H' / S;                    % '/' is safer than inv(S)

    xu = xp + K*y;
    xu(4) = wrapToPiLocal(xu(4));

    filt.x(:,j)   = xu;
    filt.P(:,:,j) = (eye(5) - K*H) * Pp;

    % Gaussian likelihood of this measurement under model j
    detS = max(det(S), 1e-12);
    L(j) = exp(-0.5 * (y' / S * y)) / sqrt((2*pi)^2 * detS);
end

%% ---- 3. model probabilities -------------------------------------------
mu = cbar .* L;
s  = sum(mu);
if s > 1e-300
    filt.mu = mu / s;
else
    filt.mu = ones(NM,1)/NM;            % all models surprised: reset
end

%% ---- 4. combine --------------------------------------------------------
[~, iBase] = max(filt.mu);
base = filt.x(4, iBase);
xc = zeros(5,1);
for j = 1:NM
    xj = filt.x(:,j);
    xj(4) = base + wrapToPiLocal(xj(4) - base);
    xc = xc + filt.mu(j)*xj;
end
xc(4)   = wrapToPiLocal(xc(4));
filt.xc = xc;
filt.age = filt.age + 1;
end

% ----------------------------------------------------------------------
function a = wrapToPiLocal(a)
a = mod(a + pi, 2*pi) - pi;
end
