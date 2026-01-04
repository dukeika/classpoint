# ClassPoint Web (Parent Portal)

Minimal Next.js scaffold for the parent invoice view.

## Local dev
1) `npm install`
2) `npm run dev`

## Required env
- `APPSYNC_URL` (AppSync GraphQL endpoint)

The UI stores a Cognito access token in localStorage (`cp.token`) and forwards it to `/api/graphql`.
