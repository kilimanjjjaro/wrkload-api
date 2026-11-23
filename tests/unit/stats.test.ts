import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../models/Task.js', () => ({ Task: {} }))

const NOW = new Date(2026, 10, 15, 12)

const loadStats = async () => {
  vi.resetModules()
  return await import('../../utils/stats.js')
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
    vi.useFakeTimers({ toFake: ['Date'], now: NOW })
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

  it.fails('uses the current month after the month changes', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: NOW })
    const { getCurrentMonthTasks } = await loadStats()

    vi.setSystemTime(new Date(2026, 11, 2, 12))

    expect(getCurrentMonthTasks([task('2026-12-01')])).toHaveLength(1)
  })

  it('adds the timings and keeps the whole hours', async () => {
    const { getTotalTasksTiming } = await loadStats()

    expect(getTotalTasksTiming([task('', '02:30'), task('', '01:45')])).toBe(4)
    expect(getTotalTasksTiming([task('', '00:59')])).toBe(0)
    expect(getTotalTasksTiming([])).toBe(0)
  })

  it('compares the performance of two months', async () => {
    const { isPerformanceBetter } = await loadStats()

    expect(isPerformanceBetter(3, 3)).toBe('same')
    expect(isPerformanceBetter(4, 3)).toBe('better')
    expect(isPerformanceBetter(2, 3)).toBe('worse')
  })

  it('returns the project with the most tasks in the past month', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: NOW })
    const { getBestProjectOfPastMonth } = await loadStats()
    const pastMonth = dayjs(NOW).subtract(1, 'month').format('YYYY-MM-DD')

    expect(
      await getBestProjectOfPastMonth([
        task(pastMonth, '01:00', 'Web'),
        task(pastMonth, '01:00', 'Web'),
        task(pastMonth, '01:00', 'App'),
        task('2026-11-10', '01:00', 'App'),
        task('2026-11-10', '01:00', 'App')
      ])
    ).toBe('Web')
  })

  it('returns an empty name on a tie and nothing without tasks', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: NOW })
    const { getBestProjectOfPastMonth } = await loadStats()

    expect(
      await getBestProjectOfPastMonth([
        task('2026-10-05', '01:00', 'Web'),
        task('2026-10-06', '01:00', 'App')
      ])
    ).toBe('')
    expect(await getBestProjectOfPastMonth([])).toBeUndefined()
  })
})
