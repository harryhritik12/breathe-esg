# DECISIONS

## 1. Ingestion mechanism: file upload over live API

**Decision:** CSV file upload for all three sources instead of live API integration.

**Why:**
SAP requires enterprise OAuth credentials and a live SAP system URL.
Concur and Navan require admin-level OAuth tokens tied to a real company account.
Neither is available in a prototype context, and neither evaluator can test
a live API without credentials.

CSV export is also how these systems are actually used in practice.
SAP operators export flat files for downstream processing.
Facilities teams download portal CSVs from utility providers.
Travel admins export trip reports from Concur/Navan as CSV or XLSX.

File upload mirrors real-world usage and is fully testable without credentials.

**What I'd ask the PM:**
Do clients have IT teams who can set up API credentials, or will
data always come in as manual exports? This determines whether
a live API pull is worth building.

---

## 2. SAP format: flat file CSV over IDoc or OData

**Decision:** Handled SAP as a flat file CSV export (MM60 / ME2M style report).

**Why:**
SAP has multiple export mechanisms — IDoc (EDI format), OData services,
BAPI function calls, and flat file reports. IDoc requires an EDI middleware
layer. OData requires a live SAP Gateway URL. BAPI requires RFC connectivity.

Flat file exports are what sustainability teams actually receive.
A procurement manager runs a report in SAP (ME2M for purchase orders,
MB51 for material movements) and exports it as CSV or spreadsheet.
This is the realistic shape of data Breathe ESG would receive.

**Subset handled:**
- Material movements with posting date, material type, quantity, unit, plant code
- Ignored: cost center hierarchies, company code multi-currency, IDoc envelope fields

**What I'd ask the PM:**
Which SAP module is the client running — MM (materials management) or
FI (financials)? The column names differ significantly between modules.

---

## 3. Utility format: portal CSV export over PDF or API

**Decision:** Portal CSV export.

**Why:**
Most utility providers (Tata Power, BSES, MSEB in India; similar globally)
offer a "Download billing history" CSV from their customer portal.
PDFs require OCR which is brittle and format-dependent.
Utility APIs exist but are rare outside the US (Green Button standard)
and require utility-specific OAuth setup.

Portal CSV is the most common real-world path for a facilities team.

**Subset handled:**
- Billing period start/end, meter ID, consumption in kWh, tariff type, site name
- Ignored: demand charges, reactive power, multi-tariff breakdowns, tax line items

**What I'd ask the PM:**
Are all client sites on the same utility provider, or do we need to
handle multiple provider CSV formats in one batch?

---

## 4. Travel format: Concur/Navan CSV export over API

**Decision:** CSV export from travel platform admin panel.

**Why:**
Concur API requires OAuth 2.0 with company-registered application and
EXPRPT scope. Navan API requires admin credentials and has limited
public documentation. Both are enterprise-locked.

Both platforms support CSV/XLSX bulk export from the admin panel.
This is how travel managers actually pull data for reporting.

**Subset handled:**
- Travel date, traveler ID, travel type (flight/hotel/ground), origin,
  destination, distance in km, class
- Ignored: expense amounts, currency, per-diem, receipt attachments

**Distance handling:**
When distance_km is 0 (hotels, some ground transport), the row is
still ingested with quantity=0. In production, flight distances would
be calculated from airport codes using a great-circle distance lookup.

**What I'd ask the PM:**
Does the client use Concur, Navan, or something else? Column names
differ between platforms. Do they need hotel nights or just flights
for Scope 3 calculations?

---

## 5. Authentication: session-based over JWT

**Decision:** Django session authentication.

**Why:**
Session auth is Django's built-in mechanism and works well for
a same-origin or controlled CORS setup. JWT would add complexity
(token refresh, storage security) without meaningful benefit for
a prototype with a single analyst user type.

**What I'd ask the PM:**
Will analysts be external users or internal Breathe ESG staff?
External users would push toward JWT + proper token management.

---

## 6. Database: PostgreSQL over MongoDB

**Decision:** PostgreSQL.

**Why:**
The data is relational — clients own batches own rows, with audit trails
requiring referential integrity. MongoDB's flexible schema offers no
advantage here; the schema is well-defined. PostgreSQL enforces
constraints at the database level. Django's ORM has first-class
PostgreSQL support. Render provides free hosted PostgreSQL.

---

## 7. Scope assignment: hardcoded per source type

**Decision:** SAP → Scope 1, Utility → Scope 2, Travel → Scope 3.

**Why:**
For this client and these source types, the mapping is unambiguous.
SAP fuel/procurement is direct combustion (Scope 1).
Utility electricity is purchased energy (Scope 2).
Corporate travel is upstream/downstream transport (Scope 3).

In production, scope assignment would need a lookup table because
some SAP procurement rows (e.g. purchased electricity for resale)
could be Scope 2 or 3.

**What I'd ask the PM:**
Does the client purchase electricity through SAP procurement?
If so, we need a material-type-to-scope mapping table.