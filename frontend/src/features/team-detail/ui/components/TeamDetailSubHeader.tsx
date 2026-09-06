import React from 'react';

interface TeamDetailSubHeaderProps {
  teamName: string;
  isEditing?: boolean;
  onOpenSearchModal: () => void;
}

export const TeamDetailSubHeader: React.FC<TeamDetailSubHeaderProps> = ({
  teamName,
  isEditing = false,
  onOpenSearchModal,
}) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="typo-lg-sb text-grey-100">
        {teamName || '듀얼 기타 편성'}
      </h2>
      {isEditing && (
        <button
          type="button"
          onClick={onOpenSearchModal}
          aria-label="팀원 추가"
          className="rounded-[24px] bg-[#ECFCAB] px-4 py-2 typo-sm-sb text-[#1B1B32] shadow-xs transition-colors hover:bg-[#DDFE55]"
        >
          팀원 추가
        </button>
      )}
    </div>
  );
};
