"use client";

import { DebateCard } from '@/components/DebateCard';
import { TopicCard } from '@/components/TopicCard';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAppStore } from '@/store/useAppStore';

const TIPS = [
  "자유게시판에 올라온 흥미로운 주장을 논제로 발전시켜보세요.",
  "논제에서 충분히 의견을 나눴다면 1:1 토론을 제안해보세요.",
  "토론은 서로를 존중하며 논리로 승부하는 공간입니다."
];

type Props = {
  debates: any[];
  topics: any[];
  freePosts: {id: string, title: string}[];
  discussPosts: {id: string, title: string}[];
};

export function HomeClient({ debates, topics, freePosts, discussPosts }: Props) {
  const { currentUser } = useAppStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const scrollRefTopic = useRef<HTMLDivElement>(null);
  const [canScrollLeftTopic, setCanScrollLeftTopic] = useState(false);
  const [canScrollRightTopic, setCanScrollRightTopic] = useState(true);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCarouselScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 10);
    }
  };

  const handleTopicCarouselScroll = () => {
    if (scrollRefTopic.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRefTopic.current;
      setCanScrollLeftTopic(scrollLeft > 0);
      setCanScrollRightTopic(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 10);
    }
  };

  const handleKakaoLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleCarouselScroll();
      handleTopicCarouselScroll();
    }, 150);
    window.addEventListener('resize', handleCarouselScroll);
    window.addEventListener('resize', handleTopicCarouselScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleCarouselScroll);
      window.removeEventListener('resize', handleTopicCarouselScroll);
    };
  }, []);

  const scrollByAmount = (direction: 'left' | 'right', isTopic: boolean = false) => {
    const ref = isTopic ? scrollRefTopic : scrollRef;
    if (ref.current && ref.current.firstElementChild) {
      const itemWidth = (ref.current.firstElementChild as HTMLElement).offsetWidth;
      const gap = window.innerWidth >= 768 ? 24 : 16;
      const amount = (itemWidth + gap) * 2;
      ref.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  return (
    <>
      <section className={`bg-white border-b border-gray-200 transition-all duration-300 ease-in-out flex flex-col items-center justify-center text-center ${isScrolled ? 'py-5' : 'pt-20 pb-12 px-4'}`}>
        <h1 className={`font-black text-slate-900 tracking-tight transition-all ease-in-out animate-fade-in-up ${isScrolled ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl'}`}>
          <span className="text-yellow-500">아고라</span>, 지성인의 놀이터
        </h1>
        
        <div className={`overflow-hidden transition-all ease-in-out w-full px-4 ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-60 opacity-100 mt-5'}`}>
          <p className="text-xl md:text-2xl font-bold text-slate-700 mb-4 animate-fade-in-up-delay">
            논리와 존중이 함께하는 아고라에 오신 것을 환영합니다.<br className="hidden md:block"/> 나의 논리를 펼치세요. 사람들을 설득하세요.
          </p>
          <p className="max-w-2xl mx-auto text-slate-500 text-sm md:text-base leading-relaxed animate-fade-in-up-delay-2">
            아고라는 소모적인 댓글 논쟁을 1:1 토론 콘텐츠로 전환하는 커뮤니티입니다.<br className="hidden md:block"/>
            감정적인 싸움 대신 구조화된 턴제 토론으로 당신의 주장을 증명하세요.
          </p>
          
          {!currentUser?.id && (
            <div className="mt-6 flex justify-center animate-fade-in-up-delay-3">
              <button 
                onClick={handleKakaoLogin}
                className="inline-flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#FDD800] text-black/85 font-bold py-3.5 px-10 rounded-xl transition-colors shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M12 3C6.477 3 2 6.477 2 10.766c0 2.766 1.83 5.176 4.6 6.473-.153.518-.542 1.942-.562 2.05-.027.144.05.14.116.096.052-.034 1.764-1.18 2.457-1.666a11.16 11.16 0 003.389.513c5.523 0 10-3.477 10-7.766S17.523 3 12 3z"/>
                </svg>
                카카오로 시작하기
              </button>
            </div>
          )}
        </div>
      </section>

      <main className="max-w-7xl mx-auto py-8 space-y-12">
        
        <div className="w-[90%] md:w-[70%] mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center justify-center gap-2 text-yellow-800 font-bold text-sm md:text-base min-h-[3rem]">
          <span className="text-lg shrink-0">💡</span>
          <p key={currentTipIndex} className="animate-fade-in-up flex-1 text-center text-balance overflow-hidden">
            {TIPS[currentTipIndex]}
          </p>
        </div>

        <section className="relative w-full">
          <div className="px-4 sm:px-6 lg:px-8 mb-6">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              최근 생성된 1:1 토론
            </h2>
          </div>

          <div className="relative group px-4 sm:px-6 lg:px-8">
            <button 
              onClick={() => scrollByAmount('left')} 
              disabled={!canScrollLeft}
              className={`absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 text-slate-800 font-black text-xl transition-all ${!canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-slate-50 hover:scale-105'}`}
              aria-label="이전 토론"
            >
              &lt;
            </button>

            <div 
              ref={scrollRef} 
              onScroll={handleCarouselScroll}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-8 pt-2 [&::-webkit-scrollbar]:hidden"
            >
              {debates.map((debate, i) => (
                <DebateCard key={i} debate={debate} />
              ))}

              <Link href="/debate/live" className="snap-start shrink-0 w-[240px] md:w-[280px] bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-6 hover:bg-slate-100 hover:border-slate-400 transition-colors group/more">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover/more:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </div>
                <h3 className="font-bold text-slate-800 text-lg">더 많은 토론 보기</h3>
                <p className="text-sm text-slate-500 mt-2 text-center font-medium">아고라에서 진행 중인<br/>모든 토론을 확인하세요</p>
              </Link>
            </div>

            <button 
              onClick={() => scrollByAmount('right')} 
              disabled={!canScrollRight}
              className={`absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 text-slate-800 font-black text-xl transition-all ${!canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-slate-50 hover:scale-105'}`}
              aria-label="다음 토론"
            >
              &gt;
            </button>
          </div>
        </section>

        <section className="relative w-full pt-8 border-t border-slate-200">
          <div className="px-4 sm:px-6 lg:px-8 mb-6 flex justify-between items-end">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              최근 올라온 주제
            </h2>
            <Link href="/board/debate/create" className="text-sm font-bold text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-3 py-1.5 rounded-lg transition-colors border border-yellow-200">
              + 주제 만들기
            </Link>
          </div>

          <div className="relative group px-4 sm:px-6 lg:px-8">
            <button 
              onClick={() => scrollByAmount('left', true)} 
              disabled={!canScrollLeftTopic}
              className={`absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 text-slate-800 font-black text-xl transition-all ${!canScrollLeftTopic ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-slate-50 hover:scale-105'}`}
              aria-label="이전 주제"
            >
              &lt;
            </button>

            <div 
              ref={scrollRefTopic} 
              onScroll={handleTopicCarouselScroll}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-8 pt-2 [&::-webkit-scrollbar]:hidden"
            >
              {topics.map((topic, i) => (
                <TopicCard key={i} topic={topic} />
              ))}

              <Link href="/board/debate" className="snap-start shrink-0 w-[240px] md:w-[280px] bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-6 hover:bg-slate-100 hover:border-slate-400 transition-colors group/more">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover/more:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </div>
                <h3 className="font-bold text-slate-800 text-lg">더 많은 주제 보기</h3>
                <p className="text-sm text-slate-500 mt-2 text-center font-medium">유저들이 제안한<br/>모든 토론 주제를 확인하세요</p>
              </Link>
            </div>

            <button 
              onClick={() => scrollByAmount('right', true)} 
              disabled={!canScrollRightTopic}
              className={`absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 text-slate-800 font-black text-xl transition-all ${!canScrollRightTopic ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-slate-50 hover:scale-105'}`}
              aria-label="다음 주제"
            >
              &gt;
            </button>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-slate-900 text-sm">자유게시판</h3>
              <Link href="/board/free" className="text-xs font-bold text-slate-500 hover:text-yellow-600">더보기 &gt;</Link>
            </div>
            <ul className="divide-y divide-gray-50 flex-1">
              {freePosts.length > 0 ? freePosts.map((post, idx) => (
                <li key={idx} className="hover:bg-slate-50 transition-colors">
                  <Link href={`/board/free/${post.id}`} className="block px-5 py-3 text-sm font-medium text-slate-700 truncate">{post.title}</Link>
                </li>
              )) : (
                <li className="px-5 py-10 text-center text-slate-400 text-sm">게시글이 없습니다.</li>
              )}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-slate-900 text-sm">토의게시판</h3>
              <Link href="/board/discuss" className="text-xs font-bold text-slate-500 hover:text-yellow-600">더보기 &gt;</Link>
            </div>
            <ul className="divide-y divide-gray-50 flex-1">
              {discussPosts.length > 0 ? discussPosts.map((post, idx) => (
                <li key={idx} className="hover:bg-slate-50 transition-colors">
                  <Link href={`/board/discuss/${post.id}`} className="block px-5 py-3 text-sm font-medium text-slate-700 truncate">{post.title}</Link>
                </li>
              )) : (
                <li className="px-5 py-10 text-center text-slate-400 text-sm">게시글이 없습니다.</li>
              )}
            </ul>
          </div>



        </section>

      </main>
    </>
  );
}
