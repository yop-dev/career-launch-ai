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
