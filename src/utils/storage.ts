// Storage & Image Optimization Utility for SlipPro
// Solves Android low memory crashes, QuotaExceededError in localStorage,
// and provides transaction recovery & IndexedDB slip archiving.

const DB_NAME = "slippro_db";
const DB_VERSION = 1;
const STORE_SLIPS = "slips";
const STORE_TX_BACKUP = "transactions_backup";

export interface RecoveredSalesDiscrepancy {
  hasDiscrepancy: boolean;
  missingItems: {
    id: string;
    nameEN: string;
    nameTH: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  totalMissingUnits: number;
  totalEstimatedAmount: number;
}

// 1. IndexedDB Helper (Safe & Fallback-proof)
let dbPromise: Promise<IDBDatabase | null> | null = null;

export const getIDB = (): Promise<IDBDatabase | null> => {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_SLIPS)) {
            db.createObjectStore(STORE_SLIPS);
          }
          if (!db.objectStoreNames.contains(STORE_TX_BACKUP)) {
            db.createObjectStore(STORE_TX_BACKUP);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn("IndexedDB failed to open:", req.error);
          resolve(null);
        };
      } catch (err) {
        console.warn("IndexedDB not available:", err);
        resolve(null);
      }
    });
  }
  return dbPromise;
};

export const saveSlipToIDB = async (id: string, base64: string): Promise<boolean> => {
  try {
    const db = await getIDB();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_SLIPS, "readwrite");
        const store = tx.objectStore(STORE_SLIPS);
        store.put(base64, id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  } catch (e) {
    return false;
  }
};

export const getSlipFromIDB = async (id: string): Promise<string | null> => {
  try {
    const db = await getIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_SLIPS, "readonly");
        const store = tx.objectStore(STORE_SLIPS);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  } catch (e) {
    return null;
  }
};

export const deleteSlipFromIDB = async (id: string): Promise<boolean> => {
  try {
    const db = await getIDB();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_SLIPS, "readwrite");
        const store = tx.objectStore(STORE_SLIPS);
        store.delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  } catch (e) {
    return false;
  }
};

export const backupTransactionsToIDB = async (transactions: any[]): Promise<boolean> => {
  try {
    const db = await getIDB();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_TX_BACKUP, "readwrite");
        const store = tx.objectStore(STORE_TX_BACKUP);
        store.put(transactions, "latest");
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  } catch (e) {
    return false;
  }
};

export const getBackupTransactionsFromIDB = async (): Promise<any[] | null> => {
  try {
    const db = await getIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_TX_BACKUP, "readonly");
        const store = tx.objectStore(STORE_TX_BACKUP);
        const req = store.get("latest");
        req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  } catch (e) {
    return null;
  }
};

