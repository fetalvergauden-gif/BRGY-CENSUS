# Barangay Census System – bagong malinis na setup

## Mahalagang paalala
- Ang bagong setup na ito ay gumagamit ng database na `barangay_census_db_v2`.
- Hindi nito buburahin o papalitan ang lumang `barangay_census_db`.
- Huwag patakbuhin ang `backend/maintenance/reset-census-data-empty.DANGEROUS.sql` maliban kung talagang nais mong mag-reset at may backup ka.
- Huwag kailanman i-upload o isama sa ZIP ang `.env` o `serviceAccountKey.json`.
- Ang Firebase client config sa frontend ay public app configuration; ang Admin SDK service-account key ay private.

## 1. XAMPP / MySQL
1. Buksan ang XAMPP Control Panel.
2. Start MySQL.
3. Buksan ang `http://localhost/phpmyadmin`.
4. Piliin ang Import at i-import ang `backend/database.sql`.
5. Lalabas ang bagong database na `barangay_census_db_v2`.

## 2. Backend setup
1. Kopyahin ang `backend/.env.example` bilang `backend/.env`.
2. Ilagay ang iyong Firebase Admin service-account JSON sa `backend/serviceAccountKey.json` (huwag itong i-share).
3. Siguraduhing tama ang `FIREBASE_PROJECT_ID` at ang project ID sa service-account JSON.
4. Sa terminal:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
5. Buksan ang `http://localhost:8080/api/health`. Dapat MySQL connected at Firebase Admin initialized.

## 3. Frontend setup
1. Kopyahin ang `census-react/.env.example` bilang `census-react/.env`.
2. Tiyaking `VITE_API_URL=http://localhost:8080`.
3. Sa hiwalay na terminal:
   ```bash
   cd census-react
   npm install
   npm run dev
   ```

## 4. Admin role
Ang unang Google sign-in account ay user role bilang default. Para gawing admin, kunin ang Firebase UID ng account at patakbuhin sa phpMyAdmin SQL tab:

```sql
USE barangay_census_db_v2;
UPDATE users SET role='admin' WHERE firebase_uid='PASTE_FIREBASE_UID_HERE';
```

Huwag maglagay ng email/UID na hindi mo pag-aari. Huwag i-enable ang public admin signup.

## 5. Data safety
- Panatilihin ang lumang database at original project backup.
- Huwag i-import ang reset SQL sa normal installation.
- Bago mag-migrate ng lumang records, gumawa muna ng SQL backup at gumamit ng hiwalay na migration plan. Huwag basta kopyahin ang `census-records.json` sa production.

## Current scope note
Ang package na ito ay malinis na project bundle batay sa source na ipinadala. Hindi ito dapat ituring na production-verified hangga't hindi nasusubukan sa iyong XAMPP/MySQL at Firebase project ang login, schema save, submission, dashboard, report, at Excel export.
