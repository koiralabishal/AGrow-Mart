import { useState, useEffect } from 'react'
import authService from '../../api';
import SignupModal from './signup/SignupModal';

function Register() {
     const [name, setName] = useState("");
     const [email, setEmail] = useState("");
     const [password, setPassword] = useState("");
     const [userRole, setUserRole] = useState("buyer"); // Default role is buyer
     const [showPassword, setShowPassword] = useState(false);
     const [address, setAddress] = useState("");
     const [companyName, setCompanyName] = useState("");
     const [certificate, setCertificate] = useState(null);
     const [error, setError] = useState("");
     const [success, setSuccess] = useState("");
     const [isModalOpen, setIsModalOpen] = useState(true);
    
     const handleSubmit = async (e) => {
       e.preventDefault();
   
       try {
         // For now, keep using the existing API service
         const registeruserData = { 
           name, 
           email, 
           password, 
           userRole,
           ...(userRole === 'farmer' || userRole === 'supplier' ? { 
             address, 
             companyName,
             hasCertificate: !!certificate 
           } : {})
         };
         
         const response = await authService.register(registeruserData);
         if (response.success === true) {
           setError("");
           setSuccess(response.message);
           return;
         } else {
           setError(response.message);
         }
       } catch (err) {
         setError(err.response?.data?.message || "Registration failed");
         setSuccess("");
       }
     };
    
     const togglePasswordVisibility = () => {
       setShowPassword(!showPassword);
     };
     
     const handleFileChange = (e) => {
       if (e.target.files.length > 0) {
         setCertificate(e.target.files[0]);
       }
     };
   
     // Check if we should show the additional fields
    //  const showAdditionalFields = userRole === 'farmer' || userRole === 'supplier';
   
     // Close the modal and go back to the landing page
     const handleCloseModal = () => {
       // Find the close button in the form overlay and trigger a click on it
       const closeButton = document.querySelector('.landing-form-container .close-button');
       if (closeButton) {
         closeButton.click();
       }
     };
   
     return (
       <>
         <SignupModal isOpen={isModalOpen} onClose={handleCloseModal} />
       </>
     )
}

export default Register
