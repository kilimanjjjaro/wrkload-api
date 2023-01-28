import dayjs from "dayjs";

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
    const splitTime = task.timing.split(':');
    totalMinutes += (parseInt(splitTime[0]) * 60) + parseInt(splitTime[1]);
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes - (hours * 60);

  return hours + ':' + minutes;
};

export const isBetterPerformance = (currentMonthTasks, pastMonthTasks) => {
  return currentMonthTasks.length > pastMonthTasks.length;
}