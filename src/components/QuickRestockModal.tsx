import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Package, X, Check, Plus, Minus, Sparkles } from "lucide-react";

interface MenuItem {
  id: string;
  nameEN: string;
  nameTH: string;
  price: number;
  trackStock: boolean;
  currentStock: number;
  lowStockThreshold: number;
  image: string;
  color: string;
}

interface QuickRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: MenuItem[];
  menuItems?: MenuItem[];
  preselectedItemId?: string | null;
  onConfirmRestock: (itemId: string, amount: number, isSpoilage?: boolean) => void;
  lang: "en" | "th";
}

export const QuickRestockModal: React.FC<QuickRestockModalProps> = ({
  isOpen,
  onClose,
  items,
  menuItems,
  preselectedItemId,
  onConfirmRestock,
  lang,
}) => {
  const itemList = Array.isArray(items) ? items : (Array.isArray(menuItems) ? menuItems : []);
  const stockItems = (itemList || []).filter((it) => it && it.trackStock);
  const [selectedId, setSelectedId] = useState<string>("");
  const [amount, setAmount] = useState<number>(10);
  const [isSpoilage, setIsSpoilage] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (preselectedItemId && stockItems.some((it) => it && it.id === preselectedItemId)) {
        setSelectedId(preselectedItemId);
      } else if (stockItems.length > 0 && (!selectedId || !stockItems.some((it) => it && it.id === selectedId))) {
        setSelectedId(stockItems[0].id);
      }
      setAmount(10);
      setIsSpoilage(false);
    }
  }, [isOpen, preselectedItemId, itemList.length]);

  if (!isOpen) return null;

  const currentItem = stockItems.find((it) => it.id === selectedId);
  const currentStock = currentItem?.currentStock ?? 0;
  const projectedStock = isSpoilage 
    ? Math.max(0, currentStock - (Number.isFinite(amount) ? amount : 0))
    : currentStock + (Number.isFinite(amount) ? amount : 0);

  const presets = [1, 2, 5, 10, 20];

  const handleConfirm = () => {
    if (!selectedId || amount <= 0) return;
    onConfirmRestock(selectedId, amount, isSpoilage);
    onClose();
  };

  const isTh = lang === "th";

  return (
    <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white border border-slate-200 rounded-[2rem] p-6 max-w-sm w-full space-y-5 shadow-2xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSpoilage ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'}`}>
              <Package className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-none">
                {isTh ? (isSpoilage ? "บันทึกของเสีย" : "เติมสต็อกสินค้า") : (isSpoilage ? "Log Spoilage" : "Restock Inventory")}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                {isTh ? (isSpoilage ? "ตัดสต็อกสินค้าที่ชำรุดหรือเสีย" : "บันทึกจำนวนสินค้าที่เติมเข้าระบบ") : (isSpoilage ? "Deduct broken or spoiled items" : "Log items restocked into inventory")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setIsSpoilage(false)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!isSpoilage ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {isTh ? "📦 เติมสต็อก" : "📦 Restock"}
          </button>
          <button
            type="button"
            onClick={() => setIsSpoilage(true)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${isSpoilage ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {isTh ? "🗑️ ของเสีย" : "🗑️ Spoilage"}
          </button>
        </div>

        {/* Item Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {isTh ? "เลือกสินค้าที่ต้องการเติม" : "Select Menu Item"}
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
          >
            {stockItems.map((it) => (
              <option key={it.id} value={it.id}>
                {it.image} {isTh ? it.nameTH : it.nameEN} ({isTh ? "คงเหลือ" : "Stock"}: {it.currentStock})
              </option>
            ))}
          </select>
        </div>

        {/* Stock Level Card Preview */}
        {currentItem && (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentItem.image}</span>
              <div>
                <p className="text-xs font-black text-slate-900">
                  {isTh ? currentItem.nameTH : currentItem.nameEN}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {isTh ? "คงเหลือปัจจุบัน" : "Current Available"}:{" "}
                  <span className="font-mono font-bold text-slate-800">{currentStock}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isSpoilage ? 'text-rose-600 bg-rose-100' : 'text-amber-600 bg-amber-100'}`}>
                {isTh ? (isSpoilage ? "หลังหักออก" : "หลังเติม") : "New Total"}
              </span>
              <p className={`text-base font-black font-mono mt-1 ${isSpoilage ? 'text-rose-600' : 'text-emerald-600'}`}>
                {projectedStock}
              </p>
            </div>
          </div>
        )}

        {/* Quantity Stepper & Presets */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex justify-between items-center">
            <span>{isTh ? "จำนวน" : "Amount"}</span>
            <span className={`${isSpoilage ? 'text-rose-600' : 'text-emerald-600'} font-mono font-bold`}>{isSpoilage ? '-' : '+'}{amount}</span>
          </label>

          {/* Stepper */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAmount((prev) => Math.max(1, prev - 1))}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min={1}
              value={amount || ""}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
              className="flex-1 py-2 text-center font-mono font-black text-lg border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              type="button"
              onClick={() => setAmount((prev) => prev + 1)}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Chips */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount((prev) => prev + preset)}
                className="py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-[11px] font-bold font-mono transition-all shadow-2xs cursor-pointer"
              >
                +{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={amount <= 0 || !selectedId || (isSpoilage && currentStock === 0)}
            className={`flex-1 py-3 px-4 rounded-xl disabled:opacity-50 text-white font-black text-xs cursor-pointer shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 ${isSpoilage ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'}`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isTh ? (isSpoilage ? "บันทึกของเสีย" : "บันทึกการเติมสต็อก") : "Confirm"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
          >
            {isTh ? "ยกเลิก" : "Cancel"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
