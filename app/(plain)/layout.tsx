import Header from "@/components/layout/Header";

// 견적서 셸을 쓰지 않는 페이지(로그인·회원가입·마이페이지·체크아웃·견적서 등):
// 로고와 아이콘을 한 줄짜리 헤더 바로 묶어 보여준다.
// 라우트 그룹이므로 URL에는 영향이 없다.
export default function PlainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
