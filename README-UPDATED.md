# Barangay Census Management System — XAMPP / MySQL update

This version uses **Firebase Authentication only for sign-in and identity verification**. All application data, including user roles, census records, residents, form-builder configuration, activity logs, and settings, is stored in **MySQL through XAMPP**. React calls the Express API in `backend/server.js`; it does not connect directly to MySQL.

## Start here

1. Start MySQL in XAMPP.
2. Import `backend/database.sql` in phpMyAdmin.
3. Follow `backend/SETUP-MYSQL-XAMPP.md` to configure the backend `.env` and Firebase Admin service-account credentials.
4. In `backend`, run `npm install`, then `npm run dev`.
5. In `census-react`, copy `.env.example` to `.env`, run `npm install`, then `npm run dev`.
6. Create/sign in with the intended administrator account once. In phpMyAdmin, set its `users.role` to `admin` using its Firebase UID. Other users are automatically assigned `user`.

## Admin feature: Census Form Builder

Open **Admin → Census Form Builder**. Admin can add sections/tables, edit section headings and instructions, add/remove questions, edit question labels, choose short text / paragraph / number / date / dropdown / checkbox input types, set dropdown choices, and mark questions required. Save changes to publish them to the user census form. Historical submissions remain unchanged; custom answers are saved with the household record in MySQL.

## Existing data

`backend/census-records.json` is retained as a backup only and is no longer read or written by the API. If you need to preserve its existing records, configure MySQL then run `npm run migrate:json` once in the backend folder. Verify the records in phpMyAdmin before archiving or deleting the JSON backup.

## Notes

- No `localStorage`, `sessionStorage`, IndexedDB, or Firestore persistent cache is used for application data.
- React state remains for temporary UI state (inputs, loading indicators, filters, and modals).
- The API requires Firebase ID tokens. Census creation requires a signed-in user; editing/deleting census records and managing settings/form layout require the MySQL role `admin`.
- Keep `.env` and the Firebase service-account key private. Never upload them to a public repository.
