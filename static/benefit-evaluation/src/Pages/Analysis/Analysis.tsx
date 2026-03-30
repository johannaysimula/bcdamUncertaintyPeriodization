import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import PageHeader from "@atlaskit/page-header";
import { useLocation } from "react-router-dom";
import { useAPI } from "../../Contexts/ApiContext";
import { Flex } from "@atlaskit/primitives";
import { useAppContext } from "../../Contexts/AppContext";
// FIKS: Importert det nye dashboardet
import { AnalysisDashboard } from "../../Components/Analysis/AnalysisDashboard";
// FIKS: Importert det nye Monte Carlo-dashboardet
import { MonteCarloDashboard } from "../../Components/Analysis/MonteCarloDashboard";
import { RiskRewardPlot } from "../../Components/Analysis/RiskRewardPlot";
import { BenefitPieChart } from "../../Components/Analysis/PieChart";
import { MonteCarloChartSet } from "../../Components/Analysis/MonteCarloChartSet";
import {
  GoalTier,
  GoalTierTypeEnum,
  GoalTableItem,
  GoalTableItemTypeEnum,
  Goal,
  balancedPointsEnum,
  CostTime,
} from "../../Models";
import { EpicTable } from "../../Components/Analysis/Table/EpicTable";
import { Loading } from "../../Components/Common/Loading";
import Select, { OptionType, StylesConfig } from "@atlaskit/select";
import { Label } from "@atlaskit/form";
import Toggle from "@atlaskit/toggle";
import Textfield from "@atlaskit/textfield";
import Button, { LoadingButton } from "@atlaskit/button";
import Timeline from "../../Components/Analysis/Charts/Timeline";
import { ScatterChart } from "../../Components/Analysis/Charts/ScatterChart";
import { PieChartBenefit } from "../../Components/Analysis/Charts/PieChartBenefit";
import RemainingBenefit from "../../Components/Analysis/Charts/RemainingBenefit";
import RealizedBenefit from "../../Components/Analysis/Charts/RealizedBenefit";
import CumulativePoints from "../../Components/Analysis/Charts/CumulativePoints";
import { BudgetDetails } from "../../Models/BudgetModel";
import Tooltip, { TooltipPrimitive } from "@atlaskit/tooltip";
import QuestionCircleIcon from "@atlaskit/icon/glyph/question-circle";
import { Box, Stack, xcss } from "@atlaskit/primitives";
import { token } from "@atlaskit/tokens";
import styled from "@emotion/styled";
import { HelperMessage } from "@atlaskit/form";
import SectionMessage from "@atlaskit/section-message";

// --- HJELPEFUNKSJON: Rens navn ---
const cleanTierName = (name: string): string => {
  return name.replace(/^Tier \d+ - /, "");
};
// --- SLUTT PÅ HJELPEFUNKSJON ---

type option = {
  label: string;
  value: GoalTier;
};

const customSelectStyle: StylesConfig = {
  container: (styles: any) => ({ ...styles, width: "16rem" }),
};

const InlineDialog = styled(TooltipPrimitive)`
  background: white;
  border-radius: ${token("border.radius", "4px")};
  box-shadow: ${token("elevation.shadow.overlay")};
  box-sizing: content-box;
  color: black;
  max-height: 300px;
  max-width: 300px;
  padding: ${token("space.100", "8px")} ${token("space.150", "12px")};
`;

