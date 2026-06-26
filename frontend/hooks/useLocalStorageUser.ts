// hooks/useLocalStorageUser.ts
import { useState, useEffect } from "react";
import {
  getLocalStorageValue,
  removeLocalStorageValue,
  setLocalStorageValue,
} from "@/lib/browser-storage";

interface User {
  id: string;
  username: string;
  role?: string;
}

export function useLocalStorageUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserFromStorage = () => {
      try {
        const userString = getLocalStorageValue("user");
        if (userString) {
          const parsedUser: User = JSON.parse(userString);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
      } finally {
        setLoading(false);
      }
    };

    getUserFromStorage();
  }, []);

  // Function to update user in localStorage and state
  const updateUser = (newUser: User) => {
    try {
      setLocalStorageValue("user", JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      console.error("Error updating user in localStorage:", error);
    }
  };

  // Function to clear user from localStorage
  const clearUser = () => {
    removeLocalStorageValue("user");
    setUser(null);
  };

  return {
    user,
    username: user?.username,
    userId: user?.id,
    loading,
    updateUser,
    clearUser,
    isAuthenticated: !!user,
  };
}
