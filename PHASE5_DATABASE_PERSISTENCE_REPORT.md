# Phase 5 database persistence report

`test_persistence_restart_lifecycle_and_history` creates an incident and work order in a temporary SQLite database, assigns, starts, and resolves it, then creates a fresh `OperationsService` against the same file. The incident status, evidence, work-order status, and history remain intact.

Additional checks: SQLite foreign keys are enabled on every connection, WAL journaling is enabled, writes use context-managed transactions, foreign-key integrity passes, and no orphan work order is present. The database path is configurable with `CIVICOS_OPERATIONS_DB`, allowing isolated test/demo files. A missing file is initialized automatically. Locked/corrupt-file behavior remains a deployment limitation: the service raises the underlying SQLite error rather than fabricating a successful result.
