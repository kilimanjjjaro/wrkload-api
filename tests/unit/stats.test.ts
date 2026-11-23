import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PREVIOUS_MONTH_OFFSET,
  SINGLE_DOCUMENT,
  TEST_NEXT_MONTH,
  TEST_NOW
} from '../constants/api.ts'

const LONG_TASKS_HOURS = 4
const SHORT_TASK_HOURS = 0
const NO_HOURS = 0
const PAST_TIMING = 3
const BETTER_TIMING = 4
const WORSE_TIMING = 2

const loadStats = async () => {
  vi.resetModules()
  return await import('../../src/utils/stats.ts')
}

const task = (deliveredAt: string, timing = '01:00', project = 'Web') => ({
  deliveredAt,
  timing,
  project
})

afterEach(() => {
  vi.useRealTimers()
})

describe('stats', () => {
  it('filters the tasks of the past and the current month', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: TEST_NOW })
    const { getCurrentMonthTasks, getPastMonthTasks } = await loadStats()
    const tasks = [
      task('2026-09-30'),
      task('2026-10-01'),
      task('2026-10-31'),
      task('2026-11-01'),
      task('2026-11-30'),
      task('2026-12-01')
    ]

    expect(getPastMonthTasks(tasks).map((t) => t.deliveredAt)).toEqual([
      '2026-10-01',
      '2026-10-31'
    ])
    expect(getCurrentMonthTasks(tasks).map((t) => t.deliveredAt)).toEqual([
      '2026-11-01',
      '2026-11-30'
    ])
  })

  it('uses the current month after the month changes', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: TEST_NOW })
    const { getCurrentMonthTasks } = await loadStats()

    vi.setSystemTime(TEST_NEXT_MONTH)

    expect(getCurrentMonthTasks([task('2026-12-01')])).toHaveLength(
      SINGLE_DOCUMENT
    )
  })

  it('adds the timings and keeps the whole hours', async () => {
    const { getTotalTasksTiming } = await loadStats()

    expect(getTotalTasksTiming([task('', '02:30'), task('', '01:45')])).toBe(
      LONG_TASKS_HOURS
    )
    expect(getTotalTasksTiming([task('', '00:59')])).toBe(SHORT_TASK_HOURS)
    expect(getTotalTasksTiming([])).toBe(NO_HOURS)
  })

  it('compares the performance of two months', async () => {
    const { isPerformanceBetter } = await loadStats()

    expect(isPerformanceBetter(PAST_TIMING, PAST_TIMING)).toBe('same')
    expect(isPerformanceBetter(BETTER_TIMING, PAST_TIMING)).toBe('better')
    expect(isPerformanceBetter(WORSE_TIMING, PAST_TIMING)).toBe('worse')
  })

  it('returns the project with the most tasks in the past month', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: TEST_NOW })
    const { getBestProjectOfPastMonth } = await loadStats()
    const pastMonth = dayjs(TEST_NOW)
      .subtract(PREVIOUS_MONTH_OFFSET, 'month')
      .format('YYYY-MM-DD')

    expect(
      getBestProjectOfPastMonth([
        task(pastMonth, '01:00', 'Web'),
        task(pastMonth, '01:00', 'Web'),
        task(pastMonth, '01:00', 'App'),
        task('2026-11-10', '01:00', 'App'),
        task('2026-11-10', '01:00', 'App')
      ])
    ).toBe('Web')
  })

  it('returns an empty name on a tie and nothing without tasks', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: TEST_NOW })
    const { getBestProjectOfPastMonth } = await loadStats()

    expect(
      getBestProjectOfPastMonth([
        task('2026-10-05', '01:00', 'Web'),
        task('2026-10-06', '01:00', 'App')
      ])
    ).toBe('')
    expect(getBestProjectOfPastMonth([])).toBeUndefined()
  })
})
