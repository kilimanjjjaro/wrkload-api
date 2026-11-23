import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import {
  DECIMAL_RADIX,
  MINUTES_PER_HOUR,
  PREVIOUS_MONTH_OFFSET,
  SINGLE_BEST_PROJECT
} from '../constants/index.ts'

interface DeliveredTask {
  deliveredAt?: string | null
}

interface TimedTask {
  timing: string
}

interface ProjectTask extends DeliveredTask {
  project: string
}

const deliveredInMonth = <T extends DeliveredTask>(
  tasks: T[],
  month: Dayjs
) => {
  const firstDay = month.startOf('month').format()
  const lastDay = month.endOf('month').format()

  return tasks.filter((task) => {
    const formattedDate = dayjs(task.deliveredAt).format()
    return formattedDate >= firstDay && formattedDate <= lastDay
  })
}

export const getPastMonthTasks = <T extends DeliveredTask>(tasks: T[]) =>
  deliveredInMonth(tasks, dayjs().subtract(PREVIOUS_MONTH_OFFSET, 'month'))

export const getCurrentMonthTasks = <T extends DeliveredTask>(tasks: T[]) =>
  deliveredInMonth(tasks, dayjs())

export const getTotalTasksTiming = (tasks: TimedTask[]) => {
  let totalMinutes = 0

  for (const task of tasks) {
    const [hours, minutes] = task.timing.split(':')
    totalMinutes +=
      parseInt(hours, DECIMAL_RADIX) * MINUTES_PER_HOUR +
      parseInt(minutes, DECIMAL_RADIX)
  }

  return Math.floor(totalMinutes / MINUTES_PER_HOUR)
}

export const isPerformanceBetter = (
  totalCurrentTiming: number,
  totalPastTiming: number
) => {
  if (totalCurrentTiming === totalPastTiming) {
    return 'same'
  } else if (totalCurrentTiming > totalPastTiming) {
    return 'better'
  } else {
    return 'worse'
  }
}

export const getBestProjectOfPastMonth = (tasks: ProjectTask[]) => {
  const pastMonthTasks = getPastMonthTasks(tasks)
  const projects = [...new Set(pastMonthTasks.map(({ project }) => project))]
  const tasksPerProject = projects.map(
    (project) =>
      pastMonthTasks.filter((task) => task.project === project).length
  )
  const highestNumber = Math.max(...tasksPerProject)
  const bestProjects = projects.filter(
    (_, index) => tasksPerProject[index] === highestNumber
  )

  if (bestProjects.length > SINGLE_BEST_PROJECT) return ''

  const [bestProject] = bestProjects
  return bestProject as string | undefined
}
