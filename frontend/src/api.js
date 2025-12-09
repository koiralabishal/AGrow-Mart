import axios from "axios";

const API_URL = "http://localhost:5000/api/auth"; // Replace with your backend URL
// const AGRI_INPUT_URL = "http://localhost:5000/api/agri-inputs"; // URL for agri-inputs endpoints
const API_URL_AGRI_INPUT = "http://localhost:5000/api/agri-inputs";
const API_URL_PRODUCT = "http://localhost:5000/api/products";
const API_URL_ORDER = "http://localhost:5000/api/orders";
const API_URL_ADMIN = "http://localhost:5000/api/admin";

// Register buyer
const registerBuyer = async (userData) => {
  const response = await axios.post(`${API_URL}/register-buyer`, userData);
  return response.data;
};

// Register farmer with file upload
const registerFarmer = async (userData) => {
    const formData = new FormData();
    
    // // Extract image file from the saved file input
    const licenseDocument = document.getElementById('licenseDocument').files[0];
    
    // // Add all other form fields to FormData
      Object.keys(userData).forEach(key => {
        if (key !== 'licenseDocument') { // Skip the image object, we'll add the file directly
          formData.append(key, userData[key]);
        }
      });
    
    // // Append the image file with the field name matching the multer middleware
    if (licenseDocument) {
      formData.append('licenseDocument', licenseDocument);
    } 

   
    
    const response = await axios.post(`${API_URL}/register-farmer`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
};


// Register supplier with file upload
const registerSupplier = async (userData) => {
  const formData = new FormData();
    
    // // Extract image file from the saved file input
    const businessCertificate = document.getElementById('businessCertificate').files[0];
    
    // // Add all other form fields to FormData
      Object.keys(userData).forEach(key => {
        if (key !== 'businessCertificate') { // Skip the image object, we'll add the file directly
          formData.append(key, userData[key]);
        }
      });
    
    // // Append the image file with the field name matching the multer middleware
    if (businessCertificate) {
      formData.append('businessCertificate', businessCertificate);
    } 
  const response = await axios.post(`${API_URL}/register-supplier`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  
  // If login is successful, store auth info in localStorage
  if (response.data.success) {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userType', response.data.userType);
    
    // Store user data as JSON string
    if (response.data.userData) {
      localStorage.setItem('userData', JSON.stringify(response.data.userData));
    }
  }
  
  return response.data;
};

// Logout user
const logout = async () => {
  const response = await axios.post(`${API_URL}/logout`);
  
  // Clear auth info from localStorage
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userType');
  localStorage.removeItem('userData');
  
  return response.data;
};

// Verify email
const verifyEmail = async (verifyEmailData) => {
  const response = await axios.get(`${API_URL}/verify-token`, {
    params: verifyEmailData, // Pass token and email as query parameters
  });
  return response.data;
};

// Check authentication status
const checkAuthStatus = async () => {
  // First check localStorage
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const userType = localStorage.getItem('userType');
  const userData = localStorage.getItem('userData');
  
  if (isAuthenticated === 'true' && userType && userData) {
    try {
      // Parse the user data to get the email
      const parsedUserData = JSON.parse(userData);
      
      // Verify if the user still exists in the database
      const response = await axios.post(`${API_URL}/check-user-exists`, { 
        email: parsedUserData.email,
        userType: userType
      });
      
      if (response.data.exists) {
        // User exists, so return the stored authentication data
        return {
          success: true,
          userType: userType
        };
      } else {
        // User no longer exists in the database, clear localStorage
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        
        return {
          success: false,
          message: 'User no longer exists'
        };
      }
    } catch (error) {
      // On error, clear localStorage to be safe
      console.error('Authentication check error:', error);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userType');
      localStorage.removeItem('userData');
      
      return {
        success: false,
        message: 'Authentication check failed'
      };
    }
  }
  
  // Not authenticated
  return {
    success: false,
    message: 'Not authenticated'
  };
};

// Add agri input
const addAgriInput = async (inputData) => {
  const formData = new FormData();
  
  // Extract image file from the saved file input
  const imageFile = document.getElementById('image').files[0];
  
  // Add all other form fields to FormData
  Object.keys(inputData).forEach(key => {
    if (key !== 'image') { // Skip the image object, we'll add the file directly
      formData.append(key, inputData[key]);
    }
  });
  
  // Append the image file with the field name matching the multer middleware
  if (imageFile) {
    formData.append('inputImage', imageFile);
  }
  
  // Use different headers for FormData
  const response = await axios.post(`${API_URL_AGRI_INPUT}/add-agri-input`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Add product
const addProduct = async (productData) => {
  // Create FormData object to handle file uploads
  const formData = new FormData();
  
  // Extract image file from the saved file input
  const imageFile = document.getElementById('product-image').files[0];
  
  // Add all other form fields to FormData
  Object.keys(productData).forEach(key => {
    if (key !== 'image') { // Skip the image object, we'll add the file directly
      formData.append(key, productData[key]);
    }
  });
  
  // Append the image file with the field name matching the multer middleware
  if (imageFile) {
    formData.append('productImage', imageFile);
  }
  
  // Use different headers for FormData
  const response = await axios.post(`${API_URL_PRODUCT}/add-product`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

// Get products by farmer email
const getProductsByFarmerEmail = async (farmerEmail) => {
  const response = await axios.get(`${API_URL_PRODUCT}/farmer/${farmerEmail}`);
  return response.data;
};

// Get farmers with products
const getFarmersWithProducts = async () => {
  const response = await axios.get(`${API_URL_PRODUCT}/farmers-with-products`);
  return response.data;
};

// Get agri-inputs by supplier email
const getAgriInputsBySupplierEmail = async (supplierEmail) => {
  const response = await axios.get(`${API_URL_AGRI_INPUT}/supplier/${supplierEmail}`);
  return response.data;
};

// Get suppliers with agri-inputs
const getSuppliersWithAgriInputs = async () => {
  const response = await axios.get(`${API_URL_AGRI_INPUT}/suppliers-with-inputs`);
  return response.data;
};

// Delete product by ID
const deleteProduct = async (productId, farmerEmail) => {
  const response = await axios.delete(`${API_URL_PRODUCT}/delete/${productId}`, {
    data: { farmerEmail } // Send farmerEmail in the request body
  });
  return response.data;
};

// Delete agri-input by ID
const deleteAgriInput = async (inputId, supplierEmail) => {
  const response = await axios.delete(`${API_URL_AGRI_INPUT}/delete/${inputId}`, {
    data: { supplierEmail } // Send supplierEmail in the request body
  });
  return response.data;
};

// Update product quantity
const updateProductQuantity = async (productId, quantity, operation, farmerEmail) => {
  const response = await axios.put(`${API_URL_PRODUCT}/update-quantity/${productId}`, {
    quantity,
    operation, // 'decrease' when adding to cart, 'increase' when removing from cart
    farmerEmail // Include farmerEmail for verification
  });
  return response.data;
};

// Update agri-input quantity
const updateAgriInputQuantity = async (inputId, quantity, operation, supplierEmail) => {
  const response = await axios.put(`${API_URL_AGRI_INPUT}/update-quantity/${inputId}`, {
    quantity,
    operation, // 'decrease' when adding to cart, 'increase' when removing from cart
    supplierEmail // Include supplierEmail for verification
  });
  return response.data;
};

// Create a new order
const createOrder = async (orderData) => {
  try {
    const response = await axios.post(`${API_URL_ORDER}/create`, orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Create a new transaction
const createTransaction = async (transactionData) => {
  try {
    const response = await axios.post(`${API_URL_ORDER}/transactions`, transactionData);
    return response.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Get transaction history by email
const getTransactionsByEmail = async (email) => {
  try {
    const response = await axios.get(`${API_URL_ORDER}/transactions/${email}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Get transaction by id
const getTransactionById = async (transactionId) => {
  try {
    const response = await axios.get(`${API_URL_ORDER}/transaction/${transactionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
};

// Get orders by buyer email
const getOrdersByBuyerEmail = async (buyerEmail) => {
  try {
    const response = await axios.get(`${API_URL_ORDER}/buyer/${buyerEmail}`);
    return response.data;
  } catch (error) {
    console.error('Error getting buyer orders:', error);
    throw error;
  }
};

// Get orders by seller email
const getOrdersBySellerEmail = async (sellerEmail) => {
  try {
    const response = await axios.get(`${API_URL_ORDER}/seller/${sellerEmail}`);
    return response.data;
  } catch (error) {
    console.error('Error getting seller orders:', error);
    throw error;
  }
};

// Update order status
const updateOrderStatus = async (orderId, status, statusTime = null) => {
  try {
    // Include status timestamp if provided
    const payload = { 
      status,
      statusTime
    };
    
    const response = await axios.put(`${API_URL_ORDER}/status/${orderId}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Delete an order
const deleteOrder = async (orderId) => {
  try {
    console.log(`API call: Deleting order with ID ${orderId}`);
    const response = await axios.delete(`${API_URL_ORDER}/delete/${orderId}`);
    console.log('Delete order API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

// Delete a transaction
const deleteTransaction = async (transactionId) => {
  try {
    console.log(`API call: Deleting transaction with ID ${transactionId}`);
    const response = await axios.delete(`${API_URL_ORDER}/transactions/delete/${transactionId}`);
    console.log('Delete transaction API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// Get user profile
const getUserProfile = async (email) => {
  try {
    const response = await axios.get(`${API_URL}/profile/${email}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to fetch profile' };
  }
};

// Update user profile
const updateUserProfile = async (profileData) => {
  try {
    // Log form data for debugging
    if (profileData instanceof FormData) {
      console.log('Form data being sent to server:');
      for (let pair of profileData.entries()) {
        // Don't log the actual file content, just its presence
        if (pair[0] === 'profilePic' && pair[1] instanceof File) {
          console.log(pair[0], 'File:', pair[1].name, 'Size:', pair[1].size, 'Type:', pair[1].type);
        } else {
          console.log(pair[0], pair[1]);
        }
      }
    }
    
    // Extract email from form data to include in URL
    let email = '';
    if (profileData instanceof FormData) {
      email = profileData.get('email') || profileData.get('email_backup') || '';
      console.log('Email extracted for URL param:', email);
    }
    
    // Ensure email is included in the request URL as fallback
    const updateUrl = email 
      ? `${API_URL}/profile/update?email=${encodeURIComponent(email)}`
      : `${API_URL}/profile/update`;
    
    console.log('Sending profile update to:', updateUrl);
    
    const response = await axios.put(updateUrl, profileData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        // Log upload progress for debugging
        console.log(`Upload progress: ${Math.round((progressEvent.loaded * 100) / progressEvent.total)}%`);
      }
    });
    
    console.log('Profile update response from server:', response.data);
    
    // Update localStorage with new profile data if successful
    if (response.data.success && response.data.data) {
      try {
        // Get current userData from localStorage
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        // Update with new data
        const updatedUserData = {
          ...userData,
          ...response.data.data
        };
        
        // Save back to localStorage
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        console.log('Updated localStorage with new profile data');
      } catch (storageError) {
        console.warn('Error updating localStorage:', storageError);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    console.error('Error details:', error.response?.data || 'No response data');
    
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to update profile. Please try again later.' 
    };
  }
};

// Admin functions

// Get dashboard statistics
const getDashboardStats = async (timeframe = '6months') => {
  try {
    console.log(`Fetching dashboard stats for timeframe: ${timeframe}`);
    const response = await axios.get(`${API_URL_ADMIN}/dashboard/stats`, {
      params: { timeframe }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to fetch dashboard statistics' };
  }
};

// Get users by type (buyer, farmer, supplier)
const getUsersByType = async (userType) => {
  try {
    const response = await axios.get(`${API_URL_ADMIN}/users/${userType}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${userType} users:`, error);
    return { success: false, message: error.response?.data?.message || `Failed to fetch ${userType} users` };
  }
};

// Approve or reject user document
const approveDocument = async (userId, documentApproval) => {
  try {
    const response = await axios.put(`${API_URL_ADMIN}/user/${userId}/approve-document`, { documentApproval });
    return response.data;
  } catch (error) {
    console.error('Error updating document approval status:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to update document approval status' };
  }
};

// Delete user and all related data
const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL_ADMIN}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to delete user' };
  }
};

const authService = {
  registerBuyer,
  registerFarmer,
  registerSupplier,
  login,
  logout,
  verifyEmail,
  checkAuthStatus,
  addAgriInput,
  addProduct,
  getProductsByFarmerEmail,
  getFarmersWithProducts,
  getAgriInputsBySupplierEmail,
  getSuppliersWithAgriInputs,
  deleteProduct,
  deleteAgriInput,
  updateProductQuantity,
  updateAgriInputQuantity,
  createOrder,
  getOrdersByBuyerEmail,
  getOrdersBySellerEmail,
  updateOrderStatus,
  deleteOrder,
  createTransaction,
  getTransactionsByEmail,
  getTransactionById,
  deleteTransaction,
  getUserProfile,
  updateUserProfile,
  // Admin functions
  getDashboardStats,
  getUsersByType,
  approveDocument,
  deleteUser
};

export default authService;
  