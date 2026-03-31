/**********************************************************************
 Fleet Telemetry Platform — MongoDB Schema Setup
 Database: fleet

 - Creates collections
 - Creates indexes
 - Inserts representative sample documents
 - Safe to re-run multiple times
**********************************************************************/

// use DB
db = db.getSiblingDB("fleet");

// --- tiny helper: create collection if missing ----------------------
function ensureCollection(name) {
  if (!db.getCollectionNames().includes(name)) {
    db.createCollection(name);
    print(`Created collection: ${name}`);
  }
}

// ============================= AP1 ==================================
// AP1: Regional Fleet Dashboard View
// Collection: fleet_status_by_region
// Purpose: Fast dashboard of latest status/telemetry by region (newest first)
ensureCollection("fleet_status_by_region");
// SAMPLE INSERT (idempotent): one document for AP1 to verify structure
// Document (EMBEDDED fields for small, frequent reads)
db.fleet_status_by_region.replaceOne(
  { _id: { region: "use1", vehicleId: "VH-1001", lastSeenTs: ISODate("2025-10-10T19:39:30Z") } },
  {
    _id: { region: "use1", vehicleId: "VH-1001", lastSeenTs: ISODate("2025-10-10T19:39:30Z") },
    region: "use1",
    lastSeenTs: ISODate("2025-10-10T19:39:30Z"),
    vehicleId: "VH-1001",

    // EMBEDDED (tiny): vehicle summary
    vehicle: { model: "VolvoX", orgId: "OrgA" },

    // EMBEDDED (tiny): latest telemetry snapshot
    latestTelemetry: { speed: 68, temp: 74, fuelLevel: 56 },

    updatedAt: ISODate("2025-10-10T19:39:30Z")
  },
  { upsert: true }
);

// SAMPLE INSERT (idempotent): additional AP1 document for VH-2002
db.fleet_status_by_region.replaceOne(
  { _id: { region: "use1", vehicleId: "VH-2002", lastSeenTs: ISODate("2025-10-10T19:40:00Z") } },
  {
    _id: { region: "use1", vehicleId: "VH-2002", lastSeenTs: ISODate("2025-10-10T19:40:00Z") },
    region: "use1",
    lastSeenTs: ISODate("2025-10-10T19:40:00Z"),
    vehicleId: "VH-2002",
    vehicle: { model: "TeslaY", orgId: "OrgB" },       // small duplicated label
    latestTelemetry: { speed: 66, temp: 75, fuelLevel: 70 },
    updatedAt: ISODate("2025-10-10T19:40:00Z")
  },
  { upsert: true }
);


/*Design Rationale:
- EMBED small “vehicle” + “latestTelemetry” because they’re always shown together on the regional board.
- Single-snapshot docs prevent size growth → safe w.r.t. 16MB limit.
- Master vehicle data lives in AP5 (REFERENCED conceptually), this is a read-optimized view.

  Index strategy:
- { region: 1, lastSeenTs: -1 }  → newest per region fast
- { "vehicle.model": 1, region: 1 } → optional filter by make + region*/

db.fleet_status_by_region.createIndex({ region: 1, lastSeenTs: -1 }, { name: "region_lastSeen_desc" });
db.fleet_status_by_region.createIndex({ region: 1, "vehicle.model": 1 }, { name: "region_model" });
/*EMBEDDED vs REFERENCED data
- EMBEDDED: vehicle { model, orgId }; latestTelemetry { speed, temp, fuelLevel } (tiny, co-read).
- REFERENCED: vehicle master → vehicle_details (AP5, key: vehicleId);
              full telemetry stream → telemetry_by_trip (AP2, key: tripId→vehicleId).

Justification (embedding/referencing decision)
- Dashboard always reads the vehicle label + latest snapshot together → embed.
- Long-term data (streams, trips) not needed on every card → reference to AP2/AP4.

16MB document size consideration
- One snapshot per (region, vehicle, lastSeenTs); no unbounded arrays → safe.
- History lives outside this view, preventing document growth.

Denormalization (where appropriate)
- Duplicate small labels (model/orgId) to avoid joins on hot dashboard reads.*/


