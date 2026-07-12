import React, { useState, useEffect } from 'react'

/** SVG circular score ring */
function ScoreRing({ pct }) {
  const r = 25;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(pct, 100) / 100) * circ;
  return (
    <div className="score-ring-wrap">
      <svg className="score-ring-svg" viewBox="0 0 62 62">
        <circle className="score-ring-bg" cx="31" cy="31" r={r} />
        <circle
          className="score-ring-fill"
          cx="31" cy="31" r={r}
          strokeDasharray={`${filled} ${circ}`}
        />
      </svg>
      <div className="score-ring-text">{pct}%</div>
    </div>
  );
}

/** Skeleton placeholder for an unresolved card */
function SkeletonCard({ index }) {
  return (
    <div className="career-card skeleton" style={{ animationDelay: `${index * 0.12}s` }}>
      <div className="career-card-topbar" />
      <div className="career-card-body">
        <div className="skel skel-text-sm" style={{ marginBottom: '0.5rem' }} />
        <div className="career-card-title-row">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="skel skel-text-lg" />
            <div className="skel skel-text-md" />
          </div>
          <div className="skel skel-circle" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div className="skel skel-line" />
          <div className="skel skel-line" />
          <div className="skel skel-line-short" />
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <div className="skel" style={{ height: 22, width: 65, borderRadius: 5 }} />
          <div className="skel" style={{ height: 22, width: 85, borderRadius: 5 }} />
          <div className="skel" style={{ height: 22, width: 55, borderRadius: 5 }} />
        </div>
      </div>
    </div>
  );
}

/** Fully resolved career card */
function CareerCard({ rec, index }) {
  const pct = parseInt(rec.matchPct, 10) || 0;
  return (
    <div className="career-card" style={{ animationDelay: `${index * 0.14}s` }}>
      <div className="career-card-topbar" />
      <div className="career-card-body">
        <div className="career-card-match-label">Match {String(index + 1).padStart(2, '0')}</div>
        <div className="career-card-title-row">
          <h3 className="career-card-title">{rec.title}</h3>
          <ScoreRing pct={pct} />
        </div>
        <p className="career-card-rationale">{rec.whyFits}</p>

        {rec.gaps && rec.gaps.length > 0 && (
          <div>
            <div className="career-card-skills-label">Skills to Build</div>
            <div className="career-card-skills-chips">
              {rec.gaps.map((g, i) => (
                <span key={i} className="skill-chip">{g}</span>
              ))}
            </div>
          </div>
        )}

        {rec.roadmap && rec.roadmap[0] && (
          <div className="career-card-first-step">
            <strong>First Step</strong>
            {rec.roadmap[0]}
          </div>
        )}
      </div>
    </div>
  );
}

/** Small context chips showing the user's submitted answers */
function ContextChips({ formData }) {
  if (!formData) return null;
  const chips = [
    formData.education,
    formData.experience,
    ...(formData.workStyle || []),
    formData.riskTolerance ? `Risk: ${formData.riskTolerance}` : null,
  ].filter(Boolean);

  return (
    <div className="results-context-chips">
      {chips.map((c, i) => (
        <span key={i} className="context-chip">{c}</span>
      ))}
    </div>
  );
}

export default function BentoGrid({ streamText, onReset, isStreaming, formData }) {
  const [parsedData, setParsedData] = useState([]);

  useEffect(() => {
    if (!streamText) return;

    // 1. Try to parse complete JSON
    try {
      const data = JSON.parse(streamText);
      if (data && Array.isArray(data.recommendations)) {
        setParsedData(
          data.recommendations.map((rec, i) => ({
            id: i + 1,
            title: rec.title || 'Untitled',
            matchPct: rec.matchScore !== undefined ? `${rec.matchScore}%` : '?%',
            whyFits: rec.rationale || '',
            gaps: rec.skillsGap || [],
            roadmap: rec.firstStep ? [rec.firstStep] : [],
          }))
        );
        return;
      }
    } catch (_) {}

    // 2. Streaming partial parse via regex
    const objectRegex =
      /\{\s*"title"\s*:\s*"([\s\S]*?)"\s*,\s*"matchScore"\s*:\s*(\d+)\s*,\s*"rationale"\s*:\s*"([\s\S]*?)"\s*,\s*"skillsGap"\s*:\s*\[([\s\S]*?)\]\s*(?:,\s*"firstStep"\s*:\s*"([\s\S]*?)")?\s*\}/g;

    const results = [];
    let match;
    let idx = 1;
    while ((match = objectRegex.exec(streamText)) !== null) {
      const gaps = match[4]
        ? match[4].split(',').map(s => s.replace(/["'\[\]]/g, '').trim()).filter(Boolean)
        : [];
      results.push({
        id: idx++,
        title: match[1].trim(),
        matchPct: `${match[2]}%`,
        whyFits: match[3].trim(),
        gaps,
        roadmap: match[5] ? [match[5].trim()] : [],
      });
    }
    if (results.length > 0) setParsedData(results);
  }, [streamText]);

  const resolvedCount = parsedData.length;
  // Show skeleton cards for unresolved slots while streaming (target 3)
  const skeletonCount = isStreaming ? Math.max(0, 3 - resolvedCount) : 0;

  return (
    <div>
      <div className="results-reset-row">
        <div className="results-header">
          <h1 className="results-title">Your Career Matches</h1>
          <ContextChips formData={formData} />
        </div>
        <button className="btn btn-secondary" onClick={onReset}>← Start Over</button>
      </div>

      {/* Cards grid */}
      {(resolvedCount > 0 || skeletonCount > 0) && (
        <div className="cards-grid">
          {parsedData.map((rec, i) => (
            <CareerCard key={rec.id} rec={rec} index={i} />
          ))}
          {Array.from({ length: skeletonCount }, (_, i) => (
            <SkeletonCard key={`skel-${i}`} index={resolvedCount + i} />
          ))}
        </div>
      )}

      {/* Full-page loader before first card arrives */}
      {isStreaming && resolvedCount === 0 && skeletonCount === 0 && (
        <div className="stream-loader">
          <div className="spinner" />
          <div className="pulse-text">Analysing your profile…</div>
        </div>
      )}

      {!isStreaming && resolvedCount === 0 && (
        <div className="stream-loader">
          <div className="spinner" />
          <div className="pulse-text">Processing recommendations…</div>
        </div>
      )}
    </div>
  );
}
