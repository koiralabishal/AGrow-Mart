import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    //Common fields for all users
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    verifyToken: {type: String, default: ''},
    gender: {type: String, enum: ['male', 'female', 'other']},
    verifyTokenExpiresAt: {type: Number, default: 0},
    isVerified: {type: Boolean, default: false},
    resetOtp: {type: String, default: ''},
    resetOtpExpiresAt: {type: Number, default: 0},

    userType: {type: String, enum: ['buyer', 'farmer', 'supplier', 'admin'], required: true},
    profilePic: {
        type: String,
        default: ""
    },
    // Farmer specific fields
    farmName: {
        type: String, 
        required: function() { return this.userType === 'farmer'; }
    },
    farmLocation: {
        type: String, 
        required: function() { return this.userType === 'farmer'; }
    },
    
    // Supplier specific fields
    businessName: {
        type: String, 
        required: function() { return this.userType === 'supplier'; }
    },
    businessAddress: {
        type: String, 
        required: function() { return this.userType === 'supplier'; }
    },
    
    // Common fields for both farmer and supplier
    phoneNumber: {
        type: String, 
        required: function() { return this.userType === 'farmer' || this.userType === 'supplier'; }
    },
    
    // Document references - file paths to uploaded documents
    licenseDocument: {
        type: String, 
        required: function() { return this.userType === 'farmer'; }
    },
    businessCertificate: {
        type: String, 
        required: function() { return this.userType === 'supplier'; }
    },

    // Document approval status
    documentApproval: {
        type: Boolean,
        default: false
    }
   
   
}, { timestamps: true });

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;