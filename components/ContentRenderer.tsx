import React from 'react';
import { LinkPreview } from '@/components/board/LinkPreview';

interface ContentRendererProps {
  content: string;
  disablePreview?: boolean;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export const ContentRenderer: React.FC<ContentRendererProps> = ({ content, disablePreview = false }) => {
  if (!content) return null;

  // Split content by URL
  const parts = content.split(URL_REGEX);
  
  // Find the first URL for preview
  const urls = content.match(URL_REGEX);
  const firstUrl = urls ? urls[0] : null;

  return (
    <>
      <span className="whitespace-pre-wrap break-words">
        {parts.map((part, i) => {
          if (part.match(URL_REGEX)) {
            return (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline underline-offset-2 break-all"
                onClick={(e) => e.stopPropagation()} // Prevent triggering parent click handlers
              >
                {part}
              </a>
            );
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        })}
      </span>
      
      {!disablePreview && firstUrl && (
        <div className="mt-3">
          <LinkPreview url={firstUrl} />
        </div>
      )}
    </>
  );
};
