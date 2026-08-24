import { NextResponse } from 'next/server'
// load formidable dynamically to avoid bundler/static-analyzer warnings
import { extractTextFromBuffer } from '../../../../lib/resume'
import { analyzeResumeText } from '../../../../lib/openai'

export async function POST(req: Request) {
  try{
    const formidableModule = await import('formidable')
    const Formidable = (formidableModule && (formidableModule.default || formidableModule)) as any
    const form = new Formidable.IncomingForm()
    // parse form manually
    const { fields, files } = await new Promise<any>((resolve,reject)=>{
      form.parse(req as any, (err, fields, files)=>{
        if(err) return reject(err)
        resolve({fields,files})
      })
    })

    const file = files.file
    if(!file) return NextResponse.json({ error: 'no file' }, { status:400 })
    // formidable gives path; read it
    const fs = require('fs')
    const buf = fs.readFileSync(file.filepath || file.path)
    const text = await extractTextFromBuffer(buf, file.originalFilename || file.name || 'resume')

    // analyze with OpenAI (or mock)
    const profile = await analyzeResumeText(text)

    // do not store file or full text
    try{ fs.unlinkSync(file.filepath || file.path) }catch(e){}

    return NextResponse.json({ profile })
  }catch(err){
    console.error('resume analyze error', err)
    const debug = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production'
    const body: any = { error: '이력서 분석 중 문제가 발생했습니다.' }
    if (debug) body.errorDetail = String(err && (err.stack || err.message || err))
    return NextResponse.json(body, { status:500 })
  }
}
