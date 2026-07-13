import React from 'react';
import SearchClient from './SearchClient';
import { searchRepository } from '@/repositories';

export const metadata = {
  title: '통합 검색 - 아고라',
  description: '아고라의 모든 게시글, 논제, 토론을 검색해보세요.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  
  // 서버 사이드에서 통합 검색 수행 (방어 코드는 repository 내부에도 있음)
  const initialResults = q.trim() !== '' ? await searchRepository.searchAll(q) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">통합 검색</h1>
      <SearchClient initialKeyword={q} initialResults={initialResults} />
    </div>
  );
}
