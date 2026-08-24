"use client"
import { useState } from 'react'

const STEPS = ['이력서 업로드', 'AI 분석', '프로필 편집', '공고 매칭', '지원 포인트']
const CURRENT_STEP = 3 // 이 화면은 4단계 (업로드·분석·프로필 편집은 완료된 상태)

function Stepper() {
  return (
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
  )
}

export default function JobsPage(){
  const [keyword,setKeyword]=useState('Backend Developer')
  const [location,setLocation]=useState('서울')
  const [negative,setNegative]=useState('파견직,계약직')
  const [limit,setLimit]=useState(10)
  const [loading,setLoading]=useState(false)
  const [jobs,setJobs]=useState<any[]|null>(null)
  const [analysisMap,setAnalysisMap] = useState<Record<string, any>>({})
  const [analyzingIds,setAnalyzingIds] = useState<Record<string,boolean>>({})

  async function onSearch(e:React.FormEvent){
    e.preventDefault()
    setLoading(true)
    try{
      const profileRaw = window.localStorage.getItem('careerProfile')
      const profile = profileRaw ? JSON.parse(profileRaw) : {}
      const res = await fetch('/api/jobs/match',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ profile, keyword, location, negative: negative.split(',').map(s=>s.trim()).filter(Boolean), limit })
      })
      if(!res.ok) throw new Error('검색 실패')
      const data = await res.json()
      setJobs(data.jobs||[])
    }catch(err){
      alert('공고 검색 중 문제가 발생했습니다.')
      console.error(err)
    }finally{setLoading(false)}
  }

  return (
    <main className="upload-wrap">
      <Stepper />

      <div className="card upload-card">
        <div className="eyebrow">STEP 4 · 공고 매칭</div>
        <h1 className="title">희망 조건을 알려주세요</h1>
        <p className="subtitle">프로필과 희망 조건을 바탕으로 잘 맞는 공고를 찾아드려요.</p>

        <form onSubmit={onSearch}>
          <div className="field">
            <label className="field-label" htmlFor="keyword">희망 직무</label>
            <input id="keyword" className="text-input" value={keyword} onChange={e=>setKeyword(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="location">희망 지역</label>
            <input id="location" className="text-input" value={location} onChange={e=>setLocation(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="negative">제외 조건</label>
            <p className="field-helper">콤마(,)로 구분해서 입력하세요</p>
            <input id="negative" className="text-input" value={negative} onChange={e=>setNegative(e.target.value)} />
          </div>
          <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
            {loading? '나에게 맞는 채용공고를 찾고 있어요...':'공고 찾아보기'}
          </button>
        </form>
      </div>

      <section style={{marginTop:24}}>
        {jobs && (
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}>
            <div className="score-info">
              <span className="muted">매칭점수 계산 방식</span>
              <button type="button" className="info-btn" aria-label="매칭점수 계산 방식 보기">i</button>
              <div className="tooltip-panel" role="tooltip">
                <p className="tooltip-title">매칭점수 계산 방식 (0~100)</p>
                <div className="tooltip-row"><span>기본 점수</span><b>35</b></div>
                <div className="tooltip-row"><span>직무 키워드 일치</span><b>+12/개 · 최대 25</b></div>
                <div className="tooltip-row"><span>도구·스킬 일치</span><b>+5/개 · 최대 20</b></div>
                <div className="tooltip-row"><span>산업 키워드 일치</span><b>+5/개 · 최대 10</b></div>
                <div className="tooltip-row"><span>희망 지역 일치</span><b>+10</b></div>
                <div className="tooltip-row"><span>경력 조건 명시 공고</span><b>+5</b></div>
                <div className="tooltip-row"><span>신입 공고 (경력 3년↑)</span><b>−15</b></div>
                <div className="tooltip-row"><span>제외 조건 감지</span><b>−30</b></div>
                <p className="tooltip-note">공고 요약 텍스트와 키워드를 비교한 규칙 기반 점수예요</p>
              </div>
            </div>
          </div>
        )}
        {jobs ? (
          jobs.map((j,i)=> (
            <div key={j.id||i} className="job-card">
              <div style={{display:'flex',justifyContent:'space-between',gap:12}}>
                <div>
                  <strong>{j.title}</strong>
                  <div className="muted">{j.company} · {j.location}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <span className="match-badge">매칭점수 {j.score ?? 'N/A'}</span>
                  {j.url && j.url !== '#' && (
                    <div style={{marginTop:10}}>
                      <a className="btn btn--secondary" href={j.url} target="_blank" rel="noopener noreferrer">공고 확인하러 가기 ↗</a>
                    </div>
                  )}
                  <div style={{marginTop:8}}>
                    <button className="btn btn--secondary" disabled={!!analyzingIds[j.id]} onClick={async ()=>{
                      try{
                        setAnalyzingIds(s=>({...s,[j.id]:true}))
                        const profileRaw = window.localStorage.getItem('careerProfile')
                        const profile = profileRaw ? JSON.parse(profileRaw) : {}
                        const r = await fetch('/api/jobs/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ profile, job: j })})
                        const d = await r.json()
                        setAnalysisMap(s=>({...s,[j.id]: d.analysis || d}))
                      }catch(e){
                        alert('상세 분석 중 문제가 발생했습니다.')
                        console.error(e)
                      }finally{ setAnalyzingIds(s=>{ const ns={...s}; delete ns[j.id]; return ns }) }
                    }}>{analyzingIds[j.id] ? '이 공고와 내 경력을 비교하고 있어요...':'상세 분석'}</button>
                  </div>
                </div>
              </div>
              {analysisMap[j.id] && (
                <div style={{marginTop:16,borderTop:'1px solid var(--border)',paddingTop:16}}>
                  <h4>왜 이 공고가 잘 맞나요?</h4>
                  <ul className="analysis-list">
                    {(analysisMap[j.id].matchedStrengths||[]).map((s:string,i:number)=>(<li key={i}>✓ {s}</li>))}
                  </ul>
                  <h4>확인할 부분</h4>
                  <ul className="analysis-list">
                    {(analysisMap[j.id].gaps||[]).map((s:string,i:number)=>(<li key={i}>△ {s}</li>))}
                  </ul>
                  <h4>지원할 때 강조하세요</h4>
                  <ol className="analysis-list">
                    {(analysisMap[j.id].resumeHighlights||[]).map((s:string,i:number)=>(<li key={i}>{i+1}. {s}</li>))}
                  </ol>
                  <h4>지원 전 준비하면 좋은 것</h4>
                  <ul className="analysis-list">
                    {(analysisMap[j.id].preparationPoints||[]).map((s:string,i:number)=>(<li key={i}>• {s}</li>))}
                  </ul>
                  <div style={{marginTop:8}}>
                    <strong>추천: </strong>
                    {analysisMap[j.id].recommendation === 'STRONG_APPLY' ? '🟢 적극 지원' : analysisMap[j.id].recommendation === 'REVIEW_AND_APPLY' ? '🟡 조건 확인 후 지원' : '⚪ 우선순위 낮음'}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="muted" style={{textAlign:'center'}}>검색 전입니다.</p>
        )}
      </section>
    </main>
  )
}
