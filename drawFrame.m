function drawFrame(sc, gi, cost, ref, state, pathX, pathY, nPts, trailX, trailY, nTrail, ...
                   agents, agRad, tpos, nTrk, preds, bhv, whichPlanner, t, lat, minDist, p)
%DRAWFRAME  Presentation-quality rendering for the demonstration video.
%
%   Same data as the debug plot, drawn so a judge can follow it without
%   narration: a road surface instead of a grey matrix, vehicle-shaped
%   vehicles, sensor cones, class-coloured agents, and a heads-up panel.
%
%   Kept separate from runScenario deliberately -- the batch harness runs
%   50 times with no figure at all, and rendering has no business being
%   entangled with the simulation loop.
%
%   NOTE ON TRANSPARENCY: the risk-field overlay uses per-image AlphaData,
%   NOT the alpha() function. alpha() applies to every patch in the axes,
%   which washes out the vehicle, the obstacles and the HUD text along
%   with it.

ROAD  = [0.82 0.82 0.83];
EARTH = [0.76 0.71 0.62];
OBST  = [0.26 0.27 0.30];
EGO   = [0.10 0.35 0.75];
PATHC = [0.00 0.72 0.85];
TRAIL = [0.16 0.40 0.85];
PRED  = [0.80 0.15 0.55];

cla; hold on;
W = gi.nx*gi.res;  H = gi.ny*gi.res;
xl = [gi.origin(1) gi.origin(1)+W];
yl = [gi.origin(2) gi.origin(2)+H];

%% ---- ground -----------------------------------------------------------
rectangle('Position',[xl(1) yl(1) W H],'FaceColor',ROAD,'EdgeColor','none');

%% ---- risk field --------------------------------------------------------
% Everything above free but below lethal, as a red wash whose opacity
% tracks the cost. This is the layer a viewer most needs to see moving,
% and it must not obscure what is underneath.
risk = cost;
risk(risk >= 250) = 0;                    % obstacles are drawn as solids
% The hysteresis layer adds a uniform 30 within 35 m of the vehicle. It is
% a planning bias, not a hazard, and washing half the map red for it makes
% the genuine risk field unreadable. Filter it out.
risk(risk < 45)   = 0;
img = zeros(gi.ny, gi.nx, 3);
img(:,:,1) = 0.90;  img(:,:,2) = 0.25;  img(:,:,3) = 0.20;
image('XData',xl,'YData',yl,'CData',img, ...
      'AlphaData', min(0.62, risk/255*1.5));

%% ---- static obstacles --------------------------------------------------
for k = 1:size(sc.staticObs,1)
    o = sc.staticObs(k,:);
    rectangle('Position',[o(1) o(2) o(3)-o(1) o(4)-o(2)], ...
              'FaceColor',OBST,'EdgeColor',[0.12 0.12 0.14],'LineWidth',1.0);
end

%% ---- centreline --------------------------------------------------------
if sc.hasRef && ~isempty(ref)
    m = ref.x <= sc.refEndsAt;
    plot(ref.x(m), ref.y(m), '-',  'Color',[1 1 1], 'LineWidth',3);
    plot(ref.x(m), ref.y(m), '--', 'Color',[0.45 0.45 0.45], 'LineWidth',1.2);
end

%% ---- sensor cones ------------------------------------------------------
% Camera and radar only. Lidar is 360 degrees and would just be a disc.
% Drawn faintly so a viewer can see WHY an agent is or is not tracked.
for si = 1:2
    cfg = p.sns(si);
    sx = state(1) + cfg.mountX*cos(state(3));
    sy = state(2) + cfg.mountX*sin(state(3));
    R  = min(cfg.maxRange, 38);
    a  = linspace(-cfg.fov/2, cfg.fov/2, 28) + state(3);
    fill([sx, sx+R*cos(a)], [sy, sy+R*sin(a)], [0.20 0.60 1.0], ...
         'FaceAlpha',0.09,'EdgeColor',[0.20 0.60 1.0], ...
         'EdgeAlpha',0.30,'LineWidth',0.8);
end

%% ---- predictions -------------------------------------------------------
for i = 1:nTrk
    plot(preds(i).px, preds(i).py, ':', 'Color',PRED, 'LineWidth',2);
    plot(preds(i).px(end), preds(i).py(end), 'o', 'Color',PRED, ...
         'MarkerSize',4, 'MarkerFaceColor',PRED);
end

%% ---- trail and plan ----------------------------------------------------
if nTrail > 1
    plot(trailX(1:nTrail), trailY(1:nTrail), '-', 'Color',TRAIL, 'LineWidth',2.4);
end
if nPts > 2
    plot(pathX(1:nPts), pathY(1:nPts), '-', 'Color',PATHC, 'LineWidth',3.4);
end

%% ---- agents ------------------------------------------------------------
% Drawn at a minimum visual size. A 0.5 m pedestrian is two pixels across
% at this zoom and simply disappears, so small agents get a marker larger
% than their true radius, with the true radius shown as a thin ring.
for a = 1:numel(agents)
    z   = agents(a).fn(t);
    cid = agents(a).classID;
    [col, lbl] = classStyle(cid);
    rTrue = agRad(a);
    rDraw = max(rTrue, 1.15);
    th = linspace(0,2*pi,26);
    fill(z(1)+rDraw*cos(th), z(2)+rDraw*sin(th), col, ...
         'EdgeColor',[1 1 1],'LineWidth',1.3,'FaceAlpha',0.95);
    if rTrue < rDraw - 0.05
        plot(z(1)+rTrue*cos(th), z(2)+rTrue*sin(th), '-', ...
             'Color',[1 1 1 0.5], 'LineWidth',0.6);
    end
    text(z(1), z(2)+rDraw+1.3, lbl, 'FontSize',7.5, 'Color',col*0.7, ...
         'HorizontalAlignment','center','FontWeight','bold');
