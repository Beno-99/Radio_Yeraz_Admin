import { Module } from '@nestjs/common';
import { StreamLinkService } from './stream-link.service';
import { StreamLinkController } from './stream-link.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StreamLinkController],
  providers: [StreamLinkService],
  exports: [StreamLinkService],   // Export if you want to use the service in other modules
})
export class StreamLinkModule {}
