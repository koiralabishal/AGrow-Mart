import { useState, useEffect, useCallback } from "react";
import FarmerCard from "../farmer/FarmerCard";
import BuyerProductSection from "./BuyerProductSection";
import authService from "../../api";
import "../../styles/farmer/FarmerCard.css";
import PropTypes from "prop-types";

const FarmersSection = ({
  onBuyClick,
  isViewingFarmerProducts,
  setIsViewingFarmerProducts,
}) => {
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmersData, setFarmersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const POLLING_INTERVAL = 1000; // Check for updates every 1 seconds

  // Function to fetch farmers data without showing loading state
  const refreshFarmersData = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        const response = await authService.getFarmersWithProducts();

        if (response.success) {
          console.log("Farmers data refreshed:", response.data);
          // Check if we have new farmers by comparing the data
          const currentCount = farmersData.length;
          const newCount = response.data.length;

          if (newCount !== currentCount) {
            console.log(`Farmers count changed: ${currentCount} → ${newCount}`);
          }

          setFarmersData(response.data);
        } else {
          console.error("Failed to refresh farmers:", response.message);
          if (showLoading) {
            setError(response.message || "Failed to fetch farmers");
          }
        }
      } catch (err) {
        console.error("Error refreshing farmers:", err);
        if (showLoading) {
          setError("Error loading farmers data");
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [farmersData.length]
  );

  // Initial data fetch
  useEffect(() => {
    refreshFarmersData(true);
  }, [refreshFarmersData]);

  // Set up polling to automatically detect new farmers
  useEffect(() => {
    if (isViewingFarmerProducts) {
      return; // Don't poll when viewing products
    }

    // Poll for new farmers
    const pollingInterval = setInterval(() => {
      refreshFarmersData(false);
    }, POLLING_INTERVAL);

    // Clean up on unmount or when switching to product view
    return () => clearInterval(pollingInterval);
  }, [isViewingFarmerProducts, farmersData.length, refreshFarmersData]);

  // Scroll to products section when viewing products
  useEffect(() => {
    if (isViewingFarmerProducts) {
      const productsSection = document.getElementById("products");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [isViewingFarmerProducts]);

  const handleCardClick = (farmer) => {
    setSelectedFarmer(farmer);
    setIsViewingFarmerProducts(true);

    // Update page title for better user experience
    document.title = `${farmer.name}'s Products | AgroMart`;

    // Scroll to products section
    setTimeout(() => {
      const productsSection = document.getElementById("products");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleBackClick = () => {
    setIsViewingFarmerProducts(false);
    setSelectedFarmer(null);

    // Restore original document title
    document.title = "AgroMart";

    // Scroll to farmers section
    const farmersSection = document.getElementById("farmers");
    if (farmersSection) {
      farmersSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // If viewing a specific farmer's products, show the product section
  if (isViewingFarmerProducts && selectedFarmer) {
    return (
      <BuyerProductSection
        dashboardType="buyer"
        farmerName={selectedFarmer}
        onBackClick={handleBackClick}
        onBuyClick={onBuyClick}
      />
    );
  }

  return (
    <section id="farmers" className="farmers-section">
      <div className="section-header">
        <h2>Our Featured Farmers</h2>
        <p className="section-subtitle">
          Browse our network of trusted farmers and explore their fresh produce
        </p>

        {loading ? (
          <div className="loading-message">Loading farmers...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : farmersData.length === 0 ? (
          <div className="no-products-message">
            <p>
              No featured farmers found at the moment. Please check back later!
            </p>
          </div>
        ) : (
          <div className="farmers-container">
            {farmersData.map((farmer) => (
              <FarmerCard
                key={farmer.email}
                farmer={farmer}
                onClick={() => handleCardClick(farmer)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

FarmersSection.propTypes = {
  onBuyClick: PropTypes.func,
  isViewingFarmerProducts: PropTypes.bool,
  setIsViewingFarmerProducts: PropTypes.func,
};

export default FarmersSection;
