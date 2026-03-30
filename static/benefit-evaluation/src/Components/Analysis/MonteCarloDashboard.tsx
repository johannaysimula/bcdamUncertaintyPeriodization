import React, { useState, useEffect, useCallback } from "react";
import { GoalTableItem } from "../../Models";
import { Stack, Box, Flex, xcss } from "@atlaskit/primitives";
import { Label } from "@atlaskit/form";
import { HelperMessage } from "@atlaskit/form";
import SectionMessage from "@atlaskit/section-message";
import { Loading } from "../Common/Loading";

// --- STILER (Uendret) ---
const kpiBoxStyle = xcss({
  padding: "space.200",
  borderRadius: "border.radius.100",
  backgroundColor: "color.background.neutral.subtle",
  textAlign: "center",
  flex: "1 1 0px", // Gir lik bredde
});

const kpiValueStyle = xcss({
  fontSize: "1.75rem", // 28px
  fontWeight: "bold",
  paddingTop: "space.050",
});
// --- SLUTT PÅ STILER ---

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

const getNormalRandom = (mu: number, sigma: number): number => {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // (0,1]
  while (v === 0) v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * sigma + mu;
};

// --- HJELPEFUNKSJON 3 (OPPDATERT) ---
const calculatePercentiles = (data: number[], numberOfRuns: number) => {
  data.sort((a, b) => a - b);
  return {
    p95: data[Math.floor(numberOfRuns * 0.95)],
    p85: data[Math.floor(numberOfRuns * 0.85)],
    p50: data[Math.floor(numberOfRuns * 0.5)],
    p35: data[Math.floor(numberOfRuns * 0.35)], // <-- NYTT
    p15: data[Math.floor(numberOfRuns * 0.15)],
    p05: data[Math.floor(numberOfRuns * 0.05)],
  };
};
// --- SLUTT PÅ HJELPEFUNKSJONER ---

type MonteCarloProps = {
  items: GoalTableItem[];
  onSimulationComplete: (data: {
    costResults: number[];
    benefitResults: number[];
    timeResults: number[];
  }) => void;
};

