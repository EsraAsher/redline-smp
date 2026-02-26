import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createPaymentOrder, verifyStoreCode } from '../api/index.js';

const CartDrawer = () => {
  const { items, cartOpen, setCartOpen, removeFromCart, updateQty, subtotal, clearCart } = useCart();
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [mcUsername, setMcUsername] = useState(() => localStorage.getItem('mc_username') || '');
  const [email, setEmail] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [checkoutStep, setCheckoutStep] = useState('cart'); // cart | details | processing | success | error
  const [processing, setProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // ─── Load Razorpay script ──────────────────────────────
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) return resolve(true);
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ─── Verify store code ──────────────────────────────────
  const handleVerifyCode = async () => {
    if (!mcUsername.trim() || !storeCode.trim()) return;
    setVerifyingCode(true);
    setErrorMsg('');
    try {
      const result = await verifyStoreCode(mcUsername.trim(), storeCode.trim());
      if (result.success) {
        setCodeVerified(true);
      } else {
        setErrorMsg('Invalid or expired code. Run /storecode in-game to get a new one.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Code verification failed.');
    } finally {
      setVerifyingCode(false);
    }
  };

  // ─── Handle checkout ────────────────────────────────────
  const handleCheckout = async () => {
    if (!mcUsername.trim() || !codeVerified) return;
    
    setProcessing(true);
    setErrorMsg('');

    try {
      // Save username for next visit
      localStorage.setItem('mc_username', mcUsername.trim());

      // Load Razorpay
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay. Check your internet connection.');

      // Create order on backend (includes verified store code + optional referral)
      const orderData = await createPaymentOrder(
        mcUsername.trim(),
        email.trim(),
        items.map((item) => ({
          productId: item.id,
          quantity: item.qty,
        })),
        storeCode.trim(),
        referralCode.trim() || undefined
      );

      // Open Razorpay checkout
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Redline SMP',
        description: `Purchase for ${mcUsername.trim()}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          email: email.trim() || undefined,
        },
        theme: {
          color: '#dc2626',
          backdrop_color: 'rgba(0,0,0,0.85)',
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
        handler: function (response) {
          // Payment succeeded on Razorpay's side — webhook will confirm it
          // Frontend does NOT verify or update DB. Just show processing state.
          setCheckoutStep('processing');
          setOrderResult({
            orderId: orderData.orderId,
            razorpayOrderId: response.razorpay_order_id,
          });
          clearCart();
          setProcessing(false);
          // Show success after brief processing indication
          setTimeout(() => setCheckoutStep('success'), 2000);
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setErrorMsg(response.error?.description || 'Payment failed. Please try again.');
        setCheckoutStep('error');
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong');
      setCheckoutStep('error');
      setProcessing(false);
    }
  };

  const resetCheckout = () => {
    setCheckoutStep('cart');
    setErrorMsg('');
    setOrderResult(null);
    setProcessing(false);
    setStoreCode('');
    setCodeVerified(false);
    setReferralCode('');
  };

  const handleClose = () => {
    setCartOpen(false);
    // Reset to cart view after close animation
    setTimeout(resetCheckout, 300);
  };

  return (
    <>
      {/* Overlay */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 flex flex-col
          w-full sm:w-105
          bg-dark-bg border-l border-red-500/40
          shadow-[-4px_0_30px_rgba(255,0,0,0.15)]
          transform transition-transform duration-300 ease-out
          ${cartOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-red-500/20">
          <h2 className="font-pixel text-base sm:text-lg text-red-400 drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]">
            Your Basket
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <span className="text-4xl mb-4">🛒</span>
              <p className="font-pixel text-xs">Your cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-lg p-3 hover:border-red-500/30 transition-colors"
              >
                {/* Thumb */}
                <div className="w-14 h-14 rounded-md overflow-hidden bg-black/50 shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xl">?</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{item.title}</p>
                  <p className="text-red-400 text-xs font-pixel mt-1">₹{item.price.toFixed(2)}</p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-white/10 text-gray-300 hover:bg-red-500/20 hover:text-white transition-colors text-sm font-bold"
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-white text-sm font-mono">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-white/10 text-gray-300 hover:bg-red-500/20 hover:text-white transition-colors text-sm font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors text-lg leading-none ml-1"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && checkoutStep === 'cart' && (
          <div className="border-t border-red-500/20 px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-pixel text-xs">Subtotal</span>
              <span className="text-white font-pixel text-sm drop-shadow-[0_0_6px_rgba(255,0,0,0.4)]">
                ₹{subtotal.toFixed(2)}
              </span>
            </div>

            {/* Clear cart */}
            <button
              onClick={clearCart}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors underline underline-offset-2"
            >
              Clear cart
            </button>

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 accent-red-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors leading-tight">
                I agree to the <Link to="/terms" onClick={() => setCartOpen(false)} className="text-red-400 underline hover:text-red-300">Terms &amp; Conditions</Link> and understand all purchases are final.
              </span>
            </label>

            {/* Checkout button */}
            <button
              disabled={!agreedTerms}
              onClick={() => setCheckoutStep('details')}
              className={`w-full py-3 font-pixel text-sm rounded-lg transition-all duration-300
                ${agreedTerms
                  ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,0,0,0.5)] cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                }
              `}
            >
              Proceed to Checkout
            </button>
          </div>
        )}

        {/* Details Step — Minecraft username + email */}
        {checkoutStep === 'details' && (
          <div className="border-t border-red-500/20 px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4">
            <button
              onClick={() => setCheckoutStep('cart')}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              ← Back to cart
            </button>

            <div>
              <label className="block text-gray-400 text-xs mb-1 font-pixel">Minecraft Username *</label>
              <input
                type="text"
                value={mcUsername}
                onChange={(e) => setMcUsername(e.target.value)}
                placeholder="Steve"
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-1 font-pixel">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors font-mono"
              />
            </div>

            {/* Store Code Verification */}
            <div>
              <label className="block text-gray-400 text-xs mb-1 font-pixel">Store Code *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={storeCode}
                  onChange={(e) => { setStoreCode(e.target.value); setCodeVerified(false); }}
                  placeholder="Enter code from /storecode"
                  disabled={codeVerified}
                  className={`flex-1 bg-black/50 border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors font-mono
                    ${codeVerified
                      ? 'border-green-500/50 text-green-400'
                      : 'border-white/20 text-white focus:border-red-500'
                    }
                  `}
                />
                <button
                  type="button"
                  disabled={!mcUsername.trim() || !storeCode.trim() || codeVerified || verifyingCode}
                  onClick={handleVerifyCode}
                  className={`px-4 py-2.5 rounded-lg font-pixel text-xs transition-all duration-300 shrink-0
                    ${codeVerified
                      ? 'bg-green-600/30 text-green-400 border border-green-500/40 cursor-default'
                      : !mcUsername.trim() || !storeCode.trim() || verifyingCode
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                        : 'bg-red-600 text-white hover:bg-red-500 cursor-pointer'
                    }
                  `}
                >
                  {codeVerified ? '✓ Verified' : verifyingCode ? '...' : 'Verify'}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Run <span className="text-red-400 font-mono">/storecode</span> in-game to get your code.
              </p>
            </div>

            {/* Referral Code (optional) */}
            <div>
              <label className="block text-gray-400 text-xs mb-1 font-pixel">
                Referral Code <span className="text-gray-600 font-sans text-[10px]">(optional)</span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                placeholder="e.g. STEVE10"
                maxLength={20}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors font-mono uppercase"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Got a creator code? Enter it for a discount.
              </p>
            </div>

            {errorMsg && checkoutStep === 'details' && (
              <p className="text-xs text-red-400 text-center">{errorMsg}</p>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-400 font-pixel text-xs">Total</span>
              <span className="text-white font-pixel text-sm">₹{subtotal.toFixed(2)}</span>
            </div>

            <button
              disabled={!mcUsername.trim() || !codeVerified || processing}
              onClick={handleCheckout}
              className={`w-full py-3 font-pixel text-sm rounded-lg transition-all duration-300
                ${mcUsername.trim() && codeVerified && !processing
                  ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.3)] cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                }
              `}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Pay with Razorpay'
              )}
            </button>

            <p className="text-[10px] text-gray-500 text-center">
              Secure payment powered by Razorpay. Your data is encrypted.
            </p>
          </div>
        )}

        {/* Processing Step */}
        {checkoutStep === 'processing' && (
          <div className="border-t border-red-500/20 px-6 py-10 flex flex-col items-center justify-center gap-4">
            <svg className="animate-spin h-8 w-8 text-red-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-300 font-pixel text-xs">Verifying payment...</p>
          </div>
        )}

        {/* Success Step */}
        {checkoutStep === 'success' && (
          <div className="border-t border-red-500/20 px-6 py-8 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-white font-pixel text-sm">Payment Successful!</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              {orderResult?.deliveryStatus === 'delivered'
                ? 'Your items have been delivered in-game. Enjoy!'
                : orderResult?.deliveryStatus === 'skipped'
                ? 'Payment confirmed! Items will be delivered when you join the server.'
                : 'Payment confirmed! Your items will be delivered shortly.'}
            </p>
            <button
              onClick={handleClose}
              className="mt-2 px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-pixel rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Error Step */}
        {checkoutStep === 'error' && (
          <div className="border-t border-red-500/20 px-6 py-8 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-red-400 text-2xl">✕</span>
            </div>
            <h3 className="text-white font-pixel text-sm">Something Went Wrong</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{errorMsg}</p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={resetCheckout}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-pixel rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-pixel rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
