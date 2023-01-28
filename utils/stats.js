import dayjs from "dayjs";
import { Task } from "../models/Task.js";

const firstDayOfPastMonth = dayjs().subtract(1, 'month').startOf('month').format();
const lastDayOfPastMonth = dayjs().subtract(1, 'month').endOf('month').format();
const firstDayOfCurrentMonth = dayjs().startOf('month').format();
const lastDayOfCurrentMonth = dayjs().endOf('month').format();

export const getPastMonthTasks = (tasks) => {
  return tasks.filter(task => {
    let formattedDate = dayjs(task.deliveredAt).format()
    return formattedDate >= firstDayOfPastMonth && formattedDate <= lastDayOfPastMonth;
  });
};

export const getCurrentMonthTasks = (tasks) => {
  return tasks.filter(task => {
    let formattedDate = dayjs(task.deliveredAt).format()
    return formattedDate >= firstDayOfCurrentMonth && formattedDate <= lastDayOfCurrentMonth;
  });
};

export const getTotalTasksTiming = (tasks) => {
  let totalMinutes = 0;

  tasks.forEach(task => {
    console.log(task.timing)
    const splitTime = task.timing.split(':');
    totalMinutes += (parseInt(splitTime[0]) * 60) + parseInt(splitTime[1]);
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes - (hours * 60);
  const timing = hours + ':' + minutes;

  return parseInt(timing);
};

export const isPerformanceBetter = (totalCurrentTiming, totalPastTiming) => {
  if (totalCurrentTiming === totalPastTiming) {
    return 'same';
  } else if (totalCurrentTiming > totalPastTiming) {
    return 'better';
  } else {
    return 'worse';
  }
}

export const getBestProjectOfPastMonth = async (tasks) => {
  const pastMonthTasks = getPastMonthTasks(tasks)

  const numberOfTasksPerProject = pastMonthTasks.reduce((acc, { project }) => {
    acc[project] = (acc[project] || 0) + 1;
    return acc;
  }, {});

  const highestNumber = Math.max(...Object.values(numberOfTasksPerProject));

  const bestProjects = Object.keys(numberOfTasksPerProject).filter(project => numberOfTasksPerProject[project] === highestNumber);

  if (bestProjects.length > 1) {
    return '';
  } else {
    return bestProjects[0];
  }
}