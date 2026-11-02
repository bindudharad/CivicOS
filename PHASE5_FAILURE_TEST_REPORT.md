# Phase 5 failure and duplicate report

Pydantic rejects empty/missing required intake fields and invalid/out-of-range coordinates before persistence. Invalid lifecycle transitions return no record at the service level and a 409 API response. Resolution cannot be submitted twice. Unknown work orders cannot be advanced.

Duplicate rule: the classified incident type must match, an unresolved matching record must be within 0.350 km, and token Jaccard similarity must be at least 0.25. The response carries distance, similarity, and thresholds for merged reports. Phase 5 tests cover identical reports, nearby similar reports, a different type at the same location, and a similar report at a distant ward. Missing coordinates/descriptions are rejected by typed API validation, not silently inferred.
