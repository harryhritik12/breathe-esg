# DATA MODEL

## Overview
The data model is designed around four core entities:
`Client → IngestionBatch → EmissionRow → AuditLog`

This reflects the real-world flow: a client uploads a batch of data,
each batch produces normalized emission rows, and every action on a
row is tracked in an audit log.

---

## Tables

### Client
Represents an enterprise client company (multi-tenancy root).

| Field | Type | Notes |
|---|---|---|
| id | AutoField | Primary key |
| name | CharField | Company name |
| slug | SlugField | Unique identifier for URLs |
| created_at | DateTimeField | When onboarded |

Every EmissionRow and IngestionBatch is scoped to a Client.
This is how multi-tenancy is handled — no row exists without a client owner.

---

### IngestionBatch
One file upload session. Tracks provenance — which file produced which rows.

| Field | Type | Notes |
|---|---|---|
| id | AutoField | Primary key |
| client | ForeignKey(Client) | Which client uploaded |
| source_type | CharField | sap / utility / travel |
| status | CharField | pending / approved / rejected |
| uploaded_by | ForeignKey(User) | Which analyst uploaded |
| uploaded_at | DateTimeField | When uploaded |
| file_name | CharField | Original filename for reference |
| row_count | IntegerField | How many rows were parsed |
| error_count | IntegerField | How many rows failed parsing |

Source-of-truth tracking: every EmissionRow links back to its batch,
so you always know which file produced it and when.

---

### EmissionRow
The core normalized data row. One row = one emission event.

| Field | Type | Notes |
|---|---|---|
| id | AutoField | Primary key |
| batch | ForeignKey(IngestionBatch) | Source batch |
| client | ForeignKey(Client) | Owner client |
| scope | CharField | scope1 / scope2 / scope3 |
| category | CharField | diesel, electricity, flight, etc |
| quantity | DecimalField | Normalized quantity |
| unit | CharField | Normalized unit (L, kWh, km) |
| co2e_kg | DecimalField | CO2 equivalent in kg (nullable) |
| raw_data | JSONField | Original row as-is before normalization |
| period_start | DateField | Billing/activity period start |
| period_end | DateField | Billing/activity period end |
| status | CharField | pending / approved / rejected / suspicious |
| reviewed_by | ForeignKey(User) | Analyst who reviewed |
| reviewed_at | DateTimeField | When reviewed |
| review_note | TextField | Analyst notes |
| created_at | DateTimeField | When row was created |
| edited | BooleanField | Whether row was manually edited |

**Scope mapping:**
- SAP fuel/procurement → Scope 1 (direct emissions)
- Utility electricity → Scope 2 (indirect energy)
- Corporate travel → Scope 3 (value chain)

**Unit normalization:**
All units are normalized at ingestion time:
- Fuel: L, m3, kg
- Electricity: kWh
- Travel: km

**raw_data JSONField** stores the original row exactly as it came in.
This means we can always trace back to the source if a normalized
value looks wrong. This is critical for audit defensibility.

---

### AuditLog
Immutable record of every action taken on an EmissionRow.

| Field | Type | Notes |
|---|---|---|
| id | AutoField | Primary key |
| emission_row | ForeignKey(EmissionRow) | Which row was acted on |
| action | CharField | created/approved/rejected/edited/flagged |
| performed_by | ForeignKey(User) | Who did it |
| performed_at | DateTimeField | When |
| note | TextField | Optional reason |

AuditLog rows are never deleted or edited. They form an append-only
trail that satisfies auditor requirements.

---

## Key Design Decisions

**Why relational (PostgreSQL) not document (MongoDB)?**
The data is inherently relational — clients own batches own rows.
Audit trails require referential integrity. PostgreSQL enforces this
at the database level, not just the application level.

**Why store raw_data as JSON?**
Each source has a different shape. Storing the original row as JSON
means we never lose information during normalization. If the normalized
value is wrong, we can always look at what came in.

**Why separate IngestionBatch from EmissionRow?**
Batch-level metadata (who uploaded, when, from which file) is separate
from row-level data. This lets analysts review an entire batch at once
or drill into individual rows.

**Why period_start and period_end instead of a single date?**
Utility billing periods don't align with calendar months. A bill can
cover 28-35 days. Using a date range handles this correctly.

**Multi-tenancy approach:**
Every table has a direct or indirect FK to Client. Queries are always
filtered by client. In production, middleware would enforce this
automatically. For this prototype, it is enforced at the view level.