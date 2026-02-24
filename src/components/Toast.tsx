import { useEffect } from 'react';
import useStore from '../store/useStore.ts';

export default function Toast() {
  const { toast, hideToast } = useStore();

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(hideToast, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, hideToast]);

  return (
    <div
      className="fixed bottom-6 right-6 flex items-center gap-2 font-semibold text-[13px] z-[999] transition-all duration-300"
      style={{
        background: '#14171e',
        border: '1px solid #2dd4a0',
        borderRadius: '12px',
        padding: '12px 18px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        transform: toast.visible ? 'translateY(0)' : 'translateY(100px)',
        opacity: toast.visible ? 1 : 0,
        pointerEvents: toast.visible ? 'auto' : 'none',
      }}
    >
      <span>✅</span>
      <span style={{ color: '#f0f2f8' }}>{toast.message}</span>
    </div>
  );
}
