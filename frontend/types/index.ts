// Core data types for your entire application
export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Admin extends BaseEntity {
  _id: string;
  username: string;
  displayName: string;
  role: "SUPER_ADMIN" | "ADMIN";
  isActive: boolean;
  lastLogin?: string;
}

export interface Post extends BaseEntity {
  isPublished: boolean;
  status?: "draft" | "published" | "expired";
  liveStatus?: "UNKNOWN" | "UPCOMING" | "LIVE" | "WAS_LIVE" | "NOT_LIVE";
  liveStatusCheckedAt?: string | null;
  title: string;
  description: string;
  mainImage: string;
  videoSource?: "YOUTUBE" | "FACEBOOK" | null;
  youtubeUrl?: string | null;
  youtubeVideoId?: string | null;
  facebookUrl?: string | null;
  profileName: string;
  eventDate?: string;
  location?: string;
  isLive: boolean;
  reminderEnabled?: boolean;
  reminderSentAt?: string | null;
  postedDate: string;
  author: { _id: string; displayName: string };
  link?: string;
  expiresAt?: string;
}

export interface Carousel extends BaseEntity {
  name: string;
  title?: string;
  description?: string;
  advertiserName?: string;
  platform?: "web" | "mobile" | "both";
  budget?: number;
  impressions?: number;
  videoUrl?: string;
  image: string;
  targetUrl?: string;
  isActive: boolean;
  clicks: number;
  displayOrder: number;
  status?: "pending" | "active" | "inactive" | "expired";
  startDate: string;
  endDate?: string;
  author: { _id: string; displayName: string };
}

// Generic response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  totalPages?: number;
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Filter types
export interface FilterOption {
  field: string;
  label: string;
  type: "select" | "date" | "boolean" | "text";
  options?: { value: string; label: string }[];
}

export interface StreamLink {
  _id: string;
  title: string;
  url: string;
  description?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Optional: Type for creating new link (without _id and timestamps)
export interface CreateStreamLinkDto {
  title: string;
  url: string;
  description?: string;
  isActive?: boolean;
}

// Optional: Type for updating
export type UpdateStreamLinkDto = Partial<CreateStreamLinkDto>;
