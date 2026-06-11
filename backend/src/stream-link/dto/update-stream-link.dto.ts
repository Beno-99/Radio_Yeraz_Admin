import { PartialType } from '@nestjs/mapped-types';
import { CreateStreamLinkDto } from './create-stream-link.dto';

export class UpdateStreamLinkDto extends PartialType(CreateStreamLinkDto) {}