export const Analysis = () => {
  const [isLoading, setLoading] = useState<boolean>(true); // Starter som true
  const [error, setError] = useState<string>();
  const [goalCollection, setSelectedOption] = useState<option | undefined>();
  const [items, setItems] = useState<GoalTableItem[]>([]);
  const [sortBy, setSortBy] = useState<{ label: string; value: string }>({
    label: "Benefit/Cost",
    value: "benefitcost",
  });
  const [sortedItems, setSortedItems] = useState<GoalTableItem[]>([]);

  const [upperGoals, setUpperGoals] = useState<Goal[]>([]);
  const [upperIsMonetary, setUpperIsMonetary] = useState<boolean>(false);
  const [isMonetary, setIsMonetary] = useState<boolean>(false);
  const [postfix, setPostfix] = useState<string>("$");
  const [expectedBenefit, setExpectedBenefit] = useState<number>(0);
  const [expectedCosts, setExpectedCosts] = useState<number>(0);
  const [budgetSavingLoading, setBudgetSavingLoading] =
    useState<boolean>(false);

  const postfixRef = useRef<HTMLInputElement | null>(null);
  const expectedBenefitRef = useRef<HTMLInputElement | null>(null);
  const expectedCostRef = useRef<HTMLInputElement | null>(null);

  // ... (din eksisterende simulationResults-state)
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // --- NY STATE FOR RÅ SIMULERINGSDATA ---
  const [simulationRawData, setSimulationRawData] = useState<{
    costResults: number[];
    benefitResults: number[];
    timeResults: number[];
  } | null>(null);

  const [scope] = useAppContext();
  const api = useAPI();
  const location = useLocation();
  const refresh = location.state?.refresh;

  const handleExpectedBenefitValueChange = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    if (expectedBenefitRef.current) {
      let value = expectedBenefitRef.current.value;
      if (!value || value === "") {
        setExpectedBenefit(0);
      } else if (isNaN(+value)) {
      } else if (+value > 9999999) {
        setExpectedBenefit(9999999);
      } else {
        setExpectedBenefit(+value);
      }
    }
  };

  const getBudget = () => {
    if (!upperIsMonetary)
      api.project.getBudgetDetails().then((details: BudgetDetails) => {
        setExpectedBenefit(details.expectedBenefit);
        setPostfix(details.postfix);
        setExpectedCosts(details.expectedCosts);
      });
  };
  const handleExpectedCostValueChange = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    if (expectedCostRef.current) {
      let value = expectedCostRef.current.value;
      if (!value || value === "") {
        setExpectedCosts(0);
      } else if (isNaN(+value)) {
      } else if (+value > 9999999) {
        setExpectedCosts(999999);
      } else {
        setExpectedCosts(+value);
      }
    }
  };

  const handlePostfixChange = (event: React.FormEvent<HTMLInputElement>) => {
    if (postfixRef.current) {
      let value = postfixRef.current.value;
      setPostfix(value);
    }
  };

  const saveBudget = () => {
    setBudgetSavingLoading(true);
    api.project
      .setBudgetDetails(expectedBenefit, expectedCosts, postfix)
      .then(() => {
        setBudgetSavingLoading(false);
      });
  };

  const fetchItems = async () => {
    return await api.issue
      .getAll()
      .then(async (issues) => {
        const mappedIssues = issues.map((issue) => {
          return {
            ...issue,
            type: GoalTableItemTypeEnum.ISSUE,
          } as GoalTableItem;
        });

        for (const i of mappedIssues)
          if (i.balancedPoints === undefined)
            i.balancedPoints = { postFix: "$", type: 1, value: 0 };

        return mappedIssues;
      })
      .catch((error) => {
        console.error(error);
        return [];
      });
  };

  // --- 'useEffect' for sortering (OPPDATERT) ---
  useEffect(() => {
    const copy = [...items];

    let costValue = !upperIsMonetary ? expectedCosts / 100 : 0;
    let pointValue = upperIsMonetary
      ? upperGoals.reduce(
          (acc, curr) => acc + curr!!.balancedPoints!!.value,
          0
        ) / 100
      : expectedBenefit / 100;

    // --- FIKS: Trenger calculateExpectedValue her ---
    const calculateExpectedValue = (
      O: number,
      M: number,
      P: number
    ): number => {
      O = Math.max(0, O);
      M = Math.max(0, M);
      P = Math.max(0, P);
      // FIKS: Endret logikk for å håndtere P <= M <= O for Nytte
      if (M === 0) M = (O + P) / 2 || 1;
      if (O === 0 && P === 0 && M === 1) return 1; // Unngå deling på 0
      return (O + 4 * M + P) / 6;
    };
    // --- SLUTT PÅ FIKS ---

    copy.sort((a, b) => {
      // --- Nytte (Benefit) ---
      // Hent M-Benefit (den beregnede verdien)
      const a_M_Benefit = (a as any).properties?.evaluation_points?.value || 0;
      const b_M_Benefit = (b as any).properties?.evaluation_points?.value || 0;
      // Hent O og P (P <= M <= O)
      const a_P_Benefit = a.issueCost?.benefitPessimistic ?? a_M_Benefit;
      const a_O_Benefit = a.issueCost?.benefitOptimistic ?? a_M_Benefit;
      const b_P_Benefit = b.issueCost?.benefitPessimistic ?? b_M_Benefit;
      const b_O_Benefit = b.issueCost?.benefitOptimistic ?? b_M_Benefit;
      // Beregn E-Benefit (PERT)
      const aBenefit = calculateExpectedValue(
        a_P_Benefit,
        a_M_Benefit,
        a_O_Benefit
      );
      const bBenefit = calculateExpectedValue(
        b_P_Benefit,
        b_M_Benefit,
        b_O_Benefit
      );

      // --- Innsats (Cost) ---
      const a_M_Cost = a.issueCost?.cost || 1;
      const a_O_Cost = a.issueCost?.costOptimistic ?? a_M_Cost;
      const a_P_Cost = a.issueCost?.costPessimistic ?? a_M_Cost;
      const aCost = calculateExpectedValue(a_O_Cost, a_M_Cost, a_P_Cost);
      const b_M_Cost = b.issueCost?.cost || 1;
      const b_O_Cost = b.issueCost?.costOptimistic ?? b_M_Cost;
      const b_P_Cost = b.issueCost?.costPessimistic ?? b_M_Cost;
      const bCost = calculateExpectedValue(b_O_Cost, b_M_Cost, b_P_Cost);

      // --- Innsats (Time) ---
      const a_M_Time = a.issueCost?.time || 1;
      const a_O_Time = a.issueCost?.timeOptimistic ?? a_M_Time;
      const a_P_Time = a.issueCost?.timePessimistic ?? a_M_Time;
      const aTime = calculateExpectedValue(a_O_Time, a_M_Time, a_P_Time);
      const b_M_Time = b.issueCost?.time || 1;
      const b_O_Time = b.issueCost?.timeOptimistic ?? b_M_Time;
      const b_P_Time = b.issueCost?.timePessimistic ?? b_M_Time;
      const bTime = calculateExpectedValue(b_O_Time, b_M_Time, b_P_Time);

      // --- Sorteringslogikk (FIKS: Bruker nå aBenefit/bBenefit) ---
      if (sortBy.value === "benefit") {
        const compare = bBenefit - aBenefit; // Bruker E-Benefit
        if (compare === 0) return aTime - bTime;
        return compare;
      } else if (sortBy.value === "benefitcost") {
        const compare = bBenefit / bCost - aBenefit / aCost; // Bruker E-Benefit
        if (compare === 0) return aTime - bTime;
        return compare;
      } else if (sortBy.value === "benefitcosttime") {
        const compare = bBenefit / bCost / bTime - aBenefit / aCost / aTime; // Bruker E-Benefit
        return compare;
      } else {
        // 'benefittime'
        const sortedBalanceTime = bBenefit / bTime - aBenefit / aTime; // Bruker E-Benefit
        if (sortedBalanceTime === 0) return bBenefit / bCost - aBenefit / aCost;
        return sortedBalanceTime;
      }
    });
    setSortedItems(copy);
  }, [
    items,
    sortBy,
    upperIsMonetary,
    isMonetary,
    expectedBenefit,
    expectedCosts,
    upperGoals,
  ]);

  // --- 'useEffect' for 'fetchGoalCollection' (OPPDATERT) ---
  useEffect(() => {
    setLoading(true);
    api.goalTier
      .getAll(scope.id, scope.type)
      .then(async (goalTiers) => {
        const goalTiersMapped = goalTiers.map(
          (goalTier: GoalTier, index): option => {
            return {
              label: cleanTierName(goalTier.name), // Bruker cleanTierName
              value: goalTier,
            };
          }
        );

        if (goalTiersMapped.length >= 2) {
          const upGoals: Goal[] = await api.goal.getAll(
            goalTiersMapped[goalTiersMapped.length - 1].value.scopeId,
            goalTiersMapped[goalTiersMapped.length - 1].value.id
          );

          const upIsMonetary = upGoals.some(
            (goal) => goal.balancedPoints?.type === balancedPointsEnum.MONETARY
          );
          if (upIsMonetary)
            setPostfix(upGoals[0].balancedPoints?.postFix || "$");
          else getBudget();

          setUpperIsMonetary(upIsMonetary);
          setUpperGoals(upGoals);
        } else {
          getBudget();
        }

        const issueTypeTier = goalTiersMapped.find(
          (option) => option.value.type === GoalTierTypeEnum.ISSUE_TYPE
        );

        if (!issueTypeTier) {
          setError("No issue types found");
        }
        setSelectedOption(issueTypeTier);
        setError("");
        // setLoading(false); // Flyttet
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  }, [api.goalTier, scope.id, scope.type]);

  // --- FIKS: 'useEffect' for 'fetchItems' ---
  useEffect(() => {
    if (!goalCollection) return;

    let isMounted = true;
    setLoading(true);

    fetchItems().then((items) => {
      if (isMounted) {
        // Sorter items etter nøkkel (FIP-1, FIP-2)
        items.sort((a, b) =>
          (a.key || "").localeCompare(b.key || "", undefined, { numeric: true })
        );

        items.forEach((item) => {
          // Hent M-Benefit FØRST (vil være 0 for en ny Epic)
          const benefitM =
            (item as any).properties?.evaluation_points?.value || 0;

          if (item.issueCost === undefined) {
            // Hvis 'issueCost' mangler helt, sett ALLE verdier til 0
            // (eller til 'benefitM' for O/P-Nytte)
            item.issueCost = {
              cost: 0, // M-Cost
              time: 0, // M-Time
              balanced_points: 0,
              costOptimistic: 0, // O-Cost
              costPessimistic: 0, // P-Cost
              timeOptimistic: 0, // O-Time
              timePessimistic: 0, // P-Time
              benefitOptimistic: benefitM, // O-Benefit (default to M)
              benefitPessimistic: benefitM, // P-Benefit (default to M)
            };
          } else {
            // Hvis 'issueCost' FINNES, men M-verdiene er 0 (f.eks. fra gammel data)
            // (Denne logikken hadde du fra før, den er grei)
            if (item.issueCost.cost === 0) item.issueCost.cost = 1;
            if (item.issueCost.time === 0) item.issueCost.time = 1;
          }
        });

        // Fjernet den ødeleggende forEach-løkken

        setItems(items);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [goalCollection, refresh]);
  // --- SLUTT PÅ FIKS ---

  // --- NY CALLBACK FOR Å MOTTA RÅDATA ---
  const handleSimulationComplete = useCallback(
    (data: {
      costResults: number[];
      benefitResults: number[];
      timeResults: number[];
    }) => {
      // Vi lagrer de rå arrayene i staten for fremtidig bruk (i grafene)
      console.log("Mottok rå simuleringsdata i Analysis.tsx");
      setSimulationRawData(data);
    },
    []
  );

  // --- FØRSTE EARLY RETURN ---
  if (isLoading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Loading />
      </div>
    );

  return (
    <>
      <PageHeader>Analysis</PageHeader>
      <Box>
        <SectionMessage title="Understanding Your Uncertainty Analysis">
          <p>
            This page analyzes your entire project. It combines the{" "}
            <strong>Benefit</strong> (from the 'Estimation' matrix) with the{" "}
            <strong>Effort</strong> (from your 3-point estimates) to create
            priority scores and visualizations.
          </p>
          <ul>
            <li>
              <b>Portfolio Totals:</b> The dashboard at the top shows the
              calculated totals (Benefit, PERT values) for all Epics in this
              project.
            </li>
            <li>
              <b>Expected Project Benefit-Cost Score</b> The Project BC Score is
              calculated using the (Total PERT Benefit / Total PERT Cost)
            </li>
            <li>
              <b>Epic Analysis Table:</b> This table provides a detailed
              breakdown of each Epic.
            </li>
            <li>
              <b>PERT values:</b> These are the 'Expected' (E) values calculated
              from your 3-point estimates using the PERT formula ={" "}
              <code>(O + 4M + P) / 6</code>
            </li>
            <li>
              <b>Risk/Reward Scatter Plot:</b> This graph plots all Epics based
              on their Benefit (Y-axis) vs. their PERT Cost (X-axis) to help
              identify 'Quick Wins' (top-left) and 'Thankless Tasks'
              (bottom-right).
            </li>
            <li>
              <b>Benefit Pie Chart:</b> This chart shows which Epics contribute
              the most to the total <b>Benefit Points</b> of the portfolio.
            </li>
          </ul>
        </SectionMessage>
      </Box>

      {/* --- NYTT KPI DASHBOARD --- */}
      {!isLoading && (
        <Box>
          <AnalysisDashboard items={items} />
        </Box>
      )}

      {error || !goalCollection ? (
        <p>{error || "ERROR: Could not find Issue Type Tier"}</p>
      ) : (
        <>
          <EpicTable
            goalTier={goalCollection.value}
            items={sortedItems}
            loading={isLoading}
            showMonetary={isMonetary}
            pointValue={
              upperIsMonetary
                ? upperGoals.reduce(
                    (acc, curr) => acc + curr!!.balancedPoints!!.value,
                    0
                  ) / 100
                : expectedBenefit / 100
            }
            upperIsMonetary={upperIsMonetary}
            costValue={!upperIsMonetary ? expectedCosts / 100 : 0}
            postfix={postfix}
          />

          {/* --- NYTT: MONTE CARLO KOMPONENT --- */}
          {/* Sender 'items' ned til den nye komponenten */}
          {!isLoading && (
            <MonteCarloDashboard
              items={items}
              onSimulationComplete={handleSimulationComplete}
            />
          )}

          {/* --- NYTT: Vis grafene når rådata er klar --- */}
          {simulationRawData && (
            <Stack>
              <MonteCarloChartSet
                title="Total Benefit"
                data={simulationRawData.benefitResults}
              />
              <MonteCarloChartSet
                title="Total Cost"
                data={simulationRawData.costResults}
              />
              <MonteCarloChartSet
                title="Total Time"
                data={simulationRawData.timeResults}
              />
              {/* Vi kan droppe 'benefitResults' siden den (sannsynligvis) er en fast verdi 
            og histogrammet vil bare være en enkelt stolpe.
          */}
            </Stack>
          )}

          <Flex
            direction="row"
            xcss={xcss({
              gap: "space.200",
              padding: "space.200",
              marginTop: "space.400",
            })}
          >
            {/* Høyre Kolonne: Kakediagram */}
            <Box
              xcss={xcss({
                flexBasis: "35%",
                padding: "space.200",
                backgroundColor: "color.background.neutral.subtle",
                borderRadius: "border.radius.100",
                // maxWidth: '500px', // Fjernet maxWidth for å la flex styre
                margin: "auto 0", // Sentrerer vertikalt
              })}
            >
              <BenefitPieChart items={items} />
            </Box>
            {/* Venstre Kolonne: Scatter Plot */}
            <Box xcss={xcss({ flexBasis: "65%" })}>
              <RiskRewardPlot items={items} />
            </Box>
          </Flex>
        </>
      )}
    </>
  );
};
