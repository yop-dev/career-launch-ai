import OpenAI from "openai";
import { GROQ_MODEL } from "../../lib/groq";

// Initialize the OpenAI client with Groq's base URL
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { resumeText, jobDescription } = req.body;
  if (!resumeText || typeof resumeText !== 'string') {
    return res.status(400).json({ error: 'Invalid resume text.' });
  }

  // Default job description if not provided
  const jobDesc = jobDescription || "a position related to your skills and experience";

  // Enhanced prompt for generating mock interview questions
  const enhancedPrompt = `You are an experienced hiring manager conducting a job interview. Generate a comprehensive set of interview questions based on the candidate's resume and the job description provided. The questions should help assess the candidate's fit for ${jobDesc}.

Please structure your response with the following sections:

**TECHNICAL SKILLS ASSESSMENT**
• 3-5 questions that assess the candidate's technical skills mentioned in their resume
• Include questions that verify their proficiency level
• Ask for specific examples of how they've applied these skills

**EXPERIENCE DEEP DIVE**
• 3-5 questions about their work experience
• Focus on achievements mentioned in their resume
• Ask for details about projects, challenges, and solutions

**BEHAVIORAL QUESTIONS**
• 3-5 behavioral questions relevant to the position
• Include questions about teamwork, problem-solving, and adaptability
• Tailor these to the job requirements

**SITUATIONAL SCENARIOS**
• 2-3 hypothetical scenarios they might encounter in this role
• Ask how they would approach these situations
• Make these relevant to the job description

**CAREER MOTIVATION**
• 2-3 questions about their career goals and motivation
• Ask why they're interested in this position
• Explore how this role fits into their career path

**COMPANY/INDUSTRY KNOWLEDGE**
• 2-3 questions to assess their knowledge of the industry or company
• Include questions about trends, challenges, or recent developments

**CLOSING QUESTIONS**
• 1-2 questions to give the candidate an opportunity to ask questions or add information
• Include a question about any concerns they might have about their fit for the role

For each question, provide a brief explanation of what you're looking to assess with that question and what would constitute a strong answer.

---

Resume:
${resumeText}

Job Description:
${jobDescription || "Not specifically provided. Generate questions for a general role matching the candidate's background."}

Please generate thoughtful, specific interview questions that will help assess this candidate's qualifications, experience, and fit for the role. Avoid generic questions that could be asked of any candidate.`;

  try {
    // Using Groq API with LLaMA-3-8B model
    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an experienced hiring manager with expertise in conducting effective job interviews."
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Extract the generated text
    let responseText = response.choices[0]?.message?.content || '';

    // Validate response
    if (!responseText.trim()) {
      throw new Error('Empty response from Groq API');
    }

    // Format the response
    const formattedResponse = responseText.trim();

    // Log successful generation
    console.log(`Successfully generated mock interview questions for resume of ${resumeText.length} characters`);

    res.status(200).json({ 
      questions: formattedResponse,
      metadata: {
        resumeLength: resumeText.length,
        generationTimestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('Mock interview generation error:', err);
    
    // Provide more helpful error messages
    let errorMessage = 'Internal server error';
    if (err.message.includes('Groq')) {
      errorMessage = 'AI service temporarily unavailable. Please try again.';
    } else if (err.message.includes('fetch') || err.message.includes('network')) {
      errorMessage = 'Unable to connect to AI service. Please try again later.';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
