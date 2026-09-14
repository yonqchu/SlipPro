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
  type?: "restock" | "spoilage";
}

export interface DailyOpeningStockMap {
  [date: string]: {
    [itemId: string]: number;
  };
}

export const STORAGE_OPENING_STOCK = "slippro_opening_stocks_v2";
export const STORAGE_RESTOCK_EVENTS = "slippro_restock_events_v2";

export const getTimezone = (): string => {
  try {
    return localStorage.getItem("slippro_timezone") || "Asia/Bangkok";
  } catch (e) {
    return "Asia/Bangkok";
  }
};

export const setTimezone = (tz: string) => {
  try {
    localStorage.setItem("slippro_timezone", tz);
  } catch (e) {}
};

export const getLocalDateString = (d: Date = new Date()): string => {
  const tz = getTimezone();
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: tz, 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  return formatter.format(d); // Returns YYYY-MM-DD
};

export const getLocalTimeString = (d: Date = new Date()): string => {
  const tz = getTimezone();
  const formatter = new Intl.DateTimeFormat('en-GB', { 
    timeZone: tz, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  return formatter.format(d); // Returns HH:mm:ss
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

// Generate Base64 Image string for Donut/Cake chart that renders perfectly in PDF via html2canvas
export const renderCakeChartSVG = (
  slices: CakeChartSlice[],
  totalUnits: number,
  size = 200,
  lang = "th"
): string => {
  const canvas = document.createElement("canvas");
  // Use 2x resolution for crisp PDF output
  canvas.width = size * 2;
  canvas.height = size * 2;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) return "";
  
  ctx.scale(2, 2);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.39; // 78 for 200
  const innerR = size * 0.24; // 48 for 200

  if (slices.length === 0 || totalUnits === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, (outerR + innerR) / 2, 0, 2 * Math.PI);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = outerR - innerR;
    ctx.stroke();
    
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(lang === "th" ? "ไม่มียอดขาย" : "No sales", cx, cy + 5);
    
    return `<img src="${canvas.toDataURL("image/png")}" style="width: ${size}px; height: ${size}px; display: block; margin: 0 auto; max-width: 100%; height: auto;" />`;
  }

  let cumulativeAngle = -Math.PI / 2; // Start from top (12 o'clock)

  slices.forEach((slice) => {
    const angle = (slice.quantity / totalUnits) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    // Handle full circle edge case
    if (slices.length === 1 || slice.quantity === totalUnits) {
      ctx.beginPath();
      ctx.arc(cx, cy, (outerR + innerR) / 2, 0, 2 * Math.PI);
      ctx.strokeStyle = slice.color;
      ctx.lineWidth = outerR - innerR;
      ctx.stroke();
      return;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle, false);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();
    
    ctx.fillStyle = slice.color;
    ctx.fill();
    
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Inner white circle
  ctx.beginPath();
  ctx.arc(cx, cy, innerR - 3, 0, 2 * Math.PI);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Total Units Text
  ctx.fillStyle = "#0f172a";
  ctx.font = "900 20px monospace, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(totalUnits.toString(), cx, cy - 3);

  // Label Text
  ctx.fillStyle = "#64748b";
  ctx.font = "800 9px system-ui";
  // Add simple tracking by spacing out string or rely on canvas text
  // Canvas doesn't easily support letter-spacing natively in all browsers, so we'll just draw it normally
  ctx.fillText(lang === "th" ? "ยอดขายรวม" : "TOTAL SOLD", cx, cy + 14);

  return `<img src="${canvas.toDataURL("image/png")}" style="width: ${size}px; height: ${size}px; display: block; margin: 0 auto; max-width: 100%; height: auto;" />`;
};
