import { env } from "cloudflare:workers";
import { addDays, Booking, TABLES } from "@/lib/restaurant";
export function database() {
  if (!env.DB) throw new Error("Reservation storage is unavailable.");
  return env.DB;
}
const names = [
  "Elena Petrova",
  "Nikolay Ivanov",
  "Yuki Tanaka",
  "Maria Dimitrova",
  "Daniel Brooks",
  "Sofia Georgieva",
  "Alex Petrov",
  "Hana Suzuki",
  "Viktor Kolev",
  "Emma Wilson",
  "Boris Vasilev",
  "Mila Stoyanova",
];
export async function seedDay(owner: string, day: string, historic = false) {
  const db = database(),
    key = owner + ":" + day;
  if (
    await db.prepare("SELECT id FROM seeded_days WHERE id=?").bind(key).first()
  )
    return;
  const rows: Booking[] = [];
  const add = (table_id: string, hour: number, i: number) => {
    const table = TABLES.find((t) => t.id === table_id)!;
    const ni = (i + new Date(day).getUTCDate()) % names.length;
    const guests = table.seats === 2 ? 2 : 2 + (ni % (table.seats - 1));
    rows.push({
      id: key + ":" + table_id + ":" + hour,
      table_id,
      day,
      hour,
      guests,
      name: names[ni],
      email: names[ni].toLowerCase().replaceAll(" ", ".") + "@example.com",
      notes: ni === 0 ? "Window seat preferred" : "",
      status: historic ? "completed" : "confirmed",
      source: "sample",
      spend: historic ? guests * (26 + (ni % 12)) : 0,
    });
  };
  if (historic) {
    const n = 5 + new Date(day).getUTCDay();
    for (let i = 0; i < n; i++)
      add(TABLES[i % 8].id, 12 + Math.floor(i / 8) * 4 + (i % 3) * 2, i);
  } else {
    [12, 14, 16, 18, 20].forEach((h, i) => add("T3", h, i));
    [12, 14, 16, 18].forEach((h, i) => add("T6", h, i + 5));
    add("T2", 18, 2);
    add("T4", 19, 4);
    add("T5", 17, 6);
    add("T8", 20, 7);
    add("T1", new Date(day).getUTCDay() % 2 ? 18 : 19, 8);
  }
  const statements = rows.map((b) =>
    db
      .prepare(
        "INSERT OR IGNORE INTO reservations (id,owner,table_id,day,hour,guests,name,email,notes,status,source,spend) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      )
      .bind(
        b.id,
        owner,
        b.table_id,
        b.day,
        b.hour,
        b.guests,
        b.name,
        b.email,
        b.notes,
        b.status,
        b.source,
        b.spend,
      ),
  );
  statements.push(
    db.prepare("INSERT OR IGNORE INTO seeded_days (id) VALUES (?)").bind(key),
  );
  await db.batch(statements);
}
export async function seedHistory(owner: string, today: string) {
  const db = database();
  if (
    await db
      .prepare("SELECT id FROM seeded_days WHERE id=?")
      .bind(owner + ":history:" + today)
      .first()
  )
    return;
  for (let i = 1; i <= 30; i++) await seedDay(owner, addDays(today, -i), true);
  await db
    .prepare(
      "UPDATE reservations SET status='completed',spend=guests*32 WHERE owner=? AND day<? AND source='sample' AND status='confirmed'",
    )
    .bind(owner, today)
    .run();
  await db
    .prepare("INSERT OR IGNORE INTO seeded_days (id) VALUES (?)")
    .bind(owner + ":history:" + today)
    .run();
}
