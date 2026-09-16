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

  // Build stock balance rows HTML
  const stockRowsHtml = params.stockRows.map((r) => `
    <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
      <td style="padding: 10px 8px; font-size: 12px; font-weight: 500; color: #0f172a;">
        <span style="display: inline-block; width: 24px; text-align: center;">${r.image}</span> ${r.itemName}
      </td>
      <td style="padding: 10px 8px; text-align: center; font-size: 12px; color: #64748b;">
        ${r.openingStock}
      </td>
      <td style="padding: 10px 8px; text-align: center; font-size: 12px; color: #16a34a; font-weight: 600;">
        ${r.restocked > 0 ? `+${r.restocked}` : `<span style="color: #cbd5e1">—</span>`}
      </td>
      <td style="padding: 10px 8px; text-align: center; font-size: 12px; color: #ef4444; font-weight: 600;">
        ${r.sold > 0 ? `-${r.sold}` : `<span style="color: #cbd5e1">—</span>`}
      </td>
      <td style="padding: 10px 8px; text-align: center; font-size: 12px; color: #f59e0b; font-weight: 600;">
        ${(r.spoiled || 0) > 0 ? `-${r.spoiled}` : `<span style="color: #cbd5e1">—</span>`}
      </td>
      <td style="padding: 10px 8px; text-align: right; font-size: 12px; font-weight: 700; color: #0f172a;">
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
      
      let badgeTextColor = isCash ? "#166534" : isTransfer ? "#6b21a8" : "#9a3412";
      let paymentBadge = "";
      
      if (isCash) {
        paymentBadge = isTh ? "💵 เงินสด" : "Cash";
      } else if (isTransfer) {
        paymentBadge = isTh ? "📲 เงินโอน" : "Transfer";
      } else {
        paymentBadge = isTh ? "🌐 ออนไลน์" : "Online";
      }

      const itemsDesc = ev.items
        .map((it) => `${isTh ? it.nameTH : it.nameEN} <span style="color: #64748b">x${it.quantity}</span>`)
        .join(", ");

      return `
        <div style="padding: 12px; margin-bottom: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 600; color: #475569; font-size: 11px;">${ev.time}</span>
              <span style="color: ${badgeTextColor}; font-weight: 700; font-size: 11px;">
                ${paymentBadge}
              </span>
            </div>
            <span style="font-weight: 700; color: #0f172a; font-size: 13px;">${isOnline ? (isTh ? "ไม่ระบุ" : "N/A") : `+฿${ev.total.toLocaleString()}`}</span>
          </div>
          <div style="color: #334155; font-size: 11px; line-height: 1.5;">
            ${itemsDesc}
          </div>
        </div>
      `;
    } else {
      // Restock or Spoilage event
      const rst = ev.event;
      const isSpoilage = rst.type === "spoilage";
      const badgeText = isTh ? (isSpoilage ? "🗑️ ของเสีย" : "📦 เติมสต็อก") : (isSpoilage ? "🗑️ Spoilage" : "📦 Restock");
      const sign = isSpoilage ? "-" : "+";
      const badgeTextColor = isSpoilage ? "#991b1b" : "#075985";
      const amountColor = isSpoilage ? "#ef4444" : "#0284c7";

      return `
        <div style="padding: 12px; margin-bottom: 8px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 600; color: #475569; font-size: 11px;">${ev.time}</span>
              <span style="color: ${badgeTextColor}; font-weight: 700; font-size: 11px;">
                ${badgeText}
              </span>
            </div>
            <span style="font-weight: 700; color: ${amountColor}; font-size: 12px;">${sign}${rst.amount} ${isTh ? "ชิ้น" : "pcs"}</span>
          </div>
          <div style="color: #475569; font-size: 11px; font-weight: 500;">
            ${rst.image} ${isTh ? rst.itemNameTH : rst.itemNameEN} &nbsp;<span style="color: #cbd5e1">•</span>&nbsp; <span style="color: #94a3b8">${isTh ? (isSpoilage ? "ก่อนหัก" : "ก่อนเติม") : "Prev"}: ${rst.previousStock}</span> &nbsp;→&nbsp; <span style="color: #0f172a">${isTh ? (isSpoilage ? "หลังหัก" : "หลังเติม") : "New"}: ${rst.newStock}</span>
          </div>
        </div>
      `;
    }
  }).join("") : `
    <div style="text-align: center; padding: 32px 16px; color: #94a3b8; font-size: 12px; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
      ${isTh ? "ไม่มีรายการขายหรือการเติมสต็อกในวันนี้" : "No sales or restocks recorded"}
    </div>
  `;

  const element = document.createElement("div");
  element.innerHTML = `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 32px; background-color: #ffffff; color: #0f172a; line-height: 1.5; max-width: 800px; margin: 0 auto;">
      
      <!-- Top Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
        <div style="width: 65%;">
          <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.02em;">${params.shopProfile.name}</h1>
          <p style="font-size: 12px; color: #64748b; margin: 6px 0 0 0; font-weight: 400; line-height: 1.4;">${params.shopProfile.address}</p>
        </div>
        <div style="width: 35%; display: flex; flex-direction: column; align-items: flex-end;">
          <div style="background-color: #eff6ff; color: #2563eb; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
            ${isTh ? "รายงานประจำวัน" : "DAILY REPORT"}
          </div>
          <p style="font-size: 13px; color: #334155; margin: 0; font-weight: 600;">${params.formattedDate}</p>
        </div>
      </div>

      <!-- Financial KPI Breakdown Cards -->
      <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 24px;">
        <!-- Cash Card -->
        <div style="flex: 1; border: 1px solid #e2e8f0; background-color: #ffffff; padding: 16px; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 16px;">💵</span>
            <span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.02em;">
              ${isTh ? "เงินสด" : "Cash"}
            </span>
          </div>
          <p style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; letter-spacing: -0.02em;">฿${params.cashTotal.toLocaleString()}</p>
          <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${params.cashCount} ${isTh ? "รายการ" : "txns"}</span>
        </div>

        <!-- Transfer Card -->
        <div style="flex: 1; border: 1px solid #e2e8f0; background-color: #ffffff; padding: 16px; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 16px;">📲</span>
            <span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.02em;">
              ${isTh ? "เงินโอน" : "Transfer"}
            </span>
          </div>
          <p style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; letter-spacing: -0.02em;">฿${params.transferTotal.toLocaleString()}</p>
          <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${params.transferCount} ${isTh ? "รายการ" : "txns"}</span>
        </div>

        <!-- Online Card -->
        <div style="flex: 1; border: 1px solid #e2e8f0; background-color: #ffffff; padding: 16px; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 16px;">🌐</span>
            <span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.02em;">
              ${isTh ? "ออนไลน์" : "Online"}
            </span>
          </div>
          <p style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; letter-spacing: -0.02em;">
            ${params.onlineCount} <span style="font-size: 14px; font-weight: 500; color: #64748b;">${isTh ? "ออเดอร์" : "orders"}</span>
          </p>
          <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${isTh ? "ไม่นำยอดรวมมาคิด" : "Revenue not added"}</span>
        </div>

        <!-- Total Revenue Card -->
        <div style="flex: 1; background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: #ffffff; padding: 16px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 16px;">💰</span>
            <span style="font-size: 11px; font-weight: 600; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.02em;">
              ${isTh ? "ยอดรวม" : "Total"}
            </span>
          </div>
          <p style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 2px 0; letter-spacing: -0.02em;">฿${params.totalEarnings.toLocaleString()}</p>
          <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${params.totalOrders} ${isTh ? "ยอดขายรวม" : "total sales"}</span>
        </div>
      </div>

      <!-- Single Column: Stock Balance Table -->
      <div style="border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); overflow: hidden;">
        <div style="background-color: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
          <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0;">
            📦 ${isTh ? "สรุปสต็อกสินค้าประจำวัน" : "Daily Stock Balance"}
          </h3>
        </div>
        <div style="padding: 0 16px 16px 16px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.02em;">
                <th style="text-align: left; padding: 12px 8px;">${isTh ? "สินค้า" : "Item"}</th>
                <th style="text-align: center; padding: 12px 8px;">${isTh ? "เริ่ม" : "Open"}</th>
                <th style="text-align: center; padding: 12px 8px;">${isTh ? "เติม" : "Rst"}</th>
                <th style="text-align: center; padding: 12px 8px;">${isTh ? "ขาย" : "Sold"}</th>
                <th style="text-align: center; padding: 12px 8px;">${isTh ? "เสีย" : "Spl"}</th>
                <th style="text-align: right; padding: 12px 8px;">${isTh ? "คงเหลือ" : "End"}</th>
              </tr>
            </thead>
            <tbody>
              ${stockRowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Chronological Activity Timeline (Sales & Restocks) -->
      <div style="border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); overflow: hidden;">
        <div style="background-color: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
          <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0;">
            ⏱️ ${isTh ? "ประวัติการขายและสต็อก (เรียงตามเวลา)" : "Daily Activity Timeline"}
          </h3>
        </div>
        <div style="padding: 16px;">
          ${timelineHtml}
        </div>
      </div>

      <!-- Footer watermark -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;">
        <p style="font-size: 10px; color: #94a3b8; margin: 0; font-weight: 400;">
          ${isTh ? "รายงานนี้สร้างอัตโนมัติโดยระบบ SlipPro" : "Report generated automatically by SlipPro POS"} &nbsp;•&nbsp; ${new Date().toLocaleTimeString(isTh ? 'th-TH' : 'en-US')}
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
