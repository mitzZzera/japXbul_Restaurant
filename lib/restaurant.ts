export const TABLES = [
  {
    id: "T1",
    name: "Pirin window",
    zone: "Window",
    seats: 2,
    x: 16,
    y: 23,
    shape: "round",
    description:
      "A quiet table for two, right beside the mountain-view window.",
  },
  {
    id: "T2",
    name: "Sunset window",
    zone: "Window",
    seats: 4,
    x: 42,
    y: 23,
    shape: "square",
    description: "Warm afternoon light and a wide view of the Pirin mountains.",
  },
  {
    id: "T3",
    name: "Corner window",
    zone: "Window",
    seats: 2,
    x: 70,
    y: 23,
    shape: "round",
    description:
      "Our intimate corner table, framed by wood and mountain views.",
  },
  {
    id: "T4",
    name: "Lantern table",
    zone: "Dining room",
    seats: 4,
    x: 16,
    y: 52,
    shape: "square",
    description: "At the heart of the dining room, under our paper lanterns.",
  },
  {
    id: "T5",
    name: "Gathering table",
    zone: "Dining room",
    seats: 6,
    x: 44,
    y: 52,
    shape: "long",
    description:
      "A generous table for family, friends, and plenty of shared plates.",
  },
  {
    id: "T6",
    name: "The cosy booth",
    zone: "Booth",
    seats: 4,
    x: 76,
    y: 54,
    shape: "booth",
    description: "A tucked-away booth with Bulgarian woven cushions.",
  },
  {
    id: "T7",
    name: "Kitchen side",
    zone: "Kitchen",
    seats: 2,
    x: 20,
    y: 80,
    shape: "round",
    description: "A front-row seat to the energy of our open kitchen.",
  },
  {
    id: "T8",
    name: "Chef’s table",
    zone: "Kitchen",
    seats: 4,
    x: 51,
    y: 80,
    shape: "square",
    description:
      "Close to the open kitchen, with a little theatre at every course.",
  },
];
export const HOURS = Array.from({ length: 10 }, (_, i) => i + 12);
export type Booking = {
  id: string;
  table_id: string;
  day: string;
  hour: number;
  guests: number;
  name: string;
  email: string;
  notes: string;
  status: "confirmed" | "seated" | "completed" | "cancelled" | "no-show";
  source: "sample" | "guest";
  spend: number;
};
export function sofiaNow(now = new Date()) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Sofia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const p = Object.fromEntries(f.map((v) => [v.type, v.value]));
  return {
    day: p.year + "-" + p.month + "-" + p.day,
    hour: Number(p.hour) + Number(p.minute) / 60,
  };
}
export function addDays(day: string, n: number) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function prettyDate(day: string) {
  return new Date(day + "T12:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}
export function overlaps(a: number, b: number) {
  return a < b + 2 && b < a + 2;
}
export function slotAvailable(
  rows: Booking[],
  table: string,
  day: string,
  hour: number,
  now = sofiaNow(),
) {
  return (
    HOURS.includes(hour) &&
    !(day < now.day || (day === now.day && hour <= now.hour)) &&
    !rows.some(
      (b) =>
        b.table_id === table &&
        b.day === day &&
        !["cancelled", "no-show"].includes(b.status) &&
        overlaps(hour, b.hour),
    )
  );
}
export function tableAvailability(
  rows: Booking[],
  table: string,
  day: string,
  now = sofiaNow(),
) {
  const hours = HOURS.filter((h) => slotAvailable(rows, table, day, h, now));
  return {
    hours,
    state:
      hours.length === 0 ? "full" : hours.length <= 2 ? "limited" : "available",
  };
}
export function validDay(day: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    !Number.isNaN(Date.parse(day + "T12:00:00Z")) &&
    new Date(day + "T12:00:00Z").toISOString().slice(0, 10) === day
  );
}
