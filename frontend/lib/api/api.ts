import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://192.168.1.115:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ✅ Attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ✅ Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ DO NOT INTERCEPT LOGIN REQUESTS
    if (
      originalRequest?.url?.includes("/admin/login") ||
      originalRequest?.url?.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    // ❌ If not 401 → reject normally
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { access_token, refresh_token } = response.data;

      localStorage.setItem("access_token", access_token);
      if (refresh_token) {
        localStorage.setItem("refresh_token", refresh_token);
      }

      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      originalRequest.headers.Authorization = `Bearer ${access_token}`;

      return api(originalRequest);
    } catch (refreshError: any) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

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
  logout: () => api.post("/auth/logout"),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),
};

export const adminAPI = {
  getProfile: () => api.get("/admin/profile"),
  getAdmin: (id: string) => api.get(`/admin/${id}`),
  getAllAdmins: (params?: any) => api.get("/admin", { params }),
  createAdmin: (data: any) => api.post("/admin", data),
  updateAdmin: (id: string, data: any) => api.put(`/admin/${id}`, data),
  deleteAdmin: (id: string) => api.delete(`/admin/${id}`),
  toggleActive: (id: string) => api.put(`/admin/${id}/toggle-active`),
};

export const postsAPI = {
  getAllPosts: (params?: any) => api.get("/posts", { params }),

  getPost: (id: string) => api.get(`/posts/${id}`),
  getStats: async () => {
    const { data } = await api.get("/posts/stats");
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

    // ✅ Don't set Content-Type here - let axios handle it
    const response = await api.put(`/posts/${id}`, formData, {
      headers: {
        // Override the default Content-Type for this request
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
      // First get the post
      const postResponse = await postsAPI.getPost(postId);
      const post = postResponse.data;

      // Then get the author details using the author ID from the post
      if (post.author) {
        const authorResponse = await postsAPI.getAuthorById(post.author);
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
  getAllPostsWithAuthors: async (params?: any) => {
    try {
      const postsResponse = await api.get("/posts", { params });
      const posts = postsResponse.data;

      // Get author details for each post
      const postsWithAuthors = await Promise.all(
        posts.map(async (post: any) => {
          if (post.author) {
            try {
              const authorResponse = await postsAPI.getAuthorById(post.author);
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

export const adsAPI = {
  getAllAds: (params?: any) => api.get("/ads", { params }),
  getAdById: (id: string) => api.get(`/ads/${id}`),
  createAd: (data: FormData) => {
    // ✅ Use the api instance but let it handle headers
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

export default api;
