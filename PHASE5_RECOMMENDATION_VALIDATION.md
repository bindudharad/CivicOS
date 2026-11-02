# Phase 5 recommendation validation

For a high-risk drainage report, classification routes to **Drainage & Stormwater** and recommends drain inspection/desilting actions. The recommendation is tied to the source incident analysis, priority score, responsible department, and automatically created work order. It is marked `deterministic_recommendation_requires_operator_approval`.

Recommendations are rule-based by incident type and severity. They are useful fallback playbooks but are not evidence of an actual asset condition. Resolved incidents cannot create a second resolution event; a duplicate report links to the original and does not create a second work order.
