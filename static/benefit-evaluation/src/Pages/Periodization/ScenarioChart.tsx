import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip as ChartTooltip,
  LineController,
  BarController,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { PeriodizationPeriodResult } from "./periodizationCalculations";
import { useTranslation } from "../../i18n";

ChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  ChartTooltip,
  LineController,
  BarController
);

interface ScenarioChartProps {
  optimisticResults: PeriodizationPeriodResult[];
  expectedResults: PeriodizationPeriodResult[];
  pessimisticResults: PeriodizationPeriodResult[];
}

export const ScenarioChart: React.FC<ScenarioChartProps> = ({
  optimisticResults,
  expectedResults,
  pessimisticResults,
}) => {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    const results =
      expectedResults.length > 0 ? expectedResults : optimisticResults;
    if (results.length === 0) return { labels: [], datasets: [] };

    const labels = results.map(
      (r) => `${t("chart.year_label")} ${r.period}`
    );

    return {
      labels,
      datasets: [
        // Optimistic Benefit - green dashed
        {
          label: t("periodization.opt_bp"),
          borderColor: "rgba(0, 160, 0, 1)",
          backgroundColor: "rgba(0, 160, 0, 0.05)",
          data: optimisticResults.map((r) => r.grossBenefit),
          borderDash: [8, 4],
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
        },
        // Expected Benefit - green solid
        {
          label: t("periodization.exp_bp"),
          borderColor: "rgba(0, 160, 0, 1)",
          backgroundColor: "rgba(0, 160, 0, 0.1)",
          data: expectedResults.map((r) => r.grossBenefit),
          borderDash: [],
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 3,
        },
        // Pessimistic Benefit - green dotted
        {
          label: t("periodization.pes_bp"),
          borderColor: "rgba(0, 160, 0, 1)",
          backgroundColor: "rgba(0, 160, 0, 0.05)",
          data: pessimisticResults.map((r) => r.grossBenefit),
          borderDash: [2, 4],
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
        },
        // Optimistic Cost - red dashed
        {
          label: t("periodization.opt_sp"),
          borderColor: "rgba(204, 50, 50, 1)",
          backgroundColor: "rgba(204, 50, 50, 0.05)",
          data: optimisticResults.map((r) => r.grossCost),
          borderDash: [8, 4],
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
        },
        // Expected Cost - red solid
        {
          label: t("periodization.exp_sp"),
          borderColor: "rgba(204, 50, 50, 1)",
          backgroundColor: "rgba(204, 50, 50, 0.1)",
          data: expectedResults.map((r) => r.grossCost),
          borderDash: [],
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 3,
        },
        // Pessimistic Cost - red dotted
        {
          label: t("periodization.pes_sp"),
          borderColor: "rgba(204, 50, 50, 1)",
          backgroundColor: "rgba(204, 50, 50, 0.05)",
          data: pessimisticResults.map((r) => r.grossCost),
          borderDash: [2, 4],
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
        },
      ],
    };
  }, [optimisticResults, expectedResults, pessimisticResults, t]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: t("periodization.chart_title"),
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        title: {
          display: true,
          text: "Million NOK",
        },
      },
      x: {
        title: {
          display: true,
          text: t("chart.year_label"),
        },
      },
    },
  };

  if (
    optimisticResults.length === 0 &&
    expectedResults.length === 0 &&
    pessimisticResults.length === 0
  ) {
    return null;
  }

  return (
    <div style={{ marginTop: "40px" }}>
      <h3>{t("periodization.chart_title")}</h3>
      <p>{t("periodization.chart_description")}</p>
      <div style={{ height: "450px" }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};
