import React, { useMemo } from "react";
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  ChartOptions,
  ChartData,
} from "chart.js";
import { GoalTableItem } from "../../Models";
import { PointsConfig } from "../../Models/PointsConfigModel";

// Registrer komponentene Chart.js trenger
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

type PlotProps = {
  items: GoalTableItem[];
  useValues?: boolean;
  config?: PointsConfig | null;
};

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
// Funksjon for å generere tilfeldige (men stabile) farger
const generateColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  const color = "00000".substring(0, 6 - c.length) + c;
  return `#${color}`;
};

const toRate = (v: unknown, fallback = 1): number => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

export const RiskRewardPlot = ({ items, useValues = false, config }: PlotProps) => {
  const bpRate = useValues && config ? toRate(config.bpMonetaryValue) : 1;
  const spRate = useValues && config ? toRate(config.spMonetaryValue) : 1;
  const bpUnit = useValues && config ? (config.bpCurrency || "pts") : "pts";
  const spUnit = useValues && config ? (config.spCurrency || "pts") : "pts";

  const data: ChartData<"scatter"> = useMemo(() => {
    const datasets = items.map((item) => {
      const properties = (item as any).properties;
      const benefit = (properties?.evaluation_points?.value || 0) * bpRate;

      const M_Cost = item.issueCost?.cost || 1;
      const O_Cost = item.issueCost?.costOptimistic ?? M_Cost;
      const P_Cost = item.issueCost?.costPessimistic ?? M_Cost;
      const expectedCost = calculateExpectedValue(O_Cost, M_Cost, P_Cost) * spRate;

      const M_Time = item.issueCost?.time || 1;
      const O_Time = item.issueCost?.timeOptimistic ?? M_Time;
      const P_Time = item.issueCost?.timePessimistic ?? M_Time;
      const expectedTime = calculateExpectedValue(O_Time, M_Time, P_Time);

      const color = generateColor(item.key || item.id);

      return {
        label: item.key || item.key,
        data: [
          {
            x: expectedCost,
            y: benefit,
            r: 5 + expectedTime / 2,
          },
        ],
        backgroundColor: `${color}B3`,
        borderColor: color,
        borderWidth: 1,
      };
    });

    return { datasets };
  }, [items, bpRate, spRate]);

  const options: ChartOptions<"scatter"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Risk/Reward Scatter Plot",
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            label += `(PERT Cost: ${context.parsed.x.toFixed(2)} ${spUnit}, Benefit: ${context.parsed.y?.toFixed(2)} ${bpUnit})`;
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: `Benefit (${bpUnit})`,
        },
      },
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: `PERT Cost (${spUnit})`,
        },
      },
    },
  };

  return <Scatter options={options} data={data} />;
};
