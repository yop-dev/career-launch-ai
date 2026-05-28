# Visual PDF Resume Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic visual PDF resume analysis by rendering uploaded PDF pages to images and sending them with editable resume text to Groq vision.

**Architecture:** The browser renders up to two uploaded PDF pages into compressed JPEG data URLs using `pdfjs-dist`. `pages/api/analyze.js` accepts optional `resumeImages`, uses shared helper functions to validate images, build Groq messages, choose the text or vision model, and gracefully falls back to text-only analysis when visual analysis fails.

**Tech Stack:** Next.js Pages Router, React, Groq via OpenAI SDK, `pdf-parse`, `pdfjs-dist`, Node built-in test runner.

---

## File Structure

- Modify `package.json`: add `pdfjs-dist` and a `test` script.
- Modify `lib/groq.js`: add configurable `GROQ_VISION_MODEL`.
- Create `lib/resumeAnalysis.js`: pure helper functions for image validation, prompt building, Groq message construction, model selection, and rate-limit detection.
- Create `tests/resumeAnalysis.test.mjs`: Node tests for the pure helper functions.
- Modify `pages/api/analyze.js`: use helper functions, support optional `resumeImages`, call Groq vision when valid images are present, and retry text-only after unexpected vision failure.
- Modify `pages/index.js`: store `resumeImages`, render uploaded PDF pages client-side, and include images in the analyze request.
- Modify `.env.local.example`: document `GROQ_VISION_MODEL`.

---

### Task 1: Add Groq Vision Configuration And Helper Tests

**Files:**
- Modify: `package.json`
- Modify: `lib/groq.js`
- Create: `lib/resumeAnalysis.js`
- Create: `tests/resumeAnalysis.test.mjs`
- Modify: `.env.local.example`

- [ ] **Step 1: Add dependency and test script**

Edit `package.json` so scripts and dependencies include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "node --test tests/*.test.mjs"
  },
  "dependencies": {
    "pdfjs-dist": "^4.10.38"
  }
}
```

Keep all existing dependencies. Do not remove current scripts.

- [ ] **Step 2: Add vision model config**

Replace `lib/groq.js` with:

```js
export const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

export const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
```

- [ ] **Step 3: Document the new env var**

Update `.env.local.example`:

```dotenv
# Copy this file to .env.local and fill in your Groq API key
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

- [ ] **Step 4: Write helper tests first**

Create `tests/resumeAnalysis.test.mjs`:

```js
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildResumeAnalysisMessages,
  getValidResumeImages,
  hasValidResumeImages,
  isGroqRateLimitError,
  selectResumeAnalysisModel,
} from "../lib/resumeAnalysis.js";

const tinyJpeg =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==";

describe("resumeAnalysis helpers", () => {
  it("keeps only valid image data URLs and caps images at two", () => {
    const valid = getValidResumeImages([
      tinyJpeg,
      "data:image/png;base64,iVBORw0KGgo=",
      "https://example.com/resume.png",
      "",
      tinyJpeg,
    ]);

    assert.deepEqual(valid, [
      tinyJpeg,
      "data:image/png;base64,iVBORw0KGgo=",
    ]);
  });

  it("reports whether valid resume images are available", () => {
    assert.equal(hasValidResumeImages([tinyJpeg]), true);
    assert.equal(hasValidResumeImages(["not-an-image"]), false);
    assert.equal(hasValidResumeImages(undefined), false);
  });

  it("selects the vision model only when images are present", () => {
    assert.equal(
      selectResumeAnalysisModel({
        textModel: "text-model",
        visionModel: "vision-model",
        resumeImages: [tinyJpeg],
      }),
      "vision-model",
    );

    assert.equal(
      selectResumeAnalysisModel({
        textModel: "text-model",
        visionModel: "vision-model",
        resumeImages: [],
      }),
      "text-model",
    );
  });

  it("builds text-only Groq messages with string content", () => {
    const messages = buildResumeAnalysisMessages({
      resumeText: "Jane Doe\nSoftware Engineer",
      resumeImages: [],
    });

    assert.equal(messages[0].role, "system");
    assert.equal(messages[1].role, "user");
    assert.equal(typeof messages[1].content, "string");
    assert.match(messages[1].content, /Resume to analyze:/);
    assert.match(messages[1].content, /If images are unavailable/);
  });

  it("builds vision Groq messages with text and image_url parts", () => {
    const messages = buildResumeAnalysisMessages({
      resumeText: "Jane Doe\nSoftware Engineer",
      resumeImages: [tinyJpeg],
    });

    assert.equal(messages[1].role, "user");
    assert.equal(Array.isArray(messages[1].content), true);
    assert.equal(messages[1].content[0].type, "text");
    assert.equal(messages[1].content[1].type, "image_url");
    assert.equal(messages[1].content[1].image_url.url, tinyJpeg);
  });

  it("detects Groq rate limit errors", () => {
    assert.equal(isGroqRateLimitError({ status: 429 }), true);
    assert.equal(isGroqRateLimitError({ message: "429 Too Many Requests" }), true);
    assert.equal(isGroqRateLimitError({ message: "network failed" }), false);
  });
});
```

