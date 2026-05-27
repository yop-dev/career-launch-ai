import OpenAI from "openai";
import { GROQ_MODEL } from "../../lib/groq";

// Initialize the OpenAI client with Groq's base URL
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { resumeText, jobDescription, mode, userAnswer, currentQuestion } = req.body;
  
  // Validate inputs based on mode
  if (mode === 'generate' && (!resumeText || typeof resumeText !== 'string')) {
    return res.status(400).json({ error: 'Invalid resume text.' });
  }
  
  if (mode === 'evaluate' && (!userAnswer || !currentQuestion)) {
    return res.status(400).json({ error: 'Missing answer or question for evaluation.' });
  }

  try {
    // Different handling based on mode
    if (mode === 'generate') {
      return await generateQuestions(req, res, resumeText, jobDescription);
    } else if (mode === 'evaluate') {
      return await evaluateAnswer(req, res, userAnswer, currentQuestion, resumeText, jobDescription);
    } else {
      return res.status(400).json({ error: 'Invalid mode.' });
    }
  } catch (err) {
    console.error('Mock interview error:', err);
    
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

// Function to generate interview questions
async function generateQuestions(req, res, resumeText, jobDescription) {
  // Default job description if not provided
  const jobDesc = jobDescription || "a position related to your skills and experience";

  // Enhanced prompt for generating mock interview questions
  const enhancedPrompt = `You are an experienced hiring manager conducting a job interview. Generate a set of 5 thoughtful interview questions based on the candidate's resume and the job description provided. The questions should help assess the candidate's fit for ${jobDesc}.

Please include a mix of:
1. Technical skills assessment
2. Experience-related questions
3. Behavioral questions
4. Situational scenarios
5. Career motivation questions

Format each question as a numbered list (1-5). Make each question specific to the candidate's background and the job requirements. Avoid generic questions that could be asked of any candidate.

Resume:
${resumeText}

Job Description:
${jobDescription || "Not specifically provided. Generate questions for a general role matching the candidate's background."}`;

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
    max_tokens: 1000,
  });

  // Extract the generated text
  let responseText = response.choices[0]?.message?.content || '';

  // Validate response
  if (!responseText.trim()) {
    throw new Error('Empty response from Groq API');
  }

  // Parse the questions into an array
  const questions = responseText
    .split(/\d+\./)
    .filter(q => q.trim().length > 0)
    .map(q => q.trim());

  // Log successful generation
  console.log(`Successfully generated ${questions.length} mock interview questions`);

  res.status(200).json({ 
    questions,
    metadata: {
      resumeLength: resumeText.length,
      generationTimestamp: new Date().toISOString()
    }
  });
}

// Function to evaluate user's answer
async function evaluateAnswer(req, res, userAnswer, currentQuestion, resumeText, jobDescription) {
  // Enhanced prompt for evaluating the answer
  const enhancedPrompt = `You are an experienced hiring manager evaluating a candidate's interview response. 
  
Question asked: "${currentQuestion}"

Candidate's answer: "${userAnswer}"

Resume context:
${resumeText || "Not provided"}

Job description context:
${jobDescription || "Not specifically provided"}

Please evaluate the candidate's answer on the following criteria:
1. Relevance to the question
2. Specificity and detail
3. Structure and clarity
4. Evidence of skills/experience
5. Overall impression

Provide a score out of 10 and specific feedback on what was good and what could be improved. Be constructive and helpful.`;

  // Using Groq API with LLaMA-3-8B model
  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content: "You are an experienced hiring manager with expertise in evaluating interview responses."
      },
      {
        role: "user",
        content: enhancedPrompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  // Extract the generated text
  let responseText = response.choices[0]?.message?.content || '';

  // Validate response
  if (!responseText.trim()) {
    throw new Error('Empty response from Groq API');
  }

  // Extract score if present (pattern: score: X/10 or Score: X/10)
  const scoreMatch = responseText.match(/score:\s*(\d+)\/10/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

  res.status(200).json({ 
    feedback: responseText,
    score,
    metadata: {
      evaluationTimestamp: new Date().toISOString()
    }
  });
}
