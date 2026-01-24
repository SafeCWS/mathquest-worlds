'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import { ParentGate } from '@/components/parent/ParentGate'
import { useAnalyticsStore } from '@/lib/stores/analyticsStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { useWorldStore } from '@/lib/stores/worldStore'
import { useCharacterStore } from '@/lib/stores/characterStore'
import { WORLDS, getWorldById } from '@/lib/constants/worlds'
import { LEVELS } from '@/lib/constants/levels'

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type TabType = 'overview' | 'skills' | 'worlds' | 'activity' | 'settings'

export default function ParentDashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [pinError, setPinError] = useState('')

  const { characterName, hasCreatedCharacter, resetCharacter } = useCharacterStore()
  const { totalStars, currentStreak, longestStreak, diagnosticResult, skillLevel, moduleProgress, resetProgress } = useProgressStore()
  const { worldProgress, resetWorldProgress } = useWorldStore()
  const { totalTimePlayedMs, totalSessions, worldStats, operationStats, getWeeklyPlayTime, getStrengths, getAreasForPractice, getAccuracyTrend, getRecentSessions, setParentPin, exportData, resetAllAnalytics } = useAnalyticsStore()

  useEffect(() => { setMounted(true) }, [])

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
      setPinError('PIN must be 4 digits')
      return
    }
    setParentPin(newPin)
    setNewPin('')
    setPinError('')
    alert('PIN updated successfully!')
  }, [newPin, setParentPin])

  const handleResetAll = useCallback(() => {
    resetProgress()
    resetWorldProgress()
    resetAllAnalytics()
    resetCharacter()
    setShowResetConfirm(false)
    router.push('/')
  }, [resetProgress, resetWorldProgress, resetAllAnalytics, resetCharacter, router])

  if (!mounted) return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><div className="text-4xl animate-pulse">Loading...</div></div>

  if (!authenticated) return <ParentGate onSuccess={() => setAuthenticated(true)} onCancel={() => router.push('/')} />

  const weeklyTime = getWeeklyPlayTime()
  const strengths = getStrengths()
  const areasForPractice = getAreasForPractice()
  const accuracyTrend = getAccuracyTrend()
  const recentSessions = getRecentSessions(7)

  const totalModulesCompleted = Object.values(moduleProgress).filter(m => m.completed).length
  const totalPossibleModules = LEVELS.reduce((sum, level) => sum + level.modules.length, 0)

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'O' },
    { id: 'skills', label: 'Skills', icon: 'S' },
    { id: 'worlds', label: 'Worlds', icon: 'W' },
    { id: 'activity', label: 'Activity', icon: 'A' },
    { id: 'settings', label: 'Settings', icon: 'G' },
  ]

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">
            <span>&#x2190;</span> Back to Game
          </button>
          <h1 className="text-xl font-semibold text-slate-800">Parent Dashboard</h1>
          <div className="w-24" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm mb-6 p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {(characterName || 'A')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{characterName || 'Adventurer'}</h2>
              <p className="text-slate-500">Skill Level: <span className="font-medium capitalize text-slate-700">{skillLevel}</span></p>
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
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-slate-500 text-sm">Total Stars</p>
                  <p className="text-3xl font-bold text-yellow-500">{totalStars}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-slate-500 text-sm">Current Streak</p>
                  <p className="text-3xl font-bold text-orange-500">{currentStreak} days</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-slate-500 text-sm">This Week</p>
                  <p className="text-3xl font-bold text-blue-500">{formatDuration(weeklyTime)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-slate-500 text-sm">Total Sessions</p>
                  <p className="text-3xl font-bold text-green-500">{totalSessions}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Overall Progress</h3>
                <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all" style={{ width: `${Math.round((totalModulesCompleted / totalPossibleModules) * 100)}%` }} />
                </div>
                <p className="text-slate-600">{totalModulesCompleted} of {totalPossibleModules} modules completed ({Math.round((totalModulesCompleted / totalPossibleModules) * 100)}%)</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Quick Insights</h3>
                {areasForPractice.length > 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 font-medium">Recommended focus this week:</p>
                    <p className="text-amber-700">{areasForPractice.join(', ')} - needs more practice</p>
                  </div>
                ) : strengths.length > 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">Great progress!</p>
                    <p className="text-green-700">Strong in: {strengths.join(', ')}</p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800">Keep playing to see personalized recommendations!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div key="skills" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {diagnosticResult ? (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Diagnostic Results</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-500 text-sm">Score</p>
                      <p className="text-2xl font-bold text-slate-800">{diagnosticResult.correctAnswers}/{diagnosticResult.totalQuestions}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-500 text-sm">Level</p>
                      <p className="text-2xl font-bold capitalize text-slate-800">{diagnosticResult.skillLevel}</p>
                    </div>
                  </div>
                  {diagnosticResult.completedAt && <p className="text-slate-500 text-sm">Completed: {new Date(diagnosticResult.completedAt).toLocaleDateString()}</p>}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <p className="text-slate-600">No diagnostic completed yet. The child should complete the diagnostic quiz to see skill assessment.</p>
                </div>
              )}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Skills by Operation</h3>
                {Object.keys(operationStats).length > 0 ? (
                  <div className="space-y-4">
                    {Object.values(operationStats).map(stat => {
                      const accuracy = stat.totalAttempts > 0 ? Math.round((stat.correctAnswers / stat.totalAttempts) * 100) : 0
                      return (
                        <div key={stat.operation} className="border-b border-slate-100 pb-4 last:border-0">
                          <div className="flex justify-between mb-2">
                            <span className="font-medium capitalize text-slate-700">{stat.operation}</span>
                            <span className="text-slate-500">{accuracy}% accuracy</span>
                          </div>
                          <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`absolute inset-y-0 left-0 rounded-full transition-all ${accuracy >= 80 ? 'bg-green-500' : accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-400'}`} style={{ width: `${accuracy}%` }} />
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{stat.totalAttempts} attempts</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-slate-600">No skill data yet. Play some modules to see progress!</p>
                )}
              </div>
              {strengths.length > 0 && (
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Strengths</h3>
                  <p className="text-green-700">{strengths.join(', ')}</p>
                </div>
              )}
              {areasForPractice.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">Areas for Practice</h3>
                  <p className="text-amber-700">{areasForPractice.join(', ')}</p>
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
                        <h3 className="text-lg font-semibold text-slate-800">{world.name}</h3>
                        <p className="text-slate-500 text-sm">{world.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-slate-800">{levelsCompleted}/6</p>
                        <p className="text-xs text-slate-500">Levels Done</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-500">{stats?.starsEarned || 0}</p>
                        <p className="text-xs text-slate-500">Stars</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-500">{formatDuration(stats?.timeSpent || 0)}</p>
                        <p className="text-xs text-slate-500">Time</p>
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
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Last 7 Days Accuracy</h3>
                {accuracyTrend.length > 0 ? (
                  <div className="flex items-end gap-2 h-32">
                    {accuracyTrend.map((day, idx) => (
                      <div key={day.date} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-slate-100 rounded-t relative" style={{ height: '100px' }}>
                          <div className={`absolute bottom-0 left-0 right-0 rounded-t transition-all ${day.accuracy >= 80 ? 'bg-green-500' : day.accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-400'}`} style={{ height: `${day.accuracy}%` }} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{formatDate(day.date)}</p>
                        <p className="text-xs font-medium">{day.accuracy}%</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">No activity data for the last 7 days.</p>
                )}
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Sessions</h3>
                {recentSessions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSessions.slice().reverse().map(session => (
                      <div key={session.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="font-medium text-slate-800">{formatDate(session.date)}</p>
                          <p className="text-sm text-slate-500">{session.modulesCompleted} modules, {session.questionsAnswered > 0 ? Math.round((session.correctAnswers / session.questionsAnswered) * 100) : 0}% accuracy</p>
                        </div>
                        <p className="text-slate-600">{formatDuration(session.duration)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">No recent sessions.</p>
                )}
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Totals</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-500 text-sm">All Time Play</p>
                    <p className="text-2xl font-bold text-slate-800">{formatDuration(totalTimePlayedMs)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-500 text-sm">Best Streak</p>
                    <p className="text-2xl font-bold text-orange-500">{longestStreak} days</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Change Parent PIN</h3>
                <div className="flex gap-3">
                  <input type="text" inputMode="numeric" maxLength={4} value={newPin} onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, '')); setPinError('') }} placeholder="New 4-digit PIN" className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handlePinChange} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Update</button>
                </div>
                {pinError && <p className="text-red-500 text-sm mt-2">{pinError}</p>}
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Export Data</h3>
                <p className="text-slate-600 mb-4">Download all progress data as a JSON file.</p>
                <button onClick={handleExportData} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Download Data</button>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-200">
                <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
                <p className="text-slate-600 mb-4">Reset all progress. This action cannot be undone.</p>
                {!showResetConfirm ? (
                  <button onClick={() => setShowResetConfirm(true)} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Reset All Progress</button>
                ) : (
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-red-800 font-medium mb-3">Are you sure? This will delete ALL progress, characters, and achievements.</p>
                    <div className="flex gap-3">
                      <button onClick={handleResetAll} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Yes, Reset Everything</button>
                      <button onClick={() => setShowResetConfirm(false)} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">Cancel</button>
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
