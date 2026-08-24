// pdf-parse의 index.js는 번들 환경에서 디버그 모드로 진입해 테스트 PDF를 읽다 크래시하므로 내부 구현을 직접 import
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js'
import mammoth from 'mammoth'

export async function extractTextFromBuffer(buf:Buffer, filename:string){
  const lower = filename.toLowerCase()
  if(lower.endsWith('.pdf')){
    try{
      const data = await pdf(buf)
      return data.text
    }catch(e){
      return ''
    }
  }
  if(lower.endsWith('.docx')){
    try{
      const r = await mammoth.extractRawText({buffer: buf})
      return r.value
    }catch(e){
      return ''
    }
  }
  return ''
}
