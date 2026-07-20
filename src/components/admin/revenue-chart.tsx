"use client";

import { useId, useState } from "react";
import { formatCurrency } from "@/lib/format";

interface RevenuePoint {
  date: string;
  revenue: number;
}

const WIDTH = 600;
const HEIGHT = 220;
const PADDING_BOTTOM = 24;
const PADDING_TOP = 12;

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const gradientId = useId();

  const max = Math.max(1, ...data.map((d) => d.revenue));
  const barWidth = WIDTH / data.length;
  const plotHeight = HEIGHT - PADDING_BOTTOM - PADDING_TOP;

  const hasAnyRevenue = data.some((d) => d.revenue > 0);

  return (
    <div className="relative">
      {!hasAnyRevenue ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
          Chưa có doanh thu trong khoảng thời gian này.
        </div>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Biểu đồ doanh thu theo ngày">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          <line
            x1="0"
            y1={HEIGHT - PADDING_BOTTOM}
            x2={WIDTH}
            y2={HEIGHT - PADDING_BOTTOM}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {data.map((point, i) => {
            const barHeight = (point.revenue / max) * plotHeight;
            const x = i * barWidth + 2;
            const w = Math.max(0, barWidth - 4);
            const y = HEIGHT - PADDING_BOTTOM - barHeight;
            const isHovered = hovered === i;
            const showLabel = i === data.length - 1 || isHovered;

            return (
              <g key={point.date}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={Math.max(barHeight, 1)}
                  rx={4}
                  fill={`url(#${gradientId})`}
                  opacity={isHovered ? 1 : 0.85}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
                {showLabel && point.revenue > 0 ? (
                  <text
                    x={x + w / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="fill-foreground text-[9px]"
                  >
                    {formatCurrency(point.revenue)}
                  </text>
                ) : null}
                {i % Math.ceil(data.length / 7) === 0 ? (
                  <text
                    x={x + w / 2}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[9px]"
                  >
                    {point.date.slice(5)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