end

%% ---- confirmed tracks --------------------------------------------------
for i = 1:nTrk
    plot(tpos(i,1), tpos(i,2), 'o', 'MarkerSize',13, ...
         'MarkerEdgeColor',[0.05 0.55 0.15], 'LineWidth',2);
end

%% ---- ego vehicle -------------------------------------------------------
drawCar(state, p, EGO);

%% ---- goal --------------------------------------------------------------
plot(sc.goal(1), sc.goal(2), 'p', 'MarkerSize',22, ...
     'MarkerFaceColor',[0.10 0.72 0.28], 'MarkerEdgeColor','w', 'LineWidth',1.4);

%% ---- axes --------------------------------------------------------------
axis equal;  axis([xl yl]);
set(gca,'Color',EARTH,'XColor',[0.35 0.35 0.35],'YColor',[0.35 0.35 0.35], ...
        'Layer','top','FontSize',8);
box on;
xlabel('x [m]'); ylabel('y [m]');

%% ---- HUD ---------------------------------------------------------------
names = {'LANE FOLLOW','UNSTRUCTURED','YIELD','CREEP','MERGE','EMERGENCY STOP'};
stcol = {[0.10 0.55 0.18],[0.15 0.40 0.78],[0.85 0.60 0.05],[0.90 0.42 0.05], ...
         [0.45 0.25 0.65],[0.82 0.08 0.08]};

pw = W*0.285;  ph = H*0.25;
px0 = xl(2)-pw-1.5;  py0 = yl(2)-ph-1.5;
rectangle('Position',[px0 py0 pw ph],'FaceColor',[1 1 1], ...
          'EdgeColor',[0.45 0.45 0.45],'LineWidth',1.0);

row = @(r) py0 + ph - 2.2 - r*2.55;
text(px0+1.6, row(0), strrep(sc.name,'_',' '), 'FontSize',10, ...
     'FontWeight','bold','Color','k','VerticalAlignment','middle');
text(px0+1.6, row(1), sprintf('t %.1f s      v %.1f m/s', t, state(4)), ...
     'FontSize',8.5,'Color','k','VerticalAlignment','middle');
text(px0+1.6, row(2), sprintf('planner  %s', whichPlanner), ...
     'FontSize',8.5,'Color','k','VerticalAlignment','middle');
text(px0+1.6, row(3), sprintf('replan %.0f ms    clear %.1f m', lat, minDist), ...
     'FontSize',8.5,'Color','k','VerticalAlignment','middle');
text(px0+1.6, row(4), names{bhv.stateID}, 'FontSize',10,'FontWeight','bold', ...
     'Color',stcol{bhv.stateID},'VerticalAlignment','middle');

%% ---- progress bar ------------------------------------------------------
prog = min(1, max(0, (state(1)-sc.start(1)) / max(1e-6, sc.goal(1)-sc.start(1))));
bw = W*0.5;  bx = xl(1)+1.5;  by = yl(1)+1.4;
rectangle('Position',[bx by bw 1.5],'FaceColor',[1 1 1],'EdgeColor',[0.45 0.45 0.45]);
if prog > 0.005
    rectangle('Position',[bx by bw*prog 1.5], ...
              'FaceColor',[0.10 0.72 0.28],'EdgeColor','none');
end
end

%% ======================================================================
function [col, lbl] = classStyle(cid)
switch cid
    case 1, col = [0.85 0.33 0.10]; lbl = 'car';
    case 2, col = [0.50 0.18 0.55]; lbl = 'bus/truck';
    case 3, col = [0.93 0.70 0.05]; lbl = 'auto';
    case 4, col = [0.15 0.60 0.32]; lbl = 'two-wheeler';
    case 5, col = [0.88 0.10 0.12]; lbl = 'pedestrian';
    case 6, col = [0.50 0.32 0.12]; lbl = 'animal';
    case 7, col = [0.38 0.38 0.40]; lbl = 'cart';
    otherwise, col = [0.45 0.45 0.45]; lbl = 'unknown';
end
end

function drawCar(state, p, col)
L = p.veh.length;  W = p.veh.width;
b = [ 0.0 -W/2;  L*0.82 -W/2;  L -W*0.36;  L W*0.36;  L*0.82 W/2;  0.0 W/2 ]';
R = [cos(state(3)) -sin(state(3)); sin(state(3)) cos(state(3))];
b = R*b + [state(1); state(2)];
fill(b(1,:), b(2,:), col, 'EdgeColor',[1 1 1], 'LineWidth',1.8);

% windscreen, so heading reads at a glance
w = [ L*0.44 -W*0.34; L*0.68 -W*0.30; L*0.68 W*0.30; L*0.44 W*0.34 ]';
w = R*w + [state(1); state(2)];
fill(w(1,:), w(2,:), [0.70 0.86 1.0], 'EdgeColor','none');
end