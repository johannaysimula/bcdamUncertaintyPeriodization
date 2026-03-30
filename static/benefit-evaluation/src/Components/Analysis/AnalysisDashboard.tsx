import React, { useMemo } from "react";
import { GoalTableItem } from "../../Models";
import { Stack, Box, xcss } from "@atlaskit/primitives";
import Lozenge from "@atlaskit/lozenge";
import { Label } from "@atlaskit/form";
import { Flex } from "@atlaskit/primitives";

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
type KpiProps = {
  items: GoalTableItem[];
};

// Stil for hver KPI-boks
const kpiBoxStyle = xcss({
  padding: "space.200",
  borderRadius: "border.radius.100",
  backgroundColor: "color.background.neutral.subtle",
  textAlign: "center",
  flex: "1 1 0px", // Gir lik bredde
});

// Stil for selve tallet
const kpiValueStyle = xcss({
  fontSize: "1.75rem", // 28px
  fontWeight: "bold",
  paddingTop: "space.050",
});

export const AnalysisDashboard = ({ items }: KpiProps) => {
  // Bruker useMemo for å beregne totalene kun når 'items' endres
  const totals = useMemo(() => {
    let totalBenefit = 0;
    let totalCost = 0; //JO
    let totalTime = 0; //JO
    let totalExpectedCost = 0;
    let totalExpectedTime = 0;
    let totalExpectedBenefit = 0;

    items.forEach((item) => {
      // 1. Summer Nytte (Benefit)
      const properties = (item as any).properties;
      totalBenefit += properties?.evaluation_points?.value || 0;

      // --- FIKS: Beregn og summer E-Cost ---
      const M_Cost = item.issueCost?.cost || 1;
      const O_Cost = item.issueCost?.costOptimistic ?? M_Cost;
      const P_Cost = item.issueCost?.costPessimistic ?? M_Cost;
      totalExpectedCost += calculateExpectedValue(O_Cost, M_Cost, P_Cost);
      totalCost += M_Cost; // JO: added

      // --- FIKS: Beregn og summer E-Time ---
      const M_Time = item.issueCost?.time || 1;
      const O_Time = item.issueCost?.timeOptimistic ?? M_Time;
      const P_Time = item.issueCost?.timePessimistic ?? M_Time;
      totalExpectedTime += calculateExpectedValue(O_Time, M_Time, P_Time);
      totalTime += M_Time; // JO: added

      const M_Benefit = properties?.evaluation_points?.value || 1;
      const O_Benefit = item.issueCost?.benefitOptimistic ?? M_Benefit;
      const P_Benefit = item.issueCost?.benefitPessimistic ?? M_Benefit;
      totalExpectedBenefit += calculateExpectedValue(
        O_Benefit,
        M_Benefit,
        P_Benefit
      );
    });

    // 4. Beregn Total B/C Score
    const portfolioBCScore =
      totalExpectedCost > 0 ? totalExpectedBenefit / totalExpectedCost : 0;

    return {
      benefit: totalBenefit,
      costpoints: totalCost, //JO
      timepoints: totalTime, //JO
      benefitPERT: totalExpectedBenefit,
      cost: totalExpectedCost,
      time: totalExpectedTime,
      bcScore: portfolioBCScore,
    };
  }, [items]);

  return (
    <Stack space="space.200">
      <Flex xcss={xcss({ gap: "space.200" })}>
        <Box xcss={kpiBoxStyle}>
          <Label htmlFor="">Total Benefit Points</Label>
          <Box xcss={kpiValueStyle} style={{ color: "#0065FF" }}>
            {" "}
            {/* Blå */}
            {totals.benefit.toFixed(2)}
          </Box>
        </Box>

        <Box xcss={kpiBoxStyle}>
          <Label htmlFor="">Total PERT Benefit (E)</Label>
          <Box xcss={kpiValueStyle} style={{ color: "#0065FF" }}>
            {" "}
            {/* Rød */}
            {totals.benefitPERT.toFixed(2)}
          </Box>
        </Box>

        
        <Box xcss={kpiBoxStyle}> 
          <Label htmlFor="">Total Cost Points</Label>
          <Box xcss={kpiValueStyle} style={{ color: "#0065FF" }}>
            {" "}
            {/* Blå */}
            {totals.costpoints.toFixed(2)}
          </Box>
        </Box>

        <Box xcss={kpiBoxStyle}>
          <Label htmlFor="">Total PERT Cost (E)</Label>
          <Box xcss={kpiValueStyle} style={{ color: "#0065FF" }}>
            {" "}
            {/* Rød */}
            {totals.cost.toFixed(2)}
          </Box>
        </Box>

        <Box xcss={kpiBoxStyle}>
          <Label htmlFor="">Total Time Points</Label>
          <Box xcss={kpiValueStyle} style={{ color: "#0065FF" }}>
            {" "}
            {/* Blå */}
            {totals.timepoints.toFixed(2)}
          </Box>
        </Box>

        <Box xcss={kpiBoxStyle}>
          <Label htmlFor="">Total PERT Time (E)</Label>
          <Box xcss={kpiValueStyle} style={{ color: "#0065FF" }}>
            {" "}
            {/* Oransje */}
            {totals.time.toFixed(2)}
          </Box>
        </Box>

        <Box xcss={kpiBoxStyle}>
          <Label htmlFor="">Expected Project BC Score</Label>
          <Box xcss={kpiValueStyle} style={{ color: "#0065FF" }}>
            {" "}
            {totals.bcScore.toFixed(2)}
          </Box>
        </Box>
      </Flex>
    </Stack>
  );
};
