import { useState, useEffect } from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';

// Function to format interview questions with proper spacing and styling
const legacyFormatInterviewQuestions = (text) => {
  if (!text) return '';
  
  // Split the text into sections based on the section headers
  const sections = [];
  
  // Use regex to find all section headers and split the content
  const sectionMatches = text.split(/\*\*([^*]+)\*\*/);
  
  // Process the split results
  for (let i = 1; i < sectionMatches.length; i += 2) {
    const sectionTitle = sectionMatches[i];
    const sectionContent = sectionMatches[i + 1] || '';
    
    sections.push({
      title: sectionTitle,
      content: sectionContent
    });
  }
  
  // Process each section
  let processedHtml = '';
  
  sections.forEach((section, index) => {
    if (section.title) {
      // Add section header
      processedHtml += `<div style="margin:${index === 0 ? '0' : '32px'} 0 20px;padding-bottom:10px;border-bottom:2px solid #4f46e5;background-color:#f5f3ff;padding:12px;border-radius:8px;">
        <h3 style="color:#4f46e5;font-size:clamp(16px, 5vw, 20px);margin:0;font-weight:700;display:flex;align-items:center;flex-wrap:wrap;">
          <span style="display:inline-block;width:6px;height:24px;background-color:#4f46e5;margin-right:10px;border-radius:3px;"></span>
          ${section.title}
        </h3>
      </div>`;
    }
    
    // Process content if there is any
    if (section.content) {
      // Handle bullet points
      let content = section.content.replace(/• ([^•\n]+)/g, 
        '<div style="display:flex;margin:12px 0;align-items:flex-start;padding:8px 0;">' +
          '<div style="color:#4f46e5;margin-right:10px;font-size:clamp(16px, 4vw, 18px);">•</div>' +
          '<div style="flex:1;color:#4b5563;font-size:clamp(14px, 4vw, 16px);">$1</div>' +
        '</div>'
      );
      
      // Handle numbered questions
      const questionRegex = /(\d+)\.\s+([^\n]+)/g;
      let questionMatch;
      let lastQuestionIndex = 0;
      let processedContent = '';
      
      // Create a short section name for the badge
      let shortSectionName = '';
      if (section.title) {
        // Handle special cases for section names
        if (section.title.includes('TECHNICAL')) {
          shortSectionName = 'TECH';
        } else if (section.title.includes('EXPERIENCE')) {
          shortSectionName = 'EXP';
        } else if (section.title.includes('BEHAVIORAL')) {
          shortSectionName = 'BEHAV';
        } else if (section.title.includes('SITUATIONAL')) {
          shortSectionName = 'SCENARIO';
        } else if (section.title.includes('CAREER')) {
          shortSectionName = 'CAREER';
        } else if (section.title.includes('COMPANY') || section.title.includes('INDUSTRY')) {
          shortSectionName = 'INDUSTRY';
        } else if (section.title.includes('CLOSING')) {
          shortSectionName = 'CLOSING';
        } else {
          // Default to first word if no special case
          shortSectionName = section.title.split(' ')[0];
        }
      }
      
      while ((questionMatch = questionRegex.exec(content)) !== null) {
        // Add text before this question
        processedContent += content.substring(lastQuestionIndex, questionMatch.index);
        
        // Extract question number and text
        const number = questionMatch[1];
        const questionText = questionMatch[2];
        
        // Create a styled question with section badge
        // Choose a different color for each section type
        let badgeColor, badgeBg;
        if (shortSectionName === 'TECH') {
          badgeColor = '#1e40af';
          badgeBg = '#dbeafe';
        } else if (shortSectionName === 'EXP') {
          badgeColor = '#065f46';
          badgeBg = '#d1fae5';
        } else if (shortSectionName === 'BEHAV') {
          badgeColor = '#9333ea';
          badgeBg = '#f3e8ff';
        } else if (shortSectionName === 'SCENARIO') {
          badgeColor = '#b45309';
          badgeBg = '#fef3c7';
        } else if (shortSectionName === 'CAREER') {
          badgeColor = '#be123c';
          badgeBg = '#fee2e2';
        } else if (shortSectionName === 'INDUSTRY') {
          badgeColor = '#0369a1';
          badgeBg = '#e0f2fe';
        } else if (shortSectionName === 'CLOSING') {
          badgeColor = '#4f46e5';
          badgeBg = '#e0e7ff';
        } else {
          badgeColor = '#4338ca';
          badgeBg = '#e0e7ff';
        }
        
        processedContent += `<div style="display:flex;margin:20px 0;align-items:flex-start;background-color:#f8fafc;padding:12px;border-radius:8px;border-left:3px solid ${badgeColor};">
          <div style="margin-right:12px;min-width:28px;text-align:center;">
            <div style="color:${badgeColor};font-weight:700;font-size:clamp(14px, 4vw, 16px);">${number}.</div>
          </div>
          <div style="flex:1;font-size:clamp(14px, 4vw, 16px);">${questionText}</div>
        </div>`;
        
        lastQuestionIndex = questionMatch.index + questionMatch[0].length;
      }
      
      // Add any remaining content
      if (lastQuestionIndex < content.length) {
        processedContent += content.substring(lastQuestionIndex);
      }
      
      // If we processed questions, use the processed content
      if (processedContent) {
        content = processedContent;
      }
      
      // Add paragraph spacing
      content = content.replace(/\n\n/g, '<div style="height:16px"></div>');
      
      processedHtml += content;
    }
  });
  
  return processedHtml;
};

