import { NextResponse } from 'next/server'
import { buildSearchTextFromProfile, runKSkillMatch } from '../../../../lib/jobMatch'

export async function POST(req: Request){
  try{
    const body = await req.json()
    const profile = body.profile || {}
    const keyword = body.keyword || 'Backend Developer'
    const location = body.location
    const negatives = body.negative || []
    const limit = body.limit || 10

    const resumeText = buildSearchTextFromProfile(profile)

    // try to run k-skill; if it fails, return mock data for development
    try{
      const raw = runKSkillMatch({ resumeText, keyword, location, negatives, limit })
      // normalize results: assume raw.jobs or raw.results
      const items = raw.postings || raw.jobs || raw.results || []
      const jobs = items.map((it:any, idx:number)=>({
        id: it.id || it.posting_id || String(idx),
        title: it.title || it.job_title || 'Unknown',
        company: it.company || it.org || '',
        score: it.score ?? it.match_score ?? null,
        location: it.location || it.addr || it.region || '',
        experience: it.career || it.experience || '',
        url: it.url || it.link || '',
        reasons: it.reasons || it.match_reasons || [],
        cautions: it.cautions || [],
        highlights: it.matched_terms || [],
        raw: it
      }))
      jobs.sort((a:any,b:any)=> (b.score||0) - (a.score||0))
      return NextResponse.json({ jobs })
    }catch(e:any){
      console.error('k-skill run failed', e)
      // mock jobs
      const mock = Array.from({length: Math.min(10, limit)}).map((_,i)=>({
        id: `mock-${i+1}`,
        title: `${keyword} 포지션 예시 ${i+1}`,
        company: `회사 ${i+1}`,
        score: Math.round(80 - i*3),
        location: location || '서울',
        url: '#',
        raw: {}
      }))
      const debug = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production'
      const resp: any = { jobs: mock, error: String(e.message || e) }
      if (debug) resp.errorDetail = String(e && (e.stack || e.message || e))
      return NextResponse.json(resp)
    }
  }catch(err){
    console.error(err)
    const debug = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production'
    const body: any = { error: '공고 검색 중 문제가 발생했습니다.' }
    if (debug) body.errorDetail = String(err && (err.stack || err.message || err))
    return NextResponse.json(body, { status:500 })
  }
}
