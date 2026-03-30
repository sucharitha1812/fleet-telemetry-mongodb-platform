/**********************************************************************
 Part 2.3 — Data Consistency & Update Strategy  |  DB: fleet
 ----------------------------------------------------------------------
 Demonstrates:
   1.  Propagation of duplicated labels  (AP5 → AP1 → AP4)
   2.  Synchronization of telemetry snapshots (AP2 → AP5 → AP1)
   3.  Bounded array updates  (keep ≤ 5 sparkline readings)
**********************************************************************/

db = db.getSiblingDB("fleet");

function show(title, doc) {
  print("\n-------------------------------");
  print("=== " + title + " ===");
  print("-------------------------------");
  if (doc) printjson(doc); else print("(no rows)");
}

/* ---------------------------------------------------------------
   0) Initial lookups — duplicated / denormalized fields
---------------------------------------------------------------- */
show("AP5 vehicle_details (master record)",
     db.vehicle_details.findOne({ vehicleId: "VH-1001" },
       { _id: 0, vehicleId: 1, orgId: 1, model: 1 }));

show("AP1 fleet_status_by_region (duplicated labels, VH-1001)",
     db.fleet_status_by_region.findOne(
       { vehicleId: "VH-1001" },
       { _id: 0, region: 1, vehicleId: 1, vehicle: 1 }));

show("AP1 fleet_status_by_region (duplicated labels, VH-2002)",
     db.fleet_status_by_region.findOne(
       { vehicleId: "VH-2002" },
       { _id: 0, region: 1, vehicleId: 1, vehicle: 1 }));

show("AP4 trips_by_route_and_day (duplicated labels, VH-2002)",
     db.trips_by_route_and_day.findOne(
       { "vehicle.vehicleId": "VH-2002" },
       { _id: 0, tripId: 1, vehicle: 1 }));

show("AP5 latestTelemetry snapshot (VH-2002)",
     db.vehicle_details.findOne(
       { vehicleId: "VH-2002" },
       { _id: 0, vehicleId: 1, latestTelemetry: 1 }));

show("AP1 latestTelemetry snapshot (VH-2002)",
     db.fleet_status_by_region.findOne(
       { vehicleId: "VH-2002" },
       { _id: 0, region: 1, vehicleId: 1, latestTelemetry: 1 }));


/* ---------------------------------------------------------------
   1) Propagate model update (VH-1001 → VolvoX-Pro)
---------------------------------------------------------------- */
show("BEFORE: AP5 vehicle_details (VH-1001)",
     db.vehicle_details.findOne({ vehicleId: "VH-1001" },
       { _id: 0, vehicleId: 1, orgId: 1, model: 1 }));

show("BEFORE: AP1 fleet_status_by_region (VH-1001)",
     db.fleet_status_by_region.findOne(
       { vehicleId: "VH-1001" },
       { _id: 0, region: 1, vehicle: 1 }));

show("BEFORE: AP4 trips_by_route_and_day (VH-1001)",
     db.trips_by_route_and_day.findOne(
       { "vehicle.vehicleId": "VH-1001" },
       { _id: 0, tripId: 1, vehicle: 1 }));

// --- Master update (AP5)
db.vehicle_details.updateOne(
  { vehicleId: "VH-1001" },
  { $set: { model: "VolvoX-Pro" } }
);

// --- Propagate label to dependent collections
db.fleet_status_by_region.updateMany(
  { vehicleId: "VH-1001" },
  { $set: { "vehicle.model": "VolvoX-Pro" } }
);
db.trips_by_route_and_day.updateMany(
  { "vehicle.vehicleId": "VH-1001" },
  { $set: { "vehicle.model": "VolvoX-Pro" } }
);

show("AFTER: AP5 vehicle_details (VH-1001)",
     db.vehicle_details.findOne({ vehicleId: "VH-1001" },
       { _id: 0, vehicleId: 1, orgId: 1, model: 1 }));

show("AFTER: AP1 fleet_status_by_region (VH-1001)",
     db.fleet_status_by_region.findOne(
       { vehicleId: "VH-1001" },
       { _id: 0, region: 1, vehicle: 1 }));

show("AFTER: AP4 trips_by_route_and_day (VH-1001)",
     db.trips_by_route_and_day.findOne(
       { "vehicle.vehicleId": "VH-1001" },
       { _id: 0, tripId: 1, vehicle: 1 }));


/* ---------------------------------------------------------------
   2) Telemetry snapshot propagation (VH-2002)
---------------------------------------------------------------- */
show("BEFORE: AP5 latestTelemetry (VH-2002)",
     db.vehicle_details.findOne(
       { vehicleId: "VH-2002" },
       { _id: 0, vehicleId: 1, latestTelemetry: 1 }));

show("BEFORE: AP1 latestTelemetry (VH-2002)",
     db.fleet_status_by_region.findOne(
       { vehicleId: "VH-2002" },
       { _id: 0, region: 1, vehicleId: 1, latestTelemetry: 1 }));

// --- simulate a new telemetry snapshot from AP2
db.vehicle_details.updateOne(
  { vehicleId: "VH-2002" },
  { $set: { latestTelemetry: { speed: 71, temp: 78, pressure: 33.2 } } }
);

// --- propagate to AP1 (dashboard subset)
db.fleet_status_by_region.updateMany(
  { vehicleId: "VH-2002" },
  {
    $set: {
      "latestTelemetry.speed": 71,
      "latestTelemetry.temp": 78
    }
  }
);

show("AFTER: AP5 latestTelemetry (VH-2002)",
     db.vehicle_details.findOne(
       { vehicleId: "VH-2002" },
       { _id: 0, vehicleId: 1, latestTelemetry: 1 }));

show("AFTER: AP1 latestTelemetry (VH-2002)",
     db.fleet_status_by_region.findOne(
       { vehicleId: "VH-2002" },
       { _id: 0, region: 1, vehicleId: 1, latestTelemetry: 1 }));


/* ---------------------------------------------------------------
   3) Bounded sparkline (last ≤ 5 readings, TR-2010)
---------------------------------------------------------------- */
show("BEFORE: AP4 sparkline (lastFiveReadings, TR-2010)",
     db.trips_by_route_and_day.findOne(
       { tripId: "TR-2010" },
       { _id: 0, tripId: 1, lastFiveReadings: 1 }));

// Add 3 more readings → prove slice keeps latest 5
const more = [
  { ts: new Date(), speed: 69, temp: 72 },
  { ts: new Date(), speed: 70, temp: 73 },
  { ts: new Date(), speed: 71, temp: 74 }
];

db.trips_by_route_and_day.updateOne(
  { tripId: "TR-2010" },
  {
    $push: {
      lastFiveReadings: {
        $each: more,
        $slice: -5,
        $sort: { ts: 1 }
      }
    }
  }
);

show("AFTER: AP4 sparkline (kept newest 5, TR-2010)",
     db.trips_by_route_and_day.findOne(
       { tripId: "TR-2010" },
       { _id: 0, tripId: 1, lastFiveReadings: 1 }));

print("\n=== Part 2.3 proof script completed successfully ===");


