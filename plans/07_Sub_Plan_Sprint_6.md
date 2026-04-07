# Sub-Plan — Sprint 6: Deploy to Vercel

> **What is this document:** The detailed Sub-Plan for Sprint 6 of the ROVE chatbot Master Plan. This sprint takes the completed chatbot from local development to a live public URL on Vercel.

**Sprint Objective:** Deploy the chatbot to Vercel with a working public URL. At the end of this sprint, anyone can open the URL and interact with the ROVE chatbot.

**Estimated Time:** ~30 minutes

**Dependencies:** Sprint 5 completed.

**Risks Mitigated:** R5 (API key exposed — final verification), Vercel timeout

---

### [x] Task 6.1 — Verify .gitignore is complete

**Files involved:** `/.gitignore` (verify)

**Required input:** Sprint 5 completed.

**Expected output:** The `.gitignore` file contains at minimum:
```
.env.local
.env*.local
node_modules/
.next/
*.log
.DS_Store
```

If any entries are missing, add them.

**Success criterion:** Running `cat .gitignore` shows all entries listed above. The `.env.local` file will NOT be committed to Git.

---

### [x] Task 6.2 — Run production build and fix errors

**Files involved:** All project files (no specific modifications expected).

**Required input:** Task 6.1 completed.

**Expected output:** The production build completes without errors.

**IDE instruction:**
```bash
npm run build
```

If the build fails:
1. Read the error output carefully
2. Fix each error in the indicated file
3. Run `npm run build` again
4. Repeat until the build succeeds

Common build issues to watch for:
- Missing imports (file references that work in dev but fail in build)
- TypeScript type errors that were suppressed in dev mode
- Environment variables not available at build time (should not be an issue since we only use them at runtime in API routes)
- `fs` module imported in a client component (must only be used in server-side code: API routes and server components)

**Success criterion:** `npm run build` outputs "Compiled successfully" (or equivalent) and creates the `.next/` build directory without errors. Running `npm run start` serves the production build on `http://localhost:3000` and the chatbot works correctly.

---

### [x] Task 6.3 — Initialize Git repository and create initial commit

**Files involved:** All project files.

**Required input:** Task 6.2 completed (build passes).

**Expected output:** A Git repository is initialized with a clean initial commit containing all project files.

**IDE instructions:**
```bash
git init
git add .
git status  # Verify .env.local is NOT listed
git commit -m "Initial commit: ROVE multi-agent chatbot"
```

**Success criterion:** `git status` after the commit shows a clean working tree. `git log` shows one commit. Running `git show --stat HEAD` does NOT include `.env.local` in the committed files.

---

### [x] Task 6.4 — Push to GitHub

**Files involved:** No file changes. Git operations only.

**Required input:** Task 6.3 completed. The student has a GitHub account.

**Expected output:** The repository is pushed to GitHub as a new repository.

**IDE instructions:**
1. Create a new repository on GitHub (public or private, student's choice)
2. Add the remote and push:
```bash
git remote add origin https://github.com/{username}/rove-chatbot.git
git branch -M main
git push -u origin main
```

**Success criterion:** The repository is visible on GitHub at `https://github.com/{username}/rove-chatbot`. The file list on GitHub does NOT include `.env.local`. The `docs/` folder with all KB and prompt files is present.

---

### [x] Task 6.5 — Deploy to Vercel

**Files involved:** No file changes. Vercel dashboard operations.

**Required input:** Task 6.4 completed. The student has a Vercel account (free tier is sufficient).

**Expected output:** The project is deployed to Vercel with a public URL.

**Steps:**
1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New Project"
3. Import the GitHub repository (`rove-chatbot`)
4. Vercel auto-detects Next.js — accept the default settings
5. Before clicking "Deploy", go to "Environment Variables" and add the API key:
   - For Claude: Name = `ANTHROPIC_API_KEY`, Value = `sk-ant-...`
   - For Gemini: Name = `GOOGLE_GENERATIVE_AI_API_KEY`, Value = `...`
   - For GPT: Name = `OPENAI_API_KEY`, Value = `sk-...`
6. Click "Deploy"

**Success criterion:** Vercel shows "Deployment successful" with a green checkmark. A public URL is generated (e.g., `rove-chatbot.vercel.app` or `rove-chatbot-{hash}.vercel.app`).

---

### [x] Task 6.6 — Configure Vercel function timeout (if needed)

**Files involved:** `/vercel.json` (create new, only if needed)

**Required input:** Task 6.5 completed.

**Expected output:** If the chatbot works on the deployed URL without timeout errors, skip this task. If responses fail with a timeout (502 or 504 error after ~10 seconds), create a `vercel.json` at the project root:

```json
{
  "functions": {
    "app/api/chat/route.ts": {
      "maxDuration": 30
    }
  }
}
```

Then commit and push:
```bash
git add vercel.json
git commit -m "Increase API route timeout to 30s for double LLM call"
git push
```

Vercel will auto-redeploy on push.

**Success criterion:** The chatbot responds on the live URL without timeout errors. If `vercel.json` was added, the new deployment succeeds and the timeout issue is resolved.

---

### [x] Task 6.7 — Security verification on deployed site

**Files involved:** No file changes. Browser verification only.

**Required input:** Task 6.5 (or 6.6) completed. The chatbot is live.

**Expected output:** No files changed. This is a security verification.

**Checks:**
1. Open the deployed URL in Chrome
2. Open DevTools → Network tab
3. Send a message in the chatbot
4. Inspect the request to `/api/chat`:
   - The request body should contain `messages` and `currentAgent`
   - The request body should NOT contain any API key
   - The response headers should NOT expose the API key
5. Open DevTools → Sources tab:
   - Search for the API key string in the client-side JavaScript bundles
   - It should NOT appear anywhere
6. Check the GitHub repository:
   - Navigate to the repo on GitHub
   - Search for the API key string — it should NOT appear in any file or commit

**Success criterion:** The API key is NOT visible in any client-side code, network request, response header, or Git commit. All LLM calls happen server-side.

---

### [x] Task 6.8 — Smoke test on live URL

**Files involved:** No file changes. Testing via the deployed application.

**Required input:** All previous tasks completed.

**Expected output:** No files changed. This is the final end-to-end test on the production deployment.

**Test script:**
1. Open the public URL in a browser (not localhost)
2. Verify the welcome message appears from Discovery (purple)
3. Type: "Ciao, vorremmo organizzare un viaggio alle Maldive. Siamo una coppia con budget di 8000 euro, cerchiamo relax e lusso."
4. Verify Discovery responds with a qualification/recommendation
5. Type: "Perfetto, quali resort avete disponibili? Quanto costano?"
6. Verify the agent switches to Sales (orange) and presents real packages with prices
7. Type: "Ho anche un problema con un viaggio precedente, il mio volo e stato cancellato"
8. Verify the agent switches to Support (green) and provides operational procedures
9. Type: "Ok il problema e risolto, torniamo ai resort delle Maldive"
10. Verify the agent switches back to Sales (orange)

**Success criterion:** ALL of the following are true:
1. The deployed URL loads the chatbot without errors
2. The welcome message appears from Discovery
3. Streaming works (responses appear progressively)
4. Discovery → Sales handoff works correctly
5. Sales → Support → Sales routing works correctly
6. Each agent switch changes the UI indicator (name + color)
7. Sales quotes real prices from the KB
8. Support follows operational procedures
9. The phase-aware loading shows during routing
10. No errors in the browser console
11. The URL is shareable — anyone with the link can use the chatbot
