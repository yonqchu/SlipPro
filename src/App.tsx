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
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import html2pdf from "html2pdf.js";

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
  items: {
    nameEN: string;
    nameTH: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  slipThumbnail: string | null;
  lowStockAlerts: string[];
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
    subtitle: "Mobile Sales Companion",
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
    sendToBossButton: "SEND",
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
    saleSuccessToast: "Sale completed! Redirecting to LINE...",
    confirmHeader: "Deduct Stock & Send?",
    confirmBody: "Are you sure you want to finalize this sale of ฿{total} and open LINE sharing?",
    confirmBtn: "Yes, Send",
    cancelBtn: "Cancel",
    todayAt: "Today at",
    recentSales: "Recent Sales Log",
    simulationMode: "Desktop Device Mode Enabled",
    tapToOrder: "Tap to Order",
    noLimit: "No Limit",
    copiedText: "LINE Share text prepared!",
    
    // Phase 2 Translation Keys
    tabRegister: "Register",
    tabHistory: "History",
    nextBtn: "Next",
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
    // Phase 3 Translation Keys
    tabZReport: "Z-Report",
    totalCash: "Total Cash",
    totalTransactions: "Total Transactions",
    itemizedSales: "Itemized Sales Count",
    clearShiftBtn: "Clear Shift",
    downloadPdfBtn: "Download PDF Report",
    clearShiftConfirm: "Are you sure you want to clear today's sales data and the manual shopping list? Tracked stock levels and catalog items will remain intact.",
    shiftClearedToast: "Shift cleared successfully!",
    noSalesToday: "No sales recorded today.",
    zReportTitle: "End of Day Z-Report",
    confirmClearShiftHeader: "Wipe Shift & Start New Day?",
    confirmClearShiftBody: "This action will permanently delete all transaction logs of today and empty your shopping list. Your item stock counts and menu settings will NOT be changed.",
    confirmClearShiftBtn: "Yes, Clear Shift",
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
    addItemBtn: "Add Item"
  },
  th: {
    appTitle: "SlipPro",
    subtitle: "ระบบช่วยขายมือถือ",
    languageLabel: "EN",
    quickTapMenu: "เมนูด่วน (แตะเพื่อสั่ง)",
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
    sendToBossButton: "SEND",
    resetStockButton: "เติมคลังสินค้า",
    resetStockSuccess: "รีเซ็ตและเติมคลังสินค้าเสร็จสิ้น!",
    confirmRestockHeader: "คืนค่าระดับสต็อกสินค้าทั้งหมด?",
    confirmRestockBody: "คุณต้องการรีเซ็ตและเติมระดับสต็อกสินค้าทั้งหมดให้กลับเป็นค่าเริ่มต้นใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้",
    confirmRestockBtn: "ใช่, รีเซ็ตสต็อก",
    transactionHistory: "ประวัติการขาย",
    noTransactions: "ไม่มีประวัติการขายในเซสชันนี้",
    slipAttached: "แนบสลิปการชำระเงินแล้ว",
    slipNotAttached: "ไม่ได้แนบสลิปการชำระเงิน",
    lowStockAlertText: "⚠️ แจ้งเตือนสินค้าใกล้หมด",
    clearCartButton: "ล้างตะกร้า",
    saleSuccessToast: "บันทึกการขายสำเร็จ! กำลังส่งต่อไปยัง LINE...",
    confirmHeader: "ตัดสต็อกและส่งรายการ?",
    confirmBody: "คุณต้องการทำรายการขายมูลค่า ฿{total} และเปิดแชร์ไปยัง LINE ใช่หรือไม่?",
    confirmBtn: "ใช่, ส่งรายการ",
    cancelBtn: "ยกเลิก",
    todayAt: "วันนี้เวลา",
    recentSales: "ประวัติการขายล่าสุด",
    simulationMode: "เปิดใช้งานโหมดจำลองอุปกรณ์เดสก์ท็อป",
    tapToOrder: "แตะเพื่อสั่งสินค้า",
    noLimit: "ไม่จำกัด",
    copiedText: "เตรียมข้อความแชร์ LINE เรียบร้อย!",
    tabRegister: "หน้าขายสินค้า (Register)",
    tabHistory: "ประวัติ (History)",
    nextBtn: "ถัดไป (Next)",
    shopProfileTitle: "ข้อมูลร้านค้า",
    shopName: "ชื่อร้านค้า",
    shopAddress: "ที่อยู่ร้านค้า",
    shopLineId: "ไอดี LINE (สำหรับส่งยอด)",
    pinPrompt: "กรอก PIN ผู้จัดการ (ค่าเริ่มต้น '1234')",
    wrongPin: "รหัส PIN ไม่ถูกต้อง!",
    managerModalTitle: "จัดการระบบ (Manager)",
    addMenuItem: "เพิ่มรายการเมนู",
    editMenuItem: "แก้ไขรายการเมนู",
    itemNameEN: "ชื่อสินค้า (อังกฤษ)",
    itemNameTH: "ชื่อสินค้า (ไทย)",
    itemPrice: "ราคา (฿)",
    itemImage: "ไอคอนอิโมจิ (เช่น 🍵)",
    trackStock: "ติดตามคลังสินค้า",
    currentStock: "จำนวนสินค้าในคลัง",
    lowStockThreshold: "เกณฑ์เตือนคลังเหลือน้อย",
    customShoppingPlaceholder: "ระบุวัตถุดิบหรือรายการซื้อของเพิ่มเติม...",
    customShoppingAddBtn: "เพิ่ม",
    exportSetupBtn: "ส่งออกตั้งค่า (QR)",
    importSetupBtn: "นำเข้าตั้งค่า (QR)",
    setupQrTitle: "รหัสคิวอาร์ระบบตั้งค่า",
    scanQrPrompt: "สแกนคิวอาร์ด้วยกล้องหรือเลือกไฟล์รูปภาพเพื่อตั้งค่า",
    scanSuccess: "นำเข้าข้อมูลร้านค้าและเมนูสำเร็จ!",
    scanFailed: "รหัสคิวอาร์สำหรับตั้งค่าไม่ถูกต้องหรือชำรุด",
    saveBtn: "บันทึก",
    deleteBtn: "ลบ",
    noLowStockItems: "ไม่มีเมนูสินค้าใดที่คลังต่ำกว่าเกณฑ์เตือน",

    // Phase 3 Translation Keys
    tabZReport: "ปิดยอด (Z-Report)",
    totalCash: "ยอดเงินสดทั้งหมด",
    totalTransactions: "จำนวนบิลขาย",
    itemizedSales: "สรุปรายการขายแยกประเภท",
    clearShiftBtn: "เริ่มวันใหม่ (เคลียร์กะ)",
    downloadPdfBtn: "ดาวน์โหลดรายงาน PDF",
    clearShiftConfirm: "คุณต้องการเคลียร์ประวัติการขายและรายการซื้อของในวันนี้ใช่หรือไม่? (คลังสินค้าและเมนูจะคงอยู่ตามปกติ)",
    shiftClearedToast: "ล้างยอดขายและสรุปกะรอบวันเรียบร้อย!",
    noSalesToday: "ไม่มีประวัติการขายในวันนี้",
    zReportTitle: "รายงานปิดรอบวัน (Z-Report)",
    confirmClearShiftHeader: "ล้างประวัติกะและเริ่มรอบใหม่?",
    confirmClearShiftBody: "การดำเนินการนี้จะลบประวัติการขายทั้งหมดของวันนี้และรายการวัตถุดิบซื้อของ แต่จะไม่ส่งผลกระทบใดๆ ต่อสต็อกสินค้าและเมนูร้านค้าของคุณ",
    confirmClearShiftBtn: "ตกลง,เริ่มวันใหม่",
    downloadingPdf: "กำลังดาวน์โหลดรายงาน...",
    unitPrice: "ราคาต่อหน่วย",
    configConsole: "แผงควบคุมระบบ",
    subTabProfile: "โปรไฟล์ร้านค้า",
    subTabCatalog: "เมนูสินค้า",
    subTabSync: "ซิงค์ข้อมูลผ่าน QR",
    scanQrWithCamera: "สแกน QR ด้วยกล้อง",
    cameraViewfinder: "ช่องมองภาพกล้อง",
    alignQrInstruction: "จัดวางรหัส QR ตั้งค่าให้อยู่ภายในกรอบ",
    mirrorInstruction: "แชร์คิวอาร์โค้ดนี้ไปยังอุปกรณ์อื่นเพื่อซิงค์ข้อมูลร้านและเมนูทั้งหมดได้ทันที!",
    downloadBtn: "ดาวน์โหลด",
    closeBtn: "ปิด",
    currentCatalog: "รายการเมนูปัจจุบัน",
    addItemBtn: "เพิ่มเมนู"
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


  // Phase 2 State Declarations
  const [activeTab, setActiveTab] = useState<"register" | "history" | "checkout" | "zreport">("register");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [managerSubTab, setManagerSubTab] = useState<"profile" | "items" | "sync">("profile");
  
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
    const savedStock = localStorage.getItem("slippro_stock_v2");
    if (savedStock) {
      try {
        setMenuItems(JSON.parse(savedStock));
      } catch (e) {
        setMenuItems(DEFAULT_MENU_ITEMS);
      }
    } else {
      setMenuItems(DEFAULT_MENU_ITEMS);
      localStorage.setItem("slippro_stock_v2", JSON.stringify(DEFAULT_MENU_ITEMS));
    }

    const savedHistory = localStorage.getItem("slippro_transactions_v1");
    if (savedHistory) {
      try {
        setTransactions(JSON.parse(savedHistory));
      } catch (e) {}
    }

    const savedShopProfile = localStorage.getItem("slippro_shop_profile_v1");
    if (savedShopProfile) {
      try {
        setShopProfile(JSON.parse(savedShopProfile));
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
        setCustomShoppingList(JSON.parse(savedCustomShopping));
      } catch (e) {}
    }

    const savedSlip = localStorage.getItem("slippro_current_slip_v1");
    if (savedSlip) {
      setCapturedSlip(savedSlip);
    }
  }, []);

  // Helper translations
  const t = TRANSLATIONS[lang];

  // Restock handler
  const handleRestock = () => {
    setMenuItems(DEFAULT_MENU_ITEMS);
    localStorage.setItem("slippro_stock_v2", JSON.stringify(DEFAULT_MENU_ITEMS));
    triggerToast(t.resetStockSuccess);
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
  };

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
      const existing = prevCart.find(c => c.menuItem.id === itemId);
      if (!existing) return prevCart;

      if (existing.quantity <= 1) {
        return prevCart.filter(c => c.menuItem.id !== itemId);
      } else {
        return prevCart.map(c => 
          c.menuItem.id === itemId 
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
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
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
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          
          setCapturedSlip(compressedBase64);
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
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
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
    setShowConfirmModal(true);
  };

  // Confirm stock deduction and share to LINE
  const confirmAndSend = () => {
    setShowConfirmModal(false);

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

    // 3. Format the transaction message
    const timestampStr = new Date().toLocaleTimeString(lang === "en" ? "en-US" : "th-TH", {
      hour: "2-digit",
      minute: "2-digit"
    });
    const dateStr = new Date().toLocaleDateString(lang === "en" ? "en-US" : "th-TH", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    let message = `🚀 --- SlipPro Sale Order ---\n`;
    message += `📅 Date: ${dateStr} | ⏰ Time: ${timestampStr}\n`;
    message += `-------------------------\n`;
    
    cart.forEach(c => {
      const itemTitle = lang === "en" ? c.menuItem.nameEN : c.menuItem.nameTH;
      message += `• ${itemTitle} x ${c.quantity} = ฿${c.menuItem.price * c.quantity}\n`;
    });
    
    message += `-------------------------\n`;
    message += `💰 TOTAL: ฿${cartTotal}\n`;
    message += `🧾 Slip Status: ${capturedSlip ? "✅ Attached / แนบแล้ว" : "❌ Not Attached / ไม่พบสลิป"}\n`;

    if (lowStockAlerts.length > 0) {
      message += `\n${t.lowStockAlertText}\n`;
      lowStockAlerts.forEach(alert => {
        message += `- ${alert}\n`;
      });
    }

    // 4. Save to transactions local storage
    const newTransaction: Transaction = {
      id: "txn_" + Date.now(),
      timestamp: `${dateStr} @ ${timestampStr}`,
      items: cart.map(c => ({
        nameEN: c.menuItem.nameEN,
        nameTH: c.menuItem.nameTH,
        price: c.menuItem.price,
        quantity: c.quantity
      })),
      total: cartTotal,
      slipThumbnail: capturedSlip,
      lowStockAlerts: lowStockAlerts
    };

    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    localStorage.setItem("slippro_transactions_v1", JSON.stringify(updatedTransactions));

    // 5. Open line share scheme
    const lineShareUrl = (shopProfile as any).lineId 
      ? `https://line.me/R/oaMessage/${(shopProfile as any).lineId}/?${encodeURIComponent(message)}`
      : `https://line.me/R/share?text=${encodeURIComponent(message)}`;
    
    // Clear cart and slip
    setCart([]);
    setCapturedSlip(null);
    localStorage.removeItem("slippro_current_slip_v1");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    triggerToast(t.saleSuccessToast);

    // Open LINE redirect URL
    setTimeout(() => {
      window.open(lineShareUrl, "_blank");
      setActiveTab("register");
    }, 1200);
  };

  const handleResendToLine = (tx: Transaction) => {
    let message = `🚀 --- SlipPro Sale Order (Resend) ---\n`;
    message += `📅 Date/Time: ${tx.timestamp}\n`;
    message += `-------------------------\n`;
    
    tx.items.forEach(c => {
      const itemTitle = lang === "en" ? c.nameEN : c.nameTH;
      message += `• ${itemTitle} x ${c.quantity} = ฿${c.price * c.quantity}\n`;
    });
    
    message += `-------------------------\n`;
    message += `💰 TOTAL: ฿${tx.total}\n`;
    message += `🧾 Slip Status: ${tx.slipThumbnail ? "✅ Attached / แนบแล้ว" : "❌ Not Attached / ไม่พบสลิป"}\n`;

    if (tx.lowStockAlerts && tx.lowStockAlerts.length > 0) {
      message += `\n${t.lowStockAlertText}\n`;
      tx.lowStockAlerts.forEach(alert => {
        message += `- ${alert}\n`;
      });
    }

    const lineShareUrl = (shopProfile as any).lineId 
      ? `https://line.me/R/oaMessage/${(shopProfile as any).lineId}/?${encodeURIComponent(message)}`
      : `https://line.me/R/share?text=${encodeURIComponent(message)}`;
    window.open(lineShareUrl, "_blank");
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
    if (!nameEN || !nameTH || price === undefined || price === "" || Number(price) < 0 || !image) {
      triggerToast("Please fill all required fields correctly.");
      return;
    }

    let updatedMenuItems: MenuItem[] = [];
    if (id) {
      // Edit existing
      updatedMenuItems = menuItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              nameEN, 
              nameTH, 
              price: Number(price), 
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
        nameEN,
        nameTH,
        price: Number(price),
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
    const updated = menuItems.filter(item => item.id !== itemId);
    setMenuItems(updated);
    localStorage.setItem("slippro_stock_v2", JSON.stringify(updated));
    
    // Clean from active cart
    setCart(prev => prev.filter(c => c.menuItem.id !== itemId));
    
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
    const updated = [...customShoppingList, customShoppingItem.trim()];
    setCustomShoppingList(updated);
    localStorage.setItem("slippro_custom_shopping_v1", JSON.stringify(updated));
    setCustomShoppingItem("");
  };

  const handleRemoveCustomShoppingItem = (index: number) => {
    const updated = customShoppingList.filter((_, i) => i !== index);
    setCustomShoppingList(updated);
    localStorage.setItem("slippro_custom_shopping_v1", JSON.stringify(updated));
  };

  const handleClearShift = () => {
    setTransactions([]);
    localStorage.setItem("slippro_transactions_v1", JSON.stringify([]));

    setCustomShoppingList([]);
    localStorage.setItem("slippro_custom_shopping_v1", JSON.stringify([]));

    setShowClearShiftConfirm(false);
    triggerToast(t.shiftClearedToast);
  };

  const handleDownloadPdf = () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);

    const todayDate = new Date().toLocaleDateString(lang === "en" ? "en-US" : "th-TH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const totalCash = transactions.reduce((sum, tx) => sum + tx.total, 0);

    const itemized: { [key: string]: { nameEN: string; nameTH: string; quantity: number; total: number; image: string } } = {};
    transactions.forEach(tx => {
      tx.items.forEach(item => {
        const key = item.nameEN;
        const menuItem = menuItems.find(m => m.nameEN === item.nameEN);
        const image = menuItem?.image || "📦";
        if (!itemized[key]) {
          itemized[key] = {
            nameEN: item.nameEN,
            nameTH: item.nameTH,
            quantity: 0,
            total: 0,
            image
          };
        }
        itemized[key].quantity += item.quantity;
        itemized[key].total += item.price * item.quantity;
      });
    });
    const itemizedList = Object.values(itemized).sort((a, b) => b.total - a.total);

    const itemizedHTML = itemizedList.length > 0 
      ? itemizedList.map(item => `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 8px; font-size: 13px;">${item.image} ${lang === "en" ? item.nameEN : item.nameTH}</td>
            <td style="padding: 10px 8px; text-align: center; font-size: 13px; font-family: monospace;">${item.quantity}</td>
            <td style="padding: 10px 8px; text-align: right; font-size: 13px; font-family: monospace;">฿${item.total}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="3" style="text-align: center; padding: 24px; color: #94a3b8; font-style: italic; font-size: 13px;">${t.noSalesToday}</td></tr>`;

    const lowStockItems = menuItems.filter(item => item.trackStock && item.currentStock < item.lowStockThreshold);
    const hasShopping = lowStockItems.length > 0 || customShoppingList.length > 0;
    
    const shoppingHTML = hasShopping
      ? `
        <div style="margin-top: 30px; border-top: 2px solid #0f172a; padding-top: 20px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">🛒 ${lang === "en" ? "Shopping & Procurement List" : "รายการจัดเตรียมวัตถุดิบซื้อของ"}</h3>
          <ul style="padding-left: 20px; margin: 0; space-y: 8px;">
            ${lowStockItems.map(item => `
              <li style="font-size: 13px; color: #dc2626; margin-bottom: 8px; font-weight: 500;">
                <strong>[${lang === 'en' ? 'LOW STOCK' : 'คลังเหลือน้อย'}]</strong> ${item.image} ${lang === "en" ? item.nameEN : item.nameTH} - ${lang === 'en' ? 'Stock' : 'คงเหลือ'}: ${item.currentStock} (Threshold: ${item.lowStockThreshold})
              </li>
            `).join("")}
            ${customShoppingList.map(item => `
              <li style="font-size: 13px; color: #334155; margin-bottom: 8px; font-weight: 500;">
                <strong>[${lang === 'en' ? 'CUSTOM' : 'เพิ่มเติม'}]</strong> ${item}
              </li>
            `).join("")}
          </ul>
        </div>
      `
      : "";

    const element = document.createElement("div");
    element.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 32px; background-color: #ffffff; color: #0f172a; line-height: 1.5; max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
        <!-- Header Info -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <h1 style="font-size: 28px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.03em; text-transform: uppercase;">${shopProfile.name}</h1>
            <p style="font-size: 13px; color: #475569; margin: 6px 0 0 0; max-width: 400px; font-weight: 500;">📍 ${shopProfile.address}</p>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Z-REPORT</div>
            <p style="font-size: 12px; color: #334155; margin: 0; font-weight: 700; font-family: monospace;">${todayDate}</p>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 30px;">
          <div style="border: 1px solid #cbd5e1; padding: 16px; border-radius: 12px; text-align: center; background-color: #f8fafc; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">${lang === "en" ? "TOTAL TRANSACTIONS" : "จำนวนบิลขาย"}</span>
            <p style="font-size: 26px; font-weight: 900; color: #0f172a; margin: 6px 0 0 0; font-family: monospace;">${transactions.length}</p>
          </div>
          <div style="border: 1px solid #cbd5e1; padding: 16px; border-radius: 12px; text-align: center; background-color: #f8fafc; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">${lang === "en" ? "TOTAL CASH REVENUE" : "ยอดขายเงินสดทั้งหมด"}</span>
            <p style="font-size: 26px; font-weight: 900; color: #10b981; margin: 6px 0 0 0; font-family: monospace;">฿${totalCash}</p>
          </div>
        </div>

        <!-- Sales Itemized -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">📊 ${lang === "en" ? "Itemized Sales Summary" : "สรุปรายการขายแยกประเภท"}</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid #0f172a; text-transform: uppercase; font-size: 11px; font-weight: 800; color: #475569;">
                <th style="padding: 8px; text-align: left;">${lang === "en" ? "Menu Item" : "เมนูสินค้า"}</th>
                <th style="padding: 8px; text-align: center; width: 100px;">${lang === "en" ? "Qty Sold" : "จำนวนขาย"}</th>
                <th style="padding: 8px; text-align: right; width: 140px;">${lang === "en" ? "Revenue" : "ยอดขาย"}</th>
              </tr>
            </thead>
            <tbody>
              ${itemizedHTML}
            </tbody>
          </table>
        </div>

        <!-- Procurement / Shopping Section -->
        ${shoppingHTML}

        <!-- Footer watermark -->
        <div style="margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 16px; text-align: center;">
          <p style="font-size: 10px; color: #94a3b8; margin: 0; font-weight: 500;">Report generated automatically by <strong>SlipPro POS</strong> on ${new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'th-TH')}</p>
        </div>
      </div>
    `;

    const opt = {
      margin:       [0.4, 0.4, 0.4, 0.4] as [number, number, number, number],
      filename:     `slippro-zreport-${new Date().toISOString().slice(0, 10)}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };

    try {
      html2pdf().from(element).set(opt).save().then(() => {
        setIsDownloadingPdf(false);
        triggerToast(lang === "en" ? "PDF Report Downloaded!" : "ดาวน์โหลดรายงานสำเร็จ!");
      }).catch((err: any) => {
        console.error("PDF generation failed: ", err);
        setIsDownloadingPdf(false);
        triggerToast("PDF Export failed");
      });
    } catch (error) {
      setIsDownloadingPdf(false);
      triggerToast("PDF library error");
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

  const lowStockMenuItems = menuItems.filter(item => item.trackStock && item.currentStock < item.lowStockThreshold);
  const lowStockItemsCount = lowStockMenuItems.length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-start py-0 md:py-8 px-0 sm:px-4 font-sans selection:bg-slate-900 selection:text-white">
      
      {/* Subtle modern geometric grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>
      
      {/* Container simulating a mobile device for desktop, or stretching seamlessly on mobile */}
      <div className="w-full max-w-md bg-white md:rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.15)] md:border-[10px] md:border-slate-900 flex flex-col min-h-screen md:min-h-[850px] overflow-hidden relative z-10 transition-all">
        
        {/* Device Status Bar Decor (Desktop Only) */}
        <div className="hidden md:flex items-center justify-between px-8 pt-4 pb-1 text-xs text-slate-900 font-mono select-none bg-white">
          <span className="font-bold">9:41 AM</span>
          <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto relative -top-1.5 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-900 flex items-center justify-center text-[8px] text-white font-extrabold">5G</div>
            <div className="w-3 h-3 bg-slate-900 rounded-full"></div>
            <div className="w-3 h-3 bg-slate-900 rounded-full opacity-20"></div>
          </div>
        </div>

        {/* Dynamic Mobile Header */}
        <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
              <Share2 className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <div>
              <h1 id="app-title" className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1.5 leading-none">
                {t.appTitle}
                <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-mono uppercase tracking-wider font-bold border border-slate-200">
                  PWA v3
                </span>
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
              onClick={() => setShowRestockConfirm(true)}
              title={t.resetStockButton}
              className="p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-slate-500 hover:text-slate-900 cursor-pointer active:scale-95"
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
                : 'px-6 py-6 space-y-6 pb-32'
        }`}>
          
          {activeTab === "register" && (
            <div className="space-y-6">
          
          {/* Quick-Tap Grid of 4 Menu Items */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 id="menu-label" className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                {t.quickTapMenu}
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {t.tapToOrder}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3" id="menu-grid">
              {menuItems.map(item => {
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
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Checkout</span>
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
                        {cart.reduce((acc, curr) => acc + curr.quantity, 0)} {t.items.toUpperCase()}
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
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="flex flex-col min-h-full bg-slate-50">
              <div className="w-full p-5 flex items-center justify-between bg-slate-900 text-white sticky top-0 z-10 shadow-md">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider">
                        {t.transactionHistory}
                      </h2>
                      <p className="text-[10px] text-slate-300 font-semibold uppercase font-mono mt-0.5">
                        {transactions.length} LOGS
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white divide-y divide-slate-100 flex-1" id="transaction-history-list">
                  {transactions.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center space-y-3 opacity-60">
                      <History className="w-8 h-8 text-slate-300" />
                      <p className="text-sm text-slate-400 italic font-medium">{t.noTransactions}</p>
                    </div>
                  ) : (
                    transactions.map((tx, idx) => (
                      <div id={`tx-${tx.id}`} key={tx.id || idx} className="p-5 space-y-3.5 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            {tx.timestamp}
                          </span>
                          <span className="text-sm font-mono font-black text-slate-900 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100">
                            {t.thb}{tx.total}
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

                        {/* Slip status */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-[10px]">
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

                          {tx.lowStockAlerts.length > 0 && (
                            <span className="text-red-600 font-black tracking-wider text-[9px] px-2 py-1 bg-red-50 border border-red-200 rounded-md uppercase">
                              {t.lowStockAlertText}
                            </span>
                          )}
                        </div>

                        {/* Slip Thumbnail in history */}
                        {tx.slipThumbnail && (
                          <div className="pt-2">
                            <details className="cursor-pointer group bg-slate-50 rounded-xl p-2.5 border border-slate-200/60 hover:border-slate-300 transition-colors">
                              <summary className="text-[10px] text-slate-600 hover:text-slate-900 flex items-center gap-1.5 select-none font-bold uppercase tracking-wider">
                                <ImageIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                                <span>View Captured Slip</span>
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
                                    <span>View</span>
                                  </span>
                                </div>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
            </div>
          )}



          {activeTab === "zreport" && (() => {
            const totalCash = transactions.reduce((sum, tx) => sum + tx.total, 0);

            const itemized: { [key: string]: { nameEN: string; nameTH: string; quantity: number; total: number; image: string } } = {};
            transactions.forEach(tx => {
              tx.items.forEach(item => {
                const key = item.nameEN;
                const menuItem = menuItems.find(m => m.nameEN === item.nameEN);
                const image = menuItem?.image || "📦";
                if (!itemized[key]) {
                  itemized[key] = {
                    nameEN: item.nameEN,
                    nameTH: item.nameTH,
                    quantity: 0,
                    total: 0,
                    image
                  };
                }
                itemized[key].quantity += item.quantity;
                itemized[key].total += item.price * item.quantity;
              });
            });
            const itemizedList = Object.values(itemized).sort((a, b) => b.total - a.total);

            return (
              <div className="space-y-6">
                {/* Z-Report Cover Header */}
                <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-32 h-32 bg-slate-800/60 rounded-full pointer-events-none"></div>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="inline-block bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {t.zReportTitle.split(" (")[0]}
                      </span>
                      <h3 className="text-lg font-black tracking-tight">{shopProfile.name}</h3>
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-1">📍 {shopProfile.address}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date().toLocaleDateString(lang === "en" ? "en-US" : "th-TH", { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <span className="font-bold text-slate-300">SHIFT: ACTIVE</span>
                  </div>
                </div>

                {/* Bento Grid Stats */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Total Cash Stat Card */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        {t.totalCash}
                      </span>
                      <p className="text-2xl font-black font-mono tracking-tight text-emerald-600">
                        {t.thb}{totalCash}
                      </p>
                    </div>
                    <span className="text-[8px] text-slate-400 font-semibold mt-2 block">
                      💵 Cash Draw Summary
                    </span>
                  </div>

                  {/* Total Transactions Stat Card */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        {t.totalTransactions}
                      </span>
                      <p className="text-2xl font-black font-mono tracking-tight text-slate-900">
                        {transactions.length}
                      </p>
                    </div>
                    <span className="text-[8px] text-slate-400 font-semibold mt-2 block">
                      🧾 Bills Printed Today
                    </span>
                  </div>
                </div>

                {/* Itemized Sales Count section */}
                <div className="space-y-3 bg-white border border-slate-200/60 rounded-2.5xl p-4 shadow-sm">
                  <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-black flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <BarChart3 className="w-3.5 h-3.5 text-slate-900" />
                    <span>{t.itemizedSales}</span>
                  </h4>

                  {itemizedList.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {itemizedList.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{item.image}</span>
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                {lang === "en" ? item.nameEN : item.nameTH}
                              </p>
                              <p className="text-[9px] text-slate-400 font-bold font-mono">
                                {t.unitPrice}: {t.thb}{item.total / item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <p className="text-xs font-black text-slate-900">x{item.quantity}</p>
                            <p className="text-[10px] font-bold text-emerald-600">{t.thb}{item.total}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400 italic font-medium">{t.noSalesToday}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons: PDF Download & Clear Shift */}
                <div className="grid grid-cols-1 gap-3 pt-2">
                  <button
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

                  <button
                    onClick={() => setShowClearShiftConfirm(true)}
                    className="w-full py-3.5 rounded-2xl font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all uppercase cursor-pointer border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t.clearShiftBtn}</span>
                  </button>
                </div>
              </div>
            );
          })()}

        </main>

        {/* Modern Mobile Tab Navigation Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-5 py-3 flex flex-col gap-2.5 z-20">
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

              <div className="space-y-1.5">
                <h3 className="text-base font-black tracking-tight text-slate-950">{t.confirmHeader}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {t.confirmBody.replace("{total}", cartTotal.toString())}
                </p>
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
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
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

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 block">{t.itemNameEN}</label>
                            <input
                              type="text"
                              value={editingItem.nameEN || ""}
                              onChange={(e) => setEditingItem({...editingItem, nameEN: e.target.value})}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-slate-900"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 block">{t.itemNameTH}</label>
                            <input
                              type="text"
                              value={editingItem.nameTH || ""}
                              onChange={(e) => setEditingItem({...editingItem, nameTH: e.target.value})}
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
                            onClick={() => setEditingItem({ trackStock: false, currentStock: 99, lowStockThreshold: 0, image: "☕" })}
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
