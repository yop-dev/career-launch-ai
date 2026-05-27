import OpenAI from "openai";
import { formatResumeFeedback } from "./formatResumeFeedback";
import { GROQ_MODEL } from "../../lib/groq";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { resumeText } = req.body;
  if (!resumeText || typeof resumeText !== "string") {
    return res.status(400).json({ error: "Invalid resume text." });
  }

  const enhancedPrompt = `You are a senior resume strategist and hiring manager. Analyze the resume and return practical, specific feedback.

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
- When something is weak, explain exactly what to change.
- Prioritize changes that would improve interview conversion.
- If a section is missing from the resume, say so plainly and recommend what to add.

Resume to analyze:

${resumeText}`;

  try {
    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a senior resume strategist. Follow the requested markdown structure exactly and never return empty list items.",
        },
        {
          role: "user",
          content: enhancedPrompt,
        },
      ],
      temperature: 0.35,
      max_tokens: 2200,
    });

    const responseText = response.choices[0]?.message?.content || "";

    if (!responseText.trim()) {
      throw new Error("Empty response from Groq API");
    }

    const formattedResponse = formatResumeFeedback(responseText);

    console.log(`Successfully analyzed resume of ${resumeText.length} characters`);

    res.status(200).json({
      feedback: formattedResponse,
      metadata: {
        resumeLength: resumeText.length,
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
