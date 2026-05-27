import OpenAI from "openai";
import { GROQ_MODEL } from "../../lib/groq";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { resumeText, jobDescription } = req.body;
  if (!resumeText || typeof resumeText !== "string") {
    return res.status(400).json({ error: "Invalid resume text." });
  }

  const jobDesc = jobDescription || "a position related to your skills and experience";
  const enhancedPrompt = `You are an experienced hiring manager preparing a targeted mock interview for ${jobDesc}.

Formatting contract:
- Return ONLY markdown.
- Use exactly these H2 section headings, in this order:
## Technical Skills Assessment
## Experience Deep Dive
## Behavioral Questions
## Situational Scenarios
## Career Motivation
## Company and Industry Knowledge
## Closing Questions
- Under each section, use dash bullets only.
- Each bullet must be one interview question followed by a short "What this tests:" clause.
- Do not use numbered lists.
- Do not create bold subsection headings inside sections.
- Do not output empty bullets.
- Do not use the bullet character.
- Do not wrap the response in code fences.

Quality bar:
- Questions must be specific to the candidate's resume and the target role.
- Avoid generic questions that could be asked to anyone.
- Include a mix of technical, behavioral, situational, and motivation questions.
- If the job description is missing, infer sensible role context from the resume.

Resume:
${resumeText}

Job Description:
${jobDescription || "Not specifically provided. Generate questions for a general role matching the candidate's background."}`;

  try {
    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an experienced hiring manager. Follow the requested markdown structure exactly and never return empty list items.",
        },
        {
          role: "user",
          content: enhancedPrompt,
        },
      ],
      temperature: 0.35,
      max_tokens: 2000,
    });

    const responseText = response.choices[0]?.message?.content || "";

    if (!responseText.trim()) {
      throw new Error("Empty response from Groq API");
    }

    console.log(`Successfully generated mock interview questions for resume of ${resumeText.length} characters`);

    res.status(200).json({
      questions: responseText.trim(),
      metadata: {
        resumeLength: resumeText.length,
        generationTimestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Mock interview generation error:", err);

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
