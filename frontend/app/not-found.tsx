"use client";

import Link from "next/link";
import {
  Home,
  Search,
  Compass,
  Navigation,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Animated number */}
        <div className="relative inline-block mb-8">
          <div className="text-[120px] md:text-[150px] font-black text-gray-900 opacity-5">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-pulse">
                404
              </div>
              <div className="absolute -top-2 -right-4">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Illustration */}
        <div className="mb-10">
          <div className="relative w-48 h-48 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full animate-pulse"></div>
            <div className="absolute inset-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <div className="relative">
                <Compass className="h-16 w-16 text-gray-700 animate-spin duration-3000" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-red-500 rounded-full animate-ping opacity-20"></div>
                </div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 animate-bounce">
              <Navigation className="h-10 w-10 text-blue-600 rotate-45" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Lost in Space?
        </h1>
        <p className="text-gray-600 mb-10 text-lg">
          The page you&apos;re looking for seems to have drifted into the unknown. 
          Don&apos;t worry, we&apos;ll help you navigate back.
        </p>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <Link
            href="/dashboard"
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-0.5 hover:scale-105 transition-transform duration-300"
          >
            <div className="relative bg-white rounded-xl p-4 flex items-center justify-center gap-3 group-hover:bg-blue-50 transition">
              <Home className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Dashboard</span>
            </div>
          </Link>

          <button
            onClick={() => router.back()}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-0.5 hover:scale-105 transition-transform duration-300"
          >
            <div className="relative bg-white rounded-xl p-4 flex items-center justify-center gap-3 group-hover:bg-purple-50 transition">
              <div className="h-5 w-5 text-purple-600 transform -scale-x-100">
                ←
              </div>
              <span className="font-semibold text-gray-900">Go Back</span>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <p className="text-gray-500 mb-4">Or search for what you need:</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search our platform..."
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition shadow-sm hover:shadow-md"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Need help?{" "}
            <Link
              href="/support"
              className="text-blue-600 hover:underline font-medium"
            >
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}