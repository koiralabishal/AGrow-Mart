import { useState, useEffect } from 'react'
import Navbar from '../common/Navbar'
import HeroSection from '../common/HeroSection'
import ExperienceSection from '../common/ExperienceSection'
// import CategorySection from './CategorySection'
import FarmerProductSection from './FarmerProductSection'
import SuppliersSection from '../supplier/SuppliersSection'
import '../../styles/farmer/FarmerDashboard.css'
import ProductForm from './ProductForm'
import FarmerFooter from './FarmerFooter'
import CartSection from '../buyer/CartSection'
import OrderHistory from '../common/OrderHistory'
import ReceivedOrders from '../common/ReceivedOrders'
import TransactionHistory from '../common/TransactionHistory'
import AgriInputsDetailPopup from '../supplier/AgriInputsDetailPopup'
import authService from '../../api'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function FarmerDashboard() {
  const [showProductForm, setShowProductForm] = useState(false)
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [orders, setOrders] = useState([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showReceivedOrders, setShowReceivedOrders] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [documentApproved, setDocumentApproved] = useState(false);
  
  // States for agri-input popup
  const [selectedAgriInput, setSelectedAgriInput] = useState(null);
  const [showAgriInputDetail, setShowAgriInputDetail] = useState(false);
  const [isViewingSupplierProducts, setIsViewingSupplierProducts] = useState(false);

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

  // Load orders from localStorage on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Get user data from localStorage
        const userData = localStorage.getItem('userData');
        if (!userData) {
          console.error('User data not found in localStorage');
          return;
        }
        
        const user = JSON.parse(userData);
        const userEmail = user.email;
        
        // Fetch orders from database
        const response = await authService.getOrdersByBuyerEmail(userEmail);
        
        if (response && response.success) {
          // Set orders from database
          console.log('Farmer orders fetched from database:', response.data);
          setOrders(response.data);
          // Also save to localStorage for backup
          localStorage.setItem('agromart-farmer-orders', JSON.stringify(response.data));
        } else {
          // Fallback to localStorage if API call fails
          const savedOrders = localStorage.getItem('agromart-farmer-orders');
          if (savedOrders) {
            try {
              const parsedOrders = JSON.parse(savedOrders);
              // Make sure the orders array is valid
              if (Array.isArray(parsedOrders)) {
                setOrders(parsedOrders);
                console.log('Loaded farmer orders from localStorage:', parsedOrders.length);
              } else {
                console.error('Saved farmer orders is not an array');
                localStorage.setItem('agromart-farmer-orders', JSON.stringify([]));
                setOrders([]);
              }
            } catch (e) {
              console.error('Error parsing saved farmer orders:', e);
              // Reset corrupted data
              localStorage.setItem('agromart-farmer-orders', JSON.stringify([]));
              setOrders([]);
            }
          } else {
            // Initialize empty orders array if none exists
            localStorage.setItem('agromart-farmer-orders', JSON.stringify([]));
            setOrders([]);
          }
        }
      } catch (e) {
        console.error('Error fetching farmer orders:', e);
        // Fallback to localStorage if API call fails
        const savedOrders = localStorage.getItem('agromart-farmer-orders');
        if (savedOrders) {
          try {
            const parsedOrders = JSON.parse(savedOrders);
            if (Array.isArray(parsedOrders)) {
              setOrders(parsedOrders);
            } else {
              setOrders([]);
            }
          } catch (e) {
            console.error('Error parsing localStorage farmer orders:', e);
            setOrders([]);
          }
        } else {
          setOrders([]);
        }
      }
    };
    
    fetchOrders();
  }, []);

  const toggleProductForm = () => {
    if (!documentApproved) {
      toast.warning('Your document is awaiting approval from admin. You cannot add products until your document is approved.', {
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
    setShowProductForm(!showProductForm);
  }

  // Handle agri-input buy click
  const handleAgriInputBuyClick = (agriInput) => {
    console.log("Selected agri-input for buying:", agriInput);
    // Verify the agri-input has supplier information
    if (!agriInput.supplier && agriInput.supplierEmail) {
      // If it doesn't have supplier field but has supplierEmail, create the supplier field
      agriInput.supplier = {
        email: agriInput.supplierEmail
      };
    }
    setSelectedAgriInput(agriInput);
    setShowAgriInputDetail(true);
  };

  // Common function to add items to cart
  const addToCart = async (item, quantity = 1) => {
    console.log("Adding to cart:", item);
    
    // Validate that we have proper item data
    if (!item._id) {
      console.error("Item is missing _id field");
      return;
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(cartItem => cartItem._id === item._id);
    
    if (existingItemIndex >= 0) {
      // If item exists, update its quantity
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].cartQuantity += quantity;
      setCart(updatedCart);
    } else {
      // If item doesn't exist, add it to cart with quantity
      setCart([...cart, { ...item, cartQuantity: quantity }]);
    }
    
    // Update item quantity in the database based on its type
    try {
      // For products, we need to update product quantity
      if (item.farmer) {
        const farmerEmail = typeof item.farmer === 'object' ? item.farmer.email : 
                           (item.farmerEmail || null);
        
        console.log("Updating product quantity in database for farmer:", farmerEmail);
        if (farmerEmail) {
          await authService.updateProductQuantity(
            item._id, 
            quantity, 
            'decrease', 
            farmerEmail
          );
        } else {
          console.warn("Missing farmer email, quantity may not update correctly");
          await authService.updateProductQuantity(item._id, quantity, 'decrease');
        }
      } 
      // For agri-inputs, we need to update agri-input quantity
      else if (item.supplierEmail || item.supplier) {
        // Check for supplier information in either supplierEmail field or supplier object
        const hasSupplierEmail = item.supplierEmail && typeof item.supplierEmail === 'string';
        const hasSupplierField = item.supplier && (typeof item.supplier === 'object' || typeof item.supplier === 'string');
        
        // Extract supplier email from either source
        const supplierEmail = hasSupplierEmail ? item.supplierEmail : 
                             (hasSupplierField && typeof item.supplier === 'object' ? item.supplier.email : 
                             (hasSupplierField && typeof item.supplier === 'string' ? item.supplier : null));
        
        if (supplierEmail) {
          console.log("Updating agri-input quantity in database for supplier:", supplierEmail);
          await authService.updateAgriInputQuantity(
            item._id, 
            quantity, 
            'decrease', 
            supplierEmail
          );
        } else {
          console.warn("Missing supplier email, quantity may not update correctly");
          await authService.updateAgriInputQuantity(item._id, quantity, 'decrease');
        }
      } else {
        console.warn("Item lacks proper identification, skipping quantity update:", item);
      }
    } catch (error) {
      console.error('Failed to update item quantity:', error);
      // Consider showing an error message to the user
    }
  };
  
  // Handle adding agri-input to cart
  const handleAddAgriInputToCart = async (agriInput, quantity = 1) => {
    console.log("Adding agri-input to cart with supplier:", agriInput.supplier || agriInput.supplierEmail);
    await addToCart(agriInput, quantity);
  };

  const handleRemoveFromCart = async (itemId) => {
    // Find the item in the cart to get its quantity
    const itemToRemove = cart.find(item => item._id === itemId);
    
    if (!itemToRemove) {
      console.error("Item not found in cart:", itemId);
      return;
    }
    
    console.log("Removing item from cart:", itemToRemove);
    
    // Remove the item from the cart
    setCart(cart.filter(item => item._id !== itemId));
    
    // Update quantity in the database based on item type
    try {
      // For products
      if (itemToRemove.farmer) {
        const farmerEmail = typeof itemToRemove.farmer === 'object' ? itemToRemove.farmer.email : 
                           (itemToRemove.farmerEmail || null);
        
        console.log("Restoring product quantity in database for farmer:", farmerEmail);
        if (farmerEmail) {
          await authService.updateProductQuantity(
            itemId, 
            itemToRemove.cartQuantity, 
            'increase',
            farmerEmail
          );
        } else {
          console.warn("Missing farmer email, quantity may not update correctly");
          await authService.updateProductQuantity(
            itemId, 
            itemToRemove.cartQuantity, 
            'increase'
          );
        }
      } 
      // For agri-inputs 
      else if (itemToRemove.supplierEmail || itemToRemove.supplier) {
        // Check for supplier information in either supplierEmail field or supplier object
        const hasSupplierEmail = itemToRemove.supplierEmail && typeof itemToRemove.supplierEmail === 'string';
        const hasSupplierField = itemToRemove.supplier && (typeof itemToRemove.supplier === 'object' || typeof itemToRemove.supplier === 'string');
        
        // Extract supplier email from either source
        const supplierEmail = hasSupplierEmail ? itemToRemove.supplierEmail : 
                             (hasSupplierField && typeof itemToRemove.supplier === 'object' ? itemToRemove.supplier.email : 
                             (hasSupplierField && typeof itemToRemove.supplier === 'string' ? itemToRemove.supplier : null));
        
        if (supplierEmail) {
          console.log("Restoring agri-input quantity in database for supplier:", supplierEmail);
          await authService.updateAgriInputQuantity(
            itemId, 
            itemToRemove.cartQuantity, 
            'increase',
            supplierEmail
          );
        } else {
          console.warn("Missing supplier email, quantity may not update correctly");
          await authService.updateAgriInputQuantity(
            itemId, 
            itemToRemove.cartQuantity, 
            'increase'
          );
        }
      } else {
        console.warn("Item lacks proper identification, skipping quantity restoration:", itemToRemove);
      }
    } catch (error) {
      console.error('Failed to restore item quantity:', error);
      // Consider showing an error message to the user
    }
  };

  const toggleCart = () => {
    setShowCart(!showCart);
  };

  const toggleOrderHistory = () => {
    setShowOrderHistory(!showOrderHistory);
    // Close other panels if they're open
    if (showReceivedOrders) setShowReceivedOrders(false);
    if (showTransactionHistory) setShowTransactionHistory(false);
  };

  const toggleReceivedOrders = () => {
    setShowReceivedOrders(!showReceivedOrders);
    // Close other panels if they're open
    if (showOrderHistory) setShowOrderHistory(false);
    if (showTransactionHistory) setShowTransactionHistory(false);
  };

  const toggleTransactionHistory = () => {
    setShowTransactionHistory(!showTransactionHistory);
    // Close other panels if they're open
    if (showOrderHistory) setShowOrderHistory(false);
    if (showReceivedOrders) setShowReceivedOrders(false);
  };

  const handleOrderPlacement = async (orderDetails) => {
    // Log the order details to debug
    console.log('Order details received:', orderDetails);
    console.log('Total amount including delivery fee:', orderDetails.totalAmount);
    
    // Validate cart items have proper price and quantity
    let calculatedTotal = 0;
    for (const item of cart) {
      console.log(`Validating item ${item.name}: price=${item.price}, quantity=${item.cartQuantity}`);
      
      if (!item.price || item.price <= 0 || !item.cartQuantity || item.cartQuantity <= 0) {
        console.error('Invalid item in cart:', item);
        alert('One or more items in your cart have invalid price or quantity');
        return;
      }
      
      calculatedTotal += (item.price * item.cartQuantity);
    }
    
    console.log(`Calculated subtotal: ${calculatedTotal}, delivery fee: 50, total: ${calculatedTotal + 50}`);
    
    // Verify the total matches what we expect
    if (Math.abs((calculatedTotal + 50) - orderDetails.totalAmount) > 1) {
      console.error(`Total amount mismatch: calculated=${calculatedTotal + 50}, received=${orderDetails.totalAmount}`);
      // Use our calculated total instead
      orderDetails.totalAmount = calculatedTotal + 50;
      console.log('Corrected total amount to:', orderDetails.totalAmount);
    }
    
    // Validate the order total
    if (!orderDetails.totalAmount || orderDetails.totalAmount <= 50) {
      console.error('Invalid order total amount:', orderDetails.totalAmount);
      alert('Cannot place order with empty cart or zero item total');
      return;
    }
    
    // Get user data from localStorage
    const userData = localStorage.getItem('userData');
    if (!userData) {
      console.error('User data not found in localStorage');
      alert('Please log in again to complete your order');
      return;
    }
    
    const user = JSON.parse(userData);
    const farmerEmail = user.email;
    
    // Validate that the order contains items
    if (!cart.length || cart.length === 0) {
      console.error('Attempted to place order with empty cart');
      alert('Cannot place order with empty cart');
      return;
    }
    
    try {
      // Group cart items by supplier email
      const itemsBySupplier = {};
      
      // First check if all items have supplier information
      for (const item of cart) {
        if (!item.supplierEmail) {
          console.error('Agri-input missing supplier email:', item);
          alert('Some agri-inputs are missing supplier information. Please try again.');
          return;
        }
        
        // Get supplier email
        const supplierEmail = item.supplierEmail;
        
        // Initialize array for this supplier if it doesn't exist
        if (!itemsBySupplier[supplierEmail]) {
          itemsBySupplier[supplierEmail] = [];
        }
        
        // Add item to this supplier's array
        itemsBySupplier[supplierEmail].push(item);
      }
      
      // Create an order for each supplier
      for (const supplierEmail in itemsBySupplier) {
        const supplierItems = itemsBySupplier[supplierEmail];
        const supplierSubtotal = supplierItems.reduce(
          (total, item) => total + (item.price * item.cartQuantity), 
          0
        );
        
        // Create order data for this supplier
        const orderData = {
          orderId: `ORDER-${Date.now()}-${supplierEmail.substring(0, 5)}`,
          date: new Date().toISOString(),
          items: supplierItems,
          totalAmount: supplierSubtotal + 50,  // Subtotal for just this supplier's items
          subtotal: supplierSubtotal,
          deliveryFee: 50,               // Keep delivery fee for each order
          deliveryAddress: orderDetails.deliveryAddress,
          phoneNumber: orderDetails.phoneNumber,
          paymentMethod: orderDetails.paymentMethod,
          buyerEmail: farmerEmail,
          sellerEmail: supplierEmail,
          orderType: 'agriinput'
        };
        
        // Save to database
        console.log(`Saving order for supplier ${supplierEmail}:`, orderData);
        await authService.createOrder(orderData);
      }
      
      // Clear the cart after order is placed
      setCart([]);
      
      console.log('Orders placed successfully');
    } catch (error) {
      console.error('Failed to save order to database:', error);
      alert('There was an error placing your order. Please try again.');
    }
  };

  const handleOrderDelete = (newOrdersCount) => {
    // Update the orders count without needing to read from localStorage again
    console.log('Orders count updated:', newOrdersCount);
    setOrders(prevOrders => {
      // Just in case the count is not accurate, double check with localStorage
      const savedOrders = localStorage.getItem('agromart-farmer-orders');
      if (savedOrders) {
        try {
          return JSON.parse(savedOrders);
        } catch (error) {
          console.error('Error parsing saved farmer orders:', error);
          return prevOrders;
        }
      }
      return prevOrders;
    });
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    // Find the item in the cart
    const itemIndex = cart.findIndex(item => item._id === itemId);
    
    if (itemIndex === -1) {
      console.error("Item not found in cart:", itemId);
      return;
    }
    
    const item = cart[itemIndex];
    const oldQuantity = item.cartQuantity;
    
    // If new quantity is 0 or less, remove the item from cart
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    
    // Calculate the quantity difference
    const quantityDifference = newQuantity - oldQuantity;
    
    // Update cart state
    const updatedCart = [...cart];
    updatedCart[itemIndex] = { 
      ...item, 
      cartQuantity: newQuantity
    };
    setCart(updatedCart);
    
    // Update quantity in the database based on item type
    try {
      // Determine the operation type
      const operation = quantityDifference > 0 ? 'decrease' : 'increase';
      // Use absolute value of the difference for the API call
      const diffAmount = Math.abs(quantityDifference);
      
      // For products
      if (item.farmer) {
        const farmerEmail = typeof item.farmer === 'object' ? item.farmer.email : 
                           (item.farmerEmail || null);
        
        if (farmerEmail) {
          await authService.updateProductQuantity(
            itemId, 
            diffAmount, 
            operation,
            farmerEmail
          );
          console.log(`Updated product quantity in database: ${operation} by ${diffAmount}`);
        } else {
          console.warn("Missing farmer email, quantity may not update correctly");
          await authService.updateProductQuantity(itemId, diffAmount, operation);
        }
      }
      // For agri-inputs
      else if (item.supplierEmail || item.supplier) {
        // Extract supplier email
        const hasSupplierEmail = item.supplierEmail && typeof item.supplierEmail === 'string';
        const hasSupplierField = item.supplier && (typeof item.supplier === 'object' || typeof item.supplier === 'string');
        const supplierEmail = hasSupplierEmail ? item.supplierEmail : 
                             (hasSupplierField && typeof item.supplier === 'object' ? item.supplier.email : 
                             (hasSupplierField && typeof item.supplier === 'string' ? item.supplier : null));
        
        if (supplierEmail) {
          await authService.updateAgriInputQuantity(
            itemId, 
            diffAmount, 
            operation,
            supplierEmail
          );
          console.log(`Updated agri-input quantity in database: ${operation} by ${diffAmount}`);
        } else {
          console.warn("Missing supplier email, quantity may not update correctly");
          await authService.updateAgriInputQuantity(itemId, diffAmount, operation);
        }
      } else {
        console.warn("Item lacks proper identification, skipping quantity update:", item);
      }
    } catch (error) {
      console.error('Failed to update item quantity:', error);
      // Revert to old cart state if there was an error
      const revertedCart = [...cart];
      revertedCart[itemIndex] = { ...item, cartQuantity: oldQuantity };
      setCart(revertedCart);
      alert('Failed to update quantity. Please try again.');
    }
  };

  return (
    <div className="farmer-dashboard">
      <Navbar 
        toggleCart={toggleCart} 
        cartItemsCount={cart.length}
        onAddProductClick={toggleProductForm}
        onAddAgriInputsClick={null}
        onViewOrders={toggleOrderHistory}
        onViewReceivedOrders={toggleReceivedOrders}
        ordersCount={orders.length}
        onViewTransactions={toggleTransactionHistory}
        userType="farmer"
        isViewingSupplierProducts={isViewingSupplierProducts}
      />
      
      <main className="dashboard-content">
        <HeroSection />
        <ExperienceSection />
        
        {/* Farmer's Products Section */}
        <FarmerProductSection
          onAddProductClick={toggleProductForm}
          documentApproved={documentApproved}
        />
        
        {/* Suppliers Section */}
        <SuppliersSection 
          onBuyClick={handleAgriInputBuyClick} 
          isViewingSupplierProducts={isViewingSupplierProducts}
          setIsViewingSupplierProducts={setIsViewingSupplierProducts}
        />
        
        {/* Product Form Overlay */}
        {showProductForm && (
          <ProductForm onClose={() => setShowProductForm(false)} />
        )}
        
        {/* Cart Section as overlay */}
        {showCart && (
          <CartSection 
            isOpen={true}
            cartItems={cart} 
            onClose={() => setShowCart(false)} 
            onRemoveFromCart={handleRemoveFromCart}
            onPlaceOrder={handleOrderPlacement}
            onUpdateQuantity={handleUpdateQuantity}
            userType="farmer"
          />
        )}
        
        {/* Order History as overlay */}
        {showOrderHistory && (
          <OrderHistory 
            onClose={() => setShowOrderHistory(false)}
            onOrderDelete={handleOrderDelete}
            userType="farmer"
          />
        )}
        
        {/* Received Orders as overlay */}
        {showReceivedOrders && (
          <ReceivedOrders 
            onClose={() => setShowReceivedOrders(false)}
          />
        )}
        
        {/* Transaction History as overlay */}
        {showTransactionHistory && (
          <TransactionHistory 
            onClose={() => setShowTransactionHistory(false)}
          />
        )}
        
        {/* Agri-Input Detail Popup */}
        {showAgriInputDetail && selectedAgriInput && (
          <AgriInputsDetailPopup 
            product={selectedAgriInput}
            onAddToCart={handleAddAgriInputToCart}
            onClose={() => setShowAgriInputDetail(false)}
          />
        )}

        {/* Toast Container for notifications */}
        <ToastContainer />
      </main>
      
      <FarmerFooter />
    </div>
  )
}

export default FarmerDashboard
