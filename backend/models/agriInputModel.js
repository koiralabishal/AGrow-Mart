import mongoose from "mongoose";

const agriInputSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    // trim: true
  },
  price: { 
    type: Number, 
    required: true,
    // min: 0
  },
  category: { 
    type: String, 
    required: true,
    enum: ['seeds', 'fertilizers', 'tools'],
    // default: 'seeds'
  },
  quantity: { 
    type: Number, 
    required: true,
    // min: 1
  },
  unit: { 
    type: String, 
    required: true,
    enum: ['Packet', 'Bag', 'Piece', 'KG']
  },
  description: { 
    type: String, 
    trim: true
  },
  image: { 
    type: String, 
    required: true
  },
  supplierEmail: {
    type: String,
    required: true
  }
}
);

const AgriInput = mongoose.models.agri_input || mongoose.model('agri_input', agriInputSchema);

export default AgriInput; 