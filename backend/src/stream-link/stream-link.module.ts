import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StreamLinkService } from './stream-link.service';
import { StreamLinkController } from './stream-link.controller';
import { StreamLink, StreamLinkSchema } from './schemas/stream-link.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: StreamLink.name, 
        schema: StreamLinkSchema 
      },
    ]),
  ],
  controllers: [StreamLinkController],
  providers: [StreamLinkService],
  exports: [StreamLinkService],   // Export if you want to use the service in other modules
})
export class StreamLinkModule {}