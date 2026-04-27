'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ParentGate } from '@/components/parent/ParentGate'
import { LanguageToggle } from '@/components/LanguageToggle'
import { useAnalyticsStore } from '@/lib/stores/analyticsStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { useWorldStore } from '@/lib/stores/worldStore'
import { useCharacterStore } from '@/lib/stores/characterStore'
import { WORLDS, getWorldById } from '@/lib/constants/worlds'
import { LEVELS } from '@/lib/constants/levels'
import { LOCALE_BCP47, type Locale } from '@/i18n/config'

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr)
  // Map next-intl locale ('en' | 'es') to BCP-47 tags via the shared
  // LOCALE_BCP47 table in i18n/config.ts (single source of truth).
  const bcp47 = LOCALE_BCP47[locale as Locale] ?? LOCALE_BCP47.en
  return date.toLocaleDateString(bcp47, { month: 'short', day: 'numeric' })
}

type TabType = 'overview' | 'skills' | 'worlds' | 'activity' | 'settings'

export default function ParentDashboard() {
  const router = useRouter()
  const t = useTranslations('parent')
  const tCommon = useTranslations('common')
  const tMascot = useTranslations('mascot')
  const locale = useLocale()
  const [authenticated, setAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [pinError, setPinError] = useState('')

  // Phase 4 yokoten cleanup: replace dead `mounted` flag with the
  // characterStore hydration gate. Auth gate (ParentGate) takes seconds
  // anyway, so hydration is realistically done before render — but we
  // still gate the loading return on `_hasHydrated` so the first frame
  // doesn't flash "0 stars / no sessions" against a returning-parent's
  // real numbers. Note: hasCreatedCharacter check NOT used here because
  // a parent should still be able to view the dashboard even on a fresh
  // install (they may have just set up the device for a kid).
  const { _hasHydrated, characterName, hasCreatedCharacter, resetCharacter } = useCharacterStore()
  const { totalStars, currentStreak, longestStreak, diagnosticResult, skillLevel, moduleProgress, resetProgress } = useProgressStore()
  const { worldProgress, resetWorldProgress } = useWorldStore()
  const { totalTimePlayedMs, totalSessions, worldStats, operationStats, getWeeklyPlayTime, getStrengths, getAreasForPractice, getAccuracyTrend, getRecentSessions, setParentPin, exportData, resetAllAnalytics } = useAnalyticsStore()

  const handleExportData = useCallback(() => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mathquest-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [exportData])

  const handlePinChange = useCallback(() => {
    if (!/^\d{4}$/.test(newPin)) {
      setPinError(t('settings.pinFourDigits'))
      return
    }
    setParentPin(newPin)
    setNewPin('')
    setPinError('')
    alert(t('settings.pinUpdated'))
  }, [newPin, setParentPin, t])

  const handleResetAll = useCallback(() => {
    resetProgress()
    resetWorldProgress()
    resetAllAnalytics()
    resetCharacter()
    setShowResetConfirm(false)
    router.push('/')
  }, [resetProgress, resetWorldProgress, resetAllAnalytics, resetCharacter, router])

  if (!_hasHydrated) return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><div className="text-4xl animate-pulse">{tCommon('loading')}</div></div>

  if (!authenticated) return <ParentGate onSuccess={() => setAuthenticated(true)} onCancel={() => router.push('/')} />

  const weeklyTime = getWeeklyPlayTime()
  // Store returns raw operation IDs ('addition', 'counting', …) so it stays
  // locale-agnostic. UI maps to localized labels here at render time.
  const strengths = getStrengths()
  const areasForPractice = getAreasForPractice()
  const strengthsLabels = strengths.map(id => t(`operationLabels.${id}`))
  const areasForPracticeLabels = areasForPractice.map(id => t(`operationLabels.${id}`))
  const accuracyTrend = getAccuracyTrend()
  const recentSessions = getRecentSessions(7)

  const totalModulesCompleted = Object.values(moduleProgress).filter(m => m.completed).length
  const totalPossibleModules = LEVELS.reduce((sum, level) => sum + level.modules.length, 0)
  const overallPercent = Math.round((totalModulesCompleted / totalPossibleModules) * 100)

  const tabs: { id: TabType; icon: string }[] = [
    { id: 'overview', icon: 'O' },
    { id: 'skills', icon: 'S' },
    { id: 'worlds', icon: 'W' },
    { id: 'activity', icon: 'A' },
    { id: 'settings', icon: 'G' },
  ]

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <button onClick={() => router.push('/')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">
            <span>&#x2190;</span> {t('backToGame')}
          </button>
          <h1 className="text-xl font-semibold text-slate-800">{t('title')}</h1>
          <LanguageToggle />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm mb-6 p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {(characterName || 'A')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{characterName || tMascot('fallbackName')}</h2>
              <p className="text-slate-500">{t('skillLevel')} <span className="font-medium capitalize text-slate-700">{t(`skillLevels.${skillLevel}`)}</span></p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              {t(`tabs.${tab.id}`)}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-slate-500 text-sm">{t('stats.totalStars')}</p>
                  <p className="text-3xl font-bold text-yellow-500">{totalStars}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-slate-500 text-sm">{t('stats.currentStreak')}</p>
                  <p className="text-3xl font-bold text-orange-500">{t('stats.streakDays', { days: currentStreak })}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-slate-500 text-sm">{t('stats.thisWeek')}</p>
                  <p className="text-3xl font-bold text-blue-500">{formatDuration(weeklyTime)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-slate-500 text-sm">{t('stats.totalSessions')}</p>
                  <p className="text-3xl font-bold text-green-500">{totalSessions}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('overview.overallProgress')}</h3>
                <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all" style={{ width: `${overallPercent}%` }} />
                </div>
                <p className="text-slate-600">{t('overview.modulesCompleted', { done: totalModulesCompleted, total: totalPossibleModules, percent: overallPercent })}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('overview.quickInsights')}</h3>
                {areasForPractice.length > 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 font-medium">{t('overview.recommendedFocus')}</p>
                    <p className="text-amber-700">{t('overview.needsPractice', { areas: areasForPracticeLabels.join(', ') })}</p>
                  </div>
                ) : strengths.length > 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">{t('overview.greatProgress')}</p>
                    <p className="text-green-700">{t('overview.strongIn', { areas: strengthsLabels.join(', ') })}</p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800">{t('overview.keepPlaying')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div key="skills" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {diagnosticResult ? (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('skills.diagnosticResults')}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-500 text-sm">{t('skills.score')}</p>
                      <p className="text-2xl font-bold text-slate-800">{diagnosticResult.correctAnswers}/{diagnosticResult.totalQuestions}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-500 text-sm">{t('skills.level')}</p>
                      <p className="text-2xl font-bold capitalize text-slate-800">{t(`skillLevels.${diagnosticResult.skillLevel}`)}</p>
                    </div>
                  </div>
                  {diagnosticResult.completedAt && <p className="text-slate-500 text-sm">{t('skills.completed', { date: new Date(diagnosticResult.completedAt).toLocaleDateString(LOCALE_BCP47[locale as Locale] ?? LOCALE_BCP47.en) })}</p>}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <p className="text-slate-600">{t('skills.noDiagnostic')}</p>
                </div>
              )}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('skills.skillsByOperation')}</h3>
                {Object.keys(operationStats).length > 0 ? (
                  <div className="space-y-4">
                    {Object.values(operationStats).map(stat => {
                      const accuracy = stat.totalAttempts > 0 ? Math.round((stat.correctAnswers / stat.totalAttempts) * 100) : 0
                      return (
                        <div key={stat.operation} className="border-b border-slate-100 pb-4 last:border-0">
                          <div className="flex justify-between mb-2">
                            <span className="font-medium capitalize text-slate-700">{t(`operationLabels.${stat.operation}`)}</span>
                            <span className="text-slate-500">{t('skills.accuracySuffix', { percent: accuracy })}</span>
                          </div>
                          <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`absolute inset-y-0 left-0 rounded-full transition-all ${accuracy >= 80 ? 'bg-green-500' : accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-400'}`} style={{ width: `${accuracy}%` }} />
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{t('skills.attempts', { count: stat.totalAttempts })}</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-slate-600">{t('skills.noSkillData')}</p>
                )}
              </div>
              {strengths.length > 0 && (
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">{t('skills.strengths')}</h3>
                  <p className="text-green-700">{strengthsLabels.join(', ')}</p>
                </div>
              )}
              {areasForPractice.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">{t('skills.areasForPractice')}</h3>
                  <p className="text-amber-700">{areasForPracticeLabels.join(', ')}</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'worlds' && (
            <motion.div key="worlds" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {WORLDS.map(world => {
                const stats = worldStats[world.id]
                const progress = worldProgress[world.id]
                const levelsCompleted = progress?.levelsCompleted.length || 0
                const worldData = getWorldById(world.id)
                return (
                  <div key={world.id} className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-4xl">{world.emoji}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">{t(`worlds.byId.${world.id}.name`)}</h3>
                        <p className="text-slate-500 text-sm">{t(`worlds.byId.${world.id}.description`)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-slate-800">{levelsCompleted}/6</p>
                        <p className="text-xs text-slate-500">{t('worlds.levelsDone')}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-500">{stats?.starsEarned || 0}</p>
                        <p className="text-xs text-slate-500">{t('worlds.stars')}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-500">{formatDuration(stats?.timeSpent || 0)}</p>
                        <p className="text-xs text-slate-500">{t('worlds.time')}</p>
                      </div>
                    </div>
                    <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full" style={{ width: `${Math.round((levelsCompleted / 6) * 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('activity.last7Days')}</h3>
                {accuracyTrend.length > 0 ? (
                  <div className="flex items-end gap-2 h-32">
                    {accuracyTrend.map((day) => (
                      <div key={day.date} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-slate-100 rounded-t relative" style={{ height: '100px' }}>
                          <div className={`absolute bottom-0 left-0 right-0 rounded-t transition-all ${day.accuracy >= 80 ? 'bg-green-500' : day.accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-400'}`} style={{ height: `${day.accuracy}%` }} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{formatDate(day.date, locale)}</p>
                        <p className="text-xs font-medium">{day.accuracy}%</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">{t('activity.noActivity')}</p>
                )}
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('activity.recentSessions')}</h3>
                {recentSessions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSessions.slice().reverse().map(session => (
                      <div key={session.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="font-medium text-slate-800">{formatDate(session.date, locale)}</p>
                          <p className="text-sm text-slate-500">{t('activity.modulesAccuracy', { modules: session.modulesCompleted, accuracy: session.questionsAnswered > 0 ? Math.round((session.correctAnswers / session.questionsAnswered) * 100) : 0 })}</p>
                        </div>
                        <p className="text-slate-600">{formatDuration(session.duration)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">{t('activity.noRecentSessions')}</p>
                )}
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('activity.totals')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-500 text-sm">{t('activity.allTimePlay')}</p>
                    <p className="text-2xl font-bold text-slate-800">{formatDuration(totalTimePlayedMs)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-500 text-sm">{t('activity.bestStreak')}</p>
                    <p className="text-2xl font-bold text-orange-500">{t('activity.streakDays', { days: longestStreak })}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('settings.changePin')}</h3>
                <div className="flex gap-3">
                  <input type="text" inputMode="numeric" maxLength={4} value={newPin} onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, '')); setPinError('') }} placeholder={t('settings.newPinPlaceholder')} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handlePinChange} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{t('settings.update')}</button>
                </div>
                {pinError && <p className="text-red-500 text-sm mt-2">{pinError}</p>}
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('settings.exportData')}</h3>
                <p className="text-slate-600 mb-4">{t('settings.exportDescription')}</p>
                <button onClick={handleExportData} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">{t('settings.downloadData')}</button>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-200">
                <h3 className="text-lg font-semibold text-red-600 mb-4">{t('settings.dangerZone')}</h3>
                <p className="text-slate-600 mb-4">{t('settings.resetDescription')}</p>
                {!showResetConfirm ? (
                  <button onClick={() => setShowResetConfirm(true)} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">{t('settings.resetAll')}</button>
                ) : (
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-red-800 font-medium mb-3">{t('settings.resetConfirm')}</p>
                    <div className="flex gap-3">
                      <button onClick={handleResetAll} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">{t('settings.resetYes')}</button>
                      <button onClick={() => setShowResetConfirm(false)} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">{t('settings.resetCancel')}</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
