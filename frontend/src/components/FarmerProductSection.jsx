import { useState, useEffect, useCallback } from 'react';
import '../styles/ProductSection.css';
import authService from '../api';
import PropTypes from 'prop-types';
import DeleteConfirmationPopup from './DeleteConfirmationPopup';

const FarmerProductSection = ({ dashboardType = 'farmer' }) => {
  const [activeTab, setActiveTab] = useState('fruits');
  const [fruits, setFruits] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Function to fetch products wrapped in useCallback to prevent unnecessary recreations
  const refreshProductsData = useCallback(async () => {
    try {
      // Get user data from localStorage
      const userDataString = localStorage.getItem('userData');
      
      if (!userDataString) {
        setError('You must be logged in to view your products');
        setLoading(false);
        return;
      }
      
      const userData = JSON.parse(userDataString);
      const farmerEmail = userData.email;
      
      // Fetch products
      const response = await authService.getProductsByFarmerEmail(farmerEmail);
      
      if (response.success) {
        // Log a sample product to inspect its structure
        if (response.data.fruits && response.data.fruits.length > 0) {
          console.log("Sample product:", response.data.fruits[0]);
        }
        
        setFruits(response.data.fruits || []);
        setVegetables(response.data.vegetables || []);
        setError('');
      } else {
        setError(response.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError('An error occurred while fetching products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    refreshProductsData();
  }, [refreshProductsData]);

  // Set up polling to refresh data automatically
  useEffect(() => {
    const pollingInterval = setInterval(() => {
      refreshProductsData();
    }, 1000); // Poll every 5 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(pollingInterval);
  }, [refreshProductsData]);

  // Determine if this is a buyer dashboard
  const isBuyer = dashboardType === 'buyer';

  // Set appropriate text based on dashboard type
  const availabilityText = isBuyer ? 'PURCHASE' : 'SALE';

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeletePopup(true);
  };

  const handleConfirmDelete = async (productId) => {
    try {
      const userDataString = localStorage.getItem('userData');
      const userData = JSON.parse(userDataString);
      const farmerEmail = userData?.email;
      
      if (!farmerEmail) {
        setError('User information not found. Please login again.');
        return;
      }
      
      await authService.deleteProduct(productId, farmerEmail);
      
      // Update the local state to remove the deleted product
      setFruits(prevFruits => prevFruits.filter(p => p._id !== productId));
      setVegetables(prevVegetables => prevVegetables.filter(p => p._id !== productId));
      
      setShowDeletePopup(false);
      setSuccessMessage(`${productToDelete.name} has been successfully deleted.`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
      setShowDeletePopup(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeletePopup(false);
    setProductToDelete(null);
  };

  // Function to format price with unit
  const formatPrice = (price, unit) => {
    return `NRs.${price} per ${unit}`;
  };

  // Function to display the correct image based on our database structure
  const renderImage = (product) => {
    // Make sure product and image exist
    if (!product || !product.image) {
      return <div className="no-image">No image</div>;
    }

    // If image is stored with path and name (our new multer implementation)
    if (product.image.path && product.image.name) {
      // Construct the URL to the image
      // Using direct path from the database
      return <img 
        src={`http://localhost:5000/uploads/products/${product.image.name}`} 
        alt={product.name} 
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/placeholder-image.png'; // Fallback image
        }}
      />;
    }

    // Fallback to older image storage formats
    if (typeof product.image === 'string') {
      return <img src={product.image} alt={product.name} />;
    }

    // Fallback
    return <div className="no-image">Image format not supported</div>;
  };

  return (
    <section id="products" className="farmer-product-section">
      <div className="product-container">
        <div className="product-tabs">
          <button 
            className={`tab-btn ${activeTab === 'fruits' ? 'active' : ''}`}
            onClick={() => setActiveTab('fruits')}
          >
            FRUITS
          </button>
          <button 
            className={`tab-btn ${activeTab === 'vegetables' ? 'active' : ''}`}
            onClick={() => setActiveTab('vegetables')}
          >
            VEGETABLES
          </button>
        </div>

        <h2>{activeTab.toUpperCase()} AVAILABLE FOR {availabilityText}</h2>

        {loading ? (
          <div className="loading-message">Loading products...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="product-grid">
            {activeTab === 'fruits' ? (
              fruits.length > 0 ? (
                fruits.map(product => (
                  <div key={product._id} className="product-card">
                    <div className="product-image">
                      {renderImage(product)}
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p>{formatPrice(product.price, product.unit)}</p>
                      <p>Quantity: {product.quantity} {product.unit}</p>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDeleteClick(product)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-products-message">
                  <p>You haven&apos;t added any fruits yet.</p>
                </div>
              )
            ) : vegetables.length > 0 ? (
              vegetables.map(product => (
                <div key={product._id} className="product-card">
                  <div className="product-image">
                    {renderImage(product)}
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p>{formatPrice(product.price, product.unit)}</p>
                    <p>Quantity: {product.quantity} {product.unit}</p>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDeleteClick(product)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-products-message">
                <p>You haven&apos;t added any vegetables yet.</p>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className="success-delete-message">
            {successMessage}
          </div>
        )}

        {showDeletePopup && productToDelete && (
          <DeleteConfirmationPopup
            product={productToDelete}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        )}
      </div>
    </section>
  );
};

// Add PropTypes for dashboardType
FarmerProductSection.propTypes = {
  dashboardType: PropTypes.string
};

export default FarmerProductSection;