import '../../styles/farmer/FarmerCard.css';
import { getProfileImageUrl } from '../../utils/imageUtils';
import PropTypes from "prop-types";
// import defaultProfilePic from '../assets/Logo AgroMart.png'; // Using the logo as fallback


const FarmerCard = ({ farmer, onClick }) => {
  return (
    <div className="farmer-card" onClick={onClick}>
      <div className="farmer-card-content">
        <div className="farmer-profile-pic">
          <img
            src={getProfileImageUrl(farmer.profilePic)}
            alt={farmer.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://randomuser.me/api/portraits/men/1.jpg";
            }}
          />
        </div>
        <div className="farmer-info">
          <h3 className="farmer-name">{farmer.name}</h3>
          <p className="farmer-address">{farmer.address}</p>
          <p className="farmer-company">{farmer.company}</p>
        </div>
        <div className="view-products-btn">
          <span>View Products</span>
        </div>
      </div>
    </div>
  );
};

FarmerCard.propTypes = {
  farmer: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    profilePic: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    email: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default FarmerCard;
