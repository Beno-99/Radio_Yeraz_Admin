"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  getLocalStorageValue,
  setLocalStorageValue,
  subscribeToLocalStorage,
} from "@/lib/browser-storage";

export interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  data?: unknown;
  createdAt: string;
  isRead: boolean;
}

const getBackendUrl = (): string => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.radioyeraz.com";

  try {
    const normalizedUrl = configuredUrl.startsWith("//")
      ? `https:${configuredUrl}`
      : configuredUrl;

    return new URL(normalizedUrl).origin;
  } catch {
    return `https://${configuredUrl.replace(/^\/+|\/+$/g, "")}`;
  }
};

const BACKEND_URL = getBackendUrl();

const getStorageKey = () => {
  try {
    const user = getLocalStorageValue("user");
    const parsed = user ? JSON.parse(user) : null;
    return `notifications_read_${parsed?.id || "guest"}`;
  } catch {
    return "notifications_read_guest";
  }
};

const getLocalReadIds = (): Set<string> => {
  try {
    const stored = getLocalStorageValue(getStorageKey());
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const saveLocalReadIds = (ids: Set<string>) => {
  try {
    setLocalStorageValue(getStorageKey(), JSON.stringify([...ids]));
  } catch {
    // ignore localStorage errors
  }
};

const getAccessToken = () => getLocalStorageValue("access_token") || "";

const updateSocketAuth = (socket: Socket) => {
  socket.auth = {
    ...(typeof socket.auth === "object" && socket.auth ? socket.auth : {}),
    token: getAccessToken(),
  };
};

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const readIdsRef = useRef<Set<string>>(new Set());
  const cleanupRef = useRef(false);

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
    const token = getAccessToken();
    if (!token) {
      return;
    }

    cleanupRef.current = false;

    const socket = io(BACKEND_URL, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    const handleConnect = () => {
      console.log("Admin socket connected");
      socket.emit("get_notifications");
    };

    const handleDisconnect = (reason: string) => {
      if (cleanupRef.current) {
        return;
      }

      if (socket.active) {
        console.info(`Admin socket disconnected temporarily: ${reason}`);
        return;
      }

      console.warn(`Admin socket disconnected: ${reason}`);
    };

    const handleConnectError = (err: Error) => {
      console.warn(`Admin socket connection error: ${err.message}`);
    };

    const handleReconnectAttempt = () => {
      updateSocketAuth(socket);
    };

    const handleReconnect = (attempt: number) => {
      console.log(`Admin socket reconnected after ${attempt} attempt(s)`);
      socket.emit("get_notifications");
    };

    const handleReconnectError = (err: Error) => {
      console.warn(`Admin socket reconnect failed: ${err.message}`);
    };

    const handleNotificationsList = (data: {
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
    };

    const unsubscribeStorage = subscribeToLocalStorage(() => {
      updateSocketAuth(socket);
    });

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("notifications_list", handleNotificationsList);
    socket.on("new_notification", handleIncomingNotification);
    socket.on("admin_notification", handleIncomingNotification);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.io.on("reconnect", handleReconnect);
    socket.io.on("reconnect_error", handleReconnectError);

    return () => {
      cleanupRef.current = true;
      unsubscribeStorage();
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("notifications_list", handleNotificationsList);
      socket.off("new_notification", handleIncomingNotification);
      socket.off("admin_notification", handleIncomingNotification);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect", handleReconnect);
      socket.io.off("reconnect_error", handleReconnectError);
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
