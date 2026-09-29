import { Module } from '@nestjs/common';

import { LINK_PREVIEW_READER, LinkPreviewHttpClient } from './link-preview-http.client';
import { LinkPreviewsController } from './link-previews.controller';
import { LinkPreviewsService } from './link-previews.service';
import { YOUTUBE_LINK_PREVIEW_READER, YoutubeOembedClient } from './youtube-oembed.client';

@Module({
  controllers: [LinkPreviewsController],
  providers: [
    LinkPreviewsService,
    LinkPreviewHttpClient,
    {
      provide: LINK_PREVIEW_READER,
      useExisting: LinkPreviewHttpClient,
    },
    YoutubeOembedClient,
    {
      provide: YOUTUBE_LINK_PREVIEW_READER,
      useExisting: YoutubeOembedClient,
    },
  ],
})
export class LinkPreviewsModule {}
