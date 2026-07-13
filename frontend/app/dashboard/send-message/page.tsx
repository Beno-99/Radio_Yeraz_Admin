"use client";

import { FormEvent, useState } from "react";
import { BellRing, CheckCircle2, Loader2, Send } from "lucide-react";
import { notificationAPI } from "@/lib/api/api";

export default function SendMessagePage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    setSuccessMessage("");
    setErrorMessage("");

    if (!trimmedTitle || !trimmedMessage) {
      setErrorMessage("Title and message are required.");
      return;
    }

    try {
      setSending(true);
      await notificationAPI.broadcast({
        title: trimmedTitle,
        message: trimmedMessage,
      });

      setTitle("");
      setMessage("");
      setSuccessMessage("Notification sent successfully.");
    } catch (error) {
      console.error("Failed to send notification:", error);
      setErrorMessage("Failed to send notification. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-w-0 p-3 sm:p-6">
      <div className="mb-6 min-w-0">
        <h1 className="flex items-center gap-3 break-words text-2xl font-bold sm:text-3xl">
          <Send className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8" />
          Send Message
        </h1>

        <p className="mt-1 text-gray-500">
          Send a push notification message to mobile app users.
        </p>
      </div>

      <div className="max-w-3xl rounded-xl bg-white p-4 shadow sm:p-6">
        <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <BellRing className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
              New Notification
            </h2>
            <p className="text-sm text-gray-500">
              This will be delivered through Firebase Cloud Messaging.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              className="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Radio Yeraz"
            />
            <span className="mt-1 block text-right text-xs text-gray-400">
              {title.length}/120
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Message
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={240}
              rows={5}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Write your message"
            />
            <span className="mt-1 block text-right text-xs text-gray-400">
              {message.length}/240
            </span>
          </label>

          {successMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-white transition hover:bg-red-700 disabled:opacity-60 sm:w-auto"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              {sending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
