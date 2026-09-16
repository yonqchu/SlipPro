import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Update translations for clearShift
content = content.replace(
  'clearShiftBtn: "Save Today\'s Records"',
  'clearShiftBtn: "Reset Today\'s Records"'
);
content = content.replace(
  'clearShiftConfirm: "Are you sure you want to save today\'s records? The daily shopping list will be cleared, but all past sales history will be safely stored and can be reviewed later."',
  'clearShiftConfirm: "Are you sure you want to reset records for this date? All sales, history, and earnings for this date will be deleted. The item list will remain intact."'
);
content = content.replace(
  'shiftClearedToast: "Today\'s records saved successfully!"',
  'shiftClearedToast: "Records reset successfully!"'
);
content = content.replace(
  'confirmClearShiftHeader: "Save Today\'s Records?"',
  'confirmClearShiftHeader: "Reset Records?"'
);
content = content.replace(
  'confirmClearShiftBody: "This action will save today\'s sales and clear your daily shopping list. All sales history will be safely stored and can be reviewed later by selecting the date."',
  'confirmClearShiftBody: "This action will permanently delete all sales and history for the selected date. This cannot be undone."'
);
content = content.replace(
  'confirmClearShiftBtn: "Yes, Save Records"',
  'confirmClearShiftBtn: "Yes, Reset Records"'
);

// TH
content = content.replace(
  'clearShiftBtn: "บันทึกรายการวันนี้"',
  'clearShiftBtn: "รีเซ็ตข้อมูลของวันนี้"'
);
content = content.replace(
  'clearShiftConfirm: "คุณต้องการบันทึกรายการของวันนี้ใช่หรือไม่? ระบบจะบันทึกยอดขายของวันนี้ไว้ให้เรียกดูย้อนหลังได้ และล้างรายการซื้อของเพื่อเตรียมพร้อมสำหรับวันถัดไป"',
  'clearShiftConfirm: "คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลของวันที่เลือก? ยอดขาย ประวัติ และรายได้ทั้งหมดของวันนี้จะถูกลบออก"'
);
content = content.replace(
  'shiftClearedToast: "บันทึกรายการวันนี้เรียบร้อย!"',
  'shiftClearedToast: "รีเซ็ตข้อมูลเรียบร้อยแล้ว!"'
);
content = content.replace(
  'confirmClearShiftHeader: "บันทึกรายการวันนี้?"',
  'confirmClearShiftHeader: "รีเซ็ตข้อมูล?"'
);
content = content.replace(
  'confirmClearShiftBody: "การดำเนินการนี้จะบันทึกยอดขายของวันนี้และล้างรายการซื้อของ ประวัติการขายทั้งหมดจะถูกจัดเก็บและสามารถเรียกดูย้อนหลังได้โดยการเลือกวันที่"',
  'confirmClearShiftBody: "การดำเนินการนี้จะลบยอดขายและประวัติทั้งหมดสำหรับวันที่เลือกอย่างถาวรและไม่สามารถเรียกคืนได้"'
);
content = content.replace(
  'confirmClearShiftBtn: "ตกลง, บันทึกรายการ"',
  'confirmClearShiftBtn: "ตกลง, รีเซ็ตข้อมูล"'
);

// 2. Change 'currentStock' translation in manager modal
content = content.replace(
  'currentStock: "Current Stock",',
  'currentStock: "Opening Stock",'
);
content = content.replace(
  'currentStock: "จำนวนสินค้าในคลัง",',
  'currentStock: "ยอดเริ่มวัน (เปิดร้าน)",'
);

// 3. Update handleClearShift
const handleClearShiftOld = `  const handleClearShift = () => {
    // Preserve transactions, only clear the custom shopping list for the new shift/day
    setCustomShoppingList([]);
    localStorage.setItem("slippro_custom_shopping_v1", JSON.stringify([]));

    setShowClearShiftConfirm(false);
    triggerToast(t.shiftClearedToast);
  };`;
const handleClearShiftNew = `  const handleClearShift = () => {
    // Reset all transactions and restock events for the selectedReportDate
    const updatedTransactions = transactions.filter(tx => {
      const txDate = tx.date || (tx.timestamp ? tx.timestamp.split(" @ ")[0] : "");
      return txDate !== selectedReportDate && !(typeof tx.timestamp === "string" && tx.timestamp.includes(selectedReportDate));
    });
    setTransactions(updatedTransactions);
    localStorage.setItem("slippro_transactions_v1", JSON.stringify(updatedTransactions));

    const updatedRestockEvents = restockEvents.filter(r => r.date !== selectedReportDate);
    setRestockEvents(updatedRestockEvents);
    localStorage.setItem("slippro_restock_events_v2", JSON.stringify(updatedRestockEvents));

    // Also clear custom shopping list if resetting today
    if (selectedReportDate === getLocalDateString()) {
      setCustomShoppingList([]);
      localStorage.setItem("slippro_custom_shopping_v1", JSON.stringify([]));
      setCart([]);
    }

    // Refresh stock equation by recalculating currentStock for today
    if (selectedReportDate === getLocalDateString()) {
      const openingMapStr = localStorage.getItem("slippro_opening_stocks_v2");
      let openingMap = openingMapStr ? JSON.parse(openingMapStr) : {};
      const todaysOpening = openingMap[selectedReportDate] || {};
      
      const newMenuItems = menuItems.map(item => {
        if (!item.trackStock) return item;
        const open = todaysOpening[item.id] !== undefined ? todaysOpening[item.id] : item.currentStock;
        return { ...item, currentStock: open };
      });
      setMenuItems(newMenuItems);
      localStorage.setItem("slippro_stock_v2", JSON.stringify(newMenuItems));
    }

    setShowClearShiftConfirm(false);
    triggerToast(t.shiftClearedToast);
  };`;
