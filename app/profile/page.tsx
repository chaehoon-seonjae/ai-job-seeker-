"use client"
import { useEffect, useState } from 'react'

export default function ProfilePage(){
  const [profile,setProfile] = useState<any>({})

  useEffect(()=>{
    try{
      const raw = window.localStorage.getItem('careerProfile')
      if(raw) setProfile(JSON.parse(raw))
    }catch(e){}
  },[])

  function updateField(key:string, value:any){
    setProfile((p:any)=>{ const np = {...p, [key]: value}; return np })
  }

  function saveAndNext(){
    try{ window.localStorage.setItem('careerProfile', JSON.stringify(profile)) }catch(e){}
    window.location.href = '/jobs'
  }

  return (
    <main>
      <h2>내 경력 확인 / 수정</h2>
      <div className="card">
        <div style={{marginBottom:8}}>
          <label>주요 직무</label>
          <input value={profile.primaryRole||''} onChange={e=>updateField('primaryRole', e.target.value)} />
        </div>
        <div style={{marginBottom:8}}>
          <label>경력(년)</label>
          <input type="number" value={profile.experienceYears||''} onChange={e=>updateField('experienceYears', Number(e.target.value)||null)} />
        </div>
        <div style={{marginBottom:8}}>
          <label>기술 (콤마 구분)</label>
          <input value={(profile.skills||[]).join(', ')} onChange={e=>updateField('skills', e.target.value.split(',').map((s:any)=>s.trim()).filter(Boolean))} />
        </div>
        <div style={{marginBottom:8}}>
          <label>산업 경험 (콤마)</label>
          <input value={(profile.industries||[]).join(', ')} onChange={e=>updateField('industries', e.target.value.split(',').map((s:any)=>s.trim()).filter(Boolean))} />
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn" onClick={saveAndNext}>다음</button>
        </div>
      </div>
    </main>
  )
}
