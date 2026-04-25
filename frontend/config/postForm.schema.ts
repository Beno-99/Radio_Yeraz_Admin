// postForm.schema.ts
import { z } from "zod";

export const postFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  mainImage: z.any().optional(),
  video: z.any().optional(),
  profileName: z.string().default("Radio Yeraz"),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  location: z.string().optional(),
  isLive: z.boolean().default(false),
  reminderSentAt: z.string().optional(),
  isPublished: z.boolean().default(false),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

/** 🔥 THIS IS THE IMPORTANT ONE */
export type PostFormValues = z.input<typeof postFormSchema>;
