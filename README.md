# radost — ordering, waiter, and admin apps

Three pages, one shared Firebase backend:

- **index.html** — customer ordering menu (same design as before, now also lets the guest pick a waiter, and shows a "Персонал" link at the bottom for staff)
- **waiter.html** — waiter login + live order queue (claim, complete, print)
- **admin.html** — admin login + sales overview, all orders, waiter accounts, inventory
- **firebase-config.js** — shared connection settings (you fill this in once)
- **firestore.rules** — security rules to paste into Firebase

All three HTML files must be hosted together in the same folder (e.g. one Firebase Hosting site, Netlify, GitHub Pages, or your own server) so the relative links between them work.

## 1. Create the Firebase project (free tier is enough for this)

1. Go to https://console.firebase.google.com → **Add project** → follow the prompts.
2. In the project, go to **Build → Firestore Database → Create database**. Choose *production mode* and a region close to you.
3. Go to **Build → Authentication → Sign-in method** → enable **Email/Password**.
4. Go to **Project settings** (gear icon) → **General** → scroll to "Your apps" → click the **Web** icon (`</>`) → register an app (no hosting setup needed) → copy the `firebaseConfig` object it shows you.

## 2. Connect the app

Open `firebase-config.js` and paste your values in:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## 3. Publish the security rules

In the Firebase console: **Build → Firestore Database → Rules** tab → replace the contents with everything in `firestore.rules` → **Publish**.

## 4. Create the first admin account (one manual step)

The admin panel can create *more* accounts for you later, but the very first one has to be made by hand:

1. **Build → Authentication → Users → Add user** → enter an email + password for yourself.
2. Copy the new user's **User UID** (shown in the users list).
3. **Build → Firestore Database → Data** → **Start collection** → collection ID: `roles` → document ID: *paste the UID* → add a field `role` (type: string) with value `admin` → **Save**.

That's it — open `admin.html`, log in with that email/password, and you're in.

## 5. Set up waiters and inventory

From the admin panel:
- **Келнери** tab → add each waiter's name, email, and a password. They can immediately log in at `waiter.html` with those credentials. (You can also tick "Направи администратор" to create another admin account instead of a waiter.)
- **Инвентар** tab → add your stock items (e.g. bottles, cups, syrup). Optionally link an item to a menu item and set how many units are used per sale — when a waiter marks an order complete, that quantity is deducted automatically and logged. Use "+ Набавка" any time you restock to log a procurement and increase the quantity on hand. Use "✎ Уреди / поправи количина" to correct a quantity directly (e.g. after a stock count) or edit the item's details, and "Избриши" to remove an item entirely.

## How orders flow

1. A customer opens `index.html`, orders, optionally picks a waiter, and taps **Нарачај**. This writes an order to Firestore and gets an order number from an atomic counter (safe even with many customers ordering at once). Order numbers restart at 1 every day.
2. If a waiter was chosen, the order appears only in that waiter's queue on `waiter.html`. If not, it appears in everyone's queue as unassigned, and any waiter can tap **Преземи** (claim) to take it.
3. The waiter taps **Заврши нарачка** when it's done — this marks it completed, records who served it, and (if any items are linked in inventory) deducts stock automatically.
4. The waiter can tap the 🖨 print icon any time to open the browser's print dialog with a receipt showing the order number — one slip for the customer, one for the waiter. The customer can also print their own copy from the confirmation screen after ordering.
5. `admin.html` shows live totals (today / last 7 days), today's best sellers, every order with status filters, staff management, menu management, weekly scheduling, and the full inventory + procurement log.

## Menu editing

The **Мени** tab in the admin panel is the source of truth for what customers see. The first time you open the admin panel, it copies the existing menu into Firestore automatically (one-time only) — after that, every edit (price, name, size, new item, delete) is live and shows up on `index.html` within a second, no redeploy needed. Deleting an item there removes it from the ordering menu immediately.

## Weekly schedule

Admins can build a weekly shift schedule in the **Распоред** tab — pick a waiter, a start/end time, per day, for the week shown. Waiters see the same week (read-only, no editing) under their own **Распоред** tab, with their own name bolded and marked "(ти)". Use the ‹ / › buttons to move between weeks.

The customer ordering page also uses this schedule: the "Келнер" dropdown only offers waiters whose current shift covers right now. If you haven't set up a shift for the current week yet, it falls back to showing every active waiter (so ordering isn't blocked while you're still setting things up) — once a schedule exists for the week, only whoever's actually on shift shows up.

## Shared order queue

Every waiter sees every open order on `waiter.html`, not just their own — including orders someone else has already claimed. If an order is already with another waiter, the button reads "Преземи за себе" (take it for yourself); tapping it reassigns the order to you immediately. This is meant for cases where a waiter is busy or off the floor and a colleague needs to step in — there's no lock, so whoever taps last "wins" the order.

## Waiter statistics & employee of the week

The **Статистика** tab in the admin panel shows a leaderboard (orders completed and revenue generated) for whatever week you're viewing — use ‹ / › to move between weeks, it always resets to a clean slate per week rather than accumulating. The top earner is highlighted as "🏆 Вработен на неделата". Every time you view a week, that week's current leader is saved to a running log shown below the leaderboard, so you always have a record of who won each calendar week, even past ones — this updates automatically as the week's orders come in, and simply stops changing once the week is over.

