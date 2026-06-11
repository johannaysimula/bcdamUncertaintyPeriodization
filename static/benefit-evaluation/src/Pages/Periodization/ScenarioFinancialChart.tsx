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
import { Chart } from "react-chartjs-2";
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

interface ScenarioFinancialChartProps {
  optimisticResults: PeriodizationPeriodResult[];
  expectedResults: PeriodizationPeriodResult[];
  pessimisticResults: PeriodizationPeriodResult[];
}

export const ScenarioFinancialChart: React.FC<ScenarioFinancialChartProps> = ({
  optimisticResults,
  expectedResults,
  pessimisticResults,
}) => {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    const base = expectedResults.length > 0 ? expectedResults : optimisticResults;
    if (base.length === 0) return { labels: [], datasets: [] };

    const labels = base.map((r) => `${t("chart.year_label")} ${r.period}`);

    const allNPV = [
      ...optimisticResults.map((r) => r.accumulatedNPV),
      ...expectedResults.map((r) => r.accumulatedNPV),
      ...pessimisticResults.map((r) => r.accumulatedNPV),
    ];
    const npvMin = Math.min(0, ...allNPV);
    const npvMax = Math.max(0, ...allNPV);

    return {
      labels,
      datasets: [
        // --- BENEFIT lines (green) ---
        {
          type: "line" as const,
          label: `${t("chart.total_bp")} (${t("periodization.optimistic_label")})`,
          borderColor: "rgba(44, 154, 44, 0.5)",
          backgroundColor: "transparent",
          data: optimisticResults.map((r) => r.grossBenefit),
          borderDash: [8, 4],
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
          yAxisID: "yNetPoints",
        },
        {
          type: "line" as const,
          label: `${t("chart.total_bp")} (${t("periodization.expected_label")})`,
          borderColor: "rgba(44, 154, 44, 1)",
          backgroundColor: "rgba(0, 150, 0, 0.1)",
          data: expectedResults.map((r) => r.grossBenefit),
          borderDash: [],
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 3,
          yAxisID: "yNetPoints",
        },
        {
          type: "line" as const,
          label: `${t("chart.total_bp")} (${t("periodization.pessimistic_label")})`,
          borderColor: "rgba(44, 154, 44, 0.5)",
          backgroundColor: "transparent",
          data: pessimisticResults.map((r) => r.grossBenefit),
          borderDash: [2, 4],
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
          yAxisID: "yNetPoints",
        },
        // --- COST lines (red) ---
        {
          type: "line" as const,
          label: `${t("chart.total_sp")} (${t("periodization.optimistic_label")})`,
          borderColor: "rgba(204, 78, 78, 0.5)",
          backgroundColor: "transparent",
          data: optimisticResults.map((r) => r.grossCost),
          borderDash: [8, 4],
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
          yAxisID: "yNetPoints",
        },
        {
          type: "line" as const,
          label: `${t("chart.total_sp")} (${t("periodization.expected_label")})`,
          borderColor: "rgba(204, 78, 78, 1)",
          backgroundColor: "rgba(255, 0, 0, 0.1)",
          data: expectedResults.map((r) => r.grossCost),
          borderDash: [],
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 3,
          yAxisID: "yNetPoints",
        },
        {
          type: "line" as const,
          label: `${t("chart.total_sp")} (${t("periodization.pessimistic_label")})`,
          borderColor: "rgba(204, 78, 78, 0.5)",
          backgroundColor: "transparent",
          data: pessimisticResults.map((r) => r.grossCost),
          borderDash: [2, 4],
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
          yAxisID: "yNetPoints",
        },
        // --- NET VALUE bars (expected only) ---
        {
          type: "bar" as const,
          label: t("chart.net_value"),
          backgroundColor: (context: any) => {
            const value = context.raw;
            return value >= 0
              ? "rgba(171, 245, 209, 0.8)"
              : "rgba(255, 189, 173, 0.8)";
          },
          borderColor: "rgba(255, 255, 255, 0.5)",
          borderWidth: 1,
          data: expectedResults.map((r) => r.netPoints),
          yAxisID: "yNetPoints",
        },
        // --- ACCUMULATED NPV lines (blue) ---
        {
          type: "line" as const,
          label: `${t("chart.acc_npv")} (${t("periodization.optimistic_label")})`,
          borderColor: "rgba(53, 162, 235, 0.5)",
          backgroundColor: "transparent",
          data: optimisticResults.map((r) => r.accumulatedNPV),
          borderDash: [8, 4],
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 2,
          yAxisID: "yAccumulatedNPV",
        },
        {
          type: "line" as const,
          label: `${t("chart.acc_npv")} (${t("periodization.expected_label")})`,
          borderColor: "rgb(53, 162, 235)",
          backgroundColor: "rgba(53, 162, 235, 0.2)",
          data: expectedResults.map((r) => r.accumulatedNPV),
          borderDash: [],
          tension: 0.4,
          pointRadius: 5,
          borderWidth: 3,
          yAxisID: "yAccumulatedNPV",
        },
        {
          type: "line" as const,
          label: `${t("chart.acc_npv")} (${t("periodization.pessimistic_label")})`,
          borderColor: "rgba(53, 162, 235, 0.5)",
          backgroundColor: "transparent",
          data: pessimisticResults.map((r) => r.accumulatedNPV),
          borderDash: [2, 4],
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 2,
          yAxisID: "yAccumulatedNPV",
        },
      ],
    };
  }, [optimisticResults, expectedResults, pessimisticResults, t]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: {
        display: true,
        text: t("chart.title"),
      },
    },
    scales: {
      yNetPoints: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Nettoverdi (BP - SP)",
        },
        grid: { drawOnChartArea: true },
      },
      yAccumulatedNPV: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Akkumulert NPV",
        },
        grid: { drawOnChartArea: false },
      },
      x: {
        title: { display: true, text: "Periode (År)" },
      },
    },
  }), [t]);

  if (
    optimisticResults.length === 0 &&
    expectedResults.length === 0 &&
    pessimisticResults.length === 0
  ) {
    return null;
  }

  return (
    <div style={{ marginTop: "40px" }}>
      <h3>{t("chart.title")} — {t("periodization.all_scenarios_label")}</h3>
      <p>{t("periodization.scenario_financial_chart_description")}</p>
      <div style={{ height: "450px" }}>
        <Chart type={"bar"} data={chartData} options={options as any} />
      </div>
    </div>
  );
};

