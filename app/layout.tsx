import './globals.css'

export const metadata = {
  title: '나에게 맞는 채용공고 찾기',
  description: '이력서를 분석해 잘 맞는 채용공고를 찾아드립니다',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
