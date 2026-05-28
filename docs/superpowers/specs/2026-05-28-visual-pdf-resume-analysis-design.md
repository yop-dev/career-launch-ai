# Visual PDF Resume Analysis Design

## Goal

CareerLaunch AI should analyze the uploaded resume as both editable text and a rendered PDF, so resume critique can give grounded advice about content and visual formatting.

## Current Behavior

The app currently reads a PDF upload in the browser, sends the base64 PDF to `pages/api/upload.js`, extracts plain text with `pdf-parse`, and stores that text in `resumeText`. The user can edit the extracted text before clicking Analyze. `pages/api/analyze.js` receives only `resumeText`, so the model cannot actually see margins, spacing, columns, font hierarchy, page density, or visual layout.

## Product Behavior

Visual PDF analysis will be automatic for resume critique. Users will keep the same upload and edit flow. Behind the scenes, the browser will render up to the first two PDF pages into compressed JPEG data URLs and store them alongside the extracted text.

When the user clicks Analyze Resume, the app will send both:

- `resumeText`: the editable text shown in the resume editor.
- `resumeImages`: compressed page images rendered from the original uploaded PDF.

If image rendering fails, the app will continue with text-only analysis. The user should not lose the existing critique workflow because the visual path failed.

## Page Limit

The first version will render a maximum of two pages. Most resumes should be one or two pages, and this keeps request size, latency, and Groq free-tier pressure under control. The full extracted text remains available to the model even if the original PDF has more than two pages.

## Model Selection

The existing text model remains the default for text-only requests:

- `GROQ_MODEL`, defaulting to `llama-3.1-8b-instant`.

Resume critique requests with images will use a vision-capable Groq model:

- `GROQ_VISION_MODEL`, defaulting to `meta-llama/llama-4-scout-17b-16e-instruct`.

The vision model id must be configurable because Groq preview model availability and limits can change.

## Data Flow

1. User uploads a PDF.
2. Browser reads the file.
3. Browser sends PDF base64 to `/api/upload`.
4. `/api/upload` returns extracted text from `pdf-parse`.
5. Browser renders pages 1 and 2 with `pdfjs-dist`.
6. Browser stores extracted text in `resumeText` and page images in `resumeImages`.
7. User edits `resumeText`.
8. User clicks Analyze Resume.
9. Browser posts `{ resumeText, resumeImages }` to `/api/analyze`.
10. `/api/analyze` uses the vision model when valid images are present and otherwise uses the text model.
11. API returns formatted feedback using the existing formatter.

## Prompting Rules

The analysis prompt must make the source of truth explicit:

- Use extracted text for content, achievements, section completeness, wording, grammar, and keywords.
- Use page images for visual layout, spacing, margins, alignment, hierarchy, page density, columns, and scanability.
- Do not invent visual issues that are not visible in the images.
- If images are unavailable, limit formatting advice to text structure and ATS readability.
- If the user edited the extracted text, treat `resumeText` as the content source of truth and treat the images as the original visual layout.

## Error Handling

The upload flow should tolerate visual rendering failures. If PDF rendering fails, clear `resumeImages` and keep the extracted text result.

The analyze API should validate `resumeImages` as an optional array of data URLs. If the image array is empty or invalid, fall back to text-only analysis.

If Groq returns a rate-limit error, the API should return a friendly message that the visual analysis service is busy and the user should try again shortly.

If the vision request fails unexpectedly, the API may retry once with text-only analysis so the user still receives useful feedback.

## Reliability Expectations

Client-side rendering with `pdfjs-dist` should be reliable for common resume PDFs exported from Word, Google Docs, Pages, LaTeX, and Canva. Very large, unusual, or complex PDFs may render slowly or fail on weaker devices. The feature is an improvement over text-only critique, but visual feedback should still be phrased as guidance rather than deterministic layout measurement.

## Testing Strategy

Use focused unit tests for pure helpers:

- Page/image validation.
- Groq message construction for text-only and vision requests.
- Model selection.
- Friendly error mapping for rate limits.

Use manual browser verification for the end-to-end PDF rendering path:

- Upload a one-page PDF and verify one image is stored.
- Upload a two-page PDF and verify two images are stored.
- Upload a longer PDF and verify only two images are used.
- Confirm Analyze works if rendering fails and only text is available.

