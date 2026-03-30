import React, { useState } from "react";
import { Flex, Box, Stack, xcss } from "@atlaskit/primitives";
import Textfield from "@atlaskit/textfield";
import Tooltip from "@atlaskit/tooltip";
import { GoalTableItem, CostTime } from "../../Models";
import Tabs, { Tab, TabList, TabPanel, TabData } from "@atlaskit/tabs";
import { HelperMessage } from "@atlaskit/form";
import SectionMessage from "@atlaskit/section-message";

// --- STILER (Uendret) ---
const dataCellStyles = xcss({
  padding: "space.050",
  flex: "1 1 5.5rem",
  display: "flex",
  justifyContent: "center",
  textAlign: "center",
});
const epicCellStyles = xcss({
  width: "15rem",
  padding: "space.100",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "flex",
  alignItems: "center",
});
const subHeaderCellStyles = xcss({
  padding: "space.050",
  textAlign: "center",
  fontWeight: "bold",
  flex: "1 1 5.5rem",
  color: "color.text.subtle",
  fontSize: "0.75rem",
});
const tableContainerStyles = xcss({
  width: "max-content",
  border: "1px solid",
  borderColor: "color.border",
  borderRadius: "border.radius.100",
  overflow: "hidden",
});
const headerContainerStyles = xcss({
  backgroundColor: "color.background.neutral.subtle",
});
const rowStyles = xcss({
  borderTop: "1px solid",
  borderColor: "color.border",
  alignItems: "center",
  ":hover": {
    backgroundColor: "color.background.neutral.subtle.hovered",
  },
});
// --- Slutt på stiler ---

// --- PROPS (Uendret) ---
type TableProps = {
  goals: GoalTableItem[];
  values: { [goalId: string]: CostTime };
  submitting: boolean;
  onChange: (goalId: string, field: keyof CostTime, value: string) => void;
};

// --- GJENBRUKBAR HEADER (Uendret) ---
const EstimationTableHeader = () => (
  <Stack space="space.0" xcss={headerContainerStyles}>
    <Flex
      direction="row"
      xcss={xcss({ borderBottom: "1px solid", borderColor: "color.border" })}
    >
      <Box xcss={epicCellStyles}>
        <Box
          xcss={[
            subHeaderCellStyles,
            xcss({ textAlign: "left", paddingLeft: "space.100" }),
          ]}
        >
          Epic
        </Box>
      </Box>
      <Box xcss={subHeaderCellStyles}>Optimistic (O)</Box>
      <Box xcss={subHeaderCellStyles}>Most Likely (M)</Box>
      <Box xcss={subHeaderCellStyles}>Pessimistic (P)</Box>
    </Flex>
  </Stack>
);

const EstimationTableHeaderBenefit = () => (
  <Stack space="space.0" xcss={headerContainerStyles}>
    <Flex
      direction="row"
      xcss={xcss({ borderBottom: "1px solid", borderColor: "color.border" })}
    >
      <Box xcss={epicCellStyles}>
        <Box
          xcss={[
            subHeaderCellStyles,
            xcss({ textAlign: "left", paddingLeft: "space.100" }),
          ]}
        >
          Epic
        </Box>
      </Box>
      <Box xcss={subHeaderCellStyles}>Optimistic (O)</Box>
      <Box xcss={subHeaderCellStyles}>Calculated Benefit Point</Box>
      <Box xcss={subHeaderCellStyles}>Pessimistic (P)</Box>
    </Flex>
  </Stack>
);

