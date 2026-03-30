# 🚚 Fleet Telemetry MongoDB Platform

### 📊 MongoDB | NoSQL Data Modeling | Document-First Design | Aggregation Pipelines | Fleet Analytics

<p>
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Containerization-Docker-2496ED?logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/Deployment-Docker%20Compose-2496ED"/>
  <img src="https://img.shields.io/badge/Language-JavaScript-F7DF1E?logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/badge/Tool-MongoDB%20Shell-4DB33D?logo=mongodb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tool-MongoDB%20Compass-111111?logo=mongodb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Architecture-Replica%20Set-green"/>
  <img src="https://img.shields.io/badge/Design-Document--First%20Modeling-purple"/>
  <img src="https://img.shields.io/badge/Focus-Indexing%20%7C%20Aggregation%20%7C%20Consistency-orange"/>
  <img src="https://img.shields.io/badge/Domain-Fleet%20Telemetry-red"/>
</p>

---

## 🚀 Project Overview

This project designs a MongoDB-based fleet telemetry platform for a logistics and predictive maintenance workload involving connected vehicles, regional fleet monitoring, trip telemetry, maintenance history, and operational analytics.

The system models the same fleet telemetry business scenario previously implemented using CockroachDB and Apache Cassandra, but redesigns it using MongoDB’s document-first approach. Instead of focusing on normalized schemas or table-per-query modeling, this version organizes data around access patterns, embedded document structures, and MongoDB-native aggregation pipelines.

The repository demonstrates how MongoDB can support:

- high-volume fleet status tracking  
- trip-based telemetry analysis  
- maintenance history retrieval  
- route and day level trip analytics  
- indexed document lookups  
- update propagation and consistency handling  
- replica-set-based availability in a Dockerized environment  

---

## 🎯 Why This Project Matters

Modern fleet platforms generate large volumes of semi-structured data from GPS systems, trip logs, maintenance events, vehicle status updates, and sensor telemetry streams.

MongoDB is a strong fit for this workload because it provides:

- flexible document structures for evolving telemetry fields  
- efficient storage of nested and grouped data  
- strong support for aggregation pipelines  
- indexing on nested fields and arrays  
- simpler modeling of related operational data  
- operational analytics without requiring many joins  

This project demonstrates how MongoDB can redesign a fleet telemetry workload around document boundaries, read-heavy access patterns, and faster retrieval of related data.

---

## 📊 Project Snapshot

- **Domain:** Fleet Management / IoT Telemetry / Predictive Maintenance  
- **Primary Database:** MongoDB  
- **Deployment:** Docker Compose  
- **Architecture:** MongoDB Replica Set  
- **Design Philosophy:** Document-First Data Modeling  

### Core Collections

- `fleet_status_by_region`
- `telemetry_by_trip`
- `maintenance_history_by_vehicle`
- `trips_by_route_and_day`
- `vehicle_details`

---

## 🏢 Business Scenario

A fleet operations company manages a large number of connected vehicles operating across multiple regions. Each vehicle continuously produces telemetry and operational events, including current fleet status, trip metrics, maintenance history, route-based summaries, and vehicle metadata.

The company needs a system that can:

- power regional operations dashboards  
- retrieve telemetry by trip efficiently  
- analyze activity trends by route and day  
- monitor maintenance events by vehicle  

This MongoDB implementation addresses these needs by storing data in collections aligned with business access patterns rather than forcing everything into a normalized relational structure.

---

## 🧠 Technology Stack

- MongoDB  
- MongoDB Shell (mongosh)  
- MongoDB Compass  
- JavaScript  
- Docker  
- Docker Compose  
- MongoDB Aggregation Framework  
- Indexes & Explain Plans  
- Quarto  

---

## ✨ Key Highlights

- Built a Dockerized MongoDB replica set for a fleet telemetry workload  
- Redesigned the same business scenario previously modeled in CockroachDB and Cassandra  
- Applied document-first modeling based on access patterns instead of normalization  
- Designed collections around regional dashboards, trip telemetry, maintenance history, and route analytics  
- Used aggregation pipelines for analytics such as grouped status and average speed analysis  
- Added indexes to improve read performance and reduce scan overhead  
- Demonstrated consistency update propagation across duplicated values  
- Included execution screenshots and technical report artifacts for reproducibility  

---

## 🏗️ MongoDB Design Philosophy

- model collections around access patterns  
- embed related data when retrieved together  
- use selective denormalization for read-heavy queries  
- optimize retrieval using indexes and aggregation pipelines   

---

## 🧩 Core Collection Design

### `fleet_status_by_region`
Stores regional fleet dashboard data for fast operational summaries and latest fleet activity views.

### `telemetry_by_trip`
Stores trip-oriented telemetry so vehicle activity can be analyzed chronologically within a trip.

### `maintenance_history_by_vehicle`
Stores maintenance events by vehicle so service history can be retrieved efficiently.

### `trips_by_route_and_day`
Stores trips grouped by route and date to support route-based operational planning.

### `vehicle_details`
Stores vehicle-level metadata and reference information used across queries.

---

## ⚙️ Repository Structure

