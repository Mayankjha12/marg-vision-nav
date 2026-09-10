# MARGDRISHTI AI — SIH 2026 Project Repository

This repository contains the complete prototype dashboard, simulation architecture, and measured closed-loop data for **MARGDRISHTI AI**.

## 1. Project Information

- **Project Title:** MARGDRISHTI AI — Autonomous Driving Demo[cite: 1]
- **PS ID:** SIH26037[cite: 1]
- **PS Title:** Adaptive Path Planning and Collision Avoidance for Autonomous Vehicles on Unstructured Indian Roads[cite: 1]
- **Category:** Software[cite: 1]
- **Theme:** Smart Vehicles[cite: 1]

## 2. Problem Statement

Indian road environments present severe autonomous navigation challenges due to missing or unreliable lane markings, diverse mixed-traffic road users sharing space, dynamic and sudden pedestrian/animal movements, and unpredictable traffic behaviors[cite: 1].

## 3. Proposed Solution

MARGDRISHTI AI is a lane-independent, dynamic path planning and collision avoidance prototype specifically engineered for unstructured Indian road conditions[cite: 1]. The system integrates multi-sensor fusion (Camera + LiDAR + Radar) with short-term motion prediction and dynamic replanning to maintain safe, real-time navigation without relying on formal lane boundaries[cite: 1].

## 4. Key Features

- **Multi-Sensor Perception & Fusion:** Combines Camera, LiDAR, and Radar for reliable tracking under unstructured mixed traffic[cite: 1].
- **Short-Term Motion Prediction:** Uses IMM (Interacting Multiple Model) tracking to predict non-lane-based trajectories of nearby vehicles, pedestrians, and animals[cite: 1].
- **Lane-Independent Adaptive Planning:** Generates collision-free trajectories on roads with missing, unclear, or non-existent lane markings[cite: 1].
- **Real-Time Dynamic Replanning:** Executes dynamic collision checking to instantly adapt trajectories during sudden obstacles or informal merges[cite: 1].
- **Vehicle Dynamics Awareness:** Ensures generated paths comply with physical bicycle-model turning limits and curvature constraints[cite: 1].

## 5. Technology Stack

- **Frontend & Dashboard:** Next.js, React, Tailwind CSS, Vite, Framer Motion, TanStack Router[cite: 1]
- **Simulation & Control Framework:** MATLAB, Simulink, RoadRunner[cite: 1]
- **Toolboxes & Libraries:** Automated Driving Toolbox, Navigation Toolbox, Stateflow, Vehicle Dynamics Blockset, Deep Learning Toolbox[cite: 1]
- **Deployment Platform:** Vercel[cite: 1]

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

marg-vision-nav/
├── README.md
├── package.json
├── vite.config.ts
├── public/
│   ├── VID-20260909-WA0103.mp4
│   ├── VID-20260909-WA0104.mp4
│   ├── VID-20260909-WA0105.mp4
│   ├── VID-20260909-WA0106.mp4
│   └── VID-20260909-WA0107.mp4
├── src/
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── scenarios.tsx
│   │   ├── perception.tsx
│   │   ├── planning.tsx
│   │   └── performance.tsx
│   └── components/
│       └── margdrishti.tsx
└── submission/
    ├── PRESENTATION.md
    └── DEMO.md

## 8. Measured Performance Results

- **Prediction Accuracy:** 32x error reduction using IMM tracker (0.59m mean error at 3s horizon vs 19.10m for single constant-velocity Kalman filter).
- **Planner Speedup:** 249x execution speedup in Hybrid A* planner (10,505 ms down to 42.2 ms via struct lookup optimization).
- **Replanning Latency:** Mean replan latency of 10.7 ms (305.6 ms worst-case in dense field scenarios, safely bounded by path-hold fallback).
- **Sensor Range & Probability:** LiDAR 40m, Radar 120m, Camera 60m with a 0.90–0.96 detection probability envelope.

## 9. Setup & Local Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/Mayankjha12/marg-vision-nav.git](https://github.com/Mayankjha12/marg-vision-nav.git)
   cd marg-vision-nav


## 10. Future Scope
- Integration with real-world CAN-bus vehicle telemetry for hardware-in-the-loop (HIL) testing.
- Extension of edge computing optimisations to deploy directly onto NVIDIA Jetson Orin hardware.
- Real-time V2X communication layer integration for cooperative agent scenarios.
