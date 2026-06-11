import { useEffect, useState, useCallback } from "react";
import PageHeader from "@atlaskit/page-header";
import { GoalTableItem, GoalTableItemTypeEnum } from "../../Models";
import { useAppContext } from "../../Contexts/AppContext";
import { useAPI } from "../../Contexts/ApiContext";
import {
  calculateTotalPeriodization,
  calculateScenarioPeriodization,
  PeriodizationPeriodResult,
} from "./periodizationCalculations";
import {
  EpicProfileSelections,
  ProfileOption,
  usePeriodizationProfiles,
} from "./periodizationTypes";

import { EpicSelectionTable } from "./EpicSelectionTable";
import { TotalResultsTable } from "./TotalResultsTable";
import { PeriodizationChartContainer } from "./PeriodizationChartContainer";
import { ScenarioChart } from "./ScenarioChart";
import { ScenarioFinancialChart, ScenarioNpvChart } from "./ScenarioFinancialChart";
import { useTranslation } from "../../i18n";

export const Periodization = () => {
  const { t } = useTranslation();
  const [scope] = useAppContext();
  const api = useAPI();

  const { benefitProfiles, costProfiles, benefitProfileMap, costProfileMap } =
    usePeriodizationProfiles();

  const [epicGoals, setEpicGoals] = useState<GoalTableItem[] | null>(null);
  const [profileSelections, setProfileSelections] =
    useState<EpicProfileSelections>({});

  // Three scenario results
  const [expectedResults, setExpectedResults] = useState<
    PeriodizationPeriodResult[]
  >([]);
  const [optimisticResults, setOptimisticResults] = useState<
    PeriodizationPeriodResult[]
  >([]);
  const [pessimisticResults, setPessimisticResults] = useState<
    PeriodizationPeriodResult[]
  >([]);

  const [numberOfPeriods, setNumberOfPeriods] = useState<number>(10);
  const [bpNokFactor, setBpNokFactor] = useState<number>(0.225);
  const [spNokFactor, setSpNokFactor] = useState<number>(0.6);

  const MIN_YEARS = 10;
  const MAX_YEARS = 20;

  const incrementYears = useCallback(() => {
    setNumberOfPeriods((prev) => Math.min(prev + 1, MAX_YEARS));
  }, []);

  const decrementYears = useCallback(() => {
    setNumberOfPeriods((prev) => Math.max(prev - 1, MIN_YEARS));
  }, []);

  const handleFactorChange = useCallback(
    (factorType: "bp" | "sp", newValue: number) => {
      if (factorType === "bp") setBpNokFactor(newValue);
      else setSpNokFactor(newValue);
    },
    []
  );

  // Calculate all three scenarios
  useEffect(() => {
    if (
      epicGoals &&
      epicGoals.length > 0 &&
      Object.keys(profileSelections).length > 0 &&
      numberOfPeriods >= 1
    ) {
      const expected = calculateTotalPeriodization(
        epicGoals,
        profileSelections,
        numberOfPeriods,
        bpNokFactor,
        spNokFactor
      );
      setExpectedResults(expected);

      const optimistic = calculateScenarioPeriodization(
        epicGoals,
        profileSelections,
        numberOfPeriods,
        bpNokFactor,
        spNokFactor,
        "optimistic"
      );
      setOptimisticResults(optimistic);

      const pessimistic = calculateScenarioPeriodization(
        epicGoals,
        profileSelections,
        numberOfPeriods,
        bpNokFactor,
        spNokFactor,
        "pessimistic"
      );
      setPessimisticResults(pessimistic);
    }
  }, [epicGoals, profileSelections, numberOfPeriods, bpNokFactor, spNokFactor]);

  const fetchEpicGoals = useCallback(async () => {
    try {
      const issues = await api.issue.getAll();
      const mapped: GoalTableItem[] = issues.map((issue) => ({
        ...issue,
        type: GoalTableItemTypeEnum.ISSUE,
      }));
      setEpicGoals(mapped);
    } catch (error) {
      console.error("Error fetching epic goals:", error);
      setEpicGoals([]);
    }
  }, [api]);

  useEffect(() => {
    fetchEpicGoals();
  }, [fetchEpicGoals]);

  const handleProfileChange = useCallback(
    (
      epicId: string,
      type: "bp" | "sp",
      selectedOption: ProfileOption | null
    ) => {
      const keyToUpdate =
        type === "bp" ? "benefitProfileKey" : "costProfileKey";
      const value =
        selectedOption?.value ||
        (keyToUpdate === "benefitProfileKey"
          ? benefitProfiles[0]?.value
          : costProfiles[0]?.value);

      setProfileSelections((prev) => ({
        ...prev,
        [epicId]: {
          ...prev[epicId],
          [keyToUpdate]: value,
        },
      }));
    },
    [benefitProfiles, costProfiles]
  );

  // Set default profiles when epics are loaded
  useEffect(() => {
    if (
      epicGoals &&
      Object.keys(profileSelections).length === 0 &&
      benefitProfiles.length > 0
    ) {
      const defaults: EpicProfileSelections = {};
      epicGoals.forEach((epic) => {
        defaults[epic.id] = {
          benefitProfileKey: benefitProfiles[0].value,
          costProfileKey: costProfiles[0].value,
        };
      });
      setProfileSelections(defaults);
    }
  }, [epicGoals, profileSelections, benefitProfiles, costProfiles]);

  return (
    <>
      <PageHeader>{t("periodization.chart_title")}</PageHeader>
      <p>{t("analysis.description")}</p>

      <div>
        <EpicSelectionTable
          epicGoals={epicGoals}
          profileSelections={profileSelections}
          handleProfileChange={handleProfileChange}
          bpNokFactor={bpNokFactor}
          spNokFactor={spNokFactor}
          handleFactorChange={handleFactorChange}
          benefitProfiles={benefitProfiles}
          costProfiles={costProfiles}
          benefitProfileMap={benefitProfileMap}
          costProfileMap={costProfileMap}
        />
      </div>

      {expectedResults.length > 0 && (
        <TotalResultsTable
          periodizationResults={expectedResults}
          numberOfPeriods={numberOfPeriods}
          incrementYears={incrementYears}
          decrementYears={decrementYears}
          MIN_YEARS={MIN_YEARS}
          MAX_YEARS={MAX_YEARS}
        />
      )}

      {optimisticResults.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>
            {t("periodization.optimistic_table_title").replace(
              "{{years}}",
              String(numberOfPeriods)
            )}
          </h3>
          <TotalResultsTable
            periodizationResults={optimisticResults}
            numberOfPeriods={numberOfPeriods}
            incrementYears={incrementYears}
            decrementYears={decrementYears}
            MIN_YEARS={MIN_YEARS}
            MAX_YEARS={MAX_YEARS}
          />
        </div>
      )}

      {pessimisticResults.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>
            {t("periodization.pessimistic_table_title").replace(
              "{{years}}",
              String(numberOfPeriods)
            )}
          </h3>
          <TotalResultsTable
            periodizationResults={pessimisticResults}
            numberOfPeriods={numberOfPeriods}
            incrementYears={incrementYears}
            decrementYears={decrementYears}
            MIN_YEARS={MIN_YEARS}
            MAX_YEARS={MAX_YEARS}
          />
        </div>
      )}

      {optimisticResults.length > 0 &&
        expectedResults.length > 0 &&
        pessimisticResults.length > 0 && (
          <ScenarioChart
            optimisticResults={optimisticResults}
            expectedResults={expectedResults}
            pessimisticResults={pessimisticResults}
          />
        )}

      {expectedResults.length > 0 && (
        <PeriodizationChartContainer periodizationResults={expectedResults} />
      )}

      {optimisticResults.length > 0 &&
        expectedResults.length > 0 &&
        pessimisticResults.length > 0 && (
          <ScenarioFinancialChart
            optimisticResults={optimisticResults}
            expectedResults={expectedResults}
            pessimisticResults={pessimisticResults}
          />
        )}

      {optimisticResults.length > 0 &&
        expectedResults.length > 0 &&
        pessimisticResults.length > 0 && (
          <ScenarioNpvChart
            optimisticResults={optimisticResults}
            expectedResults={expectedResults}
            pessimisticResults={pessimisticResults}
          />
        )}

      <div style={{ height: "80px" }} />
    </>
  );
};
