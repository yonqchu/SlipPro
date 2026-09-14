import html2pdf from "html2pdf.js";
import { renderCakeChartSVG, CakeChartSlice } from "../dailyStock";
import { DailyStockRow } from "../components/DailyStockTable";
import { TimelineEvent } from "../components/DailyTimeline";

export interface GeneratePdfParams {
  dateStr: string; // YYYY-MM-DD
  formattedDate: string;
  shopProfile: {
    name: string;
    address: string;
  };
  cashTotal: number;
  cashCount: number;
  transferTotal: number;
  transferCount: number;
  onlineTotal: number;
  onlineCount: number;
  totalEarnings: number;
  totalOrders: number;
  totalRestockedUnits: number;
  totalRestockEvents: number;
  cakeSlices: CakeChartSlice[];
  totalSoldUnits: number;
  stockRows: DailyStockRow[];
  timelineEvents: TimelineEvent[];
  customShoppingList?: string[];
  menuItems?: any[];
  lang: "en" | "th";
}

export const generateDailyPdfReport = async (params: GeneratePdfParams): Promise<void> => {
  const isTh = params.lang === "th";

  // Render Cake chart SVG
  const cakeSvg = renderCakeChartSVG(params.cakeSlices, params.totalSoldUnits, 180, params.lang);

  // Build stock balance rows HTML
  const stockRowsHtml = params.stockRows.map((r) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 8px 6px; font-size: 11px; font-weight: 600; color: #1e293b;">
        ${r.image} ${r.itemName}
      </td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px; font-family: monospace; color: #475569;">
        ${r.openingStock}
      </td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px; font-family: monospace; color: #d97706; font-weight: 700;">
        ${r.restocked > 0 ? `+${r.restocked}` : "—"}
      </td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px; font-family: monospace; color: #e11d48; font-weight: 700;">
        ${r.sold > 0 ? `-${r.sold}` : "—"}
      </td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px; font-family: monospace; color: #9f1239; font-weight: 700;">
        ${(r.spoiled || 0) > 0 ? `-${r.spoiled}` : "—"}
      </td>
      <td style="padding: 8px 6px; text-align: right; font-size: 11px; font-family: monospace; color: #0f172a; font-weight: 800;">
        ${r.closingStock}
      </td>
    </tr>
  `).join("");

  // Build Timeline events HTML
  const timelineHtml = params.timelineEvents.length > 0 ? params.timelineEvents.map((ev, idx) => {
    if (ev.type === "sale") {
      const isCash = ev.paymentMethod === "เงินสด";
      const isTransfer = ev.paymentMethod === "เงินโอน";
      const isOnline = ev.paymentMethod === "ออนไลน์";
      
      let paymentBadge = "";
      let badgeBg = "";
      let badgeColor = "";
      let borderColor = "";

      if (isCash) {
        paymentBadge = isTh ? "💵 เงินสด" : "Cash";
        badgeBg = "#ecfdf5";
        badgeColor = "#065f46";
        borderColor = "#10b981";
      } else if (isTransfer) {
        paymentBadge = isTh ? "📲 เงินโอน" : "Transfer";
        badgeBg = "#eff6ff";
        badgeColor = "#1e40af";
        borderColor = "#3b82f6";
      } else {
        paymentBadge = isTh ? "🌐 ออนไลน์" : "Online";
        badgeBg = "#f5f3ff";
        badgeColor = "#5b21b6";
        borderColor = "#8b5cf6";
      }

      const itemsDesc = ev.items
        .map((it) => `${isTh ? it.nameTH : it.nameEN} x${it.quantity} (฿${it.price * it.quantity})`)
        .join(", ");

      return `
        <div style="padding: 8px 10px; margin-bottom: 6px; background-color: #f8fafc; border-left: 3px solid ${borderColor}; border-radius: 6px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-family: monospace; font-weight: 700; color: #64748b; font-size: 10px;">⏰ ${ev.time}</span>
              <span style="background-color: ${badgeBg}; color: ${badgeColor}; font-weight: 800; font-size: 9px; padding: 2px 6px; border-radius: 4px;">
                ${paymentBadge}
              </span>
            </div>
            <span style="font-family: monospace; font-weight: 800; color: #059669; font-size: 12px;">+฿${ev.total}</span>
          </div>
          <div style="color: #334155; font-size: 10px; line-height: 1.4;">
            ${itemsDesc}
          </div>
        </div>
      `;
    } else {
      // Restock or Spoilage event
      const rst = ev.event;
      const isSpoilage = rst.type === "spoilage";
      const bgColor = isSpoilage ? "#fff1f2" : "#fffbeb";
      const borderColor = isSpoilage ? "#f43f5e" : "#f59e0b";
      const badgeBg = isSpoilage ? "#ffe4e6" : "#fef3c7";
      const textColor = isSpoilage ? "#be123c" : "#b45309";
      const badgeTextColor = isSpoilage ? "#9f1239" : "#92400e";
      const badgeText = isTh ? (isSpoilage ? "🗑️ ของเสีย" : "📦 เติมสต็อกสินค้า") : (isSpoilage ? "🗑️ Spoilage" : "📦 Inventory Restock");
      const sign = isSpoilage ? "-" : "+";

      return `
        <div style="padding: 8px 10px; margin-bottom: 6px; background-color: ${bgColor}; border-left: 3px solid ${borderColor}; border-radius: 6px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-family: monospace; font-weight: 700; color: ${textColor}; font-size: 10px;">⏰ ${ev.time}</span>
              <span style="background-color: ${badgeBg}; color: ${badgeTextColor}; font-weight: 800; font-size: 9px; padding: 2px 6px; border-radius: 4px;">
                ${badgeText}
              </span>
            </div>
            <span style="font-family: monospace; font-weight: 800; color: ${textColor}; font-size: 11px;">${sign}${rst.amount} ${isTh ? "ชิ้น" : "pcs"}</span>
          </div>
          <div style="color: ${textColor}; font-size: 10px; margin-top: 3px; font-weight: 600;">
            ${rst.image} ${isTh ? rst.itemNameTH : rst.itemNameEN} &nbsp;•&nbsp; ${isTh ? (isSpoilage ? "ก่อนหัก" : "ก่อนเติม") : "Prev"}: ${rst.previousStock} ➔ ${isTh ? (isSpoilage ? "หลังหัก" : "หลังเติม") : "New"}: ${rst.newStock}
          </div>
        </div>
      `;
    }
  }).join("") : `
    <div style="text-align: center; padding: 18px; color: #94a3b8; font-size: 11px; font-style: italic;">
      ${isTh ? "ไม่มีรายการขายหรือการเติมสต็อกในวันนี้" : "No sales or restocks recorded"}
    </div>
  `;

  // Best seller slices legend HTML
  const cakeLegendHtml = params.cakeSlices.map((s) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid #f1f5f9; font-size: 10px;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${s.color};"></span>
        <span style="font-weight: 600; color: #1e293b;">${s.image} ${s.name}</span>
      </div>
      <div style="font-family: monospace; text-align: right;">
        <span style="font-weight: 700; color: #0f172a;">${s.quantity} ${isTh ? "ชิ้น" : "pcs"} (${s.percentage}%)</span>
        <span style="color: #059669; font-weight: 700; margin-left: 8px;">฿${s.revenue}</span>
      </div>
    </div>
  `).join("");

  const element = document.createElement("div");
  element.innerHTML = `
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 24px; background-color: #ffffff; color: #0f172a; line-height: 1.4; max-width: 800px; margin: 0 auto;">
      
      <!-- Top Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 18px;">
        <div style="width: 60%;">
          <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase;">${params.shopProfile.name}</h1>
          <p style="font-size: 11px; color: #475569; margin: 4px 0 0 0; font-weight: 500;">📍 ${params.shopProfile.address}</p>
        </div>
        <div style="width: 38%; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-start;">
          <div style="background-color: #0f172a; color: #ffffff; padding: 6px 14px; border-radius: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; white-space: nowrap;">
            ${isTh ? "รายงานประจำวัน" : "DAILY REPORT"}
          </div>
          <p style="font-size: 11px; color: #334155; margin: 0; font-weight: 700; font-family: monospace;">${params.formattedDate}</p>
        </div>
      </div>

      <!-- Financial KPI Breakdown Cards -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <!-- Cash Card -->
        <div style="width: 24%; box-sizing: border-box; border: 1px solid #d1fae5; background-color: #f0fdf4; padding: 12px; border-radius: 10px; text-align: center;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #065f46;">
            ${isTh ? "💵 เงินสด" : "💵 Cash Payments"}
          </span>
          <p style="font-size: 20px; font-weight: 900; color: #059669; margin: 4px 0 0 0; font-family: monospace;">฿${params.cashTotal}</p>
          <span style="font-size: 9px; color: #047857; font-weight: 600;">${params.cashCount} ${isTh ? "บิล" : "bills"}</span>
        </div>

        <!-- Transfer Card -->
        <div style="width: 24%; box-sizing: border-box; border: 1px solid #dbeafe; background-color: #eff6ff; padding: 12px; border-radius: 10px; text-align: center;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #1e40af;">
            ${isTh ? "📲 เงินโอน" : "📲 Bank Transfers"}
          </span>
          <p style="font-size: 20px; font-weight: 900; color: #2563eb; margin: 4px 0 0 0; font-family: monospace;">฿${params.transferTotal}</p>
          <span style="font-size: 9px; color: #1d4ed8; font-weight: 600;">${params.transferCount} ${isTh ? "บิล" : "bills"}</span>
        </div>

        <!-- Online Card -->
        <div style="width: 24%; box-sizing: border-box; border: 1px solid #ede9fe; background-color: #f5f3ff; padding: 12px; border-radius: 10px; text-align: center;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #5b21b6;">
            ${isTh ? "🌐 ออนไลน์" : "🌐 Online Sales"}
          </span>
          <p style="font-size: 20px; font-weight: 900; color: #7c3aed; margin: 4px 0 0 0; font-family: monospace;">฿${params.onlineTotal}</p>
          <span style="font-size: 9px; color: #6d28d9; font-weight: 600;">${params.onlineCount} ${isTh ? "บิล" : "bills"}</span>
        </div>

        <!-- Total Revenue Card -->
        <div style="width: 24%; box-sizing: border-box; border: 1px solid #0f172a; background-color: #0f172a; color: #ffffff; padding: 12px; border-radius: 10px; text-align: center;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #cbd5e1;">
            ${isTh ? "💰 ยอดรวมทั้งหมด" : "💰 Total Revenue"}
          </span>
          <p style="font-size: 20px; font-weight: 900; color: #34d399; margin: 4px 0 0 0; font-family: monospace;">฿${params.totalEarnings}</p>
          <span style="font-size: 9px; color: #94a3b8; font-weight: 600;">${params.totalOrders} ${isTh ? "บิลรวม" : "orders total"}</span>
        </div>
      </div>

      <!-- Two Column: Cake Chart & Stock Balance Table -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <!-- Left: Donut Chart -->
        <div style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background-color: #ffffff;">
          <h3 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; text-transform: uppercase;">
            🍰 ${isTh ? "กราฟสินค้าขายดีประจำวัน" : "Best Sellers Cake Chart"}
          </h3>
          <div style="text-align: center; margin-bottom: 8px;">
            ${cakeSvg}
          </div>
          <div>
            ${cakeLegendHtml}
          </div>
        </div>

        <!-- Right: Daily Stock Movements -->
        <div style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background-color: #ffffff;">
          <h3 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; text-transform: uppercase;">
            📦 ${isTh ? "สรุปสต็อกสินค้าประจำวัน" : "Daily Stock Balance"}
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1.5px solid #cbd5e1; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">
                <th style="text-align: left; padding: 4px 2px;">${isTh ? "สินค้า" : "Item"}</th>
                <th style="text-align: center; padding: 4px 2px;">${isTh ? "เริ่มวัน" : "Open"}</th>
                <th style="text-align: center; padding: 4px 2px; color: #d97706;">${isTh ? "+เติม" : "+Rst"}</th>
                <th style="text-align: center; padding: 4px 2px; color: #e11d48;">${isTh ? "-ขาย" : "-Sold"}</th>
                <th style="text-align: center; padding: 4px 2px; color: #9f1239;">${isTh ? "-เสีย" : "-Spl"}</th>
                <th style="text-align: right; padding: 4px 2px; color: #0f172a;">${isTh ? "คงเหลือ" : "End"}</th>
              </tr>
            </thead>
            <tbody>
              ${stockRowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Chronological Activity Timeline (Sales & Restocks) -->
      <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background-color: #ffffff; margin-bottom: 18px;">
        <h3 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; text-transform: uppercase;">
          ⏱️ ${isTh ? "ประวัติการขายและการเติมสต็อกตามลำดับเวลา" : "Daily Sales & Restock Timeline (Chronological)"}
        </h3>
        <div style="max-height: none;">
          ${timelineHtml}
        </div>
      </div>

      <!-- Footer watermark -->
      <div style="border-top: 1px dashed #cbd5e1; padding-top: 10px; text-align: center;">
        <p style="font-size: 9px; color: #94a3b8; margin: 0; font-weight: 500;">
          ${isTh ? "สร้างรายงานอัตโนมัติโดยระบบ SlipPro" : "Report generated automatically by SlipPro POS"} • ${new Date().toLocaleTimeString(isTh ? 'th-TH' : 'en-US')}
        </p>
      </div>

    </div>
  `;

  const opt = {
    margin: [0.3, 0.3, 0.3, 0.3] as [number, number, number, number],
    filename: `slippro-daily-report-${params.dateStr}.pdf`,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: "in" as const, format: "letter" as const, orientation: "portrait" as const },
  };

  await html2pdf().from(element).set(opt).save();
};
