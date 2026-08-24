"use client"
import { useCallback, useRef, useState } from 'react'

type Status = 'idle' | 'dragging' | 'selected' | 'analyzing' | 'done' | 'error'

const ANALYZE_PHASES = [
  { label: '텍스트 추출 중', to: 30 },
  { label: '경력 · 스킬 구조화 중', to: 68 },
  { label: '강점 요약 중', to: 92 },
]

const STEPS = ['이력서 업로드', 'AI 분석', '프로필 편집', '공고 매칭']
const CURRENT_STEP = 0 // 이 화면은 1단계

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export default function ResumeUpload() {
  const [status, setStatus] = useState<Status>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [phaseLabel, setPhaseLabel] = useState('')
  const [profile, setProfile] = useState<any | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const acceptFile = useCallback((f: File | undefined | null) => {
    if (!f) return
    if (!/\.(pdf|docx)$/i.test(f.name)) {
      setStatus('error')
      return
    }
    setFile(f)
    setStatus('selected')
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    acceptFile(e.dataTransfer.files?.[0])
  }
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current += 1
    if (status === 'idle') setStatus('dragging')
  }
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0 && status === 'dragging') setStatus('idle')
  }

  const reset = () => {
    setStatus('idle')
    setFile(null)
    setProgress(0)
  }

  // Drives the visual progress bar smoothly while the real request is in flight.
  // Caps at 92% until the response actually returns, then jumps to 100%.
  function startFakeProgress() {
    let phaseIdx = 0
    let p = 0
    const tick = () => {
      const phase = ANALYZE_PHASES[Math.min(phaseIdx, ANALYZE_PHASES.length - 1)]
      setPhaseLabel(phase.label)
      p = Math.min(p + 2, phase.to)
      setProgress(p)
      if (p >= phase.to && phaseIdx < ANALYZE_PHASES.length - 1) phaseIdx += 1
      if (p < 92) timer = setTimeout(tick, 60)
    }
    let timer = setTimeout(tick, 60)
    return () => clearTimeout(timer)
  }

  async function runAnalysis() {
    if (!file) return
    setStatus('analyzing')
    setProgress(0)
    const stopFakeProgress = startFakeProgress()

    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/resume/analyze', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('분석 실패')
      const data = await res.json()
      stopFakeProgress()
      setProgress(100)
      setProfile(data.profile)
      try {
        window.localStorage.setItem('careerProfile', JSON.stringify(data.profile || {}))
      } catch {}
      setStatus('done')
    } catch (err) {
      stopFakeProgress()
      console.error(err)
      setStatus('error')
    }
  }

  function goToProfile() {
    window.location.href = '/profile'
  }

  return (
    <div className="upload-wrap">
      <ol className="stepper">
        {STEPS.map((label, idx) => (
          <li key={label} className="stepper-item">
            <span
              className={`stepper-dot ${idx === CURRENT_STEP ? 'stepper-dot--current' : idx < CURRENT_STEP ? 'stepper-dot--done' : ''}`}
            />
            <span className={`stepper-label ${idx === CURRENT_STEP ? 'stepper-label--current' : ''}`}>{label}</span>
            {idx < STEPS.length - 1 && <span className="stepper-line" />}
          </li>
        ))}
      </ol>

      <div className="card upload-card">
        <div className="eyebrow">STEP 1 · AI 커리어 분석</div>
        <h1 className="title">이력서를 업로드해주세요</h1>
        <p className="subtitle">정확히 분석할수록 더 잘 맞는 공고를 찾아드려요. PDF 또는 DOCX 파일이면 충분해요.</p>

      {(status === 'idle' || status === 'dragging' || status === 'error') && (
        <div
          className={`dropzone ${status === 'dragging' ? 'dropzone--active' : ''} ${status === 'error' ? 'dropzone--error' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="visually-hidden"
            onChange={(e) => acceptFile(e.target.files?.[0])}
          />
          {status === 'error' ? (
            <>
              <p className="dropzone-title dropzone-title--error">PDF 또는 DOCX 파일만 업로드할 수 있어요</p>
              <p className="muted">다른 파일을 다시 선택해주세요</p>
            </>
          ) : (
            <>
              <p className="dropzone-title">파일을 끌어다 놓거나 클릭해서 선택하세요</p>
              <p className="muted">PDF, DOCX · 최대 10MB</p>
            </>
          )}
        </div>
      )}

      {status === 'selected' && file && (
        <div className="file-chip">
          <div className="file-chip-info">
            <p className="file-chip-name">{file.name}</p>
            <p className="muted">{formatSize(file.size)}</p>
          </div>
          <button type="button" className="link-btn" onClick={reset}>다시 선택</button>
        </div>
      )}

      {status === 'analyzing' && (
        <div className="analyzing">
          <div className="analyzing-icon">
            <div className="scan-beam" />
          </div>
          <div className="muted" style={{ marginBottom: 4 }}>{phaseLabel || '분석 시작 중'}</div>
          <div className="progress-number">{progress}%</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="done-state">
          <div className="seal">✓</div>
          <p className="done-title">분석이 완료됐어요</p>
          <p className="muted">{file?.name} 에서 경력 · 스킬 · 강점을 정리했어요</p>
        </div>
      )}

      {status !== 'analyzing' && status !== 'done' && (
        <div className="trust-row">🔒 업로드한 파일은 분석 후 안전하게 보호되며, 동의 없이 공유되지 않아요</div>
      )}

      <div style={{ marginTop: 24 }}>
        {status === 'selected' && (
          <button type="button" className="btn btn--primary btn--full" onClick={runAnalysis}>
            AI 분석 시작하기
          </button>
        )}
        {(status === 'idle' || status === 'dragging') && (
          <button type="button" className="btn btn--primary btn--full" disabled>
            AI 분석 시작하기
          </button>
        )}
        {status === 'error' && (
          <button type="button" className="btn btn--secondary btn--full" onClick={reset}>
            다시 시도하기
          </button>
        )}
        {status === 'done' && (
          <button type="button" className="btn btn--primary btn--full" onClick={goToProfile}>
            프로필 편집하러 가기 →
          </button>
        )}
        </div>
      </div>
    </div>
  )
}