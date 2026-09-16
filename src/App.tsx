import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { 
  Camera, 
  Trash2, 
  Share2, 
  RotateCcw, 
  ShoppingCart, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  Check,
  Smartphone,
  Sparkles,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Settings,
  ListChecks,
  PlusCircle,
  QrCode,
  Download,
  Upload,
  Info,
  X,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Calendar,
  PackagePlus,
  Boxes,
  PieChart,
  Copy,
  ExternalLink,
  Wifi,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import html2pdf from "html2pdf.js";
import { APP_VERSION, CACHE_VERSION, BUILD_TIME } from "./version";
import {
  RestockEvent,
  getLocalDateString,
  getLocalTimeString,
  ensureOpeningStock,
  getOpeningStockForDate,
  getAllRestockEvents,
  addRestockEvent,
  CAKE_PALETTE,
  CakeChartSlice,
  getTimezone,
  setTimezone,
} from "./dailyStock";
import { QuickRestockModal } from "./components/QuickRestockModal";
import { DailyStockTable, DailyStockRow } from "./components/DailyStockTable";
import { DailyTimeline, TimelineEvent } from "./components/DailyTimeline";
import { generateDailyPdfReport } from "./utils/pdfReport";

// Types
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

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface Transaction {
  id: string;
  timestamp: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm:ss
  rawTimestamp?: number;
  items: {
    nameEN: string;
    nameTH: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  slipThumbnail: string | null;
  lowStockAlerts: string[];
  paymentMethod?: "เงินสด" | "เงินโอน" | "ออนไลน์";
}

// Default items
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: "matcha",
    nameEN: "Matcha Latte",
    nameTH: "มัทฉะลาเต้",
    price: 75,
    trackStock: true,
    currentStock: 12,
    lowStockThreshold: 3,
    image: "🍵",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    id: "croissant",
    nameEN: "Butter Croissant",
    nameTH: "ครัวซองต์เนยสด",
    price: 65,
    trackStock: true,
    currentStock: 5,
    lowStockThreshold: 2,
    image: "🥐",
    color: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    id: "coldbrew",
    nameEN: "Nitro Cold Brew",
    nameTH: "ไนโตรโคลด์บรูว์",
    price: 85,
    trackStock: false,
    currentStock: 99,
    lowStockThreshold: 0,
    image: "☕",
    color: "bg-stone-50 text-stone-700 border-stone-100",
  },
  {
    id: "shortcake",
    nameEN: "Strawberry Cake",
    nameTH: "เค้กสตรอว์เบอร์รี",
    price: 120,
    trackStock: true,
    currentStock: 3,
    lowStockThreshold: 1,
    image: "🍰",
    color: "bg-rose-50 text-rose-700 border-rose-100",
  },
  {
    id: "americano",
    nameEN: "Iced Americano",
    nameTH: "อเมริกาโน่เย็น",
    price: 60,
    trackStock: false,
    currentStock: 99,
    lowStockThreshold: 0,
    image: "🥤",
    color: "bg-slate-50 text-slate-700 border-slate-100",
  },
  {
    id: "donut",
    nameEN: "Chocolate Donut",
    nameTH: "โดนัทช็อกโกแลต",
    price: 45,
    trackStock: true,
    currentStock: 8,
    lowStockThreshold: 2,
    image: "🍩",
    color: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    id: "thaitea",
    nameEN: "Thai Milk Tea",
    nameTH: "ชาไทยเย็น",
    price: 55,
    trackStock: true,
    currentStock: 15,
    lowStockThreshold: 3,
    image: "🧋",
    color: "bg-orange-50 text-orange-700 border-orange-100",
  },
  {
    id: "muffin",
    nameEN: "Blueberry Muffin",
    nameTH: "มัฟฟินบลูเบอร์รี่",
    price: 70,
    trackStock: true,
    currentStock: 6,
    lowStockThreshold: 2,
    image: "🧁",
    color: "bg-purple-50 text-purple-700 border-purple-100",
  }
];

