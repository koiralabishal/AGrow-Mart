import { useState, useEffect } from 'react'
import Navbar from '../common/Navbar'
import HeroSection from '../common/HeroSection'
import ExperienceSection from '../common/ExperienceSection'
import AgriInputsSection from './AgriInputsSection'
import SupplierFooter from './SupplierFooter'
import '../../styles/farmer/FarmerDashboard.css' // Reusing the same CSS
import AgriInputsForm from './AgriInputsForm'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ReceivedOrders from '../common/ReceivedOrders'

function SupplierDashboard() {
  const [showAgriInputsForm, setShowAgriInputsForm] = useState(false)
  const [documentApproved, setDocumentApproved] = useState(false)
  const [showReceivedOrders, setShowReceivedOrders] = useState(false)

  // Check document approval status
  useEffect(() => {
    const checkDocumentApproval = () => {
      try {
        // Get user data from localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          if (user && user.documentApproval !== false) {
            setDocumentApproved(user.documentApproval);
          }
        }
      } catch (error) {
        console.error('Error checking document approval:', error);
      }
    };
    
    checkDocumentApproval();
  }, []);

  const toggleAgriInputsForm = () => {
    if (!documentApproved) {
      toast.warning('Your document is awaiting approval from admin. You cannot add agri-inputs until your document is approved.', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        icon: "🔒"
      });
      return;
    }
    setShowAgriInputsForm(!showAgriInputsForm)
  }
  
  const handleViewReceivedOrders = () => {
    setShowReceivedOrders(true);
  }
  
  const closeReceivedOrders = () => {
    setShowReceivedOrders(false);
  }

  return (
    <div className="farmer-dashboard">
      <Navbar 
        onAddAgriInputsClick={toggleAgriInputsForm} 
        toggleCart={null}
        onViewOrders={null} // Set to null since we don't need Order History for suppliers
        onViewReceivedOrders={handleViewReceivedOrders}
        userType="supplier"
        showAgriInputs={true}
      />
      
      <main className="dashboard-content">
        <HeroSection />
        <ExperienceSection />
        <AgriInputsSection dashboardType="supplier" />
      </main>
      
      <SupplierFooter />
      
      {/* Render AgriInputsForm as an overlay */}
      {showAgriInputsForm && <AgriInputsForm onClose={() => setShowAgriInputsForm(false)} />}
      
      {/* Received Orders Component */}
      {showReceivedOrders && (
        <ReceivedOrders
          onClose={closeReceivedOrders}
          userType="supplier"
        />
      )}
      
      {/* Toast Container for notifications */}
      <ToastContainer />
    </div>
  )
}

export default SupplierDashboard 
