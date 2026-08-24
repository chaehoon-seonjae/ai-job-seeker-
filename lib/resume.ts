import pdf from 'pdf-parse'
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
