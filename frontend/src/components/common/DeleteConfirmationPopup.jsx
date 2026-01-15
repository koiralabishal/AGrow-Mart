import React from 'react';
import PropTypes from 'prop-types';
import { FaExclamationTriangle, FaTimes, FaCheck } from 'react-icons/fa';
import '../../styles/common/DeleteConfirmationPopup.css';

const DeleteConfirmationPopup = ({ product, onConfirm, onCancel }) => {
  return (
    <div className="delete-popup-overlay">
      <div className="delete-popup-container">
        <div className="delete-popup-header">
          <h3>Confirm Deletion</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        <div className="delete-popup-content">
          <p className="warning-text">
            Are you sure you want to delete <strong>{product.name}</strong>?
          </p>
          <p>This action cannot be undone.</p>
          
          <div className="delete-popup-buttons">
            <button className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button 
              className="confirm-btn" 
              onClick={() => onConfirm(product._id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

DeleteConfirmationPopup.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default DeleteConfirmationPopup; 
