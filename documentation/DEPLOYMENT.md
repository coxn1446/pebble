# Pebble — Minimal GCP Deployment

Cheapest setup: **Cloud Run** (scale to zero) + shared Cloud SQL in **`nash-data`** (`shared-pg`, database `pebble`). See App Shell Documentation **`SHARED_CLOUD_SQL.md`**.

| | |
|---|---|
| **App project** | `pebble-504520` |
| **Cloud Run region** | `us-central1` |
| **QA** | https://pebble-qa-399201808588.us-central1.run.app |
| **Prod** | https://pebble-prod-399201808588.us-central1.run.app |
| **Cloud Run (fallback)** | `pebble-qa-ls4niozbsa-uc.a.run.app` / `pebble-prod-ls4niozbsa-uc.a.run.app` |
| **Cloud SQL** | `nash-data:northamerica-northeast1:shared-pg` |
| **Database** | `pebble` (schemas `qa`, `prod`) |

## Cost estimate (monthly)

| Service | Config | Est. cost |
|---------|--------|-----------|
| Cloud Run | 256Mi, min 0, max 2 | ~$0 idle; low for light traffic |
| Cloud SQL | Shared `nash-data` / `shared-pg` | pooled — see SHARED_CLOUD_SQL.md |
| Secret Manager | few secrets | free tier |
| **Total** | | Cloud Run + share of shared-pg |

## Deploy

```bash
gcloud config set project pebble-504520
npm run deploy:qa
npm run deploy:prod
```

Cloud Build sets `DEFAULT_CLIENT_URL` from `_DEFAULT_CLIENT_URL` in `cloudbuild-qa.yaml` (`https://pebble-qa-399201808588.us-central1.run.app`) / `cloudbuild-prod.yaml` (`https://pebble-prod-399201808588.us-central1.run.app`). Runtime secrets (DB, session, Places, GCS) load from Secret Manager.

Public signup links are off. `/register` stays mounted so you can create accounts by visiting that URL directly.

There is no custom domain yet. Use the Cloud Run URLs. If you later map a domain, update `_DEFAULT_CLIENT_URL`, Secret Manager, and Capacitor `CAP_QA_URL` / `CAP_PROD_URL` before the next deploy.

`--allow-unauthenticated` may fail on this project (org policy). After the first deploy of a new service, grant public invoke once:

```bash
gcloud beta run services add-iam-policy-binding pebble-qa --region=us-central1 --project=pebble-504520 --member=allUsers --role=roles/run.invoker
gcloud beta run services add-iam-policy-binding pebble-prod --region=us-central1 --project=pebble-504520 --member=allUsers --role=roles/run.invoker
```

## Google Sign-In (Console)

The app accepts Google sign-in once a web client exists in this project. `gcloud iam oauth-clients` is for workforce identity and will not produce a Sign in with Google client (`*.apps.googleusercontent.com`). Create the client in the Google Auth Platform:

1. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview?project=pebble-504520).
2. Create an OAuth 2.0 Client ID, type **Web application**. Name it Pebble. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://pebble-qa-399201808588.us-central1.run.app`
   - `https://pebble-prod-399201808588.us-central1.run.app`
3. Authorized redirect URIs:
   - `http://localhost:8080/api/auth/google/callback`
   - `http://localhost:3000/api/auth/google/callback`
   - `https://pebble-qa-399201808588.us-central1.run.app/api/auth/google/callback`
   - `https://pebble-prod-399201808588.us-central1.run.app/api/auth/google/callback`
4. Store the client id/secret:

```bash
PROJECT_ID=pebble-504520
printf '%s' 'PASTE_CLIENT_ID' | gcloud secrets create GOOGLE_CLIENT_ID --data-file=- --project="$PROJECT_ID"
printf '%s' 'PASTE_CLIENT_SECRET' | gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=- --project="$PROJECT_ID"
printf '%s' 'PASTE_CLIENT_ID' | gcloud secrets create QA_GOOGLE_CLIENT_ID --data-file=- --project="$PROJECT_ID"
printf '%s' 'PASTE_CLIENT_SECRET' | gcloud secrets create QA_GOOGLE_CLIENT_SECRET --data-file=- --project="$PROJECT_ID"
gcloud run services update pebble-prod --region=us-central1 --project="$PROJECT_ID" --update-env-vars=OAUTH_RELOAD="$(date +%s)"
gcloud run services update pebble-qa --region=us-central1 --project="$PROJECT_ID" --update-env-vars=OAUTH_RELOAD="$(date +%s)"
```

