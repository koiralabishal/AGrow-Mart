import { useState } from "react";
import { FaLeaf, FaEye, FaEyeSlash } from 'react-icons/fa';
import authService from '../../api';
import { useNavigate } from "react-router-dom";
// import userModel from "./../../../backend/models/userModel";

// import Dashboard from "../Dashboard";
// import BuyerDashboard from "./BuyerDashboard";




function Login() {
  const styles = {
    container: {
      maxWidth: '400px',
      // margin: '3rem auto',
      padding: '1rem',
      // background: 'linear-gradient(135deg, #F1F8E9, #ffffff)',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
      textAlign: 'center'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.8rem',
      color: '#2e7d32',
      marginBottom: '1rem'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },
    inputContainer: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      width: '100%'
    },
    input: {
      padding: '0.75rem 1rem',
      borderRadius: '6px',
      border: '1px solid #A5D6A7',
      fontSize: '1rem',
      color: '#334155',
      outline: 'none'
    },
    passwordToggle: {
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#334155',
      padding: '0'
    },
    button: {
      background: 'linear-gradient(135deg, #66BB6A, #388E3C)',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      padding: '0.75rem',
      fontSize: '1rem',
      fontWeight: '600',
     
      outline: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      transition: 'transform 0.2s'
    },
    buttonHover: {
      transform: 'scale(1.02)'
    },
    message: {
      margin: '0.5rem 0',
      padding: '0.5rem',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#2e7d32',
      textAlign: 'center'
    },
    error: { background: 'rgba(229, 62, 62, 0.1)', color: '#e53e3e' },
    success: { background: 'rgba(56, 161, 105, 0.1)', color: '#38a169' },
    forgot: {
      textAlign: 'right',
      fontSize: '0.9rem',
      marginTop: '-0.5rem'
    },
    forgotLink: { color: '#388E3C', textDecoration: 'none' }
  };
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const loginuserData = { email, password };

      
      const response = await authService.login(loginuserData); // Call the login API
      if (response.success === true) {
        setError("");
        setSuccess(response.message);
      
        
        
        // Redirect based on user type
        switch(response.userType) {
          case "buyer":
            navigate("/buyer-dashboard");
            break;
          case "farmer":
            navigate("/farmer-dashboard");
            break;
          case "supplier":
            navigate("/supplier-dashboard");
            break;
          case "admin":
            navigate("/admin-dashboard");
            break;
          default:
            navigate("/"); // Default fallback
        }
        
        return;
      } else {
        setError(response.message);
        setSuccess("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

   
    

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <FaLeaf style={{ marginRight: '0.5rem' }} /> Welcome Back
      </div>
      {error && <div style={{ ...styles.message, ...styles.error }}>{error}</div>}
      {success && <div style={{ ...styles.message, ...styles.success }}>{success}</div>}
      <form style={styles.form} onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <div style={styles.inputContainer}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button
            type="button"
            style={styles.passwordToggle}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        <div style={styles.forgot}>
          <a href="#" style={styles.forgotLink}>Forgot password?</a>
        </div>
        <button
          type="submit"
          style={styles.button}
          onMouseOver={e => Object.assign(e.currentTarget.style, styles.buttonHover)}
          onMouseOut={e => Object.assign(e.currentTarget.style, { transform: 'none' })}
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In to AgroMart'}
        </button>
      </form>
    </div>
  );
}

export default Login;
