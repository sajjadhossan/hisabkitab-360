import React, { useState, useRef, useMemo, useDeferredValue } from 'react';
import { useApp } from '../../context/AppContext';
import { printElement } from '../../services/printService';
import {
  Boxes,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Search,
  AlertTriangle,
  AlertOctagon,
  Tag,
  Trash2,
  Edit,
  Package,
  Barcode,
  X,
  Calendar,
  FileText,
  DollarSign,
  CheckCircle2,
  TrendingDown,
  Info,
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  Sparkles,
  Image as ImageIcon,
  FolderOpen
} from 'lucide-react';
import { CategoryManagerModal } from '../common/CategoryManagerModal';
import { MasterHubModal } from '../common/MasterHubModal';
import { BusinessReorderModal } from './BusinessReorderModal';
import { SmartVoiceFormBanner } from '../common/SmartVoiceFormBanner';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { useAuth } from '../../context/AuthContext';
import { BarcodeStickerModal } from '../common/BarcodeStickerModal';

const PRESET_PRODUCT_IMAGES = [
  { label: 'বিরিয়ানি', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300' },
  { label: 'কাচ্চি', url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=300' },
  { label: 'ফ্রাইড চিকেন', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300' },
  { label: 'বার্গার', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300' },
  { label: 'পিৎজা', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300' },
  { label: 'কফি', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300' },
  { label: 'কেক / বেকারি', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300' },
  { label: 'সয়াবিন তেল', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300' },
  { label: 'পোশাক', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300' },
  { label: 'মোবাইল', url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300' },
  { label: 'ওষুধ', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300' }
];

export const InventoryManager = () => {
  const { canViewCostPrice, isOwner } = useAuth();
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    openScanner,
    openBarcodePrint,
    damagedGoods = [],
    recordDamagedGoods,
    deleteDamagedRecord,
    bulkAddProducts,
    categories = {},
    businessSettings = {},
    showToast,
    t,
    lang
  } = useApp();

  // Category, Sticker & Master Hub Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMasterHubModal, setShowMasterHubModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showBarcodeStickerModal, setShowBarcodeStickerModal] = useState(false);
  const [selectedStickerProduct, setSelectedStickerProduct] = useState(null);

  // Navigation Sub-tab: 'products' | 'damaged'
  const [inventoryTab, setInventoryTab] = useState('products');

  // Search & Filter for Products
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Modals for Products
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states for Products
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'খাদ্যপণ্য',
    costPrice: '',
    sellPrice: '',
    stock: '',
    minAlert: '5',
    image: ''
  });

  const [stockDelta, setStockDelta] = useState('');
  const [stockNote, setStockNote] = useState('');

  // Edit Product Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProductForm, setEditProductForm] = useState({
    id: '',
    name: '',
    sku: '',
    barcode: '',
    category: 'খাদ্যপণ্য',
    costPrice: '',
    sellPrice: '',
    stock: '',
    minAlert: '5',
    image: ''
  });

  // Bulk CSV Import / Export States
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [parsedCsvRows, setParsedCsvRows] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvError, setCsvError] = useState('');
  const fileInputRef = useRef(null);

  // ----------------------------------------------------
  // DAMAGED GOODS STATE & FILTERS
  // ----------------------------------------------------
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageSearch, setDamageSearch] = useState('');
  const deferredDamageSearch = useDeferredValue(damageSearch);
  const [damageReasonFilter, setDamageReasonFilter] = useState('all');
  const [damageForm, setDamageForm] = useState({
    productId: '',
    quantity: '',
    reason: 'ভাঙা / বোতল লিক (Broken/Leakage)',
    unitCost: '',
    reportedBy: '',
    date: new Date().toISOString().split('T')[0],
    actionTaken: 'নষ্ট হিসেবে বাতিল',
    note: ''
  });

  // Filtered Products (Memoized with deferred search for instant typing)
  const filteredProducts = useMemo(() => {
    const q = deferredSearchTerm.trim().toLowerCase();
    return products.filter(p => {
      const matchesSearch = !q ||
                            p.name.toLowerCase().includes(q) ||
                            (p.barcode && p.barcode.toLowerCase().includes(q)) ||
                            (p.sku && p.sku.toLowerCase().includes(q));
      if (!matchesSearch) return false;
      const matchesAlert = !filterLowStock || p.stock <= p.minAlert;
      return matchesAlert;
    });
  }, [products, deferredSearchTerm, filterLowStock]);

  const totalProducts = products.length;
  const totalStockUnits = useMemo(() => products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0), [products]);
  const totalInventoryValue = useMemo(() => products.reduce((acc, p) => acc + ((Number(p.stock) || 0) * (Number(p.costPrice) || 0)), 0), [products]);
  const lowStockCount = useMemo(() => products.filter(p => (Number(p.stock) || 0) <= (Number(p.minAlert) || 5)).length, [products]);

  // ----------------------------------------------------
  // DAMAGED GOODS METRICS (Memoized)
  // ----------------------------------------------------
  const totalDamagedEntries = damagedGoods.length;
  const totalDamagedUnits = useMemo(() => damagedGoods.reduce((sum, d) => sum + Number(d.quantity || 0), 0), [damagedGoods]);
  const totalDamagedLoss = useMemo(() => damagedGoods.reduce((sum, d) => sum + Number(d.totalLoss || 0), 0), [damagedGoods]);
  const thisMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const thisMonthDamagedLoss = useMemo(() => damagedGoods
    .filter(d => (d.date || '').startsWith(thisMonthStr))
    .reduce((sum, d) => sum + Number(d.totalLoss || 0), 0), [damagedGoods, thisMonthStr]);

  const filteredDamagedGoods = useMemo(() => {
    const query = deferredDamageSearch.trim().toLowerCase();
    return damagedGoods.filter(d => {
      const matchesSearch = !query ||
                            (d.productName || '').toLowerCase().includes(query) ||
                            (d.sku || '').toLowerCase().includes(query) ||
                            (d.reason || '').toLowerCase().includes(query) ||
                            (d.reportedBy || '').toLowerCase().includes(query);
      if (!matchesSearch) return false;
      const matchesReason = damageReasonFilter === 'all' || (d.reason || '').includes(damageReasonFilter);
      return matchesReason;
    });
  }, [damagedGoods, deferredDamageSearch, damageReasonFilter]);

  // Product Actions
  const handleImageFileUpload = (e, target = 'new') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(lang === 'bn' ? 'ছবির সাইজ ২ মেগাবাইটের কম হতে হবে।' : 'Image size must be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target.result;
      if (target === 'edit') {
        setEditProductForm(prev => ({ ...prev, image: dataUrl }));
      } else {
        setNewProductForm(prev => ({ ...prev, image: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEditModal = (product) => {
    setEditProductForm({
      id: product.id,
      name: product.name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      category: product.category || 'খাদ্যপণ্য',
      costPrice: product.costPrice || 0,
      sellPrice: product.sellPrice || 0,
      stock: product.stock || 0,
      minAlert: product.minAlert || 5,
      image: product.image || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editProductForm.name || !editProductForm.sellPrice) return;
    updateProduct(editProductForm.id, {
      name: editProductForm.name,
      sku: editProductForm.sku,
      barcode: editProductForm.barcode,
      category: editProductForm.category,
      costPrice: Number(editProductForm.costPrice) || 0,
      sellPrice: Number(editProductForm.sellPrice) || 0,
      stock: Number(editProductForm.stock) || 0,
      minAlert: Number(editProductForm.minAlert) || 5,
      image: editProductForm.image || ''
    });
    setShowEditModal(false);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.sellPrice) return;
    addProduct({
      ...newProductForm,
      sku: newProductForm.sku || `SKU-${Date.now().toString().slice(-6)}`,
      barcode: newProductForm.barcode || Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      image: newProductForm.image || ''
    });
    setNewProductForm({
      name: '',
      sku: '',
      barcode: '',
      category: 'খাদ্যপণ্য',
      costPrice: '',
      sellPrice: '',
      stock: '',
      minAlert: '5',
      image: ''
    });
    setShowAddModal(false);
  };

  const handleStockInSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct || !stockDelta) return;
    adjustStock(selectedProduct.id, stockDelta, 'in', stockNote);
    setShowStockInModal(false);
    setStockDelta('');
    setStockNote('');
  };

  const handleStockOutSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct || !stockDelta) return;
    adjustStock(selectedProduct.id, stockDelta, 'out', stockNote);
    setShowStockOutModal(false);
    setStockDelta('');
    setStockNote('');
  };

  const handlePrintTags = (product) => {
    openBarcodePrint(product);
  };

  const handleOpenScanner = (initialMode = 'barcode') => {
    openScanner((barcode, matchedProduct) => {
      if (matchedProduct) {
        setSearchTerm(matchedProduct.name || barcode);
      } else {
        setSearchTerm(barcode);
      }
    }, 'inventory', initialMode);
  };

  // ----------------------------------------------------
  // DAMAGED GOODS FORM SUBMISSION
  // ----------------------------------------------------
  const handleSelectDamagedProduct = (prodId) => {
    const found = products.find(p => p.id === prodId);
    if (found) {
      setDamageForm({
        ...damageForm,
        productId: prodId,
        unitCost: found.costPrice || 0
      });
    } else {
      setDamageForm({ ...damageForm, productId: '', unitCost: '' });
    }
  };

  const handleRecordDamageSubmit = (e) => {
    e.preventDefault();
    if (!damageForm.quantity || Number(damageForm.quantity) <= 0) return;

    recordDamagedGoods({
      productId: damageForm.productId || null,
      quantity: Number(damageForm.quantity),
      reason: damageForm.reason,
      unitCost: Number(damageForm.unitCost) || 0,
      reportedBy: damageForm.reportedBy,
      date: damageForm.date,
      actionTaken: damageForm.actionTaken,
      note: damageForm.note
    });

    setDamageForm({
      productId: '',
      quantity: '',
      reason: 'ভাঙা / বোতল লিক (Broken/Leakage)',
      unitCost: '',
      reportedBy: '',
      date: new Date().toISOString().split('T')[0],
      actionTaken: 'নষ্ট হিসেবে বাতিল',
      note: ''
    });
    setShowDamageModal(false);
  };

  // ----------------------------------------------------
  // BULK CSV PRODUCT IMPORT & EXPORT
  // ----------------------------------------------------
  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    setCsvError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCsvText(text);
        setParsedCsvRows(parsed);
        setShowCsvModal(true);
      } catch (err) {
        setCsvError(err.message);
        setShowCsvModal(true);
      }
    };
    reader.onerror = () => {
      setCsvError(lang === 'bn' ? 'ফাইল পড়তে ব্যর্থ হয়েছে' : 'Failed to read file');
      setShowCsvModal(true);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const parseCsvText = (text) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error(lang === 'bn' ? 'CSV ফাইলে কোনো ডেটা পাওয়া যায়নি' : 'CSV file is empty or missing headers');
    }

    const parseRow = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = parseRow(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, '').trim());
    const findIndex = (aliases) => {
      return rawHeaders.findIndex(h => aliases.some(alias => h.includes(alias.toLowerCase())));
    };

    const nameIdx = findIndex(['name', 'title', 'নাম', 'পণ্য']);
    const catIdx = findIndex(['category', 'cat', 'ক্যাটাগরি', 'বিভাগ']);
    const costIdx = findIndex(['cost', 'buy', 'purchase', 'ক্রয়মূল্য', 'কেনা', 'ক্রয়']);
    const sellIdx = findIndex(['sell', 'sale', 'price', 'mrp', 'বিক্রয়মূল্য', 'বিক্রি', 'মূল্য']);
    const stockIdx = findIndex(['stock', 'qty', 'quantity', 'মজুদ', 'পরিমাণ', 'স্টক']);
    const unitIdx = findIndex(['unit', 'একক']);
    const barcodeIdx = findIndex(['barcode', 'বারকোড', 'কোড']);
    const skuIdx = findIndex(['sku', 'এসকেইউ']);
    const minAlertIdx = findIndex(['alert', 'min', 'সতর্কতা']);

    if (nameIdx === -1) {
      throw new Error(lang === 'bn' ? 'CSV ফাইলে পণ্যের "নাম (Name)" কলামটি পাওয়া যায়নি।' : 'Header "Name" column not found');
    }

    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseRow(lines[i]);
      if (cols.length === 0 || !cols[nameIdx]) continue;

      const name = cols[nameIdx].replace(/^["']|["']$/g, '');
      const category = (catIdx !== -1 && cols[catIdx]) ? cols[catIdx].replace(/^["']|["']$/g, '') : 'সাধারণ পণ্য';
      const costPrice = (costIdx !== -1 && cols[costIdx]) ? parseFloat(cols[costIdx].replace(/[^0-9.]/g, '')) || 0 : 0;
      const sellPrice = (sellIdx !== -1 && cols[sellIdx]) ? parseFloat(cols[sellIdx].replace(/[^0-9.]/g, '')) || 0 : 0;
      const stock = (stockIdx !== -1 && cols[stockIdx]) ? parseFloat(cols[stockIdx].replace(/[^0-9.]/g, '')) || 0 : 0;
      const unit = (unitIdx !== -1 && cols[unitIdx]) ? cols[unitIdx].replace(/^["']|["']$/g, '') : 'পিস';
      const barcode = (barcodeIdx !== -1 && cols[barcodeIdx]) ? cols[barcodeIdx].replace(/[^0-9a-zA-Z]/g, '') : '';
      const sku = (skuIdx !== -1 && cols[skuIdx]) ? cols[skuIdx].replace(/[^0-9a-zA-Z-]/g, '') : '';
      const minAlert = (minAlertIdx !== -1 && cols[minAlertIdx]) ? parseFloat(cols[minAlertIdx].replace(/[^0-9.]/g, '')) || 5 : 5;

      items.push({
        name,
        category,
        costPrice,
        sellPrice: sellPrice > 0 ? sellPrice : costPrice,
        stock,
        unit,
        barcode,
        sku,
        minAlert
      });
    }

    if (items.length === 0) {
      throw new Error(lang === 'bn' ? 'CSV ফাইলে কোনো প্রোডাক্ট রো পাওয়া যায়নি।' : 'No valid product rows found in CSV');
    }

    return items;
  };

  const handleConfirmCsvImport = () => {
    if (parsedCsvRows.length > 0) {
      bulkAddProducts(parsedCsvRows);
      setShowCsvModal(false);
      setParsedCsvRows([]);
      setCsvFileName('');
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      '\uFEFFনাম,ক্যাটাগরি,ক্রয়মূল্য,বিক্রয়মূল্য,মজুদ,একক,বারকোড,এসকেইউ,সতর্কতা\n' +
      'প্রাণ গুঁড়া দুধ ৫০০ গ্রাম,মুদি মালামাল,380,450,40,প্যাকেট,894110012345,MILK-001,5\n' +
      'রুপচাঁদা সয়াবিন তেল ২ লিটার,ভোজ্য তেল,340,390,25,বোতল,894110054321,OIL-002,10\n' +
      'নাজিরশাইল প্রিমিয়াম চাল ২৫ কেজি,চাল ও ডাল,1800,2100,15,ব্যাগ,894110098765,RICE-003,3\n' +
      'লাক্স সাবান ১০০ গ্রাম,প্রসাধন সামগ্রী,65,75,60,পিস,894110077889,SOAP-004,15\n' +
      'প্যারাসিটামল ৫০০ মিগ্রা (১০ পাতা),ঔষধ,80,100,100,পাতা,894110022334,MED-005,20';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sample_Products_Template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportProductsCsv = () => {
    let csv = '\uFEFFনাম,ক্যাটাগরি,ক্রয়মূল্য,বিক্রয়মূল্য,মজুদ,একক,বারকোড,এসকেইউ,সতর্কতা\n';
    products.forEach(p => {
      const cleanName = `"${(p.name || '').replace(/"/g, '""')}"`;
      const cleanCat = `"${(p.category || '').replace(/"/g, '""')}"`;
      csv += `${cleanName},${cleanCat},${p.costPrice || 0},${p.sellPrice || 0},${p.stock || 0},"${p.unit || 'পিস'}",${p.barcode || ''},${p.sku || ''},${p.minAlert || 5}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HisabKitab360_Products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedDamageProd = products.find(p => p.id === damageForm.productId);
  const calculatedLoss = (Number(damageForm.quantity) || 0) * (Number(damageForm.unitCost) || 0);

  return (
    <div className="animate-fade-in">
      {/* Hidden File Input for CSV Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,.txt"
        style={{ display: 'none' }}
        onChange={handleCsvFileChange}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Boxes size={22} style={{ color: 'var(--business-primary)' }} />
            <span>{t.business.inventoryTitle}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'মজুদ পণ্য নিয়ন্ত্রণ, বারকোড এবং ড্যামেজ ও নষ্ট মালের হিসাব' : 'Manage inventory stock, barcodes, and damaged goods waste tracker'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {inventoryTab === 'products' ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                title={lang === 'bn' ? 'CSV বা এক্সেল ফাইল থেকে একসাথে শত শত পণ্য আপলোড করুন' : 'Import bulk products from CSV file'}
                style={{ borderColor: 'var(--business-primary)', color: 'var(--business-primary)', fontWeight: '700' }}
              >
                <Upload size={16} />
                <span>{lang === 'bn' ? '📥 CSV আপলোড' : '📥 Import CSV'}</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={downloadSampleCsv}
                title={lang === 'bn' ? 'পণ্য এন্ট্রির স্যাম্পল CSV ফরম্যাট ডাউনলোড করুন' : 'Download sample CSV template'}
              >
                <Download size={16} />
                <span>{lang === 'bn' ? '📄 স্যাম্পল CSV' : '📄 Sample CSV'}</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={exportProductsCsv}
                title={lang === 'bn' ? 'সকল পণ্যের তালিকা CSV ফাইলে ডাউনলোড করুন' : 'Export catalog to CSV'}
              >
                <FileSpreadsheet size={16} />
                <span>{lang === 'bn' ? '📤 এক্সপোর্ট' : '📤 Export'}</span>
              </button>

              <button className="btn btn-secondary" onClick={handleOpenScanner} title={lang === 'bn' ? 'বারকোড স্ক্যান করে পণ্য খুঁজুন' : 'Scan to search product'}>
                <Barcode size={16} style={{ color: 'var(--business-primary)' }} />
                <span>{lang === 'bn' ? '📷 স্ক্যান' : '📷 Scan'}</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => { setSelectedStickerProduct(null); setShowBarcodeStickerModal(true); }}
                title={lang === 'bn' ? 'কাস্টম সাইজের বারকোড স্টিকার প্রিন্ট স্টুডিও' : 'Print Barcode Stickers'}
                style={{ fontWeight: '700', borderColor: '#f59e0b', color: '#f59e0b' }}
              >
                <Barcode size={16} />
                <span>{lang === 'bn' ? '🏷️ স্টিকার স্টুডিও' : '🏷️ Sticker Studio'}</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShowCategoryModal(true)}
                title={lang === 'bn' ? 'পণ্যের ক্যাটাগরি তালিকা পরিচালনা (যোগ/রিনেম/ডিলিট)' : 'Manage product categories'}
              >
                <Tag size={16} style={{ color: 'var(--business-primary)' }} />
                <span>{lang === 'bn' ? '🏷️ ক্যাটাগরি' : '🏷️ Categories'}</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShowMasterHubModal(true)}
                title={lang === 'bn' ? 'সকল ফোল্ডার, ইউনিট, ব্র্যান্ড ও ক্যাটাগরি সেটআপ হাব' : 'Open Master Setup Hub'}
                style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#6366f1', fontWeight: '700' }}
              >
                <FolderOpen size={16} />
                <span>{lang === 'bn' ? '📁 মাস্টার ডাটা হাব' : '📁 Master Hub'}</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShowReorderModal(true)}
                title={lang === 'bn' ? 'শেষ হয়ে যাওয়া পণ্যের ক্রয়ের ফর্দ ও রি-অর্ডার রিকুইজিশন' : 'Reorder & Low Stock Shopping List'}
                style={{ borderColor: 'rgba(245, 158, 11, 0.5)', color: '#f59e0b', fontWeight: '700' }}
              >
                <Boxes size={16} />
                <span>{lang === 'bn' ? '📋 ক্রয়ের ফর্দ' : '📋 Reorder List'}</span>
                {lowStockCount > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: '800'
                    }}
                  >
                    {lowStockCount}
                  </span>
                )}
              </button>

              <button className="btn btn-secondary" onClick={() => { setSelectedProduct(products[0]); setShowStockInModal(true); }}>
                <ArrowDownLeft size={16} style={{ color: '#10b981' }} />
                <span>{t.business.stockIn}</span>
              </button>

              <button className="btn btn-secondary" onClick={() => { setSelectedProduct(products[0]); setShowStockOutModal(true); }}>
                <ArrowUpRight size={16} style={{ color: '#ef4444' }} />
                <span>{t.business.stockOut}</span>
              </button>

              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} />
                <span>{t.business.addProduct}</span>
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => setShowDamageModal(true)}
              style={{ background: '#ef4444', borderColor: '#ef4444' }}
            >
              <AlertOctagon size={16} />
              <span>{lang === 'bn' ? '+ ড্যামেজ মালের এন্ট্রি দিন' : '+ Record Damaged Stock'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${inventoryTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setInventoryTab('products')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontWeight: '700' }}
        >
          <Boxes size={18} />
          <span>{lang === 'bn' ? `পণ্য ও মজুদ স্টক (${products.length})` : `Products & Stock (${products.length})`}</span>
        </button>

        <button
          className={`btn ${inventoryTab === 'damaged' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setInventoryTab('damaged')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontWeight: '700',
            background: inventoryTab === 'damaged' ? '#ef4444' : undefined,
            borderColor: inventoryTab === 'damaged' ? '#ef4444' : undefined
          }}
        >
          <AlertOctagon size={18} />
          <span>{lang === 'bn' ? `ড্যামেজ ও নষ্ট মালের হিসাব (${damagedGoods.length})` : `Damaged Goods Tracker (${damagedGoods.length})`}</span>
          {totalDamagedLoss > 0 && (
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', marginLeft: '4px' }}>
              ৳{totalDamagedLoss.toLocaleString()} ক্ষতি
            </span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ALL PRODUCTS & STOCK */}
      {/* ======================================================== */}
      {inventoryTab === 'products' && (
        <>
          {/* Top Inventory Metrics */}
          <div className="stats-grid">
            <div className="glass-card stat-card glow-card">
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                <Package size={24} />
              </div>
              <div className="stat-info">
                <h3>{lang === 'bn' ? 'মোট পণ্যের আইটেম' : 'Total Items'}</h3>
                <div className="stat-value">{totalProducts}</div>
                <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
                  {totalStockUnits} {lang === 'bn' ? 'ইউনিট মজুদ আছে' : 'units in stock'}
                </div>
              </div>
            </div>

            <div className="glass-card stat-card glow-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <Tag size={24} />
              </div>
              <div className="stat-info">
                <h3>{lang === 'bn' ? 'মজুদ পণ্যের ক্রয়মূল্য' : 'Inventory Asset Value'}</h3>
                <div className="stat-value">
                  {canViewCostPrice ? `৳${totalInventoryValue.toLocaleString()}` : '🔒 ***'}
                </div>
                <div className="stat-trend" style={{ color: canViewCostPrice ? '#10b981' : 'var(--text-dim)' }}>
                  {canViewCostPrice ? (lang === 'bn' ? 'বর্তমান ভ্যালুয়েশন' : 'Current Cost Value') : (lang === 'bn' ? 'মালিকের অনুমতি প্রয়োজন' : 'Owner Only')}
                </div>
              </div>
            </div>

            <div
              className="glass-card stat-card glow-card"
              style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
              onClick={() => setShowReorderModal(true)}
              title={lang === 'bn' ? 'মালের ক্রয়ের ফর্দ ওপেন করতে ক্লিক করুন' : 'Click to view Reorder List'}
            >
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                <AlertTriangle size={24} />
              </div>
              <div className="stat-info">
                <h3>{t.business.stockAlerts}</h3>
                <div className="stat-value" style={{ color: lowStockCount > 0 ? '#ef4444' : '#10b981' }}>
                  {lowStockCount}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginTop: '3px' }}>
                  <div className="stat-trend" style={{ color: '#ef4444', margin: 0 }}>
                    {lowStockCount > 0 ? (lang === 'bn' ? 'স্টক রিঅর্ডার প্রয়োজন' : 'Needs Restock') : (lang === 'bn' ? 'সবকিছু স্বাভাবিক' : 'Stock Healthy')}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '800', background: 'rgba(245, 158, 11, 0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                    📋 ফর্দ ➔
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="glass-card" style={{ padding: '0.875rem', marginBottom: '1.25rem', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '36px', paddingRight: '40px' }}
                placeholder={lang === 'bn' ? 'পণ্যের নাম, SKU অথবা বারকোড দিয়ে খুঁজুন (মুখে বলতে মাইকে চাপুন)...' : 'Search by product name, SKU or barcode (or click mic)...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' }}>
                <VoiceInputButton
                  onTranscript={(text) => setSearchTerm(text)}
                  title={lang === 'bn' ? 'মুখে পণ্যের নাম বলুন' : 'Voice search product'}
                  size={14}
                  style={{ padding: '3px 6px', background: 'transparent', border: 'none' }}
                />
              </div>
            </div>

            <button
              className={`btn ${filterLowStock ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setFilterLowStock(!filterLowStock)}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <AlertTriangle size={15} />
              <span>{lang === 'bn' ? 'শুধুমাত্র লো-স্টক' : 'Low Stock Only'} ({lowStockCount})</span>
            </button>
          </div>

          {/* Inventory Product Table */}
          <div className="glass-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.business.productName}</th>
                    <th>{t.business.skuBarcode}</th>
                    <th>{t.category}</th>
                    <th style={{ textAlign: 'right' }}>{t.business.costPrice}</th>
                    <th style={{ textAlign: 'right' }}>{t.business.sellPrice}</th>
                    <th style={{ textAlign: 'center' }}>{t.business.margin}</th>
                    <th style={{ textAlign: 'center' }}>{t.business.stockQty}</th>
                    <th style={{ textAlign: 'center' }}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isLow = p.stock <= p.minAlert;
                    const margin = p.costPrice > 0 ? Math.round(((p.sellPrice - p.costPrice) / p.costPrice) * 100) : 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : null}
                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{p.name}</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {p.sku}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {p.barcode}
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {canViewCostPrice ? `৳${p.costPrice.toLocaleString()}` : <span style={{ color: 'var(--text-muted)' }}>🔒 ***</span>}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-main)' }}>
                          ৳{p.sellPrice.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {canViewCostPrice ? (
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: margin >= 20 ? '#10b981' : '#f59e0b' }}>
                              {margin}%
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {isLow && <AlertTriangle size={12} />}
                            <span style={{ fontWeight: '700' }}>{p.stock}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                            <button
                              className="btn-icon"
                              title={lang === 'bn' ? 'পণ্য ও ছবি সম্পাদনা করুন' : 'Edit Product & Photo'}
                              onClick={() => handleOpenEditModal(p)}
                              style={{ color: '#3b82f6' }}
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              className="btn-icon"
                              title={lang === 'bn' ? 'বারকোড স্টিকার প্রিন্ট করুন' : 'Print Barcode Sticker'}
                              onClick={() => { setSelectedStickerProduct(p); setShowBarcodeStickerModal(true); }}
                              style={{ color: '#6366f1' }}
                            >
                              <Barcode size={15} />
                            </button>
                            <button
                              className="btn-icon"
                              title={t.business.stockIn}
                              onClick={() => { setSelectedProduct(p); setShowStockInModal(true); }}
                              style={{ color: '#10b981' }}
                            >
                              <ArrowDownLeft size={15} />
                            </button>
                            <button
                              className="btn-icon"
                              title={t.business.stockOut}
                              onClick={() => { setSelectedProduct(p); setShowStockOutModal(true); }}
                              style={{ color: '#ef4444' }}
                            >
                              <ArrowUpRight size={15} />
                            </button>
                            <button
                              className="btn-icon"
                              title={t.delete}
                              onClick={() => {
                                if (window.confirm(lang === 'bn' ? 'পণ্যটি মুছে ফেলতে চান?' : 'Delete product?')) {
                                  deleteProduct(p.id);
                                }
                              }}
                              style={{ color: '#94a3b8' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DAMAGED GOODS / STOCK WASTE MANAGEMENT */}
      {/* ======================================================== */}
      {inventoryTab === 'damaged' && (
        <div className="animate-fade-in">
          {/* Damaged Goods Metrics */}
          <div className="stats-grid">
            <div className="glass-card stat-card glow-card">
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                <AlertOctagon size={24} />
              </div>
              <div className="stat-info">
                <h3>{lang === 'bn' ? 'মোট ড্যামেজ এন্ট্রি' : 'Total Damage Records'}</h3>
                <div className="stat-value" style={{ color: '#ef4444' }}>{totalDamagedEntries}</div>
                <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
                  {totalDamagedUnits} {lang === 'bn' ? 'টি পণ্য নষ্ট হয়েছে' : 'units damaged/wasted'}
                </div>
              </div>
            </div>

            <div className="glass-card stat-card glow-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <TrendingDown size={24} />
              </div>
              <div className="stat-info">
                <h3>{lang === 'bn' ? 'মোট আর্থিক ক্ষতি (লস)' : 'Total Financial Loss'}</h3>
                <div className="stat-value" style={{ color: '#ef4444', fontFamily: 'monospace' }}>
                  ৳{totalDamagedLoss.toLocaleString()}
                </div>
                <div className="stat-trend" style={{ color: 'var(--text-dim)' }}>
                  {lang === 'bn' ? 'ক্রয়মূল্য বা উৎপাদন খরচ অনুযায়ী' : 'Based on product cost price'}
                </div>
              </div>
            </div>

            <div className="glass-card stat-card glow-card">
              <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                <Calendar size={24} />
              </div>
              <div className="stat-info">
                <h3>{lang === 'bn' ? 'চলতি মাসের ক্ষতি' : 'This Month Damage Loss'}</h3>
                <div className="stat-value" style={{ color: '#f59e0b', fontFamily: 'monospace' }}>
                  ৳{thisMonthDamagedLoss.toLocaleString()}
                </div>
                <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'চলতি মাসের অপচয় ও ক্ষতি' : 'Monthly waste total'}
                </div>
              </div>
            </div>
          </div>

          {/* Damaged Goods Search & Filter Bar */}
          <div className="glass-card" style={{ padding: '0.875rem', marginBottom: '1.25rem', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '36px' }}
                placeholder={lang === 'bn' ? 'পণ্যের নাম, কারণ অথবা এন্ট্রি দিয়ে খুঁজুন...' : 'Search damaged goods by product, reason, reporter...'}
                value={damageSearch}
                onChange={(e) => setDamageSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'কারণ:' : 'Reason:'}</span>
              <select
                className="input-field"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
                value={damageReasonFilter}
                onChange={(e) => setDamageReasonFilter(e.target.value)}
              >
                <option value="all">{lang === 'bn' ? 'সকল কারণ' : 'All Reasons'}</option>
                <option value="ভাঙা">{lang === 'bn' ? 'ভাঙা / লিক' : 'Broken / Leak'}</option>
                <option value="মেয়াদ">{lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Expired'}</option>
                <option value="প্যাকেজিং">{lang === 'bn' ? 'প্যাকেজিং ক্ষতি' : 'Damaged Packaging'}</option>
                <option value="পরিবহনে">{lang === 'bn' ? 'পরিবহনে ক্ষতি' : 'Transit Damage'}</option>
                <option value="আর্দ্রতা">{lang === 'bn' ? 'আর্দ্রতা / পোকা' : 'Moisture / Rot'}</option>
              </select>
            </div>
          </div>

          {/* Damaged Goods Data Table */}
          <div className="glass-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                    <th>{lang === 'bn' ? 'নষ্ট পণ্যের নাম ও SKU' : 'Product & SKU'}</th>
                    <th style={{ textAlign: 'center' }}>{lang === 'bn' ? 'পরিমাণ' : 'Qty'}</th>
                    <th style={{ textAlign: 'right' }}>{lang === 'bn' ? 'একক খরচ' : 'Unit Cost'}</th>
                    <th style={{ textAlign: 'right' }}>{lang === 'bn' ? 'মোট আর্থিক ক্ষতি' : 'Total Loss'}</th>
                    <th>{lang === 'bn' ? 'ক্ষতির কারণ' : 'Reason'}</th>
                    <th>{lang === 'bn' ? 'রেকর্ডকারী ও স্থিতি' : 'Reported By & Action'}</th>
                    <th>{lang === 'bn' ? 'মন্তব্য / নোট' : 'Note'}</th>
                    <th style={{ textAlign: 'center' }}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDamagedGoods.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle2 size={36} style={{ color: '#10b981' }} />
                          <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                            {lang === 'bn' ? 'কোনো ড্যামেজ বা নষ্ট মালের রেকর্ড নেই!' : 'No damaged goods recorded!'}
                          </div>
                          <div style={{ fontSize: '0.85rem' }}>
                            {lang === 'bn' ? 'সব পণ্য সুরক্ষিত আছে।' : 'All inventory is currently safe.'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDamagedGoods.map((dmg) => (
                      <tr key={dmg.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {dmg.date}
                        </td>
                        <td>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                            {dmg.productName}
                          </div>
                          {dmg.sku && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              {dmg.sku}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-danger" style={{ fontWeight: '800', fontSize: '0.85rem' }}>
                            {dmg.quantity} টি
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          ৳{dmg.unitCost ? Number(dmg.unitCost).toLocaleString() : '০'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#ef4444', fontSize: '0.95rem' }}>
                          ৳{dmg.totalLoss ? Number(dmg.totalLoss).toLocaleString() : '০'}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                          >
                            {dmg.reason}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                            {dmg.reportedBy || 'স্টাফ'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {dmg.actionTaken || 'বাতিল'}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
                          {dmg.note || '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn-icon"
                            title={lang === 'bn' ? 'ড্যামেজ রেকর্ড বাতিল করুন এবং স্টক ফেরত দিন' : 'Delete and restore stock'}
                            onClick={() => {
                              if (window.confirm(lang === 'bn' ? 'এই ড্যামেজ এন্ট্রি মুছে ফেলতে চান? পণ্যটি পুনরায় ইনভেন্টরি স্টকে ফেরত যোগ হবে।' : 'Delete damage record and restore stock?')) {
                                deleteDamagedRecord(dmg.id, true);
                              }
                            }}
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RECORD DAMAGED GOODS MODAL */}
      {/* ======================================================== */}
      {showDamageModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '580px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <AlertOctagon size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'ড্যামেজ ও নষ্ট মালের হিসাব এন্ট্রি' : 'Record Damaged Stock / Waste'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'পণ্যের ক্ষতি নথিভুক্ত করুন, ইনভেন্টরি স্টক স্বয়ংক্রিয়ভাবে কমে যাবে' : 'Records financial loss and deducts stock from inventory'}
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowDamageModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordDamageSubmit}>
              {/* Product Selection */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="field-label" style={{ fontWeight: '700' }}>
                  {lang === 'bn' ? 'নষ্ট / ক্ষতিগ্রস্থ পণ্য নির্বাচন করুন:' : 'Select Damaged Product:'} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="input-field"
                  required
                  value={damageForm.productId}
                  onChange={(e) => handleSelectDamagedProduct(e.target.value)}
                >
                  <option value="">{lang === 'bn' ? '-- পণ্য সিলেক্ট করুন --' : '-- Select Product --'}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (মজুদ: {p.stock} টি | ক্রয়মূল্য: ৳{p.costPrice})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Unit Cost */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label" style={{ fontWeight: '700' }}>
                    {lang === 'bn' ? 'নষ্টের পরিমাণ (সংখ্যা):' : 'Damaged Qty:'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedDamageProd ? selectedDamageProd.stock : 9999}
                    className="input-field"
                    required
                    placeholder="যেমন: ২"
                    value={damageForm.quantity}
                    onChange={(e) => setDamageForm({ ...damageForm, quantity: e.target.value })}
                  />
                  {selectedDamageProd && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {lang === 'bn' ? `বর্তমানে স্টকে আছে: ${selectedDamageProd.stock} টি` : `Current stock: ${selectedDamageProd.stock}`}
                    </div>
                  )}
                </div>

                <div>
                  <label className="field-label" style={{ fontWeight: '700' }}>
                    {lang === 'bn' ? 'একক ক্রয়মূল্য (৳):' : 'Unit Cost Price (৳):'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    placeholder="৳"
                    value={damageForm.unitCost}
                    onChange={(e) => setDamageForm({ ...damageForm, unitCost: e.target.value })}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    {lang === 'bn' ? 'পণ্যের কেনা দাম অনুযায়ী স্বয়ংক্রিয়' : 'Auto-filled from product cost'}
                  </div>
                </div>
              </div>

              {/* Real-time Loss Summary Preview */}
              {calculatedLoss > 0 && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px dashed #ef4444', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                    <AlertTriangle size={18} />
                    <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>
                      {lang === 'bn' ? 'মোট আর্থিক ক্ষতির হিসাব:' : 'Calculated Financial Loss:'}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ef4444', fontFamily: 'monospace' }}>
                    ৳{calculatedLoss.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Reason & Action Taken */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label" style={{ fontWeight: '700' }}>
                    {lang === 'bn' ? 'ক্ষতির কারণ:' : 'Reason for Damage:'}
                  </label>
                  <select
                    className="input-field"
                    value={damageForm.reason}
                    onChange={(e) => setDamageForm({ ...damageForm, reason: e.target.value })}
                  >
                    <option value="ভাঙা / বোতল লিক (Broken/Leakage)">{lang === 'bn' ? 'ভাঙা / বোতল লিক (Broken/Leakage)' : 'Broken / Leakage'}</option>
                    <option value="মেয়াদ উত্তীর্ণ (Expired)">{lang === 'bn' ? 'মেয়াদ উত্তীর্ণ (Expired)' : 'Expired'}</option>
                    <option value="প্যাকেজিং নষ্ট / ছেঁড়া (Damaged Foil)">{lang === 'bn' ? 'প্যাকেজিং নষ্ট / ছেঁড়া (Damaged Packaging)' : 'Damaged Packaging'}</option>
                    <option value="পরিবহনে ক্ষতি (Transit Damage)">{lang === 'bn' ? 'পরিবহনে ক্ষতি (Transit Damage)' : 'Transit Damage'}</option>
                    <option value="আর্দ্রতা / পচা / ফাঙ্গাস (Moisture/Pest)">{lang === 'bn' ? 'আর্দ্রতা / পচা / ফাঙ্গাস (Moisture/Pest)' : 'Moisture / Rot'}</option>
                    <option value="অন্যান্য সমস্যা (Other)">{lang === 'bn' ? 'অন্যান্য সমস্যা (Other)' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="field-label" style={{ fontWeight: '700' }}>
                    {lang === 'bn' ? 'নিষ্পত্তির ব্যবস্থা:' : 'Disposal Action:'}
                  </label>
                  <select
                    className="input-field"
                    value={damageForm.actionTaken}
                    onChange={(e) => setDamageForm({ ...damageForm, actionTaken: e.target.value })}
                  >
                    <option value="নষ্ট হিসেবে বাতিল">{lang === 'bn' ? 'নষ্ট হিসেবে বাতিল (Written Off)' : 'Written Off'}</option>
                    <option value="ফেলে দেওয়া হয়েছে">{lang === 'bn' ? 'ফেলে দেওয়া হয়েছে (Discarded)' : 'Discarded'}</option>
                    <option value="সাপ্লায়ার রিটার্ন ক্লেইম">{lang === 'bn' ? 'সাপ্লায়ার রিটার্ন ক্লেইম (Supplier Return)' : 'Supplier Return'}</option>
                  </select>
                </div>
              </div>

              {/* Date & Reporter */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label">{lang === 'bn' ? 'তারিখ:' : 'Date:'}</label>
                  <input
                    type="date"
                    className="input-field"
                    value={damageForm.date}
                    onChange={(e) => setDamageForm({ ...damageForm, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'রিপোর্টকারী ব্যক্তি / স্টাফ:' : 'Reported By:'}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={lang === 'bn' ? 'স্টাফের নাম' : 'Staff Name'}
                    value={damageForm.reportedBy}
                    onChange={(e) => setDamageForm({ ...damageForm, reportedBy: e.target.value })}
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="field-label">{lang === 'bn' ? 'বিস্তারিত নোট / কারণ বিবরণ:' : 'Details & Note:'}</label>
                <textarea
                  className="input-field"
                  rows="2"
                  placeholder={lang === 'bn' ? 'যেমন: গাড়ি থেকে নামানোর সময় পড়ে ড্রপ হয়ে বোতল ভেঙেছে...' : 'Incident note...'}
                  value={damageForm.note}
                  onChange={(e) => setDamageForm({ ...damageForm, note: e.target.value })}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}
                >
                  <AlertOctagon size={16} />
                  <span>{lang === 'bn' ? 'ড্যামেজ রেকর্ড করুন ও স্টক কমান' : 'Record Damage & Deduct Stock'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDamageModal(false)}
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD PRODUCT MODAL */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>{t.business.addProduct}</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {/* Smart Voice Auto-Fill Banner */}
            <SmartVoiceFormBanner
              mode="product"
              lang={lang}
              onParsed={(parsed) => {
                setNewProductForm(prev => ({
                  ...prev,
                  name: parsed.name || prev.name,
                  costPrice: parsed.costPrice ? Number(parsed.costPrice) : prev.costPrice,
                  sellPrice: parsed.sellPrice ? Number(parsed.sellPrice) : prev.sellPrice,
                  stock: parsed.stock ? Number(parsed.stock) : prev.stock,
                  unit: parsed.unit || prev.unit
                }));
              }}
            />

            <form onSubmit={handleAddSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="field-label" style={{ margin: 0 }}>{t.business.productName}</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setNewProductForm(prev => ({ ...prev, name: txt }))}
                    title="মুখে বলুন পণ্যের নাম"
                  />
                </div>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="যেমন: তীর সয়াবিন তেল ৫ লিটার"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label">{t.business.skuBarcode} (SKU)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="যেমন: OIL-SOY-05"
                    value={newProductForm.sku}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="field-label" style={{ margin: 0 }}>{t.category}</label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      title={lang === 'bn' ? 'ক্যাটাগরি রিনেম, অ্যাড বা ডিলিট করুন' : 'Manage categories'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--business-primary)',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: '1px 4px'
                      }}
                    >
                      ⚙️ {lang === 'bn' ? 'ম্যানেজ / রিনেম' : 'Manage'}
                    </button>
                  </div>
                  <select
                    className="input-field"
                    value={newProductForm.category}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowCategoryModal(true);
                      } else {
                        setNewProductForm({ ...newProductForm, category: e.target.value });
                      }
                    }}
                  >
                    {(categories.productCategories || ['খাদ্যপণ্য', 'তেল ও ঘি', 'পানীয়', 'দুগ্ধজাত', 'মশলা ও নিত্যপণ্য', 'কসমেটিকস ও কেয়ার', 'হাইজিন', 'স্টেশনারি']).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__add_new__" style={{ fontWeight: '700', color: 'var(--business-primary)' }}>
                      ➕ {lang === 'bn' ? 'নতুন ক্যাটাগরি যোগ বা রিনেম করুন...' : 'Add / Rename Category...'}
                    </option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label">{t.business.costPrice} (৳)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0"
                    value={newProductForm.costPrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, costPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="field-label">{t.business.sellPrice} (৳)</label>
                  <input
                    type="number"
                    required
                    className="input-field"
                    placeholder="0"
                    value={newProductForm.sellPrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sellPrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label">{t.business.stockQty}</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0"
                    value={newProductForm.stock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stock: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="field-label">{t.business.minStockAlert}</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="5"
                    value={newProductForm.minAlert}
                    onChange={(e) => setNewProductForm({ ...newProductForm, minAlert: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Product Photo: Upload from Device or Enter URL or Select Preset */}
              <div style={{ marginBottom: '1.25rem', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="field-label" style={{ margin: 0, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ImageIcon size={15} style={{ color: 'var(--business-primary)' }} />
                    <span>{lang === 'bn' ? 'পণ্যের ছবি (রেস্টুরেন্ট ও খুচরা পণ্যের জন্য):' : 'Product Photo:'}</span>
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ঐচ্ছিক</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="url"
                    className="input-field"
                    placeholder={lang === 'bn' ? 'ছবির লিংক (URL) লিখুন...' : 'Image URL...'}
                    value={newProductForm.image || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
                    style={{ flex: 1, fontSize: '0.82rem' }}
                  />
                  
                  {/* File Upload Button */}
                  <label
                    className="btn btn-secondary"
                    style={{
                      padding: '7px 12px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap'
                    }}
                    title={lang === 'bn' ? 'কম্পিউটার বা মোবাইল থেকে ছবি সিলেক্ট করুন' : 'Upload from device'}
                  >
                    <Upload size={14} />
                    <span>{lang === 'bn' ? 'আপলোড' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageFileUpload(e, 'new')}
                    />
                  </label>

                  {newProductForm.image && (
                    <div style={{ position: 'relative', width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--business-primary)', flexShrink: 0 }}>
                      <img src={newProductForm.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setNewProductForm({ ...newProductForm, image: '' })}
                        style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="রিমুভ"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Royalty-Free Preset Images */}
                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {lang === 'bn' ? '⚡ দ্রুত রেডি ছবি সিলেক্ট করুন:' : '⚡ Quick Preset Photos:'}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {PRESET_PRODUCT_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewProductForm({ ...newProductForm, image: preset.url })}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          background: newProductForm.image === preset.url ? 'var(--business-primary)' : 'rgba(255,255,255,0.06)',
                          color: newProductForm.image === preset.url ? '#fff' : 'var(--text-main)',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer'
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {t.business.addProduct}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT PRODUCT & PHOTO MODAL */}
      {/* ======================================================== */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <Edit size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                    {lang === 'bn' ? 'পণ্য ও ছবি সম্পাদনা করুন' : 'Edit Product & Photo'}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ID: {editProductForm.id}
                  </div>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="field-label">{t.business.productName}</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label">{t.business.skuBarcode} (SKU)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editProductForm.sku}
                    onChange={(e) => setEditProductForm({ ...editProductForm, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">{t.category}</label>
                  <select
                    className="input-field"
                    value={editProductForm.category}
                    onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                  >
                    {(categories.productCategories || ['খাদ্যপণ্য', 'তেল ও ঘি', 'পানীয়', 'দুগ্ধজাত', 'মশলা ও নিত্যপণ্য', 'কসমেটিকস ও কেয়ার', 'হাইজিন', 'স্টেশনারি']).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label">{t.business.costPrice} (৳)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editProductForm.costPrice}
                    onChange={(e) => setEditProductForm({ ...editProductForm, costPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="field-label">{t.business.sellPrice} (৳)</label>
                  <input
                    type="number"
                    required
                    className="input-field"
                    value={editProductForm.sellPrice}
                    onChange={(e) => setEditProductForm({ ...editProductForm, sellPrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label">{t.business.stockQty}</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editProductForm.stock}
                    onChange={(e) => setEditProductForm({ ...editProductForm, stock: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="field-label">{t.business.minStockAlert}</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editProductForm.minAlert}
                    onChange={(e) => setEditProductForm({ ...editProductForm, minAlert: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Product Photo: Upload from Device or Enter URL or Select Preset */}
              <div style={{ marginBottom: '1.25rem', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="field-label" style={{ margin: 0, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ImageIcon size={15} style={{ color: '#3b82f6' }} />
                    <span>{lang === 'bn' ? 'পণ্যের ছবি পরিবর্তন:' : 'Change Product Photo:'}</span>
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ঐচ্ছিক</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="url"
                    className="input-field"
                    placeholder={lang === 'bn' ? 'ছবির লিংক (URL) লিখুন...' : 'Image URL...'}
                    value={editProductForm.image || ''}
                    onChange={(e) => setEditProductForm({ ...editProductForm, image: e.target.value })}
                    style={{ flex: 1, fontSize: '0.82rem' }}
                  />
                  
                  {/* File Upload Button */}
                  <label
                    className="btn btn-secondary"
                    style={{
                      padding: '7px 12px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap'
                    }}
                    title={lang === 'bn' ? 'কম্পিউটার বা মোবাইল থেকে ছবি সিলেক্ট করুন' : 'Upload from device'}
                  >
                    <Upload size={14} />
                    <span>{lang === 'bn' ? 'আপলোড' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageFileUpload(e, 'edit')}
                    />
                  </label>

                  {editProductForm.image && (
                    <div style={{ position: 'relative', width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #3b82f6', flexShrink: 0 }}>
                      <img src={editProductForm.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setEditProductForm({ ...editProductForm, image: '' })}
                        style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="রিমুভ"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Royalty-Free Preset Images */}
                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {lang === 'bn' ? '⚡ দ্রুত রেডি ছবি সিলেক্ট করুন:' : '⚡ Quick Preset Photos:'}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {PRESET_PRODUCT_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditProductForm({ ...editProductForm, image: preset.url })}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          background: editProductForm.image === preset.url ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                          color: editProductForm.image === preset.url ? '#fff' : 'var(--text-main)',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer'
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#3b82f6', borderColor: '#3b82f6' }}>
                  {lang === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK IN MODAL */}
      {showStockInModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                <ArrowDownLeft size={20} />
                <span>{t.business.stockIn} - {selectedProduct.name}</span>
              </h3>
              <button className="btn-icon" onClick={() => setShowStockInModal(false)}>✕</button>
            </div>

            <form onSubmit={handleStockInSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="field-label">{lang === 'bn' ? 'বর্তমান মজুদ স্টক:' : 'Current Stock:'} <strong>{selectedProduct.stock}</strong></label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input-field"
                  placeholder={lang === 'bn' ? 'কত ইউনিট ইনভেন্টরিতে যোগ করবেন?' : 'Quantity to add'}
                  value={stockDelta}
                  onChange={(e) => setStockDelta(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="field-label">{lang === 'bn' ? 'নোট / চালান নম্বর (ঐচ্ছিক):' : 'Note / Challan No (Optional):'}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: মেঘনা চালান #৮৯২"
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#10b981', borderColor: '#10b981' }}>
                  {lang === 'bn' ? 'স্টক ইন সম্পন্ন করুন' : 'Confirm Stock In'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStockInModal(false)}>
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK OUT MODAL */}
      {showStockOutModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <ArrowUpRight size={20} />
                <span>{t.business.stockOut} - {selectedProduct.name}</span>
              </h3>
              <button className="btn-icon" onClick={() => setShowStockOutModal(false)}>✕</button>
            </div>

            <form onSubmit={handleStockOutSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="field-label">{lang === 'bn' ? 'বর্তমান মজুদ স্টক:' : 'Current Stock:'} <strong>{selectedProduct.stock}</strong></label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedProduct.stock}
                  className="input-field"
                  placeholder={lang === 'bn' ? 'কত ইউনিট বাদ দিবেন?' : 'Quantity to remove'}
                  value={stockDelta}
                  onChange={(e) => setStockDelta(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="field-label">{lang === 'bn' ? 'কারণ / নোট:' : 'Reason / Note:'}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: ক্ষতিগ্রস্থ বা অন্য শাখায় স্থানান্তর"
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>
                  {lang === 'bn' ? 'স্টক আউট সম্পন্ন করুন' : 'Confirm Stock Out'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStockOutModal(false)}>
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Tag / Barcode Label Generator Modal */}
      {showTagModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                {lang === 'bn' ? 'প্রোডাক্ট স্টক ট্যাগ ও প্রাইস লেবেল' : 'Product Price & Stock Barcode Tag'}
              </h3>
              <button className="btn-icon" onClick={() => setShowTagModal(false)}>✕</button>
            </div>

            {/* Visual Tag Preview */}
            <div
              id="printable-product-shelf-tag"
              className="printable-receipt"
              style={{
                border: '2px solid #0f172a',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                background: '#ffffff',
                color: '#0f172a',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                margin: '10px 0'
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b' }}>
                HISABKITAB RETAIL TAG
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '800', margin: '4px 0 8px', color: '#0f172a' }}>
                {selectedProduct.name}
              </h4>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#4f46e5', fontFamily: 'var(--font-mono)' }}>
                MRP: ৳{selectedProduct.sellPrice.toLocaleString()}
              </div>

              <div style={{ margin: '12px 0 4px', letterSpacing: '6px', fontSize: '22px', fontWeight: '900' }}>
                ||||||||||||||||||||||||||
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '600' }}>
                {selectedProduct.barcode}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                SKU: {selectedProduct.sku} | CAT: {selectedProduct.category}
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => printElement('printable-product-shelf-tag', { title: 'Product Tag - ' + selectedProduct.name, paperType: 'label' })}
              >
                <Printer size={16} />
                <span>{lang === 'bn' ? 'ট্যাগ প্রিন্ট করুন' : 'Print Shelf Tag'}</span>
              </button>
              <button className="btn btn-secondary" onClick={() => setShowTagModal(false)}>
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Preview & Confirmation Modal */}
      {showCsvModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--business-primary)', padding: '8px', borderRadius: '8px' }}>
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'CSV ফাইল থেকে পণ্য আপলোড প্রিভিউ' : 'Bulk Product CSV Import Preview'}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {csvFileName ? `ফাইল: ${csvFileName}` : ''}
                  </div>
                </div>
              </div>
              <button className="btn-icon" onClick={() => { setShowCsvModal(false); setParsedCsvRows([]); }}>✕</button>
            </div>

            {csvError ? (
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ color: '#ef4444', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <AlertTriangle size={24} />
                  <span style={{ fontSize: '1.05rem', fontWeight: '700' }}>{csvError}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  {lang === 'bn'
                    ? 'আপনার CSV ফাইলের কলাম ফরম্যাট সঠিক নাও হতে পারে। অনুগ্রহ করে নিচের স্যাম্পল টেমপ্লেটটি ডাউনলোড করে মিলিয়ে নিন।'
                    : 'The CSV format could not be processed. Please download our template to see the required column headers.'}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={downloadSampleCsv}>
                    <Download size={16} />
                    <span>{lang === 'bn' ? '📄 সঠিক স্যাম্পল CSV ডাউনলোড করুন' : 'Download Sample CSV'}</span>
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setShowCsvModal(false); setParsedCsvRows([]); }}>
                    {t.close}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'rgba(16, 185, 129, 0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '700', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} />
                    <span>{lang === 'bn' ? `মোট ${parsedCsvRows.length}টি পণ্য সফলভাবে রিড করা হয়েছে` : `${parsedCsvRows.length} products found in CSV`}</span>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    onClick={downloadSampleCsv}
                  >
                    <Download size={14} />
                    <span>{lang === 'bn' ? 'স্যাম্পল ফরম্যাট' : 'Sample Template'}</span>
                  </button>
                </div>

                <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1.25rem' }}>
                  <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{lang === 'bn' ? 'পণ্যের নাম' : 'Product Name'}</th>
                        <th>{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                        <th>{lang === 'bn' ? 'ক্রয়মূল্য' : 'Cost'}</th>
                        <th>{lang === 'bn' ? 'বিক্রয়মূল্য' : 'Sell Price'}</th>
                        <th>{lang === 'bn' ? 'মজুদ' : 'Stock'}</th>
                        <th>{lang === 'bn' ? 'বারকোড' : 'Barcode'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedCsvRows.slice(0, 30).map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                          <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>{row.name}</td>
                          <td>
                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                              {row.category}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>৳{row.costPrice}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#10b981' }}>৳{row.sellPrice}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{row.stock} {row.unit}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{row.barcode || 'অটো-জেনারেটেড'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedCsvRows.length > 30 && (
                    <div style={{ padding: '8px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                      {lang === 'bn' ? `এবং আরও ${parsedCsvRows.length - 30} টি পণ্য রয়েছে...` : `and ${parsedCsvRows.length - 30} more products...`}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <button className="btn btn-secondary" onClick={() => { setShowCsvModal(false); setParsedCsvRows([]); }}>
                    {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmCsvImport}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', padding: '10px 22px', fontSize: '0.95rem', fontWeight: '800' }}
                  >
                    <Sparkles size={16} />
                    <span>{lang === 'bn' ? `🚀 নিশ্চিত করুন ও ${parsedCsvRows.length}টি পণ্য ইনভেন্টরিতে যুক্ত করুন` : `Import ${parsedCsvRows.length} Products`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        defaultGroup="productCategories"
        onSelectCategory={(cat) => setNewProductForm((prev) => ({ ...prev, category: cat }))}
      />

      {/* Centralized Master Setup & Folder Hub Modal */}
      <MasterHubModal
        isOpen={showMasterHubModal}
        onClose={() => setShowMasterHubModal(false)}
      />

      {/* Business Low Stock Reorder & Purchase List Modal */}
      <BusinessReorderModal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
      />

      {/* Barcode & Price Tag Sticker Studio Modal */}
      <BarcodeStickerModal
        isOpen={showBarcodeStickerModal}
        onClose={() => { setShowBarcodeStickerModal(false); setSelectedStickerProduct(null); }}
        products={products}
        initialProduct={selectedStickerProduct}
        businessSettings={businessSettings}
        lang={lang}
        showToast={showToast}
      />
    </div>
  );
};
