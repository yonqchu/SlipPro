import React from "react";
import { CAKE_PALETTE, CakeChartSlice } from "../dailyStock";
import { PieChart, TrendingUp } from "lucide-react";

interface CakeChartProps {
  sales?: {
    name: string;
    image: string;
    quantity: number;
    total: number;
  }[];
  slices?: CakeChartSlice[];
  lang: "en" | "th";
  currencySymbol?: string;
  totalLabel?: string;
  title?: string;
}

export const CakeChart: React.FC<CakeChartProps> = ({
  sales,
  slices: propSlices,
  lang,
  currencySymbol = "฿",
  totalLabel,
  title,
}) => {
  const isTh = lang === "th";

  let slices: CakeChartSlice[] = [];
  let totalUnits = 0;

  if (Array.isArray(propSlices) && propSlices.length > 0) {
    slices = propSlices;
    totalUnits = slices.reduce((acc, curr) => acc + (curr?.quantity || 0), 0);
  } else if (Array.isArray(sales) && sales.length > 0) {
    totalUnits = sales.reduce((acc, curr) => acc + (curr?.quantity || 0), 0);
    const sorted = [...sales].sort((a, b) => (b?.quantity || 0) - (a?.quantity || 0));
    slices = sorted.map((item, idx) => ({
      name: item.name,
      image: item.image,
      quantity: item.quantity || 0,
      revenue: item.total || 0,
      color: CAKE_PALETTE[idx % CAKE_PALETTE.length],
      percentage: totalUnits > 0 ? Math.round(((item.quantity || 0) / totalUnits) * 100) : 0,
    }));
  }

  if (slices.length === 0 || totalUnits === 0) {
    return (
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 text-center">
        <PieChart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-400 font-medium italic">
          {isTh ? "ยังไม่มีรายการขายสำหรับวันที่เลือก" : "No sales data recorded for this date"}
        </p>
      </div>
    );
  }

  const cx = 100;
  const cy = 100;
  const outerR = 76;
  const innerR = 48;

  let cumulativeAngle = -Math.PI / 2;

  const pathElements = slices.map((slice, idx) => {
    const angle = (slice.quantity / totalUnits) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    if (slices.length === 1 || slice.quantity === totalUnits) {
      return (
        <circle
          key={idx}
          cx={cx}
          cy={cy}
          r={(outerR + innerR) / 2}
          fill="none"
          stroke={slice.color}
          strokeWidth={outerR - innerR}
        />
      );
    }

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);

    const x3 = cx + innerR * Math.cos(endAngle);
    const y3 = cy + innerR * Math.sin(endAngle);
    const x4 = cx + innerR * Math.cos(startAngle);
    const y4 = cy + innerR * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const d = [
      `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
      "Z",
    ].join(" ");

    return (
      <path
        key={idx}
        d={d}
        fill={slice.color}
        stroke="#ffffff"
        strokeWidth="2.5"
        className="transition-all hover:opacity-85"
      />
    );
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-2.5xl p-5 shadow-xs space-y-4">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>{title || (isTh ? "กราฟสินค้าขายดีประจำวัน" : "Daily Best Sellers Chart")}</span>
        </h4>
        <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {totalUnits} {isTh ? "ชิ้นที่ขายได้" : "Units"}
        </span>
      </div>

      {/* SVG Donut */}
      <div className="flex justify-center py-2">
        <svg
          width="190"
          height="190"
          viewBox="0 0 200 200"
          className="overflow-visible drop-shadow-xs select-none"
        >
          <g>{pathElements}</g>
          <circle cx={cx} cy={cy} r={innerR - 2} fill="#ffffff" />
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            fontSize="22"
            fontWeight="900"
            fill="#0f172a"
            className="font-mono font-black"
          >
            {totalUnits}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fontSize="9"
            fontWeight="800"
            fill="#64748b"
            letterSpacing="0.05em"
          >
            {totalLabel || (isTh ? "ชิ้นรวม" : "TOTAL UNITS")}
          </text>
        </svg>
      </div>

      {/* Legend list */}
      <div className="space-y-2 pt-1 divide-y divide-slate-100">
        {slices.map((slice, idx) => (
          <div
            key={idx}
            className="pt-2 flex items-center justify-between text-xs first:pt-0"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-base">{slice.image}</span>
              <span className="font-bold text-slate-800 truncate max-w-[130px]">
                {slice.name}
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono shrink-0">
              <div className="text-right">
                <span className="font-black text-slate-900">
                  {slice.quantity} {isTh ? "ชิ้น" : "pcs"}
                </span>
                <span className="text-[10px] text-slate-400 font-bold ml-1">
                  ({slice.percentage}%)
                </span>
              </div>
              <span className="font-bold text-emerald-600 text-xs w-16 text-right">
                {currencySymbol}{slice.revenue}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