Put the same client id and secret in local `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The callback URL is `${DEFAULT_CLIENT_URL}/api/auth/google/callback`.

Same-email Google sign-in links `users.google_id` onto an existing account and keeps `password`. Edit profile → Sign in → Connect attaches Google when the emails differ.

## Apple Sign-In (Developer portal)

There is no Apple CLI that can finish this the way `gcloud` manages Cloud resources. `fastlane produce enable_services --sign_in_with_apple` can turn the capability on for an App ID after you already have an Apple ID session or an App Store Connect API key. It does not create the Services ID, verify the domain, register return URLs, or download the Sign in with Apple `.p8` key. Those steps stay in [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources).

1. Sign in as an Account Holder or Admin.
2. Identifiers → App IDs. Enable **Sign in with Apple** on:
   - `io.pebble.app` (prod)
   - `io.pebble.qa`
   - `io.pebble.app.dev`
3. Identifiers → Services IDs. Create `io.pebble.web` (this value is `APPLE_CLIENT_ID`). Enable Sign in with Apple, set the primary App ID to `io.pebble.app`, and register return URLs:
   - `https://pebble-qa-399201808588.us-central1.run.app/api/auth/apple/callback`
   - `https://pebble-prod-399201808588.us-central1.run.app/api/auth/apple/callback`
4. Verify each Cloud Run domain (Apple’s association file or DNS). Apple does not accept `http://localhost` return URLs, so web Apple sign-in is exercised on QA/prod.
5. Keys → create a key with **Sign in with Apple**, assign it to `io.pebble.app`, and download the `.p8` once. The key id is `APPLE_KEY_ID`. The team id is `APPLE_TEAM_ID` (Membership details).
6. Store the secrets. `APPLE_KEY` is the PEM contents; escaped newlines (`\n`) are fine:

```bash
PROJECT_ID=pebble-504520
printf '%s' 'PASTE_SERVICES_ID' | gcloud secrets create APPLE_CLIENT_ID --data-file=- --project="$PROJECT_ID"
printf '%s' 'PASTE_TEAM_ID' | gcloud secrets create APPLE_TEAM_ID --data-file=- --project="$PROJECT_ID"
printf '%s' 'PASTE_KEY_ID' | gcloud secrets create APPLE_KEY_ID --data-file=- --project="$PROJECT_ID"
gcloud secrets create APPLE_KEY --data-file=./AuthKey.p8 --project="$PROJECT_ID"
# Repeat with the QA_ prefix for the QA Cloud Run service.
```

The Apple callback is a cross-site POST, so the link intent travels in a signed `state` value rather than the session cookie. Edit profile uses the same Connect action as Google.

## Secrets (already created)

App project Secret Manager:

- `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
- `INSTANCE_CONNECTION_NAME`, `DB_INSTANCE_UNIX_SOCKET`
- `SESSION_SECRET`, `QA_SESSION_SECRET`
- `DEFAULT_CLIENT_URL`, `QA_DEFAULT_CLIENT_URL`
- `GOOGLE_PLACES_API_KEY` / `QA_GOOGLE_PLACES_API_KEY` (Maps Platform key in `pebble-504520`)
- `GOOGLE_CLOUD_STORAGE_BUCKET` / `QA_GOOGLE_CLOUD_STORAGE_BUCKET` (`pebble-504520-uploads`)

Cloud Run default compute SA: `roles/secretmanager.secretAccessor` on `pebble-504520`, `roles/cloudsql.client` on `nash-data`.

## Local database

```bash
createdb pebble
psql -d pebble -f server/db/schema.sql
cp .env.example .env
# edit DB_* and SESSION_SECRET
npm run db:migrate
npm run dev
```

## Health check

`GET /api/health` reports database connectivity, `db_schema`, and whether key secrets are present (boolean flags only).
