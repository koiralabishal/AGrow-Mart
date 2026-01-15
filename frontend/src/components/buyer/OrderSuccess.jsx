import PropTypes from "prop-types";
import {
  FaCheckCircle,
  FaMapMarkerAlt,
  FaPhone,
  FaMoneyBill,
  FaCreditCard,
  FaReceipt,
} from "react-icons/fa";
import "../../styles/buyer/OrderSuccess.css";

const OrderSuccess = ({ orderDetails, onContinueShopping }) => {
  return (
    <div className="order-success">
      <div className="success-icon">
        <FaCheckCircle />
      </div>
      <h2>Order Successfully Placed!</h2>
      <p className="success-message">
        Thank you for your order. We have received your purchase request and
        will process it shortly.
      </p>

      <div className="order-details">
        <h3>Order Details</h3>

        <div className="detail-row">
          <span>Subtotal:</span>
          <span>NRs.{orderDetails.subtotal}</span>
        </div>

        <div className="detail-row">
          <span>Delivery Fee:</span>
          <span>NRs.{orderDetails.deliveryFee}</span>
        </div>

        <div className="detail-row total">
          <span>Total Amount:</span>
          <span>NRs.{orderDetails.total}</span>
        </div>

        <div className="detail-section">
          <div className="detail-item">
            <FaMapMarkerAlt className="detail-icon" />
            <div>
              <span className="detail-label">Delivery Address:</span>
              <p>{orderDetails.deliveryAddress}</p>
            </div>
          </div>

          <div className="detail-item">
            <FaPhone className="detail-icon" />
            <div>
              <span className="detail-label">Contact Number:</span>
              <p>{orderDetails.phoneNumber}</p>
            </div>
          </div>

          <div className="detail-item">
            {orderDetails.paymentMethod === "cash" ? (
              <FaMoneyBill className="detail-icon" />
            ) : (
              <FaCreditCard className="detail-icon" />
            )}
            <div>
              <span className="detail-label">Payment Method:</span>
              <p>
                {orderDetails.paymentMethod === "cash"
                  ? "Cash on Delivery"
                  : "Online Payment"}
              </p>
            </div>
          </div>

          {/* Show transaction ID for online payments */}
          {orderDetails.paymentMethod === "online" &&
            orderDetails.transactionId && (
              <div className="detail-item transaction-detail">
                <FaReceipt className="detail-icon" />
                <div>
                  <span className="detail-label">Transaction ID:</span>
                  <p>{orderDetails.transactionId}</p>
                </div>
              </div>
            )}
        </div>
      </div>

      <button className="continue-btn" onClick={onContinueShopping}>
        Continue Shopping
      </button>
    </div>
  );
};

OrderSuccess.propTypes = {
  orderDetails: PropTypes.shape({
    subtotal: PropTypes.number.isRequired,
    deliveryFee: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    deliveryAddress: PropTypes.string.isRequired,
    phoneNumber: PropTypes.string.isRequired,
    paymentMethod: PropTypes.string.isRequired,
    transactionId: PropTypes.string,
  }).isRequired,
  onContinueShopping: PropTypes.func.isRequired,
};

export default OrderSuccess;
