import assert from "node:assert/strict";
import { addDays, sofiaNow } from "../lib/restaurant.ts";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:5173";
const day = addDays(sofiaNow().day, 3);
const initial = await fetch(base + "/api/reservations?day=" + day);
assert.equal(initial.status, 200);
const cookie = initial.headers.get("set-cookie").split(";")[0];
const request = (method, body, ownCookie = cookie) =>
  fetch(base + "/api/reservations", {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: ownCookie,
      Origin: base,
    },
    body: JSON.stringify(body),
  });
const booking = {
  id: crypto.randomUUID(),
  table_id: "T7",
  day,
  hour: 12,
  guests: 2,
  name: "API Test Guest",
  email: "api.test@example.com",
  notes: "Automated integration check",
};
const race = await Promise.all([
  request("POST", booking),
  request("POST", { ...booking, id: crypto.randomUUID() }),
]);
assert.deepEqual(
  race.map((r) => r.status).sort(),
  [201, 409],
  "atomic conflict protection",
);
const saved = await fetch(base + "/api/reservations?day=" + day, {
  headers: { Cookie: cookie },
}).then((r) => r.json());
const record = saved.bookings.find((b) => b.name === "API Test Guest");
assert.ok(record, "booking persists on reload");
assert.equal(
  (await request("POST", { ...booking, id: crypto.randomUUID(), hour: 13 }))
    .status,
  409,
  "overlapping start blocked",
);
assert.equal(
  (
    await request("POST", {
      ...booking,
      id: crypto.randomUUID(),
      hour: 16,
      guests: 6,
    })
  ).status,
  400,
  "capacity enforced",
);
assert.equal(
  (
    await request("POST", {
      ...booking,
      id: crypto.randomUUID(),
      day: "2026-02-30",
    })
  ).status,
  400,
  "invalid date rejected",
);
assert.equal(
  (await request("PATCH", { id: record.id, status: "cancelled" }, "")).status,
  404,
  "session isolation",
);
assert.equal(
  (await request("PATCH", { id: record.id, status: "cancelled" })).status,
  200,
  "cancellation succeeds",
);
assert.equal(
  (await request("POST", { ...booking, id: crypto.randomUUID() })).status,
  201,
  "cancellation releases availability",
);
const second = await fetch(base + "/api/reservations?day=" + day, {
  headers: { Cookie: cookie },
}).then((r) => r.json());
const confirmed = second.bookings.find(
  (b) => b.name === "API Test Guest" && b.status === "confirmed",
);
assert.equal(
  (await request("PATCH", { id: confirmed.id, status: "seated" })).status,
  200,
);
assert.equal(
  (await request("PATCH", { id: confirmed.id, status: "completed", spend: 82 }))
    .status,
  200,
);
assert.equal(
  (await request("PATCH", { id: confirmed.id, status: "seated" })).status,
  409,
  "terminal states protected",
);
const rejected = await fetch(base + "/api/reservations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Cookie: cookie,
    Origin: "https://unrelated.example",
  },
  body: JSON.stringify(booking),
});
assert.equal(rejected.status, 403, "cross-origin mutation rejected");
console.log(
  "PASS: concurrent conflict, overlap, persistence, capacity, dates, isolation, cancellation, service lifecycle, and origin checks",
);
