import React, { useMemo } from "react";
import DynamicTable from "@atlaskit/dynamic-table";
import Tooltip from "@atlaskit/tooltip";
import Button from "@atlaskit/button";
import HipchatChevronDoubleUpIcon from "@atlaskit/icon/glyph/hipchat/chevron-double-up";
import HipchatChevronDoubleDownIcon from "@atlaskit/icon/glyph/hipchat/chevron-double-down";

import { PeriodizationPeriodResult } from "./periodizationCalculations";
import { SpotlightTarget } from "@atlaskit/onboarding";
import { useTranslation } from "../../i18n";

interface TotalResultsTableProps {
  periodizationResults: PeriodizationPeriodResult[];
  numberOfPeriods: number;
  incrementYears: () => void;
  decrementYears: () => void;
  MIN_YEARS: number;
  MAX_YEARS: number;
}

export const TotalResultsTable: React.FC<TotalResultsTableProps> = ({
  periodizationResults,
  numberOfPeriods,
  incrementYears,
  decrementYears,
  MIN_YEARS,
  MAX_YEARS,
}) => {
  const { t } = useTranslation();

  // Hjelpefunksjon for å formatere tall pent basert på språkvalg
  const formatNum = (val: number, decimals: number = 2) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Flytter head-definisjon inn i useMemo for å støtte i18n
  const numericCellStyle = { textAlign: "right" as const };

  const totalTableHead = useMemo(
    () => ({
      cells: [
        { key: "period", content: t("chart.year_label"), style: numericCellStyle },
        { key: "grossBenefit", content: t("chart.total_bp"), style: numericCellStyle },
        { key: "grossCost", content: t("chart.total_sp"), style: numericCellStyle },
        { key: "netPoints", content: t("chart.net_value"), style: numericCellStyle },
        { key: "discount", content: t("analysis.table.discount"), style: numericCellStyle },
        { key: "netNPV", content: t("analysis.table.npv"), style: numericCellStyle },
        { key: "accumulatedNPV", content: t("chart.acc_npv"), style: numericCellStyle },
      ],
    }),
    [t]
  );

  const totalTableRows = useMemo(() => {
    return periodizationResults.map((result) => ({
      key: `p-${result.period}`,
      cells: [
        { key: "period", content: `${result.period}`, style: numericCellStyle },
        { key: "grossBenefit", content: formatNum(result.grossBenefit), style: numericCellStyle },
        { key: "grossCost", content: formatNum(result.grossCost), style: numericCellStyle },
        { key: "netPoints", content: formatNum(result.netPoints), style: numericCellStyle },
        { key: "discount", content: formatNum(result.discountFactor, 4), style: numericCellStyle },
        { key: "netNPV", content: formatNum(result.netPresentValue), style: numericCellStyle },
        { key: "accumulatedNPV", content: formatNum(result.accumulatedNPV), style: numericCellStyle },
      ],
    }));
  }, [periodizationResults]);

  return (
    <>
      <div style={{ marginTop: "30px" }}>
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <h3 style={{ marginRight: "10px" }}>
            {t("analysis.table.financial_plan_title").replace(
              "{{years}}",
              String(numberOfPeriods)
            )}
          </h3>

          <SpotlightTarget name="year-tooltip">
            <Tooltip content={t("analysis.table.decrease_years")}>
              <Button
                onClick={decrementYears}
                isDisabled={numberOfPeriods <= MIN_YEARS}
                iconBefore={
                  <HipchatChevronDoubleDownIcon
                    label={t("analysis.table.decrease_years")}
                  />
                }
              />
            </Tooltip>
          </SpotlightTarget>

          <Tooltip content={t("analysis.table.increase_years")}>
            <Button
              onClick={incrementYears}
              isDisabled={numberOfPeriods >= MAX_YEARS}
              iconBefore={
                <HipchatChevronDoubleUpIcon
                  label={t("analysis.table.increase_years")}
                />
              }
            />
          </Tooltip>
        </div>

        <DynamicTable
          head={totalTableHead}
          rows={totalTableRows}
          rowsPerPage={5}
          defaultPage={1}
        />
      </div>
      <SpotlightTarget name="second-table">
        <div />
      </SpotlightTarget>
    </>
  );
};
