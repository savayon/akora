import { createClient } from '@/utils/supabase/client';
import type { ISearchRepository } from '../interfaces';
import { SearchSort, type SearchResultItem } from '@/types';
import { formatRelativeTime } from '@/lib/formatTime';
import { SupabaseDebateRepository } from './DebateRepository';

export const SupabaseSearchRepository: ISearchRepository = {
  async searchPosts(keyword, supabaseClient?) {
    if (!keyword || keyword.trim() === '') return [];
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('posts')
      .select('id, board_type, title, content, created_at, users(nickname)')
      .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)
      .order(SearchSort.Latest, { ascending: false });

    if (error || !data) return [];

    return data.map((p: any): SearchResultItem & { _rawDate: string } => ({
      id: p.id,
      domain: p.board_type === 'free' ? 'free' : 'discuss',
      title: p.title,
      contentPreview: p.content ? p.content.substring(0, 100) : '',
      authorName: p.users?.nickname || '알 수 없음',
      createdAt: formatRelativeTime(p.created_at),
      url: `/board/${p.board_type}/${p.id}`,
      _rawDate: p.created_at
    }));
  },

  async searchDiscussions(keyword, supabaseClient?) {
    if (!keyword || keyword.trim() === '') return [];
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('discussion_topics')
      .select('id, title, created_at, users(nickname)')
      .ilike('title', `%${keyword}%`)
      .order(SearchSort.Latest, { ascending: false });

    if (error || !data) return [];

    return data.map((t: any): SearchResultItem & { _rawDate: string } => ({
      id: t.id,
      domain: 'discuss', // 논제는 discuss로 묶음
      title: t.title,
      contentPreview: '', // 논제는 본문이 따로 없음 (A/B 의견만 있음)
      authorName: t.users?.nickname || '알 수 없음',
      createdAt: formatRelativeTime(t.created_at),
      url: `/board/discuss/${t.id}`,
      _rawDate: t.created_at
    }));
  },

  async searchDebates(keyword, supabaseClient?) {
    if (!keyword || keyword.trim() === '') return [];
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('debates')
      .select('id, topic, created_at, proposer_claim, responder_claim, topic_status, users!debates_proposer_id_fkey(nickname)')
      .ilike('topic', `%${keyword}%`)
      .order(SearchSort.Latest, { ascending: false });

    if (error || !data) return [];

    return data
      .filter((d: any) => d.proposer_claim && d.responder_claim)
      .map((d: any): SearchResultItem & { _rawDate: string } => ({
      id: d.id,
      domain: 'debate',
      title: SupabaseDebateRepository.getDisplayTopic(d),
      contentPreview: '',
      authorName: d.users?.nickname || '알 수 없음',
      createdAt: formatRelativeTime(d.created_at),
      url: `/debate/live/${d.id}`,
      _rawDate: d.created_at
      }));
  },

  async searchAll(keyword, supabaseClient?) {
    if (!keyword || keyword.trim() === '') return [];
    
    // 세 개의 쿼리를 병렬로 실행
    const [posts, discussions, debates] = await Promise.all([
      this.searchPosts(keyword, supabaseClient),
      this.searchDiscussions(keyword, supabaseClient),
      this.searchDebates(keyword, supabaseClient)
    ]);

    const combined = [...posts, ...discussions, ...debates] as (SearchResultItem & { _rawDate: string })[];
    
    // 원본 날짜 기준으로 최신순 정렬
    combined.sort((a, b) => new Date(b._rawDate).getTime() - new Date(a._rawDate).getTime());
    
    return combined; 
  }
};
