import { useState, type ReactNode } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface KakaoMapCoordinate {
  lat: number;
  lng: number;
}

export interface KakaoMapMarker {
  position: KakaoMapCoordinate;
  draggable?: boolean;
  onDragEnd?: (pos: KakaoMapCoordinate) => void;
}

export interface KakaoMapProps {
  center: KakaoMapCoordinate;
  level?: number;
  className?: string;
  marker?: KakaoMapMarker | null;
  showZoomControl?: boolean;
  onMapClick?: (pos: KakaoMapCoordinate) => void;
  children?: ReactNode;
}

/**
 * 카카오 지도 공통 컴포넌트.
 * 읽기 전용 위치 표시(상세뷰) 및 인터랙티브 위치 선택(피커) 모두에서 재사용한다.
 */
export const KakaoMap = ({
  center,
  level = 3,
  className,
  marker,
  showZoomControl = true,
  onMapClick,
  children,
}: KakaoMapProps) => {
  const [map, setMap] = useState<kakao.maps.Map | null>(null);

  const handleZoomIn = () => {
    if (!map) return;
    map.setLevel(map.getLevel() - 1);
  };

  const handleZoomOut = () => {
    if (!map) return;
    map.setLevel(map.getLevel() + 1);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10',
        className,
      )}
    >
      <Map
        onCreate={setMap}
        center={center}
        isPanto
        level={level}
        className="size-full touch-none"
        onClick={(_map, mouseEvent) => {
          if (!onMapClick) return;
          const latLng = mouseEvent.latLng;
          onMapClick({ lat: latLng.getLat(), lng: latLng.getLng() });
        }}
      >
        {marker && (
          <MapMarker
            position={marker.position}
            draggable={marker.draggable}
            onDragEnd={(markerInstance) => {
              if (!marker.onDragEnd) return;
              const pos = markerInstance.getPosition();
              marker.onDragEnd({ lat: pos.getLat(), lng: pos.getLng() });
            }}
          />
        )}
        {children}
      </Map>

      {showZoomControl && (
        <div
          role="group"
          aria-label="지도 확대 및 축소"
          className="absolute right-2.5 bottom-2.5 z-10 flex flex-col overflow-hidden rounded-lg border border-white/15 bg-surface-2/90 shadow-md backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="지도 확대"
            onClick={handleZoomIn}
            className="flex size-7.5 items-center justify-center text-grey-100 transition-colors hover:bg-white/10 active:bg-white/20"
          >
            <Plus className="size-4" />
          </button>
          <div className="h-px w-full bg-white/10" />
          <button
            type="button"
            aria-label="지도 축소"
            onClick={handleZoomOut}
            className="flex size-7.5 items-center justify-center text-grey-100 transition-colors hover:bg-white/10 active:bg-white/20"
          >
            <Minus className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
};
