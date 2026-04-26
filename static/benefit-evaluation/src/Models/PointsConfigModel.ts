export interface PointsConfig {
  scopeId: string;
  bpMonetaryValue: number;
  bpCurrency: string;
  spMonetaryValue: number;
  spCurrency: string;
  tpValue: number;
  tpUnit: string;
}

export const DEFAULT_POINTS_CONFIG: Omit<PointsConfig, "scopeId"> = {
  bpMonetaryValue: 0.225,
  bpCurrency: "Mill. NOK",
  spMonetaryValue: 0.6,
  spCurrency: "Mill. NOK",
  tpValue: 1,
  tpUnit: "hours",
};
