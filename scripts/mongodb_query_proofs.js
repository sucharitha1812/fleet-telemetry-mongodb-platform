/**********************************************************************
Fleet Telemetry Platform — Query Validation and Index Proofs

 Assumes the MongoDB collections, indexes, and sample documents
 have already been created before running this script.
**********************************************************************/

(function () {
  // Helpers
  function hr() { print("\n" + "-".repeat(80) + "\n"); }
  function header(txt) { hr(); print(">>> " + txt); hr(); }
  function show(obj) { printjson(obj); }

  // 0) Connect
  header("0) CONNECT & REPLICA SET STATUS (PRIMARY/SECONDARIES)");
  try {
    show(rs.status().members.map(m => ({ name: m.name, state: m.stateStr })));
  } catch (e) {
    print("rs.status() not available (may be a direct connection to a single node).");
  }

  // 1) DB + collections
  header("1) DATABASE & COLLECTIONS");
  db = db.getSiblingDB("fleet");
  print("Using DB:", db.getName());
  show(db.getCollectionNames());

  // ===== AP1 =========================================================
  header("AP1 — Regional Fleet Dashboard: Example MQL Query");
  show(
    db.fleet_status_by_region.find(
      { region: "use1" },
      { _id: 0, region: 1, lastSeenTs: 1, "vehicle.model": 1, "latestTelemetry.speed": 1 }
    ).sort({ lastSeenTs: -1 }).limit(5).toArray()
  );

  header("AP1 — Regional Fleet Dashboard: Indexes");
  show(db.fleet_status_by_region.getIndexes());

  // ===== AP2 =========================================================
  header("AP2 — Telemetry by Trip: Example MQL Query");
  show(
    db.telemetry_by_trip.find(
      { tripId: "TR-2007" },
      { _id: 0, tripId: 1, ts: 1, "metrics.speed": 1, "metrics.temp": 1 }
    ).sort({ ts: 1 }).limit(10).toArray()
  );

  header("AP2 — Telemetry by Trip: Indexes");
  show(db.telemetry_by_trip.getIndexes());

  // Optional: show the winning plan proving index usage
  header("AP2 — Telemetry by Trip: Explain (winning plan)");
  show(
    db.telemetry_by_trip
      .find({ tripId: "TR-2007" })
      .sort({ ts: 1 })
      .explain("executionStats").queryPlanner.winningPlan
  );

  // ===== AP3 =========================================================
  header("AP3 — Maintenance History: Example MQL Query");
  show(
    db.maintenance_history_by_vehicle.find(
      { vehicleId: "VH-1001" },
      { _id: 0, vehicleId: 1, eventDate: 1, workType: 1, "lastKnownRoute.routeId": 1 }
    ).sort({ eventDate: -1 }).limit(10).toArray()
  );

  header("AP3 — Maintenance History: Indexes");
  show(db.maintenance_history_by_vehicle.getIndexes());

  // ===== AP4 =========================================================
  header("AP4 — Trips by Route & Day: Example MQL Query");
  show(
    db.trips_by_route_and_day.find(
      { routeId: "R202", tripDate: "2025-10-10" },
      { _id: 0, routeId: 1, tripDate: 1, startTs: 1, tripId: 1, "vehicle.model": 1 }
    ).sort({ startTs: 1 }).toArray()
  );

  header("AP4 — Trips by Route & Day: Indexes");
  show(db.trips_by_route_and_day.getIndexes());

  // ===== AP5 =========================================================
  header("AP5 — Vehicle Details (Master): Example MQL Query");
  show(
    db.vehicle_details.find(
      { vehicleId: "VH-1001" },
      { _id: 0, vehicleId: 1, model: 1, homeRegion: 1, "latestTelemetry.fuelLevel": 1 }
    ).toArray()
  );

  header("AP5 — Vehicle Details (Master): Indexes");
  show(db.vehicle_details.getIndexes());

  // -----------------------------------------------------------------------------
// >>> Aggregation Pipeline Example — Average Speed per Region (AP1)
// Demonstrates use of $group and $sort on fleet_status_by_region
// -----------------------------------------------------------------------------
print("\n--------------------------------------------------------------------------------");
print(">>> Aggregation Pipeline Example — Average Speed per Region (AP1)");
print("--------------------------------------------------------------------------------");

const avgSpeedByRegion = db.fleet_status_by_region.aggregate([
  { $group: { _id: "$region", avgSpeed: { $avg: "$latestTelemetry.speed" } } },
  { $sort: { avgSpeed: -1 } }
]).toArray();

printjson(avgSpeedByRegion);


  header("DONE — All proofs printed");
})();
