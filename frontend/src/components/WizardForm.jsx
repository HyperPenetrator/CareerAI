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

const TOTAL_STEPS = 6;

export default function WizardForm({ onSubmit }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    education: '',
    experience: '',
    skills: [],
    interests: [],
    workStyle: [],
    riskTolerance: '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

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

  const isStepValid = () => {
    switch (step) {
      case 1: return !!formData.education;
      case 2: return !!formData.experience;
      case 3: return formData.skills.length > 0;
      case 4: return formData.interests.length > 0;
      case 5: return formData.workStyle.length > 0;
      case 6: return !!formData.riskTolerance;
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
