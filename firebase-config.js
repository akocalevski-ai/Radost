/* ============================================================
   FIREBASE CONFIG — shared by index.html, waiter.html, admin.html
   ------------------------------------------------------------
   1. Go to https://console.firebase.google.com → create a project
   2. Project settings (gear icon) → General → "Your apps" → Add app → Web (</>)
   3. Copy the firebaseConfig object it gives you and paste it below.
   4. In the left menu enable:
        - Build → Firestore Database → Create database (production mode)
        - Build → Authentication → Sign-in method → Email/Password → Enable
   5. Paste the contents of firestore.rules into Firestore → Rules → Publish.
   See README.md for the full setup walkthrough (incl. creating the first admin).
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyCGYygxmBQdX2toY8Q-NVCbkmeucFTtIjQ",
  authDomain: "radost-cb756.firebaseapp.com",
  projectId: "radost-cb756",
  storageBucket: "radost-cb756.firebasestorage.app",
  messagingSenderId: "618910925918",
  appId: "1:618910925918:web:232fcb00fc066bdd98e0cf"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
