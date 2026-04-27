import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SessionRecord {
  id: string
  date: string
  startTime: number
  endTime: number | null
  duration: number
  modulesCompleted: number
  questionsAnswered: number
  correctAnswers: number
  worldsVisited: string[]
}

export interface ModuleAttempt {
  levelId: number
  moduleId: number
  worldId: string
  timestamp: number
  score: number
  timeSpent: number
  operation: string
}

export interface WorldStats {
  worldId: string
  timeSpent: number
  modulesCompleted: number
  starsEarned: number
  lastPlayed: number | null
}

export interface OperationStats {
  operation: string
  totalAttempts: number
  correctAnswers: number
  averageTime: number
}

export interface AnalyticsState {
  sessions: SessionRecord[]
  currentSession: SessionRecord | null
  moduleAttempts: ModuleAttempt[]
  worldStats: Record<string, WorldStats>
  operationStats: Record<string, OperationStats>
  totalTimePlayedMs: number
  totalSessions: number
  parentPin: string
  startSession: () => void
  endSession: () => void
  recordModuleAttempt: (attempt: Omit<ModuleAttempt, 'timestamp'>) => void
  updateWorldTime: (worldId: string, timeMs: number) => void
  recordWorldStar: (worldId: string, stars: number) => void
  setParentPin: (pin: string) => void
  verifyPin: (pin: string) => boolean
  exportData: () => string
  resetAllAnalytics: () => void
  getWeeklyPlayTime: () => number
  getRecentSessions: (days: number) => SessionRecord[]
  getStrengths: () => string[]
  getAreasForPractice: () => string[]
  getAccuracyTrend: () => { date: string; accuracy: number }[]
}

const genId = () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const getDate = (ts: number) => new Date(ts).toISOString().split('T')[0]
// getStrengths() / getAreasForPractice() return raw operation IDs (e.g. 'addition').
// The UI layer maps these to localized labels via t(`operationLabels.${id}`).
// Keeps the store locale-agnostic — see app/parent/page.tsx render sites.

export const useAnalyticsStore = create<AnalyticsState>()(persist((set, get) => ({ sessions: [], currentSession: null, moduleAttempts: [], worldStats: {}, operationStats: {}, totalTimePlayedMs: 0, totalSessions: 0, parentPin: '1234', startSession: () => { const now = Date.now(); set({ currentSession: { id: genId(), date: getDate(now), startTime: now, endTime: null, duration: 0, modulesCompleted: 0, questionsAnswered: 0, correctAnswers: 0, worldsVisited: [] } }) }, endSession: () => { const st = get(); if (!st.currentSession) return; const now = Date.now(); const dur = now - st.currentSession.startTime; set({ sessions: [...st.sessions, { ...st.currentSession, endTime: now, duration: dur }], currentSession: null, totalTimePlayedMs: st.totalTimePlayedMs + dur, totalSessions: st.totalSessions + 1 }) }, recordModuleAttempt: (att) => { const st = get(); const ts = Date.now(); const op = st.operationStats[att.operation] || { operation: att.operation, totalAttempts: 0, correctAnswers: 0, averageTime: 0 }; const nT = op.totalAttempts + 1; const nC = op.correctAnswers + (att.score >= 60 ? 1 : 0); const nA = (op.averageTime * op.totalAttempts + att.timeSpent) / nT; const ws = st.worldStats[att.worldId] || { worldId: att.worldId, timeSpent: 0, modulesCompleted: 0, starsEarned: 0, lastPlayed: null }; let uS = st.currentSession; if (st.currentSession) { const wv = st.currentSession.worldsVisited.includes(att.worldId) ? st.currentSession.worldsVisited : [...st.currentSession.worldsVisited, att.worldId]; uS = { ...st.currentSession, modulesCompleted: st.currentSession.modulesCompleted + 1, questionsAnswered: st.currentSession.questionsAnswered + 3, correctAnswers: st.currentSession.correctAnswers + Math.round(att.score / 100 * 3), worldsVisited: wv } } set({ moduleAttempts: [...st.moduleAttempts, { ...att, timestamp: ts }], operationStats: { ...st.operationStats, [att.operation]: { ...op, totalAttempts: nT, correctAnswers: nC, averageTime: nA } }, worldStats: { ...st.worldStats, [att.worldId]: { ...ws, timeSpent: ws.timeSpent + att.timeSpent, modulesCompleted: ws.modulesCompleted + 1, lastPlayed: ts } }, currentSession: uS }) }, updateWorldTime: (wId, tMs) => { const st = get(); const ws = st.worldStats[wId] || { worldId: wId, timeSpent: 0, modulesCompleted: 0, starsEarned: 0, lastPlayed: null }; set({ worldStats: { ...st.worldStats, [wId]: { ...ws, timeSpent: ws.timeSpent + tMs, lastPlayed: Date.now() } } }) }, recordWorldStar: (wId, stars) => { const st = get(); const ws = st.worldStats[wId] || { worldId: wId, timeSpent: 0, modulesCompleted: 0, starsEarned: 0, lastPlayed: null }; set({ worldStats: { ...st.worldStats, [wId]: { ...ws, starsEarned: ws.starsEarned + stars } } }) }, setParentPin: (pin) => { if (pin.length === 4 && /^\d+$/.test(pin)) set({ parentPin: pin }) }, verifyPin: (pin) => get().parentPin === pin, exportData: () => JSON.stringify({ exportDate: new Date().toISOString(), ...get() }, null, 2), resetAllAnalytics: () => set({ sessions: [], currentSession: null, moduleAttempts: [], worldStats: {}, operationStats: {}, totalTimePlayedMs: 0, totalSessions: 0 }), getWeeklyPlayTime: () => get().sessions.filter(r => r.startTime >= Date.now() - 604800000).reduce((x, r) => x + r.duration, 0), getRecentSessions: (n) => get().sessions.filter(r => r.startTime >= Date.now() - n * 86400000), getStrengths: () => Object.values(get().operationStats).filter(o => o.totalAttempts >= 3 && o.correctAnswers / o.totalAttempts >= 0.8).map(o => o.operation), getAreasForPractice: () => Object.values(get().operationStats).filter(o => o.totalAttempts >= 3 && o.correctAnswers / o.totalAttempts < 0.6).map(o => o.operation), getAccuracyTrend: () => { const m = get().sessions.filter(r => r.startTime >= Date.now() - 604800000).reduce((acc, r) => { if (!acc[r.date]) acc[r.date] = { c: 0, t: 0 }; acc[r.date].c += r.correctAnswers; acc[r.date].t += r.questionsAnswered; return acc }, {} as Record<string, { c: number; t: number }>); return Object.entries(m).map(([k, v]) => ({ date: k, accuracy: v.t > 0 ? Math.round(v.c / v.t * 100) : 0 })).sort((first, second) => first.date.localeCompare(second.date)) } }), { name: 'mathquest-analytics-v1', storage: createJSONStorage(() => localStorage) }))
