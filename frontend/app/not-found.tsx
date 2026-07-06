"use client";

import Link from "next/link";
import { ArrowLeft, Home, Search, Compass, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="w-full max-w-md text-center">
        <div className="relative mb-4 inline-block sm:mb-6">
          <div className="text-[76px] font-black text-gray-900 opacity-5 sm:text-[120px] md:text-[150px]">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="animate-pulse bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-5xl font-black text-transparent sm:text-7xl md:text-8xl">
                404
              </div>
              <div className="absolute -right-4 -top-2">
                <div className="flex h-7 w-7 animate-bounce items-center justify-center rounded-full bg-red-500 shadow-lg sm:h-8 sm:w-8">
                  <span className="text-sm font-bold text-white">!</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="relative mx-auto h-32 w-32 sm:h-48 sm:w-48">
            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-blue-100 to-purple-100" />
            <div className="absolute inset-6 flex items-center justify-center rounded-full bg-white shadow-lg sm:inset-8">
              <div className="relative">
                <Compass className="h-10 w-10 animate-spin text-gray-700 duration-3000 sm:h-16 sm:w-16" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-7 w-7 animate-ping rounded-full bg-red-500 opacity-20 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>
            <div className="absolute -right-2 -top-2 animate-bounce">
              <Navigation className="h-8 w-8 rotate-45 text-blue-600 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-gray-900 sm:mb-4 sm:text-3xl">
          Lost in Space?
        </h1>
        <p className="mb-6 text-base leading-relaxed text-gray-600 sm:mb-8 sm:text-lg">
          The page you&apos;re looking for seems to have drifted into the
          unknown. Don&apos;t worry, we&apos;ll help you navigate back.
        </p>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:mb-10 sm:grid-cols-2 sm:gap-4">
          <Link
            href="/login"
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-0.5 transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="relative flex min-h-12 items-center justify-center gap-3 rounded-xl bg-white p-3 transition group-hover:bg-blue-50 sm:p-4">
              <Home className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Login</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => router.back()}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-0.5 transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="relative flex min-h-12 items-center justify-center gap-3 rounded-xl bg-white p-3 transition group-hover:bg-purple-50 sm:p-4">
              <ArrowLeft className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Go Back</span>
            </div>
          </button>
        </div>

        <div className="mb-6 hidden sm:block">
          <p className="mb-4 text-gray-500">Or search for what you need:</p>
          <div className="relative mx-auto max-w-md">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search our platform..."
              className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-12 pr-4 shadow-sm outline-none transition hover:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="hidden border-t border-gray-200 pt-6 sm:block">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:underline"
            >
              Return to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
