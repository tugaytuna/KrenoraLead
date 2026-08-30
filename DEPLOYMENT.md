# Krenora Lead Production Deployment

## Firebase App Hosting

Project:

- Firebase project: `krenora-lead`
- Web app: `1:354650962631:web:7d0ecf2469a2ecdecd5ce2`
- Region: `europe-west4`
- App root: `apps/web`

Firebase App Hosting is the production target because the application uses dynamic Next.js features, including server actions, SSR authentication and cookies. Classic static Hosting is not an equivalent deployment target.

The Firebase project must be upgraded to Blaze before the App Hosting API can be enabled. After billing is linked, create the backend:

```bash
npx firebase-tools apphosting:backends:create \
  --project krenora-lead \
  --app 1:354650962631:web:7d0ecf2469a2ecdecd5ce2 \
  --backend krenora-lead-web \
  --primary-region europe-west4 \
  --root-dir apps/web \
  --runtime nodejs22 \
  --non-interactive
```

Runtime settings are stored in `apps/web/apphosting.yaml`. Secret values belong in App Hosting environment configuration or Cloud Secret Manager.

## Supabase

Create a production Supabase project in a European region and apply migrations in order:

```bash
npx supabase link --project-ref PROJECT_REF
npx supabase db push
```

Required web variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Required worker secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_PLACES_API_KEY`

The application intentionally remains in demo mode when public Supabase variables are absent. This is useful for local design review but is not considered a fully operational production deployment.

## Worker

The worker runs separately from the web process. `apps/worker/Dockerfile` builds a run-to-empty worker image with `WORKER_RUN_ONCE=true`, suitable for a Cloud Run Job triggered by Cloud Scheduler. Each execution atomically drains available discovery jobs and exits when the queue is empty.

Build and deploy after Blaze billing and secrets are available:

```bash
gcloud builds submit --project krenora-lead --config cloudbuild.worker.yaml --substitutions=_IMAGE=europe-west4-docker.pkg.dev/krenora-lead/krenora/worker .
gcloud run jobs deploy krenora-discovery-worker --project krenora-lead --region europe-west4 --image europe-west4-docker.pkg.dev/krenora-lead/krenora/worker --set-secrets SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,GOOGLE_PLACES_API_KEY=GOOGLE_PLACES_API_KEY:latest
```

Schedule the job at a cost-appropriate interval after validating one manual execution. Never put `SUPABASE_SERVICE_ROLE_KEY` or `GOOGLE_PLACES_API_KEY` into `NEXT_PUBLIC_` variables.

## Release Gate

Before production traffic:

1. run all tests, typecheck, lint and production build;
2. apply and verify both Supabase migrations;
3. test workspace isolation with two users;
4. verify quota reservation and idempotent job creation;
5. run a low-volume Google Places discovery;
6. confirm App Hosting and worker logs contain no secrets;
7. set budget alerts and a Cloud Run spend cap.
