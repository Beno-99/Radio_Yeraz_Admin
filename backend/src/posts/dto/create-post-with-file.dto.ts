import { CreatePostDto } from './create-post.dto';

// This is just for TypeScript, not for validation
export class CreatePostWithFileDto extends CreatePostDto {
  // No validation - file is handled separately
  mainImage?: string;
}
