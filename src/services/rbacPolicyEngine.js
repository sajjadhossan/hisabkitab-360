/**
 * HisabKitab 360 - Dynamic Role-Based Access Control (RBAC) & RLS Engine
 * Tip 18: Granular Permissions, Multi-Branch Isolation & Security Matrix
 * ----------------------------------------------------------------------
 * Enforces role-based action gating (super_admin, branch_manager, cashier,
 * salesman, auditor) and generates corresponding PostgreSQL Row-Level Security (RLS) policies.
 */

export const RBAC_ROLES = {
  SUPER_ADMIN: 'super_admin',
  BRANCH_MANAGER: 'branch_manager',
  CASHIER: 'cashier',
  SALESMAN: 'salesman',
  ACCOUNTANT: 'accountant',
  AUDITOR: 'auditor'
};

export const PERMISSION_MATRIX = {
  [RBAC_ROLES.SUPER_ADMIN]: {
    label: 'সুপার অ্যাডমিন (Super Admin)',
    permissions: ['*'] // Full unconditional access
  },
  [RBAC_ROLES.BRANCH_MANAGER]: {
    label: 'শাখা ব্যবস্থাপক (Branch Manager)',
    permissions: [
      'pos:checkout',
      'pos:apply_discount',
      'pos:refund',
      'inventory:view',
      'inventory:adjust',
      'reports:branch_view',
      'cash:adjust',
      'staff:view'
    ]
  },
  [RBAC_ROLES.CASHIER]: {
    label: 'ক্যাশিয়ার / কাউন্টার অপারেটর (Cashier)',
    permissions: [
      'pos:checkout',
      'pos:view_recent_sales',
      'inventory:view',
      'printer:print_receipt',
      'cash:view_closing'
    ]
  },
  [RBAC_ROLES.SALESMAN]: {
    label: 'সেলস রিপ্রেজেন্টেটিভ / এসআর (Salesman)',
    permissions: [
      'sr:order_booking',
      'sr:view_own_orders',
      'customer:view_assigned',
      'customer:create'
    ]
  },
  [RBAC_ROLES.ACCOUNTANT]: {
    label: 'হিসাবরক্ষক (Accountant)',
    permissions: [
      'ledger:view',
      'ledger:create_entry',
      'reports:financial_view',
      'banking:reconciliation',
      'tax:view_zakat'
    ]
  },
  [RBAC_ROLES.AUDITOR]: {
    label: 'নিরীক্ষক / অডিটর (Auditor)',
    permissions: [
      'audit:view_tamper_log',
      'reports:full_read_only',
      'ledger:view_read_only'
    ]
  }
};

export const canPerformAction = (userRole = 'cashier', requiredPermission = 'pos:checkout') => {
  if (!userRole) return false;
  const roleConfig = PERMISSION_MATRIX[userRole];
  if (!roleConfig) return false;

  if (roleConfig.permissions.includes('*')) return true;
  return roleConfig.permissions.includes(requiredPermission);
};

export const generatePostgresRlsSql = () => {
  return `-- =========================================================================
-- HISABKITAB 360 - SUPABASE DYNAMIC RBAC ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- ১. টেবিলগুলোতে RLS সক্রিয় করা
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- ২. সুপার অ্যাডমিন ফুল অ্যাক্সেস পলিসি
CREATE POLICY "super_admin_full_access" ON invoices
FOR ALL TO authenticated
USING (
    (auth.jwt() ->> 'role') = 'super_admin'
);

-- ৩. মাল্টি-ব্রাঞ্চ আইসোলেশন পলিসি (শাখাওয়ারি ডেটা পৃথকীকরণ)
CREATE POLICY "branch_isolation_invoices" ON invoices
FOR ALL TO authenticated
USING (
    branch_id = (auth.jwt() ->> 'branch_id')::uuid
    OR (auth.jwt() ->> 'role') IN ('super_admin', 'auditor')
);

-- ৪. ক্যাশিয়ার রিফান্ড সীমাবদ্ধকরণ (শুধুমাত্র ম্যানেজার অনুমোদন সাপেক্ষে)
CREATE POLICY "cashier_read_only_refunds" ON invoices
FOR UPDATE TO authenticated
USING (
    status != 'REFUNDED' 
    OR (auth.jwt() ->> 'role') IN ('super_admin', 'branch_manager')
);

-- ৫. অডিটর রিড-অনলি পলিসি
CREATE POLICY "auditor_read_only_audit_chain" ON audit_ledger
FOR SELECT TO authenticated
USING (true);
`;
};

export const rbacPolicyEngine = {
  roles: RBAC_ROLES,
  matrix: PERMISSION_MATRIX,
  can: canPerformAction,
  generateRlsSql: generatePostgresRlsSql
};

export default rbacPolicyEngine;
