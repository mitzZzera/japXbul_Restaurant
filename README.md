# Sora & Sol — Japanese soul. Bulgarian heart.

A Japanese-Bulgarian restaurant concept in Bansko, built for **japXbul_Restaurant**.

## Included

- Responsive restaurant homepage with three original AI-generated photographs, seasonal menu, story and dining-room information.
- Interactive eight-table floor plan: window seats, booths, dining room and kitchen.
- Date and party selection, hourly starts, two-hour reservations, capacity validation, and green/amber/red daily availability.
- Persisted reservation creation and cancellation.
- Customer / Staff / Owner switch; staff search, status filtering, seating, no-shows, completion and table bills.
- Owner charts, completed-visit revenue, returning-customer rate and guest histories.
- Accessible Radix/Shadcn controls, keyboard operation, focus styles and reduced-motion support.
- Server-side validation, session isolation and atomic overlap protection.

## Demo scope

The name, menu, prices and location description are creative placeholders; photographs are generated concept images, not documentary photos of an existing restaurant.

This is a functional **interactive demo**, not a live restaurant booking service. Each browser receives a random HttpOnly, SameSite cookie identifying an isolated database workspace. Thirty days of fictional history and sample daily reservations populate that workspace. The view switch demonstrates roles; it is **not production staff authorization**. Use sample contact details. No email or SMS is sent. Bookings persist on the server, but clearing the cookie loses access to that demo workspace.

Before accepting real bookings: replace placeholder business details; implement authenticated staff/owner accounts and server-enforced roles; change from isolated demo workspaces to an authorized shared restaurant model; remove demo seeding; add consent/retention and actual notifications. Keep private data out of public role-switching demos.

## Stack

React 19, TypeScript, Vinext/Vite, Cloudflare Workers and D1, Drizzle migrations, Radix/Shadcn primitives, Lucide. Plain CSS provides the visual design. Source includes the Sites starter runtime.

## Local setup

Node.js 22.13+ and npm are required.

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mature_lightspeed.sql
npm run dev
```

Apply each migration only once. Open the local URL printed by the dev server. The local database lives in ignored `.wrangler/state`; it is never committed.

```sh
npm run typecheck
npm test
npm run test:api   # while the local server is running; default port 5173
npm run build
```

Use `TEST_BASE_URL` to target a different local integration-test URL. Tests create isolated sample workspaces.

## Availability rules

Hours use Europe/Sofia. Starts run hourly from 12:00 to 21:00 and last two hours, ending by 23:00. Bookings cannot overlap for the same table, day and workspace. Adjacent intervals are allowed. Red means no bookable start remains; amber means one or two remain; green means three or more. Past starts are excluded. Parties must fit table capacity. Dates can be booked up to 90 days ahead.

Cancelled/no-show reservations free availability. Completed reservations remain part of that table's scheduled interval. Owner metrics include only completed visits within the selected period and use recorded table bills; future bookings and cancellations are excluded. Customer identity is grouped by normalized email.

## Images

Created using the built-in image generation tool. Files and exact prompts:

- `public/images/restaurant-hero.png`
- `public/images/kavarma-gyoza.png`
- `public/images/window-table.png`
- `public/images/prompts.json`

## Deployment

The Worker entry is `dist/server/index.js`; assets are in `dist/client`. `.openai/hosting.json` records the private Sites project and logical `DB` binding. Sites applies the committed Drizzle migrations on publication.

For independent Cloudflare deployment, provision your own D1 database, configure the `DB` binding and static assets, apply the SQL migration, and deploy the built Worker. Do not deploy the local placeholder database ID. Do not commit credentials or runtime data.
