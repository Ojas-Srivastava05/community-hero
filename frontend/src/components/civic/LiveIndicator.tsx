import { cn } from '@/lib/utils'

export function LiveIndicator({ active, className }: { active?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider',
        active ? 'text-leaf' : 'text-ink-muted',
        className,
      )}
    >
      <span className={cn('size-2 rounded-full bg-leaf', active && 'animate-pulse')} />
      Live
    </span>
  )
}
