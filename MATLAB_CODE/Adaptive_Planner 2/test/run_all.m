%RUN_ALL  Batch harness: every scenario, every seed, no animation.
%
%   Usage:  cd D:\Adaptive_Planner\test
%           run_all
%
%   THIS PRODUCES YOUR RESULTS SECTION. The problem statement asks for
%   "scenario completion rate" -- that is a rate, which means many runs,
%   not one lucky pass. Each seed changes the sensor noise, the missed
%   detections and the false alarms, so the same scenario is tested
%   against different perception failures each time.
%
%   Writes results.csv next to this file. Expect roughly 10-20 minutes
%   for 5 scenarios x 10 seeds depending on your machine.

clear; clc; close all;
addpath(fullfile(fileparts(mfilename('fullpath')), '..', 'core'));

p     = params();
sc    = scenarios();
SEEDS = 1:10;

opts.animate = false;
opts.video   = false;

nS = numel(sc);
nR = numel(SEEDS);
R  = cell(nS*nR, 1);
i  = 0;

tAll = tic;
for si = 1:nS
    fprintf('%-22s ', sc(si).name);
    for sd = SEEDS
        i = i + 1;
        R{i} = runScenario(sc(si), sd, opts, p);
        if R{i}.completed
            fprintf('.');
        elseif R{i}.collided
            fprintf('X');           % collision
        else
            fprintf('o');           % did not reach the goal
        end
    end
    fprintf('\n');
end
fprintf('\ntotal wall time: %.1f min\n\n', toc(tAll)/60);

Rs = [R{:}];

%% ---- per-scenario summary ---------------------------------------------
fprintf('%-20s  %5s %6s %6s %7s %7s %8s %7s\n', ...
        'scenario','compl','coll','static','minClr','latMean','latMax','fail%');
fprintf('%s\n', repmat('-',1,78));

for si = 1:nS
    m = strcmp({Rs.scenario}, sc(si).name);
    r = Rs(m);
    fprintf('%-20s  %4.0f%% %5d %6d %6.2f %7.1f %8.1f %7.1f\n', ...
        sc(si).name, ...
        100*mean([r.completed]), ...
        sum([r.collided]), ...
        sum([r.staticHits] > 0), ...
        mean([r.minClear]), ...
        mean([r.latMean]), ...
        max([r.latMax]), ...
        mean([r.failPct]));
end

fprintf('%s\n', repmat('-',1,78));
fprintf('%-20s  %4.0f%% %5d %6d %6.2f %7.1f %8.1f %7.1f\n', 'OVERALL', ...
    100*mean([Rs.completed]), sum([Rs.collided]), sum([Rs.staticHits] > 0), ...
    mean([Rs.minClear]), mean([Rs.latMean]), max([Rs.latMax]), mean([Rs.failPct]));

%% ---- planner split -----------------------------------------------------
fprintf('\nplanner usage by scenario (%% of replans):\n');
fprintf('%-20s %8s %8s %8s\n','scenario','Frenet','A*','fail');
for si = 1:nS
    m = strcmp({Rs.scenario}, sc(si).name);
    r = Rs(m);
    fprintf('%-20s %7.0f%% %7.0f%% %7.0f%%\n', sc(si).name, ...
        mean([r.frenetPct]), mean([r.astarPct]), mean([r.failPct]));
end

%% ---- behaviour occupancy ----------------------------------------------
fprintf('\nbehaviour state occupancy (%%):\n');
fprintf('%-20s %8s %8s\n','scenario','CREEP','ESTOP');
for si = 1:nS
    m = strcmp({Rs.scenario}, sc(si).name);
    r = Rs(m);
    fprintf('%-20s %7.1f%% %7.1f%%\n', sc(si).name, ...
            mean([r.pctCreep]), mean([r.pctEstop]));
end

%% ---- csv ---------------------------------------------------------------
Tb = table({Rs.scenario}', [Rs.seed]', [Rs.completed]', [Rs.collided]', [Rs.staticHits]', ...
           [Rs.reached]', [Rs.duration]', [Rs.minClear]', [Rs.maxCell]', ...
           [Rs.meanSpeed]', [Rs.replans]', [Rs.frenetPct]', [Rs.astarPct]', ...
           [Rs.failPct]', [Rs.latMean]', [Rs.latP95]', [Rs.latMax]', ...
           [Rs.meanDets]', [Rs.meanTracks]', [Rs.distinctID]', [Rs.nAgents]', ...
    'VariableNames', {'scenario','seed','completed','collided','staticHits','reached', ...
      'duration','minClear','maxCell','meanSpeed','replans','frenetPct', ...
      'astarPct','failPct','latMean','latP95','latMax','meanDets', ...
      'meanTracks','distinctID','nAgents'});

csvPath = fullfile(fileparts(mfilename('fullpath')), 'results.csv');
writetable(Tb, csvPath);
fprintf('\nwrote %s  (%d rows)\n', csvPath, height(Tb));

%% ---- figure -------------------------------------------------------------
figure('Name','Results across scenarios','Position',[60 60 1150 400],'Color','w');
names = {sc.name};

subplot(1,3,1);
cr = arrayfun(@(i) 100*mean([Rs(strcmp({Rs.scenario},names{i})).completed]), 1:nS);
bar(cr); ylim([0 105]); grid on;
set(gca,'XTickLabel',strrep(names,'_','\_'),'XTickLabelRotation',35);
ylabel('%'); title('Scenario completion rate');

subplot(1,3,2);
mc = arrayfun(@(i) mean([Rs(strcmp({Rs.scenario},names{i})).minClear]), 1:nS);
bar(mc); grid on;
set(gca,'XTickLabel',strrep(names,'_','\_'),'XTickLabelRotation',35);
ylabel('m'); title('Mean minimum clearance');

subplot(1,3,3);
lm = arrayfun(@(i) mean([Rs(strcmp({Rs.scenario},names{i})).latMean]), 1:nS);
lx = arrayfun(@(i) max([Rs(strcmp({Rs.scenario},names{i})).latMax]),  1:nS);
bar([lm(:) lx(:)]); grid on; yline(100,'r--','budget');
set(gca,'XTickLabel',strrep(names,'_','\_'),'XTickLabelRotation',35);
legend('mean','worst','Location','best');
ylabel('ms'); title('Replan latency');