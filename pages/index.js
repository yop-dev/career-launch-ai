import { useState, useEffect } from "react";
import Head from "next/head";
import { Upload, FileText, Sparkles, BarChart3, FileEdit, ClipboardCheck, Linkedin, Github, Globe, MessageSquare, BarChart, Loader2, HelpCircle, X, Info } from "lucide-react";
import ResumePanel from "../components/ResumePanel";
import CoverLetterGenerator from "../components/CoverLetterGenerator";
import MockInterviewGenerator from "../components/MockInterviewGenerator";

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false); // New state for upload loading
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // State for CoverLetterGenerator
  const [coverLetterJobDescription, setCoverLetterJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  
  // State for MockInterviewGenerator
  const [mockInterviewJobDescription, setMockInterviewJobDescription] = useState("");
  const [interviewQuestions, setInterviewQuestions] = useState("");
  
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
  const [activeTab, setActiveTab] = useState("resume-critique"); // "resume-critique", "cover-letter", or "mock-interview"

  const handleFileUpload = async (file) => {
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }
    
    setUploadLoading(true); // Start upload loading
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfBase64: base64 }),
        });
        if (!res.ok) throw new Error("Failed to extract text from PDF.");
        const data = await res.json();
        setResumeText(data.text);
        
        // Auto-scroll to the analyze button on mobile devices after a short delay
        setTimeout(() => {
          // Check if it's a mobile device (screen width less than 768px)
          if (window.innerWidth < 768) {
            // Create a function to scroll to the resume panel
            const scrollToResumePanel = () => {
              const resumePanel = document.querySelector('.resume-panel');
              if (resumePanel) {
                resumePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            };
            
            // Execute the scroll after a short delay to ensure the panel is rendered
            setTimeout(scrollToResumePanel, 500);
          }
        }, 300);
      } catch (err) {
        alert(err.message);
      } finally {
        setUploadLoading(false); // End upload loading
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const analyzeResume = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });
      if (!res.ok) throw new Error("Failed to analyze resume.");
      const data = await res.json();
      setFeedback(data.feedback);
    } catch (err) {
      setFeedback("Error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>CareerLaunch AI</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Smart Resume Review & Cover Letter Generator" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </Head>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        .pulse-animation {
          animation: pulse 2s ease-in-out 1s;
        }
        
        .upload-button:hover {
          background: #111111 !important;
          transform: translateY(-1px);
          box-shadow: none;
        }
        
        .upload-area {
          transition: all 0.3s ease;
        }
        
        .upload-area:hover {
          border-color: #1b1b1b;
          background-color: rgba(255, 255, 255, 0.42);
        }
        
        .upload-area.drag-over {
          border-color: #1b1b1b;
          background-color: rgba(255, 255, 255, 0.62);
        }

        .tab-button {
          transition: all 0.2s ease;
        }

        .tab-button:hover {
          background-color: rgba(27, 27, 27, 0.06);
        }

        .tab-button.active {
          background-color: rgba(27, 27, 27, 0.06);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .loading-overlay {
          animation: pulse 1.5s ease-in-out infinite;
        }

        @media (max-width: 768px) {
          .tab-container {
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .tab-container::-webkit-scrollbar {
            display: none;
          }
          
          .tab-button {
            flex-shrink: 0;
            white-space: nowrap;
          }
        }
      `}</style>
      
      <div style={{
        minHeight: '100vh',
        background: '#f3f0eb',
        padding: isMobile ? '12px 8px' : '16px',
        position: 'relative',
        overflowX: 'hidden',
        color: '#111111',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}>
        
        <div style={{
          maxWidth: '1024px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          paddingLeft: isMobile ? '8px' : '16px',
          paddingRight: isMobile ? '8px' : '16px'
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '52px',
            paddingTop: isMobile ? '36px' : '80px',
            position: 'relative'
          }}>
            {/* Info Button */}
            <button
              onClick={() => setShowInfoModal(true)}
              aria-label="About this website"
              className="pulse-animation"
              style={{
                position: 'absolute',
                top: isMobile ? '0' : '10px',
                right: isMobile ? '0' : '10px',
                backgroundColor: 'transparent',
                border: '1px solid #d8d2c8',
                borderRadius: '50%',
                width: isMobile ? '36px' : '42px',
                height: isMobile ? '36px' : '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                zIndex: 10
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e9e4dc';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <HelpCircle size={isMobile ? 18 : 20} color="#1b1b1b" />
            </button>
            
            <h1 style={{
              fontSize: isMobile ? '44px' : '64px',
              fontWeight: '400',
              color: '#070707',
              margin: '0 0 18px 0',
              fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              flexWrap: 'wrap'
            }}>
              <div className="logo-container" style={{ display: 'inline-flex' }}>
                <img 
                  src="/logo.png" 
                  alt="CareerLaunch AI Logo" 
                  className="transparent-logo"
                  style={{
                    height: isMobile ? '52px' : '72px',
                    width: 'auto',
                    verticalAlign: 'middle'
                  }}
                />
              </div>
              <span>CareerLaunch&nbsp;</span>
              <span style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                color: '#5f5a52',
                fontWeight: 400
              }}>AI</span>
            </h1>
            <p style={{
              color: '#4d4a45',
              fontSize: isMobile ? '18px' : '22px',
              maxWidth: '720px',
              margin: '0 auto',
              lineHeight: '1.45',
              fontWeight: 400
            }}>
              Upload your resume to get AI-powered feedback, personalized cover letters tailored to the job, and mock interview questions to help you practice and stand out.
            </p>
          </div>

          {/* Upload Section */}
          <div style={{ marginBottom: '32px' }}>
            <div
              className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
              style={{
                position: 'relative',
                border: '1px solid #d8d2c8',
                borderRadius: '0',
                padding: isMobile ? '28px 22px' : '42px',
                backgroundColor: 'rgba(255, 255, 255, 0.24)',
                opacity: uploadLoading ? 0.7 : 1,
                pointerEvents: uploadLoading ? 'none' : 'auto'
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {/* Loading Overlay */}
              {uploadLoading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '0',
                  zIndex: 10
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <Loader2 
                      size={32} 
                      color="#2563eb" 
                      style={{ 
                        animation: 'spin 1s linear infinite'
                      }} 
                    />
                    <div>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '400',
                        color: '#111111',
                        margin: '0 0 4px 0'
                      }}>
                        Processing Your Resume
                      </h3>
                      <p style={{
                        color: '#5f5a52',
                        margin: '0',
                        fontSize: '14px'
                      }}>
                        Please wait while we extract the text from your PDF...
                      </p>
                    </div>
                  </div>
                  <div className="loading-overlay" style={{
                    width: '200px',
                    height: '4px',
                    backgroundColor: '#ddd8cf',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: '#1b1b1b',
                      borderRadius: '2px',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}></div>
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    padding: '14px',
                    background: '#ebe6dd',
                    borderRadius: '50%'
                  }}>
                    <Upload size={42} color="#1b1b1b" />
                  </div>
                </div>
                <h3 style={{
                  fontSize: isMobile ? '22px' : '28px',
                  fontWeight: '400',
                  color: '#111111',
                  marginBottom: '8px'
                }}>
                  Upload Your Resume
                </h3>
                <p style={{
                  color: '#5f5a52',
                  marginBottom: '24px',
                  fontSize: '16px'
                }}>
                  Drag and drop your PDF file here, or click to browse
                </p>
                <label
                  className="upload-button"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: uploadLoading ? 'not-allowed' : 'pointer',
                    background: '#1b1b1b',
                    color: 'white',
                    padding: '15px 22px',
                    borderRadius: '5px',
                    boxShadow: 'none',
                    fontWeight: '800',
                    fontSize: '11px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    border: 'none',
                    transition: 'all 0.2s ease',
                    opacity: uploadLoading ? 0.6 : 1
                  }}
                >
                  <Upload size={20} />
                  Choose PDF File
                  <span style={{ fontSize: '22px', lineHeight: 0 }}>→</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    disabled={uploadLoading}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          {resumeText && (
            <div className="fade-in" style={{ marginBottom: '24px' }}>
              <div 
                className="tab-container"
                style={{
                  display: 'flex',
                  borderBottom: '1px solid #d8d2c8',
                  marginBottom: '24px',
                  backgroundColor: 'transparent',
                  borderRadius: 0,
                  padding: 0,
                  gap: 0,
                  overflowX: isMobile ? 'auto' : 'visible',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                <button
                  className={`tab-button ${activeTab === "resume-critique" ? 'active' : ''}`}
                  onClick={() => setActiveTab("resume-critique")}
                  style={{
                    padding: isMobile ? '14px 16px' : '16px 24px',
                    fontWeight: '800',
                    color: activeTab === "resume-critique" ? '#111111' : '#5f5a52',
                    borderBottom: activeTab === "resume-critique" ? '1px solid #111111' : '1px solid transparent',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '6px' : '8px',
                    fontSize: '11px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    borderRadius: '0',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content'
                  }}
                >
                  <BarChart3 size={isMobile ? 16 : 18} />
                  <span>{isMobile ? 'Critique' : 'Resume Critique'}</span>
                </button>
                <button
                  className={`tab-button ${activeTab === "cover-letter" ? 'active' : ''}`}
                  onClick={() => setActiveTab("cover-letter")}
                  style={{
                    padding: isMobile ? '14px 16px' : '16px 24px',
                    fontWeight: '800',
                    color: activeTab === "cover-letter" ? '#111111' : '#5f5a52',
                    borderBottom: activeTab === "cover-letter" ? '1px solid #111111' : '1px solid transparent',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '6px' : '8px',
                    fontSize: '11px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    borderRadius: '0',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content'
                  }}
                >
                  <FileEdit size={isMobile ? 16 : 18} />
                  <span>{isMobile ? 'Cover Letter' : 'Cover Letter Generator'}</span>
                </button>
                <button
                  className={`tab-button ${activeTab === "mock-interview" ? 'active' : ''}`}
                  onClick={() => setActiveTab("mock-interview")}
                  style={{
                    padding: isMobile ? '14px 16px' : '16px 24px',
                    fontWeight: '800',
                    color: activeTab === "mock-interview" ? '#111111' : '#5f5a52',
                    borderBottom: activeTab === "mock-interview" ? '1px solid #111111' : '1px solid transparent',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '6px' : '8px',
                    fontSize: '11px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    borderRadius: '0',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content'
                  }}
                >
                  <MessageSquare size={isMobile ? 16 : 18} />
                  <span>{isMobile ? 'Interview' : 'Mock Interview'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Resume Panel */}
          {resumeText && activeTab === "resume-critique" && (
            <div className="fade-in resume-panel">
              <ResumePanel
                resumeText={resumeText}
                setResumeText={setResumeText}
                onAnalyze={analyzeResume}
                loading={loading}
                feedback={feedback}
              />
            </div>
          )}
          
          {/* Cover Letter Generator */}
          {resumeText && activeTab === "cover-letter" && (
            <div className="fade-in">
              <CoverLetterGenerator 
                resumeText={resumeText}
                jobDescription={coverLetterJobDescription}
                setJobDescription={setCoverLetterJobDescription}
                coverLetter={coverLetter}
                setCoverLetter={setCoverLetter}
              />
            </div>
          )}

          {/* Mock Interview Generator */}
          {resumeText && activeTab === "mock-interview" && (
            <div className="fade-in">
              <MockInterviewGenerator 
                resumeText={resumeText}
                jobDescription={mockInterviewJobDescription}
                setJobDescription={setMockInterviewJobDescription}
                interviewQuestions={interviewQuestions}
                setInterviewQuestions={setInterviewQuestions}
              />
            </div>
          )}


          {/* Footer */}
          {/* Contact Me Section */}
          <section style={{
            marginTop: '40px',
            padding: isMobile ? '12px 8px' : '24px 16px',
            borderTop: '1px solid #d8d2c8',
            textAlign: 'center',
            background: 'transparent',
            borderRadius: '0',
            boxShadow: 'none',
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: '#d8d2c8'
            }}></div>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'none',
              backgroundSize: '20px 20px',
              opacity: 0.05,
              pointerEvents: 'none'
            }}></div>
            <div style={{
              marginBottom: isMobile ? '8px' : '16px',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1
            }}>
              {isMobile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Made by</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#111111' }}>Joner De Silva</span>
                </div>
              ) : (
                <>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111111',
                    margin: '0 0 4px 0',
                    letterSpacing: '0.5px'
                  }}>Made By</h2>
                  
                  <h3 style={{
                    fontSize: '17px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0',
                    letterSpacing: '0.3px'
                  }}>Joner De Silva</h3>
                </>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: isMobile ? '6px' : '16px',
              flexWrap: 'wrap',
              flexDirection: isMobile ? 'row' : 'row',
              alignItems: 'center',
              width: '100%',
              marginTop: isMobile ? '4px' : '0'
            }}>
              {/* LinkedIn Link */}
              <a 
                href="https://www.linkedin.com/in/joner-de-silva-861575203/" 
                target="_blank" 
                rel="noopener noreferrer"
                title="LinkedIn Profile"
                className="social-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  padding: isMobile ? '6px 10px' : '8px 16px',
                  borderRadius: isMobile ? '4px' : '6px',
                  textDecoration: 'none',
                  color: 'white',
                  fontWeight: '500',
                  fontSize: isMobile ? '12px' : '16px',
                  backgroundColor: '#1b1b1b',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: isMobile ? '0 1px 2px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                  width: 'auto',
                  justifyContent: 'center'
                }}
                onClick={(e) => {
                  // Try to open LinkedIn app on mobile
                  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    const linkedInAppUrl = "linkedin://profile/joner-de-silva-861575203";
                    const webUrl = "https://www.linkedin.com/in/joner-de-silva-861575203/";
                    
                    // Create a hidden iframe to try opening the app
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);
                    
                    // Set a timeout to redirect to web URL if app doesn't open
                    setTimeout(() => {
                      window.location.href = webUrl;
                    }, 500);
                    
                    // Try to open the app
                    iframe.src = linkedInAppUrl;
                    
                    // Prevent default link behavior
                    e.preventDefault();
                  }
                }}
              >
                <Linkedin size={isMobile ? 14 : 18} style={{ flexShrink: 0 }} />
                <span>LinkedIn</span>
              </a>
              
              {/* GitHub Link */}
              <a 
                href="https://github.com/yop-dev" 
                target="_blank" 
                rel="noopener noreferrer"
                title="GitHub Profile"
                className="social-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  padding: isMobile ? '6px 10px' : '8px 16px',
                  borderRadius: '5px',
                  textDecoration: 'none',
                  color: 'white',
                  fontWeight: '500',
                  fontSize: isMobile ? '12px' : '16px',
                  backgroundColor: '#1b1b1b',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: isMobile ? '0 1px 2px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                  width: 'auto',
                  justifyContent: 'center'
                }}
              >
                <Github size={isMobile ? 14 : 18} style={{ flexShrink: 0 }} />
                <span>GitHub</span>
              </a>
              
              {/* Portfolio Link */}
              <a 
                href="https://portfolio-theta-two-19.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                title="Personal Website"
                className="social-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  padding: isMobile ? '6px 10px' : '8px 16px',
                  borderRadius: '5px',
                  textDecoration: 'none',
                  color: 'white',
                  fontWeight: '500',
                  fontSize: isMobile ? '12px' : '16px',
                  backgroundColor: '#1b1b1b',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: isMobile ? '0 1px 2px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                  width: 'auto',
                  justifyContent: 'center'
                }}
              >
                <Globe size={isMobile ? 14 : 18} style={{ flexShrink: 0 }} />
                <span>Portfolio</span>
              </a>
            </div>
          </section>

          <footer style={{
            textAlign: 'center',
            color: '#6b7280',
            fontSize: isMobile ? '11px' : '14px',
            paddingTop: isMobile ? '16px' : '24px',
            paddingBottom: isMobile ? '16px' : '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: isMobile ? '4px' : '8px',
              flexWrap: 'wrap'
            }}>
              <span>Powered by</span>
              <span style={{ fontWeight: '600', color: '#111111' }}>Groq llama-3.1-8b-instant</span>
            </div>
            <div style={{ 
              marginBottom: isMobile ? '4px' : '8px', 
              display: 'flex', 
              justifyContent: 'center', 
              gap: isMobile ? '6px' : '16px',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BarChart3 size={isMobile ? 12 : 14} color="#4b5563" /> Resume Analysis
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileEdit size={isMobile ? 12 : 14} color="#4b5563" /> Cover Letter Generation
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MessageSquare size={isMobile ? 12 : 14} color="#4b5563" /> Mock Interview Questions
              </span>
            </div>
            <p style={{ margin: 0 }}>
              &copy; {new Date().getFullYear()} CareerLaunch AI. All rights reserved.
            </p>
          </footer>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setShowInfoModal(false)}>
          {/* Modal Content - Clicking inside won't close the modal */}
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: isMobile ? '20px' : '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              animation: 'fadeIn 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowInfoModal(false)}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                backgroundColor: 'rgba(239, 246, 255, 0.8)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = 'rgba(219, 234, 254, 0.9)';
              }}
            >
              <X size={20} color="#2563eb" />
            </button>

            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: '#dbeafe',
                borderRadius: '12px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Info size={24} color="#2563eb" />
              </div>
              <h2 style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: '700',
                color: '#1e293b',
                margin: 0
              }}>
                About CareerLaunch AI
              </h2>
            </div>

            {/* Modal Content */}
            <div style={{
              color: '#475569',
              fontSize: isMobile ? '15px' : '16px',
              lineHeight: '1.7'
            }}>
              <h3 style={{ color: '#2563eb', fontSize: isMobile ? '16px' : '18px', marginTop: '24px', marginBottom: '12px' }}>
                What is CareerLaunch AI?
              </h3>
              <p>
                CareerLaunch AI is an all-in-one career toolkit powered by artificial intelligence that helps job seekers improve their application materials and prepare for interviews.
              </p>
              
              <h3 style={{ color: '#2563eb', fontSize: isMobile ? '16px' : '18px', marginTop: '24px', marginBottom: '12px' }}>
                How It Works
              </h3>
              <p style={{ marginBottom: '8px' }}>
                Our platform offers three main tools to boost your job search:
              </p>
              
              <div style={{ marginLeft: '16px', marginBottom: '16px' }}>
                <p style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ color: '#2563eb', fontWeight: '700', fontSize: '18px' }}>1.</span>
                  <span>
                    <strong style={{ color: '#1e293b' }}>Resume Critique:</strong> Upload your resume to receive detailed feedback on its strengths and weaknesses, with specific recommendations for improvement.
                  </span>
                </p>
                
                <p style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ color: '#2563eb', fontWeight: '700', fontSize: '18px' }}>2.</span>
                  <span>
                    <strong style={{ color: '#1e293b' }}>Cover Letter Generator:</strong> Create personalized cover letters tailored to specific job descriptions, highlighting your relevant skills and experience.
                  </span>
                </p>
                
                <p style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#2563eb', fontWeight: '700', fontSize: '18px' }}>3.</span>
                  <span>
                    <strong style={{ color: '#1e293b' }}>Mock Interview Generator:</strong> Practice with customized interview questions based on your resume and target job, helping you prepare for the real thing.
                  </span>
                </p>
              </div>
              
              <h3 style={{ color: '#2563eb', fontSize: isMobile ? '16px' : '18px', marginTop: '24px', marginBottom: '12px' }}>
                Getting Started
              </h3>
              <ol style={{ paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>Upload your resume PDF using the upload area</li>
                <li style={{ marginBottom: '8px' }}>Review and edit the extracted text if needed</li>
                <li style={{ marginBottom: '8px' }}>Choose which tool you want to use from the tabs</li>
                <li style={{ marginBottom: '8px' }}>Follow the instructions for each specific tool</li>
                <li>Download, copy, or use the generated content for your job applications</li>
              </ol>
              
              <h3 style={{ color: '#2563eb', fontSize: isMobile ? '16px' : '18px', marginTop: '24px', marginBottom: '12px' }}>
                Privacy & Security
              </h3>
              <p>
                Your data is processed securely and not stored permanently. We use state-of-the-art AI models to analyze your resume and generate content, but we don't retain your personal information after your session.
              </p>
              
              <div style={{ 
                marginTop: '32px',
                padding: '16px',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                borderLeft: '4px solid #2563eb'
              }}>
                <p style={{ margin: 0, fontWeight: '500', color: '#2563eb' }}>
                  Ready to boost your job search? Upload your resume and let CareerLaunch AI help you land your dream job!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
