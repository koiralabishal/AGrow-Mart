# AGrow-Mart 🌱

AGrow-Mart is a comprehensive agricultural e-commerce platform designed to bridge the gap between farmers, suppliers, and buyers. It empowers farmers to sell their produce directly to buyers while also providing them with easy access to essential agricultural inputs from suppliers.

![AGrow-Mart Banner](https://placehold.co/1200x400?text=AGrow-Mart+Platform)

## 🚀 Features

### 👥 User Roles
*   **Farmers**: List and sell produce, buy agricultural inputs, manage inventory.
*   **Buyers**: Browse and purchase fresh agricultural products directly from farmers.
*   **Suppliers**: List and sell agricultural inputs (seeds, fertilizers, tools) to farmers.
*   **Admin**: Oversee users, approve documents, and manage platform settings.

### 🔑 Key Functionalities
*   **Secure Authentication**: User registration, login, and email verification.
*   **Role-Based Dashboards**: Custom interfaces for each user type.
*   **Product Management**: Easy listing, editing, and inventory tracking.
*   **Secure Payments**: Integration with **eSewa** for seamless transactions.
*   **Document Verification**: Admin approval system for Farmer and Supplier licenses.
*   **Responsive Design**: Built with React and Tailwind CSS for a modern, mobile-friendly experience.

## 🛠️ Tech Stack

*   **Frontend**: React.js, Vite, Tailwind CSS
*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB
*   **Authentication**: JWT (JSON Web Tokens)
*   **Image Storage**: Cloudinary
*   **Payment Gateway**: eSewa

## 📦 Installation & Setup

### Prerequisites
*   Node.js installed
*   MongoDB Atlas account (or local MongoDB)
*   Cloudinary account

### 1. Clone the Repository
```bash
git clone https://github.com/koiralabishal/AGrow-Mart.git
cd AGrow-Mart
```

### 2. Install Dependencies
Install dependencies for both frontend and backend from the root directory:
```bash
# Install root dependencies (concurrently)
npm install

# Install Frontend dependencies
cd frontend
npm install

# Install Backend dependencies
cd ../backend
npm install
cd ..
```

### 3. Environment Variables
Create `.env` files in both `frontend` and `backend` directories.

**Backend (`backend/.env`):**
```env
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend (`frontend/.env`):**
```env
VITE_BACKEND_URL=http://localhost:5000
```

### 4. Run the Application
You can run both frontend and backend concurrently from the root directory:
```bash
npm run dev
```
*   **Frontend**: `http://localhost:5173`
*   **Backend**: `http://localhost:5000`

## ☁️ Deployment

This project is configured for deployment on **Vercel**.
For detailed deployment instructions, please read [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🛡️ Admin Access
To set up an admin user for local development:

 Default Credentials:
   *   Email: `admin@agromart.com`
   *   Password: `Admin@123`

## 🤝 Contributing
1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License
This project is licensed under the ISC License.