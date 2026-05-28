import { Music, ExternalLink } from 'lucide-react';

export interface ProfileMusicWidgetProps {
  musicUrl: string;
}

export function ProfileMusicWidget({ musicUrl }: ProfileMusicWidgetProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-violet-950/20 p-4 backdrop-blur-md">
      <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
        <Music className="size-5" />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="truncate typo-sm-m text-white">대표 음악 아카이브</p>
        <a
          href={musicUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 truncate typo-xs-r text-violet-400 hover:underline"
        >
          {musicUrl}
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}
