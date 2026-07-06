// src/components/layout/Header.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Menu, ChevronDown, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import {
  getLocalStorageValue,
  removeLocalStorageValue,
} from "@/lib/browser-storage";

interface HeaderProps {
  onMenuClick: () => void;
  user: {
    username: string;
    displayName: string;
    role: string;
  };
}

// Define the notification type based on what useAdminNotifications returns
interface Notification {
  _id: string;
  id?: string; // Optional id field if it exists
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const typeIcon: Record<string, string> = {
  NEW_POST: "📢",
  POST_UPDATED: "✏️",
  POST_DELETED: "🗑️",
  POST_PUBLISHED: "✅",
};

const timeAgo = (dateStr: string) => {
  const now = new Date();
  const past = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Helper function to generate a unique key without using Math.random()
const generateNotificationKey = (notification: Notification, index: number): string => {
  // Use existing IDs first
  if (notification.id) return notification.id;
  if (notification._id) return notification._id;
  // Fallback to combination of index and createdAt timestamp as a pure alternative
  // This avoids Math.random() which is impure
  return `${notification.type}-${notification.createdAt}-${index}`;
};

export default function Header({ onMenuClick, user }: HeaderProps) {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markAllRead, markRead } =
    useAdminNotifications();

  const handleSignOutClick = () => {
    setIsProfileOpen(false);
    setIsSignOutDialogOpen(true);
  };

  const handleLogout = () => {
    removeLocalStorageValue("access_token");
    removeLocalStorageValue("refresh_token");
    removeLocalStorageValue("user");
    router.push("/login");
  };

  const handleProfileClick = () => {
    const UserData = getLocalStorageValue("user");
    if (!UserData) {
      router.push("/login");
      return;
    }
    const userDataParsed = JSON.parse(UserData);
    if (!userDataParsed.id) {
      router.push("/login");
      return;
    }
    router.push(`/dashboard/admin/${userDataParsed.id}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleName = user.role.toLowerCase().replace("_", " ");

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="bg-gray-900 px-3 sm:px-4 lg:px-8">
        <div className="flex h-16 min-w-0 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="min-h-11 min-w-11 rounded-md p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Right side */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative min-h-11 min-w-11 rounded-lg p-2 text-white hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="fixed left-3 right-3 top-16 z-50 mt-2 max-h-[calc(100vh-5rem)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-80">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      <button
                        onClick={markAllRead}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Mark all as read
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-[60vh] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      notifications.map((n: Notification, index: number) => (
                        <div
                          key={generateNotificationKey(n, index)}
                          onClick={() => markRead(n._id)}
                          className={`min-h-11 border-b border-gray-100 p-4 hover:bg-gray-50 dark:border-gray-700 cursor-pointer ${
                            !n.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                          }`}
                        >
                          <div className="flex items-start">
                            <span className="text-xl mr-3 mt-0.5">
                              {typeIcon[n.type] || "🔔"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {n.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                {n.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {timeAgo(n.createdAt)}
                              </p>
                            </div>
                            {!n.isRead && (
                              <div className="flex-shrink-0 ml-2 mt-1">
                                <div className="h-2 w-2 bg-blue-500 rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => router.push("/dashboard/notifications")}
                      className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="group flex min-h-11 min-w-0 items-center gap-2 rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800 sm:gap-3"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                  <span className="text-white font-medium text-sm">
                    {user.displayName?.charAt(0).toUpperCase() || "A"}
                  </span>
                </div>
                <div className="hidden min-w-0 text-left md:block">
                  <p className="max-w-36 truncate text-sm font-medium text-white group-hover:text-black">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize group-hover:text-blue-500 transition">
                    {roleName}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {isProfileOpen && (
                <div className="fixed left-3 right-3 top-16 z-50 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-56">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                        <span className="text-white font-medium">
                          {user.displayName?.charAt(0).toUpperCase() || "A"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900 dark:text-white">
                          {user.displayName}
                        </p>
                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                          {user.username}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={handleProfileClick}
                      className="flex min-h-11 items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <User className="mr-3 h-4 w-4" />
                      Your Profile
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                    <button
                      onClick={handleSignOutClick}
                      className="flex min-h-11 items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isSignOutDialogOpen}
        onClose={() => setIsSignOutDialogOpen(false)}
        onConfirm={handleLogout}
        title="Sign Out?"
        message="Are you sure you want to sign out of your admin account?"
        type="delete"
        confirmText="Sign Out"
        cancelText="Stay Signed In"
      />
    </header>
  );
}
