'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '../../../../components/Button';
import { ProgressSteps, StepStatus } from '../../../../components/ProgressSteps';

type WorkflowStep = {
  id: string;
  label: string;
  status: StepStatus;
  description?: string;
};

export default function TailorDashboard({ params }: { params: Promise<{ resumeId: string, jobId: string }> }) {
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [isFailed, setIsFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Ref to prevent strict mode double-execution issues with triggering APIs
  const planCreated = useRef(false);
  const docCreated = useRef(false);

  const [steps, setSteps] = useState<WorkflowStep[]>([
    { id: 'parse', label: 'Extracting Resume Profile', status: 'pending' },
    { id: 'job', label: 'Analyzing Job Context', status: 'pending' },
    { id: 'plan', label: 'Generating Tailoring Plan', status: 'pending' },
    { id: 'compile', label: 'Compiling PDF Document', status: 'pending' },
  ]);

  const updateStep = (id: string, status: StepStatus, description?: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, description: description || s.description } : s));
  };

  useEffect(() => {
    params.then(p => {
      setResumeId(p.resumeId);
      setJobId(p.jobId);
    });
  }, [params]);

  useEffect(() => {
    if (!resumeId || !jobId || isFailed) return;

    let isMounted = true;

    const poll = async () => {
      try {
        // 1. Poll Job & Resume
        updateStep('parse', 'running', 'Using Groq LLM to structure PDF');
        updateStep('job', 'running', 'Extracting key requirements');

        let isResumeReady = false;
        let isJobReady = false;

        while ((!isResumeReady || !isJobReady) && isMounted) {
          if (!isResumeReady) {
            const res = await fetch(`/api/master-resumes/${resumeId}`);
            const data = await res.json();
            const profileStatus = data.canonical_profile?.status;
            if (profileStatus === 'complete') {
              isResumeReady = true;
              updateStep('parse', 'complete', 'Profile extracted successfully');
            } else if (profileStatus === 'failed') {
              throw new Error('Resume parsing failed');
            }
          }

          if (!isJobReady) {
            const res = await fetch(`/api/job-descriptions/${jobId}`);
            const data = await res.json();
            if (data.status === 'complete') {
              isJobReady = true;
              updateStep('job', 'complete', 'Job requirements extracted');
            } else if (data.status === 'failed') {
              throw new Error('Job analysis failed');
            }
          }

          if (!isResumeReady || !isJobReady) {
            await new Promise(r => setTimeout(r, 2000));
          }
        }

        if (!isMounted) return;

        // 2. Trigger Tailoring Plan
        if (!planCreated.current) {
          planCreated.current = true;
          updateStep('plan', 'running', 'Mapping profile to requirements');
          
          const planRes = await fetch('/api/tailoring-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              master_resume_id: resumeId,
              job_id: jobId,
              mode: 'conservative'
            })
          });
          
          if (!planRes.ok) throw new Error('Failed to start tailoring plan');
          const planData = await planRes.json();
          const planId = planData.id;

          // Poll Tailoring Plan
          let isPlanReady = false;
          while (!isPlanReady && isMounted) {
            const res = await fetch(`/api/tailoring-plans/${planId}`);
            const data = await res.json();
            if (data.status === 'complete') {
              isPlanReady = true;
              updateStep('plan', 'complete', `Generated ${data.metadata?.total_proposed || 0} tailored bullet points`);
            } else if (data.status === 'failed') {
              throw new Error('Tailoring plan generation failed');
            } else {
              await new Promise(r => setTimeout(r, 3000));
            }
          }

          if (!isMounted) return;

          // 3. Trigger Compilation
          if (!docCreated.current) {
            docCreated.current = true;
            updateStep('compile', 'running', 'Applying changes and generating PDF');
            
            const docRes = await fetch('/api/documents/compile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tailoring_plan_id: planId,
                user_id: 'test_user'
              })
            });

            if (!docRes.ok) throw new Error('Failed to start document compilation');
            const docData = await docRes.json();
            const compiledId = docData.id;

            // Poll Compilation
            let isDocReady = false;
            while (!isDocReady && isMounted) {
              const res = await fetch(`/api/documents/${compiledId}`);
              const data = await res.json();
              if (data.status === 'complete') {
                isDocReady = true;
                setDocId(compiledId);
                updateStep('compile', 'complete', 'PDF generated successfully');
              } else if (data.status === 'failed') {
                throw new Error('PDF Compilation failed');
              } else {
                await new Promise(r => setTimeout(r, 2000));
              }
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setIsFailed(true);
          setErrorMessage(err.message || 'An unexpected error occurred');
          // Mark all running/pending as failed
          setSteps(prev => prev.map(s => (s.status === 'pending' || s.status === 'running') ? { ...s, status: 'failed' } : s));
        }
      }
    };

    poll();

    return () => {
      isMounted = false;
    };
  }, [resumeId, jobId, isFailed]);

  const isAllComplete = steps.every(s => s.status === 'complete');

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '700px', marginTop: '2rem' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Compiling <span className="text-gradient">Your Resume</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Our AI engines are working in the background to build the perfect resume.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <ProgressSteps steps={steps} />
      </div>

      {isFailed && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-sm)', color: 'var(--color-error)', textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '0.75rem' }}><strong>Process Failed:</strong> {errorMessage}</div>
          <a href="/">
            <Button variant="secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              Return to Start
            </Button>
          </a>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', opacity: isAllComplete ? 1 : 0, transform: isAllComplete ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.5s ease', pointerEvents: isAllComplete ? 'auto' : 'none' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {docId && (
            <a href={`/api/documents/${docId}/download`} download>
              <Button style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}>
                Download Tailored PDF
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </Button>
            </a>
          )}
          {resumeId && (
            <a href={`/jobs/${resumeId}`}>
              <Button variant="secondary" style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}>
                Tailor for Another Job
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </Button>
            </a>
          )}
          <a href="/">
            <Button variant="outline" style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}>
              Upload New Resume
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
