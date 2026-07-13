import React, { useState } from 'react'

const EDUCATION_OPTIONS = [
  'High School',
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  'PhD or Doctorate',
  'Self-Taught / Alternative',
];

const EXPERIENCE_OPTIONS = [
  '0–1 Years',
  '1–3 Years',
  '3–5 Years',
  '5–10 Years',
  '10+ Years',
  'Career Changer',
];

const INTEREST_PRESETS = [
  'Healthcare', 'Technology', 'Finance', 'Education',
  'Creative Arts', 'Environment', 'Business & Strategy',
  'Social Impact', 'Science & Research', 'Media & Communication',
  'Law & Policy', 'Engineering',
];

const WORK_STYLE_OPTIONS = [
  'Fully Remote',
  'Hybrid',
  'In-Office / On-Site',
  'Collaborative Team',
  'Independent / Solo',
  'Flexible Hours',
];

const RISK_OPTIONS = [
  { label: 'Low — Stability first', value: 'Low' },
  { label: 'Moderate — Balanced growth', value: 'Moderate' },
  { label: 'High — Entrepreneurial', value: 'High' },
];

const TOTAL_STEPS = 7;

export default function WizardForm({ onSubmit }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    education: '',
    experience: '',
    skills: [],
    interests: [],
    workStyle: [],
    riskTolerance: '',
    location: {
      latitude: null,
      longitude: null,
      name: ''
    }
  });
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [geoStatus, setGeoStatus] = useState(''); // 'requesting', 'success', 'denied'
  const [manualLocation, setManualLocation] = useState('');

  const nextStep = () => setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSingle = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleMultiToggle = (field, val) => {
    setFormData(prev => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val],
      };
    });
  };

  const addTag = (field, value, setter) => {
    const trimmed = value.trim();
    if (trimmed && !formData[field].includes(trimmed)) {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], trimmed] }));
      setter('');
    }
  };

  const removeTag = (field, idx) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx),
    }));
  };

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    setGeoStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let locationName = 'National Average';

        try {
          // Attempt a reverse-geocoding lookup or default to lat/lon format
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          if (data && (data.city || data.principalSubdivision)) {
            locationName = data.city || data.principalSubdivision;
          }
        } catch (e) {
          console.warn("Could not geocode coordinates", e);
        }

        setFormData(prev => ({
          ...prev,
          location: { latitude, longitude, name: locationName }
        }));
        setGeoStatus('success');
      },
      (error) => {
        console.warn("Geolocation permission error", error);
        setGeoStatus('denied');
      }
    );
  };

  const handleManualLocationSubmit = () => {
    if (manualLocation.trim()) {
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, name: manualLocation.trim() }
      }));
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return !!formData.education;
      case 2: return !!formData.experience;
      case 3: return formData.skills.length > 0;
      case 4: return formData.interests.length > 0;
      case 5: return formData.workStyle.length > 0;
      case 6: return !!formData.riskTolerance;
      case 7: return true; // Optional geolocation fallback allows progress
      default: return false;
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="card wizard-container">
      {/* Progress */}
      <div className="wizard-step-label">Step {step} of {TOTAL_STEPS}</div>
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Step 1: Education */}
      {step === 1 && (
        <>
          <h2 className="wizard-question">What is your education level?</h2>
          <p className="wizard-hint">Select the highest level you have completed or are currently pursuing.</p>
          <div className="chips-grid">
            {EDUCATION_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                className={`chip${formData.education === opt ? ' selected' : ''}`}
                onClick={() => handleSingle('education', opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Step 2: Experience */}
      {step === 2 && (
        <>
          <h2 className="wizard-question">How much professional experience do you have?</h2>
          <p className="wizard-hint">Count paid work, internships, or meaningful freelance experience.</p>
          <div className="chips-grid">
            {EXPERIENCE_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                className={`chip${formData.experience === opt ? ' selected' : ''}`}
                onClick={() => handleSingle('experience', opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Step 3: Skills */}
      {step === 3 && (
        <>
          <h2 className="wizard-question">What are your key skills?</h2>
          <p className="wizard-hint">Type a skill and press Enter — e.g. Python, Public Speaking, UI Design.</p>
          <div className="tags-input-container">
            {formData.skills.map((skill, i) => (
              <span className="tag" key={i}>
                {skill}
                <span className="tag-remove" onClick={() => removeTag('skills', i)}>×</span>
              </span>
            ))}
            <input
              type="text"
              className="tags-input"
              placeholder={formData.skills.length === 0 ? 'e.g. Python, SQL, Communication…' : 'Add another…'}
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addTag('skills', skillInput, setSkillInput); }
              }}
            />
          </div>
        </>
      )}

      {/* Step 4: Interests */}
      {step === 4 && (
        <>
          <h2 className="wizard-question">What topics or work energises you?</h2>
          <p className="wizard-hint">Select all that apply, or type your own and press Enter.</p>
          <div className="chips-grid" style={{ marginBottom: '1rem' }}>
            {INTEREST_PRESETS.map(opt => (
              <button
                key={opt}
                type="button"
                className={`chip${formData.interests.includes(opt) ? ' selected' : ''}`}
                onClick={() => handleMultiToggle('interests', opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="tags-input-container">
            {formData.interests
              .filter(i => !INTEREST_PRESETS.includes(i))
              .map((interest, i) => (
                <span className="tag" key={i}>
                  {interest}
                  <span
                    className="tag-remove"
                    onClick={() => removeTag('interests', formData.interests.indexOf(interest))}
                  >
                    ×
                  </span>
                </span>
              ))}
            <input
              type="text"
              className="tags-input"
              placeholder="Add your own interest…"
              value={interestInput}
              onChange={e => setInterestInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addTag('interests', interestInput, setInterestInput); }
              }}
            />
          </div>
        </>
      )}

      {/* Step 5: Work Style */}
      {step === 5 && (
        <>
          <h2 className="wizard-question">How do you prefer to work?</h2>
          <p className="wizard-hint">Choose all that feel right — these help match your lifestyle and environment.</p>
          <div className="chips-grid">
            {WORK_STYLE_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                className={`chip${formData.workStyle.includes(opt) ? ' selected' : ''}`}
                onClick={() => handleMultiToggle('workStyle', opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Step 6: Risk Tolerance */}
      {step === 6 && (
        <>
          <h2 className="wizard-question">What is your risk tolerance for career moves?</h2>
          <p className="wizard-hint">This shapes whether we suggest established paths or emerging opportunities.</p>
          <div className="chips-grid">
            {RISK_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                className={`chip${formData.riskTolerance === value ? ' selected' : ''}`}
                onClick={() => handleSingle('riskTolerance', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Step 7: Geolocation / Location Permission */}
      {step === 7 && (
        <>
          <h2 className="wizard-question">Personalise recommendations with your location?</h2>
          <p className="wizard-hint">We use location coordinates to customize estimated salary ranges for your region. Denying defaults to national averages.</p>
          <div className="geolocation-wrap" style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={requestGeolocation}
              disabled={geoStatus === 'requesting' || geoStatus === 'success'}
              style={{ alignSelf: 'flex-start' }}
            >
              {geoStatus === 'requesting' && 'Accessing Geolocation…'}
              {geoStatus === 'success' && '✓ Location Auth Success'}
              {geoStatus !== 'requesting' && geoStatus !== 'success' && 'Share Current Location'}
            </button>

            {formData.location.name && (
              <div className="geo-success-badge" style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
                Detected Region: {formData.location.name} (Lat: {formData.location.latitude?.toFixed(4)}, Lon: {formData.location.longitude?.toFixed(4)})
              </div>
            )}

            {geoStatus === 'denied' && (
              <div className="manual-location-fallback" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <label className="career-card-skills-label" style={{ display: 'block' }}>Enter Region Manually (Optional Fallback)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="tags-input"
                    style={{ border: '1px solid var(--border)', padding: '0 0.75rem', height: 44 }}
                    placeholder="e.g. London, San Francisco, Tokyo…"
                    value={manualLocation}
                    onChange={e => setManualLocation(e.target.value)}
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleManualLocationSubmit}>
                    Set Region
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="btn-container">
        {step > 1 ? (
          <button className="btn btn-secondary" onClick={prevStep}>← Back</button>
        ) : (
          <div />
        )}
        {step < TOTAL_STEPS ? (
          <button className="btn btn-primary" disabled={!isStepValid()} onClick={nextStep}>
            Continue →
          </button>
        ) : (
          <button className="btn btn-primary" disabled={!isStepValid()} onClick={() => onSubmit(formData)}>
            Find My Careers →
          </button>
        )}
      </div>
    </div>
  );
}
