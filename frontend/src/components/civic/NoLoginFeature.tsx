import { ShieldCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/** Highlights privacy-first reporting for judges and citizens. */
export function NoLoginBadge({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-leaf/30 bg-leaf-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-leaf',
        className,
      )}
    >
      <ShieldCheck className="size-3.5" aria-hidden />
      {t('feature.noLogin.badge')}
    </span>
  )
}

export function NoLoginCallout({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <div className={cn('rounded-2xl border border-leaf/25 bg-leaf-soft/50 px-4 py-3', className)}>
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-leaf text-paper">
          <ShieldCheck className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">{t('feature.noLogin.title')}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{t('feature.noLogin.hint')}</p>
        </div>
      </div>
    </div>
  )
}
