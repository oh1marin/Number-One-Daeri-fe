"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchInquiriesList } from "./inquiriesAdminApi";
import { hasAdminWebSession } from "./auth";

const STORAGE_KEY = "admin_seen_inquiry_ids";
const POLL_INTERVAL_MS = 15_000;

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function addSeenIds(ids: string[]) {
  try {
    const existing = getSeenIds();
    for (const id of ids) existing.add(id);
    // 최대 500개만 유지
    const arr = Array.from(existing).slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function showBrowserNotification(count: number, firstName: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const title = count === 1 ? "새 문의가 접수되었습니다" : `새 문의 ${count}건이 접수되었습니다`;
    const body = firstName ? `"${firstName}" 외 고객이 문의를 남겼습니다.` : "1:1 문의 목록을 확인하세요.";
    const n = new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: "inquiry-notification",
    });
    setTimeout(() => n.close(), 6000);
    n.onclick = () => {
      window.focus();
      window.location.href = "/inquiries";
      n.close();
    };
  } catch {
    /* ignore */
  }
}

export function useInquiryNotifier(getAccessToken: () => string | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const permissionRequestedRef = useRef(false);
  const initializedRef = useRef(false);

  const poll = useCallback(async () => {
    if (!hasAdminWebSession()) return;

    let res: Awaited<ReturnType<typeof fetchInquiriesList>>;
    try {
      res = await fetchInquiriesList(getAccessToken, {
        page: 1,
        limit: 50,
        status: "",
      });
    } catch {
      return;
    }
    if (!res.ok) return;

    const seenIds = getSeenIds();
    const allIds = res.data.items.map((i) => i.id);

    if (!initializedRef.current) {
      // 첫 폴링: 기존 항목을 모두 "이미 봤음"으로 처리 (알림 안 띄움)
      addSeenIds(allIds);
      initializedRef.current = true;
      const unread = res.data.items.filter((i) => i.needsReply).length;
      setUnreadCount(unread);
      return;
    }

    const newItems = res.data.items.filter((i) => !seenIds.has(i.id));
    if (newItems.length > 0) {
      addSeenIds(newItems.map((i) => i.id));
      const firstName = newItems[0]?.user?.name ?? newItems[0]?.user?.phone ?? "";
      showBrowserNotification(newItems.length, firstName);
    }

    const unread = res.data.items.filter((i) => i.needsReply).length;
    setUnreadCount(unread);
  }, [getAccessToken]);

  useEffect(() => {
    if (!permissionRequestedRef.current) {
      permissionRequestedRef.current = true;
      requestNotificationPermission();
    }

    poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [poll]);

  return { unreadCount };
}
