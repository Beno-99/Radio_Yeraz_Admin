import axios, { AxiosRequestConfig } from "axios";
import {
  getLocalStorageValue,
  removeLocalStorageValue,
  setLocalStorageValue,
} from "@/lib/browser-storage";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.radioyeraz.com/api"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach token to every request
api.interceptors.request.use((config) => {
  const token = getLocalStorageValue("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as { config?: AxiosRequestConfig & { _retry?: boolean; url?: string }; response?: { status: number } };
    const originalRequest = axiosError.config;

    // ✅ DO NOT INTERCEPT LOGIN REQUESTS
    if (
      originalRequest?.url?.includes("/admin/login") ||
      originalRequest?.url?.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    // ❌ If not 401 → reject normally
    if (axiosError.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    if (originalRequest) {
      originalRequest._retry = true;
    }

    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    try {
      const refreshToken = getLocalStorageValue("refresh_token");

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const refreshData = response.data as {
        accessToken?: string;
        refreshToken?: string;
        access_token?: string;
        refresh_token?: string;
        data?: {
          accessToken?: string;
          refreshToken?: string;
          access_token?: string;
          refresh_token?: string;
        };
      };
      const accessToken =
        refreshData.accessToken ??
        refreshData.access_token ??
        refreshData.data?.accessToken ??
        refreshData.data?.access_token;
      const nextRefreshToken =
        refreshData.refreshToken ??
        refreshData.refresh_token ??
        refreshData.data?.refreshToken ??
        refreshData.data?.refresh_token;

      if (!accessToken) {
        throw new Error("Refresh response did not include an access token");
      }

      setLocalStorageValue("access_token", accessToken);
      if (nextRefreshToken) {
        setLocalStorageValue("refresh_token", nextRefreshToken);
      }

      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      if (originalRequest?.headers) {
        (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
      }

      return api(originalRequest as AxiosRequestConfig);
    } catch (refreshError: unknown) {
      removeLocalStorageValue("access_token");
      removeLocalStorageValue("refresh_token");

      if (typeof window !== "undefined") {
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }

      return Promise.reject(refreshError);
    }
  },
);

export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post("/auth/login", credentials),
  logout: () => {
    const refreshToken = getLocalStorageValue("refresh_token");
    return api.post("/auth/logout", { refreshToken });
  },
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),
};

interface AdminParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

interface AdminData {
  username?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
  [key: string]: string | boolean | undefined;
}

export const adminAPI = {
  getProfile: () => api.get("/admin/profile"),
  getAdmin: (id: string) => api.get(`/admin/${id}`),
  getAllAdmins: (params?: AdminParams) => api.get("/admin", { params }),
  createAdmin: (data: AdminData) => api.post("/admin", data),
  updateAdmin: (id: string, data: AdminData) => api.put(`/admin/${id}`, data),
  deleteAdmin: (id: string) => api.delete(`/admin/${id}`),
  toggleActive: (id: string) => api.put(`/admin/${id}/toggle-active`),
};

interface PostParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

interface PostData {
  _id?: string;
  author?: string;
  [key: string]: string | boolean | undefined;
}

interface AuthorDetails {
  data?: unknown;
  [key: string]: unknown;
}

export const postsAPI = {
  getAllPosts: (params?: PostParams) => api.get("/posts", { params }),

  getPost: (id: string) => api.get(`/posts/${id}`),
  getStats: async () => {
    const { data } = await api.get("/posts/statistics/summary");
    return data;
  },

  getPosts: async ({ page, limit }: { page: number; limit: number }) => {
    const { data } = await api.get("/posts", {
      params: { page, limit },
    });
    return data;
  },

  deletePost: async (id: string) => {
    console.log("API: Deleting post", id);
    try {
      const response = await api.delete(`/posts/${id}`);
      console.log("API Delete response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Delete error:", error);
      throw error;
    }
  },
  toggleLive: (id: string) => api.put(`/posts/${id}/toggle-live`),
  createPost: async (formData: FormData) => {
    const response = await api.post("/posts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updatePost: async (id: string, formData: FormData) => {
    console.log("API: updatePost called with FormData");

    const response = await api.put(`/posts/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  getAuthorById: async (authorId: string) => {
    try {
      const response = await adminAPI.getAdmin(authorId);
      return response.data;
    } catch (error) {
      console.error("Error fetching author:", error);
      throw error;
    }
  },

  // Get post with author details
  getPostWithAuthor: async (postId: string) => {
    try {
      const postResponse = await postsAPI.getPost(postId);
      const post = (postResponse.data?.data || postResponse.data) as PostData;

      if (post.author) {
        const authorResponse = await postsAPI.getAuthorById(post.author) as AuthorDetails;
        return {
          ...post,
          authorDetails: authorResponse.data || authorResponse,
        };
      }

      return post;
    } catch (error) {
      console.error("Error fetching post with author:", error);
      throw error;
    }
  },

  // Get all posts with author details
  getAllPostsWithAuthors: async (params?: PostParams) => {
    try {
      const postsResponse = await api.get("/posts", { params });
      const posts = (postsResponse.data?.data || postsResponse.data) as PostData[];

      const postsWithAuthors = await Promise.all(
        posts.map(async (post: PostData) => {
          if (post.author) {
            try {
              const authorResponse = await postsAPI.getAuthorById(post.author) as AuthorDetails;
              return {
                ...post,
                authorDetails: authorResponse.data || authorResponse,
              };
            } catch (error) {
              console.error(
                `Error fetching author for post ${post._id}:`,
                error,
              );
              return {
                ...post,
                authorDetails: null,
              };
            }
          }
          return post;
        }),
      );

      return postsWithAuthors;
    } catch (error) {
      console.error("Error fetching posts with authors:", error);
      throw error;
    }
  },
};

interface AdParams {
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export const adsAPI = {
  getAllAds: (params?: AdParams) => api.get("/ads", { params }),
  getAdById: (id: string) => api.get(`/ads/${id}`),
  createAd: (data: FormData) => {
    return api.post("/ads", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateAd: (id: string, data: FormData) => {
    return api.put(`/ads/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteAd: (id: string) => api.delete(`/ads/${id}`),
  toggleActive: (id: string) => api.put(`/ads/${id}/toggle-active`),
};

export const streamLinksAPI = {
  getAll: () => api.get('/stream-links'),
  getActive: () => api.get('/stream-links/active'),
  getById: (id: string) => api.get(`/stream-links/${id}`),
  create: (data: {
    title: string;
    url: string;
    description?: string;
    isActive?: boolean;
  }) => api.post('/stream-links', data),
  update: (id: string, data: {
    title?: string;
    url?: string;
    description?: string;
    isActive?: boolean;
  }) => api.patch(`/stream-links/${id}`, data),
  delete: (id: string) => api.delete(`/stream-links/${id}`),
};

export const notificationAPI = {
  getAll: (limit: number = 20) =>
    api.get(`/notifications?limit=${limit}`),
  getUnreadCount: () =>
    api.get('/notifications/unread-count'),
  markAsRead: (id: string) =>
    api.put(`/notifications/${id}/read`),
  markAllAsRead: () =>
    api.put('/notifications/mark-all-read'),
  deleteAll: () =>
    api.delete('/notifications/all'),
};

export default api;
