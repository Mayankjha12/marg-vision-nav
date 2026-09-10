# PathPlanner Pro

Build a polished, highly visual demo dashboard for an autonomous driving prototype called:

"MARGDRISHTI AI"

Adaptive Path Planning & Collision Avoidance for Unstructured Indian Roads

IMPORTANT:

This is a DEMONSTRATION / VISUALIZATION dashboard for a Smart India Hackathon prototype.

Do NOT present it as a real deployed autonomous vehicle.

Do NOT invent performance numbers.

Use ONLY the measured results provided below.

==================================================

1. OVERALL DESIGN

==================================================

Create a premium futuristic autonomous-driving dashboard.

Style:

- Dark automotive / engineering aesthetic

- Black / deep navy background

- Cyan/blue highlights

- Green for SAFE

- Red/orange for WARNING/HIGH RISK

- Glassmorphism cards

- Subtle grid background

- Clean modern typography

- Smooth animations

- Professional enough for an SIH jury demonstration

The UI should feel like an autonomous vehicle control center, NOT a generic admin dashboard.

Fully responsive desktop-first design.

==================================================

2. MAIN DASHBOARD

==================================================

Header:

MARGDRISHTI AI

Adaptive Path Planning & Collision Avoidance

Status badge:

● SIMULATION ACTIVE

Navigation:

Dashboard

Scenarios

Perception

Planning

Performance

==================================================

3. HERO / LIVE SIMULATION AREA

==================================================

Create a large central "LIVE SIMULATION" panel.

Show a stylized top-down Indian road environment.

The autonomous vehicle should be represented by a small futuristic car icon.

Show:

- Road boundaries

- Dynamic vehicles

- Two-wheelers

- Pedestrians

- Cattle

- Pushcart / static obstacle where appropriate

- Current vehicle trajectory

- Predicted trajectories

- Safe planned path

Use animated movement.

The vehicle should visibly follow the safe path.

When a dynamic obstacle approaches the planned path:

1. Highlight obstacle

2. Show "COLLISION RISK"

3. Mark current path as unsafe

4. Animate a new path being generated

5. Vehicle follows the new path

6. Show "REPLANNING COMPLETE"

This is the main visual demonstration.

==================================================

4. SCENARIO SELECTOR

==================================================

Create five scenario cards:

1. Village Road

2. Urban Intersection

3. Highway Merge

4. Dense Market

5. Cattle Crossing

Each card should show:

- Scenario name

- Small visual thumbnail

- Completion rate

- Collision count

- Mean replanning latency

When a scenario is clicked, update the main simulation view and all statistics.

==================================================

5. EXACT MEASURED RESULTS

==================================================

Use these EXACT values:

Village Road:

Completion: 90%

Collisions: 0

Static collisions: 0

Minimum clearance: 5.36 m

Mean latency: 11.1 ms

Maximum latency: 132.4 ms

Failure rate: 7.2%

Urban Intersection:

Completion: 40%

Collisions: 6

Static collisions: 0

Minimum clearance: 1.39 m

Mean latency: 8.7 ms

Maximum latency: 94.3 ms

Failure rate: 12.8%

Highway Merge:

Completion: 80%

Collisions: 1

Static collisions: 0

Minimum clearance: 4.56 m

Mean latency: 9.9 ms

Maximum latency: 108.3 ms

Failure rate: 19.1%

Dense Market:

Completion: 20%

Collisions: 7

Static collisions: 0

Minimum clearance: 1.19 m

Mean latency: 17.3 ms

Maximum latency: 305.6 ms

Failure rate: 16.4%

Cattle Crossing:

Completion: 40%

Collisions: 5

Static collisions: 0

Minimum clearance: 2.93 m

Mean latency: 6.7 ms

Maximum latency: 257.2 ms

Failure rate: 14.5%

OVERALL:

Completion: 54%

Collisions: 19

Static collisions: 0

Minimum clearance: 3.08 m

Mean latency: 10.7 ms

Maximum latency: 305.6 ms

Failure rate: 14.0%

These values represent:

5 scenarios × 10 random seeds = 50 closed-loop runs.

Important:

The random seeds vary sensor noise, missed detections and false alarms.

They do NOT change the traffic pattern.

==================================================

6. LIVE PERCEPTION PANEL

==================================================

Create a right-side "PERCEPTION" panel.

Show animated detected objects such as:

CAR

Distance: 18.2 m

