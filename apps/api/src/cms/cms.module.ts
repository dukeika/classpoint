import { Module } from '@nestjs/common';
import { DatabaseModule } from '@classpoint/db';
import {
  BrandingService,
  NewsService,
  EventService,
  GalleryService,
} from './services';
import {
  BrandingController,
  NewsController,
  EventController,
  GalleryController,
  PublicCmsController,
} from './controllers';

@Module({
  imports: [DatabaseModule],
  controllers: [
    BrandingController,
    NewsController,
    EventController,
    GalleryController,
    PublicCmsController,
  ],
  providers: [
    BrandingService,
    NewsService,
    EventService,
    GalleryService,
  ],
  exports: [
    BrandingService,
    NewsService,
    EventService,
    GalleryService,
  ],
})
export class CmsModule {}
