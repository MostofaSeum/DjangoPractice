"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Swal from "sweetalert2";

import { useLanguage } from "@/store/LanguageContext";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: "order" | "return" | "stock" | "system" | "promotion" | "coupon";
  target_id: string;
  is_read: boolean;
  created_at: string;
}

interface AdminNotificationBellProps {
  apiBase: string;
  token: string | null;
  onNavigateToOrder?: (orderId: string) => void;
  onNavigateToReturn?: (orderId: string) => void;
  onNavigateToTab?: (tab: "orders" | "promotions" | "coupons" | "products") => void;
}

export default function AdminNotificationBell({
  apiBase,
  token,
  onNavigateToOrder,
  onNavigateToReturn,
  onNavigateToTab,
}: AdminNotificationBellProps) {
  const { locale, t } = useLanguage();
  const isBn = locale === "bn";

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [activeFilter, setActiveFilter] = useState<"all" | "order" | "return" | "promotion" | "coupon">("all");

  const lastSeenIdRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtered notifications list based on active filter tab
  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === "all") return true;
    return item.notification_type === activeFilter;
  });

  const ordersCount = notifications.filter((n) => n.notification_type === "order").length;
  const returnsCount = notifications.filter((n) => n.notification_type === "return").length;
  const promosCount = notifications.filter((n) => n.notification_type === "promotion").length;
  const couponsCount = notifications.filter((n) => n.notification_type === "coupon").length;

  // Helper to convert English numbers to Bengali digits
  const toBnDigits = (numStr: string | number) => {
    if (!isBn) return String(numStr);
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(numStr).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
  };

  // Helper to format dictionary template strings with placeholders like {orderId}, {phone}, etc.
  const formatTemplate = (template: string, values: Record<string, string | number>) => {
    let res = template;
    for (const [k, v] of Object.entries(values)) {
      res = res.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
    return res;
  };

  // Helper to translate notification content via dictionary
  const translateNotification = (title: string, message: string) => {
    let translatedTitle = title;
    let translatedMessage = message;

    // Title translations via dictionary
    if (title.startsWith("New Order #")) {
      const orderNum = title.replace("New Order #", "");
      translatedTitle = formatTemplate(t("notifications.newOrderTitle"), {
        orderId: toBnDigits(orderNum),
      });
    } else if (title.startsWith("New Return Request for Order #")) {
      const orderNum = title.replace("New Return Request for Order #", "");
      translatedTitle = formatTemplate(t("notifications.newReturnTitle"), {
        orderId: toBnDigits(orderNum),
      });
    } else if (title === "Promotion Expiring Soon!") {
      translatedTitle = t("notifications.promoExpiringTitle");
    } else if (title === "Product Promotion Expiring Soon!") {
      translatedTitle = t("notifications.prodPromoExpiringTitle");
    } else if (title === "Coupon Code Expiring Soon!") {
      translatedTitle = t("notifications.couponExpiringTitle");
    }

    // Message translations via dictionary
    // Pattern 0: Customer @<username> requested a return for Order #<id> (Amount: ৳<amount>). Reason: <reason>.
    const returnMatch = message.match(/Customer\s+@([^\s]+)\s+requested a return for Order #(\d+)\s+\(Amount:\s+৳([\d,.]+)\)\.\s+Reason:\s+(.+)\./i);
    if (returnMatch) {
      const customer = returnMatch[1];
      const orderId = toBnDigits(returnMatch[2]);
      const total = toBnDigits(returnMatch[3]);
      const reason = returnMatch[4];
      translatedMessage = formatTemplate(t("notifications.newReturnMsg"), {
        customer,
        orderId,
        total,
        reason,
      });
    }

    // Pattern 1: Customer <phone> placed an order for ৳<total> (<payment_method>).
    const orderMatch = message.match(/Customer\s+([\d\w+]+)\s+placed an order for\s+৳([\d,.]+)\s+\(([^)]+)\)\./i);
    if (orderMatch) {
      const phone = toBnDigits(orderMatch[1]);
      const total = toBnDigits(orderMatch[2]);
      let payMethod = orderMatch[3];
      if (isBn) {
        if (payMethod.toLowerCase().includes("cash on delivery")) payMethod = "ক্যাশ অন ডেলিভারি";
        else if (payMethod.toLowerCase().includes("bkash")) payMethod = "বিকাশ";
        else if (payMethod.toLowerCase().includes("nagad")) payMethod = "নগদ";
        else if (payMethod.toLowerCase().includes("rocket")) payMethod = "রকেট";
        else if (payMethod.toLowerCase().includes("sslcommerz")) payMethod = "এসএসএলকমার্জ";
        else if (payMethod.toLowerCase().includes("vibecoin")) payMethod = "ভাইবকয়েন";
      }
      
      translatedMessage = formatTemplate(t("notifications.newOrderMsg"), {
        phone,
        total,
        paymentMethod: payMethod,
      });
    }

    // Helper to translate time left string (e.g. '23h 45m', '5 hours', '45 min')
    const formatTimeLeftBn = (timeStr: string) => {
      if (!isBn) return timeStr;
      let res = timeStr;
      // Replace numbers
      res = toBnDigits(res);
      // Replace units
      res = res.replace(/hours?/gi, "ঘণ্টা")
               .replace(/mins?|minutes?/gi, "মিনিট")
               .replace(/h\b/g, " ঘণ্টা")
               .replace(/m\b/g, " মিনিট");
      return res;
    };

    // Pattern 2: Only <timeLeft> left before promotion '<desc>' (<discount>% OFF) expires.
    const promoMatch = message.match(/Only\s+([^l]+?)\s+left before promotion\s+'([^']+)'\s+\((\d+)%\s+OFF\)\s+expires\./i);
    if (promoMatch) {
      const timeLeft = formatTimeLeftBn(promoMatch[1].trim());
      const desc = promoMatch[2];
      const discount = toBnDigits(promoMatch[3]);
      translatedMessage = formatTemplate(t("notifications.promoExpiringMsg"), {
        mins: timeLeft,
        timeLeft,
        desc,
        discount,
      });
    }

    // Pattern 3: Only <timeLeft> left before <discount>% discount on '<title>' expires.
    const prodPromoMatch = message.match(/Only\s+([^l]+?)\s+left before\s+(\d+)%\s+discount on\s+'([^']+)'\s+expires\./i);
    if (prodPromoMatch) {
      const timeLeft = formatTimeLeftBn(prodPromoMatch[1].trim());
      const discount = toBnDigits(prodPromoMatch[2]);
      const prodTitle = prodPromoMatch[3];
      translatedMessage = formatTemplate(t("notifications.prodPromoExpiringMsg"), {
        mins: timeLeft,
        timeLeft,
        discount,
        title: prodTitle,
      });
    }

    // Pattern 4: Only <timeLeft> left before coupon '<code_name>' (<discount>% OFF) expires.
    const couponMatch = message.match(/Only\s+([^l]+?)\s+left before coupon\s+'([^']+)'\s+\((\d+)%\s+OFF\)\s+expires\./i);
    if (couponMatch) {
      const timeLeft = formatTimeLeftBn(couponMatch[1].trim());
      const codeName = couponMatch[2];
      const discount = toBnDigits(couponMatch[3]);
      translatedMessage = formatTemplate(t("notifications.couponExpiringMsg"), {
        mins: timeLeft,
        timeLeft,
        code: codeName,
        discount,
      });
    }

    return { title: translatedTitle, message: translatedMessage };
  };

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
      const cleanToken = token.replace(/^JWT\s+/i, "").trim();
      const res = await fetch(`${apiBase}/store/notifications/`, {
        headers: {
          Authorization: `JWT ${cleanToken}`,
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
              const { title: toastTitle, message: toastMsg } = translateNotification(
                newItem.title,
                newItem.message
              );
              Swal.fire({
                toast: true,
                position: "top-end",
                icon: newItem.notification_type === "order" ? "success" : "info",
                title: toastTitle,
                text: toastMsg,
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
        const cleanToken = token.replace(/^JWT\s+/i, "").trim();
        await fetch(`${apiBase}/store/notifications/${item.id}/mark_read/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${cleanToken}`,
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
    } else if (item.notification_type === "return" && item.target_id) {
      if (onNavigateToReturn) {
        onNavigateToReturn(item.target_id);
      } else if (onNavigateToOrder) {
        onNavigateToOrder(item.target_id);
      }
      setIsOpen(false);
    } else if (item.notification_type === "promotion" && onNavigateToTab) {
      onNavigateToTab("promotions");
      setIsOpen(false);
    } else if (item.notification_type === "coupon" && onNavigateToTab) {
      onNavigateToTab("coupons");
      setIsOpen(false);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const cleanToken = token.replace(/^JWT\s+/i, "").trim();
      const res = await fetch(`${apiBase}/store/notifications/mark_all_read/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${cleanToken}`,
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

      if (diffMins < 1) return t("notifications.justNow");
      if (diffMins < 60)
        return formatTemplate(t("notifications.minsAgo"), {
          count: toBnDigits(diffMins),
        });
      if (diffHours < 24)
        return formatTemplate(t("notifications.hoursAgo"), {
          count: toBnDigits(diffHours),
        });
      return isBn ? date.toLocaleDateString("bn-BD") : date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && unreadCount > 0) {
      handleMarkAllRead();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with Pulsing Badge */}
      <button
        type="button"
        onClick={handleToggleOpen}
        title={t("notifications.title")}
        className="relative flex items-center justify-center p-2 rounded-xl text-white dark:text-foreground hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
      >
        <Image
          src="/notification.png"
          alt={t("notifications.title")}
          width={20}
          height={20}
          className="object-contain filter brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
        />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-accent text-white font-black text-[9px] shadow-md animate-pulse">
            {unreadCount > 99 ? "99+" : toBnDigits(unreadCount)}
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
                {t("notifications.title")}
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                  {formatTemplate(t("notifications.newBadge"), {
                    count: toBnDigits(unreadCount),
                  })}
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
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="px-3 py-2 bg-primary/5 dark:bg-primary/20 border-b border-foreground/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                activeFilter === "all"
                  ? "bg-secondary text-foreground shadow-xs border border-foreground/15"
                  : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              <span>{t("notifications.filterAll")}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                activeFilter === "all" ? "bg-primary/10 text-foreground" : "opacity-60"
              }`}>
                {toBnDigits(notifications.length)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("order")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                activeFilter === "order"
                  ? "bg-secondary text-foreground shadow-xs border border-foreground/15"
                  : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block"></span>
              <span>{t("notifications.filterOrders")}</span>
              {ordersCount > 0 && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeFilter === "order" ? "bg-primary/10 text-foreground" : "opacity-60"
                }`}>
                  {toBnDigits(ordersCount)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("return")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                activeFilter === "return"
                  ? "bg-secondary text-foreground shadow-xs border border-foreground/15"
                  : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-ping"></span>
              <span>{t("notifications.filterReturns")}</span>
              {returnsCount > 0 && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeFilter === "return" ? "bg-primary/10 text-foreground" : "opacity-60"
                }`}>
                  {toBnDigits(returnsCount)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("promotion")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                activeFilter === "promotion"
                  ? "bg-secondary text-foreground shadow-xs border border-foreground/15"
                  : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block opacity-80"></span>
              <span>{t("notifications.filterPromotions")}</span>
              {promosCount > 0 && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeFilter === "promotion" ? "bg-primary/10 text-foreground" : "opacity-60"
                }`}>
                  {toBnDigits(promosCount)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("coupon")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                activeFilter === "coupon"
                  ? "bg-secondary text-foreground shadow-xs border border-foreground/15"
                  : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block opacity-60"></span>
              <span>{t("notifications.filterCoupons")}</span>
              {couponsCount > 0 && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeFilter === "coupon" ? "bg-primary/10 text-foreground" : "opacity-60"
                }`}>
                  {toBnDigits(couponsCount)}
                </span>
              )}
            </button>
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-foreground/5">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs opacity-60 font-bold uppercase tracking-wider">
                {notifications.length === 0
                  ? t("notifications.noNotifications")
                  : formatTemplate(t("notifications.noFilterResults"), {
                      type:
                        activeFilter === "order"
                          ? t("notifications.filterOrders")
                          : activeFilter === "return"
                            ? t("notifications.filterReturns")
                            : activeFilter === "promotion"
                              ? t("notifications.filterPromotions")
                              : t("notifications.filterCoupons"),
                    })}
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const { title: itemTitle, message: itemMessage } = translateNotification(
                  item.title,
                  item.message
                );
                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkRead(item)}
                    className={`p-3.5 transition-colors cursor-pointer hover:bg-primary/5 flex items-start gap-3 ${
                      !item.is_read ? "bg-accent/5 dark:bg-accent/10" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.notification_type === "order" ? (
                        <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center p-1.5 border border-accent/20">
                          <Image
                            src="/admin/orders.png"
                            alt="Order"
                            width={16}
                            height={16}
                            className="object-contain filter dark:invert"
                          />
                        </div>
                      ) : item.notification_type === "return" ? (
                        <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center p-1.5 border border-accent/20">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                          </svg>
                        </div>
                      ) : item.notification_type === "promotion" ? (
                        <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center p-1.5 border border-accent/20">
                          <Image
                            src="/admin/sales.png"
                            alt="Promotion"
                            width={16}
                            height={16}
                            className="object-contain filter dark:invert"
                          />
                        </div>
                      ) : item.notification_type === "coupon" ? (
                        <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center p-1.5 border border-accent/20">
                          <Image
                            src="/admin/coupons.png"
                            alt="Coupon"
                            width={16}
                            height={16}
                            className="object-contain filter dark:invert"
                          />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center p-1.5 border border-accent/20">
                          <Image
                            src="/notification.png"
                            alt="Notification"
                            width={16}
                            height={16}
                            className="object-contain filter dark:invert"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black truncate text-foreground">
                          {itemTitle}
                        </p>
                        <span className="text-[9px] opacity-60 shrink-0 font-medium">
                          {formatTime(item.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground/80 mt-0.5 leading-snug line-clamp-2">
                        {itemMessage}
                      </p>
                    </div>

                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
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