const escapeHtml = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const normalizeLine = (line) => line
  .replace(/^#{1,4}\s*/, '')
  .replace(/^\*\*(.+)\*\*$/, '$1')
  .trim();

const isSectionHeading = (line) => /^#{2}\s+/.test(line) || /^\*\*[A-Z0-9 /&():-]+\*\*$/.test(line);

const formatInline = (text) => escapeHtml(text)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\*([^*]+)\*/g, '<em>$1</em>');

const flushList = (items) => {
  if (!items.length) return '';

  return `<ul class="interview-list">${items
    .map((item) => `<li>${formatInline(item)}</li>`)
    .join('')}</ul>`;
};

const formatInterviewQuestions = (text) => {
  if (!text) return '';

  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let processedHtml = '';
  let listItems = [];
  let sectionIndex = 0;

  lines.forEach((line) => {
    if (isSectionHeading(line)) {
      processedHtml += flushList(listItems);
      listItems = [];

      if (sectionIndex > 0) {
        processedHtml += '</div></section>';
      }

      const title = normalizeLine(line);
      const number = String(sectionIndex + 1).padStart(2, '0');

      processedHtml += `<section class="interview-section-modern">
        <div class="interview-section-number">${number}</div>
        <div class="interview-section-body">
          <h3>${formatInline(title)}</h3>`;

      sectionIndex += 1;
      return;
    }

    if (/^[-*•]\s+/.test(line)) {
      listItems.push(line.replace(/^[-*•]\s+/, '').trim());
      return;
    }

    if (/^\d+\.\s+/.test(line)) {
      listItems.push(line.replace(/^\d+\.\s+/, '').trim());
      return;
    }

    processedHtml += flushList(listItems);
    listItems = [];

    if (!processedHtml.includes('class="interview-section-modern"')) {
      processedHtml += `<section class="interview-section-modern">
        <div class="interview-section-number">01</div>
        <div class="interview-section-body">`;
      sectionIndex = 1;
    }

    processedHtml += `<p>${formatInline(line)}</p>`;
  });

  processedHtml += flushList(listItems);

  if (sectionIndex > 0) {
    processedHtml += '</div></section>';
  }

  return processedHtml;
};

