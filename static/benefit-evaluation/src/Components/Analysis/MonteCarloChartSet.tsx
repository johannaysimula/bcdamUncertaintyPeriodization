import React, { useMemo } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Stack, Flex, Box, xcss } from "@atlaskit/primitives";

// Registrer alt Chart.js trenger
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type ChartProps = {
  data: number[]; // Rådata (f.eks. 10 000 resultater)
  title: string; // F.eks. "Total Cost"
};

// Funksjon for å gruppere data i "bins" for histogrammet
const createHistogramData = (data: number[], binCount: number) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / binCount;

  const labels: string[] = [];
  const bins: number[] = Array(binCount).fill(0);

  // Lag labels (f.eks. "1.50 - 1.55")
  for (let i = 0; i < binCount; i++) {
    const binStart = (min + i * binWidth).toFixed(2);
    const binEnd = (min + (i + 1) * binWidth).toFixed(2);
    labels.push(`${binStart} - ${binEnd}`);
  }

  // Plasser hvert datapunkt i riktig "bin"
  data.forEach((value) => {
    const binIndex = Math.min(
      Math.floor((value - min) / binWidth),
      binCount - 1
    );
    // Håndter "max"-verdien
    if (value === max) {
      bins[binCount - 1]++;
    } else {
      bins[binIndex]++;
    }
  });

  return { labels, bins };
};

// Funksjon for å lage kumulativ data (CDF) JO: Bruker ikke!
const createCumulativeData = (data: number[]) => {
  const sortedData = [...data].sort((a, b) => a - b);
  const totalPoints = sortedData.length;

  const labels: string[] = [];
  const cumulativePercent: number[] = [];

  // Vi "sampler" dataen for å unngå 10 000 punkter på grafen
  const sampleRate = Math.max(Math.floor(totalPoints / 100), 1); // Ca 100 punkter

  for (let i = 0; i < totalPoints; i += sampleRate) {
    labels.push(sortedData[i].toFixed(2)); // X-akse: Verdien
    cumulativePercent.push((i / totalPoints) * 100); // Y-akse: Prosent
  }

  // Sørg for at 100% er med
  labels.push(sortedData[totalPoints - 1].toFixed(2));
  cumulativePercent.push(100);

  return { labels, cumulativePercent };
};

export const MonteCarloChartSet = ({ data, title }: ChartProps) => {
  // Prosesser data for Histogram (PDF)
  const histogram = useMemo(() => {
    const { labels, bins } = createHistogramData(data, 100); // 50 grupper JO: Nå 100
    return {
      labels,
      datasets: [
        {
          label: `Frequency of ${title}`,
          data: bins,
          backgroundColor: "rgba(0, 101, 255, 0.6)", // Atlassian Blå
        },
      ],
    };
  }, [data, title]);

  // Prosesser data for Kumulativ (CDF) JO: ENDRET
  const cumulative = useMemo(() => {
    const cumulativesum = ((sum: number) => (value: number) => sum += value)(0);
    const { labels, bins } = createHistogramData(data, 100); // 100 grupper
    //onsole.log(bins);
    const percentbins = bins.map((x:number)=>x/100);
    //console.log(percentbins);
    const cumulativebins = percentbins.map(cumulativesum);
    //console.log(cumulativebins);
    return {
      labels,
      datasets: [
        {
          label: `Cumulative % of ${title}`,
          data: cumulativebins,
          fill: false,
          borderColor: "rgb(255, 139, 0)", // Atlassian Oransje
          tension: 0.1,
        },
      ],
    };
  }, [data, title]);

  // Options for Histogram
  const pdfOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Probability Distribution (PDF) - ${title}`,
      },
    },
    scales: {
      y: { title: { display: true, text: "Frequency (Out of 10,000)" } },
      x: { title: { display: true, text: "Simulated Value" } },
    },
  };

  // Options for Kumulativ
  const cdfOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Cumulative Distribution (CDF) - ${title}`,
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            `There is a ${context.parsed.y?.toFixed(0)}% chance the result is ${
              context.parsed.x
            } or less.`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: "Cumulative Probability (%)" },
      },
      x: { title: { display: true, text: "Simulated Value" } },
    },
  };

  return (
    <Flex
      direction="row"
      xcss={xcss({ marginTop: "space.400", gap: "space.200" })}
    >
      {/* Graf 1: Histogram (PDF) */}
      <Box
        xcss={xcss({
          padding: "space.200",
          backgroundColor: "color.background.neutral.subtle",
          borderRadius: "border.radius.100",
          flexBasis: "50%", // Tar 50% av bredden
        })}
      >
        <Bar options={pdfOptions} data={histogram} />
      </Box>

      {/* Graf 2: Kumulativ (CDF) */}
      <Box
        xcss={xcss({
          padding: "space.200",
          backgroundColor: "color.background.neutral.subtle",
          borderRadius: "border.radius.100",
          flexBasis: "50%", // Tar 50% av bredden
        })}
      >
        <Line options={cdfOptions} data={cumulative} />
      </Box>
    </Flex>
  );
};
