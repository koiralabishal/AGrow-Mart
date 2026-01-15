import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
  },
  price: { 
    type: Number, 
    required: true,
  },
  category: { 
    type: String, 
    required: true,
    enum: ['fruits', 'vegetables'],
  },
  quantity: { 
    type: Number, 
    required: true,
  },
  unit: { 
    type: String, 
    required: true,
    enum: ['KG', 'Dozen', 'Piece']
  },
  description: { 
    type: String, 
    trim: true
  },
  image: { 
    type: String, 
    required: true
  },
  farmerEmail: {
    type: String,
    required: true
  }
});

const Product = mongoose.models.product || mongoose.model('product', productSchema);

export default Product; 