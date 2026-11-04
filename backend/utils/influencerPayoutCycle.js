const InfluencerPayoutSchedule = require("../Models/InfluencerPayoutSchedule");

/**
 * Compute the live lock/unlock state and cycle window based on schedule configuration
 * @param {Object} schedule - Payout schedule document or plain object
 * @param {Date} [currentTime] - Current reference date (defaults to now)
 * @returns {Object} Full cycle status object
 */
function computePayoutCycleStatus(schedule = {}, currentTime = new Date()) {
  const now = new Date(currentTime);
  const cycleType = schedule.cycleType || "Monthly";
  const cycleDays = Math.max(1, Number(schedule.cycleDays || 30));
  const windowDays = Math.max(1, Number(schedule.payoutWindowDurationDays || 5));
  const manualOverride = schedule.manualOverride || "Auto";
  const minWithdrawalAmount = Number(schedule.minWithdrawalAmount || 200);

  // 1. Check Manual Overrides first
  if (manualOverride === "ForceUnlocked") {
    return {
      isUnlocked: true,
      cycleType,
      manualOverride,
      minWithdrawalAmount,
      cycleStartDate: null,
      cycleEndDate: null,
      nextUnlockDate: null,
      daysRemaining: 0,
      statusMessage: "Withdrawals are currently unlocked by administration override.",
    };
  }

  if (manualOverride === "ForceLocked") {
    return {
      isUnlocked: false,
      cycleType,
      manualOverride,
      minWithdrawalAmount,
      cycleStartDate: null,
      cycleEndDate: null,
      nextUnlockDate: null,
      daysRemaining: null,
      statusMessage: "Withdrawals are temporarily locked by administration.",
    };
  }

  // 2. Automated Schedule Calculations
  let isUnlocked = false;
  let cycleStartDate;
  let cycleEndDate;
  let unlockStartDate;
  let unlockEndDate;
  let nextUnlockDate;

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed: 0 = Jan, 10 = Nov
  const currentDate = now.getDate();

  if (cycleType === "Monthly") {
    // Current month bounds
    cycleStartDate = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const lastDayCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    cycleEndDate = new Date(currentYear, currentMonth, lastDayCurrentMonth, 23, 59, 59, 999);

    // Unlock window begins on the last day of the month and extends windowDays into the next month
    unlockStartDate = new Date(currentYear, currentMonth, lastDayCurrentMonth, 0, 0, 0, 0);
    unlockEndDate = new Date(currentYear, currentMonth + 1, windowDays, 23, 59, 59, 999);

    // Check if we are currently in the unlock window
    // (either on the last day of this month, OR within the first windowDays of the month referring to previous month)
    if (now >= unlockStartDate && now <= unlockEndDate) {
      isUnlocked = true;
      nextUnlockDate = unlockStartDate;
    } else if (currentDate <= windowDays) {
      // We are in the first few days of this month (unlock window for previous month's earnings)
      isUnlocked = true;
      const prevMonth = currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const lastDayPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      cycleStartDate = new Date(prevYear, prevMonth, 1, 0, 0, 0, 0);
      cycleEndDate = new Date(prevYear, prevMonth, lastDayPrevMonth, 23, 59, 59, 999);
      unlockStartDate = new Date(prevYear, prevMonth, lastDayPrevMonth, 0, 0, 0, 0);
      unlockEndDate = new Date(currentYear, currentMonth, windowDays, 23, 59, 59, 999);
      nextUnlockDate = unlockStartDate;
    } else {
      // Locked: Earning cycle is active; unlocks on the last day of this month
      isUnlocked = false;
      nextUnlockDate = unlockStartDate;
    }
  } else if (cycleType === "BiWeekly") {
    // 15 days cycle:
    // Cycle 1: 1st – 15th, unlocks on 16th for windowDays
    // Cycle 2: 16th – End of month, unlocks on last day / 1st of next month for windowDays
    if (currentDate <= 15) {
      cycleStartDate = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
      cycleEndDate = new Date(currentYear, currentMonth, 15, 23, 59, 59, 999);
      unlockStartDate = new Date(currentYear, currentMonth, 16, 0, 0, 0, 0);
      unlockEndDate = new Date(currentYear, currentMonth, 15 + windowDays, 23, 59, 59, 999);

      // Are we in the unlock window carried over from the end of previous month?
      if (currentDate <= windowDays) {
        isUnlocked = true;
        nextUnlockDate = new Date(currentYear, currentMonth, 1);
      } else {
        isUnlocked = false;
        nextUnlockDate = unlockStartDate;
      }
    } else {
      // Second half of the month (16th to end)
      const lastDayCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      cycleStartDate = new Date(currentYear, currentMonth, 16, 0, 0, 0, 0);
      cycleEndDate = new Date(currentYear, currentMonth, lastDayCurrentMonth, 23, 59, 59, 999);
      unlockStartDate = new Date(currentYear, currentMonth, lastDayCurrentMonth, 0, 0, 0, 0);
      unlockEndDate = new Date(currentYear, currentMonth + 1, windowDays, 23, 59, 59, 999);

      // If we are currently between 16th and 15 + windowDays, Cycle 1 is unlocked!
      if (currentDate >= 16 && currentDate <= 15 + windowDays) {
        isUnlocked = true;
        nextUnlockDate = new Date(currentYear, currentMonth, 16);
      } else if (currentDate === lastDayCurrentMonth) {
        isUnlocked = true;
        nextUnlockDate = unlockStartDate;
      } else {
        isUnlocked = false;
        nextUnlockDate = unlockStartDate;
      }
    }
  } else if (cycleType === "Weekly") {
    // Unlocks every weekend (Saturday 00:00 to Sunday 23:59)
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      isUnlocked = true;
      nextUnlockDate = now;
    } else {
      isUnlocked = false;
      const daysUntilSaturday = 6 - dayOfWeek;
      nextUnlockDate = new Date(now);
      nextUnlockDate.setDate(now.getDate() + daysUntilSaturday);
      nextUnlockDate.setHours(0, 0, 0, 0);
    }
  } else {
    // Custom Interval: Based on anchor epoch or cycleDays
    const anchor = new Date(currentYear, 0, 1).getTime();
    const elapsedDays = Math.floor((now.getTime() - anchor) / (1000 * 60 * 60 * 24));
    const currentIntervalIndex = Math.floor(elapsedDays / cycleDays);
    const intervalStartMs = anchor + currentIntervalIndex * cycleDays * 24 * 60 * 60 * 1000;
    const intervalEndMs = intervalStartMs + cycleDays * 24 * 60 * 60 * 1000 - 1;

    cycleStartDate = new Date(intervalStartMs);
    cycleEndDate = new Date(intervalEndMs);
    unlockStartDate = new Date(intervalEndMs);
    unlockEndDate = new Date(intervalEndMs + windowDays * 24 * 60 * 60 * 1000);

    if (now >= unlockStartDate && now <= unlockEndDate) {
      isUnlocked = true;
      nextUnlockDate = unlockStartDate;
    } else {
      isUnlocked = false;
      nextUnlockDate = unlockStartDate;
    }
  }

  // Calculate remaining days until unlock
  let daysRemaining = 0;
  if (!isUnlocked && nextUnlockDate) {
    const diffMs = nextUnlockDate.getTime() - now.getTime();
    daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const formatDate = (d) => {
    if (!d) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const statusMessage = isUnlocked
    ? `Withdrawal window is open! You can request payout until ${formatDate(unlockEndDate)}.`
    : `Withdrawals are locked for the current earning cycle (${formatDate(cycleStartDate)} – ${formatDate(cycleEndDate)}). Unlocks in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""} on ${formatDate(nextUnlockDate)}.`;

  return {
    isUnlocked,
    cycleType,
    cycleDays,
    payoutWindowDurationDays: windowDays,
    manualOverride,
    minWithdrawalAmount,
    cycleStartDate,
    cycleEndDate,
    nextUnlockDate,
    unlockEndDate,
    daysRemaining,
    statusMessage,
  };
}

/**
 * Fetch or initialize the active Influencer Payout Schedule document
 */
async function getActivePayoutSchedule() {
  let schedule = await InfluencerPayoutSchedule.findOne();
  if (!schedule) {
    schedule = await InfluencerPayoutSchedule.create({
      cycleType: "Monthly",
      cycleDays: 30,
      payoutWindowDurationDays: 5,
      manualOverride: "Auto",
      minWithdrawalAmount: 200,
    });
  }
  return schedule;
}

module.exports = {
  computePayoutCycleStatus,
  getActivePayoutSchedule,
};

