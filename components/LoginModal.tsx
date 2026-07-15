"use client";

import React, { useEffect } from 'react';
import { AuthService } from '@/services';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function LoginModal({ isOpen, onClose }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKakaoLogin = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    await AuthService.signInWithKakao(`${origin}/auth/callback`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-label="닫기"
      />
      
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 text-center pt-12">
          <img src="/logo.png" alt="아고라 로고" className="h-14 mx-auto mb-6 mix-blend-multiply" />
          
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
            아고라 시작하기
          </h2>
          <p className="text-sm font-medium text-slate-500 mb-8">
            논리와 존중이 함께하는 아고라에 오신 것을 환영합니다.
          </p>

          <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 mb-3 tracking-wide">간편 로그인 / 회원가입</p>
            <p className="text-sm font-bold text-slate-700 mb-4">
              카카오로 3초만에 회원가입!<br/>
              <span className="text-slate-500 font-medium">기존회원이라면 바로 시작하기</span>
            </p>
            
            <button 
              onClick={handleKakaoLogin}
              className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#FDD800] text-black/85 font-bold py-3.5 px-4 rounded-xl transition-colors shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M12 3C6.477 3 2 6.477 2 10.766c0 2.766 1.83 5.176 4.6 6.473-.153.518-.542 1.942-.562 2.05-.027.144.05.14.116.096.052-.034 1.764-1.18 2.457-1.666a11.16 11.16 0 003.389.513c5.523 0 10-3.477 10-7.766S17.523 3 12 3z"/>
              </svg>
              카카오 로그인
            </button>
          </div>

          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            로그인 시 아고라의 <a href="#" className="underline hover:text-slate-600">이용약관</a> 및 <a href="#" className="underline hover:text-slate-600">개인정보처리방침</a>에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
