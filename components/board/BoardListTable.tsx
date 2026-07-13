import React from 'react';
import Link from 'next/link';

type PostListItem = {
  id: string | number;
  title: string;
  author: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  isDebating?: boolean;
};

type BoardListTableProps = {
  posts: PostListItem[];
  boardType: 'free' | 'discuss';
};

export function BoardListTable({ posts, boardType }: BoardListTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 pl-6">제목</th>
            <th className="px-4 py-3 w-24 md:w-32">작성자</th>
            <th className="px-4 py-3 w-20 md:w-24 text-center">작성일</th>
            <th className="px-4 py-3 w-12 md:w-16 text-center hidden sm:table-cell">조회</th>
            <th className="px-4 py-3 w-12 md:w-16 text-center hidden md:table-cell">추천</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {posts.length > 0 ? posts.map((post) => (
            <tr key={post.id} className="hover:bg-slate-50 transition-colors group cursor-pointer relative">
              <td className="px-4 py-3.5 pl-6 whitespace-normal">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link href={`/board/${boardType}/${post.id}`} className="font-medium text-slate-900 group-hover:text-yellow-600 transition-colors line-clamp-1 break-all before:absolute before:inset-0">
                    {post.title}
                  </Link>
                  {post.comments > 0 && (
                    <span className="text-[11px] font-bold text-yellow-600 shrink-0">[{post.comments}]</span>
                  )}
                  {post.isDebating && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 shrink-0 border border-purple-200 shadow-sm ml-1">
                      📖 토론발생
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3.5 text-slate-600 font-medium truncate">{post.author}</td>
              <td className="px-4 py-3.5 text-center text-slate-400 text-xs">{post.date}</td>
              <td className="px-4 py-3.5 text-center text-slate-400 text-xs hidden sm:table-cell">{post.views}</td>
              <td className="px-4 py-3.5 text-center text-slate-400 text-xs font-bold hidden md:table-cell">{post.likes > 0 ? post.likes : '-'}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-medium">
                아직 게시글이 없습니다. 첫 글을 작성해보세요!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
