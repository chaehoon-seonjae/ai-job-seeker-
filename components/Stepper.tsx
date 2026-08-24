"use client"
import { useState } from 'react'

const STEPS = ['이력서 업로드', 'AI 분석', '프로필 편집', '공고 매칭']
// 클릭 시 이동할 수 있는 단계만 정의 (AI 분석은 별도 화면이 없음)
const STEP_LINKS: Record<number, string> = { 0: '/', 2: '/profile', 3: '/jobs' }

export default function Stepper({ current }: { current: number }) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  function goTo(idx: number) {
    if (idx === 0) {
      // 첫 화면 이동은 처음부터 다시 시작을 의미하므로 확인 후 프로필 초기화
      setConfirmOpen(true)
      return
    }
    window.location.href = STEP_LINKS[idx]
  }

  function restart() {
    try { window.localStorage.removeItem('careerProfile') } catch (e) {}
    window.location.href = '/'
  }

  return (
    <>
      <ol className="stepper">
        {STEPS.map((label, idx) => {
          const clickable = idx < current && STEP_LINKS[idx] !== undefined
          return (
            <li key={label} className="stepper-item">
              <span
                className={`stepper-dot ${idx === current ? 'stepper-dot--current' : idx < current ? 'stepper-dot--done' : ''}`}
              />
              {clickable ? (
                <button type="button" className="stepper-label stepper-label--link" onClick={() => goTo(idx)}>
                  {label}
                </button>
              ) : (
                <span className={`stepper-label ${idx === current ? 'stepper-label--current' : ''}`}>{label}</span>
              )}
              {idx < STEPS.length - 1 && <span className="stepper-line" />}
            </li>
          )
        })}
      </ol>

      {confirmOpen && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="restart-title" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title" id="restart-title">처음부터 다시 시작할까요?</h2>
            <p className="modal-desc">저장된 프로필과 분석 내용이 초기화되고, 이력서 업로드 화면으로 이동해요.</p>
            <div className="modal-actions">
              <button type="button" className="btn btn--secondary" onClick={() => setConfirmOpen(false)}>취소</button>
              <button type="button" className="btn btn--primary" onClick={restart}>다시 시작하기</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
