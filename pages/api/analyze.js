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
