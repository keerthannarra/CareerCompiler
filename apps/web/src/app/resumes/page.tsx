'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { AtsScorecard, AtsEvaluation } from '../../components/AtsScorecard';

type MasterResumeItem = {
  id: string;
  display_name: string;
  checksum: string;
  created_at: string;
  profile_status: string;
};

type CompiledDocumentItem = {
  id: string;
  status: string;
  created_at: string;
  master_resume_id: string | null;
  master_resume_title: string;
  job_id: string | null;
  job_title: string;
  ats_score: number | null;
  has_pdf: boolean;
};

export default function ResumesHistoryPage() {
  const [activeTab, setActiveTab] = useState<'variants' | 'masters'>('variants');
  const [masterResumes, setMasterResumes] = useState<MasterResumeItem[]>([]);
  const [documents, setDocuments] = useState<CompiledDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<AtsEvaluation | null>(null);
  const [evalModalLoading, setEvalModalLoading] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mastersRes, docsRes] = await Promise.all([
        fetch('/api/master-resumes'),
        fetch('/api/documents'),
      ]);

      if (mastersRes.ok) {
        const mastersData = await mastersRes.json();
        setMasterResumes(mastersData);
      }

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData);
      }
    } catch (err) {
      console.error('Failed to load history data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteMaster = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will delete linked tailored variants.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/master-resumes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMasterResumes(prev => prev.filter(m => m.id !== id));
        setDocuments(prev => prev.filter(d => d.master_resume_id !== id));
      } else {
        alert('Failed to delete master resume.');
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tailored variant?')) {
      return;
    }
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
      } else {
        alert('Failed to delete document.');
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleOpenScorecard = async (docId: string) => {
    setEvalModalLoading(true);
    setSelectedEvaluation(null);
    try {
      const res = await fetch(`/api/documents/${docId}/evaluation`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEvaluation(data);
      } else {
        alert('Failed to load ATS evaluation for this document.');
      }
    } catch (err) {
      console.error('Error fetching evaluation', err);
    } finally {
      setEvalModalLoading(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getScoreBadgeColor = (score: number | null) => {
    if (score === null) return { bg: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', border: 'var(--color-border)' };
    if (score >= 80) return { bg: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
    if (score >= 65) return { bg: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: 'rgba(139, 92, 246, 0.3)' };
    return { bg: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: '100px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid var(--color-primary)', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
            <span>📁</span> Resume Portfolio & History
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            My <span className="text-gradient">Resumes & Applications</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>
            Manage authoritative master profiles and track compiled ATS-tailored variants.
          </p>
        </div>

        <a href="/">
          <Button style={{ padding: '0.75rem 1.4rem' }}>
            Upload New Resume
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Button>
        </a>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('variants')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'variants' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'variants' ? 'var(--color-text)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'variants' ? 600 : 400,
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>🎯</span> Tailored Variants ({documents.length})
        </button>

        <button
          onClick={() => setActiveTab('masters')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'masters' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'masters' ? 'var(--color-text)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'masters' ? 600 : 400,
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>📄</span> Master Resumes ({masterResumes.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <div>Loading your resume portfolio...</div>
        </div>
      ) : activeTab === 'variants' ? (
        /* ── TAB 1: TAILORED VARIANTS ── */
        documents.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Tailored Variants Yet</h3>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
              Upload a master resume and paste a job description to generate your first ATS-tailored resume variant.
            </p>
            <a href="/">
              <Button>Upload & Tailor First Resume</Button>
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {documents.map((doc) => {
              const badge = getScoreBadgeColor(doc.ats_score);
              return (
                <div key={doc.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                      📑
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
                          {doc.job_title}
                        </h3>
                        {doc.ats_score !== null && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '100px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                            {doc.ats_score}% ATS Match
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: doc.status === 'complete' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: doc.status === 'complete' ? '#34d399' : '#f87171' }}>
                          {doc.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span>Source: <strong style={{ color: 'var(--color-text)' }}>{doc.master_resume_title}</strong></span>
                        <span>•</span>
                        <span>Generated: {formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {doc.has_pdf && (
                      <a href={`/api/documents/${doc.id}/download`} download>
                        <Button style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                          Download PDF
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </Button>
                      </a>
                    )}

                    <Button
                      variant="secondary"
                      onClick={() => handleOpenScorecard(doc.id)}
                      style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem' }}
                    >
                      ATS Scorecard
                    </Button>

                    {doc.has_pdf && (
                      <Button
                        variant="outline"
                        onClick={() => setPreviewDocId(doc.id)}
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem' }}
                      >
                        Preview
                      </Button>
                    )}

                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      title="Delete Variant"
                      style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', color: 'var(--color-text-muted)', cursor: 'pointer', transition: 'color 0.2s ease' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── TAB 2: MASTER RESUMES ── */
        masterResumes.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Master Resumes Uploaded</h3>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
              Upload your canonical master resume PDF to establish your authoritative experience profile.
            </p>
            <a href="/">
              <Button>Upload Master Resume</Button>
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {masterResumes.map((master) => (
              <div key={master.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                      📋
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px', background: master.profile_status === 'complete' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: master.profile_status === 'complete' ? '#34d399' : '#fbbf24' }}>
                      {master.profile_status === 'complete' ? 'READY' : master.profile_status.toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {master.display_name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                    Uploaded {formatDate(master.created_at)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <a href={`/jobs/${master.id}`} style={{ flex: 1 }}>
                    <Button style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}>
                      Tailor for New Job
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Button>
                  </a>

                  <button
                    onClick={() => handleDeleteMaster(master.id, master.display_name)}
                    title="Delete Master Resume"
                    style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.55rem', color: 'var(--color-text-muted)', cursor: 'pointer', transition: 'color 0.2s ease' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── ATS SCORECARD MODAL ── */}
      {(selectedEvaluation || evalModalLoading) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
            <button
              onClick={() => setSelectedEvaluation(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', cursor: 'pointer' }}
            >
              ✕
            </button>

            {evalModalLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                <div>Computing live ATS scorecard...</div>
              </div>
            ) : selectedEvaluation ? (
              <AtsScorecard evaluation={selectedEvaluation} />
            ) : null}
          </div>
        </div>
      )}

      {/* ── PDF INLINE PREVIEW MODAL ── */}
      {previewDocId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>PDF Document Preview</div>
              <button
                onClick={() => setPreviewDocId(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>
            <iframe
              src={`/api/documents/${previewDocId}/download`}
              style={{ flex: 1, width: '100%', border: 'none' }}
              title="Tailored Resume Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
