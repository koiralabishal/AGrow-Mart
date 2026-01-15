import '../../styles/supplier/SupplierCard.css';
import { getProfileImageUrl } from '../../utils/imageUtils';
import PropTypes from 'prop-types';

const SupplierCard = ({ supplier, onClick }) => {
  return (
    <div className="supplier-card" onClick={onClick}>
      <div className="supplier-card-content">
        <div className="supplier-profile-pic">
          <img 
            src={getProfileImageUrl(supplier.profilePic)} 
            alt={supplier.name} 
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = "https://randomuser.me/api/portraits/men/1.jpg";
            }}
          />
        </div>
        <div className="supplier-info">
          <h3 className="supplier-name">{supplier.name}</h3>
          <p className="supplier-address">{supplier.address}</p>
          <p className="supplier-company">{supplier.company}</p>
        </div>
        <div className="view-products-btn">
          <span>View Agri-Inputs</span>
        </div>
      </div>
    </div>
  );
};

SupplierCard.propTypes = {
  supplier: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    profilePic: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ])
  }).isRequired,
  onClick: PropTypes.func.isRequired
};

export default SupplierCard; 
