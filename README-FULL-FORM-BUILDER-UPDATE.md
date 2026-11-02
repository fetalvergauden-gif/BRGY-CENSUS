# Full Census Form Builder update

This update changes the Form Builder from an additional-fields-only editor into the editor for the complete census form.

## What changed
- `backend/default-form-schema.json` defines the complete standard census form, including household information, household head details, address, education, employment, repeatable household members, repeatable character references, and declaration.
- `backend/server.js` now returns the default full schema when no saved schema exists, and merges default sections with saved sections so an older empty/additional-only schema does not make the user form blank.
- `census-react/src/pages/FormBuilder.jsx` edits section titles, descriptions, question labels, input types, dropdown options, and required settings for the whole form. It can also add and delete sections/questions.
- `census-react/src/pages/CensusForm.jsx` renders the form from the server schema only, eliminating the duplicated hardcoded form plus dynamic-form rendering.
- New custom questions without a standard data path are stored under `customFields` in the submitted payload.
- Household member and character reference rows remain repeatable. Senior Citizen, PWD, and 4Ps fields are included in the member group.

## Install/update
1. Keep a backup of your current project and database.
2. Copy the updated files from this package into your project, preserving your existing `backend/.env` and `backend/serviceAccountKey.json`.
3. Do not import `database.sql` over an existing database and do not run any reset SQL. This update does not require dropping or recreating tables.
4. In `backend`, run `npm install`, then `npm run dev`.
5. In `census-react`, run `npm install`, then `npm run dev`.
6. Sign in as an administrator and open Admin > Census Form Builder. The full standard form should load. Save Form Changes once to persist the complete schema in MySQL.
7. Open the user Census Form and verify that the same sections and labels appear once.

## Important
- The API still requires Firebase authentication; Form Builder save requires the user to have the `admin` role in the MySQL `users` table.
- Historical census submissions are not rewritten by changing the schema. They retain their submitted payload.
- This source update was syntax-checked for `backend/server.js`. A live browser + MySQL + Firebase end-to-end test must still be performed in your local XAMPP environment.
