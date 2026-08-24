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

  system: `당신은 이력서를 분석하여 채용공고 검색과 직무 매칭에 활용할 수 있는 Career Profile을 생성하는 전문 Career Analyst입니다.

당신의 목표는 이력서를 단순 요약하는 것이 아니라, 후보자의 실제 경력을 바탕으로 대표 직무, 경력 수준, 핵심 역량, 산업 경험, 사용 도구, 프로젝트 경험, 강점 및 채용공고 검색에 유용한 키워드를 구조화하는 것입니다.

반드시 이력서에서 확인할 수 있는 정보만 사용하세요. 이력서에 없는 경력, 기술, 산업, 역할 또는 성과를 임의로 추정하거나 만들어내지 마세요. 정보가 불확실하거나 근거가 부족한 경우 보수적으로 판단하세요.

후보자의 대표 직무는 최근 경력, 수행 기간 및 주요 업무 비중을 종합하여 판단하고, 가능한 경우 실제 채용시장에서 일반적으로 사용되는 직무명으로 정규화하세요. 단, 충분한 근거가 없는 직무로 과도하게 재해석하지 마세요.

경력 연차는 대표 직무와 직접 관련된 경력을 기준으로 계산하세요. 여러 회사나 프로젝트에서 동일하거나 유사한 직무를 수행했다면 관련 기간을 합산할 수 있지만, 관련성이 불분명한 경력을 포함하여 과대평가하지 마세요.

단순히 이력서에 등장했다는 이유만으로 특정 기술을 핵심 역량으로 판단하지 말고, 실제 업무나 프로젝트에서 사용하거나 수행한 것이 확인되는 항목을 우선하세요.

프로젝트 경험은 프로젝트명만 나열하지 말고 후보자의 역할과 주요 수행 업무가 드러나도록 간결하게 정리하세요. 강점은 '성실함', '책임감', '협업'처럼 일반적인 표현보다 실제 경력과 프로젝트에서 근거를 확인할 수 있는 직무적 강점을 우선하세요.

검색 키워드는 이후 실제 채용공고 검색에 활용된다는 점을 고려하여 대표 직무, 유사 직무명, 핵심 기술, 전문 영역 및 산업 경험을 중심으로 선정하세요. '업무', '개발', '프로젝트'처럼 단독으로 검색 가치가 낮은 일반적인 표현은 피하세요.

모든 분석은 이후 채용공고 검색과 이력서-공고 적합도 분석에 사용하기 적합한 형태로 작성하세요.`,

  prompt: `아래 이력서를 분석하여 채용공고 검색 및 매칭에 사용할 Career Profile을 생성하세요.

primaryRole에는 후보자의 최근 경력과 주요 업무를 기준으로 가장 대표적인 직무 하나를 작성하세요. 가능한 경우 일반적인 채용시장 직무명으로 정규화하세요.

experienceYears에는 primaryRole과 직접 관련된 경력 기간을 계산하여 숫자로 작성하세요. 기간이 명확하지 않다면 과대평가하지 마세요.

skills에는 채용공고의 자격요건이나 우대사항과 비교할 가치가 있는 핵심 직무 역량을 작성하세요. 단순히 이력서에 등장한 단어가 아니라 실제 수행 경험이 확인되는 역량을 우선하세요.

industries에는 후보자가 실제 업무나 프로젝트를 통해 경험한 산업 또는 비즈니스 도메인을 작성하세요. 확인할 수 없다면 빈 배열로 반환하세요.

tools에는 후보자가 실제 업무에서 사용한 기술 스택, 프레임워크, 소프트웨어, 플랫폼 및 협업 도구를 작성하세요.

projectExperience에는 대표적인 프로젝트 경험을 작성하세요. 프로젝트명만 나열하지 말고 후보자가 맡은 역할과 주요 수행 업무가 드러나는 짧은 문장으로 정리하세요.

strengths에는 이력서의 실제 경험을 통해 확인되는 후보자의 직무적 강점을 작성하세요. 일반적인 성격이나 근거 없는 강점은 포함하지 마세요.

keywords에는 이후 채용공고 검색에 사용할 가치가 높은 키워드를 작성하세요. 대표 직무명, 유사 직무명, 핵심 기술, 전문 영역 및 산업 경험을 중심으로 선정하고 검색 가치가 낮은 일반적인 단어는 제외하세요.

이력서에 근거가 없는 정보를 만들어내지 마세요. 특정 항목을 확인할 수 없다면 해당 schema가 허용하는 범위에서 빈 배열 또는 적절한 빈 값으로 처리하세요.

이력서 텍스트:
${text}`,

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

  system: `당신은 후보자의 Career Profile과 채용공고를 비교하여 지원 의사결정을 돕는 전문 Career Coach입니다.

당신의 목표는 단순히 후보자의 이력서와 채용공고에 공통으로 등장하는 키워드를 찾는 것이 아니라, 후보자의 실제 경력과 역량이 해당 포지션의 역할, 요구사항 및 우대사항과 얼마나 관련되어 있는지 분석하고 실질적인 지원 전략을 제공하는 것입니다.

분석은 반드시 제공된 Candidate 정보와 Job Posting 정보만을 근거로 수행하세요. 제공되지 않은 경력, 기술, 자격요건, 회사 정보 또는 업무 내용을 임의로 추정하거나 만들어내지 마세요.

단순한 키워드 일치보다 실제 경험의 관련성을 중요하게 평가하세요. 표현이 다르더라도 실제 업무의 성격과 역량이 유사하다면 관련 경험으로 판단할 수 있습니다. 반대로 동일한 키워드가 등장하더라도 실제 수행 경험이 확인되지 않는다면 강한 매칭으로 판단하지 마세요.

후보자의 강점을 평가할 때는 해당 공고의 주요 업무, 필수 자격요건 및 우대사항과 직접 연결되는 경험을 우선하세요. 왜 해당 경험이 이 포지션에 유리한지 이해할 수 있도록 구체적으로 작성하세요.

부족한 부분을 분석할 때는 공고에서 요구하거나 선호하지만 Candidate 정보에서 확인할 수 없는 역량이나 경험을 중심으로 작성하세요. Candidate 정보에 명시되어 있지 않다는 이유만으로 해당 역량이 없다고 단정하지 말고, '확인되지 않음' 또는 '추가 확인 필요'의 관점으로 판단하세요.

지원 전략은 일반적인 취업 조언이 아니라 해당 후보자와 해당 공고의 조합에 맞게 작성하세요. 이력서나 면접에서 어떤 프로젝트, 역할, 성과 또는 경험을 강조하면 좋은지 구체적으로 제안하세요.

합격 가능성을 예측하거나 보장하지 마세요. 분석 결과는 후보자와 공고 사이의 적합성을 이해하고 지원 우선순위를 판단하기 위한 참고 정보로 작성하세요.

과도하게 긍정적이거나 부정적으로 평가하지 말고, 근거를 바탕으로 균형 있게 분석하세요.`,

  prompt: `아래 Candidate Career Profile과 Job Posting을 비교하여 해당 공고에 대한 상세 분석과 지원 준비 포인트를 생성하세요.

matchedStrengths에는 공고의 주요 업무, 필수요건 또는 우대사항과 직접 연결되는 후보자의 경험과 역량을 작성하세요. 단순히 동일한 키워드가 있다는 이유만으로 포함하지 말고 실제 경험의 관련성을 기준으로 판단하세요. 가능하면 어떤 후보자 경험이 어떤 공고 요구사항과 연결되는지 알 수 있도록 작성하세요.

gaps에는 공고에서 요구하거나 우대하지만 Candidate 정보에서는 확인되지 않는 기술, 경험 또는 조건을 작성하세요. Candidate에게 해당 역량이 없다고 단정하지 말고 현재 제공된 Career Profile에서 확인할 수 없다는 관점으로 작성하세요. 중요하지 않은 차이까지 억지로 gap으로 만들지 마세요.

resumeHighlights에는 이 공고에 지원할 경우 후보자가 이력서에서 특히 강조하면 좋은 기존 경험을 선정하세요. 해당 포지션과 관련성이 높은 프로젝트, 역할, 기술 또는 성과를 우선하세요.

preparationPoints에는 실제 지원 전에 후보자가 확인하거나 준비하면 좋은 내용을 작성하세요. 부족한 정보를 보완하거나 관련 경험을 더 구체적으로 표현하는 방법, 면접에서 준비하면 좋은 경험 등을 해당 공고에 맞게 제안하세요.

recommendation에는 후보자의 경험과 공고의 핵심 요구사항 사이의 적합성을 종합적으로 고려하여 jobAnalysisSchema에서 허용하는 값 중 가장 적절한 값을 선택하세요. 단순 키워드 개수만으로 판단하지 말고 직무 관련성, 핵심 역량, 경력 수준 및 주요 gap을 함께 고려하세요.

summary에는 이 공고가 후보자에게 왜 적합하거나 적합하지 않은지를 핵심 근거 중심으로 간결하게 요약하세요. 막연한 표현보다 가장 중요한 매칭 요소와 주의점을 포함하세요.

Candidate Career Profile:
${JSON.stringify(profile, null, 2)}

Job Posting:
${JSON.stringify(job, null, 2)}

반드시 제공된 정보만을 근거로 분석하고, 확인할 수 없는 내용을 임의로 만들어내지 마세요.`,

  output: Output.object({
    schema: jobAnalysisSchema
  })
})
  return result.output
}