```text
fleet-telemetry-mongodb-platform/
│
├── docker/
│   ├── docker-compose.yml
│   └── init/
│       ├── 01-rs-init.js
│       └── 02-create-user.js
│
├── images/
│   ├── AP1AggregationAvgSpeed.jpg
│   ├── AP1MQLQueryResultandIndexes.jpg
│   ├── AP2ExplainPlan.jpg
│   ├── AP2MQLQueryResultandIndexes.jpg
│   ├── AP3MQLQueryResultandIndexes.jpg
│   ├── AP4MQLQueryResultandIndexes.jpg
│   ├── AP5MQLQueryResultandIndexes.jpg
│   ├── AfterSparkline.jpg
│   ├── AfterUpdateTelemetry.jpg
│   ├── AfterUpdateVehicleLabel.jpg
│   ├── BeforeSparkline.jpg
│   ├── BeforeUpdateTelemetry.jpg
│   ├── BeforeUpdateVehicleLabel.jpg
│   ├── ClusterUPandContainersHealthy.jpg
│   ├── CollectionsCreation.jpg
│   ├── DuplicatesBeforeUpdate1.jpg
│   ├── DuplicatesBeforeUpdate2.jpg
│   └── StatusandConnectivity.jpg
│
├── reports/
│   ├── fleet_telemetry_mongodb_report.pdf
│   └── fleet_telemetry_mongodb_report.qmd
│
├── scripts/
│   ├── mongodb_consistency_updates.js
│   ├── mongodb_query_proofs.js
│   └── mongodb_schema_setup.js
│
├── README.md
└── .gitignore
```

---

## 🐳 Dockerized Replica Set Setup

The project uses a Dockerized MongoDB replica set with initialization scripts for:

- replica set configuration  
- authenticated user creation  
- production-style deployment structure  
- high availability and failover support  

---

## ▶️ How to Run

```bash
# Clone repository
git clone https://github.com/your-username/fleet-telemetry-mongodb-platform.git

# Start containers
cd docker
docker compose up -d

# Verify running services
docker ps

# Run setup script
mongosh "mongodb://localhost:27017/?directConnection=true" scripts/mongodb_schema_setup.js

# Run query demonstrations
mongosh "mongodb://localhost:27017/?directConnection=true" scripts/mongodb_query_proofs.js

# Run consistency updates
mongosh "mongodb://localhost:27017/?directConnection=true" scripts/mongodb_consistency_updates.js
```

---

## 🔍 Query and Analytics Coverage

The project demonstrates:

1. regional fleet dashboard queries  
2. trip telemetry retrieval  
3. maintenance history lookups  
4. trips by route and day  
5. vehicle detail retrieval  
6. grouped operational analytics using aggregation pipelines  

---

## 📈 Indexing Strategy

### Indexing Goals

- accelerate direct lookups  
- improve sorted retrieval  
- reduce document scans  
- support dashboard access patterns  
- improve explain-plan behavior  

### Benefits Observed

- fewer scanned records  
- improved filter efficiency  
- faster query execution  
- better support for read-heavy access patterns  

---

## 🧪 Aggregation Pipeline Usage

MongoDB aggregation pipelines are used for:

- average speed calculations  
- grouped fleet status by region  
- route-level summaries  
- trip-level analytics  
- operational dashboard rollups  

---

## 🔄 Consistency and Update Propagation

This project also demonstrates how selective denormalization requires update propagation when duplicated values change.

Examples include:

- updating a vehicle label  
- updating telemetry-related values  
- inspecting before/after states  
- validating consistency across duplicated records  

---

## 🖼️ Execution Proofs and Visual Outputs

The repository includes screenshots showing:

- replica set and container health  
- MongoDB connectivity  
- collection creation  
- aggregation results  
- indexed query outputs  
- explain plans  
- consistency updates before and after propagation  

---

## 📄 Report Artifacts

The `reports/` folder contains:

- `fleet_telemetry_mongodb_report.pdf`  
- `fleet_telemetry_mongodb_report.qmd`  

These files document:

- collection modeling decisions  
- indexing strategy  
- aggregation usage  
- consistency handling  
- execution proofs and screenshots  

---

## ⚖️ Positioning Within the Database Series

This repository is the MongoDB implementation of the same fleet telemetry workload previously modeled using CockroachDB and Cassandra.

### Architectural Progression

1. CockroachDB — distributed SQL and strong consistency  
2. Cassandra — query-first denormalized table design  
3. MongoDB — document-first modeling with aggregation-driven analytics  

---

## 💼 Business Impact

This project demonstrates how MongoDB can support fleet and IoT analytics by enabling:

- faster dashboard-style retrieval  
- efficient grouping of trip and regional metrics  
- improved support for logistics, predictive maintenance, and connected vehicle analytics  

---

## 🛠️ Skills Demonstrated

- MongoDB  
- NoSQL Data Modeling  
- Document-First Schema Design  
- Aggregation Pipelines  
- Query Optimization  
- Explain Plans  
- Index Design  
- MongoDB Replica Sets  
- Docker / Docker Compose  
- Consistency Update Handling  
- Fleet Telemetry Analytics  
- Comparative Database Architecture  

---

## 🔮 Future Improvements

- add real-time ingestion using Kafka or MQTT  
- benchmark larger telemetry streams  
- build an operational dashboard using React or Grafana  
- deploy in MongoDB Atlas  
- add predictive maintenance scoring models  
- benchmark against CockroachDB and Cassandra  

---

## ✅ Conclusion

This project demonstrates how MongoDB can support fleet telemetry and predictive maintenance workloads using a document-first, access-pattern-driven approach.

The repository highlights MongoDB’s strengths in flexible document modeling, aggregation-based analytics, indexed retrieval, and support for semi-structured operational data while also showing the trade-offs around denormalization and update consistency.
