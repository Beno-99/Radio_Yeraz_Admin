// config/postForm.fields.ts
import { FormField } from "@/components/forms/FormBuilder";

export const postFormFields: FormField[] = [
  {
    name: "title",
    label: "Post Title",
    type: "text",
    required: true,
    placeholder: "Enter a compelling title...",
    description: "Make it catchy to attract readers",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    required: true,
    placeholder: "Write your post content here...",
    description: "Share your story, news, or updates",
  },
  {
    name: "mainImage",
    label: "Featured Image",
    type: "file",
    description: "Upload a high-quality image that represents your post",
  },
  {
    name: "youtubeUrl",
    label: "YouTube URL",
    type: "url",
    placeholder: "https://www.youtube.com/watch?v=VIDEO_ID",
    description: "Optional YouTube video for this post",
  },
  {
    name: "profileName",
    label: "Author Name",
    type: "text",
    placeholder: "Radio Yeraz",
    description: "The name that will appear as the author",
  },
  {
    name: "eventDate",
    label: "Event Date",
    type: "date",
    description: "When did/will this event happen?",
  },
  {
    name: "eventTime",
    label: "Event Time",
    type: "text",
    description: "What time does the event start?",
  },
  {
    name: "location",
    label: "Location",
    type: "text",
    required: true,
    placeholder: "e.g., Yerevan, Armenia",
    description: "Where this post is related to",
  },
  {
    name: "isLive",
    label: "Live Streaming",
    type: "checkbox",
    description: "Mark as live streaming event",
  },
  {
    name: "isPublished",
    label: "Publish to Public",
    type: "checkbox",
    description: "Make visible to public users",
  },
  {
    name: "autoExpire",
    label: "Auto Expire",
    type: "checkbox",
    description: "Hide this post automatically after the selected number of days",
  },
  {
    name: "expireAfterDays",
    label: "Keep Post For (Days)",
    type: "number",
    placeholder: "5",
    description: "Default is 5 days from the posted date",
  },
  {
    name: "link",
    label: "External Link",
    type: "text",
    placeholder: "https://example.com/article",
    description: "Link to external content or source",
  },
];
