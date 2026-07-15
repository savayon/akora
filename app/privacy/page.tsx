import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">개인정보처리방침 (초안)</h1>
        
        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">1. 수집하는 개인정보 항목</h2>
            <p className="mb-2">회사는 원활한 서비스 제공을 위해 다음의 정보를 수집합니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>소셜 로그인(카카오) 시 수집 항목: 고유 식별자(이메일), 닉네임, 프로필 사진</li>
              <li>서비스 이용 과정에서 자동 수집되는 항목: IP 주소, 쿠키, 서비스 이용 기록(접속 시간, 게시물 작성 및 투표 내역)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">2. 개인정보의 수집 및 이용 목적</h2>
            <p className="mb-2">수집된 개인정보는 다음의 목적을 위해서만 활용됩니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>회원 식별 및 본인 확인, 불량 회원의 부정 이용 방지</li>
              <li>토론 게시물 작성, 투표, 댓글 등 기본 서비스 제공</li>
              <li>서비스 개선 및 신규 기능 기획을 위한 통계 분석</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">3. 개인정보의 보관 및 처리 위탁</h2>
            <p className="mb-2">회사는 글로벌 클라우드 서비스 및 데이터베이스를 이용하여 데이터를 안전하게 보관합니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>수탁자:</strong> Supabase, Cloudflare</li>
              <li><strong>위탁 업무 내용:</strong> 데이터베이스 서버 호스팅 및 웹 트래픽 라우팅/보안</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">4. 개인정보의 파기 및 삭제 요청</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>회원은 언제든지 서비스 내 [설정 &gt; 회원 탈퇴] 메뉴를 통해 계정 삭제를 요청할 수 있으며, 탈퇴 시 회원의 개인정보는 지체 없이 파기됩니다.</li>
              <li>단, 불량 회원의 재가입 방지를 위해 특정 식별 정보는 탈퇴 후 최대 30일간 보관 후 파기될 수 있습니다. (관계 법령에 따라 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안 보존)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">5. 개인정보 보호 문의처</h2>
            <p className="mb-2">개인정보 열람, 정정, 삭제 등에 관한 문의는 아래의 연락처로 접수해 주시기 바랍니다.</p>
            <p><strong>이메일:</strong> akoradebate@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
