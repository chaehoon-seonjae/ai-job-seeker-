import ResumeUpload from '../components/ResumeUpload'
import './globals.css'

export default function Page() {
  return (
    <main className="container">
      <h1>나에게 맞는 채용공고 찾기</h1>
      <p>이력서를 업로드하면 경력을 분석하고 잘 맞는 공고를 찾아드립니다.</p>
      <ResumeUpload />
      <footer className="notice">업로드한 이력서는 채용공고 검색 및 분석을 위해서만 사용되며 별도로 저장하지 않습니다.</footer>
    </main>
  )
}
