
 
export type SimulationRun = {
  scenario: "village_road" | "urban_intersection" | "highway_merge" | "dense_market" | "cattle_crossing";
  seed: number;
  completed: boolean;
  collided: boolean;
  duration: number;
  minClear: number;
  latMean: number;
  latMax: number;
  nAgents: number;
};
 
export const scenarioDisplayNames: Record<SimulationRun["scenario"], string> = {
  village_road: "Village Road",
  urban_intersection: "Urban Intersection",
  highway_merge: "Highway Merge",
  dense_market: "Dense Market",
  cattle_crossing: "Cattle Crossing",
};
 
export const simulationRuns: SimulationRun[] = [
  { scenario: "village_road", seed: 1, completed: true, collided: false, duration: 22.3, minClear: 6.03, latMean: 14.9, latMax: 132.4, nAgents: 4 },
  { scenario: "village_road", seed: 2, completed: false, collided: false, duration: 31.9, minClear: 6.04, latMean: 14.1, latMax: 120.3, nAgents: 4 },
  { scenario: "village_road", seed: 3, completed: true, collided: false, duration: 33.0, minClear: 6.56, latMean: 11.2, latMax: 79.8, nAgents: 4 },
  { scenario: "village_road", seed: 4, completed: true, collided: false, duration: 25.7, minClear: 2.41, latMean: 10.7, latMax: 83.5, nAgents: 4 },
  { scenario: "village_road", seed: 5, completed: true, collided: false, duration: 24.2, minClear: 3.38, latMean: 9.9, latMax: 84.7, nAgents: 4 },
  { scenario: "village_road", seed: 6, completed: true, collided: false, duration: 28.3, minClear: 2.96, latMean: 9.9, latMax: 87.4, nAgents: 4 },
  { scenario: "village_road", seed: 7, completed: true, collided: false, duration: 22.0, minClear: 6.68, latMean: 10.6, latMax: 75.9, nAgents: 4 },
  { scenario: "village_road", seed: 8, completed: true, collided: false, duration: 20.1, minClear: 6.68, latMean: 10.9, latMax: 86.9, nAgents: 4 },
  { scenario: "village_road", seed: 9, completed: true, collided: false, duration: 24.3, minClear: 6.43, latMean: 9.7, latMax: 83.6, nAgents: 4 },
  { scenario: "village_road", seed: 10, completed: true, collided: false, duration: 20.9, minClear: 6.44, latMean: 9.7, latMax: 70.4, nAgents: 4 },
  { scenario: "urban_intersection", seed: 1, completed: false, collided: true, duration: 25.9, minClear: 0.93, latMean: 10.8, latMax: 92.1, nAgents: 5 },
  { scenario: "urban_intersection", seed: 2, completed: false, collided: true, duration: 26.6, minClear: 0.18, latMean: 7.8, latMax: 93.1, nAgents: 5 },
  { scenario: "urban_intersection", seed: 3, completed: false, collided: true, duration: 30.6, minClear: 0.18, latMean: 5.2, latMax: 81.3, nAgents: 5 },
  { scenario: "urban_intersection", seed: 4, completed: false, collided: true, duration: 33.1, minClear: 0.24, latMean: 8.1, latMax: 87.4, nAgents: 5 },
  { scenario: "urban_intersection", seed: 5, completed: false, collided: true, duration: 30.7, minClear: 0.78, latMean: 8.4, latMax: 88.7, nAgents: 5 },
  { scenario: "urban_intersection", seed: 6, completed: true, collided: false, duration: 25.7, minClear: 1.41, latMean: 8.3, latMax: 78.0, nAgents: 5 },
  { scenario: "urban_intersection", seed: 7, completed: false, collided: true, duration: 35.8, minClear: 0.67, latMean: 7.9, latMax: 94.3, nAgents: 5 },
  { scenario: "urban_intersection", seed: 8, completed: true, collided: false, duration: 30.4, minClear: 2.80, latMean: 11.2, latMax: 91.9, nAgents: 5 },
  { scenario: "urban_intersection", seed: 9, completed: true, collided: false, duration: 33.2, minClear: 2.70, latMean: 9.2, latMax: 77.1, nAgents: 5 },
  { scenario: "urban_intersection", seed: 10, completed: true, collided: false, duration: 32.3, minClear: 4.04, latMean: 9.9, latMax: 88.5, nAgents: 5 },
  { scenario: "highway_merge", seed: 1, completed: false, collided: true, duration: 29.3, minClear: 0.02, latMean: 7.1, latMax: 77.4, nAgents: 4 },
  { scenario: "highway_merge", seed: 2, completed: true, collided: false, duration: 27.9, minClear: 3.33, latMean: 9.3, latMax: 80.8, nAgents: 4 },
  { scenario: "highway_merge", seed: 3, completed: true, collided: false, duration: 29.1, minClear: 6.43, latMean: 6.5, latMax: 79.5, nAgents: 4 },
  { scenario: "highway_merge", seed: 4, completed: true, collided: false, duration: 27.6, minClear: 5.16, latMean: 14.6, latMax: 86.3, nAgents: 4 },
  { scenario: "highway_merge", seed: 5, completed: false, collided: false, duration: 36.0, minClear: 5.55, latMean: 5.7, latMax: 77.0, nAgents: 4 },
  { scenario: "highway_merge", seed: 6, completed: true, collided: false, duration: 27.4, minClear: 3.66, latMean: 7.8, latMax: 80.3, nAgents: 4 },
  { scenario: "highway_merge", seed: 7, completed: true, collided: false, duration: 28.5, minClear: 9.55, latMean: 14.1, latMax: 101.1, nAgents: 4 },
  { scenario: "highway_merge", seed: 8, completed: true, collided: false, duration: 28.7, minClear: 4.75, latMean: 11.8, latMax: 88.6, nAgents: 4 },
  { scenario: "highway_merge", seed: 9, completed: true, collided: false, duration: 30.7, minClear: 3.81, latMean: 7.8, latMax: 79.5, nAgents: 4 },
  { scenario: "highway_merge", seed: 10, completed: true, collided: false, duration: 30.1, minClear: 3.33, latMean: 13.9, latMax: 108.3, nAgents: 4 },
  { scenario: "dense_market", seed: 1, completed: false, collided: true, duration: 39.1, minClear: 0.07, latMean: 11.8, latMax: 78.0, nAgents: 9 },
  { scenario: "dense_market", seed: 2, completed: false, collided: true, duration: 40.5, minClear: 1.15, latMean: 32.3, latMax: 305.6, nAgents: 9 },
  { scenario: "dense_market", seed: 3, completed: false, collided: true, duration: 36.2, minClear: 0.08, latMean: 30.7, latMax: 253.5, nAgents: 9 },
  { scenario: "dense_market", seed: 4, completed: true, collided: false, duration: 37.2, minClear: 2.29, latMean: 31.9, latMax: 292.3, nAgents: 9 },
  { scenario: "dense_market", seed: 5, completed: false, collided: true, duration: 42.6, minClear: 0.02, latMean: 9.9, latMax: 86.4, nAgents: 9 },
  { scenario: "dense_market", seed: 6, completed: false, collided: true, duration: 42.2, minClear: 1.29, latMean: 10.1, latMax: 84.0, nAgents: 9 },
  { scenario: "dense_market", seed: 7, completed: false, collided: false, duration: 38.1, minClear: 2.71, latMean: 8.7, latMax: 66.6, nAgents: 9 },
  { scenario: "dense_market", seed: 8, completed: false, collided: true, duration: 28.4, minClear: 0.08, latMean: 14.5, latMax: 82.4, nAgents: 9 },
  { scenario: "dense_market", seed: 9, completed: false, collided: true, duration: 50.4, minClear: 0.21, latMean: 11.9, latMax: 92.6, nAgents: 9 },
  { scenario: "dense_market", seed: 10, completed: true, collided: false, duration: 33.2, minClear: 3.98, latMean: 10.8, latMax: 94.3, nAgents: 9 },
  { scenario: "cattle_crossing", seed: 1, completed: false, collided: true, duration: 31.6, minClear: 0.01, latMean: 5.2, latMax: 79.9, nAgents: 4 },
  { scenario: "cattle_crossing", seed: 2, completed: false, collided: true, duration: 23.8, minClear: 1.96, latMean: 12.8, latMax: 257.2, nAgents: 4 },
  { scenario: "cattle_crossing", seed: 3, completed: true, collided: false, duration: 28.7, minClear: 2.94, latMean: 9.6, latMax: 74.1, nAgents: 4 },
  { scenario: "cattle_crossing", seed: 4, completed: true, collided: false, duration: 32.4, minClear: 3.02, latMean: 7.6, latMax: 78.1, nAgents: 4 },
  { scenario: "cattle_crossing", seed: 5, completed: false, collided: true, duration: 36.0, minClear: 0.27, latMean: 5.8, latMax: 82.3, nAgents: 4 },
  { scenario: "cattle_crossing", seed: 6, completed: false, collided: true, duration: 30.0, minClear: 0.55, latMean: 7.6, latMax: 81.3, nAgents: 4 },
  { scenario: "cattle_crossing", seed: 7, completed: false, collided: true, duration: 19.2, minClear: 0.07, latMean: 4.6, latMax: 22.9, nAgents: 4 },
  { scenario: "cattle_crossing", seed: 8, completed: true, collided: false, duration: 13.4, minClear: 6.13, latMean: 3.5, latMax: 51.7, nAgents: 4 },
  { scenario: "cattle_crossing", seed: 9, completed: true, collided: false, duration: 27.6, minClear: 5.26, latMean: 6.4, latMax: 78.4, nAgents: 4 },
  { scenario: "cattle_crossing", seed: 10, completed: false, collided: false, duration: 28.9, minClear: 9.05, latMean: 4.3, latMax: 59.1, nAgents: 4 },
];
