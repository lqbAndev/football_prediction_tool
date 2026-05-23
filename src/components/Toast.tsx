import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast = ({ message, onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/35 bg-[rgba(6,25,17,0.95)] px-4 py-3 text-sm font-semibold text-emerald-400 shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-md animate-toast-in">
      <CheckCircle className="h-5 w-5 text-emerald-400" />
      <span>{message}</span>
    </div>
  );
};
