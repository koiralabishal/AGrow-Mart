import Product from "../models/productModel.js";
import User from "../models/userModel.js";


// Add product
export const addProduct = async (req, res) => {
  try {
    const { name, price, category, quantity, unit, description, farmerEmail } = req.body;

    // Validation 
    if (!name || !price || !category || !quantity || !unit || !description) {
      return res.json({ success: false, message: "Please fill in all required fields" });
    }

    if (price <= 0 || quantity <= 0) {
      return res.json({ success: false, message: "Price and quantity must be greater than 0" });
    }

    if (description && description.length > 100) {
      return res.json({ success: false, message: "Description must be less than 100 characters" });
    }

    // Check if file was uploaded via multer
    if (!req.file) {
      return res.json({ success: false, message: "Product image is required" });
    }
    
    // Create image object with file details from multer
    const image = {
      name: req.file.filename,
      path: req.file.path,
      type: req.file.mimetype,
      size: req.file.size
    };
    
    if (image.size > 1024 * 1024 * 2) {
      return res.json({ success: false, message: "Product image must be less than 2MB" });
    }
    
    // Create new product
    const newProduct = new Product({
      name,
      price,
      category,
      quantity,
      unit,
      description,
      image,
      farmerEmail
    });

    const savedProduct = await newProduct.save();
    
    res.json({ 
      success: true, 
      message: "Product added successfully",
      data: savedProduct
    });
    
  } catch (error) {
    console.error("Error adding product:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get products by farmer email
export const getProductsByFarmerEmail = async (req, res) => {
  const { farmerEmail } = req.params;

  try {
    // Find all products for this farmer
    const products = await Product.find({ farmerEmail });
    
    // If no products found
    if (products.length === 0) {
      return res.json({ 
        success: true, 
        message: "No products found for this farmer",
        data: []
      });
    }
    
    // Group products by category
    const fruits = products.filter(product => product.category === 'fruits');
    const vegetables = products.filter(product => product.category === 'vegetables');
    
    res.json({ 
      success: true, 
      message: "Products retrieved successfully",
      data: {
        fruits,
        vegetables
      }
    });
    
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get all farmers with products
export const getFarmersWithProducts = async (req, res) => {
  try {
    // Find all distinct farmer emails with their products
    const farmersWithProducts = await Product.aggregate([
      // Group by farmerEmail
      {
        $group: {
          _id: "$farmerEmail",
          count: { $sum: 1 },
          sampleProduct: { $first: "$$ROOT" }
        }
      },
      // Sort by product count (most products first)
      { $sort: { count: -1 } }
    ]);
    
    // Get farmer details from user collection
    const formattedFarmers = await Promise.all(
      farmersWithProducts.map(async (farmer, index) => {
        // Find the farmer in the user collection
        const farmerUser = await User.findOne({ 
          email: farmer._id, 
          userType: 'farmer' 
        });
        
        // Determine the profile picture URL
        let profilePicUrl = "https://randomuser.me/api/portraits/men/1.jpg"; // Default fallback
        
        if (farmerUser && farmerUser.profilePic) {
          // Check if profilePic is an object with path property
          if (typeof farmerUser.profilePic === 'object' && farmerUser.profilePic.path) {
            // If path starts with '/', prepend the server URL
            if (farmerUser.profilePic.path.startsWith('/')) {
              profilePicUrl = `http://localhost:5000${farmerUser.profilePic.path}`;
            } else if (farmerUser.profilePic.path.startsWith('http')) {
              // If it's already a full URL, use it directly
              profilePicUrl = farmerUser.profilePic.path;
            }
          } else if (typeof farmerUser.profilePic === 'string') {
            // If profilePic is a string (direct URL), use it
            profilePicUrl = farmerUser.profilePic;
          }
        } else if (farmer.sampleProduct.image && farmer.sampleProduct.image.name) {
          // Fallback to product image if no profile pic is available
          profilePicUrl = `http://localhost:5000/uploads/products/${farmer.sampleProduct.image.name}`;
        }
        
        return {
          id: index + 1,
          // Use actual farmer name from user collection if available
          name: farmerUser ? farmerUser.name : 'Farmer',
          // Use actual farm name from user collection if available
          address: farmerUser ? farmerUser.farmLocation : 'Farm Location',
          // Use actual farm name or company name from user collection
          company: farmerUser ? farmerUser.farmName : farmer._id,
          // For backward compatibility, store the email in company field
          email: farmer._id,
          profilePic: profilePicUrl,
          productCount: farmer.count
        };
      })
    );
    
    res.json({ 
      success: true, 
      message: "Farmers with products retrieved successfully",
      data: formattedFarmers
    });
    
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Delete product by ID
export const deleteProduct = async (req, res) => {
  const { productId } = req.params;
  const { farmerEmail } = req.body;

  try {
    // Check if product exists
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }
    
    // Verify that the product belongs to the farmer making the request
    if (product.farmerEmail !== farmerEmail) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not authorized to delete this product" 
      });
    }
    
    // Delete the product
    await Product.findByIdAndDelete(productId);
    
    res.json({ 
      success: true, 
      message: "Product deleted successfully" 
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product quantity
export const updateProductQuantity = async (req, res) => {
  const { productId } = req.params;
  const { quantity, operation, farmerEmail } = req.body;

  try {
    // Find the product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }
    
    // Verify the product belongs to the specified farmer if farmerEmail is provided
    if (farmerEmail && product.farmerEmail !== farmerEmail) {
      return res.status(403).json({
        success: false,
        message: "This product does not belong to the specified farmer"
      });
    }

    // Calculate new quantity based on operation
    let newQuantity;
    if (operation === 'decrease') {
      // When adding to cart, decrease available quantity
      newQuantity = product.quantity - quantity;
      
      // Check if we have enough quantity
      if (newQuantity < 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Not enough quantity available" 
        });
      }
    } else if (operation === 'increase') {
      // When removing from cart, increase available quantity
      newQuantity = product.quantity + quantity;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid operation. Use 'increase' or 'decrease'" 
      });
    }

    // Update the product quantity
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { quantity: newQuantity },
      { new: true }
    );
    
    res.json({ 
      success: true, 
      message: `Product quantity ${operation}d successfully`,
      data: updatedProduct
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};