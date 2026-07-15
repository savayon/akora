import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">아고라 이용약관 (초안)</h1>
        
        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">제1조 (목적)</h2>
            <p>
              본 약관은 '아고라(Akora)'(이하 '회사')가 제공하는 토론 및 커뮤니티 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무, 책임사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">제2조 (회원의 의무 및 금지행위)</h2>
            <p className="mb-2">회원은 서비스를 이용함에 있어 다음의 행위를 하여서는 안 됩니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>타인의 정보 도용 및 허위 계정 생성</li>
              <li>서비스의 정상적인 운영을 고의 또는 과실로 방해하는 행위</li>
              <li>회사가 허락하지 않은 영리 목적의 활동 및 스팸 홍보</li>
              <li>시스템 취약점을 악용하거나 비정상적인 방법으로 접근하는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">제3조 (게시물 관리 및 삭제 기준)</h2>
            <p className="mb-2">회사는 회원이 작성한 게시물이 다음 각 호에 해당하는 경우 사전 통보 없이 해당 게시물을 삭제하거나 블라인드 처리할 수 있습니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>타인의 명예를 훼손하거나 모욕하는 내용</li>
              <li>불법적인 내용이거나 공공질서 및 미풍양속에 위반되는 내용</li>
              <li>타인의 저작권, 초상권 등 지적재산권을 침해하는 내용</li>
              <li>아고라 '커뮤니티 운영정책'을 위반한 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">제4조 (계정 제재)</h2>
            <p className="mb-2">회사는 회원이 본 약관 및 운영정책을 위반한 경우, 위반의 경중에 따라 다음의 제재를 가할 수 있습니다.</p>
            <ul className="list-decimal pl-5 space-y-1">
              <li>1차: 게시물 삭제 및 경고</li>
              <li>2차: 일정 기간 계정 이용 정지</li>
              <li>3차: 영구 계정 이용 정지 및 강제 탈퇴</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">제5조 (서비스의 변경 및 중단)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>회사는 서비스의 개선, 버그 수정, 운영상의 필요에 따라 제공하고 있는 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.</li>
              <li>베타 서비스(MVP) 기간 중에는 데이터 초기화나 기능 변경이 예고 없이 발생할 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">제6조 (책임 제한)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>회사는 회원이 작성한 게시물의 신뢰도, 정확성, 적법성에 대해 책임지지 않으며, 회원 간의 분쟁에 개입할 의무를 지지 않습니다.</li>
              <li>회사는 천재지변, 서버 제공 업체의 장애(Cloudflare, Supabase 등) 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
