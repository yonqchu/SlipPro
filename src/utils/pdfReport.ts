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

  // Build stock balance rows HTML (Black and White)
  const stockRowsHtml = params.stockRows.map((r) => `
    <tr style="border-bottom: 1px solid #000000;">
      <td style="padding: 8px 6px; font-size: 11px; font-weight: 600; color: #000000;">
        ${r.image} ${r.itemName}
      </td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px; font-family: monospace; color: #000000;">
        ${r.openingStock}
      </td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px; font-family: monospace; color: #000000; font-weight: 700;">
        ${r.restocked > 0 ? `+${r.restocked}` : "—"}
      </td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px; font-family: monospace; color: #000000; font-weight: 700;">
        ${r.sold > 0 ? `-${r.sold}` : "—"}
      </td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px; font-family: monospace; color: #000000; font-weight: 700;">
        ${(r.spoiled || 0) > 0 ? `-${r.spoiled}` : "—"}
      </td>
      <td style="padding: 8px 6px; text-align: right; font-size: 11px; font-family: monospace; color: #000000; font-weight: 800;">
        ${r.closingStock}
      </td>
    </tr>
  `).join("");

  // Build Timeline events HTML (Black and White)
  const timelineHtml = params.timelineEvents.length > 0 ? params.timelineEvents.map((ev, idx) => {
    if (ev.type === "sale") {
      const isCash = ev.paymentMethod === "เงินสด";
      const isTransfer = ev.paymentMethod === "เงินโอน";
      
      let paymentBadge = "";
      if (isCash) {
        paymentBadge = isTh ? "💵 เงินสด" : "Cash";
      } else if (isTransfer) {
        paymentBadge = isTh ? "📲 เงินโอน" : "Transfer";
      } else {
        paymentBadge = isTh ? "🌐 ออนไลน์" : "Online";
      }

      const itemsDesc = ev.items
        .map((it) => `${isTh ? it.nameTH : it.nameEN} x${it.quantity} (฿${it.price * it.quantity})`)
        .join(", ");

      return `
        <div style="padding: 8px 10px; margin-bottom: 6px; background-color: #ffffff; border-left: 3px solid #000000; border: 1px solid #000000; border-radius: 6px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-family: monospace; font-weight: 700; color: #000000; font-size: 10px;">⏰ ${ev.time}</span>
              <span style="background-color: #000000; color: #ffffff; font-weight: 800; font-size: 9px; padding: 2px 6px; border-radius: 4px;">
                ${paymentBadge}
              </span>
            </div>
            <span style="font-family: monospace; font-weight: 800; color: #000000; font-size: 12px;">+฿${ev.total}</span>
          </div>
          <div style="color: #000000; font-size: 10px; line-height: 1.4;">
            ${itemsDesc}
          </div>
        </div>
      `;
    } else {
      // Restock or Spoilage event
      const rst = ev.event;
      const isSpoilage = rst.type === "spoilage";
      const badgeText = isTh ? (isSpoilage ? "🗑️ ของเสีย" : "📦 เติมสต็อกสินค้า") : (isSpoilage ? "🗑️ Spoilage" : "📦 Inventory Restock");
      const sign = isSpoilage ? "-" : "+";

      return `
        <div style="padding: 8px 10px; margin-bottom: 6px; background-color: #ffffff; border: 1px solid #000000; border-radius: 6px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-family: monospace; font-weight: 700; color: #000000; font-size: 10px;">⏰ ${ev.time}</span>
              <span style="background-color: #ffffff; border: 1px solid #000000; color: #000000; font-weight: 800; font-size: 9px; padding: 2px 6px; border-radius: 4px;">
                ${badgeText}
              </span>
            </div>
            <span style="font-family: monospace; font-weight: 800; color: #000000; font-size: 11px;">${sign}${rst.amount} ${isTh ? "ชิ้น" : "pcs"}</span>
          </div>
          <div style="color: #000000; font-size: 10px; margin-top: 3px; font-weight: 600;">
            ${rst.image} ${isTh ? rst.itemNameTH : rst.itemNameEN} &nbsp;•&nbsp; ${isTh ? (isSpoilage ? "ก่อนหัก" : "ก่อนเติม") : "Prev"}: ${rst.previousStock} ➔ ${isTh ? (isSpoilage ? "หลังหัก" : "หลังเติม") : "New"}: ${rst.newStock}
          </div>
        </div>
      `;
    }
  }).join("") : `
    <div style="text-align: center; padding: 18px; color: #000000; font-size: 11px; font-style: italic;">
      ${isTh ? "ไม่มีรายการขายหรือการเติมสต็อกในวันนี้" : "No sales or restocks recorded"}
    </div>
  `;

  const element = document.createElement("div");
  element.innerHTML = `
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 24px; background-color: #ffffff; color: #000000; line-height: 1.4; max-width: 800px; margin: 0 auto;">
      
      <!-- Top Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000000; padding-bottom: 14px; margin-bottom: 18px;">
        <div style="width: 60%;">
          <h1 style="font-size: 22px; font-weight: 900; color: #000000; margin: 0; text-transform: uppercase;">${params.shopProfile.name}</h1>
          <p style="font-size: 11px; color: #000000; margin: 4px 0 0 0; font-weight: 500;">📍 ${params.shopProfile.address}</p>
        </div>
        <div style="width: 38%; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-start;">
          <div style="background-color: #000000; color: #ffffff; padding: 6px 14px; border-radius: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; white-space: nowrap;">
            ${isTh ? "รายงานประจำวัน" : "DAILY REPORT"}
          </div>
          <p style="font-size: 11px; color: #000000; margin: 0; font-weight: 700; font-family: monospace;">${params.formattedDate}</p>
        </div>
      </div>

      <!-- Financial KPI Breakdown Cards -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <!-- Cash Card -->
        <div style="width: 24%; box-sizing: border-box; border: 1px solid #000000; background-color: #ffffff; padding: 12px; border-radius: 10px; text-align: center;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #000000;">
            ${isTh ? "💵 เงินสด" : "💵 Cash Payments"}
          </span>
          <p style="font-size: 20px; font-weight: 900; color: #000000; margin: 4px 0 0 0; font-family: monospace;">฿${params.cashTotal}</p>
          <span style="font-size: 9px; color: #000000; font-weight: 600;">${params.cashCount} ${isTh ? "บิล" : "bills"}</span>
        </div>

        <!-- Transfer Card -->
        <div style="width: 24%; box-sizing: border-box; border: 1px solid #000000; background-color: #ffffff; padding: 12px; border-radius: 10px; text-align: center;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #000000;">
            ${isTh ? "📲 เงินโอน" : "📲 Bank Transfers"}
          </span>
          <p style="font-size: 20px; font-weight: 900; color: #000000; margin: 4px 0 0 0; font-family: monospace;">฿${params.transferTotal}</p>
          <span style="font-size: 9px; color: #000000; font-weight: 600;">${params.transferCount} ${isTh ? "บิล" : "bills"}</span>
        </div>

        <!-- Online Card -->
        <div style="width: 24%; box-sizing: border-box; border: 1px solid #000000; background-color: #ffffff; padding: 12px; border-radius: 10px; text-align: center;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #000000;">
            ${isTh ? "🌐 ออนไลน์" : "🌐 Online Sales"}
          </span>
          <p style="font-size: 20px; font-weight: 900; color: #000000; margin: 4px 0 0 0; font-family: monospace;">${isTh ? "ไม่ระบุ" : "N/A"}</p>
          <span style="font-size: 9px; color: #000000; font-weight: 600;">${params.onlineCount} ${isTh ? "ออเดอร์" : "orders"}</span>
        </div>

        <!-- Total Revenue Card -->
        <div style="width: 24%; box-sizing: border-box; border: 1px solid #000000; background-color: #000000; color: #ffffff; padding: 12px; border-radius: 10px; text-align: center;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #ffffff;">
            ${isTh ? "💰 ยอดรวมทั้งหมด" : "💰 Total Revenue"}
          </span>
          <p style="font-size: 20px; font-weight: 900; color: #ffffff; margin: 4px 0 0 0; font-family: monospace;">฿${params.totalEarnings}</p>
          <span style="font-size: 9px; color: #ffffff; font-weight: 600;">${params.totalOrders} ${isTh ? "บิลรวม" : "orders total"}</span>
        </div>
      </div>

      <!-- Single Column: Stock Balance Table -->
      <div style="width: 100%; box-sizing: border-box; border: 1px solid #000000; border-radius: 12px; padding: 14px; background-color: #ffffff; margin-bottom: 20px;">
        <h3 style="font-size: 12px; font-weight: 800; color: #000000; margin: 0 0 10px 0; text-transform: uppercase;">
          📦 ${isTh ? "สรุปสต็อกสินค้าประจำวัน" : "Daily Stock Balance"}
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1.5px solid #000000; font-size: 9px; font-weight: 800; color: #000000; text-transform: uppercase;">
              <th style="text-align: left; padding: 4px 2px;">${isTh ? "สินค้า" : "Item"}</th>
              <th style="text-align: center; padding: 4px 2px;">${isTh ? "เริ่มวัน" : "Open"}</th>
              <th style="text-align: center; padding: 4px 2px;">${isTh ? "+เติม" : "+Rst"}</th>
              <th style="text-align: center; padding: 4px 2px;">${isTh ? "-ขาย" : "-Sold"}</th>
              <th style="text-align: center; padding: 4px 2px;">${isTh ? "-เสีย" : "-Spl"}</th>
              <th style="text-align: right; padding: 4px 2px;">${isTh ? "คงเหลือ" : "End"}</th>
            </tr>
          </thead>
          <tbody>
            ${stockRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Chronological Activity Timeline (Sales & Restocks) -->
      <div style="border: 1px solid #000000; border-radius: 12px; padding: 14px; background-color: #ffffff; margin-bottom: 18px;">
        <h3 style="font-size: 12px; font-weight: 800; color: #000000; margin: 0 0 10px 0; text-transform: uppercase;">
          ⏱️ ${isTh ? "ประวัติการขายและการเติมสต็อกตามลำดับเวลา" : "Daily Sales & Restock Timeline (Chronological)"}
        </h3>
        <div style="max-height: none;">
          ${timelineHtml}
        </div>
      </div>

      <!-- Footer watermark -->
      <div style="border-top: 1px dashed #000000; padding-top: 10px; text-align: center;">
        <p style="font-size: 9px; color: #000000; margin: 0; font-weight: 500;">
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
