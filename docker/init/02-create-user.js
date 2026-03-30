// 02-create-user.js
// Creates an app user for your assignment DB (safe even without auth enforced)

const appDb   = (typeof process !== "undefined" && process.env && process.env.APP_DB)   || "fleet";
const appUser = (typeof process !== "undefined" && process.env && process.env.APP_USER) || "fleetuser";
const appPass = (typeof process !== "undefined" && process.env && process.env.APP_PASS) || "fleetpass";

print(`Using DB=${appDb}, USER=${appUser}`);

db = db.getSiblingDB(appDb);

if (!db.getUser(appUser)) {
  db.createUser({
    user: appUser,
    pwd: appPass,
    roles: [{ role: "readWrite", db: appDb }]
  });
  print(`Created user "${appUser}" on DB "${appDb}".`);
} else {
  print(`User "${appUser}" already exists on DB "${appDb}" — skipping.`);
}
