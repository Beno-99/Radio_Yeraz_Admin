// hooks/useAuthorName.ts (rename from userAuthorName.ts)
import { useState, useEffect } from "react";
import { adminAPI } from "@/lib/api/api";

export const useAuthorName = (authorId: string) => {
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthorName = async () => {
      if (!authorId) {
        setUsername("Admin");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching author with ID:", authorId);

        const response = await adminAPI.getAdmin(authorId);
        console.log("Author response:", response);

        const adminData = response.data;

        if (adminData) {
          // Try different possible field names
          const name =
            adminData.profileName ||
            adminData.username ||
            adminData.name ||
            "Admin";

          setUsername(name);
        } else {
          setUsername("Admin");
        }
      } catch (error) {
        console.error("Error fetching author name:", error);
        setUsername("Admin");
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorName();
  }, [authorId]);

  return { username, loading, error };
};
