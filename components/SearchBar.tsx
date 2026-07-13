"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon } from '@/components/icons';

type SearchBarProps = {
  variant?: 'header' | 'board';
  placeholder?: string;
};

export function SearchBar({ 
  variant = 'board', 
  placeholder = "게시글, 논제, 토론 검색" 
}: SearchBarProps) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 헤더 검색바용: 외부 클릭 시 닫힘
  useEffect(() => {
    if (variant !== 'header') return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [variant]);

  // 헤더 검색바용: ESC 키 누르면 닫힘
  useEffect(() => {
    if (variant !== 'header') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, variant]);

  // 헤더 검색바용: 열릴 때 포커스
  useEffect(() => {
    if (variant === 'header' && isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen, variant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query.length < 2) {
      alert("검색어는 2글자 이상 입력해주세요.");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(query)}`);
    if (variant === 'header') {
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  if (variant === 'header') {
    return (
      <div 
        ref={searchContainerRef} 
        className="flex items-center justify-end relative h-8"
        onMouseEnter={() => setIsSearchOpen(true)}
        onMouseLeave={() => {
          if (document.activeElement !== searchInputRef.current) {
            setIsSearchOpen(false);
          }
        }}
      >
        <form onSubmit={handleSubmit} className="flex items-center h-full">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => {
              if (!searchQuery) setIsSearchOpen(false);
            }}
            placeholder={placeholder}
            className={`transition-all duration-300 ease-in-out outline-none border-b-[1.5px] bg-transparent text-sm px-2 py-1 placeholder:text-slate-400 absolute right-7 top-0 bottom-0 my-auto h-8 ${
              isSearchOpen 
                ? 'w-40 sm:w-48 md:w-56 opacity-100 border-slate-800 pointer-events-auto' 
                : 'w-0 opacity-0 border-transparent pointer-events-none'
            }`}
          />
          <button 
            type="submit"
            onClick={(e) => {
              if (!isSearchOpen || searchQuery.trim().length < 2) {
                if (searchQuery.trim().length > 0 && searchQuery.trim().length < 2) {
                  alert("검색어는 2글자 이상 입력해주세요.");
                }
                e.preventDefault();
                setIsSearchOpen(true);
                searchInputRef.current?.focus();
              }
            }}
            className={`cursor-pointer p-1 z-10 transition-colors bg-white ${isSearchOpen ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`} 
            aria-label="검색"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    );
  }

  // Board Variant (기본값)
  return (
    <form onSubmit={handleSubmit} className="relative flex-1 sm:w-64">
      <input 
        type="text" 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        minLength={2}
        required
        placeholder={placeholder} 
        className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm"
      />
      <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors" aria-label="검색">
        <SearchIcon className="w-4 h-4" />
      </button>
    </form>
  );
}
