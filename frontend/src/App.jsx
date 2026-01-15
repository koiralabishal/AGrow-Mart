import "./App.css";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
// import dotenv from "dotenv/config";
// import "../App";
import Swal from "sweetalert2";
import authService from "./api";
import Login from "./components/common/Login";
// import Register from "./components/common/Register";
// import Dashboard from "./components/Dashboard";
import logo from "./assets/Logo AgroMart.png";
import FarmerDashboard from "./components/farmer/FarmerDashboard";
import SupplierDashboard from "./components/supplier/SupplierDashboard";
import BuyerDashboard from "./components/buyer/BuyerDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import EsewaSuccess from "./components/buyer/EsewaSuccess";
import EsewaFailure from "./components/buyer/EsewaFailure";
// import Footer from "./components/Footer";
import { FaBars, FaTimes } from 'react-icons/fa';
import SignupModal from "./components/signup/SignupModal";
import ProtectedRoute from "./components/common/ProtectedRoute";
// import ProfileFormTest from "./components/ProfileFormTest";
// import TestProfileUpdate from "./components/TestProfileUpdate";
// import './styles/Footer.css';
// import ProductForm from "./components/ProductForm";
// import Navbar from "./components/navbar";






function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const email = queryParams.get("email");

  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

 

 

  useEffect(() => {
    const verifyEmail = async () => {
      // Check if token and email are present
      if (!token || !email) {
        return; // Skip if token or email is missing
      }

      try {
        // Call the verifyEmail API
        const verifyEmailData = { token, email };
        const response = await authService.verifyEmail(verifyEmailData);

        // Show SweetAlert2 popup based on the response
        if (response.success === true) {
          Swal.fire({
            icon: "success",
            title: "Email Verification Successful",
            text: response.message,
            confirmButtonText: "OK",
          }).then(() => {
            navigate("/"); // Redirect to home page

          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Email Verification Failed",
            text: response.message,
            confirmButtonText: "OK",
          }).then(() => {
            navigate("/"); // Redirect to home page

          });
        }
      } catch (error) {
        // Handle API errors
        Swal.fire({
          icon: "error",
          title: "Email Verification Failed",
          text: error.response?.data?.message || "Something went wrong.",
          confirmButtonText: "OK",
        }).then(() => {
            navigate("/"); // Redirect to home page

          });
      }
    };

    verifyEmail();
  }, [token, email, navigate]);

  const handleLoginClick = () => {
    setShowLogin(true);
    setShowSignup(false);
    setMenuOpen(false);
  };

  const handleSignupClick = () => {
    console.log('Opening signup modal'); // Debug log
    setShowSignup(true);
    setShowLogin(false);
    setMenuOpen(false);
  };

  const handleCloseForm = () => {
    console.log('Closing forms'); // Debug log
    setShowLogin(false);
    setShowSignup(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <Routes>
      {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      <Route 
        path="/farmer-dashboard" 
        element={
          <ProtectedRoute 
            element={<FarmerDashboard />} 
            requiredRole="farmer" 
          />
        } 
      />
      
      {/* Protected route for supplier dashboard */}
      <Route 
        path="/supplier-dashboard" 
        element={
          <ProtectedRoute 
            element={<SupplierDashboard />} 
            requiredRole="supplier" 
          />
        } 
      />
      
      {/* Protected route for buyer dashboard */}
      <Route 
        path="/buyer-dashboard" 
        element={
          <ProtectedRoute 
            element={<BuyerDashboard />} 
            requiredRole="buyer" 
          />
        } 
      />

      {/* Protected Admin Dashboard Route */}
      <Route 
        path="/admin-dashboard" 
        element={
          <ProtectedRoute
            element={<AdminDashboard />}
            requiredRole="admin"
          />
        }
      />

      {/* Test route for profile form */}
      {/* <Route path="/test-profile-form" element={<ProfileFormTest />} /> */}
      
      {/* Test route for profile update */}
      {/* <Route path="/test-profile-update" element={<TestProfileUpdate />} /> */}
      
      {/* eSewa Payment Success/Failure Routes */}
      <Route path="/esewa-success" element={<EsewaSuccess />} />
      <Route path="/esewa-failure" element={<EsewaFailure />} />
      
      {/* <Route path="/product-form" element={<ProductForm />} /> */}
      {/* <Route path="/navbar" element={<Navbar />} /> */}
      <Route
        path="/*"
        element={
          <div className="landing-container">
            {/* Navbar */}
            <nav className="landing-navbar">
              <img src={logo} alt="logo" />
              <div className="logo">AgroMart</div>
              <div className="buttons">
                <button onClick={handleLoginClick}>Sign In</button>
                <button onClick={handleSignupClick} className="green-btn">Sign Up</button>
                {menuOpen ? (
                  <FaTimes className="hamburger-icon" onClick={toggleMenu} />
                ) : (
                  <FaBars className="hamburger-icon" onClick={toggleMenu} />
                )}
              </div>
            </nav>
            
            {/* Mobile Menu */}
            <div className={`mobile-menu ${menuOpen ? 'active' : ''}`}>
              <button onClick={handleLoginClick}>Sign In</button>
              <button onClick={handleSignupClick}>Sign Up</button>
            </div>
            
            {/* Landing Page Content */}
            <div className="landing-content">
              <h1>
                <span className="welcome">Welcome to</span>{" "}
                <span className="agromart">AgroMart</span>
              </h1>
              <p>Connecting Farmers and Buyers for a Sustainable Future</p>

              <div className="features">
                <div className="feature-item">
                  <h3>Direct Farm to Market</h3>
                  <p>
                    Connect directly with buyers and get the best price for your
                    produce
                  </p>
                </div>
                <div className="feature-item">
                  <h3>Quality Assurance</h3>
                  <p>Verified sellers and quality-checked agricultural products</p>
                </div>
                <div className="feature-item">
                  <h3>Market Insights</h3>
                  <p>Real-time pricing and market trend information</p>
                </div>
                
              </div>
              
            </div>
           
            {/* Footer Section */}
            <footer className="landing-footer">
              <div className="footer-content">
                <div className="footer-left">
                  <img src={logo} alt="AgroMart Logo" className="footer-logo" />
                  <p className="footer-description">
                    <span className="highlight">Cultivating digital innovation</span> for Nepal&apos;s farming communities. 
                    AgroMart connects farmers to markets, empowering agricultural growth 
                    through technology. From seed to sale, we&apos;re growing a sustainable future together.
                  </p>
                </div>

                <div className="footer-right">
                  <h3>Harvest Our Contact Info</h3>
                  <ul className="contact-list">
                    <li className="location-item">
                      <span>Fields:</span> Pokhara, Kaski, Nepal
                    </li>
                    <li className="phone-item">
                      <span>Crop Line:</span> 9848260732
                    </li>
                    <li className="email-item">
                      <span>Seed Mail:</span> agromart@gmail.com
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="farm-divider"></div>

              <div className="footer-copyright">
                <p>&copy; {new Date().getFullYear()} AgroMart. Planting Seeds of Innovation.</p>
              </div>
            </footer>
            {/* Form Overlays */}
<div className={`form-overlay ${showLogin ? 'active' : ''}`}>

  {showLogin && (
    <div className="landing-form-container">
      <button className="close-button" onClick={handleCloseForm}>&times;</button>
      <Login isOpen={showLogin} onClose={handleCloseForm} />
    </div>
  )}
</div>

<div className={`form-overlay ${showSignup ? 'active' : ''}`}>
  {showSignup && (
    <div className="landing-form-container">
      <button className="close-button" onClick={handleCloseForm}>&times;</button>
      <SignupModal isOpen={showSignup} onClose={handleCloseForm} />
    </div>
  )}
</div>
           
           </div>
        }
      />
    </Routes>
    
  );
}

export default App;