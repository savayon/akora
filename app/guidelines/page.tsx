import React from 'react';

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">커뮤니티 운영정책 (초안)</h1>
        
        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">아고라의 지향점</h2>
            <p>
              아고라는 '논리와 존중'을 기반으로 더 나은 토론 문화를 만드는 공간입니다. 소모적인 감정싸움 대신 구조화된 대화를 통해 서로의 생각을 검증하고 성장하는 것을 목표로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-green-500">🟢</span> 허용되는 행위 (Do)
            </h2>
            <p className="mb-2">아고라는 자유롭고 치열한 토론을 장려합니다.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>논리적 비판:</strong> 상대방의 의견에 논리적인 허점이 있다면 언제든 날카롭게 지적할 수 있습니다.</li>
              <li><strong>강한 반박:</strong> 주제에 대한 명확한 근거가 있다면 강경한 어조의 반박도 허용됩니다.</li>
              <li><strong>풍자와 해학:</strong> 토론의 본질을 흐리지 않는 선에서의 위트와 풍자는 환영합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-red-500">🔴</span> 금지되는 행위 (Don't)
            </h2>
            <p className="mb-2">토론의 본질을 훼손하는 다음의 행위는 엄격히 제재합니다.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>인신공격 및 모욕:</strong> '의견'이 아닌 '작성자 개인'을 향한 욕설, 비하, 조롱은 절대 금지됩니다. (예: "머리가 나쁘다", "수준이 낮다" 등)</li>
              <li><strong>신상공개(Doxxing):</strong> 타인의 실명, 연락처, 직장 등 사적인 정보를 동의 없이 유포하는 행위.</li>
              <li><strong>협박 및 괴롭힘:</strong> 특정 사용자를 지속적으로 따라다니며 괴롭히거나 위협하는 행위.</li>
              <li><strong>스팸 및 도배:</strong> 무의미한 내용을 반복적으로 올리거나, 외부 링크 유도를 목적으로 하는 상업적 게시물.</li>
              <li><strong>혐오 조장:</strong> 인종, 성별, 지역, 종교 등에 대한 차별 및 혐오 발언.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-yellow-500">⚠️</span> 제재 절차
            </h2>
            <p className="mb-2">운영정책 위반이 확인될 경우, 다음과 같은 절차로 조치됩니다.</p>
            <ul className="list-decimal pl-5 space-y-1">
              <li>문제 게시물 즉시 블라인드 또는 삭제</li>
              <li>위반자에게 경고 조치</li>
              <li>누적 시 계정의 글쓰기 권한 정지 또는 영구 정지 (사안의 심각성에 따라 경고 없이 즉각 정지될 수 있습니다.)</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
