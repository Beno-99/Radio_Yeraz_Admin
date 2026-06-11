"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

export interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  data?: unknown;
  createdAt: string;
  isRead: boolean;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
  : "http://192.168.1.197:8000";

const getStorageKey = () => {
  try {
    const user = localStorage.getItem("user");
    const parsed = user ? JSON.parse(user) : null;
    return `notifications_read_${parsed?.id || "guest"}`;
  } catch {
    return "notifications_read_guest";
  }
};

const getLocalReadIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(getStorageKey());
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const saveLocalReadIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify([...ids]));
  } catch {
    // ignore localStorage errors
  }
};

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const readIdsRef = useRef<Set<string>>(new Set());

  const calculateUnread = useCallback(
    (notifs: AdminNotification[], readIds: Set<string>) => {
      return notifs.filter((n) => !readIds.has(n._id)).length;
    },
    [],
  );

  const applyLocalReadState = useCallback(
    (notifs: AdminNotification[], readIds: Set<string>) => {
      return notifs.map((n) => ({
        ...n,
        isRead: readIds.has(n._id),
      }));
    },
    [],
  );

  const handleIncomingNotification = useCallback(
    (data: AdminNotification) => {
      const id = data._id;

      const notifWithReadState = {
        ...data,
        isRead: readIdsRef.current.has(id),
      };

      setNotifications((prev) => {
        if (prev.some((n) => n._id === id)) {
          return prev;
        }

        const updated = [notifWithReadState, ...prev].slice(0, 50);

        setUnreadCount(
          calculateUnread(updated, readIdsRef.current),
        );

        return updated;
      });
    },
    [calculateUnread],
  );

  useEffect(() => {
    if (socketRef.current?.connected) {
      return;
    }

    readIdsRef.current = getLocalReadIds();

    const socket = io(BACKEND_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Admin socket connected:", socket.id);
      socket.emit("get_notifications");
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Socket connect error:", err.message);
    });

    socket.on(
      "notifications_list",
      (data: {
        notifications: AdminNotification[];
        unreadCount: number;
      }) => {
        const readIds = readIdsRef.current;

        const withLocalRead = applyLocalReadState(
          data.notifications || [],
          readIds,
        );

        setNotifications(withLocalRead);

        setUnreadCount(
          calculateUnread(withLocalRead, readIds),
        );
      },
    );

    socket.on("new_notification", handleIncomingNotification);
    socket.on("admin_notification", handleIncomingNotification);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    applyLocalReadState,
    calculateUnread,
    handleIncomingNotification,
  ]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const allIds = new Set(prev.map((n) => n._id));

      readIdsRef.current = allIds;
      saveLocalReadIds(allIds);

      setUnreadCount(0);

      return prev.map((n) => ({
        ...n,
        isRead: true,
      }));
    });
  }, []);

  const markRead = useCallback(
    (id: string) => {
      if (!id) return;

      readIdsRef.current.add(id);
      saveLocalReadIds(readIdsRef.current);

      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n._id === id
            ? { ...n, isRead: true }
            : n,
        );

        setUnreadCount(
          calculateUnread(updated, readIdsRef.current),
        );

        return updated;
      });
    },
    [calculateUnread],
  );

  return {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
  };
}