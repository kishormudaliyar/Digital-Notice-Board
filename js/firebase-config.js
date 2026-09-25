/**
 * Digital Notice Board - Firebase Configuration & Initialization
 *
 * To connect to Google Cloud Firebase:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a free project (e.g., "ld-sonawane-noticeboard")
 * 3. Add a Web App (</>) and copy the firebaseConfig values into the object below.
 * 4. Enable "Email/Password" under Authentication > Sign-in method.
 * 5. Create a Cloud Firestore database in test/production mode.
 */

// 1. Firebase Project Credentials
const firebaseConfig = {
  apiKey: "AIzaSyCTCiIx5MfGt5vG1UlrAxqtf_dOALEdpwI",
  authDomain: "notice-board-d3b6f.firebaseapp.com",
  projectId: "notice-board-d3b6f",
  storageBucket: "notice-board-d3b6f.firebasestorage.app",
  messagingSenderId: "727521485500",
  appId: "1:727521485500:web:ad7b41cda550938c6be6b9",
  measurementId: "G-2PZRLY379D"
};

// 2. Institutional Security Configuration
const SYSTEM_CONFIG = {
    // Default Faculty Authorization Passcode (used when creating a faculty/admin account)
    // College Admins can also rotate/update this dynamically from Settings > Institutional Security
    DEFAULT_FACULTY_CODE: "LDS-FACULTY-2026",
    
    // Firestore Collection Names
    COLLECTIONS: {
        NOTICES: "notices",
        USERS: "users",
        SYSTEM: "system"
    }
};

// Helper: Check if Firebase has been configured with real credentials
function isFirebaseConfigured() {
    return typeof firebase !== 'undefined' && 
           firebaseConfig.apiKey && 
           firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY";
}

// 3. Initialize Firebase Instances (with graceful fallback if not yet configured)
let fbApp = null;
let fbAuth = null;
let fbDb = null;

try {
    if (typeof firebase !== 'undefined' && isFirebaseConfigured()) {
        fbApp = firebase.initializeApp(firebaseConfig);
        fbAuth = firebase.auth();
        fbDb = firebase.firestore();
        console.log('[Firebase] Successfully connected to Cloud Firestore & Auth.');
    } else {
        console.log('[Firebase] Running in Local Storage demo mode. Add credentials in js/firebase-config.js to enable live cloud sync.');
    }
} catch (error) {
    console.warn('[Firebase] Initialization error, falling back to local storage:', error);
}
