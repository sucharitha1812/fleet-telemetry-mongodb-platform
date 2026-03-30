// 01-rs-init.js
// Aligns with professor's docker-compose (rs0, ports 27017/27018/27019)

const rsConfig = {
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },
    { _id: 1, host: "mongo2:27018", priority: 1 },
    { _id: 2, host: "mongo3:27019", priority: 1 }
  ]
};

(function ensureReplicaSet() {
  try {
    const status = rs.status();
    if (status && status.ok === 1) {
      print("Replica set already initialized; skipping rs.initiate().");
      return;
    }
  } catch (e) {
    // not initiated yet
  }

  print("Initiating replica set rs0...");
  rs.initiate(rsConfig);

  // Wait for PRIMARY
  let attempts = 60;
  while (attempts--) {
    try {
      const s = rs.status();
      const primary = s.members && s.members.find(m => m.stateStr === "PRIMARY");
      if (primary) {
        print("Replica set PRIMARY is: " + primary.name);
        break;
      }
    } catch (err) {}
    sleep(1000);
  }
})();