- [ ] **Step 5: Run tests and verify failure**

Run:

```bash
npm test
```

Expected: FAIL because `lib/resumeAnalysis.js` does not exist yet.

- [ ] **Step 6: Implement helper module**

Create `lib/resumeAnalysis.js`:

```js
const MAX_RESUME_IMAGES = 2;
const IMAGE_DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

export function getValidResumeImages(resumeImages) {
  if (!Array.isArray(resumeImages)) return [];

  return resumeImages
    .filter((image) => typeof image === "string")
    .map((image) => image.trim())
    .filter((image) => IMAGE_DATA_URL_PATTERN.test(image))
    .slice(0, MAX_RESUME_IMAGES);
}

export function hasValidResumeImages(resumeImages) {
  return getValidResumeImages(resumeImages).length > 0;
}

export function selectResumeAnalysisModel({ textModel, visionModel, resumeImages }) {
  return hasValidResumeImages(resumeImages) ? visionModel : textModel;
}

export function buildResumeAnalysisPrompt(resumeText, hasImages) {
  const visualGuidance = hasImages
    ? `Visual analysis rules:
- Use the attached PDF page images to evaluate visual layout, spacing, margins, alignment, hierarchy, page density, columns, and scanability.
- Do not invent visual formatting issues that are not visible in the images.
- The extracted text may include user edits. Treat the extracted text as the content source of truth and the images as the original visual layout.`
    : `Visual analysis rules:
- If images are unavailable, limit formatting advice to text structure and ATS readability.
- Do not critique margins, fonts, colors, columns, or visual layout because no page images were provided.`;

  return `You are a senior resume strategist and hiring manager. Analyze the resume and return practical, specific feedback.

Formatting contract:
- Return ONLY markdown.
- Use exactly these H2 section headings, in this order:
## Overall Assessment (Score: X/10)
## Strengths
## Critical Improvements Needed
## Section-by-Section Analysis
## Formatting and ATS Readiness
## Content Optimization
## Specific Recommendations
## Red Flags to Address
## Industry-Specific Advice
- Under "Overall Assessment", write one short paragraph only.
- Under every other section, use dash bullets only.
- Every bullet must be a complete sentence with the evidence or reason included.
- Do not use numbered lists.
- Do not create bold subsection headings inside sections.
- Do not output empty bullets.
- Do not use the bullet character.
- Do not wrap the response in code fences.

Quality bar:
- Be specific to the resume. Avoid generic advice unless the resume gives no evidence.
- Use extracted text for content, achievements, section completeness, wording, grammar, and keywords.
- When something is weak, explain exactly what to change.
- Prioritize changes that would improve interview conversion.
- If a section is missing from the resume, say so plainly and recommend what to add.

${visualGuidance}

Resume to analyze:

${resumeText}`;
}

export function buildResumeAnalysisMessages({ resumeText, resumeImages }) {
  const validImages = getValidResumeImages(resumeImages);
  const prompt = buildResumeAnalysisPrompt(resumeText, validImages.length > 0);
  const systemMessage = {
    role: "system",
    content:
      "You are a senior resume strategist. Follow the requested markdown structure exactly and never return empty list items.",
  };

  if (validImages.length === 0) {
    return [
      systemMessage,
      {
        role: "user",
        content: prompt,
      },
    ];
  }

  return [
    systemMessage,
    {
      role: "user",
      content: [
        {
          type: "text",
          text: prompt,
        },
        ...validImages.map((image) => ({
          type: "image_url",
          image_url: {
            url: image,
          },
        })),
      ],
    },
  ];
}

export function isGroqRateLimitError(error) {
  return (
    error?.status === 429 ||
    error?.code === 429 ||
    /429|rate limit|too many requests/i.test(error?.message || "")
  );
}
```