// ============================= AP2 ==================================
// AP2: Telemetry by Trip View
// Collection: telemetry_by_trip
// Purpose: Ordered time-series readings per trip for analytics
ensureCollection("telemetry_by_trip");
// SAMPLE INSERT (idempotent): one document for AP2 to verify structure
// Document (one reading; EMBEDDED metrics)
db.telemetry_by_trip.replaceOne(
  { _id: { tripId: "TR-2007", ts: ISODate("2025-10-10T15:39:00Z") } },
  {
    _id: { tripId: "TR-2007", ts: ISODate("2025-10-10T15:39:00Z") },
    tripId: "TR-2007",
    ts: ISODate("2025-10-10T15:39:00Z"),

    // EMBEDDED: tiny vehicle reference
    vehicle: { vehicleId: "VH-1001" },

    // EMBEDDED: per-reading metrics
    metrics: { speed: 70, temp: 72, pressure: 32.5 }
  },
  { upsert: true }
);

/*Design Rationale:
- EMBED per-reading metrics (atomic & small).
- Keep readings as separate docs per trip (do NOT embed infinite arrays in a trip) → prevents 16MB docs.
- Query pattern is tripId + time sort.

Index Strategy:
- { tripId: 1, ts: 1 }  → time-ordered readings per trip
- { "vehicle.vehicleId": 1, ts: -1 } → fallback per-vehicle filter by recency*/

db.telemetry_by_trip.createIndex({ tripId: 1, ts: 1 }, { name: "trip_ts" });
db.telemetry_by_trip.createIndex({ "vehicle.vehicleId": 1, ts: -1 }, { name: "vehicle_ts_desc" });

/*EMBEDDED vs REFERENCED data
- EMBEDDED: metrics per reading { speed, temp, pressure }; vehicle { vehicleId } (tiny label).
- REFERENCED: trip metadata → trips_by_route_and_day (AP4, key: tripId);
              vehicle master → vehicle_details (AP5, key: vehicleId).

Justification (embedding/referencing decision)
- Each read needs the reading’s metrics with its timestamp → embed metrics.
- Keep trip metadata and vehicle master external so telemetry scales independently.

16MB document size consideration
- One reading per document (not a giant array on the trip) → no 16MB risk.
- Docs are tiny/immutable; series grows by adding docs, not by bloating one doc.

Denormalization (where appropriate)
- Keep a minimal vehicleId label in each reading to filter quickly without a join.*/


// ============================= AP3 ==================================
// AP3: Vehicle Maintenance History View
// Collection: maintenance_history_by_vehicle
// Purpose: Chronological list of service events for each truck
ensureCollection("maintenance_history_by_vehicle");
// SAMPLE INSERT (idempotent): one document for AP3 to verify structure
// Document (EMBEDDED lastKnownRoute context)
db.maintenance_history_by_vehicle.replaceOne(
  {
    _id: {
      vehicleId: "VH-1001",
      eventDate: ISODate("2025-10-05T00:00:00Z"),
      maintId: "M-9030"
    }
  },
  {
    _id: {
      vehicleId: "VH-1001",
      eventDate: ISODate("2025-10-05T00:00:00Z"),
      maintId: "M-9030"
    },
    vehicleId: "VH-1001",
    eventDate: ISODate("2025-10-05T00:00:00Z"),
    maintId: "M-9030",
    workType: "Brake Check",
    notes: "Pads at 50%",

    // EMBEDDED: context snapshot at the time of service
    lastKnownRoute: { routeId: "R101" }
  },
  { upsert: true }
);
/*Design Rationale:
- One maintenance event per doc → unlimited history, avoids big docs.
- EMBED small route snapshot for context; master trip data lives elsewhere.
- Newest-first per vehicle is the read path.

  Index Strategy:
- { vehicleId: 1, eventDate: -1 }  → newest-first per vehicle
- { workType: 1, eventDate: -1 }   → filter by type
- { maintId: 1 }  unique           → idempotent writes*/

db.maintenance_history_by_vehicle.createIndex(
  { vehicleId: 1, eventDate: -1 },
  { name: "vehicle_eventDate_desc" }
);
db.maintenance_history_by_vehicle.createIndex(
  { workType: 1, eventDate: -1 },
  { name: "worktype_eventDate_desc" }
);
db.maintenance_history_by_vehicle.createIndex(
  { vehicleId: 1, maintId: 1 },
  { unique: true, name: "vehicle_maintId_unique" }
);

