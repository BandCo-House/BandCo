import { Module } from '@nestjs/common';

import { LINK_PREVIEW_READER, LinkPreviewHttpClient } from './link-preview-http.client';
import { LinkPreviewsController } from './link-previews.controller';
import { LinkPreviewsService } from './link-previews.service';

@Module({
  controllers: [LinkPreviewsController],
  providers: [
    LinkPreviewsService,
    LinkPreviewHttpClient,
    {
      provide: LINK_PREVIEW_READER,
      useExisting: LinkPreviewHttpClient,
    },
  ],
})
export class LinkPreviewsModule {}