Velocity: 8.4 m/s

TWO-WHEELER

Distance: 11.4 m

Velocity: 5.8 m/s

PEDESTRIAN

Distance: 8.7 m

Velocity: 1.4 m/s

CATTLE

Distance: 6.1 m

Velocity: 0.0 m/s

Clearly label these as SIMULATED DEMONSTRATION VALUES.

Also show sensor sources:

CAMERA

RADAR

LIDAR

with small status indicators.

Do not claim these values are measured results unless explicitly provided.

==================================================

7. MOTION PREDICTION VISUALIZATION

==================================================

Create a "MOTION PREDICTION" section.

Show:

Current position

↓

Predicted trajectory

↓

3 second horizon

Display:

Prediction Horizon

3.0 s

IMM Prediction Error

0.59 m

Constant Velocity Error

19.10 m

Improvement

32×

Show this visually with two trajectory lines:

IMM:

smooth predicted turning trajectory

Constant Velocity:

straight projected trajectory diverging from actual turning trajectory

Add a small explanation:

"Three motion models run in parallel: constant velocity, constant turn rate and constant acceleration. Their probabilities are combined into the final prediction."

Only use this explanation because it is part of the provided technical results.

==================================================

8. PATH PLANNING VISUALIZATION

==================================================

Create a "PATH PLANNER" panel.

Show:

Current Path

SAFE / UNSAFE

Candidate Paths

7

Selected Planner:

Frenet / Hybrid A*

Measured planning values:

Optimised Hybrid A*:

42.2 ms

Frenet:

1.4 ms

Dense unstructured A*:

852 ms

Costmap Build:

21.4 ms

Smooth + Resample:

29.4 ms

Create a visual candidate-path animation where several possible trajectories appear and the safest feasible trajectory becomes highlighted.

==================================================

9. REAL-TIME REPLANNING

==================================================

Create a large interactive demonstration called:

"ADAPTIVE REPLANNING"

Show a timeline:

NORMAL DRIVING

↓

OBSTACLE DETECTED

↓

PREDICTED COLLISION

↓

CURRENT PATH INVALID

↓

NEW PATH GENERATED

↓

VEHICLE CONTINUES

Add a live timer showing replanning latency.

Default:

10.7 ms

Add:

95th percentile: 23.7 ms

Budget: 100 ms

Clearly explain:

"Mean closed-loop replanning latency across 50 runs."

==================================================

10. PERFORMANCE PAGE

==================================================

Create a dedicated Performance page.

Show KPI cards:

54%

Overall Scenario Completion

19

Moving-Agent Collisions

0

Static-Obstacle Hits

3.08 m

Overall Minimum Clearance

10.7 ms

Mean Replanning Latency

23.7 ms

95th Percentile Latency

305.6 ms

Worst-Case Latency

Then create charts:

A. Scenario Completion Rate

Village Road 90%

Urban Intersection 40%

Highway Merge 80%

Dense Market 20%

Cattle Crossing 40%

B. Mean Replanning Latency

Village 11.1 ms

Urban 8.7 ms

Highway 9.9 ms

Market 17.3 ms

Cattle 6.7 ms

C. Minimum Clearance

Village 5.36 m

Urban 1.39 m

Highway 4.56 m

Market 1.19 m

Cattle 2.93 m

Charts should be clean and presentation-ready.

==================================================

11. FIVE SCENARIO DEMOS

==================================================

Each scenario should have its own simulation behaviour.

VILLAGE ROAD:

- No lane markings

- Narrow road

- Unclear road boundaries

- Mixed traffic

- Show lane-independent path planning

- Highlight this as the strongest unstructured-road demonstration

URBAN INTERSECTION:

- No traffic signals

- Multiple crossing agents

- Vehicles approach from different directions

- Show collision-risk assessment and path adaptation

HIGHWAY MERGE:

- Main highway traffic

- Slow-moving vehicle entering/merging

- Show speed and trajectory adaptation

DENSE MARKET:

- Narrow corridor

- Multiple pedestrians

- Two-wheelers

- Auto-rickshaw

- Pushcart

- Heavy occlusion

- Show repeated replanning

CATTLE CROSSING:

- Vehicle initially has a clear path

- Cattle suddenly enters carriageway

- Show obstacle detection

- Show high-risk warning

- Show emergency-safe response

- Generate a new trajectory or controlled braking

==================================================

12. TECHNICAL ARCHITECTURE PAGE

