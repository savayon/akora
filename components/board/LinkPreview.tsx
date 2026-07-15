'use client';

import React, { useEffect, useState } from 'react';

interface LinkPreviewData {
  title: string;
  description: string;
  image: string;
  domain: string;
  url: string;
}

interface LinkPreviewProps {
  url: string;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ url }) => {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        const result = await response.json();

        if (isMounted) {
          if (result.success && result.data) {
            setData(result.data);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (error || (!loading && !data)) {
    return null; // Don't show anything if preview fails
  }

  if (loading) {
    return (
      <div className="w-full max-w-xl my-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center animate-pulse h-28">
        <div className="w-28 h-full bg-slate-200 shrink-0 rounded-l-xl"></div>
        <div className="p-4 flex-1 flex flex-col gap-2">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 rounded w-full"></div>
          <div className="h-3 bg-slate-200 rounded w-1/4 mt-auto"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <a 
      href={data.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block w-full max-w-xl my-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm overflow-hidden flex h-28 sm:h-32 no-underline group"
    >
      {data.image ? (
        <div className="w-28 sm:w-32 shrink-0 bg-slate-100 overflow-hidden relative">
          <img 
            src={data.image} 
            alt={data.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="w-28 sm:w-32 shrink-0 bg-slate-100 flex items-center justify-center text-slate-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </div>
      )}
      <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0 justify-center">
        <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate mb-1" title={data.title}>
          {data.title}
        </h3>
        {data.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2" title={data.description}>
            {data.description}
          </p>
        )}
        <div className="mt-auto text-[10px] sm:text-xs text-slate-400 font-medium truncate flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          {data.domain}
        </div>
      </div>
    </a>
  );
};
