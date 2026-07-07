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

## Legal acceptance before first Google sign-in

Before a user can complete their first Google sign-in, DataStorified shows a simple consent modal that asks them to accept the current Terms of Service, Privacy Policy, Cookie Policy, Disclaimer, and AI Disclosure.

The flow is intentionally lightweight:

- anonymous users are not blocked from public browsing;
- the consent prompt appears only when the user chooses Google sign-in or opens account-only features;
- the current acceptance marker is saved in the browser long enough to finish the OAuth round trip;
- once the account returns, the app records the accepted versions on the user record;
- if any legal version changes later, the account features will prompt for acceptance again.

The public UI must never expose internal service details, backend names, or operational status text as part of this flow.

## Operational checks

- confirm the Google sign-in button appears in the UI;
- confirm anonymous mode indicator is visible when not signed in;
- confirm auth-protected API routes return 401 for anonymous requests;
- confirm a signed-in session can read and update `/api/profile`;
- confirm a signed-in session can save and sync decisions.
