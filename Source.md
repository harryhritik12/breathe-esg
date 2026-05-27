# SOURCES

## 1. SAP — Fuel and Procurement Data

### What I researched
SAP has multiple export mechanisms. The main ones relevant to
sustainability reporting are:

- **MB51** (Material Document List) — tracks material movements
  including fuel issues from storage locations
- **ME2M** (Purchase Orders by Material) — procurement records
- **MM60** (Inventory Turnover) — consumption reporting

These are standard SAP transaction reports that a procurement or
sustainability manager would run and export as a spreadsheet or
flat file. The export format is a tab-separated or comma-separated
flat file with SAP-specific column naming.

### What I learned
- SAP column headers can appear in German depending on system locale
  (e.g. "Buchungsdatum" instead of "Posting Date", "Menge" instead
  of "Quantity")
- Plant codes are internal identifiers (e.g. PLANT_IN01) that mean
  nothing without a plant master lookup table
- Units are stored as SAP internal codes — "L" for litres, "M3" for
  cubic metres, "KG" for kilograms — but can vary by client config
- Dates appear in DD.MM.YYYY format in German-locale systems and
  YYYY-MM-DD in English-locale systems
- A single material movement can span multiple line items if it
  involves split valuations or batch management

### What my sample data looks like and why
posting_date,material_type,quantity,unit,plant_code,vendor
2024-01-15,diesel,500,L,PLANT_IN01,vendor_001
2024-01-20,natural_gas,1200,m3,PLANT_IN02,vendor_002
2024-02-10,diesel,750,L,PLANT_IN01,vendor_003

I used English column names (realistic for an Indian enterprise client
running SAP in English locale). Material types are diesel and
natural_gas — the two most common Scope 1 fuel sources for
manufacturing/logistics companies. Plant codes follow a realistic
internal naming convention. Quantities and units are realistic
for a mid-size facility over a month.

### What would break in real deployment
- German column headers would need a translation mapping before parsing
- Plant codes need a lookup table to map to meaningful location names
- SAP sometimes exports merged header rows or summary rows at the
  bottom of the file that the CSV parser would misread as data rows
- Multi-currency procurement records would need currency normalization
  before quantity comparison
- Some SAP configs export dates as Excel serial numbers (e.g. 45306)
  instead of formatted date strings

---

## 2. Utility Data — Electricity

### What I researched
Utility providers offer billing data through:
- **Customer portal CSV export** — most common, available from
  providers like Tata Power, BSES, MSEB (India), and most global
  utilities
- **PDF bills** — require OCR, brittle, format varies per provider
- **Green Button API** — US-specific standard, not available in India
- **ESMI/DISCOM portals** — Indian utility-specific portals with
  download functionality

A facilities manager typically logs into the utility portal monthly,
navigates to billing history, and downloads a CSV covering the
previous billing period.

### What I learned
- Billing periods do not align with calendar months — a bill can
  cover 28 to 35 days depending on meter reading schedule
- The same site can have multiple meters (sub-meters for floors,
  equipment, HVAC) each billed separately
- Units can be kWh, MWh, or kVAh (kilovolt-ampere-hour, used by
  some Indian utilities for commercial tariffs)
- Some utilities include both consumption and demand charges in the
  same row, others split them across rows
- Tariff codes (commercial, industrial, agricultural) affect emission
  factor selection in some methodologies

### What my sample data looks like and why
billing_start,billing_end,meter_id,consumption_kwh,tariff,site
2024-01-01,2024-01-31,MTR_001,45000,commercial,Mumbai_HQ
2024-02-01,2024-02-29,MTR_001,42000,commercial,Mumbai_HQ

I used kWh as the unit (most common for commercial billing in India).
Consumption of 42,000-45,000 kWh/month is realistic for a mid-size
office building. Billing periods use calendar month alignment for
simplicity, though real bills often shift by a few days. Site name
reflects an Indian enterprise HQ location.

### What would break in real deployment
- kVAh units would need conversion to kWh (requires power factor)
- Multi-meter sites need aggregation logic before Scope 2 calculation
- Billing period gaps or overlaps (meter replacement, estimated reads)
  need detection and handling
- Some portal exports include header metadata rows above the actual
  data that confuse CSV parsers
- PDF bills from smaller utilities would need a completely different
  ingestion path (OCR + extraction)

---

## 3. Corporate Travel — Flights, Hotels, Ground Transport

### What I researched
Corporate travel platforms that expose data:
- **SAP Concur** — largest enterprise platform, exports via admin
  panel as CSV/XLSX or via REST API (requires OAuth 2.0 + company
  credentials)
- **Navan (formerly TripActions)** — modern platform, API requires
  admin credentials, also supports CSV export from admin panel
- **Zoho Expense / Happay** — common in Indian enterprises, support
  CSV export

From Concur and Navan documentation, the export contains one row
per trip segment (each flight leg, each hotel night, each car booking
is a separate row). Airport codes (IATA) are used for origin and
destination rather than city names.

### What I learned
- Flight distances are not always provided — platforms give airport
  codes and the consuming system is expected to calculate great-circle
  distance
- Hotel records have no distance — they contribute to Scope 3 through
  a nights-stayed emission factor, not a distance factor
- Ground transport records may have distance or may only have
  cost — distance needs to be estimated from cost and per-km rate
- Business class flights have a higher emission factor than economy
  due to seat area allocation methodology (GHG Protocol)
- Traveler IDs are internal employee IDs, not names, for privacy

### What my sample data looks like and why
travel_date,traveler_id,travel_type,origin,destination,distance_km,class
2024-01-10,EMP_001,flight,BOM,DEL,1400,economy
2024-01-15,EMP_002,hotel,,,0,
2024-01-20,EMP_003,ground_transport,,,85,

BOM→DEL (Mumbai to Delhi) is 1,400 km great-circle distance — a
realistic and common Indian domestic business route. Hotel rows have
no origin/destination or distance, reflecting the real export shape.
Ground transport has a distance but no route, which is how Concur
exports cab/taxi bookings. Traveler IDs use an EMP_ prefix matching
common HR system conventions.

### What would break in real deployment
- Missing distance_km for flights would need a great-circle calculation
  using an airport coordinates lookup (e.g. OpenFlights database)
- Hotel emission factors need nights stayed, not distance — the model
  would need a separate field for hotel_nights
- Multi-leg trips (BOM→DEL→LHR) appear as separate rows and need
  trip_id grouping for meaningful reporting
- Concur and Navan have different column names for the same fields —
  a provider-specific column mapping layer would be needed
- International trips need currency normalization if cost-based
  distance estimation is used