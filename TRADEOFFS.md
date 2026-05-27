# TRADEOFFS

## 1. Did not implement CO2e calculation

**What it is:**
Converting raw activity data (litres of diesel, kWh of electricity, km of flight)
into kg of CO2 equivalent using emission factors.
This is the actual carbon accounting step.

**Why I skipped it:**
Emission factors vary by region, fuel type, year, and methodology
(IPCC, DEFRA, EPA, GHG Protocol). Using the wrong factor produces
wrong numbers, which is worse than no number for an auditor.
The co2e_kg field exists in the model and is nullable — it is ready
to be populated once the correct factor source is confirmed.

**What production needs:**
A emission factor lookup table keyed by category + region + year,
sourced from DEFRA or GHG Protocol. A calculation job that runs
after analyst approval and populates co2e_kg.

**What I'd ask the PM:**
Which emission factor database does Breathe ESG use — DEFRA, EPA,
or a proprietary set? Are factors applied before or after analyst review?

---

## 2. Did not implement per-role authorization

**What it is:**
Restricting API access so only authenticated analysts can approve rows,
only admins can manage clients, and data is scoped to the analyst's
assigned clients.

**Why I skipped it:**
The prototype has one user type (admin/analyst) and one client.
Adding role-based access control requires a roles table, middleware,
and per-view permission checks. This is straightforward to add but
adds significant boilerplate for a prototype that will be reviewed
by the same person who created the superuser.

**What production needs:**
A roles system (admin, analyst, auditor — read-only).
Row-level security ensuring analysts only see their assigned clients.
JWT tokens with role claims for stateless auth.

---

## 3. Did not implement suspicious row auto-detection

**What it is:**
Automatically flagging rows that look anomalous — a diesel consumption
10x higher than the previous month, a flight distance that exceeds
the maximum possible distance between two airports, a utility bill
with negative consumption.

**Why I skipped it:**
Anomaly detection requires baseline data to compare against.
With no historical data in the system, there is nothing to compare to.
The suspicious status exists in the model and the UI — analysts can
flag rows manually. Automated detection needs at least 3-6 months
of data to establish baselines.

**What production needs:**
A rule engine that runs after ingestion and checks:
- Quantity > 3 standard deviations from client's historical mean
- Period gaps (missing months)
- Unit inconsistencies within the same meter or plant
- Negative values
Auto-flagged rows would go to suspicious status for analyst review.