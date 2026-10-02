import test from "node:test";
import assert from "node:assert/strict";
import {
  slotAvailable,
  tableAvailability,
  addDays,
  validDay,
  sofiaNow,
} from "../lib/restaurant.ts";
const now = { day: "2026-10-01", hour: 10 },
  base = {
    id: "x",
    table_id: "T1",
    day: "2026-10-02",
    hour: 18,
    guests: 2,
    status: "confirmed",
  };
test("two-hour bookings block all overlapping starts, but not adjacent ones", () => {
  for (const hour of [17, 18, 19])
    assert.equal(slotAvailable([base], "T1", base.day, hour, now), false);
  for (const hour of [16, 20])
    assert.equal(slotAvailable([base], "T1", base.day, hour, now), true);
});
test("cancellation frees a table without affecting another date", () => {
  assert.equal(
    slotAvailable([{ ...base, status: "cancelled" }], "T1", base.day, 18, now),
    true,
  );
  assert.equal(slotAvailable([base], "T1", "2026-10-03", 18, now), true);
});
test("full and limited availability derive from all valid starts", () => {
  const rows = [12, 14, 16, 18, 20].map((hour) => ({ ...base, hour }));
  assert.equal(tableAvailability(rows, "T1", base.day, now).state, "full");
  assert.equal(
    tableAvailability(rows.slice(0, 4), "T1", base.day, now).state,
    "limited",
  );
  assert.deepEqual(
    tableAvailability(rows.slice(0, 4), "T1", base.day, now).hours,
    [20, 21],
  );
});
test("past dates, elapsed starts and closing hours cannot be selected", () => {
  assert.equal(slotAvailable([], "T1", "2026-09-30", 18, now), false);
  assert.equal(
    slotAvailable([], "T1", now.day, 12, { ...now, hour: 12.5 }),
    false,
  );
  assert.equal(slotAvailable([], "T1", base.day, 22, now), false);
});
test("calendar boundaries and Sofia timezone are consistent", () => {
  assert.equal(validDay("2026-02-30"), false);
  assert.equal(validDay("2028-02-29"), true);
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.deepEqual(sofiaNow(new Date("2026-10-01T21:30:00Z")), {
    day: "2026-10-02",
    hour: 0.5,
  });
});
