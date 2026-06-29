"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocalStorageValue } from "@/lib/browser-storage";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getLocalStorageValue("access_token");
    const user = getLocalStorageValue("user");

    router.replace(token && user ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
    </div>
  );
}