## Inventory export

In the **Инвентар** tab, two buttons above the item list export directly to an `.xlsx` file you can open in Excel: **"Извези цел инвентар"** exports every item, **"Извези само мала залиха"** exports only the items currently at or below their low-stock threshold — handy as a shopping list before a supply run.

## Waiter notifications & reminders

`waiter.html` plays a sound and shows an on-screen toast the moment a new order comes in (and a desktop notification too, if the browser is asked for permission — it prompts right when you tap "Најави се"). If an order sits unclaimed, it nags again — the waiter card turns red with an "⏰ Доцни" badge and repeats the sound — after however many minutes you set in the "Потсети по" box at the top (1–10, adjustable any time). The 🔔 button next to it mutes/unmutes sound entirely. This setting lives on that device/browser only, not shared across waiters.

One browser quirk worth knowing: sound can only start after a user has clicked something on the page (a login is enough) — this is a standard browser autoplay rule, not a bug, and the waiter panel already primes it for you at login.

## Waiter panel layout

Tabs are ordered Отворени нарачки → Сметки → Завршени денес → Распоред. "Завршени денес" now shows a small summary card at the top (orders naplati'd today, total revenue, and tips if any) and only lists **your own** paid orders — a colleague's settled tables won't clutter your daily view. "Сметки" stays shared across all waiters, since collecting payment on any open table is everyone's job.

## Admin panel layout

Tabs are ordered Преглед → Нарачки → Распоред → Статистика → Келнери → Мени → Магацин.

## Biggest tip of the week

Alongside "🏆 Вработен на неделата" in the **Статистика** tab, there's now a second card: "💰 Најголем бакшиш на неделата" — the waiter who collected the most tips that week. It's a separate ranking from revenue (a different waiter can win each), shown in the weekly leaderboard table and logged into the same historical record so you can look back at any past week.

## English / Macedonian toggle

The customer ordering page (`index.html`) has an MK/EN switch in the top-right corner. It translates the whole ordering experience — category names, section headers, the built-in menu items, cart, tip section, and receipts. One limitation worth knowing: the English text is a static dictionary covering the original default menu; any item you add or rename later from the admin **Мени** tab won't have an English translation and will just display in Macedonian even with EN selected — there's no per-language name field in the data model (yet).

## Order lifecycle

1. Customer orders → appears in **Отворени нарачки** (open orders) for any free waiter to claim, or straight in the chosen waiter's queue.
2. Waiter taps **Заврши нарачка** once it's ready/delivered → the order moves to **Сметки**, not yet to "Завршени денес" — it's prepared, but not paid for yet.
3. In **Сметки**, the waiter brings the bill to the table (🖨 prints it) and taps **Наплати** once the guest has paid.
4. Only then does it move into **Завршени денес** — that tab is specifically "completed and paid today", not just "completed".

## Bills — paid vs open

`waiter.html` has a **Сметки** tab showing every order that's been completed but not yet paid, grouped by table number — orders without a table (takeaway) are listed individually instead. Each group shows "Платено" (paid) or "Отворено" (open), a 🖨 button that prints a consolidated bill for that table to physically hand to the guest, and a **Наплати** button — tapping it settles every unpaid order on that table at once and moves them into "Завршени денес". By default only open tabs show; there's a toggle to also see ones already settled. This lives only in the waiter panel, not the admin panel, since it's a floor-service action.

## Tips (бакшиш)

The customer ordering page now has a tip section in the cart, right above the total: quick buttons for 0/5/10/15%, or a free-text box to enter a specific amount in ден. The chosen tip is added on top of the item total (shown as its own line before the grand total), included on both the customer's and the kitchen's printed receipts, and carried through to the order record — so it's reflected in the waiter's bill, the admin's revenue totals, and the weekly employee stats (a tip is money that order generated, so it counts the same way).

## Deleting staff

The **Избриши** button on a waiter in the **Келнери** tab removes them from the app immediately (they'll be signed out of `waiter.html` on their next action and won't appear in the customer's waiter list or the schedule dropdown). It does **not** delete their Firebase login itself — client apps aren't allowed to delete other users' logins for security reasons. If you want the login gone completely too, go to Firebase console → **Authentication → Users**, find them, and delete them there as well.

## Notes & limits

- Printing uses the normal browser print dialog (`window.print()`), so it works with any printer your device already knows how to print to, including receipt printers with the right driver installed. It does not talk to a printer directly (that would need extra software such as a print-server/ESC-POS bridge) — happy to add that later if you get specific hardware.
- The sales overview reads the most recent 500 orders to compute totals; for a very high daily order volume you may eventually want a proper backend aggregation (Cloud Functions), but this comfortably covers a normal café's daily/weekly numbers.
- The first time a query needs a composite index, the browser console will show a Firestore error with a direct "create index" link — just click it and the query will start working within a minute or two.
- Deactivating a waiter (in the Келнери tab) removes them from the customer's waiter dropdown but doesn't delete their login — you can reactivate any time.
