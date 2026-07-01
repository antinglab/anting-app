export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-olive-dark">개인정보처리방침</h1>
      <div className="prose prose-olive max-w-none text-olive-gray">
        <p className="mb-4">
          <strong>앤팅(Anting)</strong>은(는) 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-2 text-olive-dark">제1조(개인정보의 처리 목적)</h2>
        <p className="mb-4">
          회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          <br/>1. 홈페이지 회원가입 및 관리
          <br/>2. 재화 또는 서비스 제공
          <br/>3. 마케팅 및 광고에의 활용
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-olive-dark">제2조(개인정보의 처리 및 보유 기간)</h2>
        <p className="mb-4">
          ① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
          <br/>② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
          <br/>1. 홈페이지 회원가입 및 관리: 회원 탈퇴시까지
        </p>
        
        {/* 임시 내용 */}
        <p className="mt-8 text-sm text-gray-500">
          * 본 개인정보처리방침은 임시로 작성되었으며, 정식 서비스 오픈 전 확정된 내용으로 변경될 예정입니다.
        </p>
      </div>
    </div>
  );
}
