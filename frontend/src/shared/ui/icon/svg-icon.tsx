import type React from 'react';
import {
  IconMap,
  type IconMapTypes,
  IconSizes,
  type IconSizeTypes,
} from '@/constants/icons';

interface SVGIconProps {
  icon: IconMapTypes;
  size?: IconSizeTypes;
  color?: string;
  variant?: 'solid' | 'outline';
  className?: string;
  style?: React.CSSProperties;
}

const SVGIcon = ({
  icon,
  size = 'md',
  color,
  variant = 'outline',
  style,
  className,
}: SVGIconProps) => {
  const solidIconName = `${icon}Solid` as IconMapTypes;
  const iconEntry =
    variant === 'solid'
      ? (IconMap[solidIconName] ?? IconMap[icon])
      : IconMap[icon];

  if (!iconEntry) return null;

  const sharedStyle = {
    width: IconSizes[size],
    height: IconSizes[size],
    color,
    ...style,
  };

  if (typeof iconEntry === 'string') {
    return (
      <img
        alt=""
        aria-hidden="true"
        data-slot="svg-icon"
        className={className}
        src={iconEntry}
        style={sharedStyle}
      />
    );
  }

  const Icon = iconEntry;

  return (
    <Icon
      aria-hidden="true"
      focusable="false"
      data-slot="svg-icon"
      className={className}
      style={sharedStyle}
    />
  );
};

export default SVGIcon;
