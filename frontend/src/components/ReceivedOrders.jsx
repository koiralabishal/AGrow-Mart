import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  FaTimes, FaBox, FaCheck, FaTruck, FaClock, FaMapMarkerAlt, FaPhoneAlt, 
  FaCreditCard, FaCalendarAlt, 
  FaRegClock, FaMoneyBillWave, FaBoxOpen, FaArrowLeft, FaUser, FaEnvelope
} from 'react-icons/fa';
import ReactDOM from 'react-dom';
import '../styles/OrderHistory.css';
import '../styles/ReceivedOrders.css';
import authService from '../api';

const ReceivedOrders = ({ onClose, userType = 'farmer' }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    // Load orders from the database
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
        const sellerEmail = user.email;
        
        // Fetch orders where user is the seller
        const response = await authService.getOrdersBySellerEmail(sellerEmail);
        
        if (response && response.success) {
          // Set orders from database
          console.log('Received orders fetched from database:', response.data);
          
          // Process orders to ensure statusTimes is properly structured
          const processedOrders = response.data.map(order => {
            // Deep clone the order object first
            const clonedOrder = JSON.parse(JSON.stringify(order));
            
            // Make sure statusTimes exists and is properly formatted
            let statusTimes = {};
            
            // Handle different formats of statusTimes that might come from MongoDB
            if (clonedOrder.statusTimes) {
              if (typeof clonedOrder.statusTimes === 'object') {
                // Convert from MongoDB Map to plain object if needed
                if (clonedOrder.statusTimes instanceof Map) {
                  Array.from(clonedOrder.statusTimes.entries()).forEach(([key, value]) => {
                    statusTimes[key] = value;
                  });
                } else {
                  // Handle direct object format 
                  statusTimes = { ...clonedOrder.statusTimes };
                }
              }
            }
            
            // For Pending, always use createdAt as the timestamp
            if (!statusTimes.Pending && clonedOrder.createdAt) {
              statusTimes.Pending = clonedOrder.createdAt;
            } else if (!statusTimes.Pending) {
              statusTimes.Pending = clonedOrder.date;
            }
            
            // For the current status (if not Pending), use updatedAt timestamp
            if (clonedOrder.status !== 'Pending' && clonedOrder.updatedAt) {
              statusTimes[clonedOrder.status] = clonedOrder.updatedAt;
            }
            
            console.log(`Processed order ${clonedOrder._id}:`, {
              status: clonedOrder.status,
              createdAt: clonedOrder.createdAt,
              updatedAt: clonedOrder.updatedAt,
              statusTimes
            });
            
            return {
              ...clonedOrder,
              statusTimes
            };
          });
          
          // Log buyer information for each order to debug
          if (processedOrders.length > 0) {
            console.log('Buyer information in first order:', {
              buyerName: processedOrders[0].buyerName,
              buyerEmail: processedOrders[0].buyerEmail,
              statusTimes: processedOrders[0].statusTimes
            });
          }
          
          setOrders(processedOrders);
        } else {
          console.log('API call was not successful');
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching received orders:', error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add a slight delay to show loading animation
    setTimeout(() => {
      fetchOrders();
    }, 800);
  }, []);

  // Update selected order when orders are refreshed
  useEffect(() => {
    // If there's a selected order and orders have been loaded
    if (selectedOrder && orders.length > 0) {
      // Try to find the updated version of the selected order
      const updatedOrder = orders.find(order => getOrderId(order) === getOrderId(selectedOrder));
      
      // If found, update the selected order to ensure it has the latest data
      if (updatedOrder) {
        console.log('Updating selected order with latest data:', {
          id: getOrderId(updatedOrder),
          status: updatedOrder.status,
          statusTimes: updatedOrder.statusTimes
        });
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders]);

  // When filter status changes, update to make sure we can still see the order details
  useEffect(() => {
    console.log('Filter status changed to:', filterStatus);
    
    // If we have a selected order shown in the modal
    if (selectedOrder && showOrderModal) {
      // If the filter excludes this order, find it in the original orders list
      if (filterStatus !== 'all' && selectedOrder.status !== filterStatus) {
        console.log('Selected order no longer matches filter, ensuring data is preserved');
        
        // Find the order in the full orders array
        const fullOrder = orders.find(o => getOrderId(o) === getOrderId(selectedOrder));
        if (fullOrder) {
          // Update selected order to ensure we have full data including history
          setSelectedOrder(fullOrder);
        }
      }
    }
  }, [filterStatus]);

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
    // Find the original order from the orders array to ensure we have the most up-to-date data
    const fullOrder = orders.find(o => getOrderId(o) === getOrderId(order)) || order;
    
    // Create a deep copy of the order to avoid reference issues
    const orderData = JSON.parse(JSON.stringify(fullOrder));
    
    // Make sure statusTimes exists and has proper format
    if (!orderData.statusTimes) {
      orderData.statusTimes = {};
    }
    
    // For Pending status, use createdAt timestamp
    if (!orderData.statusTimes.Pending) {
      orderData.statusTimes.Pending = orderData.createdAt || orderData.date;
    }
    
    // For the current status (if not Pending), use updatedAt timestamp
    if (orderData.status !== 'Pending' && orderData.updatedAt) {
      orderData.statusTimes[orderData.status] = orderData.updatedAt;
    }
    // If no updatedAt timestamp, ensure there's some value for the current status
    else if (!orderData.statusTimes[orderData.status]) {
      // Add appropriate fallbacks for missing status timestamps
      if (orderData.status === 'Delivered' && orderData.statusTimes.Shipping) {
        orderData.statusTimes.Delivered = new Date().toISOString();
      } else if (orderData.status === 'Shipping' && orderData.statusTimes.Processing) {
        orderData.statusTimes.Shipping = new Date().toISOString();
      } else if (orderData.status === 'Processing' && orderData.statusTimes.Pending) {
        orderData.statusTimes.Processing = new Date().toISOString();
      } else {
        // Last resort fallback - use date
        orderData.statusTimes[orderData.status] = orderData.date;
      }
    }
    
    console.log('Opening modal with order:', {
      id: getOrderId(orderData),
      status: orderData.status,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt,
      statusTimes: orderData.statusTimes
    });
    
    setSelectedOrder(orderData);
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
        return 'This order has been delivered successfully.';
      case 'Shipping':
        return 'This order is on the way to the delivery address.';
      case 'Processing':
        return 'This order is being prepared for shipping.';
      case 'Pending':
      default:
        return 'This order has been received and is awaiting processing.';
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

  // Handle status updates with proper timestamp management
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      // Current time for status update
      const now = new Date();
      const statusUpdateTime = now.toISOString();
      
      console.log(`Updating order ${orderId} to status ${newStatus} at time ${statusUpdateTime}`);
      
      const response = await authService.updateOrderStatus(orderId, newStatus, statusUpdateTime);
      
      if (response && response.success) {
        console.log('Status update successful, received updated order:', response.data);
        
        // Find the current order to get its previous status and times
        const currentOrder = orders.find(order => getOrderId(order) === orderId);
        
        if (!currentOrder) {
          console.error('Order not found in state:', orderId);
          return;
        }
        
        // Store previous status for context
        const prevStatus = currentOrder.status;
        
        // Get the updated data returned from server
        const updatedOrder = response.data;
        
        // Start with a clean statusTimes object
        let processedStatusTimes = {};
        
        // For Pending status, always use createdAt timestamp
        processedStatusTimes.Pending = currentOrder.createdAt || currentOrder.date;
        
        // For the current status change, use the updatedAt timestamp
        if (newStatus !== 'Pending') {
          processedStatusTimes[newStatus] = updatedOrder.updatedAt || statusUpdateTime;
        }
        
        // Add necessary intermediate status timestamps if skipping statuses
        if (prevStatus === 'Pending' && newStatus === 'Shipping') {
          // Set Processing to 100ms before current update
          const processingTime = new Date(now.getTime() - 100);
          processedStatusTimes.Processing = processingTime.toISOString();
        }
        
        if (prevStatus === 'Pending' && newStatus === 'Delivered') {
          // Set Processing to 200ms before current update
          const processingTime = new Date(now.getTime() - 200);
          // Set Shipping to 100ms before current update
          const shippingTime = new Date(now.getTime() - 100);
          processedStatusTimes.Processing = processingTime.toISOString();
          processedStatusTimes.Shipping = shippingTime.toISOString();
        }
        
        if (prevStatus === 'Processing' && newStatus === 'Delivered') {
          // Set Shipping to 100ms before current update
          const shippingTime = new Date(now.getTime() - 100);
          processedStatusTimes.Shipping = shippingTime.toISOString();
        }
        
        console.log(`Processed statusTimes after update:`, {
          previous: prevStatus,
          new: newStatus,
          times: processedStatusTimes,
          updatedAt: updatedOrder.updatedAt
        });
        
        // Update the order in the state with new status and processed timestamps
        const updatedOrders = orders.map(order => {
          if (getOrderId(order) === orderId) {
            return { 
              ...order, 
              status: newStatus,
              statusTimes: processedStatusTimes,
              updatedAt: updatedOrder.updatedAt // Ensure updatedAt is captured
            };
          }
          return order;
        });
        
        setOrders(updatedOrders);
        
        // Update the selected order if it's the one being viewed
        if (selectedOrder && getOrderId(selectedOrder) === orderId) {
          setSelectedOrder({ 
            ...selectedOrder, 
            status: newStatus,
            statusTimes: processedStatusTimes,
            updatedAt: updatedOrder.updatedAt // Ensure updatedAt is captured
          });
        }
        
        // Force a refresh
        setTimeout(() => {
          const refreshOrders = [...updatedOrders];
          setOrders(refreshOrders);
        }, 100);
      } else {
        console.error('Failed to update order status:', response?.message);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Get order items
  const getOrderItems = (order) => {
    return order.items || [];
  };
  
  // Get item count
  const getItemCount = (order) => {
    const items = getOrderItems(order);
    const count = items.length;
    return `${count} ${count === 1 ? 'item' : 'items'}`;
  };
  
  // Get delivery fee
  const getDeliveryFee = () => {
    return 50; // Assuming fixed delivery fee
  };
  
  // Get subtotal
  const getSubtotal = (order) => {
    const items = getOrderItems(order);
    return items.reduce((total, item) => total + (item.price * item.cartQuantity), 0);
  };
  
  // Get total amount
  const getTotalAmount = (order) => {
    return order.totalAmount || (getSubtotal(order) + getDeliveryFee());
  };

  // Get delivery date estimate based on status
  const getDeliveryEstimate = (order) => {
    // Debug log to see what's in the order timestamps
    console.log(`Timestamps for delivery estimate (${getOrderId(order)}):`, {
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      statusTimes: order.statusTimes
    });
    
    // Use appropriate timestamps based on status
    switch(order.status) {
      case 'Delivered':
        // For Delivered, prefer updatedAt timestamp
        if (order.updatedAt) {
          return `Delivered on ${formatDate(order.updatedAt)}`;
        } else if (order.statusTimes && order.statusTimes.Delivered) {
          return `Delivered on ${formatDate(order.statusTimes.Delivered)}`;
        }
        break;
        
      case 'Shipping':
        // For Shipping, prefer updatedAt timestamp
        if (order.updatedAt) {
          return `Shipping since ${formatDate(order.updatedAt)}`;
        } else if (order.statusTimes && order.statusTimes.Shipping) {
          return `Shipping since ${formatDate(order.statusTimes.Shipping)}`;
        }
        break;
        
      case 'Processing':
        // For Processing, prefer updatedAt timestamp
        if (order.updatedAt) {
          return `Processing since ${formatDate(order.updatedAt)}`;
        } else if (order.statusTimes && order.statusTimes.Processing) {
          return `Processing since ${formatDate(order.statusTimes.Processing)}`;
        }
        break;
        
      case 'Pending':
        // For Pending, use createdAt timestamp
        if (order.createdAt) {
          return `Order placed on ${formatDate(order.createdAt)}`;
        } else if (order.statusTimes && order.statusTimes.Pending) {
          return `Order placed on ${formatDate(order.statusTimes.Pending)}`;
        }
        break;
    }
    
    // Default fallback
    return `Order placed on ${formatDate(order.date)}`;
  };
  
  // Get the appropriate title based on userType
  const getReceivedOrdersTitle = () => {
    return userType === 'supplier' 
      ? 'Received Agri-Input Orders' 
      : 'Received Product Orders';
  };

  // Get empty orders message based on userType
  const getEmptyOrdersMessage = () => {
    return userType === 'supplier'
      ? "You haven't received any orders for your agricultural inputs yet."
      : "You haven't received any orders for your products yet.";
  };

  return ReactDOM.createPortal(
    <div className="order-history-overlay received-orders-overlay">
      <div className="order-history-container received-orders-container">
        {/* Header */}
        <div className="cart-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaBox className="header-icon" />
              <h2>{getReceivedOrdersTitle()}</h2>
            </div>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="filter-controls">
          <span className="filter-label">Filter by Status:</span>
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
        
        {/* Loading State */}
        {isLoading ? (
          <div className="orders-loading">
            <div className="loading-spinner"></div>
            <p>Loading received orders...</p>
          </div>
        ) : (
          <div className="order-history-content">
            {orders.length === 0 ? (
              <div className="empty-orders">
                <div className="empty-orders-icon">
                  <FaBox />
                </div>
                <h3>No Orders Received</h3>
                <p>{getEmptyOrdersMessage()}</p>
              </div>
            ) : (
              <div className="orders-list">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <div 
                      key={getOrderId(order)} 
                      className={`order-item ${getStatusClass(order.status)}`}
                      onClick={() => openOrderModal(order)}
                    >
                      <div className="order-summary">
                        <div className="order-top-row">
                          <div className="order-id">
                            <div className="flex items-center justify-between w-full">
                              <h3>Order #{getOrderDisplayId(order)}</h3>
                              <span className={`order-status ${getStatusClass(order.status)}`}>
                                {getStatusIcon(order.status)} {order.status}
                              </span>
                            </div>
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
                            <FaMoneyBillWave style={{ marginRight: '5px', marginTop: '5px' }} />
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
                    <p>Try selecting a different filter or wait for new orders</p>
                    <button 
                      className="filter-clear-btn"
                      onClick={() => setFilterStatus('all')}
                    >
                      Show All Orders
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-backdrop" onClick={closeOrderModal}></div>
            <div className="order-details-modal">
              <div className="order-modal-content">
                <div className="modal-header">
                  <button className="back-btn" onClick={closeOrderModal}>
                    <FaArrowLeft /> Back
                  </button>
                  <div className={`modal-status status-${getStatusClass(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)} {selectedOrder.status}
                  </div>
                </div>
                
                <div className="modal-order-id">
                  <h2>Order #{getOrderDisplayId(selectedOrder)}</h2>
                  <div className="modal-date">
                    <FaCalendarAlt /> 
                    {selectedOrder.status === 'Pending' 
                      ? formatDate(selectedOrder.createdAt || selectedOrder.date)
                      : formatDate(selectedOrder.updatedAt || selectedOrder.date)}
                  </div>
                </div>
                
                {/* Status Info - Moved here right after the order ID */}
                <div className="status-message-section">
                  <div className="delivery-estimate">
                    <FaRegClock /> {getDeliveryEstimate(selectedOrder)}
                  </div>
                  <p className="status-description">
                    {getStatusDescription(selectedOrder.status)}
                  </p>
                </div>
                
                <div className="modal-content-wrapper">
                  <div className="modal-order-details">
                    {/* Buyer Information */}
                    <div className="order-delivery-info">
                      <h4>Buyer & Delivery Information</h4>
                      <p>
                        <FaUser className="info-icon" />
                        <strong>Buyer Name:</strong>
                        <span>{selectedOrder.buyerName || "Not provided"}</span>
                      </p>
                      <p>
                        <FaEnvelope className="info-icon" />
                        <strong>Buyer Email:</strong>
                        <span>{selectedOrder.buyerEmail}</span>
                      </p>
                      <p>
                        <FaMapMarkerAlt className="info-icon" />
                        <strong>Delivery Address:</strong>
                        <span>{selectedOrder.deliveryAddress}</span>
                      </p>
                      <p>
                        <FaPhoneAlt className="info-icon" />
                        <strong>Phone Number:</strong>
                        <span>{selectedOrder.phoneNumber}</span>
                      </p>
                      <p>
                        <FaCreditCard className="info-icon" />
                        <strong>Payment Method:</strong>
                        <span>{selectedOrder.paymentMethod}</span>
                      </p>
                      {selectedOrder.status !== 'Delivered' && (
                        <div className="status-actions">
                          <h4>Update Order Status</h4>
                          <div className="status-action-buttons">
                            {/* Only show status options according to the allowed progression */}
                            {selectedOrder.status === 'Pending' && (
                              <>
                                <button 
                                  className={`status-btn pending ${selectedOrder.status === 'Pending' ? 'current' : ''}`}
                                  disabled
                                >
                                  <FaClock /> Pending
                                </button>
                                <button 
                                  className="status-btn processing"
                                  onClick={() => handleUpdateStatus(getOrderId(selectedOrder), 'Processing')}
                                >
                                  <FaBox /> Processing
                                </button>
                                <button 
                                  className="status-btn shipping"
                                  onClick={() => handleUpdateStatus(getOrderId(selectedOrder), 'Shipping')}
                                >
                                  <FaTruck /> Shipping
                                </button>
                                <button 
                                  className="status-btn delivered"
                                  onClick={() => handleUpdateStatus(getOrderId(selectedOrder), 'Delivered')}
                                >
                                  <FaCheck /> Delivered
                                </button>
                              </>
                            )}
                            
                            {selectedOrder.status === 'Processing' && (
                              <>
                                <button 
                                  className="status-btn processing current"
                                  disabled
                                >
                                  <FaBox /> Processing
                                </button>
                                <button 
                                  className="status-btn shipping"
                                  onClick={() => handleUpdateStatus(getOrderId(selectedOrder), 'Shipping')}
                                >
                                  <FaTruck /> Shipping
                                </button>
                                <button 
                                  className="status-btn delivered"
                                  onClick={() => handleUpdateStatus(getOrderId(selectedOrder), 'Delivered')}
                                >
                                  <FaCheck /> Delivered
                                </button>
                              </>
                            )}
                            
                            {selectedOrder.status === 'Shipping' && (
                              <>
                                <button 
                                  className="status-btn shipping current"
                                  disabled
                                >
                                  <FaTruck /> Shipping
                                </button>
                                <button 
                                  className="status-btn delivered"
                                  onClick={() => handleUpdateStatus(getOrderId(selectedOrder), 'Delivered')}
                                >
                                  <FaCheck /> Delivered
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Order Summary - Moved here where status info was */}
                    <div className="order-total-summary">
                      <h4>Order Summary</h4>
                      <div className="summary-row">
                        <span>Subtotal</span>
                        <span>NRs.{getSubtotal(selectedOrder)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Delivery Fee</span>
                        <span>NRs.{getDeliveryFee()}</span>
                      </div>
                      <div className="summary-row total">
                        <span>Total</span>
                        <span>NRs.{getTotalAmount(selectedOrder)}</span>
                      </div>
                    </div>
                    
                    {/* Order Items - Now with vertical card layout */}
                    <div className="order-items full-width">
                      <h4>Ordered Items {getOrderItems(selectedOrder).length > 3 && <span className="scroll-indicator">(Scroll for more)</span>}</h4>
                      <div className="product-grid">
                        {getOrderItems(selectedOrder).map((item, index) => (
                          <div key={index} className="order-product">
                            <div className="product-image">
                              <img 
                                src={
                                  item.image && item.image.name 
                                    ? `http://localhost:5000/uploads/products/${item.image.name}`
                                    : item.image && typeof item.image === 'string'
                                      ? item.image.startsWith('http')
                                        ? item.image
                                        : `http://localhost:5000/uploads/products/${item.image}`
                                      : '../placeholder-product.png'
                                } 
                                alt={item.name} 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '../placeholder-product.png';
                                }       
                                } 
                                
                              />
                            </div>
                            <div className="product-info">
                              <h5>{item.name}</h5>
                              <p><strong>Price:</strong> NRs.{item.price} per {item.unit}</p>
                              <p><strong>Quantity:</strong> {item.cartQuantity}</p>
                              <p className="subtotal">Total: NRs.{item.price * item.cartQuantity}</p>
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
        )}
      </div>
    </div>,
    document.body
  );
};

ReceivedOrders.propTypes = {
  onClose: PropTypes.func.isRequired,
  userType: PropTypes.oneOf(['farmer', 'supplier'])
};

export default ReceivedOrders; 