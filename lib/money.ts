import BigNumber from "bignumber.js";

BigNumber.set({ ROUNDING_MODE: BigNumber.ROUND_HALF_UP });

export function round2(value: BigNumber.Value): string {
  return new BigNumber(value).decimalPlaces(2, BigNumber.ROUND_HALF_UP).toFixed(2);
}

export function multiply2(a: BigNumber.Value, b: BigNumber.Value): string {
  return round2(new BigNumber(a).multipliedBy(b));
}

export function sum2(values: BigNumber.Value[]): string {
  const total = values.reduce((acc: BigNumber, v) => acc.plus(v), new BigNumber(0));
  return round2(total);
}

export function equalsDecimal(a: BigNumber.Value, b: BigNumber.Value): boolean {
  return new BigNumber(a).isEqualTo(new BigNumber(b));
}

export function isValidDecimal(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  return new BigNumber(value as BigNumber.Value).isFinite();
}