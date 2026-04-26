import { RowType } from "@atlaskit/dynamic-table/dist/types/types";
import Lozenge from "@atlaskit/lozenge";
import Tooltip from "@atlaskit/tooltip";
import { GoalTableItem, balancedPointsEnum } from "../../../Models";

const calculateExpectedValue = (O: number, M: number, P: number): number => {
  O = Math.max(0, O);
  M = Math.max(0, M);
  P = Math.max(0, P);

  // FIKS: Hvis alle verdiene er 0, er forventet verdi 0.
  if (O === 0 && M === 0 && P === 0) {
    return 0;
  }

  // Hvis M mangler (er 0), men O og P finnes, bruk et gjennomsnitt
  if (M === 0) M = (O + P) / 2;

  // Hvis O og P mangler (er 0), er M den eneste verdien
  if (O === 0 && P === 0) {
    return M;
  }

  return (O + 4 * M + P) / 6;
};
export const EpicTableBody = (
  items: GoalTableItem[],
  showMonetary: boolean,
  pointValue: number,
  costValue: number,
  postfix: string,
  upperIsMonetary: boolean,
  spRate: number = 1,
  tpRate: number = 1
): RowType[] => {
  let rows: RowType[] = items.map((item, _): RowType => {
    // 1. Benefit: compute PERT on raw points, then apply rate
    const rawBenefit = item.balancedPoints!!.value;
    const benefit: number = showMonetary
      ? Math.round(rawBenefit * pointValue * 100) / 100
      : Math.round(rawBenefit * 100) / 100;

    // 2. O, M, P for Cost
    const M_Cost = item.issueCost?.cost || 1;
    const O_Cost = item.issueCost?.costOptimistic ?? M_Cost;
    const P_Cost = item.issueCost?.costPessimistic ?? M_Cost;

    // 3. O, M, P for Time
    const M_Time = item.issueCost?.time || 1;
    const O_Time = item.issueCost?.timeOptimistic ?? M_Time;
    const P_Time = item.issueCost?.timePessimistic ?? M_Time;

    // 4. O, M, P for Benefit — always in raw points, convert after PERT
    const M_Benefit_raw = rawBenefit || 1;
    const O_Benefit_raw = item.issueCost?.benefitOptimistic ?? M_Benefit_raw;
    const P_Benefit_raw = item.issueCost?.benefitPessimistic ?? M_Benefit_raw;
    const pertBenefitRaw = calculateExpectedValue(O_Benefit_raw, M_Benefit_raw, P_Benefit_raw);

    // 5. Apply rates
    const expectedBenefit = showMonetary ? pertBenefitRaw * pointValue : pertBenefitRaw;
    const expectedCost = calculateExpectedValue(O_Cost, M_Cost, P_Cost) * spRate;
    const expectedTime = calculateExpectedValue(O_Time, M_Time, P_Time) * tpRate;

    const benefitCost = (expectedBenefit / (expectedCost || 1)).toFixed(2);

    return {
      key: `${item.id}`,
      isHighlighted: false,
      // --- FIKS: REKKEFØLGEN PÅ CELLENE ER NÅ KORRIGERT ---
      cells: [
        {
          key: item.key,
          content: item.key,
        },
        {
          key: item.description,
          content: item.description,
        },
        {
          key: `${item.id}-status`,
          content: (
            <Lozenge appearance="inprogress">{item.status!.name}</Lozenge>
          ),
        },
        // 4. BENEFIT POINTS
        {
          key: `benefit-${item.balancedPoints?.value || 0}`,
          content: item.balancedPoints ? (
            <Tooltip content={"Benefit points"}>
              <Lozenge appearance="new">{`${benefit.toLocaleString("en-US")} ${
                item.balancedPoints.type === balancedPointsEnum.MONETARY ||
                showMonetary
                  ? postfix
                  : ""
              }`}</Lozenge>
            </Tooltip>
          ) : (
            <Lozenge appearance="default">NO ESTIMATES</Lozenge>
          ),
        },
        {
          key: `benefit-${expectedBenefit}`,
          content: (
            <Tooltip content={"Expected Benefit (E)"}>
              <Lozenge appearance="removed">{`${expectedBenefit.toFixed(2)} ${
                item.balancedPoints!!.type === balancedPointsEnum.MONETARY ||
                showMonetary
                  ? postfix
                  : ""
              }`}</Lozenge>
            </Tooltip>
          ),
        },
        // 5. PERT COST
        {
          key: `cost-${expectedCost}`,
          content: (
            <Tooltip content={"Expected Cost (E)"}>
              <Lozenge appearance="removed">{`${expectedCost.toFixed(2)} ${
                item.balancedPoints!!.type === balancedPointsEnum.MONETARY ||
                showMonetary
                  ? postfix
                  : ""
              }`}</Lozenge>
            </Tooltip>
          ),
        },
        // 6. PERT TIME
        {
          key: `time-${expectedTime}`,
          content: (
            <Tooltip content={"Expected Time (E)"}>
              <Lozenge appearance="inprogress">{`${expectedTime.toFixed(
                2
              )}`}</Lozenge>
            </Tooltip>
          ),
        },
        // 7. BP/CP
        {
          key: `benefit-points-${benefitCost}`,
          content: item.balancedPoints ? (
            <Tooltip content={"Benefit/Cost"}>
              <Lozenge appearance="success">
                {Number(benefitCost).toLocaleString("en-US")}
              </Lozenge>
            </Tooltip>
          ) : (
            <Lozenge appearance="default">NO ESTIMATES</Lozenge>
          ),
        },
      ],
    };
  });
  return rows;
};
