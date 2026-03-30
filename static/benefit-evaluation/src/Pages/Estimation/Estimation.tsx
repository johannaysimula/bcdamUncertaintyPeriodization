import { useEffect, useMemo, useState } from "react";
import { SelectGoalCollections } from "../../Components/Estimation/SelectGoalCollections";
import { Loading } from "../../Components/Common/Loading";
import Button, { ButtonGroup, LoadingButton } from "@atlaskit/button";
import EmptyState from "@atlaskit/empty-state";
import { useNavigate } from "react-router-dom";
import { useAPI } from "../../Contexts/ApiContext";
import { useAppContext } from "../../Contexts/AppContext";
import PageHeader from "@atlaskit/page-header";
import { EstimationContainer } from "./EstimationContainer";
import { ThreePointEstimationTable } from "../MonteCarlo/ThreepointEstimationTable";
import { EstimationContextProvider } from "./EstimationContext";
import {
  GoalTier,
  EstimationMode,
  EstimationProps,
  CostTime,
  GoalTableItem,
  GoalTableItemTypeEnum,
} from "../../Models";
import { Stack, Box, xcss } from "@atlaskit/primitives";
import { HelperMessage } from "@atlaskit/form";
import SectionMessage from "@atlaskit/section-message";

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

export const Estimation = () => {
  // --- Hoved-state (uendret) ---
  const [isLoading, setLoading] = useState<boolean>(false);
  const [goalTier, setGoalTier] = useState<GoalTier>();
  const [upperGoalTier, setUpperGoalTier] = useState<GoalTier>();
  const [estimationProps, setEstimationProps] =
    useState<EstimationProps<EstimationMode>>();
  const [error, setError] = useState<string>();

  const navigate = useNavigate();
  const [scope] = useAppContext();
  const api = useAPI();

  // --- 3-punkts state ---
  const [tpeIsLoading, setTpeIsLoading] = useState<boolean>(false);
  const [tpeIsSubmitting, setTpeIsSubmitting] = useState<boolean>(false);
  const [tpeGoals, setTpeGoals] = useState<GoalTableItem[]>([]);
  const [tpeValues, setTpeValues] = useState<{ [goalId: string]: CostTime }>(
    {}
  );
  const [tpeValidate, setTpeValidate] = useState<boolean>(false);

  // --- NY STATE FOR FLYT ---
  const [showThreePointPrompt, setShowThreePointPrompt] =
    useState<boolean>(false);
  const [showThreePointTable, setShowThreePointTable] =
    useState<boolean>(false);

  // --- Hoved-useEffect (uendret) ---
  useEffect(() => {
    let isMounted = true;
    if (goalTier && upperGoalTier) {
      setEstimationProps(undefined);
      setShowThreePointPrompt(false);
      setShowThreePointTable(false);
      setLoading(true);

      api.estimation
        .getEstimationProps(goalTier, upperGoalTier)
        .then((response) => {
          if (isMounted) {
            setEstimationProps(response);
            setShowThreePointPrompt(true);
          }
          setLoading(false);
        })
        .catch((error) => {
          if (error.message === "string") {
            setError(error.message);
          } else {
            setError("Something went wrong, please try again later");
          }
          if (isMounted) setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [goalTier, upperGoalTier, api.estimation]);

  // --- 3-punkts useEffect (uendret) ---
  useEffect(() => {
    let isMounted = true;

    if (showThreePointTable) {
      setTpeIsLoading(true);

      api.issue
        .getAll()
        .then(async (issues) => {
          if (!isMounted) return;

          const items: GoalTableItem[] = issues.map((issue) => ({
            ...issue,
            type: GoalTableItemTypeEnum.ISSUE,
          }));

          items.sort((a, b) =>
            (a.key || "").localeCompare(b.key || "", undefined, {
              numeric: true,
            })
          );

          setTpeGoals(items);

          const initialValues: { [goalId: string]: CostTime } = {};
          items.forEach((item) => {
            const cost = item.issueCost?.cost || 1;
            const time = item.issueCost?.time || 0;
            const benefitM =
              (item as any).properties?.evaluation_points?.value || 0;

            initialValues[item.id] = {
              ...(item.issueCost as CostTime),
              costOptimistic: item.issueCost?.costOptimistic ?? cost,
              costPessimistic: item.issueCost?.costPessimistic ?? cost,
              timeOptimistic: item.issueCost?.timeOptimistic ?? time,
              timePessimistic: item.issueCost?.timePessimistic ?? time,
              cost: cost,
              time: time,
              balanced_points: item.issueCost?.balanced_points || cost,
              benefitOptimistic: item.issueCost?.benefitOptimistic ?? benefitM,
              benefitPessimistic:
                item.issueCost?.benefitPessimistic ?? benefitM,
            };
          });
          setTpeValues(initialValues);
          setTpeIsLoading(false);
        })
        .catch((error) => {
          console.error(error);
          if (isMounted) setTpeIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [api.issue, showThreePointTable]);

  // --- Validerings-useEffect (KORRIGERT) ---
  useEffect(() => {
    if (tpeIsLoading) return;

    const isValid = Object.values(tpeValues).every((value, index) => {
      // Cost (O <= M <= P)
      const cO = value.costOptimistic || 0;
      const cM = value.cost || 0;
      const cP = value.costPessimistic || 0;

      // Time (O <= M <= P)
      const tO = value.timeOptimistic || 0;
      const tM = value.time || 0;
      const tP = value.timePessimistic || 0;

      // --- FIKS: Bruker 'benefitOptimistic' og 'benefitPessimistic' ---
      const goal = tpeGoals[index];
      const bM = (goal as any).properties?.evaluation_points?.value || 0;
      const bO = value.benefitOptimistic || 0; // KORRIGERT (var bpOptimistic)
      const bP = value.benefitPessimistic || 0; // KORRIGERT (var bpPessimistic)
      // --- SLUTT PÅ FIKS ---

      // Sjekk alle 3
      return (
        cO <= cM && cM <= cP && tO <= tM && tM <= tP && bP <= bM && bM <= bO
      );
    });
    setTpeValidate(isValid);
  }, [tpeValues, tpeIsLoading, tpeGoals]); // 'tpeGoals' er en nødvendig dependency

  // --- updateSingleValue-funksjon (Uendret) ---
  const updateSingleValue = (
    goalId: string,
    field: keyof CostTime,
    value: string
  ) => {
    const numValue = parseInt(value) || 0;

    setTpeValues((prevValues) => {
      const currentValues = prevValues[goalId];
      const newValues: CostTime = {
        ...currentValues,
        [field]: numValue,
      } as CostTime;
      return { ...prevValues, [goalId]: newValues };
    });
  };

  // --- submitThreePoint-funksjon (Uendret) ---
  const submitThreePoint = async () => {
    setTpeIsSubmitting(true);
    await api.issue
      .setIssueCostTime(tpeValues)
      .then(() => {
        setTpeIsSubmitting(false);
        // TODO: Vis en suksess-melding
      })
      .catch((error) => {
        console.error(error);
        setTpeIsSubmitting(false);
        // TODO: Vis en feil-melding
      });
  };

  // --- displayError (Uendret) ---
  const displayError = useMemo(() => {
    if (error && goalTier && upperGoalTier) {
      if (error.includes(upperGoalTier.name)) {
        return (
          <EmptyState
            header={`${upperGoalTier.name} has no goals`}
            description="You can add goals by clicking the button below"
            headingLevel={2}
            primaryAction={
              <Button
                appearance="primary"
                onClick={() => navigate(`..//${upperGoalTier.id}/create-goal`)}
              >
                Add Goals
              </Button>
            }
          />
        );
      } else if (error.includes(goalTier.name)) {
        if (goalTier.scopeId === scope.id) {
          return (
            <EmptyState
              header={`${goalTier.name} has no goals`}
              description="You can add goals by clicking the button below"
              headingLevel={2}
              primaryAction={
                <Button
                  appearance="primary"
                  onClick={() => navigate(`../goal-structure`)}
                >
                  Add Goals
                </Button>
              }
            />
          );
        } else {
          return (
            <EmptyState
              header={`${goalTier.name} has no goals`}
              description="To evaluate this goal collection, you need to add goals to it"
            />
          );
        }
      }
    }
    return (
      <EmptyState header={`Something went wrong, or there are ny goals`} />
    );
  }, [error, goalTier, upperGoalTier, navigate, scope.id]);

  // --- RENDER (Uendret) ---
  return (
    <>
      <PageHeader
        bottomBar={
          <SelectGoalCollections
            isDisabled={isLoading}
            onChange={(value) => {
              const { goalTier, upperGoalTier } = value.value;
              setGoalTier(goalTier);
              setUpperGoalTier(upperGoalTier);
            }}
          />
        }
      >
        Estimation
        <Box>
          <SectionMessage title="How Estimation Works">
            <p>
              This page connects your strategic goals (Benefit) with the work
              required (Effort) using two distinct steps.
            </p>
            <ul>
              <li>
                <b>Step 1 (Benefit Weighting):</b> Use the main table below to
                score how much each Epic contributes to each goal. For every
                goal column (e.g., "Goal-1"), you must distribute{" "}
                <strong>exactly 100 points</strong>. This is a{" "}
                <i>forced-ranking method</i> that clarifies relative priority.
                It forces you to decide if one Epic is twice as critical as
                another (e.g., a score of 50 vs. 25).
              </li>
              <li>
                <b>Step 2 (Effort Estimation):</b> After saving the benefit
                weighting, you will be prompted to add 3-point estimates
                (Optimistic, Most Likely, Pessimistic) for Benefit, Cost and
                Time. This captures the <i>uncertainty</i> of the work and is
                required for the risk simulations on the 'Analysis' page.
              </li>
              <li>
                <b>Step 3 (Press Save):</b> After saving the benefit weighting
                AND the 3-Point Estimation for both Cost & Time,{" "}
                <b>move on to the next tab - Analysis.</b>
              </li>
            </ul>
          </SectionMessage>
        </Box>
      </PageHeader>

      {/* Gammel Estimation Container (urørt) */}
      {error ? (
        displayError
      ) : (
        <>
          {estimationProps && (
            <EstimationContextProvider estimationProps={estimationProps}>
              <EstimationContainer />
            </EstimationContextProvider>
          )}
          {isLoading && <Loading />}
        </>
      )}

      {/* --- NYTT "JA/NEI"-SPØRSMÅL --- */}
      {showThreePointPrompt && !showThreePointTable && (
        <Stack space="space.200" xcss={xcss({ padding: "space.200" })}>
          <SectionMessage
            title="Add 3-Point Estimation"
            actions={[
              <Button
                appearance="primary"
                onClick={() => setShowThreePointTable(true)}
              >
                Yes
              </Button>,
              <Button
                appearance="subtle"
                onClick={() => setShowThreePointPrompt(false)}
              >
                Discard
              </Button>,
            ]}
          >
            <p>
              Do you want to add 3-point (O, M, P) estimates to this estimation
              process?
            </p>
          </SectionMessage>
        </Stack>
      )}

      {/* --- 3-PUNKTSTABELL (Vises kun etter "Yes") --- */}
      {showThreePointTable && (
        <>
          <Stack>
            {tpeIsLoading ? (
              <Loading />
            ) : (
              <>
                <ThreePointEstimationTable
                  goals={tpeGoals}
                  values={tpeValues}
                  submitting={tpeIsSubmitting}
                  onChange={updateSingleValue}
                />
                <HelperMessage>
                  All values must follow the O ≤ M ≤ P rule (or P ≤ M ≤ O for
                  Benefit)
                </HelperMessage>
                <LoadingButton
                  appearance="primary"
                  isLoading={tpeIsSubmitting}
                  isDisabled={!tpeValidate}
                  onClick={submitThreePoint}
                >
                  Save 3-Point Estimations
                </LoadingButton>
              </>
            )}
          </Stack>
        </>
      )}
    </>
  );
};
