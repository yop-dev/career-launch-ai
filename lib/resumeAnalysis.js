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
