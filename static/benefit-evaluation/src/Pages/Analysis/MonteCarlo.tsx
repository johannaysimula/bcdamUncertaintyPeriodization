import React from "react";

// ---------- Helpers ----------
type SimulationResult = {
  run: number;
  benefit: number;
  time: number;
  cost: number;
};

const generateFakeSimulations = (n: number): SimulationResult[] => {
  return Array.from({ length: n }, (_, i) => ({
    run: i + 1,
    benefit: 5 + Math.random() * 10, // 5–15 MNOK
    time: 10 + Math.random() * 10, // 10–20 months
    cost: 2 + Math.random() * 3, // 2–5 MNOK
  }));
};

const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
const percentile = (arr: number[], p: number) => {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.floor((p / 100) * sorted.length);
  return sorted[index];
};

// ---------- Mini “Card” component ----------
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={`bg-white rounded-xl shadow-sm border p-4 ${className}`}>
    {children}
  </div>
);

// ---------- Main page ----------
const AnalysisPage: React.FC = () => {
  const simulations = generateFakeSimulations(500);
  const benefits = simulations.map((s) => s.benefit);
  const times = simulations.map((s) => s.time);
  const costs = simulations.map((s) => s.cost);

  const summary = [
    {
      title: "Expected Benefit (MNOK)",
      mean: mean(benefits),
      p5: percentile(benefits, 5),
      p95: percentile(benefits, 95),
    },
    {
      title: "Estimated Time (months)",
      mean: mean(times),
      p5: percentile(times, 5),
      p95: percentile(times, 95),
    },
    {
      title: "Total Cost (MNOK)",
      mean: mean(costs),
      p5: percentile(costs, 5),
      p95: percentile(costs, 95),
    },
  ];

  return (
    <div className="p-6 space-y-8 text-gray-800">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Monte Carlo Analysis</h1>
        <p className="text-gray-600 max-w-2xl">
          This page illustrates simulated outcomes for project benefit, time,
          and cost using a Monte Carlo approach. The results are randomly
          generated to show uncertainty ranges and potential outcomes.
        </p>
      </div>

      {/* Summary Section with Gray Background */}
      <div className="bg-gray-50 p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {summary.map((item) => (
            <Card key={item.title} className="flex-1">
              <h3 className="text-sm text-gray-500">{item.title}</h3>
              <p className="text-2xl font-semibold mt-1">
                {item.mean.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400">
                P5: {item.p5.toFixed(1)} | P95: {item.p95.toFixed(1)}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Simulation Table */}
      <Card>
        <h2 className="text-lg font-semibold mb-2">
          Sample of Simulation Runs
        </h2>
        <table className="min-w-full text-sm text-left border">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-2">Run</th>
              <th className="p-2">Benefit (MNOK)</th>
              <th className="p-2">Time (months)</th>
              <th className="p-2">Cost (MNOK)</th>
            </tr>
          </thead>
          <tbody>
            {simulations.slice(0, 10).map((s) => (
              <tr key={s.run} className="border-b hover:bg-gray-50">
                <td className="p-2">{s.run}</td>
                <td className="p-2">{s.benefit.toFixed(2)}</td>
                <td className="p-2">{s.time.toFixed(2)}</td>
                <td className="p-2">{s.cost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-2">
          Showing 10 out of {simulations.length} simulation runs.
        </p>
      </Card>

      {/* Interpretation */}
      <Card>
        <h2 className="text-lg font-semibold mb-2">Interpretation</h2>
        <p>
          The Monte Carlo results suggest a positive expected net benefit but
          with notable uncertainty in both time and cost. The percentile range
          (P5–P95) helps identify optimistic and pessimistic scenarios.
          Sensitivity analysis could show which variables most affect the
          outcome.
        </p>
      </Card>
    </div>
  );
};

export default AnalysisPage;