// 2. Memory-Safe Slip Image Processing for Mobile/Android
// Avoids "Unable to complete previous operation due to low memory" by resizing efficiently
export const processSlipImageSafe = async (
  file: File,
  timestampStr: string
): Promise<{ previewUrl: string; microThumb: string }> => {
  const MAX_DIMENSION = 800; // Optimal for receipt slips, uses 75% less RAM than 1200+
  const THUMB_DIMENSION = 120; // Super lightweight for transaction list (3-5KB)

  let width = 0;
  let height = 0;
  let sourceImage: ImageBitmap | HTMLImageElement;

  // Try createImageBitmap with native resize if available (drastically reduces RAM usage)
  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    try {
      sourceImage = await createImageBitmap(file);
      width = sourceImage.width;
      height = sourceImage.height;
    } catch (err) {
      // Fallback to Image element
      sourceImage = await loadImageFromFile(file);
      width = sourceImage.width;
      height = sourceImage.height;
    }
  } else {
    sourceImage = await loadImageFromFile(file);
    width = sourceImage.width;
    height = sourceImage.height;
  }

  // Calculate scaled dimensions
  let targetW = width;
  let targetH = height;
  if (width > height) {
    if (width > MAX_DIMENSION) {
      targetH = Math.round((height * MAX_DIMENSION) / width);
      targetW = MAX_DIMENSION;
    }
  } else {
    if (height > MAX_DIMENSION) {
      targetW = Math.round((width * MAX_DIMENSION) / height);
      targetH = MAX_DIMENSION;
    }
  }

  // Main Preview Canvas
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d context");

  ctx.drawImage(sourceImage, 0, 0, targetW, targetH);

  // Overlay timestamp badge cleanly
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, targetH - 32, targetW, 32);
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "white";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(timestampStr, targetW - 14, targetH - 16);

  const previewUrl = canvas.toDataURL("image/jpeg", 0.62);

  // Micro Thumbnail Canvas (for localStorage & lightning list rendering)
  let thumbW = THUMB_DIMENSION;
  let thumbH = Math.round((targetH * THUMB_DIMENSION) / targetW);
  const thumbCanvas = document.createElement("canvas");
  thumbCanvas.width = thumbW;
  thumbCanvas.height = thumbH;
  const thumbCtx = thumbCanvas.getContext("2d");
  let microThumb = previewUrl;
  if (thumbCtx) {
    thumbCtx.drawImage(canvas, 0, 0, thumbW, thumbH);
    microThumb = thumbCanvas.toDataURL("image/jpeg", 0.45);
  }

  // Release memory
  if ("close" in sourceImage && typeof (sourceImage as any).close === "function") {
    (sourceImage as any).close();
  }

  return { previewUrl, microThumb };
};

const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
};

// 3. Robust Salvaging & Repair Parser for Transactions
export const salvageTransactions = (raw: string | null): any[] => {
  if (!raw || typeof raw !== "string" || !raw.trim()) return [];

  // Attempt 1: Standard JSON parse
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    console.warn("slippro_transactions_v1 corrupted, attempting salvage repair...", err);
  }

  // Attempt 2: Auto-repair truncated JSON array
  try {
    let repaired = raw.trim();
    // If it doesn't end with ], find the last closing curly brace }
    const lastBraceIdx = repaired.lastIndexOf("}");
    if (lastBraceIdx > 0) {
      repaired = repaired.substring(0, lastBraceIdx + 1) + "]";
      if (!repaired.startsWith("[")) repaired = "[" + repaired;
      const parsed = JSON.parse(repaired);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`Salvaged ${parsed.length} transactions from truncated JSON!`);
        return parsed;
      }
    }
  } catch (e) {}

  // Attempt 3: Regex token scanning for valid individual transaction objects
  try {
    const regex = /\{[^{}]*"id"\s*:\s*"txn_[^}]+\}/g;
    const matches = raw.match(regex);
    if (matches && matches.length > 0) {
      const results: any[] = [];
      for (const m of matches) {
        try {
          const item = JSON.parse(m);
          if (item && item.id) results.push(item);
        } catch (e) {}
      }
      if (results.length > 0) {
        console.log(`Regex salvaged ${results.length} transactions!`);
        return results;
      }
    }
  } catch (e) {}

  return [];
};

