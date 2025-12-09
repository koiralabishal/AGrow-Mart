import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaUser, FaMapMarkerAlt, FaPhone, FaCreditCard, FaMoneyBill, FaShoppingCart, FaArrowRight, FaChevronDown, FaCheckCircle } from 'react-icons/fa';
import '../styles/CartSection.css';
import OrderSuccess from './OrderSuccess';
import PaymentIntegration from './PaymentIntegration';

const CartSection = ({ isOpen, onClose, cartItems, onRemoveFromCart, onPlaceOrder, onUpdateQuantity, userType = 'buyer' }) => {
  const [activeTab, setActiveTab] = useState('cart');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [orderDetails, setOrderDetails] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [checkoutEnabled, setCheckoutEnabled] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const checkoutTabRef = useRef(null);
  const checkoutSectionRef = useRef(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const cartItemsListRef = useRef(null);
  
  // Effect to remove focus after tab click
  useEffect(() => {
    if (activeTab === 'checkout' && checkoutTabRef.current) {
      checkoutTabRef.current.blur();
    }
  }, [activeTab]);
  
  // Effect to detect scroll in checkout section
  useEffect(() => {
    const handleCheckoutScroll = () => {
      if (checkoutSectionRef.current) {
        if (checkoutSectionRef.current.scrollTop > 20) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      }
    };
    
    const checkoutSection = checkoutSectionRef.current;
    if (checkoutSection) {
      checkoutSection.addEventListener('scroll', handleCheckoutScroll);
      
      return () => {
        checkoutSection.removeEventListener('scroll', handleCheckoutScroll);
      };
    }
  }, [activeTab]);

  // Check if cart has more than 3 items
  useEffect(() => {
    setShowScrollIndicator(cartItems.length > 3);
  }, [cartItems]);
  
  // Hide scroll indicator on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (cartItemsListRef.current && cartItemsListRef.current.scrollTop > 10) {
        setShowScrollIndicator(false);
      }
    };
    
    const cartItemsList = cartItemsListRef.current;
    if (cartItemsList) {
      cartItemsList.addEventListener('scroll', handleScroll);
      
      return () => {
        cartItemsList.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // Effect to watch for checkoutEnabled changes and navigate to checkout when enabled
  useEffect(() => {
    if (checkoutEnabled) {
      setActiveTab('checkout');
    }
  }, [checkoutEnabled]);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.cartQuantity), 0);
  };

  const handleTabChange = (tab) => {
    // Only allow changing to checkout tab if it's enabled
    if (tab === 'checkout' && !checkoutEnabled) {
      return;
    }
    
    setActiveTab(tab);
    
    // Reset scroll position when switching to checkout tab
    if (tab === 'checkout' && checkoutSectionRef.current) {
      setTimeout(() => {
        checkoutSectionRef.current.scrollTop = 0;
      }, 50);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required';
    }
    
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handlePlaceOrder = async () => {
    // Validate the form
    if (!validateForm()) {
      return;
    }
    
    // Prepare order details
    const details = {
      date: new Date(),
      items: cartItems.map(item => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        cartQuantity: item.cartQuantity,
        farmerEmail: item.farmerEmail || null,
        supplierEmail: item.supplierEmail || null,
        image: item.image,
        category: item.category || null
      })),
      totalAmount: calculateTotal() + 50, // Total including delivery fee
      subtotal: calculateTotal(),
      deliveryFee: 50,
      deliveryAddress,
      phoneNumber,
      paymentMethod,
      buyerEmail: JSON.parse(localStorage.getItem('userData')).email,
      // Add sellerEmail from the first item in cart (assuming all items from same seller)
      sellerEmail: cartItems[0]?.farmerEmail || cartItems[0]?.supplierEmail,
      // Set order type based on userType - 'agriinput' for farmers, 'product' for regular buyers
      orderType: userType === 'farmer' ? 'agriinput' : 'product'
    };
    
    // Save order details for later use
    setOrderDetails(details);
    
    // If payment method is cash on delivery, proceed directly
    if (paymentMethod === 'cash') {
      setIsProcessing(true);
      
      try {
        // Call the onPlaceOrder prop with order details
        if (onPlaceOrder) {
          await onPlaceOrder(details);
        }
        
        // Show success popup
        setOrderPlaced(true);
        setShowSuccessPopup(true);
      } catch (error) {
        console.error('Error placing order:', error);
        alert('There was an error placing your order. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // If payment method is online, save the order details to localStorage
      // and then show payment screen
      const orderToSave = {
        ...details,
        date: details.date.toISOString(), // Ensure date is serialized properly
      };
      localStorage.setItem('pending_order', JSON.stringify(orderToSave));
      setShowPaymentScreen(true);
    }
  };
  
  const handlePaymentSuccess = (txnId) => {
    setTransactionId(txnId);
    setShowPaymentScreen(false);
    
    // Process the order after successful payment
    if (onPlaceOrder && orderDetails) {
      // Add transaction ID to order details
      const orderWithTransaction = {
        ...orderDetails,
        transactionId: txnId
      };
      
      onPlaceOrder(orderWithTransaction);
      setOrderPlaced(true);
      setShowSuccessPopup(true);
    }
  };
  
  const handlePaymentCancel = () => {
    setShowPaymentScreen(false);
  };
  
  const handleSuccessOk = () => {
    setShowSuccessPopup(false);
    setActiveTab('cart');
    // Reset form fields
    setDeliveryAddress('');
    setPhoneNumber('');
    setPaymentMethod('cash');
    // Reset checkout enabled state
    setCheckoutEnabled(false);
    // Reset payment state
    setShowPaymentScreen(false);
    setTransactionId(null);
  };
  
  const handleContinueShopping = () => {
    setOrderPlaced(false);
    setActiveTab('cart');
    onClose();
  };

  const handleDecreaseQuantity = (item) => {
    onUpdateQuantity(item._id, item.cartQuantity - 1);
  };

  const handleIncreaseQuantity = (item) => {
    onUpdateQuantity(item._id, item.cartQuantity + 1);
  };

  const handleProceedToCheckout = () => {
    setCheckoutEnabled(true);
    // Navigation will happen in the useEffect
  };

  if (!isOpen) return null;

  return (
    <div className="cart-overlay">
      <div className="cart-container">
        <div className="cart-header">
          <div className="cart-icon-left">
            <FaShoppingCart />
          </div>
          <div className="cart-header-title">
            <span className="cart-header-text">Your Shopping Cart</span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Payment Screen */}
        {showPaymentScreen && (
          <div className="payment-screen">
            <PaymentIntegration 
              orderDetails={{
                total: calculateTotal() + 50, // Include delivery fee
                subtotal: calculateTotal(),
                deliveryFee: 50,
                items: cartItems
              }}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </div>
        )}

        {/* Only show tabs if payment screen is not active */}
        {!showPaymentScreen && (
          <>
            <div className="cart-tabs">
              <button 
                className={`cart-tab ${activeTab === 'cart' ? 'active' : ''}`}
                onClick={() => handleTabChange('cart')}
              >
                Cart
              </button>
              <button 
                className={`cart-tab ${activeTab === 'checkout' ? 'active' : ''} ${!checkoutEnabled ? 'disabled' : ''}`}
                onClick={() => handleTabChange('checkout')}
                ref={checkoutTabRef}
                disabled={!checkoutEnabled}
              >
                Checkout
              </button>
            </div>

            {activeTab === 'cart' ? (
              <div className="cart-items">
                {cartItems.length === 0 ? (
                  <div className="empty-cart">
                    <div className="empty-cart-icon-container">
                      <div className="empty-cart-icon">
                        <FaShoppingCart />
                      </div>
                    </div>
                    <h3 className="empty-cart-title">Your cart is empty</h3>
                    <p className="empty-cart-message">Add items to get started with your order</p>
                    <button 
                      className="continue-shopping"
                      onClick={onClose}
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="cart-items-list" ref={cartItemsListRef}>
                      {cartItems.map((item) => (
                        <div key={item._id} className="cart-item">
                          {item.image ? (
                            item.image.name ? (
                              <div className="cart-item-image">
                                <img 
                                  src={`http://localhost:5000/uploads/products/${item.image.name}`} 
                                  alt={item.name}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/placeholder-image.png';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="cart-item-image">
                                <img src={item.image} alt={item.name} />
                              </div>
                            )
                          ) : (
                            <div className="cart-item-image">
                              <div className="no-image">No image</div>
                            </div>
                          )}
                          <div className="cart-item-info">
                            <h3>{item.name}</h3>
                            <p>Price: NRs.{item.price}</p>
                            <div className="quantity-controls">
                              <button 
                                className="quantity-btn"
                                onClick={() => handleDecreaseQuantity(item)}
                                aria-label="Decrease quantity"
                                title="Decrease quantity"
                              >
                                <strong>-</strong>
                              </button>
                              <span>{item.cartQuantity}</span>
                              <button 
                                className="quantity-btn"
                                onClick={() => handleIncreaseQuantity(item)}
                                aria-label="Increase quantity"
                                title="Increase quantity"
                              >
                                <strong>+</strong>
                              </button>
                            </div>
                            <p className="subtotal">Subtotal: ₹{item.price * item.cartQuantity}</p>
                          </div>
                          <button 
                            className="remove-btn"
                            onClick={() => onRemoveFromCart(item._id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {showScrollIndicator && (
                        <div className="scroll-indicator">
                          <FaChevronDown />
                          <span>Scroll for more items</span>
                        </div>
                      )}
                    </div>
                    <div className="cart-footer">
                      <div className="cart-total">
                        <h3>Total Amount:</h3>
                        <h3>NRs.{calculateTotal()}</h3>
                      </div>
                      <button 
                        className="checkout-btn"
                        onClick={handleProceedToCheckout}
                      >
                        <span>Proceed to Checkout</span>
                        <FaArrowRight />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div 
                ref={checkoutSectionRef}
                className={`checkout-section ${isScrolled ? 'scrolled' : ''}`}
              >
                {orderPlaced ? (
                  <OrderSuccess 
                    orderDetails={{
                      ...orderDetails,
                      transactionId: transactionId
                    }}
                    onContinueShopping={handleContinueShopping}
                  />
                ) : (
                  <>
                    <h3>Complete Your Order</h3>
                    <div className="checkout-content">
                      <div className="checkout-form">
                        <div className="form-group">
                          <label>
                            <FaUser /> Customer Information
                          </label>
                          <input 
                            type="text" 
                            placeholder="Your Full Name"
                            className="checkout-input"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>
                            <FaMapMarkerAlt /> Delivery Address
                          </label>
                          <textarea 
                            placeholder="Enter your complete delivery address"
                            className={`checkout-input ${errors.deliveryAddress ? 'error' : ''}`}
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                          />
                          {errors.deliveryAddress && <p className="error-text">{errors.deliveryAddress}</p>}
                        </div>
                        
                        <div className="form-group">
                          <label>
                            <FaPhone /> Phone Number
                          </label>
                          <input 
                            type="tel" 
                            placeholder="Your phone number"
                            className={`checkout-input ${errors.phoneNumber ? 'error' : ''}`}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                          />
                          {errors.phoneNumber && <p className="error-text">{errors.phoneNumber}</p>}
                        </div>
                        
                        <div className="form-group">
                          <label>Payment Method</label>
                          <div className="payment-options">
                            <div className="payment-option">
                              <input 
                                type="radio" 
                                id="cash" 
                                name="payment" 
                                value="cash"
                                checked={paymentMethod === 'cash'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                              />
                              <label htmlFor="cash"><FaMoneyBill /> Cash on Delivery</label>
                            </div>
                            <div className="payment-option">
                              <input 
                                type="radio" 
                                id="online" 
                                name="payment" 
                                value="online"
                                checked={paymentMethod === 'online'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                              />
                              <label htmlFor="online"><FaCreditCard /> Online Payment</label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="order-summary">
                          <h4>Order Summary</h4>
                          <div className="summary-row">
                            <span>Items ({cartItems.length}):</span>
                            <span>₹{calculateTotal()}</span>
                          </div>
                          <div className="summary-row">
                            <span>Delivery Fee:</span>
                            <span>₹50</span>
                          </div>
                          <div className="summary-row total">
                            <span>Total:</span>
                            <span>₹{calculateTotal() + 50}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="checkout-actions">
                        <button 
                          className="back-to-cart-btn"
                          onClick={() => handleTabChange('cart')}
                        >
                          Back to Cart
                        </button>
                        <button 
                          className={`place-order-btn ${isProcessing ? 'processing' : ''}`}
                          onClick={handlePlaceOrder}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : 'Place Order'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Success Popup - Show on top of everything */}
        {showSuccessPopup && (
          <div className="success-popup-overlay">
            <div className="success-popup">
              <div className="success-icon-container">
                <FaCheckCircle className="success-icon" />
              </div>
              <h3>Order Placed Successfully!</h3>
              <p>Your order has been received and is being processed.</p>
              <button className="success-ok-btn" onClick={handleSuccessOk}>
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

CartSection.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cartItems: PropTypes.array.isRequired,
  onRemoveFromCart: PropTypes.func.isRequired,
  onPlaceOrder: PropTypes.func.isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  userType: PropTypes.oneOf(['buyer', 'farmer'])
};

export default CartSection;