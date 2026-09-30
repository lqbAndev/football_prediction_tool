export const formatFinalMatchdayMinute = (minute: number): string => {
  if (minute > 45 && minute < 46) return `45+${Math.round((minute - 45) * 10)}'`;
  if (minute > 90) return `90+${minute - 90}'`;
  return `${minute}'`;
};

export const advanceFinalMatchdayMinute = (minute: number, firstHalfLimit: number, finalMinute: number): number => {
  if (minute < 45) return Math.min(45, minute + 3);
  if (minute < firstHalfLimit) return Number((minute + 0.1).toFixed(1));
  if (minute < 90) return Math.min(90, Math.floor(minute) + 3);
  return Math.min(finalMinute, minute + 1);
};
