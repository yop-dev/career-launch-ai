# CareerLaunch AI

A comprehensive career toolkit powered by AI that helps job seekers improve their application materials and prepare for interviews. Upload your resume to get detailed feedback, create personalized cover letters, and generate tailored mock interview questions.

## Features

- **Resume Analysis**: Upload your PDF resume and receive detailed AI-powered feedback on strengths, weaknesses, and areas for improvement
- **Cover Letter Generator**: Create customized cover letters tailored to specific job descriptions that highlight your relevant skills and experience
- **Mock Interview Preparation**: Generate realistic interview questions based on your resume and target job to help you practice
- **Responsive Design**: Fully optimized for both desktop and mobile devices with touch-friendly controls
- **PDF Processing**: Extracts and allows editing of resume text from uploaded PDFs
- **Export Options**: Download generated cover letters as PDF or text files
- **Interactive UI**: Modern, intuitive interface with helpful tooltips and information
- **Real-time Updates**: Make changes to your resume and get updated feedback instantly

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Groq API Key](https://console.groq.com/keys) for accessing LLaMA-3-8B model
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)

### Key Dependencies

- [Next.js](https://nextjs.org/) - React framework for building the web application
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) - PDF text extraction for resume uploads
- [jsPDF](https://www.npmjs.com/package/jspdf) - PDF generation for cover letter downloads
- [lucide-react](https://lucide.dev/) - Modern icon set for the user interface
- [openai](https://www.npmjs.com/package/openai) - API client for connecting to Groq's LLaMA-3-8B model
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework for responsive design

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/yop-dev/career-launch-ai.git
   cd career-launch-ai
   ```

2. **Install dependencies:**

   ```sh
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**

   Copy the `.env.local.example` file to `.env.local` and add your Groq API key:
   ```
   cp .env.local.example .env.local
   ```
   
   Then edit the `.env.local` file and replace `your_groq_api_key_here` with your actual Groq API key.
   
   **IMPORTANT:** Never commit your `.env.local` file to version control. It's already in `.gitignore` to prevent accidental exposure of your API key.

4. **Run the development server:**

   ```sh
   npm run dev
   # or
   yarn dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

### Deployment on Vercel

1. **Fork or clone this repository to your GitHub account**

2. **Sign up for a [Vercel](https://vercel.com) account**

3. **Create a new project in Vercel and import your GitHub repository**

4. **Add environment variables:**
   - In your Vercel project settings, go to "Environment Variables"
   - Add a new variable with name `GROQ_API_KEY` and your Groq API key as the value
   - Make sure to add this to all environments (Production, Preview, and Development)
   
   > **Note:** Groq offers free access to the LLaMA-3-8B model.
   
   > **IMPORTANT:** Never commit API keys to your repository. Always use environment variables.

5. **Deploy the application**
   - Vercel will automatically build and deploy your application
   - You'll receive a URL for your deployed application

## Project Structure

- `pages/` - Next.js API routes and page components
  - `index.js` - Main application page with tabs for all three tools
  - `api/` - Backend API endpoints
    - `upload.js` - PDF text extraction
    - `analyze.js` - Resume analysis
    - `formatResumeFeedback.js` - Formats the AI feedback into structured HTML
    - `generate-cover-letter.js` - Cover letter generation
    - `generate-mock-interview.js` - Mock interview questions generation
    - `mock-interview.js` - Processes mock interview responses
- `components/` - Reusable React components
  - `ResumePanel.js` - Resume text display and analysis with re-analyze functionality
  - `CoverLetterGenerator.js` - Cover letter generation with PDF/text download capability
  - `MockInterviewGenerator.js` - Mock interview questions generator
- `styles/` - CSS styles
  - `global.css` - Global styles, animations, and responsive design utilities
  - `feedback.css` - Specific styles for the resume feedback display

## API Endpoints

- `POST /api/upload`  
  Accepts a base64 PDF, extracts text using `pdf-parse`.

- `POST /api/analyze`  
  Sends resume text to Groq's LLaMA-3-8B model for analysis and returns formatted feedback.

- `POST /api/generate-cover-letter`  
  Generates a personalized cover letter based on the resume and job description.

- `POST /api/generate-mock-interview`  
  Creates tailored interview questions based on resume content and optional job description.

## Customization

- **Prompts**: Modify the AI prompts in the API files to customize the style and content of:
  - Resume feedback in `pages/api/analyze.js`
  - Cover letter generation in `pages/api/generate-cover-letter.js`
  - Mock interview questions in `pages/api/generate-mock-interview.js`
- **UI Components**: Adjust the user interface in:
  - `components/ResumePanel.js` - Resume analysis panel
  - `components/CoverLetterGenerator.js` - Cover letter tool
  - `components/MockInterviewGenerator.js` - Interview preparation tool
  - `pages/index.js` - Main layout and navigation
- **Styling**: Customize the appearance using:
  - `styles/global.css` - Overall application styling
  - `styles/feedback.css` - Resume feedback formatting
- **Export Options**: Modify the PDF generation in the `downloadAsPdf` function in `components/CoverLetterGenerator.js`
- **Info Modal**: Update the content in the info modal in `pages/index.js` to provide custom guidance

## Key Features in Detail

### Resume Analysis
- Comprehensive feedback on resume structure, content, and formatting
- Identification of strengths and weaknesses
- Detection of potential red flags that might concern employers
- Specific recommendations for improvement
- Re-analyze functionality to get updated feedback after making changes

### Cover Letter Generator
- Creates personalized cover letters tailored to specific job descriptions
- Highlights relevant skills and experience from your resume
- Multiple export options (PDF, text)
- Clean, professional formatting ready for submission

### Mock Interview Preparation
- Generates realistic interview questions based on your resume content
- Customizes questions to match specific job descriptions
- Includes technical, behavioral, and situational questions
- Organizes questions by category for focused practice

### User Experience
- Intuitive tabbed interface for easy navigation between tools
- Responsive design that works on all devices from mobile to desktop
- Helpful information modal explaining how to use each feature
- Touch-friendly controls optimized for mobile devices

## Creator

This project was created by [Joner De Silva](https://www.linkedin.com/in/joner-de-silva-861575203/).

## Connect

- [LinkedIn](https://www.linkedin.com/in/joner-de-silva-861575203/)
- [GitHub](https://github.com/yop-dev)
- [Portfolio](https://portfolio-theta-two-19.vercel.app)

## License

MIT

---

**Powered by [Groq](https://groq.com/) and Llama 3.1 8B Instant.**
