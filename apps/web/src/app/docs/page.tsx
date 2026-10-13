import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Architecture & Documentation — CareerCompiler',
  description: 'Technical architecture, asynchronous message pipeline, ATS scoring methodology, and API reference for CareerCompiler.',
};

export default function DocsPage() {
  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '100px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid var(--color-primary)', fontSize: '0.8rem', color: 'var(--color-primary)', marginBottom: '1rem', fontWeight: 600 }}>
          Developer & System Reference
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>
          Platform <span className="text-gradient">Documentation</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '720px', lineHeight: 1.6 }}>
          Comprehensive architectural guide to CareerCompiler: the asynchronous microservice pipeline, evidence-grounded tailoring engine, and ATS evaluation platform.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⚡</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Asynchronous Execution</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Heavy NLP parsing, LLM tailoring, and PDF compilation tasks are offloaded to dedicated Celery workers via Redis message brokers.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>🎯</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Zero Hallucination</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Every modification is strictly anchored to verified claims in your master resume. The system forbids generating ungrounded facts or invented skills.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>📊</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>ATS Compatibility</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Composite evaluation engine combining 35% parsing structure, 40% job requirements match, and 25% verifiable claim grounding.
          </p>
        </div>
      </div>

      {/* Pipeline Diagram */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1rem' }}>End-to-End Pipeline Flow</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)', minWidth: '80px' }}>Step 1:</span>
            <div>
              <strong style={{ color: 'var(--color-text)' }}>Master Resume Parsing</strong> — PDF is parsed and extracted using Groq LLaMA 3.3 (<code>llama-3.3-70b-versatile</code>) into a structured Canonical Profile with source tracking.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)', minWidth: '80px' }}>Step 2:</span>
            <div>
              <strong style={{ color: 'var(--color-text)' }}>Job Context Extraction</strong> — Job description text is analyzed into required technical competencies, seniority signals, and key responsibilities.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)', minWidth: '80px' }}>Step 3:</span>
            <div>
              <strong style={{ color: 'var(--color-text)' }}>Semantic Matching & Tailoring</strong> — The candidate evidence graph is aligned with the job context. Tailored bullet suggestions are generated for candidate review.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)', minWidth: '80px' }}>Step 4:</span>
            <div>
              <strong style={{ color: 'var(--color-text)' }}>Document Compilation</strong> — Approved changes are injected into our high-fidelity layout template and compiled into an ATS-parseable PDF.
            </div>
          </div>
        </div>
      </div>

      {/* Celery Queues Reference */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.5rem' }}>Distributed Task Queues (Celery + Redis)</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Tasks are routed to dedicated queues for scalable, fair asynchronous distribution:
        </p>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Task Route</th>
                <th style={{ padding: '0.75rem 1rem' }}>Target Queue</th>
                <th style={{ padding: '0.75rem 1rem' }}>Execution Mode</th>
              </tr>
            </thead>
            <tbody style={{ color: 'var(--color-text-muted)' }}>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>src.tasks.parse_resume</td>
                <td style={{ padding: '0.75rem 1rem' }}><span style={{ padding: '0.2rem 0.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '4px', color: 'var(--color-primary)' }}>parsing</span></td>
                <td style={{ padding: '0.75rem 1rem' }}>PdfParser + Groq LLM</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>src.tasks.analyze_job</td>
                <td style={{ padding: '0.75rem 1rem' }}><span style={{ padding: '0.2rem 0.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '4px', color: 'var(--color-primary)' }}>parsing</span></td>
                <td style={{ padding: '0.75rem 1rem' }}>JobAnalyzer + Groq LLM</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>src.tasks.generate_tailoring_plan</td>
                <td style={{ padding: '0.75rem 1rem' }}><span style={{ padding: '0.2rem 0.5rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '4px', color: 'var(--color-secondary)' }}>matching</span></td>
                <td style={{ padding: '0.75rem 1rem' }}>MatchingEngine + LLM Rephraser</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>src.tasks.compile_latex</td>
                <td style={{ padding: '0.75rem 1rem' }}><span style={{ padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px', color: 'var(--color-success)' }}>compilation</span></td>
                <td style={{ padding: '0.75rem 1rem' }}>Jinja2 + Headless PDF Compiler</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}># Command to launch the Celery worker:</span><br/>
          celery -A src.celery_app worker --pool=solo --loglevel=info
        </div>
      </div>

      {/* API Reference & Swagger Link */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.5rem' }}>Interactive REST API Explorer</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Access full Swagger / OpenAPI specifications for all endpoints directly on the local FastAPI backend server.
            </p>
          </div>
          <a 
            href="http://localhost:8000/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', 
              color: '#fff', 
              padding: '0.75rem 1.25rem', 
              borderRadius: 'var(--radius-sm)', 
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'opacity 0.2s ease'
            }}
          >
            Open Swagger Docs (Port 8000)
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
