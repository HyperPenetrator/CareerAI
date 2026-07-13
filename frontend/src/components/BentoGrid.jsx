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

function LinkedInJobs({ title }) {
  const [location, setLocation] = useState('Remote');

  const handleSearch = async () => {
    const backendHost = window.location.port
      ? `${window.location.protocol}//${window.location.hostname}:8000`
      : '';
    const url = `${backendHost}/api/linkedin-url?title=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      console.error("Failed to build LinkedIn URL", e);
      // Fallback
      window.open(`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="linkedin-jobs-section">
      <div className="career-card-skills-label">Available Jobs on LinkedIn</div>
      <div className="linkedin-jobs-controls">
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="linkedin-location-select"
        >
          <option value="Remote">Remote</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="United States">United States</option>
          <option value="Germany">Germany</option>
          <option value="Canada">Canada</option>
          <option value="India">India</option>
          <option value="Singapore">Singapore</option>
        </select>
        <button className="btn btn-primary btn-sm linkedin-search-btn" onClick={handleSearch}>
          Search Jobs
        </button>
      </div>
    </div>
  );
}

/** Fully resolved career card */
function CareerCard({ rec, index }) {
  const pct = parseInt(rec.matchPct, 10) || 0;
  return (
    <div
      className="career-card"
      style={{ animationDelay: `${index * 0.14}s` }}
      data-card-id={rec.id}
      data-card-title={rec.title}
    >
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

        {rec.targetPositions && rec.targetPositions.length > 0 && (
          <div>
            <div className="career-card-skills-label">Target Positions</div>
            <div className="career-card-skills-chips">
              {rec.targetPositions.map((pos, i) => (
                <span key={i} className="position-chip">{pos}</span>
              ))}
            </div>
          </div>
        )}

        {rec.topPayingCompanies && rec.topPayingCompanies.length > 0 && (
          <div>
            <div className="career-card-skills-label">Top Paying Companies</div>
            <div className="companies-row-list">
              {rec.topPayingCompanies.join(" • ")}
            </div>
          </div>
        )}

        {rec.salaryRange && (
          <div className="career-salary-box">
            <span className="salary-icon">💰</span>
            <span className="salary-range-text">{rec.salaryRange}</span>
          </div>
        )}

        <LinkedInJobs title={rec.title} />

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
    { type: 'education', text: formData.education },
    { type: 'experience', text: formData.experience },
    ...(formData.skills || []).map(sk => ({ type: 'skill', text: sk })),
    ...(formData.workStyle || []).map(ws => ({ type: 'workStyle', text: ws })),
    formData.riskTolerance ? { type: 'riskTolerance', text: `Risk: ${formData.riskTolerance}` } : null,
  ].filter(Boolean);

  return (
    <div className="results-context-chips">
      {chips.map((c, i) => (
        <span
          key={i}
          className="context-chip"
          data-chip-type={c.type}
          data-chip-val={c.text}
        >
          {c.text}
        </span>
      ))}
    </div>
  );
}

