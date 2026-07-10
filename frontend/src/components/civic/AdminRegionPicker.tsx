import { MapPin } from 'lucide-react'
import { ADMIN_REGIONS } from '@/lib/admin-region'
import { useAdminRegion } from '@/lib/admin-region'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function AdminRegionPicker({ className, compact }: { className?: string; compact?: boolean }) {
  const { regionId, setRegionId } = useAdminRegion()
  const { t } = useI18n()

  return (
    <label className={cn('inline-flex items-center gap-1.5', className)}>
      <MapPin className={cn('text-indigo-soft', compact ? 'size-3' : 'size-3.5')} aria-hidden />
      <span className={cn('font-bold text-paper/70', compact ? 'text-[9px]' : 'text-[10px]')}>
        {t('admin.queue.regionFilter')}
      </span>
      <select
        value={regionId}
        onChange={(e) => setRegionId(e.target.value as typeof regionId)}
        className={cn(
          'rounded-full border border-paper/25 bg-ink font-semibold text-paper outline-none focus:ring-2 focus:ring-indigo/40',
          compact ? 'max-w-[7rem] truncate px-2 py-0.5 text-[9px]' : 'max-w-[9rem] truncate px-2.5 py-1 text-[10px]',
        )}
        aria-label={t('admin.queue.regionFilter')}
      >
        {ADMIN_REGIONS.map((r) => (
          <option key={r.id} value={r.id}>
            {t(r.labelKey)}
          </option>
        ))}
      </select>
    </label>
  )
}
