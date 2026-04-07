import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { TypeSelectStep } from './steps/TypeSelectStep';
import { PracticeBasicStep } from './steps/PracticeBasicStep';
import { SongSelectStep } from './steps/SongSelectStep';
import { TeamSelectStep } from './steps/TeamSelectStep';
import { MeetingBasicStep } from './steps/MeetingBasicStep';
import { MemberSelectStep } from './steps/MemberSelectStep';
import { useScheduleCreateForm } from '../model/useScheduleCreateForm';

interface ScheduleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
}

export const ScheduleCreateModal = ({
  isOpen,
  onClose,
  initialDate,
}: ScheduleCreateModalProps) => {
  const { state, actions } = useScheduleCreateForm(onClose, initialDate);
  const { scheduleType, currentStep, formData } = state;
  const { handleTypeSelect, updateForm, handleNextStep, handleSubmit } = actions;

  const renderStep = () => {
    if (currentStep === 0) {
      return <TypeSelectStep onSelect={handleTypeSelect} />;
    }

    if (scheduleType === 'PRACTICE') {
      switch (currentStep) {
        case 1:
          return (
            <PracticeBasicStep
              data={formData}
              onChange={updateForm}
              onNext={handleNextStep}
            />
          );
        case 2:
          return (
            <SongSelectStep
              selectedId={formData.songId}
              onChange={(songId) => updateForm({ songId })}
              onNext={handleNextStep}
            />
          );
        case 3:
          return (
            <TeamSelectStep
              selectedTeamId={formData.teamId}
              onChange={(teamId) => updateForm({ teamId })}
              onSubmit={handleSubmit}
            />
          );
        default:
          return null;
      }
    }

    if (scheduleType === 'MEETING') {
      switch (currentStep) {
        case 1:
          return (
            <MeetingBasicStep
              data={formData}
              onChange={updateForm}
              onNext={handleNextStep}
            />
          );
        case 2:
          return (
            <MemberSelectStep
              selectedIds={formData.participantUserIds}
              onChange={(participantUserIds) => updateForm({ participantUserIds })}
              memo={formData.memo}
              onMemoChange={(memo) => updateForm({ memo })}
              onSubmit={handleSubmit}
            />
          );
        default:
          return null;
      }
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-xl">
        <DialogHeader className="px-8 pt-8 pb-2">
          <DialogTitle className="text-2xl text-foreground">
            새 일정 추가
          </DialogTitle>
        </DialogHeader>
        <div className="px-8 pb-8">
          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
