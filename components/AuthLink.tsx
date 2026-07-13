"use client";

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

export const AuthLink = ({ href, className, children }: { href: string, className?: string, children: React.ReactNode }) => {
  const router = useRouter();
  const { currentUser, setIsLoginModalOpen } = useAppStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUser.id) {
      setIsLoginModalOpen(true);
      return;
    }
    router.push(href);
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};
