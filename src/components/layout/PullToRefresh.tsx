import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
}

const PullToRefresh = ({ onRefresh, isRefreshing = false }: PullToRefreshProps) => {
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const ref = useRef<HTMLDivElement>(null);

  // Use external refreshing state if provided
  useEffect(() => {
    if (isRefreshing !== undefined) {
      setRefreshing(isRefreshing);
    }
  }, [isRefreshing]);

  useEffect(() => {
    const touchStart = (e: TouchEvent) => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const touchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      
      currentY.current = e.touches[0].clientY;
      const pullDistance = currentY.current - startY.current;
      
      if (pullDistance > 0 && pullDistance < 100) {
        if (ref.current) {
          ref.current.style.transform = `translateY(${pullDistance * 0.5}px)`;
        }
      }
    };

    const touchEnd = async () => {
      if (!isPulling) return;
      
      const pullDistance = currentY.current - startY.current;
      
      if (pullDistance > 70) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
      
      if (ref.current) {
        ref.current.style.transform = 'translateY(0)';
      }
      
      setIsPulling(false);
    };

    document.addEventListener('touchstart', touchStart, { passive: true });
    document.addEventListener('touchmove', touchMove, { passive: true });
    document.addEventListener('touchend', touchEnd);

    return () => {
      document.removeEventListener('touchstart', touchStart);
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend', touchEnd);
    };
  }, [isPulling, onRefresh]);

  return (
    <div ref={ref} className="pull-to-refresh">
      <RefreshCw className={`h-6 w-6 text-blue-500 ${refreshing ? 'animate-spin' : ''}`} />
    </div>
  );
};

export default PullToRefresh;