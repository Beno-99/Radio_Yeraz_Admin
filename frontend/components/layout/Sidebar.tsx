"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Megaphone,
  LogOut,
  X,
  User,
  Radio,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { removeLocalStorageValue } from "@/lib/browser-storage";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    displayName: string;
    role: string;
  };
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Admins", href: "/dashboard/admin", icon: Users },
  { name: "Posts", href: "/dashboard/posts", icon: FileText },
  { name: "Carousels", href: "/dashboard/carousels", icon: Megaphone },
  { name: "Stream Links", href: "/dashboard/streamLinks", icon: Radio },
];

export default function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const confirmLogout = () => {
    removeLocalStorageValue("access_token");
    removeLocalStorageValue("refresh_token");
    removeLocalStorageValue("user");
    window.location.href = "/login";
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] bg-gray-900 transform transition-transform duration-300 ease-in-out lg:w-64 lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <div className="flex min-w-0 items-center">
            <Image
              src="/radioLogo.jpg"
              alt="Radio Yeraz logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full"
            />

            <span className="ml-3 truncate text-xl font-bold text-white">
              Radio Yeraz
            </span>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden min-h-11 min-w-11 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-800">
          <div className="flex min-w-0 items-center">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>

            <div className="ml-3 min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user.displayName}
              </p>

              <p className="truncate text-xs text-gray-400">{user.role}</p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex min-h-11 items-center px-3 py-2 text-sm font-medium rounded-md transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? "text-white" : "text-gray-400"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <button
            onClick={() => setIsLogoutDialogOpen(true)}
            className="flex min-h-11 items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-800 hover:text-white transition"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Logout
          </button>
        </div>
      </aside>

      <ConfirmationDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={confirmLogout}
        title="Are you sure?"
        message="You will be signed out of the admin dashboard."
        type="warning"
        confirmText="Logout"
      />
    </>
  );
}
