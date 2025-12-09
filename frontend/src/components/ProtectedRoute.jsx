import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import authService from '../api';
import axios from 'axios';

// /**
//  * A wrapper for protected routes that checks authentication and user role
//  * @param {Object} props - Component props
//  * @param {React.Component} props.element - The component to render if authorized
//  * @param {string} props.requiredRole - The role required to access this route
//  * @returns {React.Component} Either the requested route or a redirect to login
//  */
const ProtectedRoute = ({ element, requiredRole }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const navigate = useNavigate();

  // Function to verify user existence directly
  const verifyUserExists = async () => {
    try {
      // Get user data from localStorage
      const userData = localStorage.getItem('userData');
      const userType = localStorage.getItem('userType');
      
      if (!userData || !userType) {
        setShouldRedirect(true);
        return false;
      }
      
      const parsedUserData = JSON.parse(userData);
      
      // Directly check if user exists
      const response = await axios.post('http://localhost:5000/api/auth/check-user-exists', {
        email: parsedUserData.email,
        userType: userType
      });
      
      if (!response.data.exists) {
        // User doesn't exist, clear localStorage and set redirect flag
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        setShouldRedirect(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying user existence:', error);
      setShouldRedirect(true);
      return false;
    }
  };

  useEffect(() => {
    // Start periodic checking for user existence
    const checkInterval = setInterval(async () => {
      const userExists = await verifyUserExists();
      if (!userExists) {
        navigate('/');
      }
    }, 1000); // Check every 1 seconds
    
    // Initial verification when component mounts
    verifyUserExists();
    
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // Verify user authentication
        const response = await authService.checkAuthStatus();
        if (response.success) {
          setIsAuthenticated(true);
          setUserRole(response.userType);
        } else {
          setIsAuthenticated(false);
          setUserRole(null);
          setShouldRedirect(true);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
        setUserRole(null);
        setShouldRedirect(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Clean up interval on unmount
    return () => clearInterval(checkInterval);
  }, [navigate]);

  // Effect to handle navigation when shouldRedirect changes
  useEffect(() => {
    if (shouldRedirect) {
      navigate('/');
    }
  }, [shouldRedirect, navigate]);

  if (isLoading) {
    // Return a loading indicator
    return <div style={{ display: 'none'}}>Loading...</div>;
  }

  // If user is not authenticated, redirect to home page
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // If a specific role is required and the user doesn't have it
  if (requiredRole && userRole !== requiredRole) {
    // Redirect based on actual role
    switch (userRole) {
      case 'buyer':
        return <Navigate to="/buyer-dashboard" />;
      case 'farmer':
        return <Navigate to="/farmer-dashboard" />;
      case 'supplier':
        return <Navigate to="/supplier-dashboard" />;
      case 'admin':
        return <Navigate to="/admin-dashboard" />;
      default:
        return <Navigate to="/" />;
    }
  }

  // User is authenticated and has the required role
  return element;
};

// Add prop validation to fix linter errors
ProtectedRoute.propTypes = {
  element: PropTypes.element.isRequired,
  requiredRole: PropTypes.string.isRequired
};

export default ProtectedRoute; 