import { NextResponse } from 'next/server'
import { analyzeResumeText } from '../../../../lib/openai'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const text = body.text
    if (!text) return NextResponse.json({ error: 'no text' }, { status: 400 })

    const profile = await analyzeResumeText(text)
    return NextResponse.json({ profile })
  } catch (err) {
    console.error('analyze_text error', err)
    const debug = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production'
    const body: any = { error: '이력서 분석 중 문제가 발생했습니다.' }
    if (debug) body.errorDetail = String(err && (err.stack || err.message || err))
    return NextResponse.json(body, { status: 500 })
  }
}
