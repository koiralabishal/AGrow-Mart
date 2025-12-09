import '../styles/SupplierCard.css';
import PropTypes from 'prop-types';

// Helper function to get proper image URL
const getProfileImageUrl = (profilePic) => {
  if (!profilePic) return "https://randomuser.me/api/portraits/men/1.jpg";
  
  // If profilePic is already a URL, use it directly
  if (typeof profilePic === 'string') return profilePic;
  
  // If profilePic is an object with path
  if (typeof profilePic === 'object' && profilePic.path) {
    // If path is a full URL, use it directly
    if (profilePic.path.startsWith('http')) return profilePic.path;
    
    // If path is a relative URL (starts with /), prepend the server URL
    if (profilePic.path.startsWith('/')) return `http://localhost:5000${profilePic.path}`;
  }
  
  // Fallback to default image
  return "https://randomuser.me/api/portraits/men/1.jpg";
};

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
      </div>
      <div className="view-products-btn">
        <span>View Agri-Inputs</span>
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