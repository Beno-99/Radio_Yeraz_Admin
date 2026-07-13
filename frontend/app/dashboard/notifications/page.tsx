"use client";

import { useState, useEffect, useCallback } from "react";
import { notificationAPI } from "@/lib/api/api";
import { getLocalStorageValue } from "@/lib/browser-storage";
import { format } from "date-fns";
import { Trash2, CheckCircle, Bell, Eye } from "lucide-react";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  postId?: string;
  authorName?: string;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface User {
  id: string;
  username: string;
  role: string;
  displayName?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [currentUser] = useState<User | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const userStr = getLocalStorageValue("user");
      return userStr ? (JSON.parse(userStr) as User) : null;
    } catch {
      return null;
    }
  });

  const isSuperAdmin = (user: User | null): boolean => {
    if (!user) return false;

    return (
      user.role === "SUPER_ADMIN" ||
      user.role === "Super_Admin"
    );
  };

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await notificationAPI.getAll(50);

      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    const interval = setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => {
      window.clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? { ...n, isRead: true }
            : n
        )
      );

      setUnreadCount((prev) =>
        Math.max(0, prev - 1)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!confirm("Mark all notifications as read?")) {
      return;
    }

    try {
      await notificationAPI.markAllAsRead();

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    if (
      !confirm(
        "⚠️ Delete ALL notifications? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await notificationAPI.deleteAll();

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!confirm("Delete this notification?")) {
      return;
    }

    const targetNotification = notifications.find((notif) => notif._id === id);

    try {
      await notificationAPI.deleteOne(id);

      setNotifications((prev) => prev.filter((notif) => notif._id !== id));

      if (targetNotification && !targetNotification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete notification.");
    }
  };

  const canDeleteNotifications = isSuperAdmin(currentUser);

  return (
    <div className="min-w-0 p-3 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 break-words text-2xl font-bold sm:text-3xl">
            <Bell className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8" />
            Notifications
          </h1>

          <p className="text-gray-500 mt-1">
            {unreadCount} unread
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle size={18} />
            Mark All Read
          </button>

          {canDeleteNotifications && (
            <button
              onClick={handleDeleteAll}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-white transition hover:bg-red-700"
            >
              <Trash2 size={18} />
              Delete All
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-center py-12">
          Loading notifications...
        </p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          No notifications yet
        </div>
      ) : (
        <div className="max-w-full overflow-hidden rounded-xl bg-white shadow">
          <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left w-12"></th>
                <th className="px-6 py-4 text-left">
                  Title
                </th>
                <th className="px-6 py-4 text-left">
                  Message
                </th>
                <th className="px-6 py-4 text-left">
                  Author
                </th>
                <th className="px-6 py-4 text-left">
                  Date
                </th>
                <th className="px-6 py-4 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {notifications.map((notif) => (
                <tr
                  key={notif._id}
                  className={`border-b hover:bg-gray-50 transition ${
                    !notif.isRead
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    {!notif.isRead && (
                      <span className="inline-block w-3 h-3 bg-blue-600 rounded-full" />
                    )}
                  </td>

                  <td className="px-6 py-4 font-medium">
                    {notif.title}
                  </td>

                  <td className="max-w-md px-6 py-4 text-gray-600">
                    <span className="line-clamp-3 break-words">
                    {notif.message}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {notif.authorName || "System"}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {format(
                      new Date(notif.createdAt),
                      "MMM dd, yyyy HH:mm"
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {!notif.isRead && (
                        <button
                          title="Mark as read"
                          onClick={() =>
                            handleMarkAsRead(
                              notif._id
                            )
                          }
                          className="text-blue-600 hover:text-blue-800 p-2"
                        >
                          <Eye size={18} />
                        </button>
                      )}

                      {canDeleteNotifications && (
                        <button
                          title="Delete"
                          onClick={() => handleDeleteOne(notif._id)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
