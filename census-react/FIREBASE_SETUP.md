# BRGY Census Firebase Setup

This project now uses the same Firebase project/configuration as the working MAC Firestore project.

## Required Firebase Authentication providers

In Firebase Console -> Authentication -> Sign-in method, enable:
- Email/Password
- Google

## Authorized domains

In Authentication -> Settings -> Authorized domains, make sure these are present:
- localhost
- your deployed domain, if deployed

## User roles

The application reads the role from:

`users/{Firebase UID}`

Example admin document:

```text
users
  <ADMIN_FIREBASE_UID>
    uid: "<ADMIN_FIREBASE_UID>"
    name: "Barangay Administrator"
    email: "admin@example.com"
    role: "admin"
```

Regular users created through Signup are automatically saved with:

`role: "user"`

Google users who do not yet have a Firestore user document are also automatically created as `role: "user"`.

Do not let the login page select a role. The Firestore role controls routing.

## Routing

- role = `admin` -> `/admin/dashboard`
- role = `user` -> `/census`

Protected admin pages reject regular users, and protected user pages reject admins.

## Install

From the `census-react` folder:

```powershell
npm install
npm run dev
```
