import { config as loadEnv } from 'dotenv'
loadEnv()
import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY
let client: OpenAI | null = null
if(apiKey){
  client = new OpenAI({ apiKey })
}

export async function analyzeResumeText(text:string){
  if(!client){
    // mock behavior when no API key
    return {
      primaryRole: null,
      experienceYears: null,
      skills: [],
      industries: [],
      tools: [],
      projectExperience: [],
      strengths: [],
      keywords: []
    }
  }

  const system = `당신은 이력서를 구조적으로 분석하는 Career Profile Analyzer입니다.`
  const user = `이력서 텍스트:\n${text}\n\nJSON으로 반환: primaryRole, experienceYears, skills, industries, tools, projectExperience, strengths, keywords. 모르면 null 또는 []로.`

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages:[{role:'system',content:system},{role:'user',content:user}],
    max_tokens:800
  })

  const raw = resp.choices?.[0]?.message?.content || ''
  try{
    const parsed = JSON.parse(raw)
    return parsed
  }catch(e){
    return { raw }
  }
}

export async function analyzeJobAgainstProfile(profile:any, job:any){
  if(!client){
    return {
      matchedStrengths: [],
      gaps: [],
      resumeHighlights: [],
      preparationPoints: [],
      recommendation: 'REVIEW_AND_APPLY',
      summary: '모의 분석 결과입니다.'
    }
  }

  const prompt = `당신은 Career Coach입니다.\n\nCandidate:\n${JSON.stringify(profile,null,2)}\n\nJob Posting:\n${JSON.stringify(job,null,2)}\n\n다음 항목을 JSON으로 반환하세요: matchedStrengths, gaps, resumeHighlights, preparationPoints, recommendation, summary. recommendation 중 하나만 사용: STRONG_APPLY, REVIEW_AND_APPLY, LOW_PRIORITY. 임의로 만들지 마세요.`

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages:[{role:'system',content:'You are a career coach.'},{role:'user',content:prompt}],
    max_tokens:800
  })

  const raw = resp.choices?.[0]?.message?.content || ''
  try{
    return JSON.parse(raw)
  }catch(e){
    return { raw }
  }
}
