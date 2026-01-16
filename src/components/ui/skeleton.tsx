/**
 * T071: Skeleton Loading 元件
 * 📐 Figma: 通用載入骨架元件
 *
 * Design specs:
 * - Animated pulse effect
 * - Flexible sizing
 * - Can be used as building blocks
 */

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 動畫類型 */
  variant?: 'pulse' | 'shimmer';
}

/**
 * 基礎骨架元件
 */
export function Skeleton({ className, variant = 'pulse', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-muted rounded-md',
        variant === 'pulse' && 'animate-pulse',
        variant === 'shimmer' &&
          'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

/**
 * 文字行骨架
 */
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

/**
 * 圓形頭像骨架
 */
export function SkeletonAvatar({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return <Skeleton className={cn('rounded-full', sizes[size], className)} />;
}

/**
 * 卡片骨架
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('border-border bg-card rounded-2xl border p-4', className)}>
      <Skeleton className="mb-4 h-32 w-full rounded-xl" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="mb-3 h-3 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-12 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * 列表項骨架
 */
export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4', className)}>
      <SkeletonAvatar />
      <div className="flex-1">
        <Skeleton className="mb-2 h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}
