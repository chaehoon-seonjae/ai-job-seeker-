import { NextResponse } from 'next/server'
import { extractTextFromBuffer } from '../../../../lib/resume'
import { analyzeResumeText } from '../../../../lib/openai'

export async function POST(req: Request) {
  try{
    // App Router의 Request는 웹 표준 FormData를 네이티브 지원 (formidable 불필요)
    const formData = await req.formData()
    const file = formData.get('file')
    if(!file || typeof file === 'string') return NextResponse.json({ error: 'no file' }, { status:400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const text = await extractTextFromBuffer(buf, file.name || 'resume')

    // analyze with OpenAI (or mock)
    const profile = await analyzeResumeText(text)

    // do not store file or full text
    return NextResponse.json({ profile })
  }catch(err){
    console.error('resume analyze error', err)
    const debug = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production'
    const body: any = { error: '이력서 분석 중 문제가 발생했습니다.' }
    if (debug) body.errorDetail = String(err && (err.stack || err.message || err))
    return NextResponse.json(body, { status:500 })
  }
}
