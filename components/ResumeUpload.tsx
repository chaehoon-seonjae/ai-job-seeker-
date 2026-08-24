"use client"
import { useState } from 'react'

export default function ResumeUpload(){
  const [fileName,setFileName]=useState<string|undefined>()
  const [loading,setLoading]=useState(false)
  const [profile,setProfile]=useState<any|null>(null)

  async function onSubmit(e:React.FormEvent){
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const input = form.querySelector('input[type=file]') as HTMLInputElement
    if(!input.files || input.files.length===0) return
    const file = input.files[0]
    setFileName(file.name)
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    try{
      const res = await fetch('/api/resume/analyze', { method: 'POST', body: fd })
      if(!res.ok) throw new Error('분석 실패')
      const data = await res.json()
      setProfile(data.profile)
      try{
        // save profile to localStorage for edit flow
        window.localStorage.setItem('careerProfile', JSON.stringify(data.profile || {}))
        // navigate to profile edit page
        window.location.href = '/profile'
      }catch(e){}
    }catch(err){
      alert('이력서 분석 중 문제가 발생했습니다.')
      console.error(err)
    }finally{setLoading(false)}
  }

  return (
    <div className="card">
      <form onSubmit={onSubmit}>
        <div style={{marginBottom:12}}>
          <input name="file" type="file" accept=".pdf,.docx" />
        </div>
        <div className="flex">
          <button className="btn" type="submit" disabled={loading}>{loading? '이력서를 분석하고 있어요...':'이력서 업로드'}</button>
          {fileName && <div className="muted">{fileName}</div>}
        </div>
      </form>

      {profile && (
        <div style={{marginTop:16}}>
          <h3>AI가 분석한 내 경력</h3>
          <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(profile,null,2)}</pre>
          <div style={{marginTop:8}}>
            <a href="#" onClick={(e)=>{e.preventDefault(); window.location.href='/jobs' }}>다음</a>
          </div>
        </div>
      )}
    </div>
  )
}