/*EMBEDDED vs REFERENCED data
- EMBEDDED: lastKnownRoute { routeId } (context snapshot at service time).
- REFERENCED: vehicle master → vehicle_details (AP5);
              optional trip/route metadata → trips_by_route_and_day (AP4).

Justification (embedding/referencing decision)
- Snapshot keeps the historical fact self-contained even if routes change later.
- Store one event per document for newest-first history + idempotent writes (maintId).

16MB document size consideration
- Unlimited history modeled as many small documents; no growing arrays in a single doc.
- Payloads are bounded text; large artifacts intentionally excluded.

Denormalization (where appropriate)
- Duplicate routeId in the event to avoid joins during history review.*/


// ============================= AP4 ==================================
// AP4: Trips by Route and Day
// Collection: trips_by_route_and_day
// Purpose: Retrieve trips for a route on a day, ordered by start time
ensureCollection("trips_by_route_and_day");
// SAMPLE INSERT (idempotent): one document for AP4 to verify structure
// Document (EMBEDDED bounded sparkline)
db.trips_by_route_and_day.replaceOne(
  {
    _id: {
      routeId: "R202",
      tripDate: "2025-10-10",
      startTs: ISODate("2025-10-10T09:23:07Z"),
      tripId: "TR-2010"
    }
  },
  {
    _id: {
      routeId: "R202",
      tripDate: "2025-10-10",
      startTs: ISODate("2025-10-10T09:23:07Z"),
      tripId: "TR-2010"
    },
    routeId: "R202",
    tripDate: "2025-10-10",
    startTs: ISODate("2025-10-10T09:23:07Z"),
    tripId: "TR-2010",

    // EMBEDDED: tiny vehicle label for UI
    vehicle: { vehicleId: "VH-2002", model: "TeslaY" },

    // EMBEDDED: bounded sparkline for list pages
    lastFiveReadings: [
      { ts: ISODate("2025-10-10T10:00:00Z"), speed: 59, temp: 70 },
      { ts: ISODate("2025-10-10T10:05:00Z"), speed: 61, temp: 71 }
    ],

    telemetrySummary: { avgSpeed: 63, maxTemp: 77, distanceKm: 180 },
    status: "Active"
  },
  { upsert: true }
);

// Additional seed so AP4 includes a VH-1001 trip (helps Part 2.3 proofs show AFTER row)
db.trips_by_route_and_day.replaceOne(
  {
    _id: {
      routeId: "R101",
      tripDate: "2025-10-12",
      startTs: ISODate("2025-10-12T09:00:00Z"),
      tripId: "TR-9999"
    }
  },
  {
    _id: {
      routeId: "R101",
      tripDate: "2025-10-12",
      startTs: ISODate("2025-10-12T09:00:00Z"),
      tripId: "TR-9999"
    },
    routeId: "R101",
    tripDate: "2025-10-12",
    startTs: ISODate("2025-10-12T09:00:00Z"),
    tripId: "TR-9999",
    vehicle: { vehicleId: "VH-1001", model: "VolvoX" },
    lastFiveReadings: [],
    telemetrySummary: { avgSpeed: 0, maxTemp: 0, distanceKm: 0 },
    status: "Active"
  },
  { upsert: true }
);


/*Design Rationale:
- EMBED only bounded visual data (sparkline) + small labels to render list pages quickly.
- Full telemetry remains external in AP2 to avoid unbounded arrays.
- Predictable small doc size → no 16MB risk.

Index Strategy:
- { routeId: 1, tripDate: 1, startTs: 1 }  → route/day listing sorted by start time
- { tripId: 1 } unique                     → direct trip lookup
- { "vehicle.vehicleId": 1, startTs: -1 }  → per-vehicle history on a route*/

db.trips_by_route_and_day.createIndex({ routeId: 1, tripDate: 1, startTs: 1 }, { name: "route_day_start" });
db.trips_by_route_and_day.createIndex({ tripId: 1 }, { unique: true, name: "tripId_unique" });
db.trips_by_route_and_day.createIndex({ "vehicle.vehicleId": 1, startTs: -1 }, { name: "vehicle_start_desc" });

