'use client'

import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { toLocalISODate } from '@/lib/date'
import { useAuthStore } from '@/store/auth.store'
import { goalsService } from '@/services/goals.service'
import { reportsService } from '@/services/reports.service'
import { PERIOD_META, type Period } from '@/features/metas/constants'
import { DailyEntrySheet } from '@/features/metas/daily-entry-sheet'
import { DeleteGoalDialog } from '@/features/metas/delete-goal-dialog'
import { GoalRecordsSection } from '@/features/metas/goal-records-section'
import { GoalSelector } from '@/features/metas/goal-selector'
import { GoalSummaryCard } from '@/features/metas/summary-card'
import { IndividualGoalSection } from '@/features/metas/individual-goal-section'
import { NewGoalSheet } from '@/features/metas/new-goal-sheet'
import { RankingSection } from '@/features/metas/ranking-section'
import {
  canEditGoal,
  goalScope,
  isCurrentGoal,
  matchesPeriodTab,
  periodTabForGoal,
  pickDefaultGoal,
  type ApiGoal,
} from '@/features/metas/api'
import type { GoalSummary, RankingEntry } from '@/features/metas/types'

const PERIODS: Period[] = ['mes', 'trimestre', 'ano']

interface BrokerRankingEntry {
  broker: { id: string; name: string; avatarUrl: string | null } | null
  vgv: number | string
  units: number
  goalPercent: number | null
}

function periodRange(period: Period): { startDate: string; endDate: string } {
  const now = new Date()
  if (period === 'mes') {
    return {
      startDate: toLocalISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: toLocalISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    }
  }
  if (period === 'trimestre') {
    const quarter = Math.floor(now.getMonth() / 3)
    return {
      startDate: toLocalISODate(new Date(now.getFullYear(), quarter * 3, 1)),
      endDate: toLocalISODate(new Date(now.getFullYear(), quarter * 3 + 3, 0)),
    }
  }
  return {
    startDate: toLocalISODate(new Date(now.getFullYear(), 0, 1)),
    endDate: toLocalISODate(new Date(now.getFullYear(), 11, 31)),
  }
}

