function getUTCTime(date: Date): number {
  return date.getTime() - date.getTimezoneOffset() * 60000;
}

const WEEK_IN_MILLIS = 6.048e8,
  DAY_IN_MILLIS = 8.64e7,
  HOUR_IN_MILLIS = 3.6e6,
  MIN_IN_MILLIS = 6e4,
  SEC_IN_MILLIS = 1e3;

// https://stackoverflow.com/a/53800501/4652564
export const timeFromNow = (date: Date) => {
  const formatter = new Intl.RelativeTimeFormat("en", { style: "long" });

  const millis = getUTCTime(date);
  const diff = millis - getUTCTime(new Date());

  if (Math.abs(diff) > DAY_IN_MILLIS)
    return formatter.format(Math.trunc(diff / DAY_IN_MILLIS), "day");
  else if (Math.abs(diff) > HOUR_IN_MILLIS)
    return formatter.format(
      Math.trunc((diff % DAY_IN_MILLIS) / HOUR_IN_MILLIS),
      "hour",
    );
  else if (Math.abs(diff) > MIN_IN_MILLIS)
    return formatter.format(
      Math.trunc((diff % HOUR_IN_MILLIS) / MIN_IN_MILLIS),
      "minute",
    );
  else
    return formatter.format(
      Math.trunc((diff % MIN_IN_MILLIS) / SEC_IN_MILLIS),
      "second",
    );
};
