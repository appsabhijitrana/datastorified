# DataStorified authentication

DataStorified uses Better Auth with Google OAuth, but login stays optional.

## Goals

- anonymous users keep using localStorage;
- logged-in users can sync data;
- no SMS OTP;
- no paid auth service;
- no forced sign-in wall.

## Required env vars

```bash
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Also set:

```bash
NEXT_PUBLIC_SITE_URL=
```

## Setup steps

1. Create a Google OAuth client.
2. Add the production redirect URI used by Better Auth.
3. Add the credentials to Vercel.
4. Configure Better Auth in the website app.
5. Keep anonymous mode enabled for all public flows.

## Auth behavior

- anonymous users can browse, search, draft, and save locally;
- signed-in users can persist decisions and profiles to PostgreSQL;
- sync becomes available after login;
- sign-out must return the user to anonymous local-first mode.

## Operational checks

- confirm the Google sign-in button appears in the UI;
- confirm anonymous mode indicator is visible when not signed in;
- confirm auth-protected API routes return 401 for anonymous requests;
- confirm a signed-in session can read and update `/api/profile`;
- confirm a signed-in session can save and sync decisions.

