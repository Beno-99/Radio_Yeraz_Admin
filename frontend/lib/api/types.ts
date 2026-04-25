import api from "./api";

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any;
}

// API client wrapper
export class ApiClient {
  static async fetch<T>(
    endpoint: string,
    params: ApiParams,
  ): Promise<PaginatedResponse<T>> {
    const response = await api.get(endpoint, { params });
    return {
      data: response.data.data || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
      limit: response.data.limit || 10,
      totalPages: response.data.totalPages || 1,
      hasNextPage: (response.data.page || 1) < (response.data.totalPages || 1),
      hasPrevPage: (response.data.page || 1) > 1,
    };
  }
}
// types/index.ts or wherever your Post type is defined
export interface Post {
  _id: string;
  title: string;
  description: string;
  mainImage: string;
  video: string;
  profileName: string;
  eventDate: string;
  location: string;
  isLive: boolean;
  isPublished: boolean;
  postedDate: string;
  author:
    | string
    | {
        // Can be either string ID or populated object
        _id: string;
        displayName?: string;
        profileName?: string;
        username?: string;
        name?: string;
        email?: string;
      };
  link: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