// Bilingual dictionary
const TRANSLATIONS = {
  en: {
    appTitle: "SlipPro",
    subtitle: "Mobile Sales & Inventory Companion",
    languageLabel: "TH",
    quickTapMenu: "Quick-Tap Menu",
    cartTitle: "Shopping Cart",
    emptyCart: "Your cart is empty. Tap menu items to add.",
    totalAmount: "Total Amount",
    thb: "฿",
    items: "items",
    itemSingle: "item",
    stockLabel: "Stock",
    noStockLimit: "Unlimited",
    outOfStock: "Out of Stock",
    lowStockBadge: "Low Stock!",
    stockRemaining: "Left",
    stockThreshold: "Threshold",
    warningExceedsStock: "Warning: Cart quantity exceeds available stock!",
    cameraSection: "Bank Transfer Slip",
    snapButton: "Snap Transfer Slip",
    retakeButton: "Retake Photo",
    slipCaptured: "Slip Captured Successfully",
    removeSlip: "Remove Slip",
    sendToBossButton: "Complete Sale",
    resetStockButton: "Restock All",
    resetStockSuccess: "Stock successfully restocked to defaults!",
    confirmRestockHeader: "Reset Stock Levels?",
    confirmRestockBody: "Are you sure you want to restore all items' stock levels to their default values? This cannot be undone.",
    confirmRestockBtn: "Yes, Reset Stock",
    transactionHistory: "Transaction History",
    noTransactions: "No past transactions recorded in this session.",
    slipAttached: "Payment Slip Attached",
    slipNotAttached: "No Payment Slip Attached",
    lowStockAlertText: "⚠️ LOW STOCK ALERT",
    clearCartButton: "Clear Cart",
    saleSuccessToast: "Sale completed successfully!",
    confirmHeader: "Complete Sale?",
    confirmBody: "Are you sure you want to finalize this sale of ฿{total} and deduct stock?",
    confirmBtn: "Finish & Deduct Stock",
    cancelBtn: "Cancel",
    todayAt: "Today at",
    recentSales: "Recent Sales Log",
    simulationMode: "Desktop Device Mode Enabled",
    tapToOrder: "Tap to Order",
    noLimit: "No Limit",
    copiedText: "LINE Share text prepared!",
    paymentMethodSection: "Payment Method",
    paymentMethodRequired: "Please choose a payment method (Cash, Transfer, or Online)!",
    cashOption: "Cash",
    transferOption: "Bank Transfer",
    onlineOption: "Online",
    paymentMethodPrompt: "Select how the customer paid (Required):",
    lineSharePrepared: "LINE Order Ready to Send!",
    lineShareInstructions: "Sale recorded! Tap below to open LINE or copy the order message.",
    openLineApp: "Open LINE App",
    copyOrderText: "Copy Order Text",
    copiedSuccess: "Copied to clipboard!",
    newSaleBtn: "New Sale",
    shareViaApp: "Share via Apps",
    resendToLine: "Send to LINE",
    cashBreakdown: "Cash Payments",
    transferBreakdown: "Bank Transfers",
    onlineBreakdown: "Online Sales",
    
    // Navigation Keys
    tabRegister: "Register",
    tabHistory: "History",
    nextBtn: "Payment",
    shopProfileTitle: "Shop Profile",
    shopName: "Shop Name",
    shopAddress: "Shop Address",
    shopLineId: "LINE ID (For Sharing)",
    pinPrompt: "Enter Manager PIN (Default '1234')",
    wrongPin: "Incorrect PIN!",
    managerModalTitle: "Manager Settings",
    addMenuItem: "Add Menu Item",
    editMenuItem: "Edit Menu Item",
    itemNameEN: "Name (EN)",
    itemNameTH: "Name (TH)",
    itemPrice: "Price (THB)",
    itemImage: "Icon Emoji (e.g. ☕)",
    trackStock: "Track Stock",
    currentStock: "Current Stock",
    lowStockThreshold: "Low Stock Threshold",
    customShoppingPlaceholder: "Add raw ingredient or custom item...",
    customShoppingAddBtn: "Add",
    exportSetupBtn: "Export Setup (QR)",
    importSetupBtn: "Import Setup (QR)",
    setupQrTitle: "Configuration QR",
    scanQrPrompt: "Scan setup QR with camera or choose image file",
    scanSuccess: "Settings imported successfully!",
    scanFailed: "Invalid or corrupt setup QR code.",
    saveBtn: "Save",
    deleteBtn: "Delete",
    noLowStockItems: "No menu items currently below low stock threshold.",
    tabZReport: "Z-Report",
    totalCash: "Total Cash",
    totalTransactions: "Total Transactions",
    itemizedSales: "Itemized Sales Count",
    clearShiftBtn: "Save Today's Records",
    downloadPdfBtn: "Download PDF Report",
    clearShiftConfirm: "Are you sure you want to save today's records? The daily shopping list will be cleared, but all past sales history will be safely stored and can be reviewed later.",
    shiftClearedToast: "Today's records saved successfully!",
    noSalesToday: "No sales recorded for this date.",
    zReportTitle: "Daily Sales & Stock Report",
    confirmClearShiftHeader: "Save Today's Records?",
    confirmClearShiftBody: "This action will save today's sales and clear your daily shopping list. All sales history will be safely stored and can be reviewed later by selecting the date.",
    confirmClearShiftBtn: "Yes, Save Records",
    downloadingPdf: "Downloading PDF...",
    unitPrice: "Unit Price",
    configConsole: "Configuration Console",
    subTabProfile: "Profile",
    subTabCatalog: "Catalog",
    subTabSync: "QR Sync",
    scanQrWithCamera: "Scan QR with Camera",
    cameraViewfinder: "Camera Viewfinder",
    alignQrInstruction: "Align the Setup QR within the box.",
    mirrorInstruction: "Share this QR with another device to mirror this exact shop profile and menu catalog configuration instantly!",
    downloadBtn: "Download",
    closeBtn: "Close",
    currentCatalog: "Current Catalog",
    addItemBtn: "Add Item",
    appVersion: "Version",
    checkForUpdates: "Check for Updates",
    checkingUpdates: "Checking for updates...",
    latestVersionToast: "SlipPro is up to date (v{version})",
    newVersionFound: "New version available: v{version}!",
    updateNowBtn: "Update Now",
    updateNowInstruction: "A new version is ready. Tap to install immediately.",
    updatingAppToast: "Updating SlipPro & reloading...",
    clearCacheBtn: "Purge Cache & Hard Refresh",
    cacheClearedToast: "Cache purged! Reloading app...",
    subTabSystem: "System & Version",
    systemInfoTitle: "System & App Updates",
    currentVersionLabel: "Current Version",
    cacheLayerLabel: "Service Worker Cache",
    buildTimeLabel: "Build Timestamp",
    connectionStatusLabel: "Network Status",
    onlineStatus: "Online (Ready to sync)",
    offlineStatus: "Offline (Local PWA mode)",
    systemUpToDate: "Your application is currently running the latest release.",
    dismissBtn: "Later",

    // New Daily Stock & Restock Keys
    quickRestockBtn: "Quick Restock",
    quickRestockCardBtn: "+ Restock",
    restockSuccessToast: "Item restocked successfully!",
    selectedDateLabel: "Select Date",
    todayBtn: "Today",
    prevDayBtn: "Prev Day",
    nextDayBtn: "Next Day",
    allEarningsTotal: "Total Revenue",
    allEarningsTogether: "Total Revenue (All)",
    totalCashLabel: "Cash",
    cashIncome: "Cash",
    totalTransferLabel: "Transfer",
    transferIncome: "Transfer",
    totalBillsLabel: "Bills",
    totalOrders: "Total Orders",
    totalRestockEventsLabel: "Restocked",
    restockUnitsCount: "Restocked",
    quickRestock: "Quick Restock",
    dailyStockTitle: "Daily Stock Balance",
    dailyTimelineTitle: "Activity Timeline",
    bestsellerCakeTitle: "Daily Best Sellers Chart",
    bestSellerCakeChart: "Daily Best Sellers",
    shoppingListTitle: "Restock & Procurement List",
    minThreshold: "Min Threshold",
  },
  th: {
    appTitle: "SlipPro",
    subtitle: "ระบบจัดการการขายและคลังสินค้า",
    languageLabel: "ไทย",
    quickTapMenu: "เมนูสินค้า",
    cartTitle: "ตะกร้าสินค้า",
    emptyCart: "ตะกร้าสินค้าว่างเปล่า แตะเมนูเพื่อเพิ่มสินค้า",
    totalAmount: "ยอดรวมทั้งหมด",
    thb: "฿",
    items: "รายการ",
    itemSingle: "รายการ",
    stockLabel: "คงเหลือ",
    noStockLimit: "ไม่จำกัดคลัง",
    outOfStock: "สินค้าหมด",
    lowStockBadge: "ใกล้หมด!",
    stockRemaining: "ชิ้น",
    stockThreshold: "เกณฑ์เตือน",
    warningExceedsStock: "คำเตือน: จำนวนสินค้าในตะกร้าเกินคลังที่มี!",
    cameraSection: "สลิปโอนเงิน",
    snapButton: "ถ่ายภาพสลิปโอนเงิน",
    retakeButton: "ถ่ายรูปใหม่",
    slipCaptured: "บันทึกสลิปเรียบร้อยแล้ว",
    removeSlip: "ลบสลิป",
    sendToBossButton: "สำเร็จรายการ",
    resetStockButton: "เติมคลังสินค้า",
    resetStockSuccess: "คืนค่าคลังสินค้าทั้งหมดเรียบร้อยแล้ว!",
    confirmRestockHeader: "คืนค่าระดับสต็อกสินค้าทั้งหมด?",
    confirmRestockBody: "คุณต้องการรีเซ็ตและเติมระดับสต็อกสินค้าทั้งหมดให้กลับเป็นค่าเริ่มต้นใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้",
    confirmRestockBtn: "ใช่, รีเซ็ตสต็อก",
    transactionHistory: "ประวัติการขาย",
    noTransactions: "ไม่มีประวัติการขายในระบบ",
    slipAttached: "แนบสลิปแล้ว",
    slipNotAttached: "ไม่ได้แนบสลิป",
    lowStockAlertText: "⚠️ แจ้งเตือนสินค้าใกล้หมด",
    clearCartButton: "ล้างตะกร้า",
    saleSuccessToast: "บันทึกรายการขายสำเร็จเรียบร้อย!",
    confirmHeader: "ยืนยันสำเร็จรายการ",
    confirmBody: "คุณต้องการบันทึกการขายยอด ฿{total} และตัดสต็อกสินค้าใช่หรือไม่?",
    confirmBtn: "บันทึกสำเร็จรายการ",
    cancelBtn: "ยกเลิก",
    todayAt: "วันนี้เวลา",
    recentSales: "ประวัติการขายล่าสุด",
    simulationMode: "โหมดหน้าจอเดสก์ท็อป",
    tapToOrder: "แตะเพื่อสั่งสินค้า",
    noLimit: "ไม่จำกัด",
    copiedText: "เตรียมข้อความส่งไลน์เรียบร้อย!",
    paymentMethodSection: "วิธีการชำระเงิน",
    paymentMethodRequired: "กรุณาเลือกวิธีการชำระเงิน (เงินสด, เงินโอน หรือ ออนไลน์)!",
    cashOption: "เงินสด",
    transferOption: "เงินโอน",
    onlineOption: "ออนไลน์",
    paymentMethodPrompt: "เลือกว่าลูกค้าชำระเงินด้วยวิธีใด (จำเป็น):",
    lineSharePrepared: "เตรียมส่งข้อมูลไปที่ไลน์เรียบร้อย!",
    lineShareInstructions: "บันทึกยอดขายแล้ว กดปุ่มด้านล่างเพื่อเปิดไลน์หรือคัดลอกข้อความ",
    openLineApp: "เปิดแอปไลน์",
    copyOrderText: "คัดลอกข้อความ",
    copiedSuccess: "คัดลอกข้อความเรียบร้อยแล้ว!",
    newSaleBtn: "เริ่มบิลใหม่",
    shareViaApp: "แชร์ผ่านแอปอื่น",
    resendToLine: "ส่งเข้าไลน์",
    cashBreakdown: "ชำระด้วยเงินสด",
    transferBreakdown: "ชำระด้วยเงินโอน",
    onlineBreakdown: "ชำระออนไลน์",
    
    // Navigation Keys - Pure Thai without English
    tabRegister: "หน้าขาย",
    tabHistory: "ประวัติการขาย",
    nextBtn: "ชำระเงิน",
    shopProfileTitle: "ข้อมูลร้านค้า",
    shopName: "ชื่อร้านค้า",
    shopAddress: "ที่อยู่ร้านค้า",
    shopLineId: "ไอดีไลน์ (สำหรับส่งยอด)",
    pinPrompt: "กรอกรหัสผ่านผู้จัดการ (ค่าเริ่มต้น 1234)",
    wrongPin: "รหัสผ่านไม่ถูกต้อง!",
    managerModalTitle: "จัดการระบบ",
    addMenuItem: "เพิ่มรายการเมนู",
    editMenuItem: "แก้ไขรายการเมนู",
    itemNameEN: "ชื่อภาษาอังกฤษ",
    itemNameTH: "ชื่อภาษาไทย",
    itemPrice: "ราคา (บาท)",
    itemImage: "ไอคอนรูปภาพ (เช่น ☕)",
    trackStock: "ติดตามคลังสินค้า",
    currentStock: "จำนวนสินค้าในคลัง",
    lowStockThreshold: "เกณฑ์เตือนคลังเหลือน้อย",
    customShoppingPlaceholder: "ระบุวัตถุดิบหรือรายการซื้อของเพิ่มเติม...",
    customShoppingAddBtn: "เพิ่ม",
    exportSetupBtn: "ส่งออกข้อมูลตั้งค่า",
    importSetupBtn: "นำเข้าข้อมูลตั้งค่า",
    setupQrTitle: "คิวอาร์โค้ดตั้งค่าระบบ",
    scanQrPrompt: "สแกนคิวอาร์โค้ดหรือเลือกไฟล์รูปภาพเพื่อตั้งค่า",
    scanSuccess: "นำเข้าข้อมูลร้านค้าและเมนูสำเร็จ!",
    scanFailed: "รหัสคิวอาร์สำหรับตั้งค่าไม่ถูกต้องหรือชำรุด",
    saveBtn: "บันทึก",
    deleteBtn: "ลบ",
    noLowStockItems: "ไม่มีเมนูสินค้าใดที่คลังต่ำกว่าเกณฑ์เตือน",

    tabZReport: "รายงานประจำวัน",
    totalCash: "ยอดเงินสด",
    totalTransactions: "จำนวนบิลขาย",
    itemizedSales: "สรุปรายการขายแยกประเภท",
    clearShiftBtn: "บันทึกรายการวันนี้",
    downloadPdfBtn: "ดาวน์โหลดรายงาน",
    clearShiftConfirm: "คุณต้องการบันทึกรายการของวันนี้ใช่หรือไม่? ระบบจะบันทึกยอดขายของวันนี้ไว้ให้เรียกดูย้อนหลังได้ และล้างรายการซื้อของเพื่อเตรียมพร้อมสำหรับวันถัดไป",
    shiftClearedToast: "บันทึกรายการวันนี้เรียบร้อย!",
    noSalesToday: "ไม่มีประวัติการขายสำหรับวันที่เลือก",
    zReportTitle: "รายงานสรุปยอดขายประจำวัน",
    confirmClearShiftHeader: "บันทึกรายการวันนี้?",
    confirmClearShiftBody: "การดำเนินการนี้จะบันทึกยอดขายของวันนี้และล้างรายการซื้อของ ประวัติการขายทั้งหมดจะถูกจัดเก็บและสามารถเรียกดูย้อนหลังได้โดยการเลือกวันที่",
    confirmClearShiftBtn: "ตกลง, บันทึกรายการ",
    downloadingPdf: "กำลังดาวน์โหลดรายงาน...",
    unitPrice: "ราคาต่อหน่วย",
    configConsole: "แผงควบคุมระบบ",
    subTabProfile: "ข้อมูลร้านค้า",
    subTabCatalog: "เมนูสินค้า",
    subTabSync: "สำรองข้อมูล",
    scanQrWithCamera: "สแกนคิวอาร์ด้วยกล้อง",
    cameraViewfinder: "ช่องมองภาพกล้อง",
    alignQrInstruction: "จัดวางรหัสคิวอาร์ให้อยู่ภายในกรอบ",
    mirrorInstruction: "แชร์คิวอาร์โค้ดนี้ไปยังอุปกรณ์อื่นเพื่อซิงค์ข้อมูลร้านและเมนูทั้งหมดได้ทันที",
    downloadBtn: "ดาวน์โหลด",
    closeBtn: "ปิด",
    currentCatalog: "รายการเมนูปัจจุบัน",
    addItemBtn: "เพิ่มเมนู",
    appVersion: "เวอร์ชัน",
    checkForUpdates: "ตรวจสอบการอัปเดต",
    checkingUpdates: "กำลังตรวจสอบการอัปเดต...",
    latestVersionToast: "ระบบเป็นเวอร์ชันล่าสุดแล้ว",
    newVersionFound: "พบเวอร์ชันใหม่พร้อมให้อัปเดต",
    updateNowBtn: "อัปเดตทันที",
    updateNowInstruction: "มีเวอร์ชันใหม่พร้อมติดตั้ง แตะเพื่ออัปเดตทันที",
    updatingAppToast: "กำลังอัปเดตระบบและโหลดใหม่...",
    clearCacheBtn: "ล้างแคชและโหลดใหม่",
    cacheClearedToast: "ล้างแคชเรียบร้อย กำลังโหลดใหม่...",
    subTabSystem: "ระบบและเวอร์ชัน",
    systemInfoTitle: "ระบบและการอัปเดต",
    currentVersionLabel: "เวอร์ชันปัจจุบัน",
    cacheLayerLabel: "แคชระบบ",
    buildTimeLabel: "เวลาที่บันทึก",
    connectionStatusLabel: "สถานะเครือข่าย",
    onlineStatus: "ออนไลน์ (พร้อมใช้งาน)",
    offlineStatus: "ออฟไลน์ (ใช้งานในเครื่อง)",
    systemUpToDate: "คุณกำลังใช้งานระบบเวอร์ชันล่าสุดเรียบร้อยแล้ว",
    dismissBtn: "ไว้คราวหลัง",

    // New Daily Stock & Restock Keys - Pure Thai
    quickRestockBtn: "เติมสต็อกด่วน",
    quickRestockCardBtn: "+ เติม",
    restockSuccessToast: "เติมสต็อกสินค้าสำเร็จ!",
    selectedDateLabel: "เลือกวันที่",
    todayBtn: "วันนี้",
    prevDayBtn: "วันก่อนหน้า",
    nextDayBtn: "วันถัดไป",
    allEarningsTotal: "ยอดขายรวมทั้งหมด",
    allEarningsTogether: "ยอดขายรวมทุกช่องทาง",
    totalCashLabel: "เงินสด",
    cashIncome: "เงินสด",
    totalTransferLabel: "เงินโอน",
    transferIncome: "เงินโอน",
    totalOnlineLabel: "ออนไลน์",
    onlineIncome: "ออนไลน์",
    totalBillsLabel: "จำนวนบิล",
    totalOrders: "จำนวนออเดอร์",
    totalRestockEventsLabel: "เติมสต็อก",
    restockUnitsCount: "เติมสินค้า",
    quickRestock: "เติมสต็อกด่วน",
    dailyStockTitle: "ความเคลื่อนไหวสต็อกประจำวัน",
    dailyTimelineTitle: "ไทม์ไลน์การขายและการเติมสินค้า",
    bestsellerCakeTitle: "กราฟสินค้าขายดีประจำวัน",
    bestSellerCakeChart: "กราฟสินค้าขายดีประจำวัน",
    shoppingListTitle: "รายการซื้อของและของใกล้หมด",
    minThreshold: "เกณฑ์ขั้นต่ำ",
  }
};

