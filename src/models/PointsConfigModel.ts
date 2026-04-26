export const PtsConfigKey = (scopeId: string) => `pts-config-${scopeId}`;

export interface PointsConfig {
  scopeId: string;
  bpMonetaryValue: number;
  bpCurrency: string;
  spMonetaryValue: number;
  spCurrency: string;
  tpValue: number;
  tpUnit: string;
}