==================================================

Create a visual architecture diagram:

RoadRunner / Scenario

↓

Camera + LiDAR + Radar

↓

Object Detection

↓

Sensor Fusion

↓

Tracking

↓

IMM Motion Prediction

↓

Predicted Occupancy

↓

Collision Risk Assessment

↓

Planner Cascade

↓

Path Smoothing

↓

Vehicle Control

↓

Closed-Loop Simulation

↺

Real-Time Replanning

Use animated arrows.

==================================================

13. IMPORTANT TECHNICAL DETAILS

==================================================

Show these as technical highlights:

Prediction:

3 second horizon

0.59 m IMM prediction error

Planning:

42.2 ms optimised Hybrid A*

1.4 ms Frenet planning

Closed loop:

10.7 ms mean latency

23.7 ms 95th percentile

Vehicle/path:

Minimum turn radius produced: 4.1 m

Vehicle kinematic limit: 3.5 m

Mean path tracking error: 0.329 m

Do not invent additional metrics.

==================================================

14. SCENARIO DETAIL VIEW

==================================================

When user clicks a scenario, show:

Scenario name

Description

Live simulation

Detected objects

Predicted trajectories

Current path

Replanned path

Metrics

Completion rate

Collisions

Minimum clearance

Mean latency

Maximum latency

Failure rate

Add a "RUN SCENARIO" button.

When clicked:

- Animate the vehicle

- Animate object movement

- Trigger obstacle event

- Trigger prediction

- Trigger replanning

- Complete simulation

- Update metrics

==================================================

15. JURY DEMO MODE

==================================================

Add a button:

"JURY DEMO MODE"

When clicked, automatically run a short sequence:

1. Village Road

2. Urban Intersection

3. Highway Merge

4. Dense Market

5. Cattle Crossing

For each:

- Show scenario

- Show vehicle moving

- Show obstacle

- Show prediction

- Show replanning

- Show final result

End with:

"50 CLOSED-LOOP RUNS"

"5 SCENARIOS × 10 RANDOM SEEDS"

and the overall measured results.

==================================================

16. HONESTY / DATA LABELS

==================================================

Add a small footer:

"Prototype visualization based on measured closed-loop simulation results."

Where appropriate label UI-only values as:

"SIMULATED"

Do not claim RoadRunner was used if the provided measured results do not establish that.

Do not claim camera/lidar/radar perception was physically measured if the provided results only describe simulated sensor noise.

Keep measured results and visualization/demo values clearly separated.

==================================================

17. FINAL EXPERIENCE

==================================================

The most important thing is visual storytelling.

A jury member should immediately understand:

Indian unstructured road

↓

Diverse moving agents

↓

Sensor perception

↓

Motion prediction

↓

Collision risk

↓

Adaptive path generation

↓

Real-time replanning

↓

Safe vehicle motion

Make the application interactive, animated and impressive.

Prioritize:

1. Live simulation

2. Adaptive replanning visualization

3. Five scenarios

4. Measured performance dashboard

5. Technical architecture

6. Prediction visualization

Avoid generic SaaS dashboard styling.                                        For now, keep the prototype SIMPLE and focus only on the basic UI structure.

Add a clean top navbar with:

MARGDRISHTI AI

Dashboard

Scenarios

Perception

Planning

Performance

Create only the basic screens/sections with placeholder content.

Dashboard:

- Simple hero section

- Large placeholder area for the autonomous vehicle simulation

- Basic vehicle/path visual

- Small status cards

Scenarios:

- 5 scenario cards:

  Village Road

  Urban Intersection

  Highway Merge

  Dense Market

  Cattle Crossing

Perception:

- Simple placeholder cards for Camera, LiDAR and Radar

- Detected Objects placeholder

Planning:

- Simple placeholder showing:

  Detection → Prediction → Planning → Replanning

Performance:

- Basic metric cards for Completion Rate, Collisions, Clearance and Replanning Latency

Keep the design dark, modern and futuristic with a clean automotive/AI feel.

IMPORTANT:

Do NOT build complex functionality yet.

Do NOT add unnecessary pages or backend.

Do NOT over-engineer the simulation.

Just create a polished, navigable UI skeleton with the navbar and basic sections.

We will modify and add the actual simulation, animations, charts and interactions later.

Make it look like an autonomous vehicle research/demo system.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c550d16a-7afc-4271-b9ab-412169998863).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
