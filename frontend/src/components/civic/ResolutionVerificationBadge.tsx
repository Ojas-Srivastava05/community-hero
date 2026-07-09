import { ShieldCheck, ShieldX } from 'lucide-react'
import type { ProofComparison } from '../../lib/shared-constants'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function ResolutionVerificationBadge({
  comparison,
  className,
}: {
  comparison?: ProofComparison | null
  className?: string
}) {
  const { t } = useI18n()
  if (!comparison) return null
  const ok = comparison.improved && comparison.confidence >= 0.7
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-xl border px-3 py-2.5',
        ok ? 'border-leaf/30 bg-leaf-soft/40' : 'border-amber/40 bg-amber-soft/40',
        className,
      )}
    >
      {ok ? <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf" /> : <ShieldX className="mt-0.5 size-4 shrink-0 text-amber" />}
      <div>
        <p className="text-sm font-bold text-ink">{ok ? t('proof.verified') : t('proof.mismatch')}</p>
        <p className="mt-0.5 text-[11px] text-ink-muted">{comparison.summary}</p>
        <p className="mt-1 text-[10px] font-semibold text-ink-muted">AI confidence {Math.round(comparison.confidence * 100)}%</p>
      </div>
    </div>
  )
}
