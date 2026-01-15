import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  FaTimes, FaMoneyBillWave, FaCheck, FaTimes as FaClose, 
  FaClock, FaFileInvoiceDollar, FaReceipt, FaCalendarAlt, 
  FaCreditCard, FaArrowLeft, FaExclamationTriangle, FaTrashAlt
} from 'react-icons/fa';
import ReactDOM from 'react-dom';
import '../../styles/common/TransactionHistory.css';
import '../../styles/common/SharedHistoryComponents.css';
import authService from '../../api';

const TransactionHistory = ({ onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  useEffect(() => {
    // Load transactions from database with a slight delay to show loading animation
    setIsLoading(true);
    
    const fetchTransactions = async () => {
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
        
        // Fetch transactions from database
        const response = await authService.getTransactionsByEmail(userEmail);
        
        if (response && response.success) {
          // Set transactions from database
          console.log('Transactions fetched from database:', response.data);
          setTransactions(response.data);
        } else {
          console.log('API call was not successful');
          // Show empty transactions
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        // Show empty transactions
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add a slight delay to show loading animation
    setTimeout(() => {
      fetchTransactions();
    }, 800);
  }, []);

  // Get status icon based on transaction status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheck className="status-icon completed" />;
      case 'failed':
        return <FaClose className="status-icon failed" />;
      case 'refunded':
        return <FaMoneyBillWave className="status-icon refunded" />;
      case 'pending':
      default:
        return <FaClock className="status-icon pending" />;
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Open transaction details modal
  const openTransactionModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
    document.body.classList.add('modal-open');
  };

  // Close transaction details modal
  const closeTransactionModal = () => {
    setShowTransactionModal(false);
    document.body.classList.remove('modal-open');
  };

  // Get CSS class based on transaction status
  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'refunded':
        return 'refunded';
      case 'pending':
      default:
        return 'pending';
    }
  };

  // Get a readable status description
  const getStatusDescription = (status) => {
    switch (status) {
      case 'completed':
        return 'Transaction was completed successfully.';
      case 'failed':
        return 'Transaction failed to process.';
      case 'refunded':
        return 'Amount has been refunded to your account.';
      case 'pending':
      default:
        return 'Transaction is being processed.';
    }
  };
  
  // Filter transactions based on status
  const filteredTransactions = filterStatus === 'all' 
    ? transactions 
    : transactions.filter(transaction => transaction.status === filterStatus);
    
  // Get transaction ID display (last 8 chars or using the transaction ID directly)
  const getTransactionDisplayId = (transaction) => {
    if (transaction._id) {
      return transaction._id.slice(-8);
    }
    return transaction.transactionId.slice(-8);
  };

  // Get transaction history title
  const getTransactionHistoryTitle = () => {
    return "Your Transactions History";
  };

  // Get empty transactions message
  const getEmptyTransactionsMessage = () => {
    return "You don't have any transactions yet. Your payment history will appear here after you make a purchase.";
  };

  // Handle delete transaction
  const handleDeleteTransaction = (transaction, event) => {
    event.stopPropagation(); // Prevent transaction modal from opening
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
  };

  // Confirm deletion
  const confirmDeleteTransaction = async () => {
    try {
      if (!transactionToDelete) {
        console.error('No transaction selected for deletion');
        setShowDeleteConfirm(false);
        return;
      }
      
      // Get the transaction ID
      const transactionId = transactionToDelete._id;
      
      console.log(`Deleting transaction #${getTransactionDisplayId(transactionToDelete)}`);
      
      // Delete from database
      try {
        await authService.deleteTransaction(transactionId);
        console.log('Transaction successfully deleted from database');
      } catch (error) {
        console.error('Failed to delete transaction from database:', error);
      }
      
      // Update state
      const updatedTransactions = transactions.filter(t => t._id !== transactionId);
      setTransactions(updatedTransactions);
      
      // Close confirmation modal
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
      
      // If the user was viewing the details of the deleted transaction, close that modal too
      if (selectedTransaction && selectedTransaction._id === transactionId) {
        closeTransactionModal();
      }
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Cancel deletion
  const cancelDeleteTransaction = () => {
    setShowDeleteConfirm(false);
    setTransactionToDelete(null);
  };

  return (
    <>
      <div className="transaction-history-overlay">
        <div className="transaction-history-container">
          {/* Header */}
          <div className="cart-header">
            <div className="d-flex align-items-center justify-content-between w-100">
              <div className="d-flex align-items-center">
                <FaFileInvoiceDollar className="header-icon" />
                <h2 className="m-0 text-white font-weight-bold">{getTransactionHistoryTitle()}</h2>
              </div>
              {/* <button className="btn text-white" onClick={onClose}>
                <FaTimes className="close-btn" />
              </button> */}
               <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="orders-loading">
              <div className="loading-spinner"></div>
              <p>Loading your transactions...</p>
            </div>
          ) : (
            <div className="transaction-history-content">
              {/* Filter Controls */}
              <div className="filter-controls">
                <div className="filter-label">Filter by status:</div>
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('completed')}
                  >
                    Completed
                  </button>
                  <button 
                    className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('pending')}
                  >
                    Pending
                  </button>
                  <button 
                    className={`filter-btn ${filterStatus === 'failed' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('failed')}
                  >
                    Failed
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              {filteredTransactions.length > 0 ? (
                <div className="transactions-list">
                  {filteredTransactions.map((transaction) => (
                    <div 
                      key={transaction._id || transaction.transactionId} 
                      className={`transaction-item ${getStatusClass(transaction.status)}`}
                      onClick={() => openTransactionModal(transaction)}
                    >
                      <div className="transaction-summary">
                        <div className="transaction-top-row">
                          <div className="transaction-id">
                            Transaction #{getTransactionDisplayId(transaction)}
                          </div>
                          <div className={`transaction-status status-${getStatusClass(transaction.status)}`}>
                            {getStatusIcon(transaction.status)}
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </div>
                        </div>
                        
                        <div className="transaction-meta">
                          <div className="transaction-date">
                            <FaCalendarAlt className="meta-icon" />
                            {formatDate(transaction.date)}
                          </div>
                          <div className="transaction-amount">
                            <FaCreditCard className="meta-icon" />
                            Rs. {transaction.amount.toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="transaction-meta">
                          <div className="payment-method">
                            <FaMoneyBillWave className="meta-icon" />
                            {transaction.paymentMethod}
                          </div>
                          {transaction.status === 'completed' && (
                            <button 
                              className="delete-transaction-btn"
                              onClick={(e) => handleDeleteTransaction(transaction, e)}
                              title="Delete Transaction"
                              aria-label="Delete Transaction"
                            >
                              <FaTrashAlt size={20} />
                            </button>
                          )}
                        </div>
                        
                        <div className="transaction-actions">
                          <button className="view-details-btn">
                            View Details
                          </button>
                          <div className="view-details-hint">Click to view transaction details</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-transactions">
                  {filterStatus !== 'all' ? (
                    <div className="no-filtered-transactions">
                      <div className="no-results-icon">
                        <FaExclamationTriangle />
                      </div>
                      <h3>No {filterStatus} transactions found</h3>
                      <p>Try a different filter or check back later.</p>
                      <button 
                        className="filter-clear-btn"
                        onClick={() => setFilterStatus('all')}
                      >
                        Show All Transactions
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="empty-transactions-icon">
                        <FaFileInvoiceDollar />
                      </div>
                      <h3>No Transactions Yet</h3>
                      <p>{getEmptyTransactionsMessage()}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && 
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-backdrop" onClick={closeTransactionModal}></div>
            <div className="transaction-details-modal">
              <div className="transaction-modal-content">
                <div className="modal-header">
                  <button 
                    className="back-to-transactions-btn"
                    onClick={closeTransactionModal}
                  >
                    <FaArrowLeft className="back-arrow-icon" /> 
                    <span>Back to Transactions</span>
                  </button>
                  <div className={`modal-status status-${getStatusClass(selectedTransaction.status)}`}>
                    {getStatusIcon(selectedTransaction.status)}
                    <span>{selectedTransaction.status}</span>
                  </div>
                </div>
                
                <div className="modal-transaction-id">
                  <h2>Transaction #{getTransactionDisplayId(selectedTransaction)}</h2>
                  <div className="modal-date">
                    <FaCalendarAlt /> {formatDate(selectedTransaction.date)}
                  </div>
                </div>
                
                <div className="modal-content-wrapper">
                  <div className="transaction-status-banner">
                    {getStatusIcon(selectedTransaction.status)}
                    <p>{getStatusDescription(selectedTransaction.status)}</p>
                  </div>
                  
                  <div className="modal-transaction-details">
                    <div className="transaction-info">
                      <h4><FaReceipt className="info-icon" /> Transaction Details</h4>
                      <div className="transaction-detail-item">
                        <span>Transaction ID:</span>
                        <span>{selectedTransaction.transactionId}</span>
                      </div>
                      <div className="transaction-detail-item">
                        <span>Amount:</span>
                        <span>Rs. {selectedTransaction.amount.toFixed(2)}</span>
                      </div>
                      <div className="transaction-detail-item">
                        <span>Payment Method:</span>
                        <span>{selectedTransaction.paymentMethod}</span>
                      </div>
                      <div className="transaction-detail-item">
                        <span>Date & Time:</span>
                        <span>{formatDate(selectedTransaction.date)}</span>
                      </div>
                      <div className="transaction-detail-item">
                        <span>Status:</span>
                        <span className={`status-${getStatusClass(selectedTransaction.status)}`}>
                          {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    {selectedTransaction.orderDetails && (
                      <div className="order-reference">
                        <h4><FaFileInvoiceDollar className="info-icon" /> Order Information</h4>
                        {selectedTransaction.orderDetails.items && selectedTransaction.orderDetails.items.length > 0 ? (
                          <div className="order-items">
                            <p>Order contains {selectedTransaction.orderDetails.items.length} items</p>
                            <p>Total order value: Rs. {selectedTransaction.orderDetails.total || selectedTransaction.amount.toFixed(2)}</p>
                          </div>
                        ) : (
                          <p>This transaction was not associated with a specific order.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* Delete confirmation modal */}
      {showDeleteConfirm && 
        ReactDOM.createPortal(
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-modal">
              <div className="delete-confirm-icon">
                <FaTrashAlt />
              </div>
              <h3>Delete Transaction?</h3>
              <p>
                Are you sure you want to delete this transaction?
                This action cannot be undone.
              </p>
              <div className="delete-confirm-actions">
                <button 
                  className="cancel-btn"
                  onClick={cancelDeleteTransaction}
                >
                  Keep
                </button>
                <button 
                  className="confirm-btn"
                  onClick={confirmDeleteTransaction}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </>
  );
};

TransactionHistory.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default TransactionHistory; 
