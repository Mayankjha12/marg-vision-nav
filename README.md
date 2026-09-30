# MARGDRISHTI AI — SIH 2026 Project Repository

This repository contains the complete prototype dashboard, simulation architecture, and measured closed-loop data for **MARGDRISHTI AI**.

## 1. Project Information

- **Project Title:** MARGDRISHTI AI — Autonomous Driving Demo
- **PS ID:** SIH26037
- **PS Title:** Adaptive Path Planning and Collision Avoidance for Autonomous Vehicles on Unstructured Indian Roads
- **Category:** Software
- **Theme:** Smart Vehicles

## 2. Problem Statement

Indian road environments present severe autonomous navigation challenges due to missing or unreliable lane markings, diverse mixed-traffic road users sharing space, dynamic and sudden pedestrian/animal movements, and unpredictable traffic behaviors.

## 3. Proposed Solution

MARGDRISHTI AI is a lane-independent, dynamic path planning and collision avoidance prototype specifically engineered for unstructured Indian road conditions. The system integrates multi-sensor fusion (Camera + LiDAR + Radar) with short-term motion prediction and dynamic replanning to maintain safe, real-time navigation without relying on formal lane boundaries.

## 4. Key Features

- **Multi-Sensor Perception & Fusion:** Combines Camera, LiDAR, and Radar for reliable tracking under unstructured mixed traffic.
- **Short-Term Motion Prediction:** Uses IMM (Interacting Multiple Model) tracking to predict non-lane-based trajectories of nearby vehicles, pedestrians, and animals.
- **Lane-Independent Adaptive Planning:** Generates collision-free trajectories on roads with missing, unclear, or non-existent lane markings.
- **Real-Time Dynamic Replanning:** Executes dynamic collision checking to instantly adapt trajectories during sudden obstacles or informal merges.
- **Vehicle Dynamics Awareness:** Ensures generated paths comply with physical bicycle-model turning limits and curvature constraints.
- **Live Run Replay:** The dashboard can pull and display any one of the 50 real recorded simulation runs on demand — every number shown is sampled from actual measured data, not hardcoded.
- **In-Browser Live Perception Demo:** A TensorFlow.js object-detection model runs directly on the recorded scenario footage, drawing live bounding boxes to demonstrate the perception layer in real time.

## 5. Technology Stack

- **Frontend & Dashboard:** Next.js, React, Tailwind CSS, Vite, Framer Motion, TanStack Router, Recharts
- **In-Browser ML:** TensorFlow.js, COCO-SSD
- **Simulation & Control Framework:** MATLAB, Simulink, RoadRunner
- **Toolboxes & Libraries:** Automated Driving Toolbox, Navigation Toolbox, Stateflow, Vehicle Dynamics Blockset, Deep Learning Toolbox
- **Deployment Platform:** Vercel

## 6. Architecture

```text
[ Camera + LiDAR + Radar ]
           |
           v
   Perception & Fusion
           |
           v
   Motion Prediction (IMM Tracker)
           |
           v
   Adaptive Path Planner (Hybrid A* / Frenet Cascade)
           |
           v
   Vehicle Control & Dynamics (Simulink Bicycle Model)
           |
           v
   Feedback Loop / Dynamic Replanning
```

## 7. Repository Structure

```text
marg-vision-nav/
├── README.md
├── package.json
├── vite.config.ts
├── public/
│   ├── favicon.svg
│   ├── VID-20260909-WA0103.mp4
│   ├── VID-20260909-WA0104.mp4
│   ├── VID-20260909-WA0105.mp4
│   ├── VID-20260909-WA0106.mp4
│   └── VID-20260909-WA0107.mp4
├── MATLAB_CODE/
│   └── Adaptive_Planner 2/
│       ├── core/          # planner, tracker, sensor & vehicle model source
│       └── test/          # run_all.m harness, results.csv, scenario videos
├── src/
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── scenarios.tsx
│   │   ├── perception.tsx
│   │   ├── planning.tsx
│   │   └── performance.tsx
│   ├── components/
│   │   ├── margdrishti.tsx
│   │   ├── live-perception.tsx
│   │   └── run-replay.tsx
│   └── data/
│       └── simulation-runs.ts
└── submissions/
    ├── final_edited_video.mp4
    └── team Server Down (2).pdf
```

## 8. Measured Performance Results

- **Prediction Accuracy:** 32x error reduction using IMM (Interacting Multiple Model) tracker — 0.59m mean tracking error at 3s horizon vs 19.10m for single constant-velocity Kalman filter baseline.
- **Planner Speedup:** 249x execution speedup achieved in Hybrid A* planner (reduced compute time from 10,505 ms down to 42.2 ms via precomputed arc lookup & heuristic struct optimization).
- **Replanning Latency:** Mean end-to-end replan latency of 10.7 ms under real-time sensor processing loads; worst-case latency bounded at 305.6 ms in dense field scenarios, safely handled by single-cycle path-hold fallback logic.
- **Sensor Range & Tracking Probability:** Multi-modal envelope tracking supporting LiDAR (40m depth geometry), Radar (120m millimeter-wave velocity vectoring), and Camera (60m contextual vision) with a 0.90–0.96 detection probability envelope.
- **Track ID Churn Optimization:** Reduced track fragmentation fourfold (from 25.8 down to 6.4 average ID switches) by raising confirmation thresholds from 2 to 3 consecutive hits under agent occlusion.
- **Kinematic Feasibility:** 100% trajectory compliance with physical bicycle-model turning limits (minimum radius 4.1m) and 0.329m mean tracking error under controller envelopes across 50 closed-loop MATLAB simulation runs.
- **Overall Scenario Completion:** 54% across 5 scenarios × 10 random seeds (50 total runs). Completion varies by scenario — Village Road (90%) and Highway Merge (80%) perform strongly; Urban Intersection (40%), Dense Market (20%), and Cattle Crossing (40%) are harder due to higher agent density and occlusion, and are reported here unmodified.

## 9. Setup & Local Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Mayankjha12/marg-vision-nav.git
cd marg-vision-nav
```

### Step 2: Verify Node.js Environment

Make sure you have **Node.js (v18.0.0 or higher)** and **npm** installed.

```bash
node -v
npm -v
```

### Step 3: Install Project Dependencies

```bash
npm install
```

### Step 4: Launch Local Development Server

```bash
npm run dev
```

The application will be available at the local URL displayed in the terminal, typically:

```text
http://localhost:3000
```

### Step 5: Reproduce the Measured Results (optional)

To regenerate `results.csv` from scratch (5 scenarios × 10 seeds, ~10–20 minutes):

```matlab
cd MATLAB_CODE/Adaptive_Planner 2/test
run_all
```

## 10. Future Scope

- Integration with real-world CAN-bus vehicle telemetry for hardware-in-the-loop (HIL) testing.
- Extension of edge computing optimisations to deploy directly onto NVIDIA Jetson Orin hardware.
- Real-time V2X communication layer integration for cooperative agent scenarios.