function SvgOverlay({ wrapperRef, parsedData, isStreaming, hoveredCardId }) {
  const [lines, setLines] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!wrapperRef.current) return;

    const updateCoordinates = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const wrapperRect = wrapper.getBoundingClientRect();
      setDimensions({ width: wrapperRect.width, height: wrapperRect.height });

      // Query active chips and cards
      const chipElements = wrapper.querySelectorAll('.context-chip');
      const cardElements = wrapper.querySelectorAll('.career-card:not(.skeleton)');

      const newLines = [];

      cardElements.forEach(cardEl => {
        const cardId = cardEl.getAttribute('data-card-id');
        const cardTitle = cardEl.getAttribute('data-card-title') || '';
        const cardRec = parsedData.find(r => String(r.id) === String(cardId));
        if (!cardRec) return;

        const cardRect = cardEl.getBoundingClientRect();
        const cardX = cardRect.left - wrapperRect.left + cardRect.width / 2;
        const cardY = cardRect.top - wrapperRect.top; // Connect to the top center of card

        // Parse specific "why" or reasoning for each match.
        // We'll extract a short snippet from cardRec.whyFits (rationale)
        let shortWhy = '';
        if (cardRec.whyFits) {
          const sentences = cardRec.whyFits.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
          // Pick first sentence as the concise floating label
          if (sentences.length > 0) {
            shortWhy = sentences[0];
            if (shortWhy.length > 85) {
              shortWhy = shortWhy.slice(0, 82) + '...';
            }
          }
        }

        // For each parameter category (education, experience, skill, workStyle, riskTolerance),
        // we find the single matching chip and create exactly one line for it to prevent clutter.
        const parameterTypes = ['education', 'experience', 'skill', 'workStyle', 'riskTolerance'];
        const contextText = (cardTitle + ' ' + cardRec.whyFits + ' ' + (cardRec.gaps || []).join(' ')).toLowerCase();

        parameterTypes.forEach(pType => {
          let matchedChipEl = null;
          let matchedVal = '';

          // Find the matching chip for this parameter type
          for (const chipEl of chipElements) {
            const chipType = chipEl.getAttribute('data-chip-type');
            const chipVal = chipEl.getAttribute('data-chip-val') || '';

            if (chipType === pType) {
              const cleanVal = chipVal.replace(/Risk:\s*/i, '').toLowerCase();
              // Education & experience connect as baseline inputs. WorkStyle, risk, and skills connect if they match context.
              const isMatch = (pType === 'education' || pType === 'experience') || contextText.includes(cleanVal);
              
              if (isMatch) {
                matchedChipEl = chipEl;
                matchedVal = chipVal;
                break; // Take the first matching chip for this category
              }
            }
          }

          if (matchedChipEl) {
            const chipRect = matchedChipEl.getBoundingClientRect();
            const chipX = chipRect.left - wrapperRect.left + chipRect.width / 2;
            const chipY = chipRect.top - wrapperRect.top + chipRect.height;

            // Control points for bezier curve
            const cp1x = chipX;
            const cp1y = chipY + (cardY - chipY) / 2;
            const cp2x = cardX;
            const cp2y = cardY - (cardY - chipY) / 2;

            const pathData = `M ${chipX} ${chipY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${cardX} ${cardY}`;

            // Midpoint for floating label
            const t = 0.5;
            const labelX = (1-t)**3 * chipX + 3*(1-t)**2*t * cp1x + 3*(1-t)*t**2 * cp2x + t**3 * cardX;
            const labelY = (1-t)**3 * chipY + 3*(1-t)**2*t * cp1y + 3*(1-t)*t**2 * cp2y + t**3 * cardY;

            // Formulate human readable category label
            const categoryNames = {
              education: 'Education',
              experience: 'Experience',
              skill: 'Skill',
              workStyle: 'Work Preference',
              riskTolerance: 'Risk Profile'
            };
            const labelText = `Fits ${categoryNames[pType]}: ${matchedVal} — ${shortWhy || 'Direct Fit'}`;

            newLines.push({
              id: `${pType}-${cardId}`,
              cardId: String(cardId),
              pathData,
              labelX,
              labelY,
              why: labelText
            });
          }
        });
      });

      setLines(newLines);
    };

    // Use ResizeObserver for wrapper size changes
    const resizeObserver = new ResizeObserver(() => {
      updateCoordinates();
    });
    resizeObserver.observe(wrapperRef.current);

    // Watch window events
    window.addEventListener('resize', updateCoordinates);
    window.addEventListener('scroll', updateCoordinates, { passive: true });

    // Initial setup with double animation frame to ensure children are fully rendered and positioned
    let raf1 = requestAnimationFrame(() => {
      let raf2 = requestAnimationFrame(updateCoordinates);
      return () => cancelAnimationFrame(raf2);
    });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCoordinates);
      window.removeEventListener('scroll', updateCoordinates);
      cancelAnimationFrame(raf1);
    };
  }, [parsedData, isStreaming, wrapperRef]);

  return (
    <div className="svg-overlay-container" style={{ width: dimensions.width, height: dimensions.height }}>
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        {lines.map(line => {
          const isCardHovered = hoveredCardId !== null;
          const isThisCardHovered = String(hoveredCardId) === line.cardId;
          // If a card is hovered, only show matching lines highlighted. Otherwise show all faintly.
          const opacity = isCardHovered ? (isThisCardHovered ? 0.9 : 0.05) : 0.2;
          return (
            <path
              key={line.id}
              d={line.pathData}
              className="connecting-line"
              style={{ opacity, transition: 'opacity 0.25s ease' }}
            />
          );
        })}
      </svg>
      {lines.map(line => {
        // Floating why label only displays when its specific card is hovered to keep overlay uncluttered
        const isThisCardHovered = String(hoveredCardId) === line.cardId;
        if (!isThisCardHovered) return null;

        return (
          <div
            key={`label-${line.id}`}
            className="floating-why-label"
            style={{ left: line.labelX, top: line.labelY }}
          >
            {line.why}
          </div>
        );
      })}
    </div>
  );
}

