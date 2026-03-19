import { MapPin } from 'lucide-react';
import { useId } from 'react';

interface PlaceSelectProps {
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
}

export const PlaceSelect = ({ value, onChange, label }: PlaceSelectProps) => {
  const id = useId();

  // TODO: 장소 목록 API 연동 필요. 현재는 임시 구현.
  const placeOptions = [
    { id: 'place-1', name: 'A 연습실' },
    { id: 'place-2', name: 'B 연습실' },
    { id: 'place-3', name: '홍대 합주실' },
  ];

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
        <select
          id={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
        >
          <option value="" disabled>
            장소 선택
          </option>
          {placeOptions.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
