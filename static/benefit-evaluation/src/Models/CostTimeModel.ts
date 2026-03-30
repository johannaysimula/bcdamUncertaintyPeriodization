export type CostTime = {
  cost: number;
  time: number;
  balanced_points: number;

  costOptimistic?: number; // O
  costPessimistic?: number; // P

  timeOptimistic?: number;
  timePessimistic?: number;

  benefitOptimistic?: number;
  benefitPessimistic?: number;
};
