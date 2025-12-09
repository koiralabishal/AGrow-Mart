// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef } from 'react';
import { FaShoppingCart, FaBell, FaBars, FaTimes, FaUser, FaSignOutAlt, FaClipboardList, FaHistory, FaCreditCard, FaBox } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Logo AgroMart.png';
import '../styles/Navbar.css';
import authService from '../api';
import PropTypes from 'prop-types';
import ProfileEditForm from './ProfileEditForm';

// Helper function to get proper image URL
const getProfileImageUrl = (profilePic) => {
  if (!profilePic) return "https://randomuser.me/api/portraits/men/1.jpg";
  
  // If profilePic is a string (direct URL), use it
  if (typeof profilePic === 'string') return profilePic;
  
  // If profilePic is an object with path property
  if (typeof profilePic === 'object' && profilePic.path) {
    // If path is a full URL, use it directly
    if (profilePic.path.startsWith('http')) return profilePic.path;
    
    // If path is a relative URL (starts with /), prepend the server URL
    if (profilePic.path.startsWith('/')) return `http://localhost:5000${profilePic.path}`;
  }
  
  // Fallback to default image
  return "https://randomuser.me/api/portraits/men/1.jpg";
};

const Navbar = ({ 
  onAddProductClick, 
  onAddAgriInputsClick, 
  showAgriInputs = false,
  toggleCart,
  cartItemsCount = 0,
  onViewOrders,
  ordersCount = 0,
  onViewTransactions,
  onViewReceivedOrders,
  userType = 'buyer'
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('hero');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1037);
  const [manualLinkClick, setManualLinkClick] = useState(false);
  const [showMobileUserDropdown, setShowMobileUserDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [userData, setUserData] = useState(null);
  const userDropdownRef = useRef(null);
  const historyDropdownRef = useRef(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  
  // Track profileImageUrl separately for components that need it
  const [profileImageUrl, setProfileImageUrl] = useState("https://randomuser.me/api/portraits/men/1.jpg");

  // Determine dashboard type based on props
  const isFarmerDashboard = userType === 'farmer';
  const isSupplierDashboard = userType === 'supplier';
  const isBuyerDashboard = userType === 'buyer';

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    // Track both the avatar and dropdown elements
    const avatarEl = userDropdownRef.current;
    let dropdownEl = null;
    
    function handleClickOutside(event) {
      // Check if click is outside both the avatar and dropdown
      const isOutsideAvatar = avatarEl && !avatarEl.contains(event.target);
      const isOutsideDropdown = dropdownEl && !dropdownEl.contains(event.target);
      
      if (showUserDropdown && isOutsideAvatar && isOutsideDropdown) {
        setShowUserDropdown(false);
      }
    }

    function handleEscKey(event) {
      if (event.key === 'Escape') {
        setShowUserDropdown(false);
      }
    }

    // Store reference to the dropdown element
    if (showUserDropdown) {
      dropdownEl = document.querySelector('.user-dropdown');
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showUserDropdown]);

  // Handle clicks outside the history dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      // Skip if the target is the icon itself (handled by toggleHistoryDropdown)
      if (event.target.closest('.orders-icon-container .nav-icon')) {
        return;
      }
      
      // If click is outside the dropdown, close it
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(event.target)) {
        setShowHistoryDropdown(false);
      }
    }

    function handleEscKey(event) {
      if (event.key === 'Escape') {
        setShowHistoryDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showHistoryDropdown]);

  // Get user data from localStorage
  useEffect(() => {
    const getUserData = () => {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        try {
          const parsedUserData = JSON.parse(userDataString);
          setUserData(parsedUserData);
          
          // Update profile image URL
          setProfileImageUrl(getProfileImageUrl(parsedUserData.profilePic));
          console.log('Profile image URL updated:', getProfileImageUrl(parsedUserData.profilePic));
          
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };
    
    getUserData();
    
    // Set up event listener for localStorage changes
    window.addEventListener('storage', getUserData);
    
    return () => {
      window.removeEventListener('storage', getUserData);
    };
  }, []);

  // Effect to handle profile image updates
  useEffect(() => {
    if (userData && userData.profilePic) {
      setProfileImageUrl(getProfileImageUrl(userData.profilePic));
    }
  }, [userData]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Reset dropdowns when toggling menu
    setShowMobileUserDropdown(false);
    setShowUserDropdown(false);
    setShowHistoryDropdown(false);
  };

  const toggleUserDropdown = (e) => {
    e.stopPropagation();
    console.log('Profile clicked! Current state:', !showUserDropdown);
    setShowUserDropdown(!showUserDropdown);
  };

  const toggleHistoryDropdown = (e) => {
    e.stopPropagation();
    // When opening the dropdown, ensure the page is scrolled to the top
    if (!showHistoryDropdown) {
      window.scrollTo(0, 0);
    }
    setShowHistoryDropdown(!showHistoryDropdown);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      // Redirect to login page after logout
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the API call fails, clear local storage and redirect
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userType');
      localStorage.removeItem('userData');
      navigate('/login');
    }
  };

  // Update to handle mobile profile click
  const handleMobileProfileClick = () => {
    setIsMenuOpen(false); // Close mobile menu
    setShowMobileUserDropdown(false); // Close mobile user dropdown
    
    // Get the latest userData from localStorage
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const parsedUserData = JSON.parse(userDataString);
        setUserData(parsedUserData);
        console.log('Opening profile form with data (mobile):', parsedUserData);
        console.log('User type from localStorage (mobile):', parsedUserData.userType);
      } catch (error) {
        console.error('Error parsing user data before opening profile (mobile):', error);
      }
    }
    
    setShowProfileForm(true); // Show profile form
  };

  const handleScrollTo = (event, id) => {
    event.preventDefault();
    
    // Special handling for suppliers section
    if (id === 'suppliers') {
      const suppliersSection = document.getElementById('suppliers');
      if (suppliersSection) {
        // Find the card container and scroll to it
        const cardsContainer = suppliersSection.querySelector('.suppliers-container');
        if (cardsContainer) {
          cardsContainer.scrollIntoView({ behavior: 'smooth' });
        } else {
          suppliersSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Set active link
        setActiveLink('suppliers');
        
        // Set flag to prevent scroll detection override
        setManualLinkClick(true);
        setTimeout(() => {
          setManualLinkClick(false);
        }, 1000);
        
        setIsMenuOpen(false);
        return;
      }
    }
    
    // Special handling for farmers section in buyer dashboard
    if (id === 'farmers' && isBuyerDashboard) {
      const farmersSection = document.getElementById('farmers');
      if (farmersSection) {
        // Find the farmers container and scroll to it
        const cardsContainer = farmersSection.querySelector('.farmers-container');
        if (cardsContainer) {
          cardsContainer.scrollIntoView({ behavior: 'smooth' });
        } else {
          farmersSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Set active link
        setActiveLink('farmers');
        
        // Set flag to prevent scroll detection override
        setManualLinkClick(true);
        setTimeout(() => {
          setManualLinkClick(false);
        }, 1000);
        
        setIsMenuOpen(false);
        return;
      }
    }
    
    // Regular handling for other sections
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      
      // Force set the activeLink state based on which link was clicked
      setActiveLink(id);
      
      // Set a flag to prevent scroll detection from immediately overriding
      setManualLinkClick(true);
      setTimeout(() => {
        setManualLinkClick(false);
      }, 1000);
    }
    
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 1037);
    };

    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Choose appropriate section ID and button text
  let productsSection = 'products';
  let productsText = 'Products';
  let buttonAction = null;
  let buttonText = '';

  if (isSupplierDashboard) {
    productsSection = 'agri-inputs';
    productsText = 'Agri Inputs';
    buttonAction = onAddAgriInputsClick;
    buttonText = 'Add Agri Inputs';
  } else if (isFarmerDashboard) {
    productsSection = 'products';
    productsText = 'Products';
    buttonAction = onAddProductClick;
    buttonText = 'Add Product';
  } else if (isBuyerDashboard) {
    // For buyer dashboard, change Products to Farmers
    productsSection = 'farmers';
    productsText = 'Farmers';
  }

  // Determine appropriate agri-inputs text and section based on dashboard type
  const agriInputsText = isFarmerDashboard ? 'Agri Input Suppliers' : 'Agri Inputs';
  const agriInputsSection = isFarmerDashboard ? 'suppliers' : 'agri-inputs';

  // Helper function to check if the agri-inputs link should be active
  const isAgriInputsActive = () => {
    if (isFarmerDashboard) {
      return activeLink === 'suppliers';
    } else {
      return activeLink === 'agri-inputs';
    }
  };

  // Restore the scroll detection for natural scrolling
  useEffect(() => {
    const handleScroll = () => {
      // Skip if a manual link click just happened
      if (manualLinkClick) return;
      
      const sections = ['hero', 'experience', 'products', 'farmers', 'suppliers', 'agri-inputs', 'contact'];
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Special case for bottom of page (contact section)
      if (scrollPosition + windowHeight >= documentHeight - 100) {
        setActiveLink('contact');
        return;
      }

      // For other sections
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveLink(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [manualLinkClick]);

  const navLinks = (
    <>
      <a
        href="#"
        onClick={(e) => handleScrollTo(e, 'hero')}
        className={`nav-link ${activeLink === 'hero' ? 'active' : ''}`}
      >
        Home
      </a>
      <a
        href="#"
        onClick={(e) => handleScrollTo(e, 'experience')}
        className={`nav-link ${activeLink === 'experience' ? 'active' : ''}`}
      >
        About
      </a>
      <a
        href="#"
        onClick={(e) => handleScrollTo(e, productsSection)}
        className={`nav-link ${activeLink === productsSection ? 'active' : ''}`}
      >
        {productsText}
      </a>
      {showAgriInputs && (
        <a
          href="#"
          id="agri-inputs-link"
          onClick={(e) => handleScrollTo(e, agriInputsSection)}
          className={`nav-link ${isAgriInputsActive() ? 'active' : ''}`}
        >
          {agriInputsText}
        </a>
      )}
      <a
        href="#"
        onClick={(e) => handleScrollTo(e, 'contact')}
        className={`nav-link ${activeLink === 'contact' ? 'active' : ''}`}
      >
        Contact
      </a>
    </>
  );

  // Function to handle profile link click
  const handleProfileClick = (e) => {
    e.preventDefault();
    setShowUserDropdown(false); // Close the dropdown
    
    // Get the latest userData from localStorage
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const parsedUserData = JSON.parse(userDataString);
        setUserData(parsedUserData);
        console.log('Opening profile form with data:', parsedUserData);
        console.log('User type from localStorage:', parsedUserData.userType);
      } catch (error) {
        console.error('Error parsing user data before opening profile:', error);
      }
    }
    
    setShowProfileForm(true); // Show the profile form
  };

  // Function to close profile form
  const handleCloseProfileForm = () => {
    setShowProfileForm(false);
    // Refresh user data after profile update
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const parsedUserData = JSON.parse(userDataString);
        setUserData(parsedUserData);
        // Update profile image URL
        setProfileImageUrl(getProfileImageUrl(parsedUserData.profilePic));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <img src={logo} alt="AgroMart Logo" className="nav-logo" />
          <button className="hamburger-btn" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        
        <div className="nav-center">
          {navLinks}
        </div>
        
        <div className="nav-right">
          {!isMobileView && buttonAction && (
            <button 
              className="nav-button add-product-btn" 
              onClick={buttonAction}
            >
              {buttonText}
            </button>
          )}
          
          {toggleCart && toggleCart !== null && (
            <div className="cart-icon-container" onClick={toggleCart}>
              <FaShoppingCart className="nav-icon" />
              {cartItemsCount > 0 && (
                <span className="cart-count">{cartItemsCount}</span>
              )}
            </div>
          )}
          
          {/* Display the orders icon only if there are dropdown items to show */}
          {((userType !== 'supplier' && onViewOrders) || 
            ((userType === 'farmer' || userType === 'supplier') && onViewReceivedOrders) || 
            onViewTransactions) && (
            <div className="orders-icon-container">
              <FaClipboardList className={`nav-icon ${showHistoryDropdown ? 'active' : ''}`} onClick={toggleHistoryDropdown} />
              {ordersCount > 0 && (
                <span className="orders-count">{ordersCount}</span>
              )}
              
              {/* History Dropdown Menu */}
              {showHistoryDropdown && (
                <div className="history-dropdown active" ref={historyDropdownRef}>
                  {/* Only show Order History button for non-supplier users */}
                  {userType !== 'supplier' && onViewOrders && (
                    <button className="history-dropdown-item" onClick={onViewOrders}>
                      <FaHistory className="dropdown-icon" /> 
                      {userType === 'farmer' ? 'My Purchase History' : 'Order History'}
                    </button>
                  )}
                  
                  {/* Show Received Orders for farmers and suppliers */}
                  {(userType === 'farmer' || userType === 'supplier') && onViewReceivedOrders && (
                    <button className="history-dropdown-item" onClick={onViewReceivedOrders}>
                      <FaBox className="dropdown-icon" /> Received Orders
                    </button>
                  )}
                  
                  {onViewTransactions && (
                    <button className="history-dropdown-item" onClick={onViewTransactions}>
                      <FaCreditCard className="dropdown-icon" /> Transaction History
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          
          <FaBell className="nav-icon" />
          <div className="avatar" ref={userDropdownRef} onClick={toggleUserDropdown}>
            <img 
              src={profileImageUrl} 
              alt="User" 
            />
          </div>
        </div>
      </nav>

      {/* Dropdown menu positioned below navbar */}
      {showUserDropdown && (
        <div 
          className="user-dropdown active"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="user-dropdown-header">
            <div className="user-dropdown-name">{userData?.name || 'User'}</div>
            <div className="user-dropdown-email">{userData?.email || 'user@example.com'}</div>
          </div>
          <div className="user-dropdown-body">
            <a href="#" className="user-dropdown-link" onClick={handleProfileClick}>
              <FaUser /> Profile
            </a>
            <a href="#" className="user-dropdown-link logout" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </a>
          </div>
        </div>
      )}

      <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
        {navLinks}
        {buttonAction && (
          <button 
            className="nav-button add-product-btn mobile-add-btn" 
            onClick={buttonAction}
          >
            {buttonText}
          </button>
        )}
        
        {/* Mobile user dropdown */}
        <div 
          className="mobile-user-dropdown" 
          style={{ display: showMobileUserDropdown ? 'block' : 'none' }}
        >
          <div className="mobile-user-info">
            <div className="mobile-avatar">
              <img 
                src={profileImageUrl} 
                alt="User" 
              />
            </div>
            <div className="mobile-user-details">
              <div className="mobile-user-name">{userData?.name || 'User'}</div>
              <div className="mobile-user-email">{userData?.email || 'user@example.com'}</div>
            </div>
          </div>
          <button className="mobile-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
        
        {/* Mobile profile button to toggle dropdown */}
        <button 
          className="nav-button mobile-profile-btn" 
          onClick={handleMobileProfileClick}
          style={{ 
            display: isMenuOpen ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '1rem'
          }}
        >
          <FaUser /> My Profile
        </button>
      </div>

      {/* Profile Edit Form */}
      {showProfileForm && (
        <>
          {console.log('Rendering ProfileEditForm with userType:', userData?.userType || 'buyer')}
          <ProfileEditForm 
            onClose={handleCloseProfileForm} 
            userType={userData?.userType || 'buyer'}
          />
        </>
      )}
    </>
  );
};

Navbar.propTypes = {
  onAddProductClick: PropTypes.func,
  onAddAgriInputsClick: PropTypes.func,
  showAgriInputs: PropTypes.bool,
  toggleCart: PropTypes.func,
  cartItemsCount: PropTypes.number,
  onViewOrders: PropTypes.func,
  ordersCount: PropTypes.number,
  onViewTransactions: PropTypes.func,
  onViewReceivedOrders: PropTypes.func,
  userType: PropTypes.string
};

Navbar.defaultProps = {
  onAddProductClick: null,
  onAddAgriInputsClick: null,
  showAgriInputs: false,
  toggleCart: null,
  cartItemsCount: 0,
  onViewOrders: null,
  ordersCount: 0,
  onViewTransactions: null,
  onViewReceivedOrders: null,
  userType: 'buyer'
};

export default Navbar;