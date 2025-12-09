import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  FaTimes, FaBox, FaCheck, FaTruck, FaClock, FaMapMarkerAlt, FaPhoneAlt, 
  FaCreditCard, FaCalendarAlt, FaShoppingBag, 
  FaRegClock, FaMoneyBillWave, FaBoxOpen, FaStar, FaArrowLeft, FaTrashAlt
} from 'react-icons/fa';
import ReactDOM from 'react-dom';
import '../styles/OrderHistory.css';
// import '../styles/SharedHistoryComponents.css';
import authService from '../api';

const OrderHistory = ({ onClose, onOrderDelete, userType = 'buyer' }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Debug state changes for delete confirmation
  useEffect(() => {
    console.log('showDeleteConfirm state changed:', showDeleteConfirm);
  }, [showDeleteConfirm]);

  useEffect(() => {
    console.log('orderToDelete state changed:', orderToDelete);
  }, [orderToDelete]);

  // Get the appropriate localStorage key based on userType
  const getOrdersStorageKey = () => {
    return userType === 'farmer' ? 'agromart-farmer-orders' : 'agromart-orders';
  };

  useEffect(() => {
    // Load orders from localStorage with a slight delay to show loading animation
    setIsLoading(true);
    
    const fetchOrders = async () => {
      try {
        // Get user data from localStorage
        const userData = localStorage.getItem('userData');
        if (!userData) {
          console.error('User data not found in localStorage');
          setIsLoading(false);
          return;
        }
        
        const user = JSON.parse(userData);
        const userEmail = user.email;
        
        // Fetch orders from database based on user type
        let response;
        if (userType === 'farmer') {
          // Fetch orders where farmer is buyer of agri-inputs
          response = await authService.getOrdersByBuyerEmail(userEmail);
        } else if (userType === 'buyer') {
          // Fetch orders where buyer is buying products
          response = await authService.getOrdersByBuyerEmail(userEmail);
        } else if (userType === 'supplier') {
          // Fetch orders where supplier is the seller of agri-inputs
          response = await authService.getOrdersBySellerEmail(userEmail);
        }
        
        if (response && response.success) {
          // Set orders from database
          console.log('Orders fetched from database:', response.data);
          setOrders(response.data);
        } else {
          console.log('API call was not successful');
          // No fallback to localStorage - just show empty orders
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        // No fallback to localStorage - just show empty orders
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add a slight delay to show loading animation
    setTimeout(() => {
      fetchOrders();
    }, 800);
  }, [userType]);

  // Get status icon based on order status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered':
        return <FaCheck className="status-icon delivered" />;
      case 'Shipping':
        return <FaTruck className="status-icon shipping" />;
      case 'Processing':
        return <FaBox className="status-icon processing" />;
      case 'Pending':
      default:
        return <FaClock className="status-icon pending" />;
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'Date unavailable';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  // Open order details modal
  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
    document.body.classList.add('modal-open');
  };

  // Close order details modal
  const closeOrderModal = () => {
    setShowOrderModal(false);
    document.body.classList.remove('modal-open');
  };

  // Get CSS class based on order status
  const getStatusClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'delivered';
      case 'Shipping':
        return 'shipping';
      case 'Processing':
        return 'processing';
      case 'Pending':
      default:
        return 'pending';
    }
  };

  // Get a readable status description
  const getStatusDescription = (status) => {
    switch (status) {
      case 'Delivered':
        return 'Your order has been delivered successfully.';
      case 'Shipping':
        return 'Your order is on the way to your delivery address.';
      case 'Processing':
        return 'Your order is being prepared for shipping.';
      case 'Pending':
      default:
        return 'Your order has been received and is awaiting processing.';
    }
  };
  
  // Filter orders based on status
  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);
    
  // Get order ID based on database or local storage format
  const getOrderId = (order) => {
    // For database orders (MongoDB documents)
    if (order._id) {
      return order._id;
    }
    // For localStorage orders
    return order.id;
  };
  
  // Get order ID display (last 8 chars)
  const getOrderDisplayId = (order) => {
    const id = getOrderId(order);
    return id.slice(-8);
  };

  // Get delivery date estimate based on status
  const getDeliveryEstimate = (order) => {
    // For Pending status, use createdAt (or date as fallback)
    // For other statuses (Processing, Shipping, Delivered), use updatedAt timestamp
    const orderDate = new Date(order.createdAt || order.date);
    const updatedDate = order.updatedAt ? new Date(order.updatedAt) : orderDate;
    let estimatedDate;
    
    switch(order.status) {
      case 'Delivered':
        return 'Delivered on ' + formatDate(updatedDate);
      case 'Shipping':
        estimatedDate = new Date(updatedDate);
        estimatedDate.setDate(updatedDate.getDate() + 2);
        return 'Estimated delivery on ' + formatDate(estimatedDate);
      case 'Processing':
        estimatedDate = new Date(updatedDate);
        estimatedDate.setDate(updatedDate.getDate() + 4);
        return 'Estimated delivery on ' + formatDate(estimatedDate);
      case 'Pending':
      default:
        estimatedDate = new Date(orderDate);
        estimatedDate.setDate(orderDate.getDate() + 7);
        return 'Estimated delivery on ' + formatDate(estimatedDate);
    }
  };

  // Handle delete order
  const handleDeleteOrder = (order, event) => {
    event.stopPropagation(); // Prevent order modal from opening
    console.log('Delete button clicked for order:', getOrderDisplayId(order));
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
    
    // Add debugging to ensure state is being set properly
    setTimeout(() => {
      console.log('showDeleteConfirm state:', showDeleteConfirm);
      console.log('orderToDelete state:', orderToDelete);
    }, 100);
  };

  // Confirm deletion
  const confirmDeleteOrder = async () => {
    try {
      if (!orderToDelete) {
        console.error('No order selected for deletion');
        setShowDeleteConfirm(false);
        return;
      }
      
      console.log('Confirming deletion of order:', orderToDelete);
      
      // Get the order ID
      const orderId = getOrderId(orderToDelete);
      
      // Log the deletion for debugging
      console.log(`Deleting order #${getOrderDisplayId(orderToDelete)}`);
      
      // If it's a database order (_id exists), delete from API
      if (orderToDelete._id) {
        try {
          await authService.deleteOrder(orderToDelete._id);
          console.log('Order successfully deleted from database');
        } catch (error) {
          console.error('Failed to delete order from database:', error);
        }
      }
      
      // Filter out the order to delete (works for both local and DB orders)
      const updatedOrders = orders.filter(order => getOrderId(order) !== orderId);
      
      // Update state
      setOrders(updatedOrders);
      
      // Save to localStorage - use the appropriate key
      const storageKey = getOrdersStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(updatedOrders));
      
      // Notify parent component about the deletion
      if (onOrderDelete) {
        onOrderDelete(updatedOrders.length);
      }
      
      // Close confirmation modal
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
      
      // If the user was viewing the details of the deleted order, close that modal too
      if (selectedOrder && getOrderId(selectedOrder) === orderId) {
        closeOrderModal();
      }
      
    } catch (error) {
      console.error('Error deleting order:', error);
      setShowDeleteConfirm(false); // Make sure to close modal even if there's an error
    }
  };

  // Cancel deletion
  const cancelDeleteOrder = () => {
    console.log('Canceling order deletion');
    setShowDeleteConfirm(false);
    setOrderToDelete(null);
  };

  // Get the appropriate title based on userType
  const getOrderHistoryTitle = () => {
    if (userType === 'farmer') {
      return 'Your Agri-Input Orders';
    } else if (userType === 'supplier') {
      return 'Received Agri-Input Orders';
    } else {
      return 'Your Order History';
    }
  };

  // Get the empty message based on userType
  const getEmptyOrdersMessage = () => {
    if (userType === 'farmer') {
      return "You haven't placed any orders for agricultural inputs yet. Start exploring available supplies!";
    } else if (userType === 'supplier') {
      return "You haven't received any orders for your agricultural inputs yet. Once buyers place orders, they will appear here.";
    } else {
      return "You haven't placed any orders yet. Start exploring our products!";
    }
  };

  // Get order type display text
  // const getOrderTypeDisplay = (order) => {
  //   // Check orderType property from database order
  //   if (order.orderType) {
  //     return order.orderType === 'agriinput' ? 'Agri-Input Order' : 'Product Order';
  //   }
    
  //   // Fallback logic for older orders that might not have orderType
  //   // Determine based on userType
  //   return userType === 'farmer' ? 'Agri-Input Order' : 'Product Order';
  // };

  // Get items array from order (handles different data structures)
  const getOrderItems = (order) => {
    // If order has items array, use it
    if (order.items && Array.isArray(order.items)) {
      return order.items;
    }
    // If order has cart array, use it
    if (order.cart && Array.isArray(order.cart)) {
      return order.cart;
    }
    // Fallback to empty array
    return [];
  };

  // Get item count for display
  const getItemCount = (order) => {
    const items = getOrderItems(order);
    return `${items.length} ${items.length === 1 ? 'item' : 'items'}`;
  };

  // Get delivery fee for display (always 50)
  const getDeliveryFee = () => {
    return 50;
  };

  // Get subtotal for display (from database or localStorage)
  const getSubtotal = (order) => {
    // For database orders, the totalAmount is already the subtotal
    return order.subtotal || order.totalAmount || 0;
  };

  // Get total amount for display (subtotal + delivery fee)
  const getTotalAmount = (order) => {
    // Show consistent total that includes delivery fee
    return getSubtotal(order) + getDeliveryFee();
  };

  return (
    <>
      <div className="cart-overlay order-history-overlay">
        <div className="cart-container order-history-container">
          <div className="cart-header">
            <h2><FaShoppingBag className="header-icon" /> {getOrderHistoryTitle()}</h2>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {isLoading ? (
            <div className="orders-loading">
              <div className="loading-spinner"></div>
              <p>Loading your order history...</p>
            </div>
          ) : (
            <div className="order-history-content">
              {orders.length > 0 ? (
                <>
                  <div className="filter-controls">
                    <span className="filter-label"><FaBoxOpen /> Filter:</span>
                    <div className="filter-buttons">
                      <button 
                        className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                      >
                        All
                      </button>
                      <button 
                        className={`filter-btn ${filterStatus === 'Pending' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('Pending')}
                      >
                        <FaRegClock /> Pending
                      </button>
                      <button 
                        className={`filter-btn ${filterStatus === 'Processing' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('Processing')}
                      >
                        <FaBox /> Processing
                      </button>
                      <button 
                        className={`filter-btn ${filterStatus === 'Shipping' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('Shipping')}
                      >
                        <FaTruck /> Shipping
                      </button>
                      <button 
                        className={`filter-btn ${filterStatus === 'Delivered' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('Delivered')}
                      >
                        <FaCheck /> Delivered
                      </button>
                    </div>
                  </div>
                
                  <div className="orders-list">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map(order => (
                        <div key={getOrderId(order)} className={`order-item ${getStatusClass(order.status)}`}>
                          <div 
                            className="order-summary" 
                            onClick={() => openOrderModal(order)}
                          >
                            <div className="order-top-row">
                              <div className="order-id">Order #{getOrderDisplayId(order)}</div>
                              <div className="order-actions">
                                <div className={`order-status status-${getStatusClass(order.status)}`}>
                                  {getStatusIcon(order.status)}
                                  <span>{order.status}</span>
                                </div>
                                {(order.status === 'Pending') && (
                                  <button 
                                    className="delete-order-btn"
                                    onClick={(e) => {
                                      console.log('Delete button clicked directly');
                                      handleDeleteOrder(order, e);
                                    }}
                                    title="Cancel Order"
                                    aria-label="Cancel Order"
                                  >
                                    <FaTrashAlt size={26} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="order-meta">
                              <div className="order-date">
                                <FaCalendarAlt className="meta-icon" />
                                {order.status === 'Pending' 
                                  ? formatDate(order.createdAt || order.date)
                                  : formatDate(order.updatedAt || order.date)}
                              </div>
                              <div className={`order-type-badge ${order.orderType === 'agriinput' ? 'agri-input' : 'product'}`}>
                                {order.orderType === 'agriinput' ? 'Agri-Input' : 'Product'}
                              </div>
                              <div className="order-amount">
                                <FaMoneyBillWave style={{ marginRight: '5px' }} />
                                NRs.{getTotalAmount(order)}
                              </div>
                            </div>
                            <div className="order-expand">
                              <div className="order-items-count">
                                {getItemCount(order)}
                              </div>
                              <div className="order-view-details">
                                View Details <span className="expand-icon">→</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-filtered-orders">
                        <FaBoxOpen className="no-results-icon" />
                        <h3>No {filterStatus !== 'all' ? filterStatus : ''} Orders Found</h3>
                        <p>Try selecting a different filter or place a new order</p>
                        <button 
                          className="filter-clear-btn"
                          onClick={() => setFilterStatus('all')}
                        >
                          Show All Orders
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-orders">
                  <div className="empty-orders-icon">
                    <FaShoppingBag />
                  </div>
                  <h3>No Orders Yet</h3>
                  <p>{getEmptyOrdersMessage()}</p>
                  <button className="continue-shopping" onClick={onClose}>
                    Start Shopping
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Details Modal - Using Portal to position outside the panel */}
        {showOrderModal && selectedOrder && 
          ReactDOM.createPortal(
            <div className="modal-overlay">
              <div className="modal-backdrop" onClick={closeOrderModal}></div>
              <div className="order-details-modal">
                <div className="order-modal-content">
                  <div className="modal-header">
                    <button 
                      className="back-to-transactions-btn"
                      onClick={closeOrderModal}
                    >
                      <FaArrowLeft className="back-arrow-icon" /> 
                      <span>Back to Orders</span>
                    </button>
                    <div className={`modal-status status-${getStatusClass(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span>{selectedOrder.status}</span>
                    </div>
                  </div>
                
                  <div className="modal-order-id">
                    <h2>Order #{getOrderDisplayId(selectedOrder)}</h2>
                    <p className="modal-date">
                      {selectedOrder.status === 'Pending' 
                        ? formatDate(selectedOrder.createdAt || selectedOrder.date)
                        : formatDate(selectedOrder.updatedAt || selectedOrder.date)}
                    </p>
                  </div>
                  
                  <div className="modal-content-wrapper">
                    <div className="order-status-banner">
                      {getStatusIcon(selectedOrder.status)}
                      <div className="status-info">
                        <p>{getStatusDescription(selectedOrder.status)}</p>
                        <p className="delivery-estimate">{getDeliveryEstimate(selectedOrder)}</p>
                      </div>
                    </div>
                    
                    <div className="modal-order-details">
                      <div className="order-delivery-info">
                        <h4>Delivery Information</h4>
                        <p><FaMapMarkerAlt className="info-icon" /> <strong>Address:</strong> {selectedOrder.deliveryAddress}</p>
                        <p><FaPhoneAlt className="info-icon" /> <strong>Phone:</strong> {selectedOrder.phoneNumber}</p>
                        <p><FaCreditCard className="info-icon" /> <strong>Payment:</strong> {selectedOrder.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'}</p>
                        
                        {selectedOrder.status === 'Delivered' && (
                          <div className="review-prompt">
                            <FaStar className="star-icon" />
                            <p>How was your experience? Rate your purchase!</p>
                            <button className="review-btn">Write a Review</button>
                          </div>
                        )}
                      </div>
                      
                      <div className="order-total-summary">
                        <h4>Order Summary</h4>
                        <div className="summary-row">
                          <span>Subtotal:</span>
                          <span>NRs.{getSubtotal(selectedOrder)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Delivery Fee:</span>
                          <span>NRs.{getDeliveryFee()}</span>
                        </div>
                        <div className="summary-row total">
                          <span>Total:</span>
                          <span>NRs.{getTotalAmount(selectedOrder)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="modal-items-wrapper">
                      <div className="order-items">
                        <h4>Order Items</h4>
                        <div className="product-grid">
                          {getOrderItems(selectedOrder).map(item => (
                            <div key={item._id} className="order-product">
                              <div className="product-image">
                                {item.image && item.image.name ? (
                                  <img 
                                    src={`http://localhost:5000/uploads/products/${item.image.name}`}
                                    alt={item.name}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = '/placeholder-image.png';
                                    }}
                                  />
                                ) : (
                                  <div className="no-image">No image</div>
                                )}
                              </div>
                              <div className="product-info">
                                <h5>{item.name}</h5>
                                <p className={`order-type ${selectedOrder.orderType === 'agriinput' ? 'agri-input' : 'product'}`}>
                                  {selectedOrder.orderType === 'agriinput' ? 'Agricultural Input' : 'Farm Product'}
                                </p>
                                <p><strong>Price:</strong> NRs.{item.price} per {item.unit}</p>
                                <p><strong>Quantity:</strong> {item.cartQuantity}</p>
                                <p className="subtotal">Subtotal: NRs.{item.price * item.cartQuantity}</p>
                                {selectedOrder.status === 'Delivered' && (
                                  <button className="buy-again-btn">Buy Again</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        }

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          ReactDOM.createPortal(
            <div className="delete-confirm-overlay">
              <div className="delete-confirm-modal">
                <div className="delete-confirm-icon">
                  <FaTrashAlt />
                </div>
                <h3>Cancel Order?</h3>
                <p>
                  Are you sure you want to cancel this order?
                  This action cannot be undone.
                </p>
                <div className="delete-confirm-actions">
                  <button 
                    className="cancel-btn"
                    onClick={cancelDeleteOrder}
                  >
                    Keep
                  </button>
                  <button 
                    className="confirm-btn"
                    onClick={confirmDeleteOrder}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        )}
      </div>
    </>
  );
};

OrderHistory.propTypes = {
  onClose: PropTypes.func.isRequired,
  onOrderDelete: PropTypes.func,
  userType: PropTypes.oneOf(['buyer', 'farmer'])
};

export default OrderHistory;
