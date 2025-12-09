import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import esewaLogo from '../assets/esewa.png';
import CryptoJS from 'crypto-js';
import { useNavigate } from 'react-router-dom';
import '../styles/PaymentIntegration.css';
import authService from '../api';
import { FaLock, FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaCreditCard, FaMoneyBillWave, FaSpinner } from 'react-icons/fa';

const PaymentIntegration = ({ orderDetails, onPaymentSuccess, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('esewa');
  const navigate = useNavigate();
  
  // eSewa configuration according to the official docs
  const ESEWA_PRODUCT_CODE = "EPAYTEST"; // Replace with actual product code in production
  const ESEWA_SECRET_KEY = "8gBm/:&EnhH.1/q"; // Replace with actual secret key in production
  const ESEWA_SUCCESS_URL = `${window.location.origin}/esewa-success`;
  const ESEWA_FAILURE_URL = `${window.location.origin}/esewa-failure`;

  // Check if we're in development mode (can be replaced with your app's configuration method)
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';

  // Store order in database after successful payment
  const storeOrderInDatabase = async (paymentDetails) => {
    try {
      console.log('Starting order storage process...');
      
      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem('userData') || '{}');
      console.log('User data:', user);
      
      if (!user.email) {
        throw new Error('User not logged in');
      }
      
      // Check if we have cart items in orderDetails
      if (!orderDetails.items || !orderDetails.items.length) {
        console.error('No items in orderDetails:', orderDetails);
        throw new Error('No items found in order');
      }
      
      console.log('Order items before mapping:', orderDetails.items);
      
      // Format cart items for order creation
      const cartItems = orderDetails.items.map(item => ({
        productId: item.id || item._id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image,
        farmerEmail: item.farmerEmail || item.farmer?.email
      }));
      
      console.log('Mapped cart items:', cartItems);
      
      // Find the first farmer email for the order
      const firstSellerEmail = cartItems[0]?.farmerEmail || '';
      console.log('First seller email:', firstSellerEmail);
      
      // Create order data structure based on backend requirements
      const orderData = {
        orderId: `ORDER-${Date.now()}`,
        date: new Date().toISOString(),
        items: cartItems,
        totalAmount: orderDetails.total,
        subtotal: orderDetails.total - orderDetails.deliveryFee,
        deliveryFee: orderDetails.deliveryFee,
        deliveryAddress: user.address || 'Default Address',
        phoneNumber: user.phone || '9876543210',
        paymentMethod: selectedPaymentMethod,
        buyerEmail: user.email,
        sellerEmail: firstSellerEmail,
        orderType: 'product',
        transactionId: paymentDetails.transactionId
      };
      
      console.log('Full order data being sent:', orderData);
      
      try {
        console.log('Calling authService.createOrder...');
        const result = await authService.createOrder(orderData);
        console.log('Order creation API result:', result);
        
        // Show success popup
        setShowSuccessPopup(true);
        
        // Clear cart after successful order
        localStorage.removeItem('cart');
        
        return result.data;
      } catch (apiError) {
        console.error('Error calling authService.createOrder:', apiError);
        
        // Fallback to direct API call
        console.log('Falling back to direct API call');
        const response = await fetch('http://localhost:5000/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create order');
        }
        
        const result = await response.json();
        console.log('Direct API call result:', result);
        
        // Show success popup
        setShowSuccessPopup(true);
        
        // Clear cart after successful order
        localStorage.removeItem('cart');
        
        return result.data;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Payment was successful but order could not be saved: ' + error.message);
      return null;
    }
  };

  const handleGoToDashboard = () => {
    setShowSuccessPopup(false);
    navigate('/buyer-dashboard');
  };

  const handlePayNow = () => {
    setIsProcessing(true);
    setError(null); // Clear any previous errors
    
    // First clear ALL previously stored payment data
    localStorage.removeItem('esewa_transaction');
    localStorage.removeItem('actual_paid_amount');
    sessionStorage.removeItem('final_esewa_transaction');
    sessionStorage.removeItem('current_transaction_display');
    
    // Also clear any existing payment keys
    const existingPaymentKey = localStorage.getItem('esewa_current_payment_key');
    if (existingPaymentKey) {
      localStorage.removeItem(existingPaymentKey);
      localStorage.removeItem('esewa_current_payment_key');
    }
    
    // Remove any keys that start with esewa_payment_
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('esewa_payment_')) {
        localStorage.removeItem(key);
      }
    });
    
    // In a test environment with simulation option
    if (isDevelopment && window.SIMULATE_PAYMENT === true) {
      console.log('Development mode: Simulating eSewa payment');
      setTimeout(() => {
        setIsProcessing(false);
        
        onPaymentSuccess({
          method: 'esewa',
          status: 'completed',
          transactionId: 'esewa-' + Math.random().toString(36).substring(2, 10),
          timestamp: new Date().toISOString()
        });
      }, 2000);
      return;
    }
    
    try {
      console.log('Preparing eSewa payment...');
      
      // Generate a transaction ID format matching PHP version: "medidocx-" + id + timestamp
      const transaction_uuid = "agromart-" + Date.now().toString();
      
      // Format amount as string with exactly 2 decimal places
      const total_amount = orderDetails.total.toFixed(2);
      const amount = (orderDetails.total - orderDetails.deliveryFee).toFixed(2);
      const delivery_charge = orderDetails.deliveryFee.toFixed(2);
      
      // Create the message string exactly matching PHP code structure
      const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_PRODUCT_CODE}`;
      
      // Generate signature using CryptoJS exactly like PHP hash_hmac and base64_encode
      const hash = CryptoJS.HmacSHA256(data, ESEWA_SECRET_KEY);
      const signature = CryptoJS.enc.Base64.stringify(hash);
      
      console.log('Debug data:', {
        data,
        secretKey: ESEWA_SECRET_KEY,
        signature
      });

      // Create hidden form and submit it - this mimics the PHP implementation exactly
      const form = document.createElement('form');
      form.setAttribute('method', 'POST');
      form.setAttribute('action', 'https://rc-epay.esewa.com.np/api/epay/main/v2/form');
      form.setAttribute('target', '_self');
      
      // Create fields exactly matching PHP implementation
      const fields = {
        amount: amount,
        tax_amount: "0",
        total_amount: total_amount,
        transaction_uuid: transaction_uuid,
        product_code: ESEWA_PRODUCT_CODE,
        product_service_charge: "0",
        product_delivery_charge: delivery_charge,
        success_url: ESEWA_SUCCESS_URL,
        failure_url: ESEWA_FAILURE_URL,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature: signature
      };
      
      // Create input elements exactly like in PHP
      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.setAttribute('type', 'hidden');
        input.setAttribute('id', key);
        input.setAttribute('name', key);
        input.setAttribute('value', value);
        input.setAttribute('required', 'required');
        form.appendChild(input);
      });
      
      // Add image button
      const imageButton = document.createElement('input');
      imageButton.setAttribute('type', 'image');
      imageButton.setAttribute('src', esewaLogo);
      form.appendChild(imageButton);
      
      // Store transaction details with timestamp to identify newest
      const currentTimestamp = Date.now();
      const currentTransaction = {
        transaction_uuid,
        total_amount,
        product_code: ESEWA_PRODUCT_CODE,
        timestamp: new Date().toISOString(),
        payment_initiated_at: currentTimestamp
      };
      
      console.log('Storing payment data with amount:', total_amount);
      
      // Save transaction data for later verification
      const storageKey = `esewa_payment_${transaction_uuid}`;
      console.log('Storing transaction with key:', storageKey);
      
      localStorage.setItem(storageKey, JSON.stringify(currentTransaction));
      localStorage.setItem('esewa_current_payment_key', storageKey);
      localStorage.setItem('actual_paid_amount', total_amount);
      sessionStorage.setItem('current_transaction_display', 'showing');
      
      console.log('Debug - params being sent to eSewa:', fields);
      
      // Add form to body and submit
      document.body.appendChild(form);
      form.submit();
      
      console.log('Form submitted to eSewa');
    } catch (error) {
      console.error('Error initiating eSewa payment:', error);
      setError('Failed to initiate payment: ' + error.message);
      setIsProcessing(false);
    }
  };
  
  // Format currency function
  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount).toFixed(2)}`;
  };
  
  // Select payment method
  const handleSelectPaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
  };

  return (
    <div className="payment-integration-container">
      <div className="payment-header">
        <h2>Complete Your Purchase</h2>
        <p>Secure checkout for your agricultural products</p>
      </div>
      
      <div className="payment-content">
        <div className="order-summary">
          <h3>Order Summary</h3>
          
          {/* <div className="items-container">
            {orderDetails.items && orderDetails.items.map((item, index) => (
              <div className="order-item" key={index}>
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="order-item-image" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/60x60?text=Product";
                  }}
                />
                <div className="order-item-details">
                  <div className="order-item-name">{item.name}</div>
                  <div className="order-item-price">
                    {formatCurrency(item.price)} 
                    <span className="order-item-quantity">x{item.quantity}</span>
                  </div>
                </div>
                <div className="order-item-total">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div> */}
          
          <div className="payment-breakdown">
            <div className="breakdown-item">
              <span>Subtotal</span>
              <span>{formatCurrency(orderDetails.total - orderDetails.deliveryFee)}</span>
            </div>
            <div className="breakdown-item">
              <span>Delivery Fee</span>
              <span>{formatCurrency(orderDetails.deliveryFee)}</span>
            </div>
            {orderDetails.discount > 0 && (
              <div className="breakdown-item discount">
                <span>Discount</span>
                <span>-{formatCurrency(orderDetails.discount || 0)}</span>
              </div>
            )}
            <div className="breakdown-item total">
              <span>Total Payment</span>
              <span>{formatCurrency(orderDetails.total)}</span>
            </div>
          </div>
        </div>
        
        <div className="payment-methods">
          <h4 className="payment-methods-title">Select Payment Method</h4>
          <div className="payment-methods-list">
            <div 
              className={`payment-method-option ${selectedPaymentMethod === 'esewa' ? 'active' : ''}`}
              onClick={() => handleSelectPaymentMethod('esewa')}
            >
              <img src={esewaLogo} alt="eSewa" className="payment-method-logo" />
              <span className="payment-method-name">eSewa</span>
            </div>
            <div 
              className={`payment-method-option ${selectedPaymentMethod === 'cash' ? 'active' : ''}`}
              onClick={() => handleSelectPaymentMethod('cash')}
            >
              <FaMoneyBillWave size={24} color="#4CAF50" className="payment-method-logo" />
              <span className="payment-method-name">Cash on Delivery</span>
            </div>
            <div 
              className={`payment-method-option ${selectedPaymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => handleSelectPaymentMethod('card')}
            >
              <FaCreditCard size={24} color="#2196F3" className="payment-method-logo" />
              <span className="payment-method-name">Credit Card</span>
            </div>
          </div>
        </div>
        
        <div className="secure-transaction">
          <FaShieldAlt /> Your transaction is secured with end-to-end encryption
        </div>
        
        <div className="esewa-payment-container">
          {selectedPaymentMethod === 'esewa' && (
            <>
              <div className="esewa-header">
                <img src={esewaLogo} alt="eSewa Logo" className="esewa-logo-img" />
              </div>
              
              <div className="payment-info">
                <p>Total Amount to Pay</p>
                <span className="amount">{formatCurrency(orderDetails.total)}</span>
                <div className="secured-payment-info">
                  <FaLock /> Secured by eSewa Payment Gateway
                </div>
              </div>
            </>
          )}
          
          {selectedPaymentMethod === 'cash' && (
            <div className="payment-info">
              <p>Cash on Delivery</p>
              <span className="amount">{formatCurrency(orderDetails.total)}</span>
              <p style={{marginTop: '10px'}}>Pay in cash when your order is delivered</p>
            </div>
          )}
          
          {selectedPaymentMethod === 'card' && (
            <div className="payment-info">
              <p>Credit Card Payment</p>
              <span className="amount">{formatCurrency(orderDetails.total)}</span>
              <p style={{marginTop: '10px'}}>Coming soon! This payment method is under development.</p>
            </div>
          )}
          
          {error && (
            <div className="payment-error">
              <FaExclamationTriangle className="payment-error-icon" />
              <div>{error}</div>
            </div>
          )}
          
          <div className="payment-actions">
            <button 
              className="esewa-btn" 
              onClick={handlePayNow} 
              disabled={isProcessing || (selectedPaymentMethod === 'card')}
            >
              {isProcessing ? (
                <>
                  <div className="processing-spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  {selectedPaymentMethod === 'esewa' && <img src={esewaLogo} alt="eSewa" className="esewa-btn-logo" />}
                  {selectedPaymentMethod === 'cash' && <FaMoneyBillWave className="esewa-btn-logo" />}
                  {selectedPaymentMethod === 'card' && <FaCreditCard className="esewa-btn-logo" />}
                  
                  {selectedPaymentMethod === 'esewa' && 'Pay with eSewa'}
                  {selectedPaymentMethod === 'cash' && 'Place Order (Cash on Delivery)'}
                  {selectedPaymentMethod === 'card' && 'Credit Card (Coming Soon)'}
                </>
              )}
            </button>
            
            <button 
              className="cancel-btn" 
              onClick={onCancel} 
              disabled={isProcessing}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      
      {showSuccessPopup && (
        <div className="success-popup-overlay">
          <div className="success-popup">
            <div className="success-icon">
              <FaCheckCircle />
            </div>
            <h3>Payment Successful!</h3>
            <p>Your order has been placed successfully. You can view your order details in your dashboard.</p>
            <button className="dashboard-btn" onClick={handleGoToDashboard}>
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

PaymentIntegration.propTypes = {
  orderDetails: PropTypes.shape({
    items: PropTypes.array.isRequired,
    total: PropTypes.number.isRequired,
    deliveryFee: PropTypes.number.isRequired,
    discount: PropTypes.number
  }).isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default PaymentIntegration; 