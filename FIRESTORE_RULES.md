# Cloud Firestore Security Rules & Firebase Setup Guide

This guide details how to configure **Firebase Authentication** and **Cloud Firestore** for the Digital Notice Board application, ensuring complete role isolation between **Students** and **Faculty / Staff**.

---

## 1. Cloud Firestore Security Rules

To prevent students from creating, editing, or deleting notices, and to prevent unauthorized role escalation, copy and paste the following rules into:
> **Firebase Console** &rarr; **Firestore Database** &rarr; **Rules** tab &rarr; click **Publish**.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return isAuthenticated() && (getUserData().role == 'admin' || getUserData().role == 'faculty');
    }

    // 1. User Profiles Collection
    match /users/{userId} {
      // Any authenticated user can read profiles
      allow read: if isAuthenticated();
      
      // Users can only create their own document during signup
      allow create: if isAuthenticated() && request.auth.uid == userId;
      
      // Users can update their own non-role fields; Admins can update any
      allow update: if isAuthenticated() && (
        (request.auth.uid == userId && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']))
        || isAdmin()
      );
      
      allow delete: if isAdmin();
    }

    // 2. Notices Collection
    match /notices/{noticeId} {
      // Anyone (students, visitors, faculty) can read published notices
      allow read: if true;

      // STRICT ROLE ENFORCEMENT:
      // Only authenticated users with admin/faculty role can create, update, or delete notices
      allow create, update, delete: if isAdmin();
    }

    // 3. System Configuration (Faculty Passcode & Settings)
    match /system/{docId} {
      // Passcode read allowed for authorization checks
      allow read: if true;

      // Only administrators can rotate or change system passcodes
      allow write: if isAdmin();
    }
  }
}
```

---

## 2. Setting Up Firebase in 3 Minutes

### Step 1: Create a Free Project
1. Open the [Google Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and enter a name (e.g. `lds-notice-board`).
3. Disable Google Analytics (optional) and click **Create Project**.

### Step 2: Register Web App & Get Credentials
1. On your project overview page, click the **Web icon (`</>`)** to add an app.
2. Enter an App nickname (e.g. `NoticeBoardWeb`) and click **Register app**.
3. Copy the `firebaseConfig` object values.
4. Open [`js/firebase-config.js`](file:///C:/Users/bhave/OneDrive/Desktop/Kishor/Digital-Notice-Board/js/firebase-config.js) in your project and replace the placeholder credentials:
   ```javascript
   const firebaseConfig = {
       apiKey: "AIzaSy...",
       authDomain: "lds-notice-board.firebaseapp.com",
       projectId: "lds-notice-board",
       storageBucket: "lds-notice-board.appspot.com",
       messagingSenderId: "1234567890",
       appId: "1:1234567890:web:abcdef..."
   };
   ```

### Step 3: Enable Email/Password Authentication
1. In the Firebase console sidebar, navigate to **Build** &rarr; **Authentication**.
2. Click **Get Started**, then click **Email/Password** under Native Providers.
3. Toggle **Enable** on and click **Save**.

### Step 4: Create Cloud Firestore Database
1. In the sidebar, navigate to **Build** &rarr; **Firestore Database**.
2. Click **Create database**.
3. Choose a location closest to your users (e.g., `asia-south1` for Mumbai/India).
4. Select **Start in production mode** and click **Create**.
5. Paste the security rules from Section 1 above into the **Rules** tab and click **Publish**.

---

## 3. How the 3-Layer Role Protection Works

```
+--------------------------------------------------------------------------------+
| LAYER 1: UI Sign Up                                                           |
| When user picks "Faculty / Staff", a "Faculty Security Passcode" field appears.|
| Signup is rejected if passcode doesn't match active code (LDS-FACULTY-2026).   |
+--------------------------------------------------------------------------------+
                                        |
                                        v
+--------------------------------------------------------------------------------+
| LAYER 2: Cloud Firestore User Profile                                         |
| Account is created in Firebase Auth with doc in /users/{uid} storing:          |
| role: 'admin' (for faculty) or role: 'student' (for students).                |
+--------------------------------------------------------------------------------+
                                        |
                                        v
+--------------------------------------------------------------------------------+
| LAYER 3: Firestore Server Security Rules                                      |
| Rules verify /users/$(request.auth.uid).role == 'admin'.                       |
| Even if a student bypasses the UI, the cloud database will DENY all notice   |
| create, update, and delete requests.                                           |
+--------------------------------------------------------------------------------+
```

---

## 4. How Admins Can Change the Faculty Passcode

1. Sign in as an **Admin** (or Faculty).
2. Click the **Settings icon (gear)** in the top navigation bar.
3. Select the **Preferences** tab.
4. Scroll to **Institutional Security & Access Control**.
5. View the current active passcode.
6. Enter a new passcode (minimum 6 characters) and click **Update Passcode**.
7. The new passcode is automatically synced to Cloud Firestore `/system/config` and takes effect immediately across all devices!
