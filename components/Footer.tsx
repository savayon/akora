import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-slate-600 py-8 mt-8 text-sm border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-3">
          <Link href="/" className="flex items-center group w-fit">
            <img src="/logo.png" alt="아고라 로고" className="h-9 md:h-10 w-auto object-contain grayscale opacity-60 hover:opacity-80 transition-opacity mix-blend-multiply" />
          </Link>
          <p className="text-slate-500 leading-snug text-xs max-w-sm mt-2">
            논리와 존중이 함께하는 토론 커뮤니티.<br />
            소모적인 댓글 논쟁 대신 구조화된 대화로 건강한 문화를 만듭니다.
          </p>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-bold text-slate-700 text-sm">Service</h4>
          <ul className="space-y-1.5 text-xs">
            <li><Link href="#" className="hover:text-slate-900 transition-colors">이용약관</Link></li>
            <li><Link href="#" className="hover:text-slate-900 transition-colors font-bold">개인정보처리방침</Link></li>
            <li><Link href="#" className="hover:text-slate-900 transition-colors">커뮤니티 운영정책</Link></li>
            <li><Link href="#" className="hover:text-slate-900 transition-colors">공지사항</Link></li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-bold text-slate-700 text-sm">Contact Us</h4>
          <ul className="space-y-1.5 text-xs">
            <li><a href="mailto:support@akora.com" className="hover:text-slate-900 transition-colors">고객센터: support@akora.com</a></li>
            <li><a href="mailto:partnership@akora.com" className="hover:text-slate-900 transition-colors">제휴 문의: partnership@akora.com</a></li>
            <li className="pt-1"><span className="text-slate-400">운영시간: 평일 10:00 - 18:00</span></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-2 text-[11px] text-slate-400">
        <p>© 2026 akora Project. All rights reserved.</p>
        <p>운영자: 아고라팀 | 사업자등록번호: 123-45-67890 | 대표: 홍길동</p>
      </div>
    </footer>
  );
}