export const ScenarioNpvChart: React.FC<ScenarioFinancialChartProps> = ({
  optimisticResults,
  expectedResults,
  pessimisticResults,
}) => {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    const base = expectedResults.length > 0 ? expectedResults : optimisticResults;
    if (base.length === 0) return { labels: [], datasets: [] };

    const labels = base.map((r) => `${t("chart.year_label")} ${r.period}`);

    return {
      labels,
      datasets: [
        {
          type: "line" as const,
          label: `${t("chart.acc_npv")} (${t("periodization.optimistic_label")})`,
          borderColor: "rgba(53, 162, 235, 0.5)",
          backgroundColor: "transparent",
          data: optimisticResults.map((r) => r.accumulatedNPV),
          borderDash: [8, 4],
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 2,
        },
        {
          type: "line" as const,
          label: `${t("chart.acc_npv")} (${t("periodization.expected_label")})`,
          borderColor: "rgb(53, 162, 235)",
          backgroundColor: "rgba(53, 162, 235, 0.1)",
          data: expectedResults.map((r) => r.accumulatedNPV),
          borderDash: [],
          tension: 0.4,
          pointRadius: 5,
          borderWidth: 3,
        },
        {
          type: "line" as const,
          label: `${t("chart.acc_npv")} (${t("periodization.pessimistic_label")})`,
          borderColor: "rgba(53, 162, 235, 0.5)",
          backgroundColor: "transparent",
          data: pessimisticResults.map((r) => r.accumulatedNPV),
          borderDash: [2, 4],
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    };
  }, [optimisticResults, expectedResults, pessimisticResults, t]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: {
        display: true,
        text: t("chart.acc_npv"),
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        title: {
          display: true,
          text: "Akkumulert NPV",
        },
      },
      x: {
        title: { display: true, text: "Periode (År)" },
      },
    },
  }), [t]);

  if (
    optimisticResults.length === 0 &&
    expectedResults.length === 0 &&
    pessimisticResults.length === 0
  ) {
    return null;
  }

  return (
    <div style={{ marginTop: "40px" }}>
      <h3>{t("chart.acc_npv")} — {t("periodization.all_scenarios_label")}</h3>
      <div style={{ height: "350px" }}>
        <Chart type={"line"} data={chartData} options={options as any} />
      </div>
    </div>
  );
};
