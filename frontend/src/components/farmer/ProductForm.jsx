import React, { useState } from 'react';
import '../../styles/farmer/ProductForm.css';
import authService from '../../api';

const ProductForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'fruits',
    quantity: '',
    unit: 'KG',
    description: '',
    image: null
  });

  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ 
        ...formData, 
        image: {
          name: file ? file.name : '',
          size: file ? file.size : '',
          type: file ? file.type : ''
        }
      });
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    // Get user data from localStorage
    const userDataString = localStorage.getItem('userData');
    let farmerEmail = '';
    
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      farmerEmail = userData.email;
    } else {
      setError("You must be logged in to add products");
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Add the farmerEmail to the form data
      const productDataWithEmail = {
        ...formData,
        farmerEmail
      };
      
      const response = await authService.addProduct(productDataWithEmail);
      
      if (response.success) {
        // Show beautiful popup
        setPopupMessage(response.message || "Product added successfully!");
        setShowPopup(true);
        
        setSubmitted(true);
        
        // Reset form
        setFormData({
          name: '',
          price: '',
          category: 'fruits',
          quantity: '',
          unit: 'KG',
          description: '',
          image: null
        });
        setPreview(null);
        
        // Reset file input
        if (document.getElementById('product-image')) {
          document.getElementById('product-image').value = '';
        }
      } else {
        setError(response.message || "Failed to add product");
        setSuccess("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      setSuccess("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = {
    message: {
      margin: '0.5rem 0',
      padding: '0.5rem',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#2e7d32',
      textAlign: 'center'
    },
    error: { background: 'rgba(229, 62, 62, 0.1)', color: '#e53e3e' },
    success: { background: 'rgba(56, 161, 105, 0.1)', color: '#38a169' },
    popupOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(3px)'
    },
    popupContent: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '10px',
      maxWidth: '450px',
      width: '90%',
      position: 'relative',
      textAlign: 'center',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
      animation: 'popupFadeIn 0.3s ease-out'
    },
    successIcon: {
      width: '70px',
      height: '70px',
      borderRadius: '50%',
      backgroundColor: '#4CAF50',
      color: 'white',
      fontSize: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
    },
    popupTitle: {
      fontSize: '22px',
      fontWeight: '600',
      margin: '10px 0',
      color: '#333'
    },
    popupText: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '20px'
    },
    popupButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      padding: '10px 24px',
      borderRadius: '5px',
      fontSize: '16px',
      cursor: 'pointer',
      fontWeight: '500',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease'
    }
  };

  return (
    <div className="product-form-container">
      {showPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupContent}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.popupTitle}>{popupMessage}</h2>
            <p style={styles.popupText}>Your product has been added to the marketplace.</p>
            <button 
              style={styles.popupButton} 
              onClick={() => setShowPopup(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
      <div className="product-form-wrapper">
        <button id="close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>Add New Product</h2>
        {error && <div style={{ ...styles.message, ...styles.error }}>{error}</div>}
        {success && <div style={{ ...styles.message, ...styles.success }}>{success}</div>}
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label htmlFor="name">Product Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
            />
          </div>

          <div className="form-row triple">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="" disabled>Select Category</option>
                <option value="fruits">Fruits</option>
                <option value="vegetables">Vegetables</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="unit">Unit</label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
              >
                <option value="" disabled>Select Unit</option>
                <option value="KG">KG</option>
                <option value="Dozen">Dozen</option>
                <option value="Piece">Piece</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (NRs)</label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g., 150"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                placeholder="Describe your product"
              ></textarea>
            </div>
          </div>

          <div className="form-group">
            <label>Product Image</label>
            <input
              type="file"
              id="product-image"
              name="productImage"
              accept=".jpg, .jpeg, .png"
              onChange={handleImageChange}
            />
            <label
              htmlFor="product-image"
              style={{
                border: '1px solid #ccc',
                padding: '10px',
                borderRadius: '5px',
                position: 'relative',
                bottom: '25px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Upload Product Image
            </label>
            {formData.image && (
              <p className="file-name">
                Selected: {formData.image.name 
                  ? formData.image.name 
                  : (typeof formData.image === 'string' 
                      ? 'Current Image' 
                      : 'Image Selected')}
              </p>
            )}
            {preview && (
              <div className="image-preview">
                <img src={preview} alt="Product preview" />
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding Product...' : 'Add to Agromart'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;

