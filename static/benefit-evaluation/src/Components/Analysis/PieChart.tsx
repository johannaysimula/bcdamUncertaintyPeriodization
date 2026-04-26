import React, { useMemo } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  ChartData,
  ChartOptions,
} from "chart.js";
import { GoalTableItem } from "../../Models";
import { PointsConfig } from "../../Models/PointsConfigModel";
import { Box } from "@atlaskit/primitives";

// Registrer komponentene Chart.js trenger
ChartJS.register(ArcElement, Tooltip, Legend, Title);

type PlotProps = {
  items: GoalTableItem[];
  useValues?: boolean;
  config?: PointsConfig | null;
};

// --- NY FIKS: Definert fargepalett ---
// En liste med gode, distinkte farger fra Atlassian-designsystemet
const ATLASSIAN_COLORS = [
  "#0065FF", // Blå
  "#36B37E", // Grønn
  "#FFAB00", // Gul
  "#FF5630", // Rød
  "#6554C0", // Lilla
  "#00B8D9", // Cyan
  "#FF8B00", // Oransje
  "#42526E", // Mørkegrå
];
// --- SLUTT PÅ FIKS ---

const toRate = (v: unknown, fallback = 1): number => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

export const BenefitPieChart = ({ items, useValues = false, config }: PlotProps) => {
  const bpRate = useValues && config ? toRate(config.bpMonetaryValue) : 1;
  const bpUnit = useValues && config ? (config.bpCurrency || "pts") : "pts";

  const data: ChartData<"pie"> = useMemo(() => {
    const labels: string[] = [];
    const dataPoints: number[] = [];
    const backgroundColors: string[] = [];
    const borderColors: string[] = [];

    items.forEach((item, index) => {
      const key = item.key || "Unknown";
      const properties = (item as any).properties;
      const benefit = (properties?.evaluation_points?.value || 0) * bpRate;

      // Sorter data fra størst til minst for et penere diagram
      // (Dette er valgfritt, men anbefalt)
      // Vi hopper over sortering foreløpig for å holde det enkelt

      labels.push(key);
      dataPoints.push(benefit);

      // --- FIKS: Bruk paletten i stedet for 'generateColor' ---
      // Bruk modulo (%) for å loope fargene hvis vi har flere Epics enn farger
      const color = ATLASSIAN_COLORS[index % ATLASSIAN_COLORS.length];
      backgroundColors.push(`${color}B3`); // 70% gjennomsiktig
      borderColors.push(color);
      // --- SLUTT PÅ FIKS ---
    });

    return {
      labels,
      datasets: [
        {
          label: `Benefit (${bpUnit})`,
          data: dataPoints,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };
  }, [items, bpRate, bpUnit]);

  const options: ChartOptions<"pie"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Benefit Contribution per Epic (${bpUnit})`,
        font: { size: 16 },
      },
    },
  };

  return (
    <Box>
      <Pie options={options} data={data} />
    </Box>
  );
};
