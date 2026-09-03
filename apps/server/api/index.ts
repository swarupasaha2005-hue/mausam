import { app } from '../src/app';

/**
 * Vercel serverless entrypoint. Express apps are directly compatible
 * with Vercel's Node.js runtime — `app` is a `(req, res) => void`
 * listener, same as what `app.listen()` uses locally, so nothing in
 * app.ts/routes/modules changes for deployment. `src/index.ts` (which
 * calls `app.listen()`) is only used by the local dev server; Vercel
 * calls this handler directly per-request instead.
 */
export default app;
