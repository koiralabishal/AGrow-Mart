import { useState, useEffect } from 'react'
import Navbar from '../common/Navbar'
import HeroSection from '../common/HeroSection'
import ExperienceSection from '../common/ExperienceSection'
import FarmersSection from './FarmersSection'
import BuyerFooter from './BuyerFooter'
import CartSection from './CartSection'
import ProductDetailPopup from './ProductDetailPopup'
import OrderHistory from '../common/OrderHistory'
import TransactionHistory from '../common/TransactionHistory'
import '../../styles/farmer/FarmerDashboard.css' // Reusing the same CSS
import authService from '../../api'

function BuyerDashboard() {
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [orders, setOrders] = useState([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [isViewingFarmerProducts, setIsViewingFarmerProducts] = useState(false);

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
          console.log('Orders fetched from database:', response.data);
          setOrders(response.data);
          // Also save to localStorage for backup
          localStorage.setItem('agromart-orders', JSON.stringify(response.data));
        } else {
          // Fallback to localStorage if API call fails
          const savedOrders = localStorage.getItem('agromart-orders');
          if (savedOrders) {
            try {
              const parsedOrders = JSON.parse(savedOrders);
              // Make sure the orders array is valid
              if (Array.isArray(parsedOrders)) {
                setOrders(parsedOrders);
                console.log('Loaded orders from localStorage:', parsedOrders.length);
              } else {
                console.error('Saved orders is not an array');
                localStorage.setItem('agromart-orders', JSON.stringify([]));
                setOrders([]);
              }
            } catch (error) {
              console.error('Error parsing saved orders:', error);
              // Reset corrupted data
              localStorage.setItem('agromart-orders', JSON.stringify([]));
              setOrders([]);
            }
          } else {
            // Initialize empty orders array if none exists
            localStorage.setItem('agromart-orders', JSON.stringify([]));
            setOrders([]);
          }
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Fallback to localStorage if API call fails
        const savedOrders = localStorage.getItem('agromart-orders');
        if (savedOrders) {
          try {
            const parsedOrders = JSON.parse(savedOrders);
            if (Array.isArray(parsedOrders)) {
              setOrders(parsedOrders);
            } else {
              setOrders([]);
            }
          } catch (error) {
            console.error('Error parsing localStorage orders:', error);
            setOrders([]);
          }
        } else {
          setOrders([]);
        }
      }
    };
    
    fetchOrders();
  }, []);

  const handleBuyClick = (product) => {
    console.log("Selected product for buying:", product);
    // Verify the product has the farmer field from BuyerProductSection
    if (!product.farmer && product.farmerEmail) {
      // If it doesn't have farmer field but has farmerEmail, create the farmer field
      product.farmer = {
        email: product.farmerEmail
      };
    }
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  const handleAddToCart = async (product, quantity = 1) => {
    console.log("Adding to cart with farmer info:", product.farmer);
    
    // Validate that we have proper product data
    if (!product._id) {
      console.error("Product is missing _id field");
      return;
    }
    
    // Check if product already exists in cart
    const existingProductIndex = cart.findIndex(item => item._id === product._id);
    
    if (existingProductIndex >= 0) {
      // If product exists, update its quantity
      const updatedCart = [...cart];
      updatedCart[existingProductIndex].cartQuantity += quantity;
      setCart(updatedCart);
    } else {
      // If product doesn't exist, add it to cart with quantity
      setCart([...cart, { ...product, cartQuantity: quantity }]);
    }
    
    // Update product quantity in the database
    try {
      // Check for either farmer field (object) or farmerEmail field (string)
      const hasFarmerField = product.farmer && (typeof product.farmer === 'object' || typeof product.farmer === 'string');
      const hasFarmerEmail = product.farmerEmail && typeof product.farmerEmail === 'string';
      
      if (hasFarmerField || hasFarmerEmail) {
        // Extract farmer email from either source
        const farmerEmail = typeof product.farmer === 'object' ? product.farmer.email : 
                           (product.farmerEmail || (typeof product.farmer === 'string' ? product.farmer : null));
        
        console.log("Updating product quantity in database for farmer:", farmerEmail);
        
        if (farmerEmail) {
          await authService.updateProductQuantity(
            product._id, 
            quantity, 
            'decrease', 
            farmerEmail
          );
        } else {
          console.warn("Missing farmer email, quantity may not update correctly");
          await authService.updateProductQuantity(product._id, quantity, 'decrease');
        }
      } else {
        console.warn("Product lacks farmer information, skipping quantity update:", product);
      }
    } catch (error) {
      console.error('Failed to update product quantity:', error);
      // Consider showing an error message to the user
    }
  };

  const handleRemoveFromCart = async (productId) => {
    // Find the item in the cart to get its quantity
    const itemToRemove = cart.find(item => item._id === productId);
    
    if (!itemToRemove) {
      console.error("Item not found in cart:", productId);
      return;
    }
    
    console.log("Removing item with farmer info:", itemToRemove.farmer);
    
    // Remove the item from the cart
    setCart(cart.filter(item => item._id !== productId));
    
    // Update product quantity in the database
    try {
      // Check for either farmer field (object) or farmerEmail field (string)
      const hasFarmerField = itemToRemove.farmer && (typeof itemToRemove.farmer === 'object' || typeof itemToRemove.farmer === 'string');
      const hasFarmerEmail = itemToRemove.farmerEmail && typeof itemToRemove.farmerEmail === 'string';
      
      if (hasFarmerField || hasFarmerEmail) {
        // Extract farmer email from either source
        const farmerEmail = typeof itemToRemove.farmer === 'object' ? itemToRemove.farmer.email : 
                           (itemToRemove.farmerEmail || (typeof itemToRemove.farmer === 'string' ? itemToRemove.farmer : null));
        
        console.log("Restoring product quantity in database for farmer:", farmerEmail);
        
        if (farmerEmail) {
          await authService.updateProductQuantity(
            productId, 
            itemToRemove.cartQuantity, 
            'increase',
            farmerEmail
          );
        } else {
          console.warn("Missing farmer email, quantity may not update correctly");
          await authService.updateProductQuantity(
            productId, 
            itemToRemove.cartQuantity, 
            'increase'
          );
        }
      } else {
        console.warn("Product lacks farmer information, skipping quantity restoration:", itemToRemove);
      }
    } catch (error) {
      console.error('Failed to restore product quantity:', error);
      // Consider showing an error message to the user
    }
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
    const buyerEmail = user.email;
    
    // Validate that the order contains items
    if (!cart.length || cart.length === 0) {
      console.error('Attempted to place order with empty cart');
      alert('Cannot place order with empty cart');
      return;
    }
    
    try {
      // Group cart items by farmer email
      const itemsByFarmer = {};
      
      // First check if all items have farmer information
      for (const item of cart) {
        if (!item.farmerEmail && (!item.farmer || !item.farmer.email)) {
          console.error('Product missing farmer email:', item);
          alert('Some products are missing seller information. Please try again.');
          return;
        }
        
        // Get farmer email
        const farmerEmail = item.farmerEmail || (item.farmer && item.farmer.email);
        
        // Initialize array for this farmer if it doesn't exist
        if (!itemsByFarmer[farmerEmail]) {
          itemsByFarmer[farmerEmail] = [];
        }
        
        // Add item to this farmer's array
        itemsByFarmer[farmerEmail].push(item);
      }
      
      // Create an order for each farmer
      for (const farmerEmail in itemsByFarmer) {
        const farmerItems = itemsByFarmer[farmerEmail];
        const farmerSubtotal = farmerItems.reduce(
          (total, item) => total + (item.price * item.cartQuantity), 
          0
        );
        
        // Create order data for this farmer
        const orderData = {
          orderId: `ORDER-${Date.now()}-${farmerEmail.substring(0, 5)}`,
          date: new Date().toISOString(),
          items: farmerItems,
          totalAmount: farmerSubtotal + 50,  // Subtotal for just this farmer's items
          subtotal: farmerSubtotal,
          deliveryFee: 50,               // Keep delivery fee for each order
          deliveryAddress: orderDetails.deliveryAddress,
          phoneNumber: orderDetails.phoneNumber,
          paymentMethod: orderDetails.paymentMethod,
          buyerEmail: buyerEmail,
          sellerEmail: farmerEmail,
          orderType: 'product'
        };
        
        // Save to database
        console.log(`Saving order for farmer ${farmerEmail}:`, orderData);
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

  const toggleCart = () => {
    setShowCart(!showCart);
  };
  
  const toggleOrderHistory = () => {
    setShowOrderHistory(!showOrderHistory);
    // Close transaction history if it's open
    if (showTransactionHistory) setShowTransactionHistory(false);
  };

  const toggleTransactionHistory = () => {
    setShowTransactionHistory(!showTransactionHistory);
    // Close order history if it's open
    if (showOrderHistory) setShowOrderHistory(false);
  };

  const handleOrderDelete = (newOrdersCount) => {
    // Update the orders count without needing to read from localStorage again
    console.log('Orders count updated:', newOrdersCount);
    setOrders(prevOrders => {
      // Just in case the count is not accurate, double check with localStorage
      const savedOrders = localStorage.getItem('agromart-orders');
      if (savedOrders) {
        try {
          return JSON.parse(savedOrders);
        } catch (error) {
          console.error('Error parsing saved orders:', error);
          return prevOrders;
        }
      }
      return prevOrders;
    });
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    // Find the item in the cart
    const itemIndex = cart.findIndex(item => item._id === productId);
    
    if (itemIndex === -1) {
      console.error("Item not found in cart:", productId);
      return;
    }
    
    const item = cart[itemIndex];
    const oldQuantity = item.cartQuantity;
    
    // If new quantity is 0 or less, remove the item from cart
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
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
    
    // Update product quantity in the database
    try {
      // Determine the operation type
      const operation = quantityDifference > 0 ? 'decrease' : 'increase';
      // Use absolute value of the difference for the API call
      const diffAmount = Math.abs(quantityDifference);
      
      // Extract farmer email
      const farmerEmail = typeof item.farmer === 'object' ? item.farmer.email : 
                        (item.farmerEmail || (typeof item.farmer === 'string' ? item.farmer : null));
      
      if (farmerEmail) {
        await authService.updateProductQuantity(
          productId, 
          diffAmount, 
          operation,
          farmerEmail
        );
        console.log(`Updated product quantity in database: ${operation} by ${diffAmount}`);
      } else {
        console.warn("Missing farmer email, quantity may not update correctly");
        await authService.updateProductQuantity(productId, diffAmount, operation);
      }
    } catch (error) {
      console.error('Failed to update product quantity:', error);
      // Revert to old cart state if there was an error
      const revertedCart = [...cart];
      revertedCart[itemIndex] = { ...item, cartQuantity: oldQuantity };
      setCart(revertedCart);
      alert('Failed to update quantity. Please try again.');
    }
  };

  return (
    <div className="farmer-dashboard">
      {/* Pass cart functions to navbar */}
      <Navbar 
        toggleCart={toggleCart} 
        cartItemsCount={cart.length}
        onAddProductClick={null}
        onAddAgriInputsClick={null}
        onViewOrders={toggleOrderHistory}
        ordersCount={orders.length}
        onViewTransactions={toggleTransactionHistory}
        isViewingFarmerProducts={isViewingFarmerProducts}
      />
      
      <main className="dashboard-content">
        <HeroSection />
        <ExperienceSection />
        <FarmersSection 
          onBuyClick={handleBuyClick} 
          isViewingFarmerProducts={isViewingFarmerProducts}
          setIsViewingFarmerProducts={setIsViewingFarmerProducts}
        />
        
        {/* Cart Section as overlay */}
        {showCart && (
          <CartSection 
            isOpen={true}
            cartItems={cart} 
            onClose={() => setShowCart(false)} 
            onRemoveFromCart={handleRemoveFromCart}
            onPlaceOrder={handleOrderPlacement}
            onUpdateQuantity={handleUpdateQuantity}
            userType="buyer"
          />
        )}
        
        {/* Order History as overlay */}
        {showOrderHistory && (
          <OrderHistory 
            onClose={() => setShowOrderHistory(false)}
            onOrderDelete={handleOrderDelete}
          />
        )}
        
        {/* Transaction History as overlay */}
        {showTransactionHistory && (
          <TransactionHistory 
            onClose={() => setShowTransactionHistory(false)}
          />
        )}
        
        {/* Product Detail Popup */}
        {showProductDetail && selectedProduct && (
          <ProductDetailPopup 
            product={selectedProduct}
            onAddToCart={handleAddToCart}
            onClose={() => setShowProductDetail(false)}
          />
        )}
      </main>
      
      <BuyerFooter />
    </div>
  )
}

export default BuyerDashboard