/*AP4: Trips by Route & Day  |  Collection: trips_by_route_and_day

EMBEDDED vs REFERENCED data
- EMBEDDED: vehicle label { vehicleId, model }; lastFiveReadings [bounded]; telemetrySummary {…}.
- REFERENCED: full telemetry stream → telemetry_by_trip (AP2, key: tripId);
              vehicle master → vehicle_details (AP5).

Justification (embedding/referencing decision)
- Route/day listings must render from a single doc; embed tiny label + bounded sparkline.
- Keep the full time series outside (AP2) to avoid large/ever-growing docs.

16MB document size consideration
- Sparkline is strictly capped (e.g., ≤5 points); summary is small → safe.
- Full stream not embedded → no unbounded growth in trip documents.

Denormalization (where appropriate)
- Precompute small aggregates (telemetrySummary) and keep label for fast list UIs.*/


// ============================= AP5 ==================================
// AP5: Vehicle Details Lookup (Master)
// Collection: vehicle_details
// Purpose: Authoritative single-vehicle master record (fast lookup)
ensureCollection("vehicle_details");

// SAMPLE INSERT (idempotent): one document for AP5 to verify structure
// Document (EMBEDDED snapshot/specs; references live in other collections)
db.vehicle_details.replaceOne(
  { _id: "VH-1001" },
  {
    _id: "VH-1001",
    vehicleId: "VH-1001",
    orgId: "OrgA",
    model: "VolvoX",
    homeRegion: "usw1",

    // EMBEDDED: compact status snapshot for fast lookup
    latestTelemetry: { speed: 68, fuelLevel: 56 },

    // DENORMALIZED: specs & registration for simple UI reads
    specs: { engine: "D16", capacityTons: 25 },
    registration: { plate: "USF-7845", year: 2021 },

    createdAt: ISODate("2023-01-02T00:00:00Z"),
    updatedAt: ISODate("2025-10-10T19:39:30Z")
  },
  { upsert: true }
);

// SAMPLE INSERT (idempotent): additional AP5 master record for VH-2002
db.vehicle_details.replaceOne(
  { _id: "VH-2002" },
  {
    _id: "VH-2002",
    vehicleId: "VH-2002",
    orgId: "OrgB",
    model: "TeslaY",
    homeRegion: "use1",
    latestTelemetry: { speed: 66, temp: 75, pressure: 32.9 }, // snapshot to be “propagated”
    specs: { engine: "eDrive", capacityTons: 20 },
    registration: { plate: "USE-2202", year: 2022 },
    createdAt: ISODate("2023-03-01T00:00:00Z"),
    updatedAt: ISODate("2025-10-10T19:40:00Z")
  },
  { upsert: true }
);

/*Design Rationale:
- Keep the authoritative master as a single small doc (fast reads).
- EMBED tiny snapshot/specs; keep large/ever-growing histories in other collections (AP2–AP4).
- Stable doc → no 16MB concern.

Index Strategy:
- { vehicleId: 1 } unique           → primary key for lookup
- { orgId: 1, homeRegion: 1 }       → admin filters*/

db.vehicle_details.createIndex({ vehicleId: 1 }, { unique: true, name: "vehicleId_unique" });
db.vehicle_details.createIndex({ orgId: 1, homeRegion: 1 }, { name: "org_region" });

/*EMBEDDED vs REFERENCED data
- EMBEDDED: latestTelemetry snapshot; specs; registration (small, co-read for lookups).
- REFERENCED: telemetry stream → telemetry_by_trip (AP2);
              trips/day → trips_by_route_and_day (AP4);
              maintenance events → maintenance_history_by_vehicle (AP3).

Justification (embedding/referencing decision)
- Master lookup should be one fast read; embed tiny snapshot + stable specs/registration.
- Keep unbounded histories external to maintain a small, stable master record.

16MB document size consideration
- Master remains small by excluding histories and large arrays; snapshot is tiny/overwritten.
- Guarantees safe size for long-lived vehicles.

Denormalization (where appropriate)
- Include specs/registration so common UI views don’t require additional lookups.*/

print("MongoDB schema setup completed: collections, indexes, and sample documents are ready.");
