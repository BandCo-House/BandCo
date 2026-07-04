import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'rgba(255, 255, 255, 0.24)',
          '--normal-text': 'var(--greyScale-50)',
          '--normal-border':
            'color-mix(in srgb, var(--surface-1) 40%, transparent)',
          '--border-radius': 'var(--radius-xl)',
        } as React.CSSProperties
      }
      closeButton={false}
      toastOptions={{
        closeButton: false,
        classNames: {
          toast:
            'relative isolate w-[min(calc(100vw-2rem),40rem)] overflow-hidden whitespace-normal break-words rounded-md border-0 bg-white/24 px-6 py-5 text-grey-50 shadow-none backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-[radial-gradient(circle_at_88%_50%,var(--primary-main)_0%,rgba(236,252,171,0.32)_24%,transparent_58%)] before:blur-2xl before:content-[""] [border-color:color-mix(in_srgb,var(--surface-1)_40%,transparent)] [border-style:solid] [border-width:0.5px_1px_2px_0.5px] [box-shadow:0_3px_6px_2px_rgba(255,255,255,0.16)]',
          icon: 'relative z-10',
          content: 'relative z-10 min-w-0 whitespace-normal break-words',
          title: 'whitespace-normal break-words typo-lg-sb text-grey-50',
          description: 'whitespace-normal break-words text-grey-100',
          closeButton: 'hidden',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
