import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import '../../styles/common/ProductSection.css';
import authService from '../../api';
import { getImageUrl } from '../../utils/imageUtils';

const BuyerProductSection = ({ dashboardType = 'farmer', farmerName, onBackClick, onBuyClick }) => {
  const [activeTab, setActiveTab] = useState('fruits');
  const [loading, setLoading] = useState(true);
  const [fruits, setFruits] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [error, setError] = useState('');
  const POLLING_INTERVAL = 1000; // Poll every 1 second for real-time updates

  // Function to fetch products
  const fetchProducts = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Get the farmer email from the farmer object
      const farmerEmail = farmerName?.email || farmerName?.company || "";
      
      if (farmerEmail) {
        const response = await authService.getProductsByFarmerEmail(farmerEmail);
        
        if (response.success) {
          // Check if we have new products
          const currentFruitsCount = fruits.length;
          const currentVegetablesCount = vegetables.length;
          const newFruitsCount = (response.data.fruits || []).length;
          const newVegetablesCount = (response.data.vegetables || []).length;
          
          if (newFruitsCount !== currentFruitsCount || newVegetablesCount !== currentVegetablesCount) {
            console.log(`Products count changed - Fruits: ${currentFruitsCount} → ${newFruitsCount}, Vegetables: ${currentVegetablesCount} → ${newVegetablesCount}`);
          }
          
          setFruits(response.data.fruits || []);
          setVegetables(response.data.vegetables || []);
        } else {
          if (showLoading) {
            setError(response.message || 'Failed to fetch products');
          }
        }
      } else {
        if (showLoading) {
          setError('Farmer email not found');
        }
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      if (showLoading) {
        setError('Error fetching products');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [farmerName, fruits.length, vegetables.length]);

  // Initial data fetch and setup polling
  useEffect(() => {
    fetchProducts();
    
    // Set up polling to refresh data periodically
    const pollingInterval = setInterval(() => {
      fetchProducts(false); // Don't show loading state during polling
    }, POLLING_INTERVAL);
    
    // Clean up interval on component unmount
    return () => clearInterval(pollingInterval);
  }, [fetchProducts]);

  // Determine if this is a buyer or farmer dashboard
  const isBuyer = dashboardType === 'buyer';

  // Set appropriate text based on dashboard type
  const availabilityText = isBuyer ? 'PURCHASE' : 'SALE';

  // Handle button clicks
  const handleBuyClick = (product) => {
    console.log(`Buying ${product.name}`);
    // Make sure the product has farmer information
    if (onBuyClick) {
      // Ensure the product has the farmer field properly set
      // This is important for the quantity management in BuyerDashboard
      const productWithFarmer = {
        ...product,
        farmer: farmerName
      };
      onBuyClick(productWithFarmer);
    }
  };

  const handleDeleteClick = (product) => {
    console.log(`Deleting ${product.name}`);
    // Logic to delete product
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

    // Display image using helper
    return (
      <div className="product-image-container">
        <img 
          src={getImageUrl(product.image)} 
          alt={product.name} 
          className="product-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/400x300?text=Image+Error';
          }}
        />
      </div>
    );
  };

  // Handle back button click - using the same pattern as in SuppliersSection
  const handleBackButtonClick = () => {
    // Call the original onBackClick function to return to farmers view
    onBackClick();
    
    // Scroll to the farmers section
    setTimeout(() => {
      const farmersSection = document.getElementById('farmers');
      if (farmersSection) {
        farmersSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
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

        {farmerName && (
          <h3 className="farmer-products-heading">
            Products from {farmerName.name || farmerName}
          </h3>
        )}
        
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
                      {isBuyer ? (
                        <button 
                          className="buy-btn" 
                          onClick={() => handleBuyClick(product)}
                        >
                          Buy
                        </button>
                      ) : (
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteClick(product)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-products-message">
                  <p>No fruits available from this farmer at the moment.</p>
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
                    {isBuyer ? (
                      <button 
                        
                        className="buy-btn" 
                        onClick={() => handleBuyClick(product)}
                      >
                        Buy
                      </button>
                    ) : (
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDeleteClick(product)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-products-message">
                <p>No vegetables available from this farmer at the moment.</p>
              </div>
            )}
          </div>
        )}
        
        {isBuyer && (
          <div className="back-button-container">
            <button 
              className="back-button"
              onClick={handleBackButtonClick}
            >
              ← Back to Farmers
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

BuyerProductSection.propTypes = {
  dashboardType: PropTypes.string,
  farmerName: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  onBackClick: PropTypes.func,
  onBuyClick: PropTypes.func
};

export default BuyerProductSection;
