# Phase 5 cascade validation

The waterlogging demo calls the existing deterministic `CascadingImpactEngine` with rainfall, wind, incident type, severity, and the predictor-derived cascade flag. Existing Phase 2 tests verify loop prevention and unique causal nodes across all supported types. The intake response explicitly marks output as `deterministic_simulation_not_observed_event`.

For the Bengaluru drain scenario, the supported explanation is: rainfall increases the root waterlogging hazard and may generate the engine’s documented downstream traffic/access consequences. CivicOS does **not** contain verified municipal drain, road, or facility asset topology; it must not claim a specific real drain or critical facility was observed or connected. Use the returned causal reasons and prevention-break actions as simulated planning aids only.
