"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export function ChartRenderer({ figureJson }: { figureJson: string }) {
  let parsed: { data: unknown[]; layout: Record<string, unknown> };
  try {
    parsed = JSON.parse(figureJson);
  } catch {
    return null;
  }

  return (
    <Plot
      data={parsed.data as never}
      layout={{
        ...parsed.layout,
        autosize: true,
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { color: "var(--ink)", family: "var(--font-manrope)" },
        margin: { t: 30, r: 20, l: 40, b: 40 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: "100%", height: "320px" }}
      useResizeHandler
    />
  );
}
