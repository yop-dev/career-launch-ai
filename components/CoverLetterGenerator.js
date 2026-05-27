import React, { useState, useEffect } from "react";
import { FileText, Send, Copy, CheckCircle, Download } from "lucide-react";

export default function CoverLetterGenerator({ 
  resumeText, 
  jobDescription, 
  setJobDescription, 
  coverLetter, 
  setCoverLetter 
}) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const generateCoverLetter = async () => {
    if (!resumeText || !jobDescription) {
      alert("Please provide both resume and job description");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate cover letter");
      }

      const data = await res.json();
      setCoverLetter(data.coverLetter);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const downloadAsTextFile = () => {
    // Create a Blob with the text content
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cover-letter.txt';
    
    // Trigger a click on the anchor element
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Completely revamped downloadAsPdf function using pure text rendering
  const downloadAsPdf = async () => {
    try {
      // Dynamically import jsPDF for text-based PDF generation
      const { jsPDF } = await import('jspdf');
      
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set up document properties
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 25; // 25mm margins
      const contentWidth = pageWidth - (margin * 2);
      
      // Set font
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      // Current Y position tracker
      let yPos = margin;
      
      // Add the date
      doc.text(formatDate(new Date()), margin, yPos);
      yPos += 10;
      
      // Process the cover letter content
      const paragraphs = coverLetter
        .split(/\n\s*\n/)
        .filter(p => p.trim().length > 0);
      
      // Text wrapping and pagination function
      const addWrappedText = (text, x, y, maxWidth, lineHeight) => {
        // Split the text into words
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const testLine = line + (line ? ' ' : '') + word;
          const testWidth = doc.getStringUnitWidth(testLine) * doc.internal.getFontSize() / doc.internal.scaleFactor;
          
          if (testWidth > maxWidth) {
            // Add the current line
            doc.text(line, x, currentY);
            line = word;
            currentY += lineHeight;
            
            // Check if we need a new page
            if (currentY > pageHeight - margin) {
              doc.addPage();
              currentY = margin;
            }
          } else {
            line = testLine;
          }
        }
        
        // Add the last line
        if (line) {
          doc.text(line, x, currentY);
          currentY += lineHeight;
        }
        
        return currentY;
      };
      
      // Process each paragraph
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        
        // Handle signature lines differently
        if (paragraph.includes('Sincerely') || 
            paragraph.includes('Regards') || 
            paragraph.includes('Best regards') || 
            paragraph.includes('Yours')) {
          yPos += 5; // Add extra space before signature
        }
        
        // Process the paragraph with line wrapping
        yPos = addWrappedText(paragraph, margin, yPos, contentWidth, 6);
        
        // Add space between paragraphs
        yPos += 5;
        
        // Check if we need a new page for the next paragraph
        if (i < paragraphs.length - 1 && yPos > pageHeight - margin - 15) {
          doc.addPage();
          yPos = margin;
        }
      }
      
      // Save the PDF
      doc.save('cover-letter.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    }
  };
  
  // Helper function to format the current date
  const formatDate = (date) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <div style={{ marginBottom: '24px' }}>
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
              Job Description
            </h2>
            <p style={{
              fontSize: isMobile ? '13px' : '14px',
              color: '#5f5a52',
              margin: 0
            }}>
              Paste the job description to generate a tailored cover letter
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
              Job Details
            </label>
            <span style={{ 
              fontSize: '12px', 
              color: '#6e6a63',
              textAlign: isMobile ? 'left' : 'right'
            }}>
              {jobDescription.length} characters
            </span>
          </div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            style={{
              width: '100%',
              minHeight: isMobile ? '180px' : '200px',
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
          />
        </div>
        
        <button
          onClick={generateCoverLetter}
          disabled={loading || !resumeText || !jobDescription}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            gap: '8px',
            backgroundColor: loading || !resumeText || !jobDescription ? '#9a948b' : '#1b1b1b',
            backgroundImage: 'none',
            color: 'white',
            fontWeight: '800',
            padding: isMobile ? '12px 16px' : '15px 22px',
            borderRadius: '5px',
            border: 'none',
            cursor: loading || !resumeText || !jobDescription ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: 'none',
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase'
          }}
          onMouseOver={(e) => {
            if (!loading && resumeText && jobDescription) {
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
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span>Generating Cover Letter...</span>
            </>
          ) : (
            <>
              <Send size={isMobile ? 16 : 18} />
              <span>Generate Cover Letter</span>
            </>
          )}
        </button>
      </div>

      {coverLetter && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.26)',
          borderRadius: '0',
          boxShadow: 'none',
          padding: isMobile ? '16px' : '24px',
          border: '1px solid #d8d2c8',
          animation: 'fadeIn 0.5s ease',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Header section with responsive design for mobile */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '16px',
            borderBottom: '1px solid #d8d2c8',
            paddingBottom: '16px',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            {/* Title section */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '16px',
              flexDirection: isMobile ? 'column' : 'row'
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
                  Your Cover Letter
                </h2>
                <p style={{
                  fontSize: isMobile ? '13px' : '14px',
                  color: '#5f5a52',
                  margin: 0
                }}>
                  Tailored based on your resume and the job description
                </p>
              </div>
            </div>
            
            {/* Action buttons with improved mobile layout */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              {/* Regenerate button */}
              <button
                onClick={() => generateCoverLetter()}
                disabled={loading}
                title="Generate a new version of the cover letter with different wording and style"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: loading ? '#9a948b' : '#1b1b1b',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: '800',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'none',
                  minWidth: isMobile ? '100px' : '110px',
                  flexGrow: 1,
                  maxWidth: isMobile ? '100%' : '150px'
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
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                      <path d="M21 3v5h-5"></path>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                      <path d="M8 16H3v5"></path>
                    </svg>
                    <span>Regenerate</span>
                  </>
                )}
              </button>

              {/* Copy button */}
              <button
                onClick={copyToClipboard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: '1px solid #d8d2c8',
                  borderRadius: '5px',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: '800',
                  color: '#1b1b1b',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  minWidth: isMobile ? '80px' : '90px',
                  flexGrow: 1,
                  maxWidth: isMobile ? '100%' : '120px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9e4dc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {copied ? (
                  <>
                    <CheckCircle size={16} color="#1b1b1b" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} color="#1b1b1b" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              
              {/* Download PDF button */}
              <button
                onClick={downloadAsPdf}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: '#1b1b1b',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: '800',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'none',
                  minWidth: isMobile ? '100px' : '130px',
                  flexGrow: 1,
                  maxWidth: isMobile ? '100%' : '160px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#111111';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#1b1b1b';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Download size={16} color="white" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.42)',
            padding: isMobile ? '16px' : '20px',
            borderRadius: '0',
            borderLeft: '1px solid #1b1b1b',
            overflowX: 'auto',
            maxWidth: '100%',
            boxSizing: 'border-box',
            wordBreak: 'break-word' // Helps with mobile display
          }}>
            <div style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: isMobile ? '14px' : '15px',
              lineHeight: '1.6',
              color: '#1b1b1b',
              margin: 0,
              maxWidth: '100%'
            }}>
              {coverLetter.split('\n\n').map((paragraph, index) => {
                // Check if this is a signature line
                const isSignature = paragraph.includes('Sincerely') || 
                                   paragraph.includes('Regards') || 
                                   paragraph.includes('Best regards') || 
                                   paragraph.includes('Yours');
                
                return (
                  <p key={index} style={{
                    marginBottom: isSignature ? '0' : '16px',
                    marginTop: isSignature ? '24px' : '0',
                    padding: '0',
                    textAlign: 'left'
                  }}>
                    {paragraph.split('\n').map((line, lineIndex) => (
                      <React.Fragment key={lineIndex}>
                        {line}
                        {lineIndex < paragraph.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
