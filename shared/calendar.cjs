'use strict';

function repeatMatches(start, date, repeat) {
  if (start > date) return false;
  if (repeat === 'daily') return true;
  const startDate = new Date(`${start}T12:00:00`);
  const targetDate = new Date(`${date}T12:00:00`);
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(targetDate.getTime())) return false;
  if (repeat === 'weekly') return startDate.getDay() === targetDate.getDay();
  if (repeat === 'monthly') return startDate.getDate() === targetDate.getDate();
  return repeat === 'none' && start === date;
}

module.exports = { repeatMatches };
