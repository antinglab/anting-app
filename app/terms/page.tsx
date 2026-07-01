export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-olive-dark">이용약관</h1>
      <div className="prose prose-olive max-w-none text-olive-gray">
        <h2 className="text-xl font-semibold mt-6 mb-2 text-olive-dark">제1조 (목적)</h2>
        <p className="mb-4">
          이 약관은 <strong>앤팅(Anting)</strong>(이하 &quot;회사&quot;라 함)이 운영하는 웹사이트 및 애플리케이션(이하 &quot;서비스&quot;라 함)을 이용함에 있어 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-2 text-olive-dark">제2조 (정의)</h2>
        <p className="mb-4">
          1. &quot;서비스&quot;란 회사가 제공하는 인플루언서 매칭, 쇼핑커머스 등 제반 서비스를 의미합니다.
          <br/>2. &quot;이용자&quot;란 서비스에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.
          <br/>3. &quot;회원&quot;이란 서비스에 회원등록을 한 자로서, 계속적으로 서비스를 이용할 수 있는 자를 말합니다.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-olive-dark">제3조 (약관 등의 명시와 설명 및 개정)</h2>
        <p className="mb-4">
          ① 회사는 이 약관의 내용과 상호 및 대표자 성명, 영업소 소재지 주소, 전화번호, 전자우편주소, 사업자등록번호 등을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.
          <br/>② 회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
        </p>
        
        {/* 임시 내용 */}
        <p className="mt-8 text-sm text-gray-500">
          * 본 이용약관은 임시로 작성되었으며, 정식 서비스 오픈 전 확정된 내용으로 변경될 예정입니다.
        </p>
      </div>
    </div>
  );
}
