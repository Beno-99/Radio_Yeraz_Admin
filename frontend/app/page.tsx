"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocalStorageValue } from "@/lib/browser-storage";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getLocalStorageValue("access_token");
    router.replace(token ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
    </div>
  );
}
