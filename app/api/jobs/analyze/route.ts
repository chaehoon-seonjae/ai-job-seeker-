import { NextResponse } from 'next/server'
import { analyzeJobAgainstProfile } from '../../../../lib/ai'

export async function POST(req: Request){
  try{
    const body = await req.json()
    const profile = body.profile || {}
    const job = body.job || {}
    const analysis = await analyzeJobAgainstProfile(profile, job)
    return NextResponse.json({ analysis })
  }catch(err){
    console.error(err)
    const debug = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production'
    const body: any = { error: '상세 분석 중 문제가 발생했습니다.' }
    if (debug) body.errorDetail = String(err && (err.stack || err.message || err))
    return NextResponse.json(body, { status:500 })
  }
}
