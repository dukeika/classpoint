import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { DatabaseModule } from '@classpoint/db';
import { CommsModule } from '@classpoint/comms';

@Module({
  imports: [DatabaseModule, CommsModule],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
