# Barangay Census - MySQL (XAMPP) backend setup

1. Open XAMPP Control Panel and start **Apache** (for phpMyAdmin) and **MySQL**.
2. Open phpMyAdmin at `http://localhost/phpmyadmin`, choose **Import**, and import `database.sql`.
3. In this `backend` folder run `npm install`.
4. Copy `.env.example` to `.env`. Set MySQL details. For Firebase Admin, download a private service-account key from Firebase Console > Project settings > Service accounts, then save the downloaded JSON as `backend/serviceAccountKey.json`. Set `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json` in `.env`. Never put this file in the React `src` folder, upload it to chat, or commit it. The server validates this file at startup and logs the Firebase project ID.
5. In phpMyAdmin, open `barangay_census_db.users` and set the Firebase UID of the trusted administrator to role `admin`. The Firebase UID is available from Firebase Authentication users. Example: `UPDATE users SET role='admin' WHERE firebase_uid='YOUR_FIREBASE_UID';` (create the account / sign in once so the profile is created).
6. Start API: `npm run dev`. Health check: `http://localhost:8080/api/health`.
7. In React project create `.env` with `VITE_API_URL=http://localhost:8080`, then run `npm install` and `npm run dev`.

Firebase Authentication is used only to verify identity. The Express API verifies Firebase ID tokens and reads user roles from the MySQL `users` table. MySQL stores census records, residents, form configuration, activity logs, settings, and roles. Firestore is not used by this application.

## Existing JSON records
The old `census-records.json` is retained as a backup only. Import its contents into MySQL using the one-time `migrate-json.js` utility after configuring `.env` if you need to keep those old records. Do not delete the backup until you verify the imported data.


### Firebase key security

If a service-account private key has ever been shared, revoke that key in Google Cloud Console (IAM & Admin → Service Accounts → Keys), generate a replacement, and use only the replacement locally. Do not send the replacement key to anyone. The backend accepts the key file through `FIREBASE_SERVICE_ACCOUNT_PATH`; it is excluded by `.gitignore`.

### Verify the services

Start MySQL in XAMPP, then run `npm run dev` in `backend`. Open `http://localhost:8080/api/health`; it should report `database: MySQL connected` and `firebaseAdmin: initialized`. Start the React app separately with `npm run dev` in `census-react`.
