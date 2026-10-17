import React from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = window.location.pathname;
  };

  handleClearTempCache = () => {
    try {
      // Clear temporary/corrupted session keys without deleting core database
      sessionStorage.clear();
      // Remove any temporary vertical or corrupted states if needed
      localStorage.removeItem('hk360_lot_size_matrix');
      localStorage.removeItem('hk360_restaurant_tables');
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
    } catch (e) {
      console.warn(e);
    }
    window.location.reload();
  };

  handleCopyError = () => {
    const errorDetails = `HisabKitab 360 Error:
${this.state.error?.toString()}
Stack:
${this.state.error?.stack || 'No stack'}
Component Stack:
${this.state.errorInfo?.componentStack || 'No component stack'}`;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(errorDetails).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      });
    }
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error ? this.state.error.toString() : 'অজ্ঞাত ত্রুটি (Unknown Error)';
      const errorStack = this.state.error?.stack || this.state.errorInfo?.componentStack || '';

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary, #0f172a)',
            color: 'var(--text-main, #f8fafc)',
            padding: '1.5rem',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: 'var(--bg-secondary, #1e293b)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '20px',
              padding: '1.75rem',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: '2px solid rgba(239, 68, 68, 0.4)'
              }}
            >
              <AlertTriangle size={30} />
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '0 0 6px', color: '#ef4444' }}>
              একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে
            </h2>

            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
              হোয়াইট স্ক্রিনের পরিবর্তে আপনাকে এই নিরাপদ রিকভারি স্ক্রিনটি দেখানো হচ্ছে।
            </p>

            {/* Error Details Box with Copy Button */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                padding: '10px 14px',
                borderRadius: '10px',
                textAlign: 'left',
                marginBottom: '1.25rem',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#f87171', textTransform: 'uppercase' }}>
                  ত্রুটির বিবরণ (Error Message):
                </span>
                <button
                  type="button"
                  onClick={this.handleCopyError}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    color: '#cbd5e1',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {this.state.copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{this.state.copied ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                </button>
              </div>

              <div
                style={{
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  color: '#fca5a5',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.4
                }}
              >
                {errorMsg}
                {errorStack ? `\n\nStack:\n${errorStack.slice(0, 300)}...` : ''}
              </div>
            </div>

            {/* Recovery Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} />
                <span>রিফ্রেশ করুন</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearTempCache}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={14} />
                <span>ক্যাশ রিসেট ও রিস্টার্ট</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Home size={14} />
                <span>হোমে ফিরুন</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
