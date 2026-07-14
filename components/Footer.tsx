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
            <li>메일: <a href="mailto:akoradebate@gmail.com" className="hover:text-slate-900 transition-colors">akoradebate@gmail.com</a></li>
            <li className="pt-1 flex items-center gap-1.5">
              인스타: <a href="https://instagram.com/akora.official" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors font-semibold flex items-center gap-1">@akora.official <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-4 border-t border-gray-200 flex justify-end text-[11px] text-slate-400">
        <p>since 2026</p>
      </div>
    </footer>
  );
}
