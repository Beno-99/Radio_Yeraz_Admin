"use client";

import { useState, useEffect } from "react";
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

  

  useEffect(() => {
  const loadNotifications = async () => {
    try {
      const { data } = await notificationAPI.getAll(50);

      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  void loadNotifications();

  const interval = setInterval(() => {
    void loadNotifications();
  }, 30000);

  return () => clearInterval(interval);
}, []);

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

  const isAdmin = isSuperAdmin(currentUser);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="w-8 h-8" />
            Notifications
          </h1>

          <p className="text-gray-500 mt-1">
            {unreadCount} unread
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
          >
            <CheckCircle size={18} />
            Mark All Read
          </button>

          {isAdmin && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
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
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
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

                  <td className="px-6 py-4 text-gray-600 max-w-md truncate">
                    {notif.message}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
