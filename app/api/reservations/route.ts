import { z } from "zod";
import { database, seedDay, seedHistory } from "@/db/reservations";
import { sofiaNow, addDays, validDay, HOURS, TABLES } from "@/lib/restaurant";
export const dynamic = "force-dynamic";
function session(req: Request) {
  const value = req.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)sora_demo=([a-f0-9-]{36})(?:;|$)/)?.[1];
  return value || crypto.randomUUID();
}
function response(req: Request, owner: string, data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Set-Cookie":
        "sora_demo=" +
        owner +
        "; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000" +
        (new URL(req.url).protocol === "https:" ? "; Secure" : ""),
    },
  });
}
function originAllowed(req: Request) {
  const origin = req.headers.get("origin");
  return !origin || origin === new URL(req.url).origin;
}
export async function GET(req: Request) {
  const owner = session(req);
  try {
    const day =
      new URL(req.url).searchParams.get("day") || addDays(sofiaNow().day, 1);
    if (
      !validDay(day) ||
      day < sofiaNow().day ||
      day > addDays(sofiaNow().day, 90)
    )
      return response(
        req,
        owner,
        { error: "Please choose a date within the next 90 days." },
        400,
      );
    await seedHistory(owner, sofiaNow().day);
    await seedDay(owner, day);
    const result = await database()
      .prepare(
        "SELECT id,table_id,day,hour,guests,name,email,notes,status,source,spend FROM reservations WHERE owner=? ORDER BY day,hour",
      )
      .bind(owner)
      .all();
    return response(req, owner, { bookings: result.results, day });
  } catch (error) {
    console.error("Reservation load failed", error);
    return response(
      req,
      owner,
      { error: "We couldn’t load reservations. Please try again." },
      503,
    );
  }
}
export async function POST(req: Request) {
  const owner = session(req);
  if (!originAllowed(req))
    return response(
      req,
      owner,
      { error: "Request origin is not allowed." },
      403,
    );
  try {
    const b = z
      .object({
        id: z.string().uuid(),
        table_id: z.string(),
        day: z.string(),
        hour: z.number().int(),
        guests: z.number().int(),
        name: z.string(),
        email: z.string(),
        notes: z.string(),
      })
      .parse(await req.json());
    const table = TABLES.find((t) => t.id === b.table_id),
      now = sofiaNow();
    if (
      !table ||
      !validDay(b.day) ||
      b.day < now.day ||
      b.day > addDays(now.day, 90) ||
      !HOURS.includes(b.hour) ||
      (b.day === now.day && b.hour <= now.hour) ||
      !Number.isInteger(b.guests) ||
      b.guests < 1 ||
      b.guests > table.seats ||
      typeof b.name !== "string" ||
      b.name.trim().length < 2 ||
      b.name.length > 80 ||
      typeof b.email !== "string" ||
      b.email.length > 120 ||
      !/^\S+@\S+\.\S+$/.test(b.email) ||
      typeof b.notes !== "string" ||
      b.notes.length > 500 ||
      typeof b.id !== "string" ||
      !/^[a-f0-9-]{36}$/.test(b.id)
    )
      return response(
        req,
        owner,
        {
          error: "Please check your date, table capacity and contact details.",
        },
        400,
      );
    await seedDay(owner, b.day);
    const db = database();
    const existing = await db
      .prepare("SELECT id FROM reservations WHERE id=? AND owner=?")
      .bind(b.id, owner)
      .first();
    if (existing) return response(req, owner, { id: b.id }, 200);
    const result = await db
      .prepare(
        "INSERT INTO reservations (id,owner,table_id,day,hour,guests,name,email,notes,status,source,spend) SELECT ?,?,?,?,?,?,?,?,?, 'confirmed','guest',0 WHERE NOT EXISTS (SELECT 1 FROM reservations WHERE owner=? AND table_id=? AND day=? AND status NOT IN ('cancelled','no-show') AND hour < ? AND hour+2 > ?)",
      )
      .bind(
        b.id,
        owner,
        b.table_id,
        b.day,
        b.hour,
        b.guests,
        b.name.trim(),
        b.email.trim().toLowerCase(),
        b.notes.trim(),
        owner,
        b.table_id,
        b.day,
        b.hour + 2,
        b.hour,
      )
      .run();
    if (result.meta.changes === 0)
      return response(
        req,
        owner,
        {
          error: "This time has just been booked. Please choose another time.",
        },
        409,
      );
    return response(req, owner, { id: b.id }, 201);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return response(
        req,
        owner,
        { error: "Please check your reservation details." },
        400,
      );
    console.error("Reservation creation failed", error);
    return response(
      req,
      owner,
      {
        error:
          "We couldn’t save your reservation. Your details are still here; please try again.",
      },
      503,
    );
  }
}
export async function PATCH(req: Request) {
  const owner = session(req);
  if (!originAllowed(req))
    return response(
      req,
      owner,
      { error: "Request origin is not allowed." },
      403,
    );
  try {
    const b = z
      .object({
        id: z.string(),
        status: z.string(),
        spend: z.number().optional(),
      })
      .parse(await req.json());
    if (
      typeof b.id !== "string" ||
      !["seated", "completed", "cancelled", "no-show"].includes(b.status)
    )
      return response(
        req,
        owner,
        { error: "Invalid reservation change." },
        400,
      );
    const old = await database()
      .prepare("SELECT status,guests FROM reservations WHERE owner=? AND id=?")
      .bind(owner, b.id)
      .first<{ status: string; guests: number }>();
    if (!old)
      return response(req, owner, { error: "Reservation not found." }, 404);
    const allowed: Record<string, string[]> = {
      confirmed: ["seated", "cancelled", "no-show"],
      seated: ["completed", "cancelled"],
    };
    if (!allowed[old.status]?.includes(b.status))
      return response(
        req,
        owner,
        { error: "This reservation can no longer be changed." },
        409,
      );
    const spend = b.status === "completed" ? Number(b.spend || 0) : 0;
    if (!Number.isFinite(spend) || spend < 0 || spend > 10000)
      return response(req, owner, { error: "Enter a valid bill total." }, 400);
    const result = await database()
      .prepare(
        "UPDATE reservations SET status=?,spend=? WHERE id=? AND owner=? AND status=?",
      )
      .bind(b.status, Math.round(spend), b.id, owner, old.status)
      .run();
    if (!result.meta.changes)
      return response(
        req,
        owner,
        { error: "This reservation changed. Please refresh." },
        409,
      );
    return response(req, owner, { ok: true });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return response(
        req,
        owner,
        { error: "Please check the reservation change." },
        400,
      );
    console.error("Reservation update failed", error);
    return response(
      req,
      owner,
      { error: "We couldn’t update this reservation. Please try again." },
      503,
    );
  }
}
