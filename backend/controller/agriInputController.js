import AgriInput from "../models/agriInputModel.js";
import User from "../models/userModel.js";

// Add agri input
export const addAgriInput = async (req, res) => {
  try {
    const { name, price, category, quantity, unit, description, supplierEmail } = req.body;

    // Validation 
    if (!name || !price || !category || !quantity || !unit || !description ) {
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
      return res.json({ success: false, message: "Agricultural Input Image is required" });
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
    
    // Create new agri-input
    const newAgriInput = new AgriInput({
      name,
      price,
      category,
      quantity,
      unit,
      description,
      image,
      supplierEmail
    });

    const savedAgriInput = await newAgriInput.save();
    
    res.json({ 
      success: true, 
      message: "Agri-input added successfully",
      data: savedAgriInput
    });
    
  } catch (error) {
    console.error("Error adding agri-input:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get agri-inputs by supplier email
export const getAgriInputsBySupplierEmail = async (req, res) => {
  const { supplierEmail } = req.params;

  try {
    // Find all agri-inputs for this supplier
    const agriInputs = await AgriInput.find({ supplierEmail });
    
    // If no agri-inputs found
    if (agriInputs.length === 0) {
      return res.json({ 
        success: true, 
        message: "No agri-inputs found for this supplier",
        data: []
      });
    }
    
    // Group agri-inputs by category
    const seeds = agriInputs.filter(input => input.category === 'seeds');
    const fertilizers = agriInputs.filter(input => input.category === 'fertilizers');
    const tools = agriInputs.filter(input => input.category === 'tools');
    
    res.json({ 
      success: true, 
      message: "Agri-inputs retrieved successfully",
      data: {
        seeds,
        fertilizers,
        tools
      }
    });
    
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get all suppliers with agri-inputs
export const getSuppliersWithAgriInputs = async (req, res) => {
  try {
    // Find all distinct supplier emails with their agri-inputs
    const suppliersWithInputs = await AgriInput.aggregate([
      // Group by supplierEmail
      {
        $group: {
          _id: "$supplierEmail",
          count: { $sum: 1 },
          sampleInput: { $first: "$$ROOT" }
        }
      },
      // Sort by input count (most inputs first)
      { $sort: { count: -1 } }
    ]);
    
    // Get supplier details from user collection
    const formattedSuppliers = await Promise.all(
      suppliersWithInputs.map(async (supplier, index) => {
        // Find the supplier in the user collection
        const supplierUser = await User.findOne({ 
          email: supplier._id, 
          userType: 'supplier' 
        });
        
        // Determine the profile picture URL
        let profilePicUrl = "https://randomuser.me/api/portraits/men/1.jpg"; // Default fallback
        
        if (supplierUser && supplierUser.profilePic) {
          // Check if profilePic is an object with path property
          if (typeof supplierUser.profilePic === 'object' && supplierUser.profilePic.path) {
            // If path starts with '/', prepend the server URL
            if (supplierUser.profilePic.path.startsWith('/')) {
              profilePicUrl = `http://localhost:5000${supplierUser.profilePic.path}`;
            } else if (supplierUser.profilePic.path.startsWith('http')) {
              // If it's already a full URL, use it directly
              profilePicUrl = supplierUser.profilePic.path;
            }
          } else if (typeof supplierUser.profilePic === 'string') {
            // If profilePic is a string (direct URL), use it
            profilePicUrl = supplierUser.profilePic;
          }
        } else if (supplier.sampleInput.image && supplier.sampleInput.image.name) {
          // Fallback to input image if no profile pic is available
          profilePicUrl = `http://localhost:5000/uploads/products/${supplier.sampleInput.image.name}`;
        }
        
        return {
          id: index + 1,
          // Use actual supplier name from user collection if available
          name: supplierUser ? supplierUser.name : 'Supplier',
          // Use actual business address from user collection if available
          address: supplierUser ? supplierUser.businessAddress : 'Nepal',
          // Use actual business name from user collection if available
          company: supplierUser ? supplierUser.businessName : supplier._id,
          // For backward compatibility, store the email
          email: supplier._id,
          profilePic: profilePicUrl,
          inputCount: supplier.count
        };
      })
    );
    
    res.json({ 
      success: true, 
      message: "Suppliers with agri-inputs retrieved successfully",
      data: formattedSuppliers
    });
    
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Delete agri-input by ID
export const deleteAgriInput = async (req, res) => {
  const { inputId } = req.params;
  const { supplierEmail } = req.body;

  try {
    // Check if agri-input exists
    const agriInput = await AgriInput.findById(inputId);
    
    if (!agriInput) {
      return res.status(404).json({ 
        success: false, 
        message: "Agri-input not found" 
      });
    }
    
    // Verify that the agri-input belongs to the supplier making the request
    if (agriInput.supplierEmail !== supplierEmail) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not authorized to delete this agri-input" 
      });
    }
    
    // Delete the agri-input
    await AgriInput.findByIdAndDelete(inputId);
    
    res.json({ 
      success: true, 
      message: "Agri-input deleted successfully" 
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update agri-input quantity
export const updateAgriInputQuantity = async (req, res) => {
  const { inputId } = req.params;
  const { quantity, operation, supplierEmail } = req.body;

  try {
    // Find the agri-input
    const agriInput = await AgriInput.findById(inputId);
    
    if (!agriInput) {
      return res.status(404).json({ 
        success: false, 
        message: "Agri-input not found" 
      });
    }
    
    // Verify the agri-input belongs to the specified supplier if supplierEmail is provided
    if (supplierEmail && agriInput.supplierEmail !== supplierEmail) {
      return res.status(403).json({
        success: false,
        message: "This agri-input does not belong to the specified supplier"
      });
    }

    // Calculate new quantity based on operation
    let newQuantity;
    if (operation === 'decrease') {
      // When adding to cart, decrease available quantity
      newQuantity = agriInput.quantity - quantity;
      
      // Check if we have enough quantity
      if (newQuantity < 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Not enough quantity available" 
        });
      }
    } else if (operation === 'increase') {
      // When removing from cart, increase available quantity
      newQuantity = agriInput.quantity + quantity;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid operation. Use 'increase' or 'decrease'" 
      });
    }

    // Update the agri-input quantity
    const updatedAgriInput = await AgriInput.findByIdAndUpdate(
      inputId,
      { quantity: newQuantity },
      { new: true }
    );
    
    res.json({ 
      success: true, 
      message: `Agri-input quantity ${operation}d successfully`,
      data: updatedAgriInput
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};