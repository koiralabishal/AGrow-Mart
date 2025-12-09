import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaVenusMars, FaCamera, FaTimes, FaCheckCircle } from 'react-icons/fa';
import '../styles/ProfileEditForm.css';
import authService from '../api';
// import axios from 'axios';

const ProfileEditForm = ({ onClose, userType = 'buyer' }) => {
  // Add console log to debug user type
  console.log('ProfileEditForm rendering with userType:', userType);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    gender: 'male',
    phoneNumber: '',
    profilePic: null,
    // Farmer specific fields
    farmName: '',
    farmLocation: '',
    // Supplier specific fields
    businessName: '',
    businessAddress: ''
  });
  
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Get user data from localStorage first
        const userDataString = localStorage.getItem('userData');
        if (!userDataString) {
          throw new Error('User data not found in localStorage');
        }
        
        // Parse the user data from localStorage
        const localUserData = JSON.parse(userDataString);
        console.log('User data from localStorage:', localUserData);
        console.log('Email from localStorage:', localUserData.email);
        
        // Set initial profile data from localStorage
        const initialData = {
          name: localUserData.name || '',
          email: localUserData.email ? localUserData.email.trim() : '', // Ensure email is trimmed and not undefined
          gender: localUserData.gender || 'male',
          phoneNumber: localUserData.phoneNumber || '',
          profilePic: localUserData.profilePic || "https://randomuser.me/api/portraits/men/1.jpg",
          // Set defaults for other fields
          farmName: localUserData.farmName || '',
          farmLocation: localUserData.farmLocation || '',
          businessName: localUserData.businessName || '',
          businessAddress: localUserData.businessAddress || ''
        };
        
        console.log('Initial profile data set from localStorage:', initialData);
        setProfileData(initialData);
        
        // If there's a profile picture in localStorage, set the preview
        if (localUserData.profilePic) {
          // Check if profilePic is an object with path or a string
          const picPath = typeof localUserData.profilePic === 'object' 
            ? localUserData.profilePic.path 
            : localUserData.profilePic;
            
          console.log('Profile pic path:', picPath);
          
          // If path starts with http or /, use it directly, otherwise prepend the server URL
          if (picPath) {
            const imageUrl = picPath.startsWith('http') 
              ? picPath 
              : `http://localhost:5000${picPath}`;
            setPreviewImage(imageUrl);
          }
        }
        
        // Then try to fetch complete profile from API to get any additional fields
        try {
          console.log('Fetching user profile from API for', localUserData.email);
          const response = await authService.getUserProfile(localUserData.email);
          console.log('API response:', response);
          
          if (response && response.success) {
            // Update profile data with API response
            const apiUserProfile = response.data;
            console.log('User profile data from API:', apiUserProfile);
            console.log('Email from API:', apiUserProfile.email);
            
            // Use functional update to ensure we're using the latest state
            setProfileData(prevData => {
              const updatedData = {
                ...prevData,
                // Update with API data, keeping localStorage values as fallback
                name: apiUserProfile.name || prevData.name,
                email: apiUserProfile.email || prevData.email, // Ensure email gets updated
                gender: apiUserProfile.gender || prevData.gender,
                phoneNumber: apiUserProfile.phoneNumber || prevData.phoneNumber,
                // User type specific fields
                farmName: apiUserProfile.farmName || '',
                farmLocation: apiUserProfile.farmLocation || '',
                businessName: apiUserProfile.businessName || '',
                businessAddress: apiUserProfile.businessAddress || ''
              };
              
              console.log('Updated profile data from API:', updatedData);
              return updatedData;
            });
            
            // If there's a profile picture from API, update the preview
            if (apiUserProfile.profilePic && !previewImage) {
              // Check if profilePic is an object with path or a string
              const picPath = typeof apiUserProfile.profilePic === 'object' 
                ? apiUserProfile.profilePic.path 
                : apiUserProfile.profilePic;
                
              console.log('API profilePic:', apiUserProfile.profilePic);
              
              if (picPath) {
                const imageUrl = picPath.startsWith('http') 
                  ? picPath 
                  : `http://localhost:5000${picPath}`;
                setPreviewImage(imageUrl);
              }
            }
          }
        } catch (apiError) {
          console.warn('Could not fetch additional profile data from API:', apiError);
          // Continue with localStorage data
        }
      } catch (error) {
        console.error('Error initializing profile data:', error);
        setErrorMsg('Failed to load profile data. Please refresh or try again later.');
      } finally {
        // Log final state of profileData after all loading
        console.log('Final profile data after loading:', profileData);
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Add debugging for conditional rendering
  useEffect(() => {
    console.log('Current profile data:', profileData);
    console.log('Farm fields should show:', userType === 'farmer');
    console.log('Business fields should show:', userType === 'supplier');
  }, [profileData, userType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.match('image.*')) {
        setErrorMsg('Please select an image file (JPEG, PNG, etc.)');
        return;
      }
      
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Image size should be less than 2MB');
        return;
      }
      
      console.log('Profile picture selected:', file.name, file.type, file.size);
      
      setProfileData(prevData => ({
        ...prevData,
        profilePic: file
      }));
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any error messages
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setShowSuccessPopup(false);
    
    // Get the email value directly from the DOM as a fallback
    const emailInputValue = document.querySelector('input[name="email"]')?.value;
    
    // Log current state for debugging
    console.log('Submitting form with data:', profileData);
    console.log('Email value from DOM:', emailInputValue);
    
    // Use email from profileData or fallback to input field value
    const emailToSubmit = profileData.email || emailInputValue || '';
    
    // If email is still missing at this point, show an error
    if (!emailToSubmit.trim()) {
      console.error('Email is completely missing for submission');
      setErrorMsg('Email is required. Please refresh and try again.');
      return;
    }
    
    // Form validation (skip other validation as per your recent changes)
    
    try {
      setIsSubmitting(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('name', profileData.name);
      
      // Explicitly add email from our reliable source
      formData.append('email', emailToSubmit);
      
      formData.append('gender', profileData.gender);
      formData.append('phoneNumber', profileData.phoneNumber);
      formData.append('userType', userType);
      
      // Log to confirm email is being sent in the request
      console.log('Email included in form submission:', emailToSubmit);
      
      if (profileData.profilePic) {
        formData.append('profilePic', profileData.profilePic);
      }
      
      // Add user type specific fields
      if (userType === 'farmer') {
        formData.append('farmName', profileData.farmName);
        formData.append('farmLocation', profileData.farmLocation);
      } else if (userType === 'supplier') {
        formData.append('businessName', profileData.businessName);
        formData.append('businessAddress', profileData.businessAddress);
      }
      
      console.log('Submitting profile update...');
      
      // Call the API to update profile
      const response = await authService.updateUserProfile(formData);
      console.log('Update profile response:', response);
      
      if (response && response.success) {
        setSuccessMsg('Profile updated successfully!');
        setShowSuccessPopup(true); // Show success popup
        
        // Update localStorage with new data
        try {
          const userData = JSON.parse(localStorage.getItem('userData'));
          
          // Ensure we correctly update the profilePic based on the server response
          let updatedProfilePic = userData.profilePic;
          
          // If a new profile picture was uploaded, use the server response data
          if (response.data.profilePic) {
            updatedProfilePic = response.data.profilePic;
            console.log('Got new profile picture from server:', updatedProfilePic);
          }
          
          const updatedUserData = {
            ...userData,
            name: profileData.name,
            email: profileData.email,
            phoneNumber: profileData.phoneNumber,
            gender: profileData.gender,
            profilePic: updatedProfilePic,
            // Update user type specific fields too
            farmName: userType === 'farmer' ? profileData.farmName : userData.farmName,
            farmLocation: userType === 'farmer' ? profileData.farmLocation : userData.farmLocation,
            businessName: userType === 'supplier' ? profileData.businessName : userData.businessName,
            businessAddress: userType === 'supplier' ? profileData.businessAddress : userData.businessAddress
          };
          
          console.log('Updating localStorage with:', updatedUserData);
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
          
          // Force a storage event to notify other components
          window.dispatchEvent(new Event('storage'));
        } catch (storageError) {
          console.error('Error updating localStorage:', storageError);
        }
        
        // Close the form after a short delay to show success message
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setErrorMsg(response?.message || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMsg('An error occurred while updating your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-edit-overlay">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="success-popup">
          <div className="success-popup-content">
            <div className="success-icon">
              <FaCheckCircle />
            </div>
            <h3>Success!</h3>
            <p>{successMsg}</p>
          </div>
        </div>
      )}

      <div className="profile-edit-container">
        <div className="profile-edit-header">
          <h2><FaUser className="header-icon" /> Edit Profile</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {isLoading ? (
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Loading your profile data...</p>
          </div>
        ) : (
          <form className="profile-edit-form" onSubmit={handleSubmit}>
            {/* Profile Picture Section */}
            <div className="profile-pic-section">
              <div className="profile-pic-container">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="profile-pic-preview" />
                ) : (
                  <div className="profile-pic-placeholder">
                    <FaUser />
                  </div>
                )}
                <div className="profile-pic-overlay">
                  <label htmlFor="profile-pic-upload" className="profile-pic-upload-label">
                    <FaCamera />
                    <span>Change Photo</span>
                  </label>
                  <input 
                    name="profilePic"
                    type="file" 
                    id="profile-pic-upload" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="profile-pic-upload"
                  />
                </div>
              </div>
            </div>
            
            {/* Error and Success Messages */}
            {errorMsg && (
              <div className="error-message">
                <FaTimes style={{marginRight: '8px'}} />
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="success-message">
                <FaCheckCircle style={{marginRight: '8px'}} />
                {successMsg}
              </div>
            )}
            
            {/* Common Fields */}
            <div className="section-divider">
              <h3 className="section-title">Personal Information</h3>
            </div>
            
            <div className="form-group">
              <label>
                <FaUser className="field-icon" /> Full Name*
              </label>
              <input 
                type="text" 
                name="name" 
                value={profileData.name} 
                onChange={handleInputChange} 
                placeholder="Your full name" 
                className="profile-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label>
                <FaEnvelope className="field-icon" /> Email*
              </label>
              <input 
                type="email" 
                name="email" 
                value={profileData.email || ''} 
                onChange={handleInputChange} 
                placeholder="Your email address" 
                className="profile-input"
                required
                readOnly
              />
              {/* Hidden backup input to ensure email is always included */}
              <input 
                type="hidden" 
                name="email_backup" 
                value={profileData.email || ''} 
              />
              <small className="field-note">Email is automatically included in submission and cannot be changed</small>
            </div>
            
            <div className="form-group">
              <label>
                <FaVenusMars className="field-icon" /> Gender
              </label>
              <div className="radio-group">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="gender" 
                    value="male" 
                    checked={profileData.gender === 'male'} 
                    onChange={handleInputChange} 
                  />
                  Male
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="gender" 
                    value="female" 
                    checked={profileData.gender === 'female'} 
                    onChange={handleInputChange} 
                  />
                  Female
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="gender" 
                    value="other" 
                    checked={profileData.gender === 'other'} 
                    onChange={handleInputChange} 
                  />
                  Other
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>
                <FaPhone className="field-icon" /> Phone Number*
              </label>
              <input 
                type="tel" 
                name="phoneNumber" 
                value={profileData.phoneNumber} 
                onChange={handleInputChange} 
                placeholder="Your phone number" 
                className="profile-input"
                required
              />
            </div>
            
            {/* Farmer-specific fields */}
            {userType === 'farmer' && (
              <>
                <div className="section-divider farmer-section">
                  <h3 className="section-title">Farm Information</h3>
                </div>
                
                <div style={{padding: '10px', border: '2px dashed #14986a', borderRadius: '8px', marginBottom: '15px'}}>
                  <p style={{color: '#14986a', fontWeight: 'bold', marginBottom: '10px'}}>
                    Farmer Fields (userType: {userType})
                  </p>
                  
                  <div className="form-group">
                    <label>
                      <FaBuilding className="field-icon" /> Farm Name*
                    </label>
                    <input 
                      type="text" 
                      name="farmName" 
                      value={profileData.farmName} 
                      onChange={handleInputChange} 
                      placeholder="Your farm name" 
                      className="profile-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <FaMapMarkerAlt className="field-icon" /> Farm Location*
                    </label>
                    <input 
                      type="text" 
                      name="farmLocation" 
                      value={profileData.farmLocation} 
                      onChange={handleInputChange} 
                      placeholder="Your farm location (city, state)" 
                      className="profile-input"
                      required
                    />
                  </div>
                </div>
              </>
            )}
            
            {/* Supplier-specific fields */}
            {userType === 'supplier' && (
              <>
                <div className="section-divider supplier-section">
                  <h3 className="section-title">Business Information</h3>
                </div>
                
                <div style={{padding: '10px', border: '2px dashed #0369a1', borderRadius: '8px', marginBottom: '15px'}}>
                  <p style={{color: '#0369a1', fontWeight: 'bold', marginBottom: '10px'}}>
                    Supplier Fields (userType: {userType})
                  </p>
                  
                  <div className="form-group">
                    <label>
                      <FaBuilding className="field-icon" /> Business Name*
                    </label>
                    <input 
                      type="text" 
                      name="businessName" 
                      value={profileData.businessName} 
                      onChange={handleInputChange} 
                      placeholder="Your business name" 
                      className="profile-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <FaMapMarkerAlt className="field-icon" /> Business Address*
                    </label>
                    <input 
                      type="text" 
                      name="businessAddress" 
                      value={profileData.businessAddress} 
                      onChange={handleInputChange} 
                      placeholder="Your business address (city, state)" 
                      className="profile-input"
                      required
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="update-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

ProfileEditForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  userType: PropTypes.oneOf(['buyer', 'farmer', 'supplier'])
};

export default ProfileEditForm; 