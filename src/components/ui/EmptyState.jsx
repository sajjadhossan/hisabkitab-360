import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

/**
 * Universal Empty State Component
 * Gives users clean guidance when lists or records are empty
 */
export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'কোনো তথ্য পাওয়া যায়নি',
  description = 'এখন পর্যন্ত কোনো রেকর্ড সংরক্ষণ করা হয়নি। নতুন রেকর্ড যোগ করতে নিচের বাটনে চাপুন।',
  actionLabel,
  actionIcon,
  onAction,
  style = {}
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        borderRadius: '16px',
        backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.4))',
        border: '1px dashed var(--border-color, rgba(255, 255, 255, 0.12))',
        margin: '16px 0',
        ...style
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: 'var(--business-badge-bg, rgba(99, 102, 241, 0.1))',
          color: 'var(--business-primary, #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.15)'
        }}
      >
        <Icon size={28} />
      </div>

      <h4
        style={{
          margin: '0 0 6px',
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--text-main, #f1f5f9)'
        }}
      >
        {title}
      </h4>

      <p
        style={{
          margin: '0 0 20px',
          fontSize: '13px',
          color: 'var(--text-muted, #94a3b8)',
          maxWidth: '380px',
          lineHeight: 1.5
        }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" icon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
