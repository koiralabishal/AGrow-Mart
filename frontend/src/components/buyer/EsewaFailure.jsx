import { useNavigate } from 'react-router-dom';
import { FaTimesCircle, FaHome, FaRedo } from 'react-icons/fa';
import '../../styles/buyer/EsewaFailure.css';

const EsewaFailure = () => {
  const navigate = useNavigate();
  
  const handleGoToHome = () => {
    navigate('/buyer-dashboard');
  };
  
  const handleTryAgain = () => {
    // Get the pending order from localStorage
    const pendingOrder = localStorage.getItem('pending_order');
    if (pendingOrder) {
      // Navigate back to the buyer dashboard
      navigate('/buyer-dashboard');
    } else {
      navigate('/buyer-dashboard');
    }
  };
  
  return (
    <div className="esewa-failure-container">
      <div className="failure-icon">
        <FaTimesCircle />
      </div>
      <h1>Payment Failed</h1>
      <p className="failure-message">
        Your payment could not be processed at this time. 
        Your order has not been placed.
      </p>
      <p className="help-message">
        Please ensure you have sufficient balance in your eSewa account and try again.
        If the problem persists, please contact our customer support.
      </p>
      
      <div className="action-buttons">
        <button className="retry-btn" onClick={handleTryAgain}>
          <FaRedo /> Try Again
        </button>
        <button className="home-btn" onClick={handleGoToHome}>
          <FaHome /> Go to Home Page
        </button>
      </div>
    </div>
  );
};

export default EsewaFailure; 