export default function MetasPage() {
  const [chosenPeriod, setPeriod] = useState<Period | undefined>(undefined)
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(undefined)
  const [isDailyEntryOpen, setIsDailyEntryOpen] = useState(false)
  const [dailyEntryDate, setDailyEntryDate] = useState('')
  // Cada abertura remonta o modal: o dia e os valores da abertura anterior não ficam
  const [dailyEntrySession, setDailyEntrySession] = useState(0)
  const [isGoalSheetOpen, setIsGoalSheetOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<ApiGoal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<ApiGoal | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const user = useAuthStore((state) => state.user)

  const { data: goals, isLoading: isGoalsLoading } = useQuery<ApiGoal[]>({
    queryKey: ['goals'],
    queryFn: goalsService.findAll,
  })

  const today = toLocalISODate()
  const hasNoGoalsAtAll = !isGoalsLoading && (goals?.length ?? 0) === 0

  // Sem escolha do usuário, abre na aba da meta vigente: uma meta trimestral não pode
  // ficar escondida atrás da aba Mês
  const defaultGoal = pickDefaultGoal(goals ?? [], user?.id, today)
  const period = chosenPeriod ?? (defaultGoal && periodTabForGoal(defaultGoal)) ?? 'mes'
  const periodGoals = (goals ?? []).filter((goal) => matchesPeriodTab(goal, period) && goal.active)

  const selectedGoal =
    periodGoals.find((goal) => goal.id === selectedGoalId) ??
    pickDefaultGoal(periodGoals, user?.id, today) ??
    periodGoals[0]

  const summaryResults = useQueries({
    queries: periodGoals.map((goal) => ({
      queryKey: ['goal-summary', goal.id],
      queryFn: () => goalsService.getSummary(goal.id),
    })),
  })
  const summaryFor = (goalId: string | undefined) =>
    summaryResults[periodGoals.findIndex((goal) => goal.id === goalId)]?.data
  const summary = summaryFor(selectedGoal?.id)

  const { startDate, endDate } = periodRange(period)

  const { data: ranking, isLoading: isRankingLoading } = useQuery<BrokerRankingEntry[]>({
    queryKey: ['broker-ranking', startDate, endDate],
    queryFn: () => reportsService.getBrokerRanking(startDate, endDate),
  })

  const summaries: GoalSummary[] = periodGoals.map((goal) => {
    const goalSummary = summaryFor(goal.id)
    return {
      id: goal.id,
      label: goal.title,
      target: Number(goalSummary?.progress.target ?? 0),
      realized: Number(goalSummary?.progress.current ?? 0),
      scope: goalScope(goal),
      type: goal.type,
      pace: goalSummary?.pace,
    }
  })

  const rankingEntries: RankingEntry[] = (ranking ?? []).map((entry, index) => ({
    id: entry.broker?.id ?? `sem-corretor-${index}`,
    name: entry.broker?.name ?? 'Corretor removido',
    vgv: Number(entry.vgv),
    units: Number(entry.units),
    goalPct: entry.goalPercent,
    isCurrentUser: entry.broker?.id === user?.id,
  }))

  function openNewGoal() {
    setEditingGoal(null)
    setIsGoalSheetOpen(true)
  }

  function openEditGoal(goal: ApiGoal) {
    setEditingGoal(goal)
    setIsGoalSheetOpen(true)
  }

  function openDeleteGoal(goal: ApiGoal) {
    setDeletingGoal(goal)
    setIsDeleteDialogOpen(true)
  }

  function openDailyEntry(date: string) {
    setDailyEntryDate(date)
    setDailyEntrySession((session) => session + 1)
    setIsDailyEntryOpen(true)
  }

  const selectedGoalCanEdit = selectedGoal ? canEditGoal(selectedGoal, user) : false
  const selectedGoalIsOwn = !!selectedGoal && selectedGoal.userId === user?.id
  const canRegisterToday = selectedGoalIsOwn && isCurrentGoal(selectedGoal, today) && !!summary?.funnel
  // Inclui meta já encerrada: o último dia dela ainda pode ser preenchido depois
  const showRecords = selectedGoalIsOwn && !!summary?.funnel && selectedGoal.periodStart.slice(0, 10) <= today

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-semibold text-neutral-900">Metas</h1>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-[8px] border-[0.5px] border-neutral-200 bg-white p-1">
            {PERIODS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === value
                    ? 'bg-brand-bg text-brand'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {PERIOD_META[value]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={openNewGoal}
            className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            Nova meta
          </button>
        </div>
      </div>

      {isGoalsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-[16px]" />
          ))}
        </div>
      ) : hasNoGoalsAtAll ? (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title="Nenhuma meta cadastrada"
          description="Crie metas para a imobiliária, sua equipe ou individuais para acompanhar o progresso de vendas."
          action={{ label: 'Criar primeira meta', onClick: openNewGoal }}
        />
      ) : (
        <>
          {periodGoals.length > 1 && (
            <GoalSelector goals={periodGoals} selectedId={selectedGoal?.id} onSelect={setSelectedGoalId} />
          )}

          {summaries.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {summaries.map((goal) => {
                const fullGoal = periodGoals.find((g) => g.id === goal.id)
                return (
                  <GoalSummaryCard
                    key={goal.id}
                    goal={goal}
                    canEdit={fullGoal ? canEditGoal(fullGoal, user) : false}
                    onEdit={() => fullGoal && openEditGoal(fullGoal)}
                    onDelete={() => fullGoal && openDeleteGoal(fullGoal)}
                  />
                )
              })}
            </div>
          ) : (
            <p className="rounded-[16px] border-[0.5px] border-dashed border-neutral-200 bg-white p-6 text-center text-sm text-neutral-400">
              Nenhuma meta cadastrada para este período.
            </p>
          )}

          <IndividualGoalSection
            goal={selectedGoal}
            summary={summary}
            canEdit={selectedGoalCanEdit}
            title={selectedGoalIsOwn ? 'Minha meta do período' : selectedGoal ? `Funil — ${selectedGoal.title}` : undefined}
            onRegisterToday={canRegisterToday ? () => openDailyEntry(today) : undefined}
            onCreateGoal={openNewGoal}
            onEdit={() => selectedGoal && openEditGoal(selectedGoal)}
            onDelete={() => selectedGoal && openDeleteGoal(selectedGoal)}
          />

          {showRecords && <GoalRecordsSection key={selectedGoal.id} goal={selectedGoal} onSelectDay={openDailyEntry} />}

          {isRankingLoading ? (
            <Skeleton className="h-64 rounded-[16px]" />
          ) : (
            <RankingSection entries={rankingEntries} />
          )}
        </>
      )}

      <DailyEntrySheet
        key={dailyEntrySession}
        open={isDailyEntryOpen}
        onOpenChange={setIsDailyEntryOpen}
        goal={selectedGoal}
        summary={summary}
        initialDate={dailyEntryDate}
      />
      <DeleteGoalDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        goal={deletingGoal}
        onDeleted={(goalId) => setSelectedGoalId((current) => (current === goalId ? undefined : current))}
      />
      <NewGoalSheet
        key={editingGoal?.id ?? 'new'}
        open={isGoalSheetOpen}
        onOpenChange={setIsGoalSheetOpen}
        goal={editingGoal ?? undefined}
      />
    </div>
  )
}
