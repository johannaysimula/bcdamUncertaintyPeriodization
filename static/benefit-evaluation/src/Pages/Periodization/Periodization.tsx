import { useEffect, useState, useCallback } from "react";
import PageHeader from "@atlaskit/page-header";
import { Goal, GoalTier, GoalTierTypeEnum } from "../../Models";
import { useAppContext } from "../../Contexts/AppContext";
import { useAPI } from "../../Contexts/ApiContext";
import {
  calculateTotalPeriodization,
  calculateScenarioPeriodization,
  PeriodizationPeriodResult,
} from "./periodizationCalculations";
import Button from "@atlaskit/button";

import {
  EpicProfileSelections,
  ProfileOption,
  usePeriodizationProfiles,
} from "./periodizationTypes";

import { EpicSelectionTable } from "./EpicSelectionTable";
import { TotalResultsTable } from "./TotalResultsTable";
import { PeriodizationChartContainer } from "./PeriodizationChartContainer";
import { ScenarioChart } from "./ScenarioChart";
import { useTranslation } from "@forge/react";

export const Periodization = () => {
  const { t } = useTranslation();
  const [scope] = useAppContext();
  const api = useAPI();

  const { benefitProfiles, costProfiles, benefitProfileMap, costProfileMap } =
    usePeriodizationProfiles();

  const [epicGoals, setEpicGoals] = useState<Goal[] | null>(null);
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

  // Fetch epic goals using the ISSUE_TYPE tier (same as bcdamUncertainty Analysis.tsx)
  const fetchEpicGoals = useCallback(async () => {
    try {
      const goalTiers: GoalTier[] = await api.goalTier.getAll(
        scope.id,
        scope.type
      );

      // Try to find ISSUE_TYPE tier first (bcdamUncertainty approach)
      const issueTypeTier = goalTiers.find(
        (tier) => tier.type === GoalTierTypeEnum.ISSUE_TYPE
      );

      if (issueTypeTier) {
        const epics = await api.goal.getAll(scope.id, issueTypeTier.id);
        setEpicGoals(epics);
        return;
      }

      // Fallback: use bcdamPeriodization approach - get all collections and filter root-epic
      const allCollections = await api.goalCollection.getAll(scope.id);
      let allEpics: Goal[] = [];

      for (const collection of allCollections) {
        const goals = await api.goal.getAll(scope.id, collection.id);
        const filtered = goals.filter(
          (goal) => goal.goalCollectionId === "root-epic"
        );
        allEpics = allEpics.concat(filtered);
      }
      setEpicGoals(allEpics);
    } catch (error) {
      console.error("Error fetching epic goals:", error);
      setEpicGoals([]);
    }
  }, [scope.id, scope.type, api]);

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
    </>
  );
};
