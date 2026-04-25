import { z } from "zod";

// Schema definition
export const adFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z
    .string()
    .url("Must be a valid image URL")
    .optional()
    .or(z.literal("")),
  videoUrl: z
    .string()
    .url("Must be a valid video URL")
    .optional()
    .or(z.literal("")),
  targetUrl: z
    .string()
    .url("Must be a valid target URL")
    .optional()
    .or(z.literal("")),
  advertiserName: z.string().min(2, "Advertiser name required"),
  budget: z.coerce
    .number()
    .min(1, "Budget must be at least $1")
    .optional()
    .or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(false),
  platform: z.enum(["web", "mobile", "both"]).default("both"),
  targetAudience: z.string().optional().or(z.literal("")),
  impressions: z.number().default(0),
  clicks: z.number().default(0),
});

export type AdFormData = z.infer<typeof adFormSchema>;

// Form fields configuration
export const adFormFields = [
  {
    name: "title",
    label: "Ad Title",
    type: "text" as const,
    required: true,
    placeholder: "Enter ad campaign title",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea" as const,
    required: true,
    placeholder: "Describe the ad campaign",
  },
  {
    name: "imageUrl",
    label: "Image URL",
    type: "text" as const,
    required: false,
    placeholder: "https://example.com/ad-image.jpg",
  },
  {
    name: "videoUrl",
    label: "Video URL",
    type: "text" as const,
    required: false,
    placeholder: "https://example.com/ad-video.mp4",
  },
  {
    name: "targetUrl",
    label: "Target URL",
    type: "text" as const,
    required: false,
    placeholder: "https://example.com/landing-page",
  },
  {
    name: "advertiserName",
    label: "Advertiser",
    type: "text" as const,
    required: true,
    placeholder: "Company name",
  },
  {
    name: "budget",
    label: "Budget ($)",
    type: "number" as const,
    required: false,
    placeholder: "1000",
    min: 1,
  },
  {
    name: "startDate",
    label: "Start Date",
    type: "date" as const,
    required: false,
  },
  {
    name: "endDate",
    label: "End Date",
    type: "date" as const,
    required: false,
  },
  {
    name: "isActive",
    label: "Active Campaign",
    type: "checkbox" as const,
    defaultValue: false,
  },
  {
    name: "platform",
    label: "Platform",
    type: "select" as const,
    options: [
      { value: "web", label: "Web Only" },
      { value: "mobile", label: "Mobile Only" },
      { value: "both", label: "Both Platforms" },
    ],
    defaultValue: "both",
  },
  {
    name: "targetAudience",
    label: "Target Audience",
    type: "text" as const,
    required: false,
    placeholder: "e.g., Age 25-40, Tech Enthusiasts",
  },
  {
    name: "impressions",
    label: "Initial Impressions",
    type: "number" as const,
    required: false,
    defaultValue: 0,
    hidden: true,
  },
  {
    name: "clicks",
    label: "Initial Clicks",
    type: "number" as const,
    required: false,
    defaultValue: 0,
    hidden: true,
  },
];