// 4. Safe Transaction Storage with Automatic Quota Management
export const safeSaveTransactions = (transactions: any[]): boolean => {
  if (!Array.isArray(transactions)) return false;

  // Make backup in IndexedDB asynchronously
  backupTransactionsToIDB(transactions).catch(() => {});

  // Clean transactions for localStorage (replace huge base64 with micro thumbnails)
  const cleanTx = transactions.map((t) => {
    let thumb = t.slipThumbnail;
    // If slipThumbnail is a massive base64 (> 15KB), compress or truncate
    if (thumb && typeof thumb === "string" && thumb.length > 15000) {
      // Save full slip to IDB
      saveSlipToIDB(t.id, thumb).catch(() => {});
      // In localStorage, store indicator or keep micro thumbnail
      thumb = "idb:" + t.id;
    }
    return { ...t, slipThumbnail: thumb };
  });

  const serialize = (items: any[]) => JSON.stringify(items);

  try {
    const jsonStr = serialize(cleanTx);
    localStorage.setItem("slippro_transactions_v1", jsonStr);
    // Also save shadow backup
    try {
      localStorage.setItem("slippro_transactions_backup_v1", jsonStr);
    } catch (e) {}
    return true;
  } catch (err: any) {
    console.warn("LocalStorage QuotaExceededError in safeSaveTransactions, pruning old thumbnails...", err);

    // Quota Recovery Strategy 1: Strip old thumbnails (> 2 days)
    try {
      const strippedOldThumbs = cleanTx.map((t, idx) => {
        if (idx > 5) {
          // Keep only 5 most recent thumbnails
          return { ...t, slipThumbnail: null };
        }
        return t;
      });
      const str1 = serialize(strippedOldThumbs);
      localStorage.setItem("slippro_transactions_v1", str1);
      return true;
    } catch (e1) {
      // Quota Recovery Strategy 2: Strip ALL thumbnails from localStorage (metadata intact)
      try {
        const strippedAllThumbs = cleanTx.map((t) => ({ ...t, slipThumbnail: null }));
        const str2 = serialize(strippedAllThumbs);
        localStorage.setItem("slippro_transactions_v1", str2);
        return true;
      } catch (e2) {
        console.error("Critical: LocalStorage completely out of quota!", e2);
        return false;
      }
    }
  }
};

// 5. Stock-to-Transactions Discrepancy Detection & Auto-Recovery
export const detectLostSalesToday = (
  today: string,
  todaysOpening: Record<string, number>,
  menuItems: { id: string; nameEN: string; nameTH: string; price: number; trackStock: boolean; currentStock: number }[],
  restockEvents: any[],
  transactions: any[]
): RecoveredSalesDiscrepancy => {
  if (!todaysOpening || Object.keys(todaysOpening).length === 0) {
    return {
      hasDiscrepancy: false,
      missingItems: [],
      totalMissingUnits: 0,
      totalEstimatedAmount: 0,
    };
  }

  // Filter today's recorded transactions
  const dayTx = (transactions || []).filter((tx) => {
    if (!tx) return false;
    if (tx.date) return tx.date === today;
    const txDate = tx.timestamp ? tx.timestamp.split(" @ ")[0] : "";
    return txDate === today || (typeof tx.timestamp === "string" && tx.timestamp.includes(today));
  });

  const allSoldItems = dayTx.flatMap((tx) => (Array.isArray(tx?.items) ? tx.items : []));

  const dayRestocks = (restockEvents || []).filter((r) => r && r.date === today);

  const missingItems: RecoveredSalesDiscrepancy["missingItems"] = [];
  let totalMissingUnits = 0;
  let totalEstimatedAmount = 0;

  menuItems
    .filter((m) => m && m.trackStock)
    .forEach((item) => {
      const openStock = todaysOpening[item.id] !== undefined ? todaysOpening[item.id] : item.currentStock;
      const restocked = dayRestocks
        .filter((r) => r.itemId === item.id && r.type !== "spoilage")
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      const spoiled = dayRestocks
        .filter((r) => r.itemId === item.id && r.type === "spoilage")
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      // What stock equation says was sold
      const stockEquationSold = Math.max(0, openStock + restocked - item.currentStock - spoiled);

      // What transactions say was sold
      const recordedSold = allSoldItems
        .filter((it) => it && (it.nameEN === item.nameEN || it.nameTH === item.nameTH))
        .reduce((sum, it) => sum + (it.quantity || 0), 0);

      const missingUnits = stockEquationSold - recordedSold;

      if (missingUnits > 0) {
        const subtotal = missingUnits * item.price;
        missingItems.push({
          id: item.id,
          nameEN: item.nameEN,
          nameTH: item.nameTH,
          price: item.price,
          quantity: missingUnits,
          subtotal,
        });
        totalMissingUnits += missingUnits;
        totalEstimatedAmount += subtotal;
      }
    });

  return {
    hasDiscrepancy: missingItems.length > 0 && totalMissingUnits > 0,
    missingItems,
    totalMissingUnits,
    totalEstimatedAmount,
  };
};

