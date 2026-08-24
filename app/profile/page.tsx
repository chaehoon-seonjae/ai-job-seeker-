"use client"
import { useEffect, useState, KeyboardEvent } from 'react'
import Stepper from '../../components/Stepper'

const CURRENT_STEP = 2 // 이 화면은 3단계 (업로드·분석은 완료된 상태)

function TagInput({
  label,
  placeholder,
  helper,
  values,
  onChange,
}: {
  label: string
  placeholder: string
  helper?: string
  values: string[]
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function commitDraft() {
    const v = draft.trim()
    if (!v) return
    if (!values.includes(v)) onChange([...values, v])
    setDraft('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // 한글 IME 조합 중 Enter가 두 번 처리돼 마지막 음절이 별도 태그로 남는 것 방지
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitDraft()
    } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  function removeAt(idx: number) {
    onChange(values.filter((_, i) => i !== idx))
  }

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {helper && <p className="field-helper">{helper}</p>}
      <div className="tag-input">
        {values.map((v, idx) => (
          <span key={v} className="tag-chip">
            {v}
            <button type="button" aria-label={`${v} 삭제`} onClick={() => removeAt(idx)}>
              ×
            </button>
          </span>
        ))}
        <input
          className="tag-input-field"
          value={draft}
          placeholder={values.length === 0 ? placeholder : ''}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commitDraft}
        />
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('careerProfile')
      if (raw) setProfile(JSON.parse(raw))
    } catch (e) {}
    setLoaded(true)
  }, [])

  function updateField(key: string, value: any) {
    setProfile((p: any) => ({ ...p, [key]: value }))
  }

  const canProceed = Boolean(profile.primaryRole?.trim()) && Boolean(profile.experienceYears)

  function saveAndNext() {
    if (!canProceed) return
    try {
      window.localStorage.setItem('careerProfile', JSON.stringify(profile))
    } catch (e) {}
    window.location.href = '/jobs'
  }

  function goBack() {
    window.location.href = '/'
  }

  return (
    <main className="upload-wrap">
      <Stepper current={CURRENT_STEP} />

      <div className="card upload-card">
        <div className="eyebrow">STEP 3 · 프로필 편집</div>
        <h1 className="title">AI가 정리한 내 경력이에요</h1>
        <p className="subtitle">
          {loaded && profile.primaryRole
            ? '내용을 확인하고 필요한 부분만 고쳐주세요. 정확할수록 매칭 결과가 좋아져요.'
            : '이력서에서 자동으로 채워드려요. 없는 항목은 직접 입력해주세요.'}
        </p>

        <div className="field">
          <label className="field-label" htmlFor="primaryRole">
            주요 직무
          </label>
          <input
            id="primaryRole"
            className="text-input"
            placeholder="예: 백엔드 개발자"
            value={profile.primaryRole || ''}
            onChange={(e) => updateField('primaryRole', e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="experienceYears">
            총 경력
          </label>
          <div className="text-input-suffix-wrap">
            <input
              id="experienceYears"
              className="text-input"
              type="number"
              min={0}
              placeholder="0"
              value={profile.experienceYears ?? ''}
              onChange={(e) => updateField('experienceYears', Number(e.target.value) || null)}
            />
            <span className="text-input-suffix">년</span>
          </div>
        </div>

        <TagInput
          label="보유 기술"
          helper="입력 후 Enter 또는 콤마(,)로 추가하세요"
          placeholder="예: React, SQL, 프로젝트 관리"
          values={profile.skills || []}
          onChange={(next) => updateField('skills', next)}
        />

        <TagInput
          label="산업 경험"
          placeholder="예: 커머스, 핀테크"
          values={profile.industries || []}
          onChange={(next) => updateField('industries', next)}
        />

        <div className="trust-row">🔒 입력한 정보는 매칭에만 사용되며 언제든 다시 수정할 수 있어요</div>

        <div className="profile-actions">
          <button type="button" className="btn btn--secondary" onClick={goBack}>
            이전
          </button>
          <button
            type="button"
            className="btn btn--primary btn--flex"
            disabled={!canProceed}
            onClick={saveAndNext}
          >
            다음 · 공고 찾아보기
          </button>
        </div>
      </div>
    </main>
  )
}