import { spawnSync } from 'child_process'
import path from 'path'

export function buildSearchTextFromProfile(profile:any){
  const parts:string[] = []
  if(profile.primaryRole) parts.push(profile.primaryRole)
  if(profile.experienceYears) parts.push(`${profile.experienceYears}년`)
  if(Array.isArray(profile.skills)) parts.push(...profile.skills.slice(0,6))
  if(Array.isArray(profile.industries)) parts.push(...profile.industries.slice(0,4))
  if(Array.isArray(profile.projectExperience)) parts.push(...profile.projectExperience.slice(0,4))
  return parts.join(' ')
}

export function runKSkillMatch(opts:{resumeText:string, keyword?:string, locations?:string[], negatives?:string[], limit?:number, careerYears?:number, source?:string}){
  const args = ['-y', '@nomadamas/k-skill@0', 'exec', 'job-posting-match', 'scripts/job_posting_match.py', '--', '--resume-text', opts.resumeText, '--json']
  if(opts.keyword) args.push('--keyword', opts.keyword)
  if(Array.isArray(opts.locations)){
    for(const loc of opts.locations) args.push('--location', loc)
  } else if((opts as any).location){
    args.push('--location', (opts as any).location)
  }
  if(typeof opts.careerYears === 'number') args.push('--career-years', String(opts.careerYears))
  if(typeof opts.limit === 'number'){
    args.push('--limit', String(opts.limit))
    // 소스별 수집량 기본값(10)에 묶이지 않도록 limit에 맞춰 함께 전달
    args.push('--per-source', String(opts.limit))
  }
  if(opts.source) args.push('--source', opts.source)
  if(Array.isArray(opts.negatives)){
    for(const n of opts.negatives){ args.push('--negative', n) }
  }

  // use npx with spawnSync to capture stdout
  let res: any
  if(process.platform === 'win32'){
    // allow overriding paths via env for portability
    const npxPath = process.env.NPX_PATH || 'C:\\Program Files\\nodejs\\npx.cmd'
    // normalize JOBMATCH_PREPEND_PATH to the current platform's path delimiter
    const defaultWin = 'C:\\Users\\CNXK\\AppData\\Local\\Programs\\Python\\Python311;C:\\Program Files\\nodejs;'
    const rawPrepend = process.env.JOBMATCH_PREPEND_PATH || defaultWin
    const prependPath = rawPrepend.split(/[:;]+/).join(path.delimiter) + path.delimiter
    // build a single cmd.exe /c command string to avoid spawn issues with .cmd path
    const quoted = args.map(a=>`"${String(a).replace(/"/g,'\\"')}"`).join(' ')
    const cmd = `"${npxPath}" ${quoted}`
    // PYTHONUTF8: 한국어 Windows에서 파이썬 stdout이 CP949로 나와 공고명이 깨지는 것 방지
    res = spawnSync(cmd, { shell: true, encoding: 'utf-8', maxBuffer: 20 * 1024 * 1024, env: { ...process.env, PYTHONUTF8: '1', PATH: prependPath + (process.env.PATH || '') } })
  } else {
    res = spawnSync(process.env.NPX_PATH || 'npx', args, { encoding: 'utf-8', maxBuffer: 20 * 1024 * 1024, env: { ...process.env, PYTHONUTF8: '1' } })
  }
  if(res.error) throw res.error
  if(res.status !== 0){
    const stderr = res.stderr || ''
    throw new Error(`k-skill failed: ${stderr}`)
  }
  const out = res.stdout || ''
  try{
    return JSON.parse(out)
  }catch(e){
    throw new Error('k-skill returned non-JSON output')
  }
}
