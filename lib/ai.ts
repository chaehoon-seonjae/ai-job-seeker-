import { generateText, Output, LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogle } from '@ai-sdk/google'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { z } from 'zod'

const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-opus-5',
  google: 'gemini-2.5-flash'
}

// AI_PROVIDER/AI_MODEL env로 제공자 선택. 키가 없으면 null 반환 → mock 동작
function getModel(): LanguageModel | null {
  const provider = process.env.AI_PROVIDER || 'openai'
  const modelId = process.env.AI_MODEL || DEFAULT_MODELS[provider]

  switch (provider) {
    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) return null
      return createOpenAI({ apiKey })(modelId)
    }
    case 'anthropic': {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) return null
      return createAnthropic({ apiKey })(modelId)
    }
    case 'google': {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
      if (!apiKey) return null
      return createGoogle({ apiKey })(modelId)
    }
    case 'ollama': {
      const baseURL = process.env.OLLAMA_BASE_URL
      if (!baseURL) return null
      if (!modelId) throw new Error('AI_PROVIDER=ollama일 때는 AI_MODEL을 반드시 설정해야 합니다.')
      // supportsStructuredOutputs: json_schema를 전달해 소형 모델도 스키마를 지키게 함 (Ollama 0.5+ 지원)
      return createOpenAICompatible({ name: 'ollama', baseURL, supportsStructuredOutputs: true })(modelId)
    }
    default:
      throw new Error(`알 수 없는 AI_PROVIDER: "${provider}" (openai | anthropic | google | ollama 중 하나여야 합니다)`)
  }
}

const careerProfileSchema = z.object({
  primaryRole: z.string().nullable(),
  experienceYears: z.number().nullable(),
  skills: z.array(z.string()),
  industries: z.array(z.string()),
  tools: z.array(z.string()),
  projectExperience: z.array(z.string()),
  strengths: z.array(z.string()),
  keywords: z.array(z.string())
})

const jobAnalysisSchema = z.object({
  matchedStrengths: z.array(z.string()),
  gaps: z.array(z.string()),
  resumeHighlights: z.array(z.string()),
  preparationPoints: z.array(z.string()),
  recommendation: z.enum(['STRONG_APPLY', 'REVIEW_AND_APPLY', 'LOW_PRIORITY']),
  summary: z.string()
})

export async function analyzeResumeText(text: string) {
  const model = getModel()
  if (!model) {
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

  const result = await generateText({
    model,
    system: '당신은 이력서를 구조적으로 분석하는 Career Profile Analyzer입니다.',
    prompt: `이력서 텍스트:\n${text}\n\n이력서에서 파악한 내용을 구조화해 반환하세요. 모르면 null 또는 []로.`,
    output: Output.object({ schema: careerProfileSchema })
  })
  return result.output
}

export async function analyzeJobAgainstProfile(profile: any, job: any) {
  const model = getModel()
  if (!model) {
    return {
      matchedStrengths: [],
      gaps: [],
      resumeHighlights: [],
      preparationPoints: [],
      recommendation: 'REVIEW_AND_APPLY',
      summary: '모의 분석 결과입니다.'
    }
  }

  const result = await generateText({
    model,
    system: 'You are a career coach.',
    prompt: `당신은 Career Coach입니다.\n\nCandidate:\n${JSON.stringify(profile, null, 2)}\n\nJob Posting:\n${JSON.stringify(job, null, 2)}\n\n후보자와 공고를 비교 분석하세요. 임의로 만들지 마세요.`,
    output: Output.object({ schema: jobAnalysisSchema })
  })
  return result.output
}
