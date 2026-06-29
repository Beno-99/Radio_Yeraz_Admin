"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  getLocalStorageValue,
  subscribeToLocalStorage,
} from "@/lib/browser-storage";

interface User {
  username: string;
  displayName: string;
  role: string;
  _id?: string;
}

const getServerSnapshot = () => null;
const getHydratedServerSnapshot = () => false;
const getHydratedSnapshot = () => typeof window !== "undefined";
const getAccessTokenSnapshot = () => getLocalStorageValue("access_token");
const getUserSnapshot = () => getLocalStorageValue("user");

function parseStoredUser(userData: string | null): User | null {
  if (!userData) {
    return null;
  }

  try {
    return JSON.parse(userData) as User;
  } catch {
    return null;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hydrated = useSyncExternalStore(
    subscribeToLocalStorage,
    getHydratedSnapshot,
    getHydratedServerSnapshot,
  );
  const token = useSyncExternalStore(
    subscribeToLocalStorage,
    getAccessTokenSnapshot,
    getServerSnapshot,
  );
  const userData = useSyncExternalStore(
    subscribeToLocalStorage,
    getUserSnapshot,
    getServerSnapshot,
  );
  const user = useMemo(() => parseStoredUser(userData), [userData]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!token || !user) {
      router.replace("/login");
    }
  }, [hydrated, token, user, router]);

  if (!hydrated || !token || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen max-w-full overflow-hidden bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
        />

        <main className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