- [ ] **Step 7: Run tests and verify pass**

Run:

```bash
npm test
```

Expected: PASS for all `resumeAnalysis helpers` tests.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json lib/groq.js lib/resumeAnalysis.js tests/resumeAnalysis.test.mjs .env.local.example
git commit -m "feat(resume): add visual analysis helpers"
```

---

### Task 2: Update Analyze API For Vision Requests And Fallback

**Files:**
- Modify: `pages/api/analyze.js`
- Test: `tests/resumeAnalysis.test.mjs`

- [ ] **Step 1: Add an API behavior test for image message construction**

Append this test to `tests/resumeAnalysis.test.mjs`:

```js
it("keeps the visual analysis instructions in the vision prompt", () => {
  const messages = buildResumeAnalysisMessages({
    resumeText: "Jane Doe\nSoftware Engineer",
    resumeImages: [tinyJpeg],
  });

  assert.match(messages[1].content[0].text, /Use the attached PDF page images/);
  assert.match(messages[1].content[0].text, /Do not invent visual formatting issues/);
});
```

- [ ] **Step 2: Run tests and verify pass**

Run:

```bash
npm test
```

Expected: PASS. This test should already pass after Task 1 and protects the API prompt behavior before wiring it into the route.

- [ ] **Step 3: Replace analyze route prompt/model construction**

Modify `pages/api/analyze.js` to:

```js
import OpenAI from "openai";
import { formatResumeFeedback } from "./formatResumeFeedback";
import { GROQ_MODEL, GROQ_VISION_MODEL } from "../../lib/groq";
import {
  buildResumeAnalysisMessages,
  getValidResumeImages,
  isGroqRateLimitError,
  selectResumeAnalysisModel,
} from "../../lib/resumeAnalysis";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function requestResumeAnalysis({ resumeText, resumeImages }) {
  const messages = buildResumeAnalysisMessages({ resumeText, resumeImages });
  const model = selectResumeAnalysisModel({
    textModel: GROQ_MODEL,
    visionModel: GROQ_VISION_MODEL,
    resumeImages,
  });

  return client.chat.completions.create({
    model,
    messages,
    temperature: 0.35,
    max_tokens: 2200,
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { resumeText, resumeImages } = req.body;
  if (!resumeText || typeof resumeText !== "string") {
    return res.status(400).json({ error: "Invalid resume text." });
  }

  const validResumeImages = getValidResumeImages(resumeImages);

  try {
    let response;

    try {
      response = await requestResumeAnalysis({
        resumeText,
        resumeImages: validResumeImages,
      });
    } catch (err) {
      if (isGroqRateLimitError(err)) {
        return res.status(429).json({
          error:
            "Visual analysis is busy right now. Please try again in a minute.",
        });
      }

      if (validResumeImages.length === 0) {
        throw err;
      }

      console.error("Vision resume analysis failed; retrying text-only analysis:", err);
      response = await requestResumeAnalysis({
        resumeText,
        resumeImages: [],
      });
    }

    const responseText = response.choices[0]?.message?.content || "";

    if (!responseText.trim()) {
      throw new Error("Empty response from Groq API");
    }

    const formattedResponse = formatResumeFeedback(responseText);

    console.log(
      `Successfully analyzed resume of ${resumeText.length} characters with ${validResumeImages.length} visual page(s)`,
    );

    res.status(200).json({
      feedback: formattedResponse,
      metadata: {
        resumeLength: resumeText.length,
        visualPageCount: validResumeImages.length,
        analysisTimestamp: new Date().toISOString(),
        wordCount: resumeText.split(/\s+/).length,
      },
    });
  } catch (err) {
    console.error("Resume analysis error:", err);

    let errorMessage = "Internal server error";
    if (err.message.includes("Groq")) {
      errorMessage = "AI service temporarily unavailable. Please try again.";
    } else if (err.message.includes("fetch") || err.message.includes("network")) {
      errorMessage = "Unable to connect to AI service. Please try again later.";
    }

    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add pages/api/analyze.js tests/resumeAnalysis.test.mjs
git commit -m "feat(resume): use Groq vision for resume analysis"
```

---

### Task 3: Render Uploaded PDF Pages In The Browser

**Files:**
- Modify: `pages/index.js`

- [ ] **Step 1: Add image state and constants**

In `pages/index.js`, add near the existing state:

```js
  const [resumeImages, setResumeImages] = useState([]);
```

Add constants outside the component:

```js
const MAX_VISUAL_RESUME_PAGES = 2;
const PDF_RENDER_SCALE = 1.4;
const PDF_IMAGE_QUALITY = 0.72;
```

- [ ] **Step 2: Add PDF rendering helper**

Add this function above `handleFileUpload` inside `Home`:

```js
  const renderResumeImages = async (file) => {
    if (typeof window === "undefined") return [];

    const pdfjsLib = await import("pdfjs-dist");
    const pdfWorker = await import("pdfjs-dist/build/pdf.worker.mjs");

    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = Math.min(pdfDocument.numPages, MAX_VISUAL_RESUME_PAGES);
    const images = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      images.push(canvas.toDataURL("image/jpeg", PDF_IMAGE_QUALITY));
    }

    return images;
  };
```

- [ ] **Step 3: Render images during upload without breaking text extraction**

Inside `handleFileUpload`, before creating `FileReader`, clear previous state:

```js
    setResumeImages([]);
```

Inside `reader.onloadend`, after `setResumeText(data.text);`, add:

```js
        try {
          const images = await renderResumeImages(file);
          setResumeImages(images);
        } catch (renderError) {
          console.error("Failed to render resume PDF pages:", renderError);
          setResumeImages([]);
        }
```

- [ ] **Step 4: Include images in analyze request**

Change the analyze request body in `analyzeResume`:

```js
        body: JSON.stringify({ resumeText, resumeImages }),
```

- [ ] **Step 5: Improve user-facing analyze error handling**

Replace the `catch` in `analyzeResume` with:

```js
    } catch (err) {
      setFeedback("Error: " + err.message);
    }
```

If the current catch already matches this, leave it unchanged.

- [ ] **Step 6: Run tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 7: Run build**

Run:

```bash
npm run build
```

Expected: PASS. If Next fails to bundle the worker import, replace the worker import with:

```js
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url,
    ).toString();
```

Then rerun `npm run build`.

- [ ] **Step 8: Commit**

```bash
git add pages/index.js package.json package-lock.json
git commit -m "feat(resume): render PDF pages for visual analysis"
```

---

### Task 4: Manual End-To-End Verification

**Files:**
- No source changes expected unless verification finds a bug.

- [ ] **Step 1: Start dev server**

Run:

```bash
npm run dev
```

Expected: app starts on `http://localhost:3000` or the next available port.

- [ ] **Step 2: Verify one-page PDF**

In the browser:

1. Upload a one-page PDF resume.
2. Confirm extracted text appears in the resume editor.
3. Click Analyze Resume.
4. Confirm feedback returns.
5. Confirm the response includes formatting guidance that references visible page layout only when justified.

- [ ] **Step 3: Verify two-page PDF**

In the browser:

1. Upload a two-page PDF resume.
2. Confirm extracted text appears.
3. Click Analyze Resume.
4. Confirm feedback returns without request-size errors.

- [ ] **Step 4: Verify longer PDF cap**

In the browser:

1. Upload a PDF longer than two pages.
2. Confirm the app still analyzes successfully.
3. Confirm server logs report `2 visual page(s)`.

- [ ] **Step 5: Verify text-only fallback**

Temporarily force `renderResumeImages` to throw:

```js
throw new Error("Forced render failure");
```

Then:

1. Upload a PDF.
2. Confirm extracted text still appears.
3. Click Analyze Resume.
4. Confirm feedback returns using text-only analysis.
5. Remove the forced throw.

- [ ] **Step 6: Run final build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit any verification fixes**

If verification required source changes:

```bash
git add pages/index.js pages/api/analyze.js lib/resumeAnalysis.js
git commit -m "fix(resume): stabilize visual analysis flow"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review Notes

- Spec coverage: The plan covers client PDF rendering, two-page cap, text plus image API payload, Groq vision model selection, prompt rules, fallback behavior, rate-limit handling, environment config, automated helper tests, build verification, and manual browser verification.
- Placeholder scan: No `TBD`, `TODO`, or vague implementation steps remain.
- Type consistency: The plan consistently uses `resumeImages`, `GROQ_VISION_MODEL`, `getValidResumeImages`, `buildResumeAnalysisMessages`, `selectResumeAnalysisModel`, and `isGroqRateLimitError`.