content = content.replace(handleClearShiftOld, handleClearShiftNew);

// 4. Update clearShiftBtn condition (remove selectedReportDate === getLocalDateString())
content = content.replace(
  `{selectedReportDate === getLocalDateString() && (
                  <button
                    id="clear-shift-btn"
                    onClick={() => setShowClearShiftConfirm(true)}
                    className="w-full py-3.5 rounded-2xl font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all uppercase cursor-pointer border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t.clearShiftBtn}</span>
                  </button>
                )}`,
  `<button
                    id="clear-shift-btn"
                    onClick={() => setShowClearShiftConfirm(true)}
                    className="w-full py-3.5 rounded-2xl font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all uppercase cursor-pointer border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t.clearShiftBtn}</span>
                  </button>`
);

// 5. Update handleSaveMenuItem
const handleSaveMenuItemOld = `    let updatedMenuItems: MenuItem[] = [];
    if (id) {
      // Edit existing
      updatedMenuItems = menuItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              nameEN: finalNameEN, 
              nameTH: finalNameTH, 
              price: finalPrice, 
              trackStock: !!trackStock, 
              currentStock: trackStock ? Number(currentStock ?? 0) : 99, 
              lowStockThreshold: trackStock ? Number(lowStockThreshold ?? 0) : 0, 
              image 
            } 
          : item
      );
      triggerToast("Item updated successfully!");
    } else {
      // Create new
      const newItem: MenuItem = {
        id: "item_" + Date.now(),
        nameEN: finalNameEN,
        nameTH: finalNameTH,
        price: finalPrice,
        trackStock: !!trackStock,
        currentStock: trackStock ? Number(currentStock ?? 0) : 99,
        lowStockThreshold: trackStock ? Number(lowStockThreshold ?? 0) : 0,
        image,
        color: "bg-slate-50 text-slate-700 border-slate-100"
      };
      updatedMenuItems = [...menuItems, newItem];
      triggerToast("New item created successfully!");
    }`;

const handleSaveMenuItemNew = `    const today = getLocalDateString();
    const openingStockInput = trackStock ? Number(currentStock ?? 0) : 99;
    
    // Save to opening stock for today
    if (trackStock) {
      const openingMapStr = localStorage.getItem("slippro_opening_stocks_v2");
      let openingMap = openingMapStr ? JSON.parse(openingMapStr) : {};
      if (!openingMap[today]) openingMap[today] = {};
      openingMap[today][id || ("item_" + Date.now())] = openingStockInput;
      localStorage.setItem("slippro_opening_stocks_v2", JSON.stringify(openingMap));
    }

    let updatedMenuItems: MenuItem[] = [];
    if (id) {
      // Calculate true current stock for today based on new opening stock
      const restocked = (restockEvents || [])
        .filter(r => r && r.itemId === id && r.date === today && r.type !== "spoilage")
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      const spoiled = (restockEvents || [])
        .filter(r => r && r.itemId === id && r.date === today && r.type === "spoilage")
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      const dayTx = transactions.filter(tx => {
        if (!tx) return false;
        if (tx.date) return tx.date === today;
        const txDate = tx.timestamp ? tx.timestamp.split(" @ ")[0] : "";
        return txDate === today || (typeof tx.timestamp === "string" && tx.timestamp.includes(today));
      });
      const sold = dayTx.flatMap(tx => (Array.isArray(tx?.items) ? tx.items : []))
        .filter(it => it && (it.nameEN === finalNameEN || it.nameTH === finalNameTH))
        .reduce((sum, it) => sum + (it.quantity || 0), 0);

      const calculatedCurrentStock = trackStock 
        ? Math.max(0, openingStockInput + restocked - sold - spoiled)
        : 99;

      // Edit existing
      updatedMenuItems = menuItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              nameEN: finalNameEN, 
              nameTH: finalNameTH, 
              price: finalPrice, 
              trackStock: !!trackStock, 
              currentStock: calculatedCurrentStock, 
              lowStockThreshold: trackStock ? Number(lowStockThreshold ?? 0) : 0, 
              image 
            } 
          : item
      );
      triggerToast("Item updated successfully!");
    } else {
      // Create new
      const newItemId = "item_" + Date.now();
      if (trackStock) {
        const openingMapStr = localStorage.getItem("slippro_opening_stocks_v2");
        let openingMap = openingMapStr ? JSON.parse(openingMapStr) : {};
        if (!openingMap[today]) openingMap[today] = {};
        openingMap[today][newItemId] = openingStockInput;
        localStorage.setItem("slippro_opening_stocks_v2", JSON.stringify(openingMap));
      }
      const newItem: MenuItem = {
        id: newItemId,
        nameEN: finalNameEN,
        nameTH: finalNameTH,
        price: finalPrice,
        trackStock: !!trackStock,
        currentStock: openingStockInput, // for new item, it's just the input
        lowStockThreshold: trackStock ? Number(lowStockThreshold ?? 0) : 0,
        image,
        color: "bg-slate-50 text-slate-700 border-slate-100"
      };
      updatedMenuItems = [...menuItems, newItem];
      triggerToast("New item created successfully!");
    }`;

content = content.replace(handleSaveMenuItemOld, handleSaveMenuItemNew);

fs.writeFileSync('src/App.tsx', content, 'utf-8');
