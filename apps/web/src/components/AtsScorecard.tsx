'use client';

import React from 'react';

export type AtsEvaluation = {
  id: string;
  scores: {
    overall: {
      score: number;
      label: string;
      formula: string;
    };
    parsing_compatibility: {
      score: number;
      confidence: number;
      breakdown: Record<string, boolean>;
    };
    job_match: {
      score: number;
      confidence: number;
      keyword_overlap: number;
      matched_count: number;
      missing_count: number;
    };
    grounding: {
      score: number;
      grounded_claims: number;
      total_claims: number;
    };
  };
  keywords: {
    matched: string[];
    missing: string[];
  };
  issues: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
  recommendations: string[];
  disclaimer?: string;
};

interface AtsScorecardProps {
  evaluation: AtsEvaluation;
  onRefresh?: () => void;
}

export function AtsScorecard({ evaluation }: AtsScorecardProps) {
  const { scores, keywords, issues, recommendations } = evaluation;
  const overall = scores.overall.score;

  const getScoreColor = (val: number) => {
    if (val >= 80) return '#10b981'; // Green
    if (val >= 65) return '#8b5cf6'; // Purple / Accent
    return '#f59e0b'; // Amber
  };

  const scoreColor = getScoreColor(overall);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginTop: '2rem' }}>
      {/* Top Header & Overall Meter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: '100px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
            <span>⚡</span> ATS Intelligent Scoring (Phase 5)
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
            Resume <span className="text-gradient">Readiness Scorecard</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Evaluated against the target job posting using deterministic rule verification & keyword density.
          </p>
        </div>

        {/* Circular Gauge / Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'rgba(0,0,0,0.3)', padding: '0.85rem 1.5rem', borderRadius: 'var(--radius-md)', border: `1px solid ${scoreColor}40` }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
              {overall}<span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>/100</span>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: scoreColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
              {scores.overall.label}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Score Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Parsing Compatibility */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
            Parsing Compatibility (35%)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
            {scores.parsing_compatibility.score}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Clean structure & header formatting
          </div>
        </div>

        {/* Job Match */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
            Job Match Alignment (40%)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getScoreColor(scores.job_match.score) }}>
            {scores.job_match.score}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {keywords.matched.length} matched / {keywords.matched.length + keywords.missing.length} keywords
          </div>
        </div>

        {/* Factual Grounding */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
            Factual Grounding (25%)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
            {scores.grounding.score}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Verified against master resume
          </div>
        </div>
      </div>

      {/* Keywords Alignment Section */}
      <div style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🎯</span> Key Skill & Technology Alignment
        </h3>

        {/* Matched Keywords */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            ✓ Matched Keywords ({keywords.matched.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {keywords.matched.length > 0 ? (
              keywords.matched.map((kw, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '100px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#34d399',
                    fontSize: '0.825rem',
                    fontWeight: 500
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {kw}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No explicit keywords matched yet.</span>
            )}
          </div>
        </div>

        {/* Missing Keywords */}
        {keywords.missing.length > 0 && (
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              ! Missing Job Requirements ({keywords.missing.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {keywords.missing.map((kw, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '100px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    color: '#fbbf24',
                    fontSize: '0.825rem',
                    fontWeight: 500
                  }}
                >
                  <span>•</span>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendations & Optimization Tips */}
      {recommendations && recommendations.length > 0 && (
        <div style={{ padding: '1.25rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>💡</span> Tailoring Recommendation
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {evaluation.disclaimer && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1.25rem', textAlign: 'center', fontStyle: 'italic' }}>
          {evaluation.disclaimer}
        </div>
      )}
    </div>
  );
}
