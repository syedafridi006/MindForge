# MindForge — Private Personal Learning & Productivity Hub

MindForge is a responsive Next.js application for tasks, habits, focus sessions, fitness, adaptive brain training and the Learning Centre. This version adds private passcode access, a server-side Supabase vault, cloud synchronization, PWA installation and a Capacitor Android wrapper.

## Architecture and security

- No user registration or Supabase Auth accounts.
- One private passcode unlocks the personal workspace.
- The Next.js server creates a signed, HttpOnly, SameSite=Strict session cookie.
- Supabase is accessed only from server route handlers using `SUPABASE_SERVICE_ROLE_KEY`.
- The service-role key is never included in browser JavaScript or the Android package.
- Supabase RLS is enabled and there are no `anon` or `authenticated` table policies.
- The app stores one private JSON vault row. The browser retains a local copy and synchronizes changes to the server.

**Important:** A single shared passcode is a private access gate, not individual identity. Anyone who knows the passcode can access the same workspace. Use a long unique passphrase and do not share it. Use HTTPS in production.

## Requirements

- Windows 10/11
- Node.js 20.9+ (Node.js 22 LTS recommended)
- pnpm
- A Supabase project
- A GitHub account and Vercel account for website deployment
- Android Studio + Android SDK for APK builds

## A. Set up the Supabase database

1. Create a project at https://supabase.com.
2. Open **SQL Editor → New query**.
3. Paste the complete contents of `supabase/schema.sql` and run it.
4. Open **Project Settings → API**.
5. Copy the Project URL and the `service_role` secret key. Depending on the dashboard version, the secret may be listed under API keys as a secret/service-role key.
6. Keep the service-role key private. Never put it in a `NEXT_PUBLIC_` variable, source code, GitHub, Capacitor config or Android assets.

The SQL creates `public.mindforge_vault`, a single-row JSONB store. Do not create a Supabase Auth user or add public RLS policies for this private-passcode architecture.

## B. Configure the app on Windows PowerShell

Extract the ZIP. Open PowerShell in the folder containing `package.json` (the `mindforge` folder).

Check Node and pnpm:

```powershell
node --version
pnpm --version
```

If pnpm is missing, use Corepack:

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

Close and reopen PowerShell after enabling Corepack. On Windows, use `pnpm.cmd` if PowerShell blocks `pnpm.ps1`.

Create the local environment file:

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

Fill in all four values:

```env
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_SECRET
MF_ACCESS_PASSWORD=YOUR_LONG_UNIQUE_PRIVATE_PASSPHRASE
MF_SESSION_SECRET=YOUR_64_CHARACTER_RANDOM_HEX_SECRET
```

Generate a session secret in PowerShell:

```powershell
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
$rng.Dispose()
```

Copy the 64-character output into `MF_SESSION_SECRET`. Keep it stable. Changing it invalidates all active sessions. Do not commit `.env.local`.

Install and run:

```powershell
pnpm.cmd install
pnpm.cmd dev
```

Open http://localhost:3000 and enter the private passcode. For a production-like local test:

```powershell
pnpm.cmd build
pnpm.cmd start
```

## C. Existing local data migration

