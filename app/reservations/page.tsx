"use client";
import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Users,
  MapPin,
  Clock3,
  Check,
  Utensils,
  BarChart3,
  UserRound,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Mountain,
  Info,
  RefreshCw,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  TABLES,
  HOURS,
  Booking,
  sofiaNow,
  addDays,
  prettyDate,
  tableAvailability,
  slotAvailable,
} from "@/lib/restaurant";
import "./reservations.css";
type Role = "customer" | "staff" | "owner";
const money = (n: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
const time = (n: number) => String(n).padStart(2, "0") + ":00";
export default function Reservations() {
  const [role, setRole] = useState<Role>("customer"),
    [day, setDay] = useState(() => addDays(sofiaNow().day, 1)),
    [guests, setGuests] = useState("2"),
    [tableId, setTableId] = useState("T1"),
    [hour, setHour] = useState<number | null>(null),
    [rows, setRows] = useState<Booking[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0),
    [bookingOpen, setBookingOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [formError, setFormError] = useState(""),
    [success, setSuccess] = useState<Booking | null>(null),
    [zone, setZone] = useState("All tables"),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [manage, setManage] = useState<Booking | null>(null),
    [cancel, setCancel] = useState<Booking | null>(null),
    [range, setRange] = useState("30"),
    [profile, setProfile] = useState<string | null>(null),
    [bill, setBill] = useState(""),
    [requestId, setRequestId] = useState("");
  const today = sofiaNow().day,
    table = TABLES.find((t) => t.id === tableId)!;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setHour(null);
    fetch("/api/reservations?day=" + day, { signal: controller.signal })
      .then(async (r) => {
        const d = (await r.json()) as { error: string; bookings: Booking[] };
        if (!r.ok) throw new Error(d.error);
        setRows(d.bookings);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [day, reload]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: { registerTool: (t: unknown, o: unknown) => void };
      }
    ).modelContext;
    if (!context) return;
    const c = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: "show_reservation_availability",
            description:
              "Open the reservation date and table in the customer view. This does not create a booking.",
            inputSchema: {
              type: "object",
              properties: {
                day: { type: "string" },
                tableId: { type: "string", enum: TABLES.map((t) => t.id) },
              },
              required: ["day", "tableId"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: async (input: { day: string; tableId: string }) => {
              if (
                !/^\d{4}-\d{2}-\d{2}$/.test(input.day) ||
                input.day < today ||
                input.day > addDays(today, 90) ||
                !TABLES.some((t) => t.id === input.tableId)
              )
                throw new Error(
                  "Choose a valid table and a date within 90 days.",
                );
              setDay(input.day);
              setTableId(input.tableId);
              setRole("customer");
              setHour(null);
              return {
                view: "customer",
                day: input.day,
                tableId: input.tableId,
                bookingCreated: false,
              };
            },
          },
          { signal: c.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => c.abort();
  }, [today]);
  const daily = rows.filter((b) => b.day === day),
    active = daily.filter((b) => !["cancelled", "no-show"].includes(b.status)),
    myBookings = rows.filter((b) => b.source === "guest" && b.day >= today);
  const availability = tableAvailability(rows, tableId, day);
  async function createBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    const f = new FormData(e.currentTarget);
    const booking = {
      id: requestId,
      table_id: tableId,
      day,
      hour,
      guests: Number(guests),
      name: f.get("name"),
      email: f.get("email"),
      notes: f.get("notes") || "",
    };
    try {
      const r = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
      const d = (await r.json()) as { error: string; bookings: Booking[] };
      if (!r.ok) throw new Error(d.error);
      setSuccess({
        ...booking,
        status: "confirmed",
        source: "guest",
        spend: 0,
      } as Booking);
      setBookingOpen(false);
      setReload((v) => v + 1);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function changeBooking(b: Booking, next: string) {
    setBusy(true);
    setFormError("");
    try {
      const r = await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: b.id,
          status: next,
          spend: next === "completed" ? Number(bill) : 0,
        }),
      });
      const d = (await r.json()) as { error: string; bookings: Booking[] };
      if (!r.ok) throw new Error(d.error);
      setManage(null);
      setCancel(null);
      setSuccess(null);
      setReload((v) => v + 1);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const completed = useMemo(
    () =>
      rows.filter(
        (b) =>
          b.status === "completed" &&
          b.day >= addDays(today, 1 - Number(range)) &&
          b.day <= today,
      ),
    [rows, today, range],
  );
  const customerGroups = useMemo(() => {
    const m = new Map<
      string,
      {
        name: string;
        email: string;
        visits: number;
        spend: number;
        last: string;
        guests: number;
      }
    >();
    for (const b of completed) {
      const c = m.get(b.email) || {
        name: b.name,
        email: b.email,
        visits: 0,
        spend: 0,
        last: b.day,
        guests: 0,
      };
      c.visits++;
      c.spend += b.spend;
      c.last = b.day > c.last ? b.day : c.last;
      c.guests += b.guests;
      m.set(b.email, c);
    }
    return [...m.values()].sort((a, b) => b.visits - a.visits);
  }, [completed]);
  const repeat = customerGroups.length
    ? Math.round(
        (100 * customerGroups.filter((c) => c.visits > 1).length) /
          customerGroups.length,
      )
    : 0;
  const chart = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6);
    return {
      day: d,
      value: completed
        .filter((b) => b.day === d)
        .reduce((s, b) => s + b.guests, 0),
    };
  });
  const filtered = daily.filter(
    (b) =>
      (status === "all" || b.status === status) &&
      (b.name + " " + b.email + " " + b.table_id)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <Tabs
      value={role}
      onValueChange={(v) => setRole(v as Role)}
      className="reservation-app"
    >
      <header className="site-header reservation-header">
        <a className="wordmark" href="/">
          <span className="brand-symbol">空</span>
          <span>
            SORA <i>&</i> SOL<small>JAPANESE SOUL · BULGARIAN HEART</small>
          </span>
        </a>
        <a className="back-link" href="/">
          Back to the restaurant
        </a>
      </header>
      <div className="view-bar">
        <span>
          <span className="demo-label">INTERACTIVE DEMO</span>
          <span className="view-hint">See the experience from every seat</span>
        </span>
        <TabsList className="role-switch" aria-label="Choose your view">
          <TabsTrigger value="customer">
            <UserRound size={15} />
            Customer
          </TabsTrigger>
          <TabsTrigger value="staff">
            <Utensils size={15} />
            Staff
          </TabsTrigger>
          <TabsTrigger value="owner">
            <BarChart3 size={15} />
            Owner
          </TabsTrigger>
        </TabsList>
      </div>
      <main className="reservation-main">
        <div className="reservation-title">
          <div>
            <p className="eyebrow red">
              {role === "customer"
                ? "A LITTLE ANTICIPATION. A LOVELY EVENING."
                : role === "staff"
                  ? "THE DINING ROOM, AT A GLANCE"
                  : "THE PEOPLE BEHIND THE NUMBERS"}
            </p>
            <h1>
              {role === "customer" ? (
                <>
                  Find your <em>favourite seat.</em>
                </>
              ) : role === "staff" ? (
                <>
                  Ready for <em>service.</em>
                </>
              ) : (
                <>
                  A table worth <em>coming back to.</em>
                </>
              )}
            </h1>
            <p>
              {role === "customer"
                ? "Choose a day, find your corner, and make it yours."
                : role === "staff"
                  ? "Welcome guests, manage arrivals, and keep the evening flowing."
                  : "Understand your guests and the moments that bring them back."}
            </p>
          </div>
          <span className="reservation-location">
            <MapPin size={16} /> Bansko, Bulgaria
          </span>
        </div>
        <div className="demo-note">
          <Info size={15} />
          <span>
            Explore with sample guests. New bookings are saved to your private
            browser demo; no restaurant is contacted.
          </span>
        </div>
        {error && (
          <div className="error-banner" role="alert">
            {error}
            <button
              className="text-button"
              onClick={() => setReload((v) => v + 1)}
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        )}
        {role !== "owner" && (
          <div className="booking-controls">
            <label className="date-control">
              <CalendarDays size={19} />
              <span>
                <small>WHEN WOULD YOU LIKE TO JOIN US?</small>
                <input
                  type="date"
                  aria-label="Reservation date"
                  min={today}
                  max={addDays(today, 90)}
                  value={day}
                  onChange={(e) => {
                    if (e.target.value) setDay(e.target.value);
                    setSuccess(null);
                  }}
                />
              </span>
            </label>
            <div className="control-divider" />
            <div className="guests-control">
              <Users size={19} />
              <div>
                <label id="guests-label">YOUR PARTY</label>
                <Select
                  value={guests}
                  onValueChange={(v) => {
                    setGuests(v);
                    setHour(null);
                  }}
                >
                  <SelectTrigger aria-labelledby="guests-label">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {n === 1 ? "guest" : "guests"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="service-hours">
              <Clock3 size={17} />
              <span>
                12:00–23:00 · 2-hour tables
                <br />
                <small>All times are local to Bansko</small>
              </span>
            </div>
          </div>
        )}
        <TabsContent value="customer">
          {success && (
            <div className="success-banner" role="status">
              <CheckCircle2 />
              <div>
                <strong>
                  Your table is reserved, {success.name.split(" ")[0]}.
                </strong>
                <p>
                  {prettyDate(success.day)} · {time(success.hour)}–
                  {time(success.hour + 2)} · {success.table_id} ·{" "}
                  {success.guests} guests
                </p>
                <small>
                  Saved in this demo. No confirmation email is sent.
                </small>
              </div>
              <button
                aria-label="Dismiss confirmation"
                onClick={() => setSuccess(null)}
              >
                <X size={18} />
              </button>
            </div>
          )}
          <div className="reservation-grid">
            <section className="floor-card">
              <div className="floor-heading">
                <div>
                  <h2>A place for every mood.</h2>
                  <p>Select a table to see its available times.</p>
                </div>
                <span className="room-label">
                  <LayoutGrid size={15} />
                  Ground floor
                </span>
              </div>
              <div className="zone-filters" aria-label="Filter tables by area">
                {["All tables", "Window", "Booth", "Kitchen"].map((z) => (
                  <button
                    aria-pressed={zone === z}
                    className={zone === z ? "active" : ""}
                    key={z}
                    onClick={() => setZone(z)}
                  >
                    {z}
                  </button>
                ))}
              </div>
              <div
                className="floor-plan"
                aria-label="Interactive restaurant floor plan"
              >
                <div className="window-wall">
                  <Mountain size={14} />
                  <span>WINDOWS · PIRIN MOUNTAIN VIEW</span>
                </div>
                <div className="left-wall" />
                <div className="right-wall" />
                <div className="floor-aisle">THE DINING ROOM</div>
                <div className="kitchen-label">OPEN KITCHEN</div>
                <div className="entrance-label">ENTRANCE</div>
                {TABLES.map((t) => {
                  const a = tableAvailability(rows, t.id, day),
                    fits = t.seats >= Number(guests),
                    matches = zone === "All tables" || zone === t.zone;
                  return (
                    <button
                      key={t.id}
                      className={[
                        "restaurant-table",
                        t.shape,
                        loading || error ? "pending" : a.state,
                        tableId === t.id ? "selected" : "",
                        !fits || !matches ? "muted-table" : "",
                      ].join(" ")}
                      style={{ left: t.x + "%", top: t.y + "%" }}
                      onClick={() => {
                        setTableId(t.id);
                        setHour(null);
                      }}
                      aria-pressed={tableId === t.id}
                      aria-label={
                        t.id +
                        ", " +
                        t.name +
                        ", " +
                        t.seats +
                        " seats, " +
                        (loading
                          ? "loading"
                          : error
                            ? "unavailable"
                            : a.state === "full"
                              ? "fully booked"
                              : a.hours.length + " available times") +
                        (fits ? "" : ", too small for your party")
                      }
                    >
                      <span className="table-chairs" aria-hidden="true" />
                      <strong>{t.id}</strong>
                      <small>{t.seats} seats</small>
                      {tableId === t.id && (
                        <span className="table-check">
                          <Check size={10} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="floor-legend">
                <span>
                  <i className="legend-dot available" />
                  Available
                </span>
                <span>
                  <i className="legend-dot limited" />
                  Almost booked
                </span>
                <span>
                  <i className="legend-dot full" />
                  Fully booked
                </span>
                <span className="legend-explanation">
                  Amber = 1–2 times left
                </span>
              </div>
            </section>
            <aside className="table-panel">
              <div
                className="table-photo"
                style={{
                  backgroundImage:
                    "url('/images/" +
                    (table.zone === "Window"
                      ? "window-table"
                      : "restaurant-hero") +
                    ".png')",
                }}
              >
                <span>
                  {table.zone === "Window"
                    ? "A VIEW TO REMEMBER"
                    : "YOUR LITTLE CORNER"}
                </span>
              </div>
              <div className="table-panel-body">
                <div className="table-title-row">
                  <h2>{table.name}</h2>
                  <span className="table-id">{table.id}</span>
                </div>
                <div className="table-meta">
                  <span>
                    <Users size={14} />
                    Up to {table.seats}
                  </span>
                  <span>
                    <MapPin size={14} />
                    {table.zone}
                  </span>
                </div>
                <p className="table-description">{table.description}</p>
                <div className="times-heading">
                  <strong>Make time for a good evening</strong>
                  <span>{prettyDate(day)}</span>
                </div>
                {loading ? (
                  <div className="load-state" role="status">
                    Finding your seat…
                  </div>
                ) : error ? (
                  <p className="inline-error">
                    Availability is temporarily unavailable.
                  </p>
                ) : Number(guests) > table.seats ? (
                  <div className="capacity-note">
                    This table seats {table.seats}. Choose a larger table for
                    your party of {guests}.
                  </div>
                ) : (
                  <>
                    <div className="time-slots">
                      {HOURS.map((h) => {
                        const open = slotAvailable(rows, tableId, day, h);
                        return (
                          <button
                            key={h}
                            disabled={!open}
                            className={hour === h ? "selected" : ""}
                            aria-pressed={hour === h}
                            aria-label={
                              time(h) + (open ? ", available" : ", unavailable")
                            }
                            onClick={() => setHour(h)}
                          >
                            {time(h)}
                          </button>
                        );
                      })}
                    </div>
                    {availability.hours.length === 0 && (
                      <p className="inline-error">
                        This table is fully booked for the day. Try another
                        table or date.
                      </p>
                    )}
                    <p className="slot-note">
                      Each reservation gives you two unhurried hours.
                    </p>
                  </>
                )}
                <button
                  className="button reserve-button"
                  disabled={
                    loading ||
                    !!error ||
                    hour === null ||
                    Number(guests) > table.seats ||
                    !slotAvailable(rows, tableId, day, hour)
                  }
                  onClick={() => {
                    setFormError("");
                    setRequestId(crypto.randomUUID());
                    setBookingOpen(true);
                  }}
                >
                  {hour === null
                    ? "Choose a time to reserve"
                    : "Reserve " + tableId + " at " + time(hour)}
                </button>
                <p className="no-deposit">
                  No deposit. Just something to look forward to.
                </p>
              </div>
            </aside>
          </div>
          {myBookings.length > 0 && (
            <section className="my-bookings">
              <h2>Your reservations</h2>
              <div className="my-booking-list">
                {myBookings.map((b) => (
                  <div className="my-booking" key={b.id}>
                    <CalendarDays size={20} />
                    <div>
                      <strong>
                        {prettyDate(b.day)} · {time(b.hour)}
                      </strong>
                      <p>
                        {b.table_id} · {b.guests} guests · {b.name}
                      </p>
                    </div>
                    <span className={"status-badge " + b.status}>
                      {b.status}
                    </span>
                    {b.status === "confirmed" && (
                      <button
                        className="text-button"
                        onClick={() => {
                          setFormError("");
                          setCancel(b);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          <div className="reservation-footnote">
            <Mountain size={21} />
            <p>
              Window views, warm lanterns, good company.
              <br />
              <strong>The rest is on us.</strong>
            </p>
            <a href="/#menu">Explore what’s cooking</a>
          </div>
        </TabsContent>
        <TabsContent value="staff">
          <div className="metric-grid staff-metrics">
            <Metric
              label="Reservations"
              value={String(active.length)}
              note={prettyDate(day)}
            />
            <Metric
              label="Expected guests"
              value={String(active.reduce((s, b) => s + b.guests, 0))}
              note="Across all active bookings"
            />
            <Metric
              label="Seated now"
              value={String(daily.filter((b) => b.status === "seated").length)}
              note="Tables enjoying their meal"
            />
            <Metric
              label="Still to arrive"
              value={String(
                daily.filter((b) => b.status === "confirmed").length,
              )}
              note="Confirmed reservations"
            />
          </div>
          <div className="staff-panel">
            <div className="staff-panel-header">
              <div>
                <h2>The reservation book</h2>
                <p>
                  {prettyDate(day)} · {daily.length} reservations
                </p>
              </div>
              <div className="staff-filters">
                <label className="search-field">
                  <Search size={17} />
                  <input
                    aria-label="Search reservations"
                    placeholder="Find a guest or table…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger aria-label="Filter by reservation status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "all",
                      "confirmed",
                      "seated",
                      "completed",
                      "cancelled",
                      "no-show",
                    ].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s === "all"
                          ? "All statuses"
                          : s[0].toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="data-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Service</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6}>Loading reservations…</TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        No reservations match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <strong>{time(b.hour)}</strong>
                          <small className="cell-sub">
                            {time(b.hour + 2)} finish
                          </small>
                        </TableCell>
                        <TableCell>
                          <strong>{b.name}</strong>
                          <small className="cell-sub">
                            {b.source === "sample"
                              ? "Sample guest"
                              : "New reservation"}
                          </small>
                        </TableCell>
                        <TableCell>
                          <span className="table-id">{b.table_id}</span>
                        </TableCell>
                        <TableCell>{b.guests} guests</TableCell>
                        <TableCell>
                          <span className={"status-badge " + b.status}>
                            {b.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            className="text-button"
                            onClick={() => {
                              setManage(b);
                              setFormError("");
                              setBill("");
                            }}
                          >
                            Details
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="owner">
          <div className="owner-topline">
            <span>
              <BarChart3 size={17} />
              Guest insights
            </span>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger aria-label="Analytics date range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="metric-grid">
            <Metric
              label="Guests welcomed"
              value={String(completed.reduce((s, b) => s + b.guests, 0))}
              note={completed.length + " completed visits"}
            />
            <Metric
              label="Recorded revenue"
              value={money(completed.reduce((s, b) => s + b.spend, 0))}
              note="From completed table bills"
            />
            <Metric
              label="Returning guests"
              value={repeat + "%"}
              note="Customers with more than one visit"
            />
            <Metric
              label="Average table bill"
              value={money(
                completed.length
                  ? completed.reduce((s, b) => s + b.spend, 0) /
                      completed.length
                  : 0,
              )}
              note="Per completed reservation"
            />
          </div>
          <div className="insight-grid">
            <section className="chart-card">
              <div className="chart-heading">
                <div>
                  <h2>A week at our table</h2>
                  <p>Guests from completed visits · last 7 days</p>
                </div>
                <span className="chart-key">
                  <i />
                  Guests
                </span>
              </div>
              <div
                className="bar-chart"
                role="img"
                aria-label={
                  "Daily guests: " +
                  chart
                    .map((c) => prettyDate(c.day) + ": " + c.value)
                    .join(", ")
                }
              >
                {chart.map((c) => (
                  <div
                    className={
                      "chart-column " + (c.day === today ? "today" : "")
                    }
                    key={c.day}
                  >
                    <div className="bar-track">
                      <div
                        className="bar"
                        style={{
                          height:
                            Math.max(
                              3,
                              (100 * c.value) /
                                Math.max(1, ...chart.map((v) => v.value)),
                            ) + "%",
                        }}
                      >
                        <span>{c.value}</span>
                      </div>
                    </div>
                    <small>
                      {new Date(c.day + "T12:00Z").toLocaleDateString("en", {
                        weekday: "short",
                      })}
                    </small>
                    <small className="chart-date">{c.day.slice(8)}</small>
                  </div>
                ))}
              </div>
            </section>
            <section className="loyalty-card">
              <span className="eyebrow">GOOD COMPANY COMES BACK</span>
              <h2>
                {repeat}
                <em>%</em>
              </h2>
              <p>
                of guests visited more than once
                <br />
                in the selected period.
              </p>
              <div className="loyalty-line" />
              <span className="loyalty-detail">
                <strong>
                  {customerGroups.filter((c) => c.visits > 1).length}
                </strong>{" "}
                returning customers
              </span>
              <span className="loyalty-detail">
                <strong>{customerGroups.length}</strong> unique customers
              </span>
              <small>
                Sample history is included. Customer identity is matched by
                email.
              </small>
            </section>
          </div>
          <section className="staff-panel guest-panel">
            <div className="staff-panel-header">
              <div>
                <h2>Familiar faces</h2>
                <p>Get to know the people who make this place.</p>
              </div>
              <span className="subtle">Sorted by visits</span>
            </div>
            <div className="data-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Last dined</TableHead>
                    <TableHead>Total spent</TableHead>
                    <TableHead>Connection</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerGroups.map((c, i) => (
                    <TableRow key={c.email}>
                      <TableCell>
                        <span className="guest-name">
                          <span className={"avatar avatar-" + (i % 3)}>
                            {c.name
                              .split(" ")
                              .map((s) => s[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                          <span>
                            <strong>{c.name}</strong>
                            <small className="cell-sub">{c.email}</small>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <strong>{c.visits}</strong>
                      </TableCell>
                      <TableCell>{prettyDate(c.last)}</TableCell>
                      <TableCell>{money(c.spend)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            "status-badge " +
                            (c.visits >= 5 ? "completed" : "confirmed")
                          }
                        >
                          {c.visits >= 5
                            ? "House regular"
                            : c.visits > 1
                              ? "Returning"
                              : "First visit"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          className="text-button"
                          onClick={() => setProfile(c.email)}
                        >
                          View guest
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!loading && customerGroups.length === 0 && (
                <p className="empty-copy">Completed visits will appear here.</p>
              )}
            </div>
          </section>
          <p className="analytics-note">
            Insights use completed visits and recorded bills. Cancellations and
            future reservations are excluded.
          </p>
        </TabsContent>
      </main>
      <footer className="reservation-footer">
        <a className="footer-brand" href="/">
          SORA & SOL
        </a>
        <p>A little Kyoto. A little Pirin.</p>
        <span>Made for slow evenings.</span>
      </footer>
      <Dialog
        open={bookingOpen}
        onOpenChange={(v) => {
          if (!busy) setBookingOpen(v);
        }}
      >
        <DialogContent className="reservation-dialog">
          <DialogHeader>
            <span className="eyebrow red">ALMOST AT THE TABLE</span>
            <DialogTitle>Your evening starts here.</DialogTitle>
            <DialogDescription>
              {prettyDate(day)} · {hour !== null ? time(hour) : ""} · {tableId}{" "}
              · {guests} guests
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createBooking} className="booking-form">
            <label>
              Your name
              <input
                name="name"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                placeholder="Alex Petrov"
              />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                required
                maxLength={120}
                autoComplete="email"
                placeholder="alex@example.com"
              />
            </label>
            <label>
              A little note <span>(optional)</span>
              <textarea
                name="notes"
                maxLength={500}
                placeholder="An occasion, accessibility needs, or anything else we should know."
                rows={3}
              />
            </label>
            <p className="form-note">
              This is a demo booking. Use sample details; no email will be sent.
            </p>
            {formError && (
              <p className="inline-error" role="alert">
                {formError}
              </p>
            )}
            <button className="button reserve-button" disabled={busy}>
              {busy ? "Saving your table…" : "Confirm reservation"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!manage}
        onOpenChange={(v) => {
          if (!v && !busy) setManage(null);
        }}
      >
        <DialogContent className="reservation-dialog">
          <DialogHeader>
            <span className="eyebrow red">RESERVATION DETAILS</span>
            <DialogTitle>{manage?.name}</DialogTitle>
            <DialogDescription>
              {manage && prettyDate(manage.day)} · {manage && time(manage.hour)}{" "}
              · {manage?.table_id} · {manage?.guests} guests
            </DialogDescription>
          </DialogHeader>
          {manage && (
            <div className="manage-details">
              <p>{manage.email}</p>
              <p>
                <strong>Guest notes</strong>
                <br />
                {manage.notes || "No special requests."}
              </p>
              <span className={"status-badge " + manage.status}>
                {manage.status}
              </span>
              {manage.status === "seated" && (
                <label>
                  Table bill (€)
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    step="1"
                    value={bill}
                    onChange={(e) => setBill(e.target.value)}
                    placeholder="0"
                  />
                </label>
              )}
              {formError && (
                <p role="alert" className="inline-error">
                  {formError}
                </p>
              )}
              <div className="manage-actions">
                {manage.status === "confirmed" && (
                  <>
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() => changeBooking(manage, "seated")}
                    >
                      Seat guests
                    </button>
                    <button
                      className="button outline-button"
                      disabled={busy}
                      onClick={() => changeBooking(manage, "no-show")}
                    >
                      Mark no-show
                    </button>
                  </>
                )}
                {manage.status === "seated" && (
                  <button
                    className="button"
                    disabled={busy || bill === "" || Number(bill) < 0}
                    onClick={() => changeBooking(manage, "completed")}
                  >
                    Complete visit
                  </button>
                )}
                {["confirmed", "seated"].includes(manage.status) && (
                  <button
                    className="text-button danger"
                    disabled={busy}
                    onClick={() => {
                      setCancel(manage);
                      setManage(null);
                    }}
                  >
                    Cancel reservation
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!cancel}
        onOpenChange={(v) => {
          if (!v && !busy) setCancel(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancel && prettyDate(cancel.day)} at{" "}
              {cancel && time(cancel.hour)} · {cancel?.table_id}. The table will
              become available again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {formError && (
            <p className="inline-error" role="alert">
              {formError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              Keep reservation
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                if (cancel) changeBooking(cancel, "cancelled");
              }}
            >
              {busy ? "Cancelling…" : "Cancel reservation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!profile}
        onOpenChange={(v) => {
          if (!v) setProfile(null);
        }}
      >
        <DialogContent className="reservation-dialog">
          <DialogHeader>
            <span className="eyebrow red">GUEST PROFILE</span>
            <DialogTitle>
              {customerGroups.find((c) => c.email === profile)?.name}
            </DialogTitle>
            <DialogDescription>
              {profile} · Completed visits in the selected period
            </DialogDescription>
          </DialogHeader>
          <div className="visit-history">
            {completed
              .filter((b) => b.email === profile)
              .sort((a, b) => b.day.localeCompare(a.day))
              .map((b) => (
                <div key={b.id}>
                  <span>
                    <strong>{prettyDate(b.day)}</strong>
                    <small>
                      {b.table_id} · {b.guests} guests · {time(b.hour)}
                    </small>
                  </span>
                  <b>{money(b.spend)}</b>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
