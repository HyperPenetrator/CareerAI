import React, { useState } from 'react'
import WizardForm from './components/WizardForm.jsx'
import BentoGrid from './components/BentoGrid.jsx'

/** CareerCompass SVG compass-rose icon — distinctive, copyright-ready mark */
function CompassIcon() {
  return (
    <svg
      className="logo-icon"
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle cx="14" cy="14" r="12.5" stroke="#4A90C4" strokeWidth="1.5" fill="none" />
      {/* Inner tick marks at cardinal positions */}
      <line x1="14" y1="2.5" x2="14" y2="5.5" stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="22.5" x2="14" y2="25.5" stroke="#2D5F8A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2.5" y1="14" x2="5.5" y2="14" stroke="#2D5F8A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22.5" y1="14" x2="25.5" y2="14" stroke="#2D5F8A" strokeWidth="1.5" strokeLinecap="round" />
      {/* North needle (accent-fill) */}
      <polygon points="14,6 16,14 14,12.5 12,14" fill="#4A90C4" />
      {/* South needle (dark) */}
      <polygon points="14,22 16,14 14,15.5 12,14" fill="#14213D" opacity="0.5" />
      {/* Centre dot */}
      <circle cx="14" cy="14" r="1.6" fill="#2D5F8A" />
    </svg>
  );
}

export default function App() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamText, setStreamText]     = useState('');
  const [error, setError]               = useState(null);
  const [showResults, setShowResults]   = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    setStreamText('');
    setShowResults(true);
    setSubmittedData(formData);

    const backendHost = window.location.port
      ? `${window.location.protocol}//${window.location.hostname}:8000`
      : '';
    const apiUrl = `${backendHost}/api/recommend`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error)      setError(parsed.error);
              else if (parsed.text)  setStreamText(prev => prev + parsed.text);
            } catch (e) {
              console.warn('Failed to parse SSE packet:', dataStr, e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Stream error:', err);
      setError('Could not connect to the CareerCompass backend. Please make sure it is running on port 8000.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setShowResults(false);
    setStreamText('');
    setIsSubmitting(false);
    setError(null);
    setSubmittedData(null);
  };

  return (
    <>
      <header>
        {/* ── CareerCompass brand wordmark ── */}
        <a href="/" className="site-logo" onClick={e => { e.preventDefault(); handleReset(); }} aria-label="CareerCompass home">
          <CompassIcon />
          <span className="logo-wordmark">
            <span className="logo-career">Career</span><span className="logo-compass">Compass</span>
          </span>
          <span className="logo-badge">AI</span>
        </a>

        <span className="header-tagline">Personalised Career Intelligence</span>
      </header>

      <main>
        {!showResults ? (
          <WizardForm onSubmit={handleSubmit} />
        ) : (
          <div>
            {error && (
              <div className="error-card" style={{ marginBottom: '1.5rem' }}>
                <h3>⚠ Connection Error</h3>
                <p>{error}</p>
                <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={handleReset}>
                  ← Back to Form
                </button>
              </div>
            )}

            <BentoGrid
              streamText={streamText}
              onReset={handleReset}
              isStreaming={isSubmitting}
              formData={submittedData}
            />
          </div>
        )}
      </main>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} CareerCompass AI. All rights reserved. ~ made by Team CodeCraft</span>
      </footer>
    </>
  );
}
