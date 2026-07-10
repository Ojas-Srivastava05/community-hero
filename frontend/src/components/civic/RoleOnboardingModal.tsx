import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronRight, MapPin, Shield, Sparkles, X } from 'lucide-react'
import { LanguagePicker, useI18n } from '@/lib/i18n'
import { ADMIN_REGIONS, type AdminRegionId } from '@/lib/admin-region'
import { cn } from '@/lib/utils'

const ADMIN_DISMISS_KEY = 'ch-onboarding-dismissed-admin'
const CITIZEN_DISMISS_KEY = 'ch-onboarding-dismissed-citizen'

export function isOnboardingDismissed(role: 'admin' | 'citizen'): boolean {
  if (typeof window === 'undefined') return true
  const key = role === 'admin' ? ADMIN_DISMISS_KEY : CITIZEN_DISMISS_KEY
  return localStorage.getItem(key) === '1'
}

export function dismissOnboarding(role: 'admin' | 'citizen') {
  const key = role === 'admin' ? ADMIN_DISMISS_KEY : CITIZEN_DISMISS_KEY
  localStorage.setItem(key, '1')
}

type Props = {
  open: boolean
  role: 'admin' | 'citizen'
  onClose: () => void
  /** Admin step 3 — voluntary jurisdiction pick */
  adminRegionId?: AdminRegionId
  onAdminRegionChange?: (id: AdminRegionId) => void
}

export function RoleOnboardingModal({
  open,
  role,
  onClose,
  adminRegionId = 'all',
  onAdminRegionChange,
}: Props) {
  const { t } = useI18n()
  const [step, setStep] = useState(0)
  const isAdmin = role === 'admin'
  const maxStep = isAdmin ? 2 : 1

  useEffect(() => {
    if (open) setStep(0)
  }, [open, role])

  const finish = () => {
    dismissOnboarding(role)
    onClose()
  }

  const steps = isAdmin
    ? [
        {
          title: t('onboarding.admin.s1.title'),
          body: t('onboarding.admin.s1.body'),
          icon: Shield,
        },
        {
          title: t('onboarding.admin.s2.title'),
          body: t('onboarding.admin.s2.body'),
          icon: CheckCircle2,
        },
        {
          title: t('onboarding.admin.s3.title'),
          body: t('onboarding.admin.s3.body'),
          icon: MapPin,
        },
      ]
    : [
        {
          title: t('onboarding.citizen.s1.title'),
          body: t('onboarding.citizen.s1.body'),
          icon: Sparkles,
        },
        {
          title: t('onboarding.citizen.s2.title'),
          body: t('onboarding.citizen.s2.body'),
          icon: CheckCircle2,
        },
      ]

  const current = steps[step]
  const Icon = current?.icon ?? Sparkles

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/50 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-rule bg-paper shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-rule px-5 py-3">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-indigo" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  {isAdmin ? t('onboarding.admin.badge') : t('onboarding.citizen.badge')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <LanguagePicker compact />
                <button
                  type="button"
                  onClick={finish}
                  className="rounded-full p-1 text-ink-muted hover:bg-ink/5"
                  aria-label={t('onboarding.skip')}
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="px-5 py-5">
              <div className="mb-4 flex gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i <= step ? 'bg-indigo' : 'bg-rule',
                    )}
                  />
                ))}
              </div>

              <h2 id="onboarding-title" className="display text-lg font-bold text-ink">
                {current?.title}
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                {current?.body}
              </p>

              {isAdmin && step === 2 && onAdminRegionChange && (
                <div className="mt-4 space-y-2">
                  <label className="block text-xs font-bold text-ink">
                    {t('onboarding.admin.regionLabel')}
                  </label>
                  <select
                    value={adminRegionId}
                    onChange={(e) => onAdminRegionChange(e.target.value as AdminRegionId)}
                    className="w-full rounded-xl border border-rule bg-paper px-3 py-2.5 text-sm font-semibold text-ink outline-none focus:ring-2 focus:ring-indigo/30"
                  >
                    {ADMIN_REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {t(r.labelKey)}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] leading-snug text-ink-muted">
                    {t('onboarding.admin.regionDemoHint')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-rule px-5 py-4">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1 rounded-2xl border border-rule py-3 text-sm font-bold text-ink"
                >
                  {t('onboarding.back')}
                </button>
              )}
              {step < maxStep ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-indigo py-3 text-sm font-bold text-paper"
                >
                  {t('onboarding.next')}
                  <ChevronRight className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  className="flex-1 rounded-2xl bg-coral py-3 text-sm font-bold text-paper"
                >
                  {t('onboarding.done')}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
