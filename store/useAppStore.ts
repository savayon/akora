import { create } from 'zustand';
import type { Notification, DraftDebate } from '@/types';

interface AppState {
  // 1. Current User (인증된 사용자 정보)
  currentUser: {
    id: string;
    name: string;
    role: 'user' | 'admin';
    isOnboarded: boolean;
    avatarUrl?: string | null;
  };
  setCurrentUser: (user: { id?: string; name: string; role: 'user' | 'admin'; isOnboarded?: boolean; avatarUrl?: string | null }) => void;

  // 2. Notifications (UI 캐시 — DB에서 로드 후 여기에 보관)
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (noti: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string | number) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string | number) => void;

  // 3. UI State
  isNotiOpen: boolean;
  setIsNotiOpen: (isOpen: boolean) => void;

  // 4. Draft Debate (임시 브릿지 데이터 — 도메인 객체가 아닌 일회성 셔틀)
  draftDebate: DraftDebate | null;
  setDraftDebate: (draft: DraftDebate | null) => void;
  clearDraftDebate: () => void;

  // 5. Report Modal UI State
  isReportModalOpen: boolean;
  reportTarget: { type: 'post' | 'comment'; id: string | number } | null;
  openReportModal: (type: 'post' | 'comment', id: string | number) => void;
  closeReportModal: () => void;

  // 6. Login Modal UI State
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (isOpen: boolean) => void;

  // 7. Profile Popover UI State
  profilePopover: {
    isOpen: boolean;
    userId: string | null;
    rect: DOMRect | null;
  };
  openProfilePopover: (userId: string, rect: DOMRect) => void;
  closeProfilePopover: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: {
    id: '',
    name: '', // 빈 문자열 (비로그인 상태)
    role: 'user',
    isOnboarded: true,
    avatarUrl: null,
  },
  setCurrentUser: (user) => set({ currentUser: { id: user.id || '', name: user.name, role: user.role, isOnboarded: user.isOnboarded ?? true, avatarUrl: user.avatarUrl || null } }),

  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (noti) => set((state) => ({
    notifications: [
      {
        ...noti,
        id: Date.now(),
        isRead: false,
        createdAt: '방금 전',
      },
      ...state.notifications
    ]
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => 
      n.id === id ? { ...n, isRead: true } : n
    )
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),

  isNotiOpen: false,
  setIsNotiOpen: (isOpen) => set({ isNotiOpen: isOpen }),

  draftDebate: null,
  setDraftDebate: (draft) => set({ draftDebate: draft }),
  clearDraftDebate: () => set({ draftDebate: null }),

  isReportModalOpen: false,
  reportTarget: null,
  openReportModal: (type, id) => set({ isReportModalOpen: true, reportTarget: { type, id } }),
  closeReportModal: () => set({ isReportModalOpen: false, reportTarget: null }),

  isLoginModalOpen: false,
  setIsLoginModalOpen: (isOpen) => set({ isLoginModalOpen: isOpen }),

  profilePopover: { isOpen: false, userId: null, rect: null },
  openProfilePopover: (userId, rect) => set({ profilePopover: { isOpen: true, userId, rect } }),
  closeProfilePopover: () => set({ profilePopover: { isOpen: false, userId: null, rect: null } }),
}));
