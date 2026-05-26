import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CreditCard, Check, X, ShieldCheck, Crown, Sparkles } from 'lucide-react';

const PaymentsModal = () => {
  const { user, activeWorkspace, upgradeWorkspace, setShowPayments, triggerAlert } = useApp();

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [cardName, setCardName] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCVC) {
      triggerAlert('error', 'Please enter all credit card details.');
      return;
    }

    setProcessing(true);
    // Mimic API delay
    setTimeout(async () => {
      const success = await upgradeWorkspace({ cardNumber, cardExpiry, cardCVC, cardName });
      setProcessing(false);
      if (success) {
        setCardNumber('');
        setCardExpiry('');
        setCardCVC('');
        setCardName('');
      }
    }, 2000);
  };

  // Helper to format typed credit card input (adds space every 4 digits)
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    const truncated = val.slice(0, 16);
    const formatted = truncated.match(/.{1,4}/g)?.join(' ') || '';
    setCardNumber(formatted);
  };

  // Helper to format expiry (adds slash)
  const handleExpiryChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    const truncated = val.slice(0, 4);
    const formatted = truncated.length >= 3 ? `${truncated.slice(0, 2)}/${truncated.slice(2)}` : truncated;
    setCardExpiry(formatted);
  };

  const handleCVCChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setCardCVC(val.slice(0, 3));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-glow" style={{ maxWidth: '650px', width: '95%' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crown style={{ color: 'var(--accent-purple)' }} /> Upgrade Workspace to Pro
          </h3>
          <X 
            size={20} 
            style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} 
            onClick={() => setShowPayments(false)} 
          />
        </div>

        {/* Pro Plan Tier comparisons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
          
          {/* Card Form & Simulation */}
          <div>
            {/* Visual Credit Card Mockup */}
            <div className="billing-card-mockup">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'white', opacity: 0.85 }}>DevCollab VIP</span>
                <Crown size={20} style={{ color: 'var(--accent-pink)' }} />
              </div>
              
              <div style={{ fontSize: '18px', letterSpacing: '0.15em', color: 'white', margin: '24px 0 16px', fontFamily: 'var(--font-mono)' }}>
                {cardNumber || '•••• •••• •••• ••••'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'white', opacity: 0.75, textTransform: 'uppercase' }}>
                <div>
                  <div style={{ fontSize: '8px', opacity: 0.6 }}>Cardholder</div>
                  <div>{cardName || 'YOUR FULL NAME'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '8px', opacity: 0.6 }}>Expires</div>
                  <div>{cardExpiry || 'MM/YY'}</div>
                </div>
              </div>
            </div>

            {/* Billing Checkout Card Inputs */}
            <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="auth-input-group">
                <label className="auth-label">Name on Card</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  style={{ height: '36px' }}
                  placeholder="John Doe" 
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Card Number</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  style={{ height: '36px' }}
                  placeholder="4000 1234 5678 9010" 
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="auth-input-group">
                  <label className="auth-label">Expiry (MM/YY)</label>
                  <input 
                    type="text" 
                    className="auth-input" 
                    style={{ height: '36px' }}
                    placeholder="12/28" 
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    required
                  />
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">CVC / CVV</label>
                  <input 
                    type="password" 
                    className="auth-input" 
                    style={{ height: '36px' }}
                    placeholder="•••" 
                    value={cardCVC}
                    onChange={handleCVCChange}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="auth-btn" 
                style={{ width: '100%', margin: '12px 0 0' }}
                disabled={processing}
              >
                {processing ? 'Processing Sandbox Transaction...' : 'Confirm Sandbox Upgrade ($15/mo)'}
              </button>
            </form>
          </div>

          {/* Core limits comparison */}
          <div style={{ display: 'flex', flexDirection: 'column', justify: 'center', textAlign: 'left', borderLeft: '1px solid var(--border-light)', paddingLeft: '24px' }}>
            <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '16px' }}>Pro Features Unlocked:</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Check size={16} style={{ color: 'var(--priority-p2)', marginTop: '2px', flexShrink: 0 }} />
                <span>**Unlimited Workspaces** (create distinct environments for client projects, clubs, or research)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Check size={16} style={{ color: 'var(--priority-p2)', marginTop: '2px', flexShrink: 0 }} />
                <span>**Unlimited Active Projects** (scale out folders, Kanban boards, and wiki documentation)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Check size={16} style={{ color: 'var(--priority-p2)', marginTop: '2px', flexShrink: 0 }} />
                <span>**Unlimited Team Members** (invite your entire cohort or lab group)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Check size={16} style={{ color: 'var(--priority-p2)', marginTop: '2px', flexShrink: 0 }} />
                <span>**Premium AI Project Assistants** (unlock progress summaries, blockers, standups, and subtask breakdowns)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Check size={16} style={{ color: 'var(--priority-p2)', marginTop: '2px', flexShrink: 0 }} />
                <span>**Premium AI Code Reviewer** (receive structural diagnostics and quality scores inside Snippets)</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={16} style={{ color: 'var(--accent-purple)' }} />
              <span>Sandbox payment mode enabled. Test with any dummy credit details. No real charges will apply.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentsModal;