export const MonteCarloDashboard = ({
  items,
  onSimulationComplete,
}: MonteCarloProps) => {
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulationSummary, setSimulationSummary] = useState<any>(null);

  // --- simuleringslogikken (OPPDATERT) ---
  const runSimulation = useCallback(() => {
    setIsSimulating(true);
    setSimulationSummary(null);

    setTimeout(() => {
      const NUMBER_OF_RUNS = 10000;
      const costResults: number[] = [];
      const benefitResults: number[] = [];
      const timeResults: number[] = [];

      for (let i = 0; i < NUMBER_OF_RUNS; i++) {
        let runTotalCost = 0;
        let runTotalBenefit = 0;
        let runTotalTime = 0;

        for (const goal of items) {
          const vals = goal.issueCost;
          if (!vals) continue;

          // --- Simulering for KOSTNAD ---
          const M_Cost = vals.cost || 1;
          const O_Cost = vals.costOptimistic ?? M_Cost;
          const P_Cost = vals.costPessimistic ?? M_Cost;
          const muCost = calculateExpectedValue(O_Cost, M_Cost, P_Cost);
          const sigmaCost = (P_Cost - O_Cost) / 6;
          let randomCost =
            sigmaCost > 0 ? getNormalRandom(muCost, sigmaCost) : muCost;
          randomCost = Math.max(O_Cost, Math.min(P_Cost, randomCost));
          runTotalCost += randomCost;

          // --- Simulering for TID ---
          const M_Time = vals.time || 1;
          const O_Time = vals.timeOptimistic ?? M_Time;
          const P_Time = vals.timePessimistic ?? M_Time;
          const muTime = calculateExpectedValue(O_Time, M_Time, P_Time);
          const sigmaTime = (P_Time - O_Time) / 6;
          let randomTime =
            sigmaTime > 0 ? getNormalRandom(muTime, sigmaTime) : muTime;
          randomTime = Math.max(O_Time, Math.min(P_Time, randomTime));
          runTotalTime += randomTime;

          // --- Simulering for NYTTE ---
          const properties = (goal as any).properties;
          const M_Benefit = properties?.evaluation_points?.value || 0;
          const P_Benefit = vals.benefitPessimistic ?? M_Benefit;
          const O_Benefit = vals.benefitOptimistic ?? M_Benefit;
          const muBenefit = calculateExpectedValue(
            P_Benefit,
            M_Benefit,
            O_Benefit
          );
          const sigmaBenefit = (O_Benefit - P_Benefit) / 6;
          let randomBenefit =
            sigmaBenefit > 0
              ? getNormalRandom(muBenefit, sigmaBenefit)
              : muBenefit;
          randomBenefit = Math.max(
            P_Benefit,
            Math.min(O_Benefit, randomBenefit)
          );
          runTotalBenefit += randomBenefit;
        }

        costResults.push(runTotalCost);
        benefitResults.push(runTotalBenefit);
        timeResults.push(runTotalTime);
      }

      // --- Beregn percentiler for hver metrikk ---
      const costPercentiles = calculatePercentiles(costResults, NUMBER_OF_RUNS);
      const benefitPercentiles = calculatePercentiles(
        benefitResults,
        NUMBER_OF_RUNS
      );
      const timePercentiles = calculatePercentiles(timeResults, NUMBER_OF_RUNS);

      setSimulationSummary({
        cost: costPercentiles,
        benefit: benefitPercentiles,
        time: timePercentiles,
        bcRatio: calculatePercentiles(
          costResults.map((cost, idx) => benefitResults[idx] / (cost || 1)),
          NUMBER_OF_RUNS
        ),
      });
      setIsSimulating(false);

      onSimulationComplete({ costResults, benefitResults, timeResults });
    }, 50);
  }, [items, onSimulationComplete]);

  // --- useEffect for å kjøre simulering (Uendret) ---
  useEffect(() => {
    if (items.length > 0) {
      runSimulation();
    }
  }, [items, runSimulation]);

  return (
    <Stack
      space="space.200"
      xcss={xcss({ padding: "space.200", marginTop: "space.400" })}
    >
      <h3>Monte Carlo Simulation Overview</h3>
      <SectionMessage title="How this simulation is calculated">
        <p>
          This simulation runs 10,000 scenarios to model the portfolio's risk
          based on your 3-point estimates.
        </p>
        <Stack space="space.100">
          <p>
            <b>In each scenario:</b>
          </p>
          <ul>
            <li>
              A <b>random cost</b> is generated for every Epic based on its
              Optimistic (O), Most Likely (M), and Pessimistic (P) values.
            </li>
            <li>
              All these random costs are summed to create a{" "}
              <b>'Total Simulated Cost'</b>.
            </li>
            <li>
              The score is calculated as:{" "}
              <code>Total Benefit / Total Simulated Cost</code>.
            </li>
          </ul>
          <p>
            The results below (P05, P15, P50) show the statistical probability
            across all 10,000 scenarios.
          </p>
          <ul>
            <li>
              <b>Probability Distribution (PDF):</b> The histogram shows the
              *frequency* of each possible outcome. A taller bar means a more
              likely result.
            </li>
            <li>
              <b>Cumulative Distribution (CDF):</b> The line graph shows the
              *cumulative* probability. Use this to answer: "What is the %
              chance our cost will be X or less?"
            </li>
          </ul>
        </Stack>
      </SectionMessage>

      {isSimulating ? (
        <Box xcss={xcss({ padding: "space.400" })}>
          <Loading />
        </Box>
      ) : (
        simulationSummary && (
          <>
            {/* --- FIKS: Viser nå P35, P50, og P85 --- */}

            {/* NYTTE (Benefit) */}
            <h4 style={{ marginTop: "16px", marginBottom: "8px" }}>
              Benefit Simulation
            </h4>
            <Flex xcss={xcss({ gap: "space.200", flexWrap: "wrap" })}>
              <Box xcss={kpiBoxStyle}>
                <Label htmlFor="">P35 (Pessimistic)</Label>
                <Box xcss={kpiValueStyle} style={{ color: "#DE350B" }}>
                  {" "}
                  {/* Rød */}
                  {simulationSummary.benefit.p35.toFixed(2)}
                </Box>
              </Box>
              <Box xcss={kpiBoxStyle}>
                <Label htmlFor="">P50 (Median)</Label>
                <Box xcss={kpiValueStyle} style={{ color: "#0065FF" }}>
                  {" "}
                  {/* Blå */}
                  {simulationSummary.benefit.p50.toFixed(2)}
                </Box>
              </Box>
              <Box xcss={kpiBoxStyle}>
                <Label htmlFor="">P85 (Optimistic)</Label>
                <Box xcss={kpiValueStyle} style={{ color: "#36B37E" }}>
                  {" "}
                  {/* Grønn */}
                  {simulationSummary.benefit.p85.toFixed(2)}
                </Box>
              </Box>
            </Flex>

            {/* KOSTNAD (Cost) */}
            <h4 style={{ marginTop: "16px", marginBottom: "8px" }}>
              Cost Simulation
            </h4>
            <Flex xcss={xcss({ gap: "space.200", flexWrap: "wrap" })}>
              <Box xcss={kpiBoxStyle}>
                <Label htmlFor="">P35 (Optimistic)</Label>
                <Box xcss={kpiValueStyle} style={{ color: "#36B37E" }}>
                  {" "}
                  {/* Grønn */}
                  {simulationSummary.cost.p35.toFixed(2)}
                </Box>
              </Box>
              <Box xcss={kpiBoxStyle}>
                <Label htmlFor="">P50 (Median)</Label>
                <Box xcss={kpiValueStyle} style={{ color: "#0065FF" }}>
                  {" "}
                  {/* Blå */}
                  {simulationSummary.cost.p50.toFixed(2)}
                </Box>
              </Box>
              <Box xcss={kpiBoxStyle}>
                <Label htmlFor="">P85 (Budget Goal)</Label>
                <Box xcss={kpiValueStyle} style={{ color: "#FF8B00" }}>
                  {" "}
                  {/* Oransje */}
                  {simulationSummary.cost.p85.toFixed(2)}
                </Box>
              </Box>
            </Flex>

            {/* TID (Time) */}
            <h4 style={{ marginTop: "16px", marginBottom: "8px" }}>
              Time Simulation
            </h4>
            <Flex xcss={xcss({ gap: "space.200", flexWrap: "wrap" })}>
              <Box xcss={kpiBoxStyle}>
                <Label htmlFor="">P35 (Optimistic)</Label>
                <Box xcss={kpiValueStyle} style={{ color: "#36B37E" }}>
                  {" "}
                  {/* Grønn */}
                  {simulationSummary.time.p35.toFixed(2)}
                </Box>
              </Box>
              <Box xcss={kpiBoxStyle}>
                <Label htmlFor="">P50 (Median)</Label>
                <Box xcss={kpiValueStyle} style={{ color: "#0065FF" }}>
                  {" "}
                  {/* Blå */}
                  {simulationSummary.time.p50.toFixed(2)}
                </Box>
              </Box>
              <Box xcss={kpiBoxStyle}>
                <Label htmlFor="">P85 (Deadline)</Label>
                <Box xcss={kpiValueStyle} style={{ color: "#FF8B00" }}>
                  {" "}
                  {/* Oransje */}
                  {simulationSummary.time.p85.toFixed(2)}
                </Box>
              </Box>
            </Flex>
          </>
        )
      )}
    </Stack>
  );
};