export default function MockInterviewGenerator({ 
  resumeText, 
  jobDescription, 
  setJobDescription, 
  interviewQuestions, 
  setInterviewQuestions 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const generateMockInterview = async () => {
    if (!resumeText) {
      setError('Please upload your resume first.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-mock-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          resumeText, 
          jobDescription 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate mock interview questions');
      }

      setInterviewQuestions(data.questions);
    } catch (err) {
      console.error('Error generating mock interview:', err);
      setError(err.message || 'Failed to generate mock interview questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.26)',
        borderRadius: '0',
        boxShadow: 'none',
        border: '1px solid #d8d2c8',
        padding: isMobile ? '16px' : '24px',
        marginBottom: '32px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexDirection: isMobile ? 'column' : 'row',
          textAlign: isMobile ? 'center' : 'left',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '8px',
            background: '#ebe6dd',
            borderRadius: '50%'
          }}>
            <MessageSquare size={20} color="#1b1b1b" />
          </div>
          <h2 style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '400',
            color: '#111111',
            margin: 0
          }}>
            Mock Interview Generator
          </h2>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ 
            color: '#5f5a52', 
            marginBottom: '16px',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            Generate realistic interview questions based on your resume and the job description you're applying for.
          </p>
          
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#4d4a45',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            Job Description (optional)
          </label>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <textarea
              placeholder="Paste the job description here to get more targeted interview questions..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '10px' : '12px',
                borderRadius: '0',
                border: '1px solid #d8d2c8',
                backgroundColor: 'rgba(255, 255, 255, 0.42)',
                minHeight: isMobile ? '100px' : '120px',
                fontFamily: 'inherit',
                resize: 'vertical',
                fontSize: isMobile ? '14px' : '16px',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
          </div>
          
          <button
            onClick={generateMockInterview}
            disabled={loading || !resumeText}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: isMobile ? '10px 16px' : '10px 20px',
              background: loading ? '#9a948b' : '#1b1b1b',
              color: 'white',
              borderRadius: '5px',
              border: 'none',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              width: '100%',
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase'
            }}
            className="upload-button"
          >
            {loading ? (
              <>
                <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                Generating Questions, Please Wait...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Mock Interview
              </>
            )}
          </button>
          
          {error && (
            <p style={{ color: '#ef4444', marginTop: '8px', fontSize: '14px' }}>
              {error}
            </p>
          )}
        </div>

        {interviewQuestions && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              color: '#111111',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              <Sparkles size={isMobile ? 14 : 16} color="#1b1b1b" />
              Interview Questions
            </h3>
            
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.42)',
              borderRadius: '0',
              padding: isMobile ? '16px' : '24px',
              boxShadow: 'none',
              border: '1px solid #d8d2c8'
            }}>
              <div 
                className="interview-questions-content"
                style={{
                  color: '#1b1b1b',
                  lineHeight: '1.6',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: isMobile ? '14px' : '15px',
                  margin: 0,
                  overflowX: 'auto',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: formatInterviewQuestions(interviewQuestions)
                }}
              />
              <style>{`
                .interview-questions-content {
                  color: #1b1b1b;
                }

                .interview-section-modern {
                  display: grid;
                  grid-template-columns: 48px minmax(0, 1fr);
                  border-top: 1px solid #d8d2c8;
                  min-height: 118px;
                }

                .interview-section-modern:last-child {
                  border-bottom: 1px solid #d8d2c8;
                }

                .interview-section-number {
                  color: #183b5b;
                  font-size: 11px;
                  letter-spacing: 0.18em;
                  font-weight: 800;
                  padding-top: 28px;
                  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                }

                .interview-section-body {
                  border-left: 1px solid #d8d2c8;
                  padding: 24px 0 24px 32px;
                }

                .interview-section-body h3 {
                  color: #111111;
                  font-size: clamp(20px, 3vw, 28px);
                  line-height: 1.15;
                  font-weight: 400;
                  letter-spacing: -0.03em;
                  margin: 0 0 18px;
                }

                .interview-section-body p {
                  color: #4d4a45;
                  font-size: clamp(14px, 2vw, 16px);
                  line-height: 1.75;
                  margin: 0 0 14px;
                }

                .interview-section-body strong {
                  color: #111111;
                  font-weight: 650;
                }

                .interview-section-body em {
                  font-family: Georgia, "Times New Roman", serif;
                  color: #5f5a52;
                }

                .interview-list {
                  list-style: none;
                  padding: 0;
                  margin: 0;
                }

                .interview-list li {
                  position: relative;
                  color: #4d4a45;
                  font-size: clamp(14px, 2vw, 16px);
                  line-height: 1.7;
                  padding: 0 0 16px 22px;
                  margin: 0 0 16px;
                  border-bottom: 1px solid rgba(216, 210, 200, 0.7);
                }

                .interview-list li:last-child {
                  margin-bottom: 0;
                  border-bottom: none;
                }

                .interview-list li::before {
                  content: "";
                  position: absolute;
                  left: 0;
                  top: 0.72em;
                  width: 5px;
                  height: 5px;
                  background: #1b1b1b;
                  border-radius: 50%;
                }

                @media (max-width: 768px) {
                  .interview-section-modern {
                    grid-template-columns: 34px minmax(0, 1fr);
                  }

                  .interview-section-body {
                    padding-left: 18px;
                  }
                }
              `}</style>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
