import dayjs from 'dayjs'

interface DeliveredTask {
  deliveredAt?: string | null
}

interface TimedTask {
  timing: string
}

interface ProjectTask extends DeliveredTask {
  project: string
}

const firstDayOfPastMonth = dayjs()
  .subtract(1, 'month')
  .startOf('month')
  .format()
const lastDayOfPastMonth = dayjs().subtract(1, 'month').endOf('month').format()
const firstDayOfCurrentMonth = dayjs().startOf('month').format()
const lastDayOfCurrentMonth = dayjs().endOf('month').format()

export const getPastMonthTasks = <T extends DeliveredTask>(tasks: T[]) => {
  return tasks.filter((task) => {
    const formattedDate = dayjs(task.deliveredAt).format()
    return (
      formattedDate >= firstDayOfPastMonth &&
      formattedDate <= lastDayOfPastMonth
    )
  })
}

export const getCurrentMonthTasks = <T extends DeliveredTask>(tasks: T[]) => {
  return tasks.filter((task) => {
    const formattedDate = dayjs(task.deliveredAt).format()
    return (
      formattedDate >= firstDayOfCurrentMonth &&
      formattedDate <= lastDayOfCurrentMonth
    )
  })
}

export const getTotalTasksTiming = (tasks: TimedTask[]) => {
  let totalMinutes = 0

  tasks.forEach((task) => {
    const splitTime = task.timing.split(':')
    totalMinutes += parseInt(splitTime[0]) * 60 + parseInt(splitTime[1])
  })

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes - hours * 60
  const timing = `${hours}:${minutes}`

  return parseInt(timing)
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

export const getBestProjectOfPastMonth = async (tasks: ProjectTask[]) => {
  const pastMonthTasks = getPastMonthTasks(tasks)

  const numberOfTasksPerProject = pastMonthTasks.reduce<Record<string, number>>(
    (acc, { project }) => {
      acc[project] = (acc[project] ?? 0) + 1
      return acc
    },
    {}
  )

  const highestNumber = Math.max(...Object.values(numberOfTasksPerProject))

  const bestProjects = Object.keys(numberOfTasksPerProject).filter(
    (project) => numberOfTasksPerProject[project] === highestNumber
  )

  if (bestProjects.length > 1) {
    return ''
  } else {
    return bestProjects[0] as string | undefined
  }
}
