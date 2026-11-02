# Dynamic Reports and Excel Export Update

## What changed

- Reports now loads the active form schema from `GET /api/form-schema` using the signed-in Firebase user's ID token.
- The default **Submitted Census Answers** report renders one row per household and adds columns for every active form question.
- Standard fields are read from their configured `path`; custom answers are read from `customFields` / the configured custom field path.
- Repeatable sections (for example Household Members and Character References) are displayed as semicolon-separated values within the household row.
- Existing summary views remain available: overview, Sitio, sex, age, civil status, education, and occupation.
- Excel export now includes a `HOUSEHOLDS - DYNAMIC` worksheet containing active form questions and submitted answers, in addition to summary, residents, and social-program worksheets.

## Important behavior

- This update does not add a MySQL column for every question. The active schema remains in `form_schema.schema_json`, and submitted answers remain in each household's JSON `payload` / `customFields` structure.
- Form schema changes apply to new submissions. Existing submissions are exported using their saved values; a newly added question will be blank for older records that never answered it.
- The API must return household records with their saved JSON payload expanded, as the current `/api/census` endpoint does.
- The current authenticated admin must be allowed to call `/api/form-schema` and `/api/census`.

## Verify locally

1. Start XAMPP MySQL.
2. Start backend from `backend`: `npm install` then `npm run dev`.
3. Start frontend from `census-react`: `npm install` then `npm run dev`.
4. Sign in as admin.
5. Open Form Builder, add a question (for example `Emergency Contact`) and save.
6. Submit a new Census Form with a value for that question.
7. Open Reports > Submitted Census Answers. Confirm the question appears as a column and the submitted value appears in the correct household row.
8. Open Export Data and export Excel. Confirm the `HOUSEHOLDS - DYNAMIC` sheet contains that column and answer.

No database reset or SQL import is required for this UI/reporting update.
