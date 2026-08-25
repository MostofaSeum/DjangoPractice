"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Swal from "sweetalert2";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: "order" | "stock" | "system";
  target_id: string;
  is_read: boolean;
  created_at: string;
}

interface AdminNotificationBellProps {
  apiBase: string;
  token: string | null;
  onNavigateToOrder?: (orderId: string) => void;
}

export default function AdminNotificationBell({
  apiBase,
  token,
  onNavigateToOrder,
}: AdminNotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const lastSeenIdRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async (isInitial = false) => {
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/store/notifications/`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const items: NotificationItem[] = data.notifications || [];
        setNotifications(items);
        setUnreadCount(data.unread_count || 0);

        if (items.length > 0) {
          const highestId = Math.max(...items.map((n) => n.id));

          // If not initial load and a new higher ID is found, trigger a Toast notification!
          if (!isInitial && lastSeenIdRef.current !== null && highestId > lastSeenIdRef.current) {
            const newItems = items.filter((n) => n.id > lastSeenIdRef.current!);
            for (const newItem of newItems) {
              Swal.fire({
                toast: true,
                position: "top-end",
                icon: newItem.notification_type === "order" ? "success" : "info",
                title: newItem.title,
                text: newItem.message,
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
                background: "var(--secondary)",
                color: "var(--foreground)",
                customClass: {
                  popup: "rounded-2xl border border-foreground/15 shadow-xl text-xs font-medium",
                },
              });
            }
          }

          lastSeenIdRef.current = highestId;
        } else if (isInitial) {
          lastSeenIdRef.current = 0;
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // Initial fetch + Polling interval every 15 seconds
  useEffect(() => {
    if (!token) return;

    fetchNotifications(true);

    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [apiBase, token]);

  // Mark single notification as read
  const handleMarkRead = async (item: NotificationItem) => {
    if (!token) return;

    if (!item.is_read) {
      try {
        await fetch(`${apiBase}/store/notifications/${item.id}/mark_read/`, {
          method: "PATCH",
          headers: {
            Authorization: `JWT ${token}`,
          },
        });

        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }

    if (item.notification_type === "order" && item.target_id && onNavigateToOrder) {
      onNavigateToOrder(item.target_id);
      setIsOpen(false);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${apiBase}/store/notifications/mark_all_read/`, {
        method: "POST",
        headers: {
          Authorization: `JWT ${token}`,
        },
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with Pulsing Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        className="relative flex items-center justify-center p-2 rounded-xl text-white dark:text-foreground hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
      >
        <Image
          src="/notification.png"
          alt="Notifications"
          width={20}
          height={20}
          className="object-contain filter brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
        />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-accent text-white font-black text-[9px] shadow-md animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-secondary text-foreground border border-foreground/15 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-foreground/10 flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-[10px] font-bold uppercase tracking-wider text-accent hover:underline cursor-pointer disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-foreground/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs opacity-60 font-bold uppercase tracking-wider">
                No notifications yet
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkRead(item)}
                  className={`p-3.5 transition-colors cursor-pointer hover:bg-primary/5 flex items-start gap-3 ${
                    !item.is_read ? "bg-accent/5 dark:bg-accent/10" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {item.notification_type === "order" ? (
                      <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold text-xs">
                        🛒
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold text-xs">
                        🔔
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black truncate text-foreground">
                        {item.title}
                      </p>
                      <span className="text-[9px] opacity-60 shrink-0 font-medium">
                        {formatTime(item.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground/80 mt-0.5 leading-snug line-clamp-2">
                      {item.message}
                    </p>
                  </div>

                  {!item.is_read && (
                    <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-primary/5 border-t border-foreground/10 text-center">
          </div>
        </div>
      )}
    </div>
  );
}
