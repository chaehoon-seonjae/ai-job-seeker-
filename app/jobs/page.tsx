"use client"
import { useState } from 'react'

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
      const res = await fetch('/api/jobs/match',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ keyword, location, negative: negative.split(',').map(s=>s.trim()).filter(Boolean), limit })
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
    <main>
      <h2>희망 조건</h2>
      <form onSubmit={onSearch} className="card">
        <div style={{marginBottom:8}}>
          <label>희망 직무</label>
          <input value={keyword} onChange={e=>setKeyword(e.target.value)} style={{width:'100%'}} />
        </div>
        <div style={{marginBottom:8}}>
          <label>희망 지역</label>
          <input value={location} onChange={e=>setLocation(e.target.value)} />
        </div>
        <div style={{marginBottom:8}}>
          <label>제외 조건 (콤마로 구분)</label>
          <input value={negative} onChange={e=>setNegative(e.target.value)} />
        </div>
        <div className="flex">
          <button className="btn" type="submit" disabled={loading}>{loading? '나에게 맞는 채용공고를 찾고 있어요...':'공고 찾아보기'}</button>
        </div>
      </form>

      <section style={{marginTop:16}}>
        <h3>추천 공고</h3>
        {jobs ? (
          jobs.map((j,i)=> (
            <div key={j.id||i} className="job-card">
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div>
                  <strong>{j.title}</strong>
                  <div className="muted">{j.company} · {j.location}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div>Match {j.score ?? 'N/A'}</div>
                  <div style={{marginTop:8}}>
                    <button className="btn" disabled={!!analyzingIds[j.id]} onClick={async ()=>{
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
                <div style={{marginTop:12,borderTop:'1px solid #eee',paddingTop:12}}>
                  <h4>왜 이 공고가 잘 맞나요?</h4>
                  <ul>
                    {(analysisMap[j.id].matchedStrengths||[]).map((s:string,i:number)=>(<li key={i}>✓ {s}</li>))}
                  </ul>
                  <h4>확인할 부분</h4>
                  <ul>
                    {(analysisMap[j.id].gaps||[]).map((s:string,i:number)=>(<li key={i}>△ {s}</li>))}
                  </ul>
                  <h4>지원할 때 강조하세요</h4>
                  <ol>
                    {(analysisMap[j.id].resumeHighlights||[]).map((s:string,i:number)=>(<li key={i}>{s}</li>))}
                  </ol>
                  <h4>지원 전 준비하면 좋은 것</h4>
                  <ul>
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
          <p className="muted">검색 전입니다.</p>
        )}
      </section>
    </main>
  )
}
