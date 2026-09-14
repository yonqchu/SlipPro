import React, { useState } from "react";
import { Clock, ShoppingBag, PackagePlus, Receipt, ArrowRight, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { RestockEvent } from "../dailyStock";

export interface TimelineSaleEvent {
  type: "sale";
  id: string;
  time: string;
  rawTimestamp: number;
  paymentMethod: "เงินสด" | "เงินโอน";
  total: number;
  items: {
    nameTH: string;
    nameEN: string;
    price: number;
    quantity: number;
  }[];
  hasSlip: boolean;
}

export interface TimelineRestockEvent {
  type: "restock";
  id: string;
  time: string;
  rawTimestamp: number;
  event: RestockEvent;
}

export type TimelineEvent = TimelineSaleEvent | TimelineRestockEvent;

interface DailyTimelineProps {
  events?: TimelineEvent[];
  lang: "en" | "th";
  currencySymbol?: string;
  onViewSlip?: (slipUrl: string) => void;
}

export const DailyTimeline: React.FC<DailyTimelineProps> = ({
  events = [],
  lang,
  currencySymbol = "฿",
  onViewSlip,
}) => {
  const isTh = lang === "th";
  const safeEvents = Array.isArray(events) ? events : [];
  const [isOpen, setIsOpen] = useState(true);

  if (safeEvents.length === 0) {
    return (
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 text-center">
        <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-400 font-medium italic">
          {isTh ? "ไม่มีรายการขายหรือการเติมสต็อกในวันนี้" : "No sales or restock activities recorded on this date"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2.5xl p-5 shadow-xs space-y-3.5">
      <div 
        className="flex justify-between items-center border-b border-slate-100 pb-2.5 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>{isTh ? "ไทม์ไลน์การขายและการเติมสินค้า" : "Daily Activity Timeline"}</span>
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400">
            {safeEvents.length} {isTh ? "กิจกรรม" : "events"}
          </span>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {safeEvents.map((ev, idx) => {
            if (ev.type === "sale") {
              const isCash = ev.paymentMethod === "เงินสด";
              return (
                <div key={ev.id || idx} className="relative group">
                  {/* Dot */}
                  <div
                    className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                      isCash ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                    }`}
                  >
                    <ShoppingBag className="w-2.5 h-2.5" />
                  </div>
                  {/* Content Box */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5 hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {ev.time}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                            isCash
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isTh
                            ? isCash
                              ? "💵 เงินสด"
                              : "📲 เงินโอน"
                            : isCash
                            ? "Cash"
                            : "Transfer"}
                        </span>
                        {ev.hasSlip && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded">
                            {isTh ? "มีสลิป" : "Slip"}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-black font-mono text-emerald-600">
                        {currencySymbol}{ev.total}
                      </span>
                    </div>
                    {/* Item breakdown */}
                    <div className="text-[11px] text-slate-600 space-y-0.5 pt-0.5 border-t border-slate-200/50 font-medium">
                      {(Array.isArray(ev.items) ? ev.items : []).map((it, iIdx) => (
                        <div key={iIdx} className="flex justify-between">
                          <span>
                            • {isTh ? it.nameTH : it.nameEN} x {it.quantity}
                          </span>
                          <span className="font-mono text-slate-500 text-[10px]">
                            {currencySymbol}{it.price * it.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            } else {
              // Restock or Spoilage event
              const rst = ev.event;
              const isSpoilage = rst.type === "spoilage";
              
              return (
                <div key={ev.id || idx} className="relative group">
                  {/* Dot */}
                  <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 border-white ${isSpoilage ? 'bg-rose-500' : 'bg-amber-500'} text-white flex items-center justify-center shadow-xs`}>
                    {isSpoilage ? <Trash2 className="w-2.5 h-2.5" /> : <PackagePlus className="w-2.5 h-2.5" />}
                  </div>
                  {/* Content Box */}
                  <div className={`${isSpoilage ? 'bg-rose-50/70 border-rose-200/80 hover:border-rose-300' : 'bg-amber-50/70 border-amber-200/80 hover:border-amber-300'} border rounded-xl p-3 space-y-1 transition-colors`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-bold ${isSpoilage ? 'text-rose-700' : 'text-amber-700'}`}>
                          {ev.time}
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isSpoilage ? 'bg-rose-100 text-rose-900' : 'bg-amber-100 text-amber-900'}`}>
                          {isTh ? (isSpoilage ? "🗑️ ของเสีย" : "📦 เติมสต็อก") : (isSpoilage ? "Spoilage" : "Restock")}
                        </span>
                      </div>
                      <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${isSpoilage ? 'text-rose-700 bg-rose-200/60' : 'text-amber-700 bg-amber-200/60'}`}>
                        {isSpoilage ? '-' : '+'}{rst.amount} {isTh ? "ชิ้น" : "pcs"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 text-slate-800">
                      <span className="font-bold flex items-center gap-1">
                        <span>{rst.image}</span>
                        <span>{isTh ? rst.itemNameTH : rst.itemNameEN}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <span>{rst.previousStock}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                        <span className="font-bold text-slate-900">{rst.newStock}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};
