import React, { useEffect, useState } from "react";
import { FileText, BarChart3, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";

export default function ResumePanel({
  resumeText,
  setResumeText,
  onAnalyze,
  loading,
  feedback,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const feedbackRef = React.useRef(null);

  // Function to handle re-analyze with scroll
  const handleReAnalyze = () => {
    onAnalyze();
    // Set a small timeout to ensure the feedback is rendered before scrolling
    setTimeout(() => {
      if (feedbackRef.current) {
        feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.26)',
      borderRadius: '0',
      boxShadow: 'none',
      padding: isMobile ? '16px' : '24px',
      marginBottom: '24px',
      border: '1px solid #d8d2c8',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        borderBottom: '1px solid #d8d2c8',
        paddingBottom: '16px',
        flexDirection: isMobile ? 'column' : 'row',
        textAlign: isMobile ? 'center' : 'left'
      }}>
        <div style={{
          backgroundColor: '#ebe6dd',
          borderRadius: '50%',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: isMobile ? '8px' : '0'
        }}>
          <FileText size={22} color="#1b1b1b" />
        </div>
        <div>
          <h2 style={{
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: '400',
            color: '#111111',
            margin: 0
          }}>
            Resume Editor
          </h2>
          <p style={{
            fontSize: isMobile ? '13px' : '14px',
            color: '#5f5a52',
            margin: 0
          }}>
            Review and edit your resume text before analysis
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          marginBottom: '8px', 
          display: 'flex', 
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '4px' : '0'
        }}>
          <label style={{ 
            fontSize: isMobile ? '13px' : '14px', 
            fontWeight: '500', 
            color: '#4d4a45' 
          }}>
            Resume Content
          </label>
          <span style={{ 
            fontSize: '12px', 
            color: '#6e6a63',
            textAlign: isMobile ? 'left' : 'right'
          }}>
            {resumeText.length} characters
          </span>
        </div>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          style={{
            width: '100%',
            minHeight: isMobile ? '180px' : '240px',
            maxHeight: isMobile ? '300px' : '400px',
            padding: isMobile ? '12px' : '16px',
            borderRadius: '0',
            border: '1px solid #d8d2c8',
            backgroundColor: 'rgba(255, 255, 255, 0.42)',
            fontSize: isMobile ? '14px' : '15px',
            lineHeight: '1.6',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            resize: 'vertical',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            outline: 'none',
            boxSizing: 'border-box',
            overflowY: 'auto',
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#1b1b1b';
            e.target.style.boxShadow = 'none';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d8d2c8';
            e.target.style.boxShadow = 'none';
          }}
          placeholder="Your resume text appears here. Feel free to make any edits before analysis."
        />
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <div style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            backgroundColor: resumeText.length < 100 ? '#fff1f2' : '#f0fdf4',
            padding: '8px 12px',
            borderRadius: '0',
            border: '1px solid #d8d2c8',
            marginBottom: isMobile ? '12px' : '16px',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            {resumeText.length < 100 ? (
              <AlertTriangle size={16} color="#8b1e1e" />
            ) : (
              <CheckCircle size={16} color="#1b1b1b" />
            )}
            <span style={{ 
              fontSize: isMobile ? '12px' : '13px', 
              color: resumeText.length < 100 ? '#8b1e1e' : '#1b1b1b'
            }}>
              {resumeText.length < 100 
                ? 'Resume text is too short for effective analysis' 
                : 'Resume text is ready for analysis'}
            </span>
          </div>
        </div>
        <button
          onClick={onAnalyze}
          disabled={loading || resumeText.length < 100}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: loading || resumeText.length < 100 ? '#9a948b' : '#1b1b1b',
            backgroundImage: 'none',
            color: 'white',
            fontWeight: '800',
            padding: isMobile ? '12px 16px' : '15px 22px',
            borderRadius: '5px',
            border: 'none',
            cursor: loading || resumeText.length < 100 ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: 'none',
            width: isMobile ? '100%' : 'auto',
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase'
          }}
          onMouseOver={(e) => {
            if (!loading && resumeText.length >= 100) {
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Analyzing...
            </>
          ) : (
            <>
              <BarChart3 size={isMobile ? 16 : 18} />
              Analyze Resume
            </>
          )}
        </button>
      </div>

      {/* Feedback Section */}
      {feedback && (
        <div style={{ 
          marginTop: '32px',
          backgroundColor: 'rgba(255, 255, 255, 0.26)',
          borderRadius: '0',
          boxShadow: 'none',
          padding: isMobile ? '16px' : '24px',
          border: '1px solid #d8d2c8'
        }} ref={feedbackRef}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            flexDirection: isMobile ? 'column' : 'row',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <div style={{
              backgroundColor: '#ebe6dd',
              borderRadius: '50%',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: isMobile ? '8px' : '0'
            }}>
              <Sparkles size={22} color="#1b1b1b" />
            </div>
            <div>
              <h2 style={{
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: '400',
                color: '#111111',
                margin: 0
              }}>
                AI Feedback & Analysis
              </h2>
              <p style={{
                fontSize: isMobile ? '13px' : '14px',
                color: '#5f5a52',
                margin: 0
              }}>
                Expert recommendations to improve your resume
              </p>
            </div>
          </div>
          
          <div 
            dangerouslySetInnerHTML={{ __html: feedback }}
            style={{
              overflowX: 'auto',
              maxWidth: '100%',
              boxSizing: 'border-box',
              fontSize: isMobile ? '14px' : '15px',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}
            className="feedback-container"
          />
          <style>{`
            .feedback-container {
              color: #1b1b1b;
            }

            .feedback-section-modern {
              display: grid;
              grid-template-columns: 48px minmax(0, 1fr);
              border-top: 1px solid #d8d2c8;
              min-height: 118px;
            }

            .feedback-section-modern:last-child {
              border-bottom: 1px solid #d8d2c8;
            }

            .feedback-section-number {
              color: #183b5b;
              font-size: 11px;
              letter-spacing: 0.18em;
              font-weight: 800;
              padding-top: 28px;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            }

            .feedback-section-body {
              border-left: 1px solid #d8d2c8;
              padding: 24px 0 24px 32px;
            }

            .feedback-section-body h3 {
              color: #111111;
              font-size: clamp(20px, 3vw, 28px);
              line-height: 1.15;
              font-weight: 400;
              letter-spacing: -0.03em;
              margin: 0 0 18px;
            }

            .feedback-section-body p {
              color: #4d4a45;
              font-size: clamp(14px, 2vw, 16px);
              line-height: 1.75;
              margin: 0 0 14px;
            }

            .feedback-section-body strong {
              color: #111111;
              font-weight: 650;
            }

            .feedback-section-body em {
              font-family: Georgia, "Times New Roman", serif;
              color: #5f5a52;
            }

            .feedback-list {
              list-style: none;
              padding: 0;
              margin: 0;
            }

            .feedback-list li {
              position: relative;
              color: #4d4a45;
              font-size: clamp(14px, 2vw, 16px);
              line-height: 1.7;
              padding: 0 0 16px 22px;
              margin: 0 0 16px;
              border-bottom: 1px solid rgba(216, 210, 200, 0.7);
            }

            .feedback-list li:last-child {
              margin-bottom: 0;
              border-bottom: none;
            }

            .feedback-list li::before {
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
              .feedback-section-modern {
                grid-template-columns: 34px minmax(0, 1fr);
              }

              .feedback-section-body {
                padding-left: 18px;
              }
            }
          `}</style>
            
            {/* Re-analyze button */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.28)',
              borderRadius: '0',
              border: '1px solid #d8d2c8',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: isMobile ? '13px' : '14px',
                color: '#4d4a45',
                textAlign: 'center',
                margin: '0 0 12px 0',
                fontWeight: '500'
              }}>
                Made changes to your resume? Click below to get updated feedback.
              </p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'center'
              }}>
              <button
                onClick={handleReAnalyze}
                disabled={loading || resumeText.length < 100}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: loading ? '#9a948b' : '#1b1b1b',
                  color: 'white',
                  fontWeight: '800',
                  padding: isMobile ? '12px 16px' : '15px 22px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: 'none',
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#111111';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#1b1b1b';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span>Re-analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                      <path d="M21 3v5h-5"></path>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                      <path d="M8 16H3v5"></path>
                    </svg>
                    <span>Re-analyze Resume</span>
                  </>
                )}
              </button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}
