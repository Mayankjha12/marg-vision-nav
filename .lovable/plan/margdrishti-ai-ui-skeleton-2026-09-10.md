# MARGDRISHTI AI UI Skeleton

## Goal
Build a polished, desktop-first demonstration interface for an autonomous-driving research prototype. Keep it explicitly framed as a visualization, with no backend, advanced simulation logic, charts, or invented results.

## Pages and navigation
- Add a shared top navigation with the MARGDRISHTI AI identity, prototype subtitle, simulation status, and links for Dashboard, Scenarios, Perception, Planning, and Performance.
- Create dedicated routes for all five destinations so navigation, browser history, and page metadata work correctly.
- Add a compact mobile navigation treatment while preserving the control-center feel.

## Visual system
- Establish a dark automotive engineering theme using deep navy surfaces, cyan highlights, green safe states, and restrained warning colors.
- Use semantic design tokens, technical typography, subtle grid textures, glass-like panels, thin borders, and limited motion.
- Keep every page clearly labeled as a prototype visualization and separate measured metrics from simulated placeholders.

## Screen content
- **Dashboard:** concise introduction, large stylized top-down road placeholder with a basic vehicle and safe path, plus small status cards.
- **Scenarios:** five visual cards for Village Road, Urban Intersection, Highway Merge, Dense Market, and Cattle Crossing.
- **Perception:** Camera, LiDAR, Radar, and Detected Objects placeholders, clearly marked simulated.
- **Planning:** a visual Detection → Prediction → Planning → Replanning pipeline with a simple path preview.
- **Performance:** basic cards using only provided overall measured results: 54% completion, 19 collisions, 3.08 m clearance, and 10.7 ms mean replanning latency.

## Technical details
- Build reusable shared shell, page-heading, panel, and visual-placeholder components.
- Use the existing TanStack routing and Tailwind setup; do not add a backend or unnecessary packages.
- Give each route unique title, description, Open Graph text, and Twitter card metadata.
- Verify the finished interface at desktop and mobile sizes, including navigation, layout, and all route links.
