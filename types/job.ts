export type JobMatch = {
  id: string
  title: string
  company: string
  score?: number | null
  location?: string
  experience?: string
  url?: string
  reasons?: string[]
  cautions?: string[]
  highlights?: string[]
  raw?: any
}
