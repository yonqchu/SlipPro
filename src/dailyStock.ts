export interface RestockEvent {
  id: string;
  itemId: string;
  itemNameTH: string;
  itemNameEN: string;
  image: string;
  amount: number;
  previousStock: number;
  newStock: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  rawTimestamp: number;
}

export interface DailyOpeningStockMap {
  [date: string]: {
    [itemId: string]: number;
  };
}

export const STORAGE_OPENING_STOCK = "slippro_opening_stocks_v2";
export const STORAGE_RESTOCK_EVENTS = "slippro_restock_events_v2";

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getLocalTimeString = (d: Date = new Date()): string => {
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

// Ensure opening stock exists for today or given date
export const ensureOpeningStock = (
  dateStr: string,
  currentItems: { id: string; currentStock: number; trackStock: boolean }[]
): Record<string, number> => {
  let map: DailyOpeningStockMap = {};
  try {
    const saved = localStorage.getItem(STORAGE_OPENING_STOCK);
    if (saved) map = JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse opening stock storage:", e);
  }

  if (!map[dateStr]) {
    map[dateStr] = {};
    currentItems.forEach((item) => {
      map[dateStr][item.id] = item.currentStock;
    });
    try {
      localStorage.setItem(STORAGE_OPENING_STOCK, JSON.stringify(map));
    } catch (e) {}
  }

  return map[dateStr];
};

export const getOpeningStockForDate = (dateStr: string): Record<string, number> => {
  try {
    const saved = localStorage.getItem(STORAGE_OPENING_STOCK);
    if (saved) {
      const map: DailyOpeningStockMap = JSON.parse(saved);
      if (map[dateStr]) return map[dateStr];
    }
  } catch (e) {}
  return {};
};

export const getAllRestockEvents = (): RestockEvent[] => {
  try {
    const saved = localStorage.getItem(STORAGE_RESTOCK_EVENTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

export const addRestockEvent = (
  eventData: Omit<RestockEvent, "id" | "rawTimestamp">
): RestockEvent => {
  const now = Date.now();
  const newEvent: RestockEvent = {
    ...eventData,
    id: `rst_${now}_${Math.random().toString(36).substring(2, 6)}`,
    rawTimestamp: now,
  };

  const current = getAllRestockEvents();
  const updated = [newEvent, ...current];
  try {
    localStorage.setItem(STORAGE_RESTOCK_EVENTS, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save restock events:", e);
  }

  return newEvent;
};

// Pre-defined modern accessible color palette for Donut Cake charts
export const CAKE_PALETTE = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#e11d48", // Rose
];

export interface CakeChartSlice {
  name: string;
  image: string;
  quantity: number;
  revenue: number;
  color: string;
  percentage: number;
}

// Generate SVG string for Donut/Cake chart that renders in both HTML and PDF
export const renderCakeChartSVG = (
  slices: CakeChartSlice[],
  totalUnits: number,
  size = 200
): string => {
  if (slices.length === 0 || totalUnits === 0) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="70" fill="none" stroke="#e2e8f0" stroke-width="28" />
      <text x="100" y="105" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui, sans-serif">No sales</text>
    </svg>`;
  }

  const cx = 100;
  const cy = 100;
  const outerR = 78;
  const innerR = 48;

  let cumulativeAngle = -Math.PI / 2; // Start from top (12 o'clock)

  const paths = slices.map((slice) => {
    const angle = (slice.quantity / totalUnits) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    // Handle full circle edge case
    if (slices.length === 1 || slice.quantity === totalUnits) {
      return `
        <circle cx="${cx}" cy="${cy}" r="${(outerR + innerR) / 2}" fill="none" stroke="${slice.color}" stroke-width="${outerR - innerR}" />
      `;
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

    return `<path d="${d}" fill="${slice.color}" stroke="#ffffff" stroke-width="2" />`;
  });

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 200 200" style="overflow: visible; display: block; margin: 0 auto;">
      <g>
        ${paths.join("")}
      </g>
      <circle cx="${cx}" cy="${cy}" r="${innerR - 3}" fill="#ffffff" />
      <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="20" font-weight="900" fill="#0f172a" font-family="monospace, system-ui">${totalUnits}</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="9" font-weight="800" fill="#64748b" font-family="system-ui" text-transform="uppercase" letter-spacing="1">TOTAL SOLD</text>
    </svg>
  `;
};