export default function BentoGrid({ streamText, onReset, isStreaming, formData }) {
  const [parsedData, setParsedData] = useState([]);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const wrapperRef = React.useRef(null);

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
            targetPositions: rec.targetPositions || [],
            topPayingCompanies: rec.topPayingCompanies || [],
            salaryRange: rec.salaryRange || ''
          }))
        );
        return;
      }
    } catch (_) {}

    // 2. Streaming partial parse via regex (handles variable streaming lengths)
    const objectRegex =
      /\{\s*"title"\s*:\s*"([\s\S]*?)"\s*,\s*"matchScore"\s*:\s*(\d+)\s*,\s*"rationale"\s*:\s*"([\s\S]*?)"\s*,\s*"skillsGap"\s*:\s*\[([\s\S]*?)\]\s*(?:,\s*"firstStep"\s*:\s*"([\s\S]*?)")?\s*(?:,\s*"targetPositions"\s*:\s*\[([\s\S]*?)\])?\s*(?:,\s*"topPayingCompanies"\s*:\s*\[([\s\S]*?)\])?\s*(?:,\s*"salaryRange"\s*:\s*"([\s\S]*?)")?\s*\}/g;

    const results = [];
    let match;
    let idx = 1;
    while ((match = objectRegex.exec(streamText)) !== null) {
      const gaps = match[4]
        ? match[4].split(',').map(s => s.replace(/["'\[\]]/g, '').trim()).filter(Boolean)
        : [];
      const targetPositions = match[6]
        ? match[6].split(',').map(s => s.replace(/["'\[\]]/g, '').trim()).filter(Boolean)
        : [];
      const topPayingCompanies = match[7]
        ? match[7].split(',').map(s => s.replace(/["'\[\]]/g, '').trim()).filter(Boolean)
        : [];

      results.push({
        id: idx++,
        title: match[1].trim(),
        matchPct: `${match[2]}%`,
        whyFits: match[3].trim(),
        gaps,
        roadmap: match[5] ? [match[5].trim()] : [],
        targetPositions,
        topPayingCompanies,
        salaryRange: match[8] ? match[8].trim() : ''
      });
    }
    if (results.length > 0) setParsedData(results);
  }, [streamText]);

  const resolvedCount = parsedData.length;
  const skeletonCount = isStreaming ? Math.max(0, 3 - resolvedCount) : 0;

  return (
    <div className="bento-grid-wrapper" ref={wrapperRef}>
      {resolvedCount > 0 && (
        <SvgOverlay
          wrapperRef={wrapperRef}
          parsedData={parsedData}
          isStreaming={isStreaming}
          hoveredCardId={hoveredCardId}
        />
      )}

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
            <div
              key={rec.id}
              onMouseEnter={() => setHoveredCardId(rec.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              style={{ display: 'contents' }}
            >
              <CareerCard rec={rec} index={i} />
            </div>
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