For the cleanest migration, run this updated project in the same browser and at the same origin as the old version first (for example, keep using http://localhost:3000). Browser localStorage is isolated by origin. When you first unlock MindForge in a browser that already contains the previous app's localStorage data, the app copies these keys into the private cloud vault if the vault is empty:

- `mindforge-v1`
- `mindforge-learning-hub-v1`
- `mindforge-brain-levels`
- `mindforge-flashcards-v1`

If cloud data already exists, it is loaded into the browser and becomes the current copy. Keep a JSON export from Settings before the first migration as an additional backup. Cloud writes are debounced. Use one active editing device at a time for now; simultaneous edits on multiple devices use last-write-wins and are not merged field-by-field.

## D. Deploy the website to Vercel

1. Create a private GitHub repository.
2. From the project folder, run:

```powershell
pnpm.cmd install
git init
git add .
git commit -m "Prepare MindForge private release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

3. Confirm `.env.local` is not staged. `.gitignore` excludes `.env.*` except `.env.example`.
4. Import the repository at https://vercel.com.
5. Select Next.js as the framework and deploy.
6. In **Vercel → Project → Settings → Environment Variables**, add the four variables from `.env.local`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MF_ACCESS_PASSWORD`
   - `MF_SESSION_SECRET`
7. Apply them to Production (and Preview only if you intend to use preview deployments), then redeploy.
8. Open the deployed HTTPS URL and test the passcode, saving, refresh and cloud restore.

Do not set these server secrets as `NEXT_PUBLIC_` variables. Do not use a preview deployment as your private production URL unless you have configured its environment variables and access intentionally.

## E. Install as a PWA on Android

1. Open the deployed HTTPS website in Chrome on Android.
2. Open Chrome's menu and choose **Install app** or **Add to Home screen**.
3. Launch MindForge from the new home-screen icon.

The current service worker supports the existing app behavior but is not a complete offline-first data system. Cloud synchronization requires an internet connection.

## F. Build a real Android APK with Capacitor

This starter uses Capacitor to package the deployed HTTPS application in an Android shell. It shares the same cloud database and private passcode. The hosted web app must be online and the phone needs internet access. This remote-web APK is suitable for direct testing/sideloading; a WebView wrapper is not automatically guaranteed to meet Google Play's minimum-functionality policies.

1. Install Android Studio: https://developer.android.com/studio
2. Make sure the website has been deployed and works at its final HTTPS address.
3. Edit `capacitor.config.ts` and replace `https://REPLACE-WITH-YOUR-MINDFORGE-DOMAIN` with your real URL. Do not include a trailing slash.
4. In PowerShell at the project root, run:

```powershell
pnpm.cmd install
pnpm.cmd exec cap add android
pnpm.cmd exec cap sync android
pnpm.cmd exec cap open android
```

If the `android` folder already exists, skip `cap add android` and run `cap sync android`.

5. Android Studio opens. Allow Gradle sync to finish and install the Android SDK components it requests.
6. For a test APK, choose **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
7. When the build completes, use the notification's **locate** link. The debug APK is normally under `android/app/build/outputs/apk/debug/`.
8. Transfer the APK to your phone, allow installation from that source when Android prompts, and install it.

For a signed release APK, use **Build → Generate Signed Bundle / APK → APK**, create a new keystore, and store the keystore/password securely in at least two safe places. Never commit the keystore to GitHub. Choose AAB instead if preparing a Play Store submission.

## G. Routine updates

After changing the website code:

```powershell
pnpm.cmd build
git add .
git commit -m "Update MindForge"
git push
```

Vercel redeploys from the GitHub push. For the remote-URL Capacitor wrapper, the Android binary does not need rebuilding for ordinary hosted website changes. Rebuild the APK when changing native Android configuration, app identity, native plugins or bundled native assets.

## Current limitations to understand

- One shared passcode means there are no separate user identities or per-device permissions.
- The current cloud sync stores the app's local data as one JSON document. It is not a relational analytics database.
- Simultaneous edits on multiple devices are last-write-wins. Avoid editing on two devices at once until conflict-aware merging is added.
- The first migration uses the local browser data only when the cloud vault is empty. If the cloud vault already contains data, cloud data takes precedence.
- Cloud synchronization requires internet access. The PWA service worker is not a full offline data queue.
- Existing reminders are checked while the app is open. Background push notifications and server-side scheduled reminders are not implemented.
- Keep a regular export backup from Settings. Supabase free-tier backups and retention should not be treated as your only backup.

## Troubleshooting

**`Private access is not configured correctly`**: verify all four server environment variables. `MF_SESSION_SECRET` must be at least 32 characters.

**`Could not load cloud data` / `Could not save cloud data`**: check `SUPABASE_URL`, the service-role key, and that `supabase/schema.sql` ran successfully in the same Supabase project.

**Website deploys but unlock returns 500**: add the four environment variables to Vercel and redeploy. Restarting a deployment without setting them will not fix it.

**APK opens a placeholder URL**: update `capacitor.config.ts` to the deployed HTTPS URL, then run `pnpm.cmd exec cap sync android` and rebuild.

**PowerShell says scripts are disabled**: use `pnpm.cmd` instead of `pnpm`.
