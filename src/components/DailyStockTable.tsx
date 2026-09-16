import React from "react";
import { Boxes, ArrowUpRight, ArrowDownRight, PackageCheck } from "lucide-react";

export interface DailyStockRow {
  itemId: string;
  itemName: string;
  image: string;
  openingStock: number;
  restocked: number;
  sold: number;
  closingStock: number;
  spoiled?: number;
}

interface DailyStockTableProps {
  rows?: DailyStockRow[];
  lang: "en" | "th";
  onQuickRestock?: (itemId: string) => void;
  onQuickRestockItem?: (itemId: string) => void;
}

export const DailyStockTable: React.FC<DailyStockTableProps> = ({
  rows = [],
  lang,
  onQuickRestock,
  onQuickRestockItem,
}) => {
  const isTh = lang === "th";
  const safeRows = Array.isArray(rows) ? rows : [];
  const handleRestock = onQuickRestock || onQuickRestockItem;

  return (
    <div className="bg-white px-5 py-4 space-y-3 border-b border-slate-100">
      <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Boxes className="w-4 h-4 text-amber-600" />
          <span>{isTh ? "ความเคลื่อนไหวสต็อกประจำวัน" : "Daily Stock Balance"}</span>
        </h4>
        <span className="text-[10px] font-bold text-slate-400">
          {safeRows.length} {isTh ? "รายการ" : "items"}
        </span>
      </div>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-left text-xs border-collapse min-w-[340px]">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
              <th className="py-2 px-2 text-left">{isTh ? "สินค้า" : "Item"}</th>
              <th className="py-2 px-1 text-center" title={isTh ? "ยอดเริ่มเปิดร้าน" : "Beginning of day"}>
                {isTh ? "เริ่มวัน" : "Open"}
              </th>
              <th className="py-2 px-1 text-center text-amber-600" title={isTh ? "เติมระหว่างวัน" : "Restocked"}>
                {isTh ? "+เติม" : "+Restock"}
              </th>
              <th className="py-2 px-1 text-center text-rose-600" title={isTh ? "ขายได้" : "Sold"}>
                {isTh ? "-ขาย" : "-Sold"}
              </th>
              <th className="py-2 px-1 text-center text-rose-800" title={isTh ? "ของเสีย/ทิ้ง" : "Spoiled"}>
                {isTh ? "-เสีย" : "-Spoil"}
              </th>
              <th className="py-2 px-2 text-right text-emerald-600 font-black" title={isTh ? "คงเหลือ" : "Remaining"}>
                {isTh ? "คงเหลือ" : "End"}
              </th>
              {handleRestock && <th className="py-2 px-1 text-center w-8"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {safeRows.map((row) => (
              <tr key={row.itemId} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2 px-2 flex items-center gap-1.5 font-sans">
                  <span className="text-base shrink-0">{row.image}</span>
                  <span className="font-bold text-slate-800 truncate max-w-[110px] text-xs">
                    {row.itemName}
                  </span>
                </td>
                <td className="py-2 px-1 text-center font-bold text-slate-600">
                  {row.openingStock}
                </td>
                <td className="py-2 px-1 text-center font-bold text-amber-600">
                  {row.restocked > 0 ? `+${row.restocked}` : "—"}
                </td>
                <td className="py-2 px-1 text-center font-bold text-rose-600">
                  {row.sold > 0 ? `-${row.sold}` : "—"}
                </td>
                <td className="py-2 px-1 text-center font-bold text-rose-800">
                  {(row.spoiled || 0) > 0 ? `-${row.spoiled}` : "—"}
                </td>
                <td className="py-2 px-2 text-right font-black text-slate-900">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md ${
                      row.closingStock <= 2
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {row.closingStock}
                  </span>
                </td>
                {handleRestock && (
                  <td className="py-2 px-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRestock(row.itemId)}
                      title={isTh ? "เติมสต็อกรายการนี้" : "Restock this item"}
                      className="p-1 rounded-md bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 font-black text-[10px] cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
