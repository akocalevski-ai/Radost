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
- **Инвентар** tab → add your stock items (e.g. bottles, cups, syrup). Optionally link an item to a menu item and set how many units are used per sale — when a waiter marks an order complete, that quantity is deducted automatically and logged. Use "+ Набавка" any time you restock to log a procurement and increase the quantity on hand.

## How orders flow

1. A customer opens `index.html`, orders, optionally picks a waiter, and taps **Нарачај**. This writes an order to Firestore and gets an order number from an atomic counter (safe even with many customers ordering at once).
2. If a waiter was chosen, the order appears only in that waiter's queue on `waiter.html`. If not, it appears in everyone's queue as unassigned, and any waiter can tap **Преземи** (claim) to take it.
3. The waiter taps **Заврши нарачка** when it's done — this marks it completed, records who served it, and (if any items are linked in inventory) deducts stock automatically.
4. The waiter can tap the 🖨 print icon any time to open the browser's print dialog with a receipt showing the order number — one slip for the customer, one for the waiter. The customer can also print their own copy from the confirmation screen after ordering.
5. `admin.html` shows live totals (today / last 7 days), today's best sellers, every order with status filters, staff management, and the full inventory + procurement log.

## Notes & limits

- Printing uses the normal browser print dialog (`window.print()`), so it works with any printer your device already knows how to print to, including receipt printers with the right driver installed. It does not talk to a printer directly (that would need extra software such as a print-server/ESC-POS bridge) — happy to add that later if you get specific hardware.
- The sales overview reads the most recent 500 orders to compute totals; for a very high daily order volume you may eventually want a proper backend aggregation (Cloud Functions), but this comfortably covers a normal café's daily/weekly numbers.
- The first time a query needs a composite index, the browser console will show a Firestore error with a direct "create index" link — just click it and the query will start working within a minute or two.
- Deactivating a waiter (in the Келнери tab) removes them from the customer's waiter dropdown but doesn't delete their login — you can reactivate any time.
