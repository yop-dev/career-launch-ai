# Session Context - 2026-05-27

## Project

CareerLaunch AI is a small Next.js Pages Router app for job seekers. Users upload a PDF resume, edit the extracted text, and then use AI tools for resume critique, cover letter generation, and mock interview question generation.

There is no database. The app is stateless and uses Next.js API routes as the backend.

## Environment Setup

- Installed official Node.js LTS on Windows via winget because `npm` was initially unavailable.
- Fixed PowerShell script execution by setting the current user policy to `RemoteSigned`.
- `npm install` completed successfully.
- Local `.env` exists with `GROQ_API_KEY`. Do not print or commit real keys.

## AI / Groq Fixes

The app originally used Groq model `llama3-8b-8192`, which returned `model_decommissioned`.

Changes made:

- Added [lib/groq.js](../lib/groq.js) with `GROQ_MODEL`.
- Default model is now `llama-3.1-8b-instant`.
- Updated Groq-backed API routes to use shared model config.
- Added `GROQ_MODEL=llama-3.1-8b-instant` to `.env.local.example`.

Important: after adding/changing Vercel environment variables, redeploy from the latest commit.

## Vercel Deployment Fixes

Vercel blocked deployment because `next@15.3.3` was flagged vulnerable.

Changes made:

- Pinned/upgraded:
  - `next` to `^15.5.10`
  - `react` to `^19.2.3`
  - `react-dom` to `^19.2.3`
- Verified `npm run build` passes locally.

## Design Direction

The current visual direction is based on a restrained editorial SaaS reference:

- Warm off-white background
- Thin hairline borders
- Minimal shadows
- Black rectangular CTA buttons
- Muted grey/brown text
- Large, quiet typography
- Italic serif accent for `AI`
- No gradient-heavy sections
- No extra direct-response copy or extra CTAs beyond existing app flow

The user specifically asked to copy the design language only: buttons, typography, and color palette. Do not add new marketing sections or extra buttons unless explicitly requested.

## UI Changes Completed

Main page:

- Restyled existing homepage/upload area in [pages/index.js](../pages/index.js).
- Kept original content and flow.
- No new landing sections remain.

Post-upload tools:

- Restyled [components/ResumePanel.js](../components/ResumePanel.js).
- Restyled [components/CoverLetterGenerator.js](../components/CoverLetterGenerator.js).
- Restyled [components/MockInterviewGenerator.js](../components/MockInterviewGenerator.js).

Resume feedback results:

- Overhauled AI Feedback & Analysis output to use editorial numbered sections with thin dividers.
- Replaced brittle formatter in [pages/api/formatResumeFeedback.js](../pages/api/formatResumeFeedback.js).
- Tightened resume critique prompt in [pages/api/analyze.js](../pages/api/analyze.js).
- Prompt now requires strict Markdown sections and dash bullets.
- Temperature lowered to `0.35`.

Mock interview results:

- Tightened mock interview prompt in [pages/api/generate-mock-interview.js](../pages/api/generate-mock-interview.js).
- Replaced old colored/chunky formatter in [components/MockInterviewGenerator.js](../components/MockInterviewGenerator.js).
- Mock interview output now matches the same numbered editorial section style.
- Temperature lowered to `0.35`.

About modal:

- Restyled the "About CareerLaunch AI" modal in [pages/index.js](../pages/index.js) to match the same editorial design language.
- Replaced blue card styling with warm off-white surfaces, thin borders, black/gray typography, and a quieter icon/close button treatment.
- Improved the modal copy while keeping the same basic sections: what it is, how it works, getting started, and privacy/security.
- Privacy copy now clearly says there is no database and resume text is sent to the AI provider for the current request.

Next.js document:

- Added [pages/_document.js](../pages/_document.js) with the standard Pages Router `Html`, `Head`, `Main`, and `NextScript` structure.
- This fixed a clean-build prerender error: `<Html> should not be imported outside of pages/_document`.

## Known Context / Watchouts

- `.env` contains a real Groq key and is ignored. Never expose it.
- A Groq key was visible in a screenshot during the session; it should be treated as compromised and rotated if not already done.
- `requirements.txt` is stale and refers to Ollama/Mistral, which this app does not currently use.
- `test-groq.js` is stale and references the old `groq` package / model.
- `.vercel/` is tracked even though Vercel generally recommends not sharing it.
- `dompurify` is installed but not used. Current formatters escape model text before injecting HTML.
- `pages/_app.js` does not exist, so global CSS files may not actually be imported globally.
- If local dev shows `Cannot find module './341.js'` from `.next/server/webpack-runtime.js` after adding `_document.js`, restart the dev server. This was a stale `.next` / in-memory webpack runtime issue, not a source-code issue.

## Verification

`npm run build` was run after the major changes and passed. A later clean build also passed after adding `pages/_document.js`.

## Recent Local Commits

These commits are local unless pushed later:

- `6adcbc5 feat(ui): apply editorial visual style`
- `4357815 feat(resume): improve feedback results formatting`
- `0a3c10e feat(interview): improve mock interview results`

Uncommitted follow-up changes at the time this doc was updated:

- Modal styling/content update in `pages/index.js`
- New `pages/_document.js`
- This session context doc in `docs/session-context-2026-05-27.md`

Earlier pushed commits include:

- `abc1a62 Update Groq model configuration`
- `f41d67f Upgrade Next.js for Vercel deployment`

## Suggested Next Steps

- Preview the full user flow manually after upload/analyze.
- Push the three local commits when ready.
- Consider removing or updating stale files: `requirements.txt`, `test-groq.js`, `test-groq-models.js`.
- Consider adding a small shared renderer/helper for Markdown section output to avoid duplicate feedback/interview formatter logic.
- Consider adding `pages/_app.js` to import global CSS intentionally, or remove unused CSS files if styling stays inline.
