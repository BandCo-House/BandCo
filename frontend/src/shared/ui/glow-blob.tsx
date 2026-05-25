import { useId } from 'react';
import { cn } from '../lib/utils';

export function GlowBlob({ className }: { className?: string }) {
  const rawId = useId();
  const safeId = rawId.replace(/:/g, '');
  const filterId = `filter_${safeId}`;
  const gradientId = `paint_linear_${safeId}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 353 678"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
      preserveAspectRatio="none"
    >
      <g filter={`url(#${filterId})`}>
        <path
          d="M354.222 684.439C141.51 721.444 -54.6672 585.939 -147.429 541.939C-240.19 497.939 -433.917 1162.65 -127.171 1226.5C179.575 1290.35 904.543 908.945 926.82 537.628C989.673 -510.001 214.544 94.999 345.197 392.771C393.139 502.038 445.738 668.518 354.222 684.439Z"
          fill={`url(#${gradientId})`}
        />
      </g>
      <defs>
        <filter
          id={filterId}
          x="-438.551"
          y="-198.039"
          width={1514}
          height="1576.58"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="72.5"
            result={`effect1_foregroundBlur_${safeId}`}
          />
        </filter>
        <linearGradient
          id={gradientId}
          x1="3.40972"
          y1={742}
          x2="663.109"
          y2="232.642"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0511104" stopColor="#E1FC73" stopOpacity="0.2" />
          <stop offset="0.853476" stopColor="#E1FC73" />
        </linearGradient>
      </defs>
    </svg>
  );
}
