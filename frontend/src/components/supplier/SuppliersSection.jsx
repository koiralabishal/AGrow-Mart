import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import SupplierCard from './SupplierCard';
import FarmerAgriInputSection from '../farmer/FarmerAgriInputSection';
import authService from '../../api';
import '../../styles/supplier/SupplierCard.css';

const SuppliersSection = ({ onBuyClick, isViewingSupplierProducts, setIsViewingSupplierProducts }) => {
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [suppliersData, setSuppliersData] = useState([]);

  // Fetch real suppliers data
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await authService.getSuppliersWithAgriInputs();
        
        if (response.success) {
          console.log('Suppliers with agri-inputs:', response.data);
          setSuppliersData(response.data);
        } else {
          console.error('Failed to fetch suppliers:', response.message);
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      }
    };
    
    fetchSuppliers();
  }, []);
  
  // Use the fetched data or fallback to empty array if no data
  const suppliers = suppliersData.length > 0 ? suppliersData : [];

  // Scroll to agri-inputs section when viewing inputs
  useEffect(() => {
    if (isViewingSupplierProducts) {
      const agriInputsSection = document.getElementById('agri-inputs');
      if (agriInputsSection) {
        agriInputsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [isViewingSupplierProducts]);

  const handleCardClick = (supplier) => {
    setSelectedSupplier(supplier);
    setIsViewingSupplierProducts(true);
    
    // Update page title for better user experience
    document.title = `${supplier.name}'s Agri Inputs | AgroMart`;
    
    // Scroll to agri-inputs section
    setTimeout(() => {
      const agriInputsSection = document.getElementById('agri-inputs');
      if (agriInputsSection) {
        agriInputsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleBackClick = () => {
    setIsViewingSupplierProducts(false);
    setSelectedSupplier(null);
    
    // Restore original document title
    document.title = 'AgroMart';
    
    // Scroll to suppliers section to ensure it's visible
    const suppliersSection = document.getElementById('suppliers');
    if (suppliersSection) {
      suppliersSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isViewingSupplierProducts && selectedSupplier) {
    return (
      <div id="agri-inputs" className="agri-inputs-section">
        <FarmerAgriInputSection 
          supplierName={selectedSupplier}
          onBackClick={handleBackClick}
          onBuyClick={onBuyClick}
        />
      </div>
    );
  }

  return (
    <section id="suppliers" className="suppliers-section">
      <div className="section-header">
        <h2>Agri-Input Suppliers</h2>
        <p>Browse profiles and agri-inputs from our trusted supply partners</p>
      </div>

      <div className="suppliers-container">
        {suppliers.length > 0 ? (
          suppliers.map(supplier => (
            <SupplierCard 
              key={supplier.id} 
              supplier={supplier} 
              onClick={() => handleCardClick(supplier)} 
            />
          ))
        ) : (
          <div className="no-products-message">
            <p>No agri-input suppliers found at the moment. Please check back later!</p>
          </div>
        )}
      </div>
    </section>
  );
};

SuppliersSection.propTypes = {
  onBuyClick: PropTypes.func,
  isViewingSupplierProducts: PropTypes.bool,
  setIsViewingSupplierProducts: PropTypes.func
};

export default SuppliersSection; 
