# Barangay Census — Local Database Test Build

This build is intended for local demonstration/testing. Census submissions are written to MySQL through the Express API. Firebase is used only for sign-in/token verification.

## 1. Empty the census data (optional, destructive)

If you want a completely empty census database, back up phpMyAdmin first (Export → Quick → SQL). Then select `barangay_census_db` → Import → choose `backend/reset-census-data-empty.sql`.

This reset deletes all census households, residents, references, custom answers, and activity logs. It preserves user accounts, admin roles, form schema, and settings. Do not run it if you need to keep existing submissions.

## 2. Update the database schema

In phpMyAdmin select `barangay_census_db` → Import → choose `backend/migrate-normalized.sql`. This adds the structured tables/columns and preserves the existing JSON payloads. For a brand-new database, import `backend/database.sql` instead.

## 3. Configure the backend

In `backend`, copy `.env.example` to `.env` and check the MySQL values. Place your own Firebase Admin SDK service-account JSON at `backend/serviceAccountKey.json`; never share it or put it in a ZIP/repository. The project ID in that key must match `FIREBASE_PROJECT_ID`.

Run in a terminal:

```powershell
cd backend
npm install
npm run dev
```

Check `http://localhost:8080/api/health`. It should say MySQL connected and Firebase Admin initialized.

## 4. Configure and run the frontend

In `census-react`, copy `.env.example` to `.env`, then run:

```powershell
cd census-react
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## 5. Set the administrator role

Create/sign in with the account that should be the admin once so `/api/auth/sync` creates its MySQL user row. In Firebase Authentication, copy that account's UID. In phpMyAdmin run:

```sql
UPDATE users SET role = 'admin' WHERE firebase_uid = 'PASTE_ADMIN_FIREBASE_UID_HERE';
```

Sign out and sign in again. Keep a separate normal `user` account for testing Census Form submissions. Do not make public sign-up accounts admins.

## 6. Test the complete flow

1. Sign in using a normal user account.
2. Open Census Form, enter a household, add any household members and references needed, then submit.
3. Sign out and sign in using the admin account.
4. Open Admin Dashboard and Census Records. The submitted household and its form fields should appear there.
5. In phpMyAdmin inspect `households.payload` (complete submission JSON), `household_details` (head/personal/address/education/employment/declaration columns), `residents` (member columns), `character_references`, and `custom_field_answers`.

## Notes

- Sample census records were removed. The initial data module and legacy JSON file are empty.
- The Census Form starts with empty household-member and character-reference arrays. Add rows only when needed.
- The full form submission remains in `households.payload` to preserve every field and custom Form Builder answer. Core fields are also copied into normalized MySQL columns/tables for filtering and reports.
- No census records are saved in browser localStorage/sessionStorage.
- This is a local test build, not a production deployment. Confirm backups, access controls, and full browser testing before real resident data is collected.
