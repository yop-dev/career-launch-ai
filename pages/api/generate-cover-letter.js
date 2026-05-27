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
  if (!resumeText || !jobDescription || typeof resumeText !== 'string' || typeof jobDescription !== 'string') {
    return res.status(400).json({ error: 'Invalid resume text or job description.' });
  }

  // Enhanced prompt for personalized cover letter generation
  // Add a small random element to ensure variation when regenerating
  const variation = Math.floor(Math.random() * 5);
  const styleVariations = [
    "professional and formal",
    "confident and impactful",
    "enthusiastic and engaging",
    "concise and direct",
    "detailed and comprehensive"
  ];
  
  const enhancedPrompt = `You are a professional career advisor with expertise in creating personalized cover letters. 
Create a compelling cover letter in a ${styleVariations[variation]} style based on the candidate's resume and the job description provided.

First, analyze the resume to extract:
1. The candidate's name, contact information, and current role
2. Key skills and qualifications that match the job requirements
3. Relevant work experiences and achievements
4. Educational background and certifications
5. Any unique selling points or standout accomplishments

Then, analyze the job description to identify:
1. The specific role title and company name (if available)
2. Key requirements and qualifications sought
3. Company values or culture indicators
4. Specific technologies, tools, or methodologies mentioned

IMPORTANT FORMATTING INSTRUCTIONS:
- Start directly with the cover letter content - DO NOT include any introductory text like "Here is a cover letter..."
- DO NOT include any explanatory text at the end like "This cover letter is tailored..."
- Use proper paragraph spacing with blank lines between paragraphs
- Format the letter professionally with proper sections
- End with an appropriate signature line (like "Sincerely," followed by the candidate's name)
- Ensure proper spacing throughout the document

The cover letter should:
1. Be professionally formatted with proper sections (greeting, introduction, body paragraphs, conclusion, signature)
2. Use the candidate's actual name and contact details from the resume
3. Directly reference 3-5 specific skills/experiences from the resume that align with key job requirements
4. Include at least one quantifiable achievement from the resume that demonstrates value
5. Show enthusiasm for the specific role and company
6. Be concise (around 300-400 words)
7. Include a call to action in the closing paragraph
8. Use professional but engaging language
9. Address specific requirements mentioned in the job description

Resume:
${resumeText}

Job Description:
${jobDescription}

Remember: Provide ONLY the cover letter content with no explanatory text before or after.`;

  try {
    // Using Groq API with LLaMA-3-8B model
    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a professional career advisor with expertise in creating personalized cover letters."
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
    
    // Clean up the response by removing any introductory or concluding meta-text
    responseText = responseText
      .replace(/^(Here is a|I've created a|This is a|Below is a|Please find a).*?(cover letter|draft).*?\n+/i, '')
      .replace(/\n+This cover letter is tailored.*$/i, '')
      .replace(/\n+The cover letter is tailored.*$/i, '')
      .replace(/\n+This letter highlights.*$/i, '')
      .replace(/\n+Feel free to.*$/i, '')
      .trim();

    // Log successful generation (optional, remove in production)
    console.log(`Successfully generated cover letter for job description of ${jobDescription.length} characters`);

    res.status(200).json({ 
      coverLetter: responseText.trim(),
      metadata: {
        resumeLength: resumeText.length,
        jobDescriptionLength: jobDescription.length,
        generationTimestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('Cover letter generation error:', err);
    
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
