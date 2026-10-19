import React, { useState, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  X,
  CheckCircle,
  Calendar,
  Tag,
  DollarSign,
  User,
  Clock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { showConfirmDialog } from '../../services/dialogService';

export default function RecycleBinModal({ isOpen, onClose }) {
  const {
    trashBin = [],
    restoreFromTrash,
    permanentDeleteFromTrash,
    emptyTrash,
    lang = 'bn'
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);

  // Filtered trash items
  const filteredItems = useMemo(() => {
    return trashBin.filter(item => {
      const matchSearch = (item.item || item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.folder || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.person || item.member || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = filterType === 'all' || item.originalType === filterType || item.type === filterType;
      return matchSearch && matchType;
    });
  }, [trashBin, searchTerm, filterType]);

  const totalTrashAmount = useMemo(() => {
    return trashBin.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [trashBin]);

  if (!isOpen) return null;

  const handlePermanentDelete = async (itemId, itemTitle) => {
    const ok = await showConfirmDialog({
      title: lang === 'bn' ? 'স্থায়ীভাবে মুছে ফেলতে চান?' : 'Permanently Delete?',
      message: lang === 'bn' 
        ? `"${itemTitle || 'আইটেমটি'}" স্থায়ীভাবে মুছে যাবে এবং এটি আর পুনরুদ্ধার করা যাবে না।`
        : `"${itemTitle || 'This item'}" will be permanently deleted and cannot be restored.`,
      confirmText: lang === 'bn' ? 'হ্যাঁ, স্থায়ীভাবে মুছুন' : 'Delete Permanently',
      type: 'danger'
    });
    if (ok) {
      permanentDeleteFromTrash(itemId);
    }
  };

  const formatDeletedTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          backgroundColor: 'var(--surface-color, #1e2230)',
          borderRadius: '20px',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(239, 68, 68, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--text-primary, #f8fafc)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(30, 34, 48, 0.8) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <Trash2 size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                  {lang === 'bn' ? 'রিসাইকেল বিন (Recycle Bin)' : 'Recycle Bin'}
                </h3>
                <span
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.25)',
                    color: '#fca5a5',
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                >
                  {trashBin.length} {lang === 'bn' ? 'টি আইটেম' : 'items'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                {lang === 'bn'
                  ? 'ডিলিট করা খরচগুলো এখানে নিরাপদে আছে। যেকোনো সময় রিস্টোর বা পার্মানেন্ট ডিলিট করতে পারেন।'
                  : 'Soft-deleted transactions are kept here safely for quick restoration or cleanup.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats & Search Toolbar */}
        <div style={{ padding: '16px 24px', backgroundColor: 'rgba(0, 0, 0, 0.15)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'মুছে ফেলা খরচের নাম বা ক্যাটাগরি সার্চ করুন...' : 'Search deleted expenses...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Total Amount Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <span>{lang === 'bn' ? 'মোট ট্র্যাশ অঙ্ক:' : 'Total Trash Amount:'}</span>
              <span style={{ fontSize: '1rem', fontWeight: 800 }}>৳{totalTrashAmount.toLocaleString('en-IN')}</span>
            </div>

            {/* Empty Trash Button */}
            {trashBin.length > 0 && (
              <div>
                {!showConfirmEmpty ? (
                  <button
                    onClick={() => setShowConfirmEmpty(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.18)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#ef4444',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={15} />
                    <span>{lang === 'bn' ? 'সম্পূর্ণ খালি করুন' : 'Empty Trash'}</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => {
                        emptyTrash();
                        setShowConfirmEmpty(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {lang === 'bn' ? 'হ্যাঁ, নিশ্চিত' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowConfirmEmpty(false)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#cbd5e1',
                        border: 'none',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {trashBin.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#64748b'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <CheckCircle size={32} />
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: '#e2e8f0', fontWeight: 600 }}>
                {lang === 'bn' ? 'রিসাইকেল বিন সম্পূর্ণ পরিষ্কার!' : 'Recycle Bin is Empty!'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
                {lang === 'bn'
                  ? 'কোনো মুছে ফেলা খরচ বা ট্রানজেকশন নেই। আপনার সকল হিসাব অক্ষত ও সুরক্ষিত।'
                  : 'No deleted expenses found. All your records are safe and intact.'}
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'কোনো মুছে ফেলা হিসাবের সাথে মিল পাওয়া যায়নি।' : 'No matching items found.'}
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const itemId = item.trashId || item.id;
              return (
                <div
                  key={itemId || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.2s ease',
                    gap: '12px'
                  }}
                >
                  {/* Left: Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px', flex: '1 1 200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
                        {item.item || item.title || 'খরচ'}
                      </span>
                      {item.folder && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            color: '#a5b4fc',
                            border: '1px solid rgba(99, 102, 241, 0.25)'
                          }}
                        >
                          {item.folder}
                        </span>
                      )}
                      {(item.person || item.member) && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            color: '#7dd3fc',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <User size={11} />
                          {item.person || item.member}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} style={{ color: '#64748b' }} />
                        {item.date || 'তারিখহীন'}
                      </span>
                      {item.deletedAt && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f87171' }}>
                          <Clock size={13} />
                          {lang === 'bn' ? 'ডিলিট:' : 'Deleted:'} {formatDeletedTime(item.deletedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fca5a5' }}>
                        ৳{Number(item.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Restore Button */}
                    <button
                      onClick={() => restoreFromTrash(itemId)}
                      title={lang === 'bn' ? 'পূর্বের জায়গায় রিস্টোর করুন' : 'Restore to active list'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#10b981',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <RotateCcw size={15} />
                      <span>{lang === 'bn' ? 'রিস্টোর' : 'Restore'}</span>
                    </button>

                    {/* Permanent Delete Button */}
                    <button
                      onClick={() => handlePermanentDelete(itemId, item.item || item.title)}
                      title={lang === 'bn' ? 'স্থায়ীভাবে চিরতরে মুছে ফেলুন' : 'Permanently Delete'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            fontSize: '0.8rem',
            color: '#64748b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} style={{ color: '#10b981' }} />
            <span>{lang === 'bn' ? 'রিয়েলটাইম ক্লাউড সিঙ্ক: অন্য ডিভাইস থেকেও অ্যাক্সেসযোগ্য' : 'Realtime Cloud Synced across devices'}</span>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