// --- KOMPONENT (Oppdatert med 3 faner) ---
export const ThreePointEstimationTable = ({
  goals,
  values,
  submitting,
  onChange,
}: TableProps) => {
  // NY STATE: Holder styr på valgt fane (0=Cost, 1=Time, 2=Benefit)
  const [selectedTab, setSelectedTab] = useState<number>(0);

  const tabs = [
    { label: "Cost Estimation", content: "Cost" },
    { label: "Time Estimation", content: "Time" },
    { label: "Benefit Estimation", content: "Benefit" }, // <-- NY FANE
  ];

  return (
    <Stack space="space.200">
      {/* GLOBAL HEADER (Uendret) */}
      <Box
        xcss={xcss({
          padding: "space.100",
          fontWeight: "bold",
          fontSize: "1.1rem",
        })}
      >
        3-Point Estimation
      </Box>

      <Box>
        <SectionMessage title="Step 2: Add 3-Point Estimations (O, M, P)">
          <p>
            This table captures the <strong>uncertainty</strong> of your
            estimates. Please provide the Optimistic (best case) and Pessimistic
            (worst case) values for each Epic.
          </p>
          <ul>
            <li>
              <strong>Cost & Time Tabs:</strong> The 'Most Likely (M)' field is
              pre-filled with the value from the 'Goal Structure' page, but you
              can override it here.
            </li>
            <li>
              <strong>Benefit Tab (Important):</strong> The 'Most Likely (M)'
              value (e.g., <strong>34</strong>) is <strong>read-only</strong> as
              it is calculated from the 'Benefit Weighting' matrix above in Step
              1.
              <ul>
                <li>
                  To change this 'M' value, you must return to the Estimation
                  table above, adjust the 100-point scores, and press 'Save'.
                </li>
              </ul>
            </li>
            <li>
              <strong>Validation:</strong> The 'Save' button will be disabled
              unless all estimates follow the correct logic:
              <ul>
                <li>
                  <strong>For Cost/Time:</strong>{" "}
                  <code>
                    Optimistic (O) ≤ Most Likely (M) ≤ Pessimistic (P)
                  </code>
                </li>
                <li>
                  <strong>For Benefit:</strong>{" "}
                  <code>
                    Pessimistic (P) ≤ Most Likely (M) ≤ Optimistic (O)
                  </code>
                </li>
              </ul>
            </li>
          </ul>
          <p>
            Remember to press <strong>Save</strong> when you are finished.
          </p>
        </SectionMessage>
      </Box>

      {/* --- Fane-system --- */}
      <Tabs
        id="3-point-estimation-tabs"
        selected={selectedTab}
        onChange={(index: number, _tab: TabData) => setSelectedTab(index)}
      >
        <TabList>
          <Tab>{tabs[0].label}</Tab>
          <Tab>{tabs[1].label}</Tab>
          <Tab>{tabs[2].label}</Tab> {/* <-- NY FANE-KNAPP */}
        </TabList>

        {/* --- FANE 1: COST (Uendret) --- */}
        <TabPanel>
          <Flex direction="column" xcss={tableContainerStyles}>
            <EstimationTableHeader />
            {goals.map((goal) => {
              const displayName =
                goal.key || (goal.key && goal.id) || goal.key || "Unknown";
              const currentValues = values[goal.id] || {};

              return (
                <Flex key={goal.id} direction="row" xcss={rowStyles}>
                  <Box xcss={epicCellStyles}>
                    <Tooltip content={displayName}>
                      <span>{displayName}</span>
                    </Tooltip>
                  </Box>
                  <Box xcss={dataCellStyles}>
                    <Textfield
                      style={{ width: "5.5rem", textAlign: "center" }}
                      type="number"
                      isDisabled={submitting}
                      value={currentValues.costOptimistic ?? ""}
                      onChange={(e) =>
                        onChange(
                          goal.id,
                          "costOptimistic",
                          e.currentTarget.value
                        )
                      }
                    />
                  </Box>
                  <Box xcss={dataCellStyles}>
                    <Textfield
                      style={{ width: "5.5rem", textAlign: "center" }}
                      type="number"
                      isDisabled={submitting}
                      value={currentValues.cost ?? ""}
                      onChange={(e) =>
                        onChange(goal.id, "cost", e.currentTarget.value)
                      }
                    />
                  </Box>
                  <Box xcss={dataCellStyles}>
                    <Textfield
                      style={{ width: "5.5rem", textAlign: "center" }}
                      type="number"
                      isDisabled={submitting}
                      value={currentValues.costPessimistic ?? ""}
                      onChange={(e) =>
                        onChange(
                          goal.id,
                          "costPessimistic",
                          e.currentTarget.value
                        )
                      }
                    />
                  </Box>
                </Flex>
              );
            })}
          </Flex>
        </TabPanel>

        {/* --- FANE 2: TIME (Uendret) --- */}
        <TabPanel>
          <Flex direction="column" xcss={tableContainerStyles}>
            <EstimationTableHeader />
            {goals.map((goal) => {
              const displayName =
                goal.key || (goal.key && goal.id) || goal.key || "Unknown";
              const currentValues = values[goal.id] || {};

              return (
                <Flex key={goal.id} direction="row" xcss={rowStyles}>
                  <Box xcss={epicCellStyles}>
                    <Tooltip content={displayName}>
                      <span>{displayName}</span>
                    </Tooltip>
                  </Box>
                  <Box xcss={dataCellStyles}>
                    <Textfield
                      style={{ width: "5.5rem", textAlign: "center" }}
                      type="number"
                      isDisabled={submitting}
                      value={currentValues.timeOptimistic ?? ""}
                      onChange={(e) =>
                        onChange(
                          goal.id,
                          "timeOptimistic",
                          e.currentTarget.value
                        )
                      }
                    />
                  </Box>
                  <Box xcss={dataCellStyles}>
                    <Textfield
                      style={{ width: "5.5rem", textAlign: "center" }}
                      type="number"
                      isDisabled={submitting}
                      value={currentValues.time ?? ""}
                      onChange={(e) =>
                        onChange(goal.id, "time", e.currentTarget.value)
                      }
                    />
                  </Box>
                  <Box xcss={dataCellStyles}>
                    <Textfield
                      style={{ width: "5.5rem", textAlign: "center" }}
                      type="number"
                      isDisabled={submitting}
                      value={currentValues.timePessimistic ?? ""}
                      onChange={(e) =>
                        onChange(
                          goal.id,
                          "timePessimistic",
                          e.currentTarget.value
                        )
                      }
                    />
                  </Box>
                </Flex>
              );
            })}
          </Flex>
        </TabPanel>

        {/* --- FANE 3: NYTTE (BENEFIT) --- */}
        <TabPanel>
          <Flex direction="column" xcss={tableContainerStyles}>
            <EstimationTableHeaderBenefit />
            {goals.map((goal) => {
              const displayName =
                goal.key || (goal.key && goal.id) || goal.key || "Unknown";
              const currentValues = values[goal.id] || {};

              // Hent den BEREGNEDE M-verdien (Nytte)
              const benefitM =
                (goal as any).properties?.evaluation_points?.value || 0;

              return (
                <Flex key={goal.id} direction="row" xcss={rowStyles}>
                  <Box xcss={epicCellStyles}>
                    <Tooltip content={displayName}>
                      <span>{displayName}</span>
                    </Tooltip>
                  </Box>

                  {/* O-Benefit (Input) */}
                  <Box xcss={dataCellStyles}>
                    <Textfield
                      style={{ width: "5.5rem", textAlign: "center" }}
                      type="number"
                      isDisabled={submitting}
                      value={currentValues.benefitOptimistic ?? ""}
                      onChange={(e) =>
                        onChange(
                          goal.id,
                          "benefitOptimistic",
                          e.currentTarget.value
                        )
                      }
                    />
                  </Box>

                  {/* M-Benefit (Read-only) */}
                  <Box xcss={dataCellStyles}>
                    <Textfield
                      style={{ width: "5.5rem", textAlign: "center" }}
                      type="number"
                      isReadOnly // Denne er BEREGNET, ikke redigerbar her
                      value={benefitM.toFixed(2)}
                    />
                  </Box>

                  {/* P-Benefit (Input) */}
                  <Box xcss={dataCellStyles}>
                    <Textfield
                      style={{ width: "5.5rem", textAlign: "center" }}
                      type="number"
                      isDisabled={submitting}
                      value={currentValues.benefitPessimistic ?? ""}
                      onChange={(e) =>
                        onChange(
                          goal.id,
                          "benefitPessimistic",
                          e.currentTarget.value
                        )
                      }
                    />
                  </Box>
                </Flex>
              );
            })}
          </Flex>
        </TabPanel>
      </Tabs>
    </Stack>
  );
};