export default function App() {
  const [lang, setLang] = useState<"en" | "th">("th");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [capturedSlip, setCapturedSlip] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Payment Method & LINE Share States
  const [paymentMethod, setPaymentMethod] = useState<"เงินสด" | "เงินโอน" | "ออนไลน์" | null>(null);
  const [paymentMethodError, setPaymentMethodError] = useState(false);
  const [lineOrderModal, setLineOrderModal] = useState<{
    isOpen: boolean;
    message: string;
    shareUrl: string;
    paymentMethod: "เงินสด" | "เงินโอน" | "ออนไลน์";
    total: number;
    hasSlip: boolean;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Phase 2 State Declarations
  const [activeTab, setActiveTab] = useState<"register" | "history" | "checkout" | "zreport" | "restock">("register");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [managerSubTab, setManagerSubTab] = useState<"profile" | "items" | "sync" | "system">("profile");
  
  // App Version & Update State
  const [updateInfo, setUpdateInfo] = useState<{
    available: boolean;
    latestVersion: string;
    releaseNotes?: string;
  }>({ available: false, latestVersion: APP_VERSION });
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateBannerDismissed, setUpdateBannerDismissed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [timezone, setTimezoneState] = useState(getTimezone());

  const [shopProfile, setShopProfile] = useState({
    name: "SlipPro Coffee",
    address: "123 Sukhumvit Rd, Bangkok",
    lineId: ""
  });
  
  const [customShoppingList, setCustomShoppingList] = useState<string[]>([]);
  const [customShoppingItem, setCustomShoppingItem] = useState("");
  
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Daily Stock & Restock Reporting States
  const [selectedReportDate, setSelectedReportDate] = useState<string>(getLocalDateString());
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>(getLocalDateString());
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [restockEvents, setRestockEvents] = useState<RestockEvent[]>([]);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [preselectedRestockItemId, setPreselectedRestockItemId] = useState<string | null>(null);
  
  const [menuSearchQuery, setMenuSearchQuery] = useState("");

  // Phase 3 State Declarations
  const [showClearShiftConfirm, setShowClearShiftConfirm] = useState(false);
  const [showRestockConfirm, setShowRestockConfirm] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  // Initialize data from localStorage or default
  useEffect(() => {
    let initialItems = DEFAULT_MENU_ITEMS;
    const savedStock = localStorage.getItem("slippro_stock_v2");
    if (savedStock) {
      try {
        const parsed = JSON.parse(savedStock);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialItems = parsed;
          setMenuItems(parsed);
        } else {
          setMenuItems(DEFAULT_MENU_ITEMS);
        }
      } catch (e) {
        setMenuItems(DEFAULT_MENU_ITEMS);
      }
    } else {
      setMenuItems(DEFAULT_MENU_ITEMS);
      localStorage.setItem("slippro_stock_v2", JSON.stringify(DEFAULT_MENU_ITEMS));
    }

    // Ensure daily opening stock is established for today
    ensureOpeningStock(getLocalDateString(), initialItems);
    setRestockEvents(getAllRestockEvents());

    const savedHistory = localStorage.getItem("slippro_transactions_v1");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setTransactions(parsed);
        } else {
          setTransactions([]);
        }
      } catch (e) {
        setTransactions([]);
      }
    }

    const savedShopProfile = localStorage.getItem("slippro_shop_profile_v1");
    if (savedShopProfile) {
      try {
        const parsed = JSON.parse(savedShopProfile);
        if (parsed && typeof parsed === "object") {
          setShopProfile(parsed);
        }
      } catch (e) {}
    } else {
      const defaultProfile = {
        name: "SlipPro Coffee",
        address: "123 Sukhumvit Rd, Bangkok",
        lineId: ""
      };
      setShopProfile(defaultProfile);
      localStorage.setItem("slippro_shop_profile_v1", JSON.stringify(defaultProfile));
    }

    const savedCustomShopping = localStorage.getItem("slippro_custom_shopping_v1");
    if (savedCustomShopping) {
      try {
        const parsed = JSON.parse(savedCustomShopping);
        if (Array.isArray(parsed)) {
          setCustomShoppingList(parsed);
        } else {
          setCustomShoppingList([]);
        }
      } catch (e) {
        setCustomShoppingList([]);
      }
    }

    const savedSlip = localStorage.getItem("slippro_current_slip_v1");
    if (savedSlip) {
      setCapturedSlip(savedSlip);
    }
  }, []);

  // Helper translations
  const t = TRANSLATIONS[lang];

  // Quick Restock handler for single item
  const handleQuickRestockConfirm = (itemId: string, amount: number, isSpoilage?: boolean) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    const prev = item.currentStock;
    const newStock = isSpoilage ? Math.max(0, prev - amount) : prev + amount;

    const updated = menuItems.map(i => {
      if (i.id === itemId) {
        return { ...i, currentStock: newStock };
      }
      return i;
    });

    setMenuItems(updated);
    localStorage.setItem("slippro_stock_v2", JSON.stringify(updated));

    const newEv = addRestockEvent({
      itemId: item.id,
      itemNameTH: item.nameTH,
      itemNameEN: item.nameEN,
      image: item.image,
      amount: amount,
      previousStock: prev,
      newStock: newStock,
      date: getLocalDateString(),
      time: getLocalTimeString(),
      type: isSpoilage ? "spoilage" : "restock",
    });

    setRestockEvents(prevEvents => [newEv, ...prevEvents]);
    
    if (isSpoilage) {
      triggerToast(lang === "th" ? `บันทึกของเสีย ${item.nameTH} -${amount} สำเร็จ!` : `Logged spoilage for ${item.nameEN} -${amount}!`);
    } else {
      triggerToast(lang === "th" ? `เติมสต็อก ${item.nameTH} +${amount} สำเร็จ!` : `Restocked ${item.nameEN} +${amount}!`);
    }
  };

  // Restock all handler
  const handleRestock = () => {
    setMenuItems(DEFAULT_MENU_ITEMS);
    localStorage.setItem("slippro_stock_v2", JSON.stringify(DEFAULT_MENU_ITEMS));
    DEFAULT_MENU_ITEMS.forEach(it => {
      if (it.trackStock) {
        addRestockEvent({
          itemId: it.id,
          itemNameTH: it.nameTH,
          itemNameEN: it.nameEN,
          image: it.image,
          amount: it.currentStock,
          previousStock: 0,
          newStock: it.currentStock,
          date: getLocalDateString(),
          time: getLocalTimeString(),
        });
      }
    });
    setRestockEvents(getAllRestockEvents());
    triggerToast(t.resetStockSuccess);
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
  };

  // Version & Update System
  const checkForUpdates = async (manual = false) => {
    if (manual) setIsCheckingUpdate(true);
    try {
      // 1. Tell Service Worker to check server for new sw.js
      if ('serviceWorker' in navigator) {
        const reg = (window as any).__swRegistration || await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update().catch(() => {});
        }
      }

      // 2. Fetch version.json bypassing browser & HTTP cache
      const res = await fetch(`${import.meta.env.BASE_URL}version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.version && data.version !== APP_VERSION) {
          setUpdateInfo({
            available: true,
            latestVersion: data.version,
            releaseNotes: data.releaseNotes
          });
          setUpdateBannerDismissed(false);
          if (manual) {
            triggerToast(t.newVersionFound.replace("{version}", data.version));
          }
          return;
        }
      }

      if (manual) {
        triggerToast(t.latestVersionToast.replace("{version}", APP_VERSION));
      }
    } catch (err) {
      console.error("Update check failed:", err);
      if (manual) {
        triggerToast("Failed to check for updates. Check connection.");
      }
    } finally {
      if (manual) {
        setTimeout(() => setIsCheckingUpdate(false), 600);
      }
    }
  };

  // Apply update, purge caches and reload
  const handleApplyUpdate = async () => {
    triggerToast(t.updatingAppToast);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      if ('serviceWorker' in navigator) {
        const reg = (window as any).__swRegistration || await navigator.serviceWorker.getRegistration();
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        if (reg && reg.active) {
          reg.active.postMessage({ type: 'CLEAR_CACHES' });
        }
      }
    } catch (e) {
      console.error("Error clearing caches during update:", e);
    }

    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Force purge caches & hard reload
  const handlePurgeCache = async () => {
    triggerToast(t.cacheClearedToast);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) {
      console.error("Cache purge failed:", e);
    }
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const checkDayChange = () => {
    const today = getLocalDateString();
    const lastDate = localStorage.getItem("slippro_last_opened_date");
    if (lastDate && lastDate !== today) {
      setCustomShoppingList([]);
      localStorage.setItem("slippro_custom_shopping_v1", JSON.stringify([]));
      setCart([]);
      if (selectedReportDate === lastDate) {
        setSelectedReportDate(today);
      }
    }
    localStorage.setItem("slippro_last_opened_date", today);
  };

  // Automatic Background Update Checks
  useEffect(() => {
    // Initial check
    checkForUpdates(false);
    checkDayChange();

    // Online / offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      checkForUpdates(false);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check periodically every 4 minutes
    const interval = setInterval(() => {
      checkForUpdates(false);
      checkDayChange();
    }, 4 * 60 * 1000);

    // Check when user returns to window
    const handleFocus = () => {
      checkForUpdates(false);
      checkDayChange();
    };
    window.addEventListener('focus', handleFocus);

    // Listen to custom event dispatched by main.tsx
    const handleSWUpdate = () => {
      setUpdateInfo(prev => ({
        ...prev,
        available: true,
        releaseNotes: "A new version of SlipPro is ready to install."
      }));
      setUpdateBannerDismissed(false);
    };
    window.addEventListener('slippro-update-available', handleSWUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('slippro-update-available', handleSWUpdate);
    };
  }, []);

  // Add item to cart
  const handleAddToCart = (item: MenuItem) => {
    // If tracking stock and current stock is 0, prevent adding
    if (item.trackStock && item.currentStock <= 0) {
      return;
    }

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(c => c.menuItem.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      } else {
        return [...prevCart, { menuItem: item, quantity: 1 }];
      }
    });
  };

  // Decrease cart quantity
  const handleDecreaseQuantity = (itemId: string) => {
    setCart(prevCart => {
      const safeCart = Array.isArray(prevCart) ? prevCart : [];
      const existing = safeCart.find(c => c && c.menuItem && c.menuItem.id === itemId);
      if (!existing) return safeCart;

      if (existing.quantity <= 1) {
        return safeCart.filter(c => c && c.menuItem && c.menuItem.id !== itemId);
      } else {
        return safeCart.map(c => 
          c && c.menuItem && c.menuItem.id === itemId 
            ? { ...c, quantity: c.quantity - 1 } 
            : c
        );
      }
    });
  };

  // Increase cart quantity
  const handleIncreaseQuantity = (itemId: string) => {
    const item = menuItems.find(m => m.id === itemId);
    if (!item) return;

    setCart(prevCart => {
      return prevCart.map(c => {
        if (c.menuItem.id === itemId) {
          return { ...c, quantity: c.quantity + 1 };
        }
        return c;
      });
    });
  };

  // Clear cart
  const handleClearCart = () => {
    setCart([]);
  };

  // Check if any cart item exceeds available stock
  const doesCartExceedStock = () => {
    return cart.some(c => {
      if (!c.menuItem.trackStock) return false;
      const currentInDb = menuItems.find(m => m.id === c.menuItem.id);
      if (!currentInDb) return false;
      return c.quantity > currentInDb.currentStock;
    });
  };

  // Check if a specific item in cart exceeds its stock
  const isItemExceedingStock = (c: CartItem) => {
    if (!c.menuItem.trackStock) return false;
    const currentInDb = menuItems.find(m => m.id === c.menuItem.id);
    if (!currentInDb) return false;
    return c.quantity > currentInDb.currentStock;
  };

  // Handle capture of file/camera
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          const timestampStr = `${getLocalDateString()} ${getLocalTimeString()}`;
          
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(0, height - 40, width, 40);
          ctx.font = "20px sans-serif";
          ctx.fillStyle = "white";
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          ctx.fillText(timestampStr, width - 20, height - 20);
        }
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        
        setCapturedSlip(compressedBase64);
        setPaymentMethod("เงินโอน");
        setPaymentMethodError(false);
        try {
          localStorage.setItem("slippro_current_slip_v1", compressedBase64);
        } catch (err) {
          console.error("Storage full");
        }
        triggerToast(t.slipCaptured);
        
        // Auto-download to save to device
        const link = document.createElement("a");
        link.href = compressedBase64;
        link.download = `slip_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        triggerToast("Failed to load image");
      };
      
      img.src = objectUrl;
    }
  };

  const handleRemoveSlip = () => {
    setCapturedSlip(null);
    localStorage.removeItem("slippro_current_slip_v1");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Calculate cart total
  const cartTotal = cart.reduce((acc, curr) => acc + (curr.menuItem.price * curr.quantity), 0);

  // Send to Boss Handler
  const handleSendToBoss = () => {
    if (cart.length === 0) return;
    if (!paymentMethod) {
      setPaymentMethodError(true);
      triggerToast(t.paymentMethodRequired);
      return;
    }
    setPaymentMethodError(false);
    setShowConfirmModal(true);
  };

  // Confirm stock deduction and finish sale (No forced LINE redirect)
  const confirmAndSend = () => {
    setShowConfirmModal(false);
    if (!paymentMethod) {
      setPaymentMethodError(true);
      triggerToast(t.paymentMethodRequired);
      return;
    }

    // 1. Deduct quantities from stock state for items where trackStock is true
    const updatedMenuItems = menuItems.map(item => {
      if (!item.trackStock) return item;
      const cartItem = cart.find(c => c.menuItem.id === item.id);
      if (cartItem) {
        const newStock = Math.max(0, item.currentStock - cartItem.quantity);
        return {
          ...item,
          currentStock: newStock
        };
      }
      return item;
    });

    setMenuItems(updatedMenuItems);
    localStorage.setItem("slippro_stock_v2", JSON.stringify(updatedMenuItems));

    // 2. Identify if any item is below its lowStockThreshold
    const lowStockAlerts: string[] = [];
    updatedMenuItems.forEach(item => {
      if (item.trackStock && item.currentStock < item.lowStockThreshold) {
        const itemLabel = lang === "en" ? item.nameEN : item.nameTH;
        lowStockAlerts.push(`${itemLabel} (${t.stockLabel}: ${item.currentStock})`);
      }
    });

    const now = new Date();
    const currentDateStr = getLocalDateString(now);
    const currentTimeStr = getLocalTimeString(now);
    const chosenPayment = paymentMethod;

    // 3. Save to transactions local storage
    const newTransaction: Transaction = {
      id: "txn_" + Date.now(),
      timestamp: `${currentDateStr} @ ${currentTimeStr}`,
      date: currentDateStr,
      time: currentTimeStr,
      rawTimestamp: Date.now(),
      items: cart.map(c => ({
        nameEN: c.menuItem.nameEN,
        nameTH: c.menuItem.nameTH,
        price: c.menuItem.price,
        quantity: c.quantity
      })),
      total: cartTotal,
      slipThumbnail: capturedSlip,
      lowStockAlerts: lowStockAlerts,
      paymentMethod: chosenPayment
    };

    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    localStorage.setItem("slippro_transactions_v1", JSON.stringify(updatedTransactions));

    // 4. Clear cart and slip
    setCart([]);
    setCapturedSlip(null);
    setPaymentMethod(null);
    setPaymentMethodError(false);
    localStorage.removeItem("slippro_current_slip_v1");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Switch back to register view immediately for fast checkout flow
    setActiveTab("register");
    triggerToast(t.saleSuccessToast);
  };

  const handleResendToLine = (tx: Transaction) => {
    const isThai = lang === "th";
    const paymentText = tx.paymentMethod === "ออนไลน์"
      ? (isThai ? "ออนไลน์" : "Online")
      : tx.paymentMethod === "เงินโอน"
      ? (isThai ? "เงินโอน" : "Bank Transfer")
      : (isThai ? "เงินสด" : "Cash");

    let message = "";
    if (isThai) {
      message = `รายการขายสินค้า\n`;
      message += `ร้านค้า: ${shopProfile.name}\n`;
      message += `วันเวลา: ${tx.timestamp}\n`;
      message += `การชำระเงิน: ${paymentText}\n`;
      message += `-------------------------\n`;
      tx.items.forEach(c => {
        message += `• ${c.nameTH || c.nameEN} x ${c.quantity} = ฿${c.price * c.quantity}\n`;
      });
      message += `-------------------------\n`;
      message += `ยอดรวมทั้งสิ้น: ฿${tx.total}\n`;
      message += `สถานะสลิป: ${tx.slipThumbnail ? "แนบสลิปเรียบร้อย" : (tx.paymentMethod === "ออนไลน์" ? "ชำระออนไลน์" : (tx.paymentMethod === "เงินโอน" ? "เงินโอน (ไม่ได้แนบสลิป)" : "ชำระเงินสด"))}\n`;
      if (tx.lowStockAlerts && tx.lowStockAlerts.length > 0) {
        message += `\nแจ้งเตือนสินค้าใกล้หมด:\n`;
        tx.lowStockAlerts.forEach(alert => {
          message += `- ${alert}\n`;
        });
      }
    } else {
      message = `--- SlipPro Sale Order ---\n`;
      message += `Shop: ${shopProfile.name}\n`;
      message += `Date/Time: ${tx.timestamp}\n`;
      message += `Payment: ${paymentText}\n`;
      message += `-------------------------\n`;
      tx.items.forEach(c => {
        message += `• ${c.nameEN || c.nameTH} x ${c.quantity} = ฿${c.price * c.quantity}\n`;
      });
      message += `-------------------------\n`;
      message += `TOTAL: ฿${tx.total}\n`;
      message += `Slip Status: ${tx.slipThumbnail ? "Attached" : (tx.paymentMethod === "ออนไลน์" ? "Online Payment" : (tx.paymentMethod === "เงินโอน" ? "Transfer (No Slip)" : "Cash Payment"))}\n`;
      if (tx.lowStockAlerts && tx.lowStockAlerts.length > 0) {
        message += `\n${t.lowStockAlertText}\n`;
        tx.lowStockAlerts.forEach(alert => {
          message += `- ${alert}\n`;
        });
      }
    }

    const lineShareUrl = `https://line.me/R/share?text=${encodeURIComponent(message)}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).catch(() => {});
    }

    try {
      window.open(lineShareUrl, "_blank");
    } catch (e) {}

    setLineOrderModal({
      isOpen: true,
      message,
      shareUrl: lineShareUrl,
      paymentMethod: tx.paymentMethod || (tx.slipThumbnail ? "เงินโอน" : "เงินสด"),
      total: tx.total,
      hasSlip: !!tx.slipThumbnail
    });
  };

  // Phase 2 Manager Verification & Config Helpers
  const handlePinVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === "1234") {
      setPinError(null);
      setShowPinModal(false);
      setShowManagerModal(true);
      setPinInput("");
    } else {
      setPinError(t.wrongPin);
    }
  };

  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const { id, nameEN, nameTH, price, trackStock, currentStock, lowStockThreshold, image } = editingItem;
    const finalPrice = (price === undefined || price === "" || isNaN(Number(price))) ? 10 : Number(price);
    if ((!nameEN && !nameTH) || finalPrice < 0 || !image) {
      triggerToast("Please provide at least one name and all other required fields.");
      return;
    }
    
    const finalNameEN = nameEN || nameTH || "Item";
    const finalNameTH = nameTH || nameEN || "Item";

    let updatedMenuItems: MenuItem[] = [];
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
    }

    setMenuItems(updatedMenuItems);
    localStorage.setItem("slippro_stock_v2", JSON.stringify(updatedMenuItems));
    setEditingItem(null);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
    const updated = safeMenuItems.filter(item => item && item.id !== itemId);
    setMenuItems(updated);
    localStorage.setItem("slippro_stock_v2", JSON.stringify(updated));
    
    // Clean from active cart
    setCart(prev => {
      const safeCart = Array.isArray(prev) ? prev : [];
      return safeCart.filter(c => c && c.menuItem && c.menuItem.id !== itemId);
    });
    
    triggerToast("Item deleted successfully!");
    setEditingItem(null);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("slippro_shop_profile_v1", JSON.stringify(shopProfile));
    triggerToast("Shop profile saved successfully!");
  };

  const handleAddCustomShoppingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customShoppingItem.trim()) return;
    const safeList = Array.isArray(customShoppingList) ? customShoppingList : [];
    const updated = [...safeList, customShoppingItem.trim()];
    setCustomShoppingList(updated);
    localStorage.setItem("slippro_custom_shopping_v1", JSON.stringify(updated));
    setCustomShoppingItem("");
  };

  const handleRemoveCustomShoppingItem = (index: number) => {
    const safeList = Array.isArray(customShoppingList) ? customShoppingList : [];
    const updated = safeList.filter((_, i) => i !== index);
    setCustomShoppingList(updated);
    localStorage.setItem("slippro_custom_shopping_v1", JSON.stringify(updated));
  };

  const handleClearShift = () => {
    // Preserve transactions, only clear the custom shopping list for the new shift/day
    setCustomShoppingList([]);
    localStorage.setItem("slippro_custom_shopping_v1", JSON.stringify([]));

    setShowClearShiftConfirm(false);
    triggerToast(t.shiftClearedToast);
  };

  // Date shift helper
  const handleShiftDate = (days: number) => {
    const [y, m, d] = selectedReportDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    setSelectedReportDate(getLocalDateString(dt));
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString(lang === "en" ? "en-US" : "th-TH", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Selected date data aggregations
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeRestockEvents = Array.isArray(restockEvents) ? restockEvents : [];
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];

  const dayTx = safeTransactions.filter(tx => {
    if (!tx) return false;
    if (tx.date) return tx.date === selectedReportDate;
    const txDate = tx.timestamp ? tx.timestamp.split(" @ ")[0] : "";
    return txDate === selectedReportDate || (typeof tx.timestamp === "string" && tx.timestamp.includes(selectedReportDate));
  });

  const dayRestocks = safeRestockEvents.filter(r => r && r.date === selectedReportDate);

  const cashTx = dayTx.filter(tx => tx && tx.paymentMethod === "เงินสด");
  const cashTotal = cashTx.reduce((sum, tx) => sum + (tx.total || 0), 0);
  const transferTx = dayTx.filter(tx => tx && tx.paymentMethod === "เงินโอน");
  const transferTotal = transferTx.reduce((sum, tx) => sum + (tx.total || 0), 0);
  const onlineTx = dayTx.filter(tx => tx && tx.paymentMethod === "ออนไลน์");
  const onlineTotal = onlineTx.reduce((sum, tx) => sum + (tx.total || 0), 0);
  const totalEarnings = cashTotal + transferTotal; // Exclude onlineTotal since online prices vary
  const totalOrders = dayTx.length;
  const totalRestockedUnits = dayRestocks.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalRestockEventsCount = dayRestocks.length;

  // Itemized sales for Cake Chart
  const itemizedMap: { [key: string]: { name: string; image: string; quantity: number; total: number } } = {};
  dayTx.forEach(tx => {
    (Array.isArray(tx?.items) ? tx.items : []).forEach(it => {
      if (!it) return;
      const name = lang === "en" ? (it.nameEN || it.nameTH || "") : (it.nameTH || it.nameEN || "");
      const key = it.nameEN || it.nameTH || "item";
      const menuItemMatch = safeMenuItems.find(m => m && (m.nameEN === it.nameEN || m.nameTH === it.nameTH));
      const img = menuItemMatch?.image || "📦";
      if (!itemizedMap[key]) {
        itemizedMap[key] = { name, image: img, quantity: 0, total: 0 };
      }
      itemizedMap[key].quantity += (it.quantity || 0);
      itemizedMap[key].total += ((it.price || 0) * (it.quantity || 0));
    });
  });
  const daySalesItemized = Object.values(itemizedMap).sort((a, b) => b.quantity - a.quantity);
  const totalSoldUnits = daySalesItemized.reduce((sum, it) => sum + it.quantity, 0);

  const cakeSlices: CakeChartSlice[] = daySalesItemized.map((it, idx) => ({
    name: it.name,
    image: it.image,
    quantity: it.quantity,
    revenue: it.total,
    color: CAKE_PALETTE[idx % CAKE_PALETTE.length],
    percentage: totalSoldUnits > 0 ? Math.round((it.quantity / totalSoldUnits) * 100) : 0,
  }));

  // Daily Stock Balance Rows
  const openingMap = getOpeningStockForDate(selectedReportDate) || {};
  const allSoldItems = dayTx.flatMap(tx => (Array.isArray(tx?.items) ? tx.items : []));
  const dailyStockRows: DailyStockRow[] = safeMenuItems
    .filter(m => m && m.trackStock)
    .map(item => {
      const openingStock = openingMap[item.id] !== undefined ? openingMap[item.id] : item.currentStock;
      const restocked = (dayRestocks || [])
        .filter(r => r && r.itemId === item.id && r.type !== "spoilage")
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      const spoiled = (dayRestocks || [])
        .filter(r => r && r.itemId === item.id && r.type === "spoilage")
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      const sold = allSoldItems
        .filter(it => it && (it.nameEN === item.nameEN || it.nameTH === item.nameTH))
        .reduce((sum, it) => sum + (it.quantity || 0), 0);
      const closingStock = selectedReportDate === getLocalDateString()
        ? item.currentStock
        : Math.max(0, openingStock + restocked - sold - spoiled);

      return {
        itemId: item.id,
        itemName: lang === "en" ? item.nameEN : item.nameTH,
        image: item.image,
        openingStock,
        restocked,
        sold,
        spoiled,
        closingStock,
      };
    });

  // Daily Timeline Events
  const timelineSales: TimelineEvent[] = dayTx.map(tx => {
    const timeStr = tx.time || (typeof tx.timestamp === "string" && tx.timestamp.includes(" @ ") ? tx.timestamp.split(" @ ")[1] : (tx.timestamp || ""));
    return {
      type: "sale",
      id: tx.id,
      time: timeStr,
      rawTimestamp: tx.rawTimestamp || (tx.id?.startsWith("txn_") ? parseInt(tx.id.replace("txn_", "")) : 0),
      paymentMethod: tx.paymentMethod || "เงินสด",
      total: tx.total || 0,
      items: Array.isArray(tx.items) ? tx.items : [],
      hasSlip: !!tx.slipThumbnail,
    };
  });

  const timelineRestocks: TimelineEvent[] = dayRestocks.map(r => ({
    type: "restock",
    id: r.id,
    time: r.time,
    rawTimestamp: r.rawTimestamp,
    event: r,
  }));

  const dayTimelineEvents: TimelineEvent[] = [...timelineSales, ...timelineRestocks].sort(
    (a, b) => (b.rawTimestamp || 0) - (a.rawTimestamp || 0)
  );

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);

    try {
      await generateDailyPdfReport({
        dateStr: selectedReportDate,
        formattedDate: formatDisplayDate(selectedReportDate),
        shopProfile,
        cashTotal,
        cashCount: cashTx.length,
        transferTotal,
        transferCount: transferTx.length,
        onlineTotal,
        onlineCount: onlineTx.length,
        totalEarnings,
        totalOrders,
        totalRestockedUnits,
        totalRestockEvents: totalRestockEventsCount,
        cakeSlices,
        totalSoldUnits,
        stockRows: dailyStockRows,
        timelineEvents: dayTimelineEvents,
        customShoppingList,
        menuItems,
        lang,
      });
      triggerToast(lang === "en" ? "PDF Report Downloaded!" : "ดาวน์โหลดรายงานสำเร็จ!");
    } catch (e) {
      console.error("PDF generation failed: ", e);
      triggerToast(lang === "en" ? "PDF Export failed" : "การสร้าง PDF ผิดพลาด");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleExportConfig = async () => {
    const config = {
      shopProfile,
      menuItems
    };
    try {
      const jsonStr = JSON.stringify(config);
      const dataUrl = await QRCode.toDataURL(jsonStr, { width: 300, margin: 2 });
      setQrCodeDataUrl(dataUrl);
      triggerToast("QR Code generated successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to generate QR Code");
    }
  };

  const handleQrFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError(null);
    try {
      let hiddenContainer = document.getElementById("qr-reader-hidden");
      if (!hiddenContainer) {
        hiddenContainer = document.createElement("div");
        hiddenContainer.id = "qr-reader-hidden";
        hiddenContainer.style.display = "none";
        document.body.appendChild(hiddenContainer);
      }

      const html5QrCode = new Html5Qrcode("qr-reader-hidden");
      const decodedText = await html5QrCode.scanFile(file, true);
      const success = importConfigJson(decodedText);
      if (success) {
        setShowManagerModal(false);
      }
      html5QrCode.clear();
    } catch (err) {
      console.error(err);
      setScanError(t.scanFailed);
      triggerToast("QR decoding failed");
    }
  };

  const startCameraScan = async () => {
    setScanError(null);
    setIsCameraScanning(true);
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader-camera");
        html5QrCodeRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            const success = importConfigJson(decodedText);
            if (success) {
              stopCameraScan();
              setShowManagerModal(false);
            }
          },
          (errorMessage) => {
            // Normal scan noise
          }
        );
      } catch (err: any) {
        console.error(err);
        setScanError("Camera scan failed. Use QR file import instead.");
        setIsCameraScanning(false);
      }
    }, 300);
  };

  const stopCameraScan = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {}
    }
    setIsCameraScanning(false);
  };

  const importConfigJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === "object") {
        if (parsed.shopProfile && typeof parsed.shopProfile === "object" && Array.isArray(parsed.menuItems)) {
          setShopProfile(parsed.shopProfile);
          setMenuItems(parsed.menuItems);
          localStorage.setItem("slippro_shop_profile_v1", JSON.stringify(parsed.shopProfile));
          localStorage.setItem("slippro_stock_v2", JSON.stringify(parsed.menuItems));
          triggerToast(t.scanSuccess);
          setQrCodeDataUrl(null);
          return true;
        }
      }
      throw new Error("Invalid format");
    } catch (err) {
      setScanError(t.scanFailed);
      triggerToast(t.scanFailed);
      return false;
    }
  };

  const lowStockMenuItems = (Array.isArray(menuItems) ? menuItems : []).filter(item => item.trackStock && item.currentStock < item.lowStockThreshold);
  const lowStockItemsCount = lowStockMenuItems.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Modern POS App Container */}
      <div className="w-full max-w-[1600px] mx-auto bg-white shadow-xl flex flex-col min-h-screen relative z-10 transition-all">
        
        {/* Dynamic Header */}
        <header className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
              <Share2 className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <div>
              <h1 id="app-title" className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1.5 leading-none">
                {t.appTitle}
                <button
                  type="button"
                  id="app-version-badge"
                  onClick={() => checkForUpdates(true)}
                  title={`${t.checkForUpdates} (SlipPro v${APP_VERSION})`}
                  className="text-[9px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-mono uppercase tracking-wider font-bold border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${updateInfo.available ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`}></span>
                  <span>v{APP_VERSION}</span>
                  {isCheckingUpdate && (
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-slate-500" />
                  )}
                </button>
              </h1>
              <p className="text-[10px] text-slate-400 font-sans tracking-wide mt-0.5">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Bilingual Support toggle button */}
            <button
              id="lang-toggle-btn"
              onClick={() => setLang(lang === "en" ? "th" : "en")}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-full uppercase transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <span>{lang.toUpperCase()}</span>
            </button>
            
            {/* Quick Restock for simulation ease */}
            <button
              id="restock-btn"
              disabled
              onClick={() => setShowRestockConfirm(true)}
              title={t.resetStockButton}
              className="hidden p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-slate-500 hover:text-slate-900 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Manager Settings Sub-menu (Gear button) */}
            <button
              id="settings-btn"
              onClick={() => setShowPinModal(true)}
              title={t.managerModalTitle}
              className="p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-slate-500 hover:text-slate-900 cursor-pointer active:scale-95"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Scrollable Main Interface */}
        <main className={`flex-1 overflow-y-auto ${
          activeTab === 'register' 
            ? 'px-6 py-6 space-y-6 pb-32' 
            : activeTab === 'checkout' 
              ? 'pb-24' 
              : activeTab === 'history' 
                ? 'pb-14' 
                : activeTab === 'restock'
                  ? 'pb-14'
                  : 'px-6 py-6 space-y-6 pb-32'
        }`}>
          
          {activeTab === "register" && (
            <div className="space-y-6">
          
          {/* Quick-Tap Grid of Menu Items */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 id="menu-label" className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                {t.quickTapMenu}
              </h2>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder={lang === "en" ? "Search items..." : "ค้นหาเมนู..."}
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" id="menu-grid">
              {menuItems.filter(item => 
                item.nameEN.toLowerCase().includes(menuSearchQuery.toLowerCase()) || 
                item.nameTH.toLowerCase().includes(menuSearchQuery.toLowerCase())
              ).map(item => {
                const isOutOfStock = item.trackStock && item.currentStock <= 0;
                const isLowStock = item.trackStock && item.currentStock > 0 && item.currentStock <= item.lowStockThreshold;
                const itemLabel = lang === "en" ? item.nameEN : item.nameTH;
                
                // Find quantity in current cart
                const cartQty = cart.find(c => c.menuItem.id === item.id)?.quantity || 0;

                return (
                  <motion.button
                    id={`menu-item-${item.id}`}
                    key={item.id}
                    disabled={isOutOfStock}
                    onClick={() => handleAddToCart(item)}
                    whileTap={{ scale: isOutOfStock ? 1 : 0.96 }}
                    className={`relative p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all overflow-hidden ${
                      isOutOfStock 
                        ? "bg-slate-50/40 border-slate-100 opacity-50 cursor-not-allowed" 
                        : "bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-900 cursor-pointer group shadow-sm hover:shadow"
                    }`}
                  >
                    {/* Top Row: Visual & Price Tag */}
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div className="text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{item.image}</div>
                      <div className="bg-slate-900 text-white px-2 py-0.5 rounded-lg text-xs font-mono font-bold">
                        {t.thb}{item.price}
                      </div>
                    </div>

                    {/* Middle Row: Name and Cart Indicator */}
                    <div className="mb-2 relative z-10">
                      <h3 className="text-xs font-black uppercase text-slate-900 group-hover:text-slate-950 line-clamp-1">
                        {itemLabel}
                      </h3>
                    </div>

                    {/* Bottom Row: Stock Levels & Count Badge */}
                    <div className="flex items-center justify-between mt-auto relative z-10">
                      <div className="text-[10px] font-mono flex items-center gap-1.5">
                        <span className="text-slate-400">{t.stockLabel}:</span>
                        {item.trackStock ? (
                          <span className={`font-bold ${isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-emerald-600"}`}>
                            {item.currentStock}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-sans">{t.noLimit}</span>
                        )}
                      </div>

                      {/* Active count in cart indicator */}
                      <AnimatePresence>
                        {cartQty > 0 && (
                          <motion.span 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="bg-slate-900 text-white font-bold font-mono text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                          >
                            {cartQty}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Stock Warning Banners inside card */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/90 flex items-center justify-center p-2">
                        <span className="text-red-600 font-bold text-xs uppercase tracking-wider font-display border border-red-200 px-2.5 py-1 rounded-xl bg-red-50">
                          {t.outOfStock}
                        </span>
                      </div>
                    )}

                    {isLowStock && !isOutOfStock && (
                      <div className="absolute top-1.5 left-1.5">
                        <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200 uppercase">
                          {t.lowStockBadge}
                        </span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Removed Cart and Camera from register */}
            </div>
          )}

          {activeTab === "checkout" && (
            <div className="flex flex-col min-h-full bg-slate-50">
              {/* Header with back button */}
              <div className="w-full p-4 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <button onClick={() => setActiveTab("register")} className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold text-xs uppercase cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> {lang === "th" ? "ย้อนกลับ" : "Back"}
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">{lang === "th" ? "ชำระเงิน" : "Checkout"}</span>
                <div className="w-10"></div>
              </div>

              <div className="flex-1">
                {/* Dynamic Interactive Shopping Cart */}
                <section id="cart-section" className="bg-white p-5 border-b border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <h3 id="cart-label" className="text-xs font-bold uppercase text-slate-900">
                        {t.cartTitle}
                      </h3>
                      <span id="cart-count" className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-mono font-bold">
                        {cart.reduce((acc, curr) => acc + curr.quantity, 0)} {t.items}
                      </span>
                    </div>

                    {cart.length > 0 && (
                      <button
                        id="clear-cart-btn"
                        onClick={handleClearCart}
                        className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-md transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t.clearCartButton}</span>
                      </button>
                    )}
                  </div>

                  {/* Cart Status List */}
                  <div id="cart-items" className="space-y-3 pr-1">
                    <AnimatePresence initial={false}>
                      {cart.length === 0 ? (
                        <motion.div 
                          id="empty-msg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="py-6 text-center text-slate-400 italic text-xs"
                        >
                          {t.emptyCart}
                        </motion.div>
                      ) : (
                        cart.map(c => {
                          const itemLabel = lang === "en" ? c.menuItem.nameEN : c.nameTH || c.menuItem.nameTH;
                          const exceedsStock = isItemExceedingStock(c);
                          const currentInDb = menuItems.find(m => m.id === c.menuItem.id);

                          return (
                            <motion.div
                              id={`cart-item-${c.menuItem.id}`}
                              key={c.menuItem.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -50 }}
                              className={`flex flex-col p-3 rounded-xl border transition-all ${
                                exceedsStock 
                                  ? "bg-amber-50 border-amber-300" 
                                  : "bg-slate-50 border-slate-200 shadow-sm"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-2xl">{c.menuItem.image}</span>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-950 line-clamp-1">{itemLabel}</h4>
                                    <p className="text-[10px] text-slate-500 font-mono">
                                      {t.thb}{c.menuItem.price} / {t.itemSingle}
                                    </p>
                                  </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-1.5">
                                  <button
                                    id={`decrease-qty-${c.menuItem.id}`}
                                    onClick={() => handleDecreaseQuantity(c.menuItem.id)}
                                    className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  
                                  <span className="w-6 text-center text-xs font-mono font-bold text-slate-900">
                                    {c.quantity}
                                  </span>

                                  <button
                                    id={`increase-qty-${c.menuItem.id}`}
                                    onClick={() => handleIncreaseQuantity(c.menuItem.id)}
                                    className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {exceedsStock && currentInDb && (
                                <div className="mt-2 pt-2 border-t border-amber-200 flex items-center gap-1.5 text-[10px] text-amber-700 font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5] shrink-0 text-amber-600" />
                                  <span>
                                    {t.warningExceedsStock} (Available: {currentInDb.currentStock})
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Total Section */}
                  {cart.length > 0 && (
                    <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-between">
                      <div>
                        <span id="total-label" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                          {t.totalAmount.toUpperCase()}
                        </span>
                        <div id="total-price" className="text-2xl font-black text-slate-900 flex items-baseline gap-1 leading-none mt-1">
                          <span className="text-sm font-medium">{t.thb}</span>
                          <span id="cart-total-value">{cartTotal}</span>
                        </div>
                      </div>

                      <div className="text-right text-[10px] text-slate-500 font-mono font-bold">
                        {cart.reduce((acc, curr) => acc + curr.quantity, 0)} {t.items.toUpperCase()}
                      </div>
                    </div>
                  )}
                </section>

                {/* Dynamic stock alert banner if overall cart has issue */}
                {doesCartExceedStock() && (
                  <div className="px-5 py-3 bg-white border-b border-slate-200">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-red-700 text-xs shadow-sm"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2.5] text-red-600" />
                      <div>
                        <p className="font-bold">{t.warningExceedsStock}</p>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Camera File Snap Section */}
                <section className="bg-white p-5 space-y-4">
                  <h2 className="text-xs font-bold uppercase text-slate-900 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-slate-900" />
                    <span>{t.cameraSection}</span>
                  </h2>

                  {/* Hidden Input capturing environments natively */}
                  <input
                    id="slip-camera-input"
                    type="file"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {!capturedSlip ? (
                    <button
                      id="snap-slip-btn"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center hover:bg-slate-50 bg-slate-50/50 transition-all cursor-pointer group"
                    >
                      <div id="upload-placeholder" className="flex flex-col items-center">
                        <span className="text-3xl group-hover:scale-110 transition-transform">📸</span>
                        <span id="upload-label" className="text-[10px] font-bold mt-3 text-slate-500 uppercase tracking-wider">
                          {t.snapButton.toUpperCase()}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {/* Thumbnail Preview Area */}
                      <div 
                        onClick={() => setFullScreenImage(capturedSlip)}
                        className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-950 aspect-video flex items-center justify-center cursor-zoom-in group/preview hover:border-slate-400 transition-all"
                      >
                        <img
                          id="slip-preview"
                          src={capturedSlip}
                          alt="Captured slip thumbnail"
                          className="max-h-full max-w-full object-contain group-hover/preview:scale-[1.02] transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                          <span className="text-white text-xs font-bold bg-black/60 px-2.5 py-1.5 rounded-lg opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>View Full Size</span>
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                        
                        {/* Status Banner */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                          <div className="flex items-center gap-1 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg">
                            <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-400" />
                            <span>{t.slipCaptured}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          id="retake-slip-btn"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                          <span>{t.retakeButton}</span>
                        </button>

                        <button
                          id="remove-slip-btn"
                          onClick={handleRemoveSlip}
                          className="p-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-all flex items-center justify-center cursor-pointer"
                          title={t.removeSlip}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* Payment Method Selector Section */}
                <section id="payment-method-section" className={`bg-white p-5 space-y-3.5 border-t border-slate-100 transition-all ${paymentMethodError ? 'ring-2 ring-red-500 rounded-2xl bg-red-50/20' : ''}`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-900" />
                      <span>{t.paymentMethodSection}</span>
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                      * {lang === "en" ? "Required" : "จำเป็นต้องเลือก"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    {t.paymentMethodPrompt}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Cash Option Button */}
                    <button
                      type="button"
                      id="payment-method-cash"
                      onClick={() => {
                        setPaymentMethod("เงินสด");
                        setPaymentMethodError(false);
                      }}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === "เงินสด"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-md shadow-emerald-600/10 scale-[1.02]"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700 hover:bg-slate-50 active:scale-98"
                      }`}
                    >
                      <span className="text-3xl">💵</span>
                      <div className="text-center">
                        <span className="block text-sm font-black tracking-tight">{lang === "th" ? "เงินสด" : "Cash"}</span>
                        {lang === "en" && (
                          <span className="block text-[10px] font-bold text-slate-500 uppercase mt-0.5">Cash</span>
                        )}
                      </div>
                      {paymentMethod === "เงินสด" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3 stroke-[3]" /> {lang === "en" ? "Selected" : "เลือกแล้ว"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">{lang === "en" ? "Tap to choose" : "แตะเพื่อเลือก"}</span>
                      )}
                    </button>

                    {/* Transfer Option Button */}
                    <button
                      type="button"
                      id="payment-method-transfer"
                      onClick={() => {
                        setPaymentMethod("เงินโอน");
                        setPaymentMethodError(false);
                      }}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === "เงินโอน"
                          ? "border-blue-600 bg-blue-50 text-blue-950 shadow-md shadow-blue-600/10 scale-[1.02]"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700 hover:bg-slate-50 active:scale-98"
                      }`}
                    >
                      <span className="text-3xl">📲</span>
                      <div className="text-center">
                        <span className="block text-sm font-black tracking-tight">{lang === "th" ? "เงินโอน" : "Transfer"}</span>
                        {lang === "en" && (
                          <span className="block text-[10px] font-bold text-slate-500 uppercase mt-0.5">Transfer</span>
                        )}
                      </div>
                      {paymentMethod === "เงินโอน" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                          <Check className="w-3 h-3 stroke-[3]" /> {lang === "en" ? "Selected" : "เลือกแล้ว"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">{lang === "en" ? "Tap to choose" : "แตะเพื่อเลือก"}</span>
                      )}
                    </button>

                    {/* Online Option Button */}
                    <button
                      type="button"
                      id="payment-method-online"
                      onClick={() => {
                        setPaymentMethod("ออนไลน์");
                        setPaymentMethodError(false);
                      }}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === "ออนไลน์"
                          ? "border-purple-600 bg-purple-50 text-purple-950 shadow-md shadow-purple-600/10 scale-[1.02]"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700 hover:bg-slate-50 active:scale-98"
                      }`}
                    >
                      <span className="text-3xl">🌐</span>
                      <div className="text-center">
                        <span className="block text-sm font-black tracking-tight">{lang === "th" ? "ออนไลน์" : "Online"}</span>
                        {lang === "en" && (
                          <span className="block text-[10px] font-bold text-slate-500 uppercase mt-0.5">Online</span>
                        )}
                      </div>
                      {paymentMethod === "ออนไลน์" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200">
                          <Check className="w-3 h-3 stroke-[3]" /> {lang === "en" ? "Selected" : "เลือกแล้ว"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">{lang === "en" ? "Tap to choose" : "แตะเพื่อเลือก"}</span>
                      )}
                    </button>
                  </div>

                  {paymentMethodError && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{t.paymentMethodRequired}</span>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {activeTab === "history" && (() => {
            const historyDayTx = safeTransactions.filter(tx => {
              if (!tx) return false;
              if (tx.date) return tx.date === selectedHistoryDate;
              const txDate = tx.timestamp ? tx.timestamp.split(" @ ")[0] : "";
              return txDate === selectedHistoryDate || (typeof tx.timestamp === "string" && tx.timestamp.includes(selectedHistoryDate));
            });
            const pageSize = 10;
            const totalPages = Math.ceil(historyDayTx.length / pageSize) || 1;
            const currentHistoryPage = Math.min(historyPage, totalPages);
            const startIndex = (currentHistoryPage - 1) * pageSize;
            const visibleTx = historyDayTx.slice(startIndex, startIndex + pageSize);

            return (
            <div className="flex flex-col min-h-full bg-slate-50">
              <div className="w-full p-5 flex items-center justify-between bg-slate-900 text-white sticky top-0 z-10 shadow-md">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider">
                        {t.transactionHistory}
                      </h2>
                      <p className="text-[10px] text-slate-300 font-semibold uppercase font-mono mt-0.5">
                        {historyDayTx.length} {lang === "th" ? "รายการ" : "LOGS"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date Navigation Bar for History */}
                <div className="bg-white border-b border-slate-200/80 p-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      const [y, m, d] = selectedHistoryDate.split("-").map(Number);
                      const dt = new Date(y, m - 1, d);
                      dt.setDate(dt.getDate() - 1);
                      setSelectedHistoryDate(getLocalDateString(dt));
                      setHistoryPage(1);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <div className="flex-1 flex items-center justify-center gap-2">
                    <div className="relative flex items-center">
                      <Calendar className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                      <input
                        type="date"
                        value={selectedHistoryDate}
                        max={getLocalDateString()}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedHistoryDate(e.target.value);
                            setHistoryPage(1);
                          }
                        }}
                        className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const [y, m, d] = selectedHistoryDate.split("-").map(Number);
                      const dt = new Date(y, m - 1, d);
                      dt.setDate(dt.getDate() + 1);
                      setSelectedHistoryDate(getLocalDateString(dt));
                      setHistoryPage(1);
                    }}
                    disabled={selectedHistoryDate >= getLocalDateString()}
                    className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                      selectedHistoryDate >= getLocalDateString()
                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 cursor-pointer"
                    }`}
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                <div className="bg-white divide-y divide-slate-100 flex-1" id="transaction-history-list">
                  {historyDayTx.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center space-y-3 opacity-60">
                      <History className="w-8 h-8 text-slate-300" />
                      <p className="text-sm text-slate-400 italic font-medium">{t.noTransactions}</p>
                    </div>
                  ) : (
                    visibleTx.map((tx, idx) => {
                      const isTransfer = tx.paymentMethod === "เงินโอน" || (!tx.paymentMethod && !!tx.slipThumbnail);
                      return (
                        <div id={`tx-${tx.id}`} key={tx.id || idx} className="p-5 space-y-3.5 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 font-semibold">
                                <Clock className="w-3.5 h-3.5" />
                                {tx.timestamp}
                              </span>
                              {/* Payment Method Badge */}
                              <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                tx.paymentMethod === "ออนไลน์"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : isTransfer
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                                {tx.paymentMethod === "ออนไลน์" ? (lang === "th" ? "🌐 ออนไลน์" : "🌐 Online") : isTransfer ? (lang === "th" ? "📲 เงินโอน" : "📲 Transfer") : (lang === "th" ? "💵 เงินสด" : "💵 Cash")}
                              </span>
                            </div>
                            <span className="text-sm font-mono font-black text-slate-900 bg-slate-100 text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200">
                              {tx.paymentMethod === "ออนไลน์" ? (lang === "th" ? "ไม่ระบุ" : "N/A") : `${t.thb}${tx.total}`}
                            </span>
                          </div>

                          {/* List items sold */}
                          <div className="space-y-2 pl-3 border-l-2 border-slate-100">
                            {tx.items.map((it, i) => (
                              <p key={i} className="text-xs text-slate-600 font-medium flex justify-between items-center">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-slate-300 block"></span>
                                  {lang === "en" ? it.nameEN : it.nameTH} 
                                  <span className="font-bold text-slate-900 text-[10px] bg-slate-100 px-1.5 rounded">x{it.quantity}</span>
                                </span>
                                <span className="font-mono text-slate-400 text-[11px]">{t.thb}{it.price * it.quantity}</span>
                              </p>
                            ))}
                          </div>

                          {/* Slip status & actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-[10px]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-slate-500 flex items-center gap-1.5">
                                {tx.slipThumbnail ? (
                                  <>
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                                    <span className="text-slate-700 font-bold uppercase tracking-wider">{t.slipAttached}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="inline-block w-2 h-2 rounded-full bg-slate-300"></span>
                                    <span className="text-slate-400 font-semibold uppercase tracking-wider">{t.slipNotAttached}</span>
                                  </>
                                )}
                              </span>

                              {tx.lowStockAlerts && tx.lowStockAlerts.length > 0 && (
                                <span className="text-red-600 font-black tracking-wider text-[9px] px-2 py-0.5 bg-red-50 border border-red-200 rounded-md uppercase">
                                  {t.lowStockAlertText}
                                </span>
                              )}
                            </div>

                            {/* Share to LINE Button */}
                            <button
                              type="button"
                              id={`resend-line-${tx.id}`}
                              onClick={() => handleResendToLine(tx)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-[11px] cursor-pointer shadow-sm shadow-[#06C755]/20 transition-all active:scale-95"
                            >
                              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{t.resendToLine}</span>
                            </button>
                          </div>

                          {/* Slip Thumbnail in history */}
                          {tx.slipThumbnail && (
                            <div className="pt-2">
                              <details className="cursor-pointer group bg-slate-50 rounded-xl p-2.5 border border-slate-200/60 hover:border-slate-300 transition-colors">
                                <summary className="text-[10px] text-slate-600 hover:text-slate-900 flex items-center gap-1.5 select-none font-bold uppercase tracking-wider">
                                  <ImageIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                                  <span>{lang === "th" ? "ดูรูปภาพสลิปที่แนบ" : "View Captured Slip"}</span>
                                </summary>
                                <div 
                                  className="mt-3 rounded-xl overflow-hidden bg-white max-w-[240px] shadow-sm border border-slate-200 cursor-zoom-in group/history-img relative"
                                  onClick={() => setFullScreenImage(tx.slipThumbnail)}
                                >
                                  <img
                                    src={tx.slipThumbnail}
                                    alt="Captured receipt attachment"
                                    className="w-full object-contain aspect-square group-hover/history-img:scale-[1.02] transition-transform"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover/history-img:bg-black/20 transition-colors flex items-center justify-center">
                                    <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-lg opacity-0 group-hover/history-img:opacity-100 transition-opacity flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3" />
                                      <span>{lang === "th" ? "ดูภาพ" : "View"}</span>
                                    </span>
                                  </div>
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                      <button
                        disabled={currentHistoryPage <= 1}
                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {lang === "th" ? "ก่อนหน้า" : "Prev"}
                      </button>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {currentHistoryPage} / {totalPages}
                      </span>
                      <button
                        disabled={currentHistoryPage >= totalPages}
                        onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {lang === "th" ? "ถัดไป" : "Next"}
                      </button>
                    </div>
                  )}
                </div>
            </div>
            );
          })()}



          {activeTab === "zreport" && (
            <div className="space-y-6">
              {/* Date Navigation Bar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-2">
                <button
                  id="prev-date-btn"
                  onClick={() => handleShiftDate(-1)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                  title={lang === "th" ? "วันก่อนหน้า" : "Previous Day"}
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>

                <div className="flex-1 flex items-center justify-center gap-2">
                  <div className="relative flex items-center">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                    <input
                      id="report-date-picker"
                      type="date"
                      value={selectedReportDate}
                      max={getLocalDateString()}
                      onChange={(e) => {
                        if (e.target.value) setSelectedReportDate(e.target.value);
                      }}
                      className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                    />
                  </div>
                  {selectedReportDate !== getLocalDateString() && (
                    <button
                      id="jump-today-btn"
                      onClick={() => setSelectedReportDate(getLocalDateString())}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      {lang === "th" ? "วันนี้" : "Today"}
                    </button>
                  )}
                </div>

                <button
                  id="next-date-btn"
                  onClick={() => handleShiftDate(1)}
                  disabled={selectedReportDate >= getLocalDateString()}
                  className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                    selectedReportDate >= getLocalDateString()
                      ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 cursor-pointer active:scale-95"
                  }`}
                  title={lang === "th" ? "วันถัดไป" : "Next Day"}
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Z-Report Cover Header */}
              <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-32 h-32 bg-slate-800/60 rounded-full pointer-events-none"></div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {t.zReportTitle.split(" (")[0]}
                      </span>
                      {selectedReportDate === getLocalDateString() ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          {lang === "th" ? "รอบขายวันนี้" : "Today Active"}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                          {lang === "th" ? "ข้อมูลย้อนหลัง" : "Archived Record"}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black tracking-tight">{shopProfile.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium line-clamp-1">📍 {shopProfile.address}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDisplayDate(selectedReportDate)}</span>
                  </div>
                  <span className="font-mono text-slate-300 font-bold">{selectedReportDate}</span>
                </div>
              </div>

              {/* Financial Breakdown 4-Grid: All Money Together, Cash, Transfer, Restock */}
              <div className="space-y-3">
                {/* Highlighted Primary Card: All Earnings Together */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-md flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      {t.allEarningsTogether}
                    </span>
                    <p className="text-3xl font-black font-mono tracking-tight text-emerald-400 mt-1">
                      {t.thb}{totalEarnings}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                      {t.totalOrders}: <span className="font-mono font-bold text-white">{totalOrders}</span> {t.items}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl shadow-inner">
                    💰
                  </div>
                </div>

                {/* Sub-cards: Cash, Transfer, Online, Restock */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Cash Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                      <span>💵</span>
                      <span>{t.cashIncome}</span>
                    </div>
                    <p className="text-lg font-black font-mono text-emerald-600 mt-1.5">
                      {t.thb}{cashTotal}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5 font-semibold">
                      {cashTx.length} {lang === "th" ? "บิล" : "tx"}
                    </p>
                  </div>

                  {/* Transfer Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                      <span>📲</span>
                      <span>{t.transferIncome}</span>
                    </div>
                    <p className="text-lg font-black font-mono text-blue-600 mt-1.5">
                      {t.thb}{transferTotal}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5 font-semibold">
                      {transferTx.length} {lang === "th" ? "บิล" : "tx"}
                    </p>
                  </div>

                  {/* Online Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                      <span>🌐</span>
                      <span>{t.onlineIncome}</span>
                    </div>
                    <p className="text-lg font-black font-mono text-purple-600 mt-1.5">
                      {lang === "th" ? "ไม่ระบุ" : "N/A"}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5 font-semibold">
                      {onlineTx.length} {lang === "th" ? "ออเดอร์" : "orders"}
                    </p>
                  </div>

                  {/* Restock Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                      <span>📦</span>
                      <span>{t.restockUnitsCount}</span>
                    </div>
                    <p className="text-lg font-black font-mono text-slate-900 mt-1.5">
                      +{totalRestockedUnits}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5 font-semibold">
                      {totalRestockEventsCount} {lang === "th" ? "ครั้ง" : "times"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons: PDF Download & Clear Shift */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  id="download-pdf-btn"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all uppercase cursor-pointer shadow-md ${
                    isDownloadingPdf 
                      ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed" 
                      : "bg-slate-900 hover:bg-slate-800 text-white active:scale-95 shadow-slate-900/10"
                  }`}
                >
                  <Download className={`w-4 h-4 ${isDownloadingPdf ? "animate-bounce" : ""}`} />
                  <span>{isDownloadingPdf ? t.downloadingPdf : t.downloadPdfBtn}</span>
                </button>

                {selectedReportDate === getLocalDateString() && (
                  <button
                    id="clear-shift-btn"
                    onClick={() => setShowClearShiftConfirm(true)}
                    className="w-full py-3.5 rounded-2xl font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all uppercase cursor-pointer border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t.clearShiftBtn}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "restock" && (
            <div className="flex flex-col min-h-full bg-slate-50 w-full">
              <div className="w-full p-5 flex items-center justify-between bg-slate-900 text-white sticky top-0 z-10 shadow-md">
                <div className="flex items-center gap-3">
                  <PackagePlus className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider">
                      {lang === "th" ? "จัดการคลังสินค้า" : "Stock Management"}
                    </h2>
                    <p className="text-[10px] text-slate-300 font-semibold uppercase font-mono mt-0.5">
                      {selectedReportDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date Navigation for Restock */}
              <div className="bg-white border-b border-slate-200/80 p-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleShiftDate(-1)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>

                <div className="flex-1 flex items-center justify-center gap-2">
                  <div className="relative flex items-center">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                    <input
                      type="date"
                      value={selectedReportDate}
                      max={getLocalDateString()}
                      onChange={(e) => e.target.value && setSelectedReportDate(e.target.value)}
                      className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleShiftDate(1)}
                  disabled={selectedReportDate >= getLocalDateString()}
                  className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                    selectedReportDate >= getLocalDateString()
                      ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 cursor-pointer"
                  }`}
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              <div className="flex flex-col pb-12 bg-slate-50">
                {/* Quick Restock Action Bar */}
                <div className="bg-emerald-50 p-5 flex items-center justify-between border-b border-emerald-100">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-emerald-600" />
                      <span>{t.quickRestock}</span>
                    </h4>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      {lang === "th"
                        ? "บันทึกจำนวนของที่เติมระหว่างวันเพื่อคำนวณคลังเปิด-ปิด"
                        : "Record stock added during the shift for daily balance"}
                    </p>
                  </div>
                  <button
                    id="zreport-quick-restock-btn"
                    onClick={() => {
                      setPreselectedRestockItemId(null);
                      setRestockModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-all active:scale-95 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === "th" ? "เติมสต็อก" : "Restock"}</span>
                  </button>
                </div>

                {/* Daily Stock Balance Table */}
                <DailyStockTable
                  rows={dailyStockRows}
                  lang={lang}
                  onQuickRestock={(itemId) => {
                    setPreselectedRestockItemId(itemId);
                    setRestockModalOpen(true);
                  }}
                />

                {/* Activity Timeline (Orders & Restocks) */}
                <DailyTimeline
                  events={dayTimelineEvents}
                  lang={lang}
                  currencySymbol={t.thb}
                  onViewSlip={(img) => setFullScreenImage(img)}
                />

                {/* Procurement / Shopping Section */}
                {(lowStockMenuItems.length > 0 || customShoppingList.length > 0) && (
                  <div className="bg-white p-5 space-y-3 border-b border-slate-100">
                    <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-black flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <ShoppingCart className="w-3.5 h-3.5 text-slate-900" />
                      <span>{t.shoppingListTitle}</span>
                    </h4>
                    <div className="space-y-2">
                      {lowStockMenuItems.map(it => (
                        <div key={it.id} className="p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{it.image}</span>
                            <div>
                              <p className="font-bold text-red-900">{lang === "en" ? it.nameEN : it.nameTH}</p>
                              <p className="text-[10px] text-red-600 font-mono font-semibold">
                                {t.stockLabel}: {it.currentStock} / {t.minThreshold}: {it.lowStockThreshold}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setPreselectedRestockItemId(it.id);
                              setRestockModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] cursor-pointer"
                          >
                            + {lang === "th" ? "เติม" : "Restock"}
                          </button>
                        </div>
                      ))}
                      {customShoppingList.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">• {item}</span>
                          <button
                            onClick={() => handleRemoveCustomShoppingItem(idx)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>

        {/* Modern Tab Navigation Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4 flex flex-col gap-3 z-40">
          {activeTab === "register" && (
            <button
              onClick={() => setActiveTab("checkout")}
              disabled={cart.length === 0}
              className={`w-full py-3.5 rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-2 uppercase ${
                cart.length === 0 
                  ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed" 
                  : "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-lg shadow-slate-900/10 active:scale-[0.98]"
              }`}
            >
              <span>{t.nextBtn.toUpperCase()}</span>
              {cart.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full">{cart.reduce((a,b)=>a+b.quantity,0)}</span>}
            </button>
          )}

          {activeTab === "checkout" && (
            <button
              id="send-to-boss-btn"
              disabled={cart.length === 0}
              onClick={handleSendToBoss}
              className={`w-full py-3.5 rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-2 uppercase ${
                cart.length === 0 
                  ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed" 
                  : "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-lg shadow-slate-900/10 active:scale-[0.98]"
              }`}
            >
              <span id="send-btn">{t.sendToBossButton.toUpperCase()}</span>
            </button>
          )}

          {activeTab !== "checkout" && (
            <div className="flex items-center justify-around text-slate-400 text-[10px] font-bold pt-1 pb-0.5">
            <button
              id="tab-register-btn"
              onClick={() => setActiveTab("register")}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                activeTab === "register" ? "text-slate-900 font-black scale-105" : "hover:text-slate-600"
              }`}
            >
              <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
              <span>{t.tabRegister}</span>
            </button>

            <button
              id="tab-history-btn"
              onClick={() => setActiveTab("history")}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                activeTab === "history" ? "text-slate-900 font-black scale-105" : "hover:text-slate-600"
              }`}
            >
              <History className="w-5 h-5 stroke-[2.5]" />
              <span>{t.tabHistory}</span>
            </button>

            <button
              id="tab-zreport-btn"
              onClick={() => setActiveTab("zreport")}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                activeTab === "zreport" ? "text-slate-900 font-black scale-105" : "hover:text-slate-600"
              }`}
            >
              <BarChart3 className="w-5 h-5 stroke-[2.5]" />
              <span>{t.tabZReport}</span>
            </button>

            <button
              id="tab-restock-btn"
              onClick={() => setActiveTab("restock")}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                activeTab === "restock" ? "text-slate-900 font-black scale-105" : "hover:text-slate-600"
              }`}
            >
              <PackagePlus className="w-5 h-5 stroke-[2.5]" />
              <span>{lang === "th" ? "คลัง" : "Stock"}</span>
            </button>
          </div>
          )}
        </div>

        {/* Native Simulation Mode Toast Notice */}
        <div className="hidden md:flex items-center justify-center py-1.5 bg-slate-50 border-t border-slate-200/60 text-[10px] text-slate-400 gap-1.5 font-semibold">
          <Smartphone className="w-3.5 h-3.5 text-slate-950" />
          <span>{t.simulationMode}</span>
        </div>

      </div>

      {/* Modern Dialog/Confirm Modal before LINE redirect */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-black tracking-tight text-slate-950">{t.confirmHeader}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {t.confirmBody.replace("{total}", cartTotal.toString())}
                </p>
                {paymentMethod && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    <span>{paymentMethod === "ออนไลน์" ? "🌐 ออนไลน์ (Online)" : paymentMethod === "เงินโอน" ? "📲 เงินโอน (Transfer)" : "💵 เงินสด (Cash)"}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  id="confirm-btn"
                  onClick={confirmAndSend}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs cursor-pointer shadow-lg shadow-slate-900/10 transition-all active:scale-95"
                >
                  {t.confirmBtn}
                </button>
                <button
                  id="cancel-btn"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
                >
                  {t.cancelBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LINE Order Prepared & Sharing Modal */}
      <AnimatePresence>
        {lineOrderModal?.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
            >
              <div className="mx-auto w-14 h-14 rounded-full bg-[#06C755]/10 text-[#06C755] flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black tracking-tight text-slate-950">
                  {t.lineSharePrepared}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {t.lineShareInstructions}
                </p>
              </div>

              {/* Order quick summary box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-left space-y-1.5 text-xs">
                <div className="flex justify-between items-center font-mono">
                  <span className="text-slate-500">{t.totalAmount}:</span>
                  <span className="font-black text-slate-900 text-sm">฿{lineOrderModal.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t.paymentMethodSection}:</span>
                  <span className={`font-bold text-[11px] px-2 py-0.5 rounded ${
                    lineOrderModal.paymentMethod === "ออนไลน์"
                      ? "bg-purple-100 text-purple-800"
                      : lineOrderModal.paymentMethod === "เงินโอน"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {lineOrderModal.paymentMethod === "ออนไลน์" 
                      ? (lang === "th" ? "🌐 ออนไลน์" : "🌐 Online") 
                      : lineOrderModal.paymentMethod === "เงินโอน" 
                        ? (lang === "th" ? "📲 เงินโอน" : "📲 Bank Transfer") 
                        : (lang === "th" ? "💵 เงินสด" : "💵 Cash")}
                  </span>
                </div>
              </div>

              {/* Direct Open LINE button */}
              <div className="space-y-2 pt-1">
                <a
                  id="open-line-app-link"
                  href={lineOrderModal.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#06C755]/20 transition-all active:scale-98"
                >
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                  <span>{t.openLineApp}</span>
                </a>

                {/* Copy order text button */}
                <button
                  type="button"
                  id="copy-order-text-btn"
                  onClick={() => {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(lineOrderModal.message).then(() => {
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      });
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span className="text-emerald-700">{t.copiedSuccess}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>{t.copyOrderText}</span>
                    </>
                  )}
                </button>

                {/* Close / New sale */}
                <button
                  type="button"
                  id="line-modal-close-btn"
                  onClick={() => {
                    setLineOrderModal(null);
                    setActiveTab("register");
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs cursor-pointer transition-all mt-1"
                >
                  {t.newSaleBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear Shift Confirm Modal */}
      <AnimatePresence>
        {showClearShiftConfirm && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-black tracking-tight text-slate-950">{t.confirmClearShiftHeader}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {t.confirmClearShiftBody}
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  id="confirm-clear-shift-btn"
                  onClick={handleClearShift}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer shadow-lg shadow-red-100 transition-all active:scale-95"
                >
                  {t.confirmClearShiftBtn}
                </button>
                <button
                  id="cancel-clear-shift-btn"
                  onClick={() => setShowClearShiftConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
                >
                  {t.cancelBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restock Stock Confirm Modal */}
      <AnimatePresence>
        {showRestockConfirm && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <RotateCcw className="w-5 h-5 stroke-[2.5]" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-black tracking-tight text-slate-950">{t.confirmRestockHeader}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {t.confirmRestockBody}
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  id="confirm-restock-btn"
                  onClick={() => {
                    handleRestock();
                    setShowRestockConfirm(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs cursor-pointer shadow-lg shadow-slate-900/10 transition-all active:scale-95"
                >
                  {t.confirmRestockBtn}
                </button>
                <button
                  id="cancel-restock-btn"
                  onClick={() => setShowRestockConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
                >
                  {t.cancelBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Restock Modal */}
      <QuickRestockModal
        isOpen={restockModalOpen}
        onClose={() => {
          setRestockModalOpen(false);
          setPreselectedRestockItemId(null);
        }}
        items={menuItems}
        menuItems={menuItems}
        onConfirmRestock={handleQuickRestockConfirm}
        lang={lang}
        preselectedItemId={preselectedRestockItemId}
      />

      {/* Hardcoded PIN Verification Modal */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-slate-900" />
                  <span>{t.managerModalTitle}</span>
                </h3>
                <button
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput("");
                    setPinError(null);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePinVerify} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {t.pinPrompt}
                  </label>
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full text-center tracking-[1em] font-black text-xl py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-mono"
                    placeholder="••••"
                    autoFocus
                  />
                  {pinError && (
                    <p className="text-red-500 font-bold text-[11px] text-center">{pinError}</p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs cursor-pointer shadow-lg shadow-slate-900/10 transition-all active:scale-95"
                  >
                    {t.saveBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinModal(false);
                      setPinInput("");
                      setPinError(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
                  >
                    {t.cancelBtn}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Manager Settings Modal */}
      <AnimatePresence>
        {showManagerModal && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white p-6 w-full min-h-screen space-y-6 relative flex flex-col rounded-none"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-white">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      {t.managerModalTitle}
                    </h3>
                    <p className="text-[9px] text-slate-400 uppercase font-mono tracking-widest">{t.configConsole.toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowManagerModal(false);
                    setEditingItem(null);
                    setQrCodeDataUrl(null);
                    stopCameraScan();
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Console Tabs */}
              <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl text-[9px] font-bold uppercase tracking-wider">
                <button
                  onClick={() => setManagerSubTab("profile")}
                  className={`py-2 rounded-lg transition-all ${
                    managerSubTab === "profile" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.subTabProfile}
                </button>
                <button
                  onClick={() => setManagerSubTab("items")}
                  className={`py-2 rounded-lg transition-all ${
                    managerSubTab === "items" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.subTabCatalog}
                </button>
                <button
                  onClick={() => setManagerSubTab("sync")}
                  className={`py-2 rounded-lg transition-all ${
                    managerSubTab === "sync" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.subTabSync}
                </button>
                <button
                  onClick={() => setManagerSubTab("system")}
                  className={`py-2 rounded-lg transition-all relative flex items-center justify-center gap-1 ${
                    managerSubTab === "system" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span>{t.subTabSystem}</span>
                  {updateInfo.available && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                  )}
                </button>
              </div>

              {/* Tab Content rendering */}
              <div className="pt-2">
                {managerSubTab === "profile" && (
                  <form onSubmit={handleSaveProfile} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">{t.shopName}</label>
                      <input
                        type="text"
                        value={shopProfile.name}
                        onChange={(e) => setShopProfile({...shopProfile, name: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-900 bg-slate-50 focus:bg-white transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Timezone</label>
                      <select
                        value={timezone}
                        onChange={(e) => {
                          setTimezoneState(e.target.value);
                          setTimezone(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-900 bg-slate-50 focus:bg-white transition-all"
                      >
                        <option value="Asia/Bangkok">Bangkok (GMT+7)</option>
                        <option value="UTC">UTC</option>
                        <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                        <option value="America/New_York">New York (EST/EDT)</option>
                        <option value="Europe/London">London (GMT/BST)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">{t.shopAddress}</label>
                      <textarea
                        value={shopProfile.address}
                        onChange={(e) => setShopProfile({...shopProfile, address: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-900 bg-slate-50 focus:bg-white transition-all min-h-[60px]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">{(t as any).shopLineId || "LINE ID"}</label>
                      <input
                        type="text"
                        value={(shopProfile as any).lineId || ""}
                        onChange={(e) => setShopProfile({...shopProfile, lineId: e.target.value})}
                        placeholder="@shopname"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-900 bg-slate-50 focus:bg-white transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow transition-all active:scale-95"
                    >
                      {t.saveBtn}
                    </button>
                  </form>
                )}

                {managerSubTab === "items" && (
                  <div>
                    {editingItem ? (
                      <form onSubmit={handleSaveMenuItem} className="space-y-3.5 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <h4 className="text-xs font-black uppercase text-slate-900">
                          {editingItem.id ? t.editMenuItem : t.addMenuItem}
                        </h4>

                        <div className="grid grid-cols-1 gap-2.5">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 block">{lang === "th" ? "ชื่อรายการเมนู (Name)" : "Menu Item Name"}</label>
                            <input
                              type="text"
                              value={editingItem.nameEN || ""}
                              onChange={(e) => setEditingItem({...editingItem, nameEN: e.target.value, nameTH: e.target.value})}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-slate-900"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 block">{t.itemPrice}</label>
                            <input
                              type="number"
                              value={editingItem.price === undefined || editingItem.price === "" ? "" : editingItem.price}
                              onChange={(e) => setEditingItem({...editingItem, price: e.target.value === "" ? "" as any : Number(e.target.value)})}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-slate-900"
                              required
                              min={0}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 block">{t.itemImage}</label>
                            <input
                              type="text"
                              value={editingItem.image || ""}
                              onChange={(e) => setEditingItem({...editingItem, image: e.target.value})}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-center focus:outline-none focus:border-slate-950"
                              required
                              placeholder="☕"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-slate-200/60">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                            <input
                              type="checkbox"
                              checked={!!editingItem.trackStock}
                              onChange={(e) => setEditingItem({
                                ...editingItem,
                                trackStock: e.target.checked,
                                currentStock: e.target.checked ? 10 : 99,
                                lowStockThreshold: e.target.checked ? 2 : 0
                              })}
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span>{t.trackStock}</span>
                          </label>

                          {editingItem.trackStock && (
                            <div className="grid grid-cols-2 gap-2.5 bg-white border border-slate-100 rounded-xl p-3 shadow-inner">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-400 block">{t.currentStock}</label>
                                <input
                                  type="number"
                                  value={editingItem.currentStock === undefined || editingItem.currentStock === "" ? "" : editingItem.currentStock}
                                  onChange={(e) => setEditingItem({...editingItem, currentStock: e.target.value === "" ? "" as any : Number(e.target.value)})}
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
                                  required
                                  min={0}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-400 block">{t.lowStockThreshold}</label>
                                <input
                                  type="number"
                                  value={editingItem.lowStockThreshold === undefined || editingItem.lowStockThreshold === "" ? "" : editingItem.lowStockThreshold}
                                  onChange={(e) => setEditingItem({...editingItem, lowStockThreshold: e.target.value === "" ? "" as any : Number(e.target.value)})}
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
                                  required
                                  min={0}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                          <button
                            type="submit"
                            className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                          >
                            {t.saveBtn}
                          </button>
                          {editingItem.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMenuItem(editingItem.id!)}
                              className="py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs rounded-xl"
                            >
                              {t.deleteBtn}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs"
                          >
                            {t.cancelBtn}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400">{t.currentCatalog}</span>
                          <button
                            type="button"
                            onClick={() => setEditingItem({ price: 10, trackStock: false, currentStock: 99, lowStockThreshold: 0, image: "🍡" })}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t.addItemBtn}</span>
                          </button>
                        </div>

                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                          {menuItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2.5 border border-slate-100 bg-slate-50 rounded-xl">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{item.image}</span>
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{lang === "en" ? item.nameEN : item.nameTH}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {t.thb}{item.price} • {item.trackStock ? `${t.stockLabel}: ${item.currentStock}` : t.noStockLimit}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditingItem(item)}
                                className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all cursor-pointer"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {managerSubTab === "sync" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleExportConfig}
                        className="py-3 px-3.5 border border-slate-200 hover:border-slate-900 bg-slate-50 hover:bg-white rounded-xl text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <QrCode className="w-5 h-5 text-slate-900" />
                        <span>{t.exportSetupBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => qrFileInputRef.current?.click()}
                        className="py-3 px-3.5 border border-slate-200 hover:border-slate-900 bg-slate-50 hover:bg-white rounded-xl text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-sm relative"
                      >
                        <Upload className="w-5 h-5 text-slate-900" />
                        <span>{t.importSetupBtn}</span>
                        <input
                          type="file"
                          accept="image/*"
                          ref={qrFileInputRef}
                          onChange={handleQrFileChange}
                          className="hidden"
                        />
                      </button>
                    </div>

                    {/* Camera scanner toggle */}
                    <div className="pt-2 border-t border-slate-100">
                      {!isCameraScanning ? (
                        <button
                          type="button"
                          onClick={startCameraScan}
                          className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <Camera className="w-4 h-4 text-slate-500" />
                          <span>{t.scanQrWithCamera}</span>
                        </button>
                      ) : (
                        <div className="space-y-3 text-center bg-slate-950 p-4 rounded-2xl relative overflow-hidden">
                          <div className="absolute top-2 right-2 z-10">
                            <button
                              type="button"
                              onClick={stopCameraScan}
                              className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t.cameraViewfinder}</div>
                          <div id="qr-reader-camera" className="mx-auto w-full max-w-[240px] aspect-square rounded-xl overflow-hidden bg-black border border-slate-800"></div>
                          <p className="text-[10px] text-slate-400 italic">{t.alignQrInstruction}</p>
                        </div>
                      )}
                    </div>

                    {/* Scan error if any */}
                    {scanError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold rounded-xl text-center">
                        {scanError}
                      </div>
                    )}

                    {/* Exported QR Display modal / box */}
                    {qrCodeDataUrl && (
                      <div className="p-4 border border-slate-200 rounded-2xl space-y-3 bg-slate-50/50 flex flex-col items-center justify-center">
                        <h5 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.setupQrTitle}</h5>
                        <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-md">
                          <img src={qrCodeDataUrl} alt="Setup Configuration QR Code" className="w-[180px] h-[180px] object-contain" />
                        </div>
                        <p className="text-[9px] text-slate-400 text-center max-w-[220px]">
                          {t.mirrorInstruction}
                        </p>
                        <div className="flex gap-2 w-full">
                          <a
                            href={qrCodeDataUrl}
                            download="slippro-setup-qr.png"
                            className="flex-1 py-2 border border-slate-200 bg-white hover:bg-slate-100 rounded-xl text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 text-center"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500 inline-block mr-1" />
                            <span>{t.downloadBtn}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setQrCodeDataUrl(null)}
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold text-white transition-all cursor-pointer"
                          >
                            {t.closeBtn}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* System & Version Updates Sub-tab */}
                {managerSubTab === "system" && (
                  <div className="space-y-4 pt-1">
                    {/* Status & Update Alert Box */}
                    {updateInfo.available ? (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              {lang === "th" ? "มีอัปเดตใหม่" : "Update Ready"}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 mt-1">
                              {t.newVersionFound.replace("{version}", updateInfo.latestVersion)}
                            </h4>
                            <p className="text-xs text-amber-800 mt-1">
                              {updateInfo.releaseNotes || t.updateNowInstruction}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          id="manager-update-now-btn"
                          onClick={handleApplyUpdate}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>{t.updateNowBtn}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-emerald-950">
                            {t.latestVersionToast.replace("{version}", APP_VERSION)}
                          </h4>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            {t.systemUpToDate}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Check Updates Button */}
                    <button
                      type="button"
                      id="check-updates-btn"
                      onClick={() => checkForUpdates(true)}
                      disabled={isCheckingUpdate}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? "animate-spin" : ""}`} />
                      <span>{isCheckingUpdate ? t.checkingUpdates : t.checkForUpdates}</span>
                    </button>

                    {/* Diagnostics & Specs Grid */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {t.systemInfoTitle}
                      </h4>

                      <div className="space-y-2 text-xs divide-y divide-slate-200/60">
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-slate-500 font-medium">{t.currentVersionLabel}</span>
                          <span className="font-mono font-black text-slate-900 px-2 py-0.5 bg-slate-200/80 rounded-md">
                            v{APP_VERSION}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-slate-500 font-medium">{t.cacheLayerLabel}</span>
                          <span className="font-mono text-[11px] font-bold text-slate-700">
                            {CACHE_VERSION}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-slate-500 font-medium">{t.connectionStatusLabel}</span>
                          <span className={`text-[11px] font-bold flex items-center gap-1.5 ${isOnline ? "text-emerald-600" : "text-amber-600"}`}>
                            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                            {isOnline ? t.onlineStatus : t.offlineStatus}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-slate-500 font-medium">{t.buildTimeLabel}</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {BUILD_TIME}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Force Purge Cache */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        id="purge-cache-btn"
                        onClick={handlePurgeCache}
                        className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t.clearCacheBtn}</span>
                      </button>
                      <p className="text-[10px] text-slate-400 text-center mt-1.5 font-medium">
                        {lang === "th" ? "โหลดข้อมูลใหม่โดยปลอดภัย: ไม่ลบสต็อกสินค้าหรือประวัติการขาย" : "Safe reload: does not delete shop inventory or transactions."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Screen Image Modal */}
      <AnimatePresence>
        {fullScreenImage && (
          <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={() => setFullScreenImage(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setFullScreenImage(null)}
                className="absolute top-4 right-4 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <img 
                src={fullScreenImage} 
                alt="Full screen slip" 
                className="max-w-full max-h-[90vh] object-contain rounded-xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating In-App Update Prompt Banner */}
      <AnimatePresence>
        {updateInfo.available && !updateBannerDismissed && (
          <motion.div
            id="update-banner"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 bg-slate-950/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-800/80 backdrop-blur-md flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white">
                    {t.newVersionFound.replace("{version}", updateInfo.latestVersion)}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                    Ready
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {updateInfo.releaseNotes || t.updateNowInstruction}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                id="floating-update-btn"
                onClick={handleApplyUpdate}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-500/20 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{t.updateNowBtn}</span>
              </button>
              <button
                type="button"
                id="dismiss-update-btn"
                onClick={() => setUpdateBannerDismissed(true)}
                title={t.dismissBtn}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styled Interactive Toast Message / Stock alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            id="stock-alert"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 px-5 py-3 rounded-full flex items-center gap-2 shadow-2xl z-50"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-bold text-white tracking-wide uppercase">{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
