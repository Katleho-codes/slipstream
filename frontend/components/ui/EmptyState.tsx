interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="bg-white border border-[#E2EDE5] rounded-lg p-12 text-center">
      <p className="text-[13px] text-[#9A9890] mb-3">{message}</p>
      {action}
    </div>
  );
}

interface LoadingStateProps {
  className?: string;
}

export function LoadingState({ className }: LoadingStateProps) {
  return (
    <div className={`flex justify-center py-20 ${className ?? ''}`}>
      <div className="w-5 h-5 border-2 border-[#1A3D2B] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}