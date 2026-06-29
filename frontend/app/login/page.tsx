"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api/api";
import {
  getLocalStorageValue,
  setLocalStorageValue,
} from "@/lib/browser-storage";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getLocalStorageValue("access_token");
    const user = getLocalStorageValue("user");

    if (token && user) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const response = await authAPI.login({ username, password });

      if (response.data.success) {
        setLocalStorageValue("access_token", response.data.data.accessToken);
        setLocalStorageValue("refresh_token", response.data.data.refreshToken);
        setLocalStorageValue("user", JSON.stringify(response.data.data.admin));
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      let errorMessage = "Username or password is incorrect.";

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: {
            status?: number;
            data?: { message?: string };
          };
        };

        if (axiosError.response?.status && axiosError.response.status !== 401) {
          errorMessage =
            axiosError.response.data?.message ||
            "Unable to sign in. Please try again.";
        }
      } else if (err instanceof Error) {
        errorMessage = "Unable to sign in. Please try again.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Radio Yeraz Admin
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
