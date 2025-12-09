import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authService from '../../api';
import '../../styles/admin/BuyerManagement.css';
import '../../styles/admin/FarmerManagement.css'; // Import for image viewer styles
import { FaTrash, FaSync, FaSearch, FaFilter, FaDownload, FaCheckCircle, FaTimesCircle, FaUser, FaEye } from 'react-icons/fa';
import PropTypes from 'prop-types';

const BuyerManagement = () => {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [viewImage, setViewImage] = useState(null);

  // Fetch buyers on component mount
  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    setLoading(true);
    try {
      const response = await authService.getUsersByType('buyer');
      if (response.success) {
        setBuyers(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch buyers');
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
      toast.error('Error fetching buyers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (confirmDelete === userId) {
      try {
        const response = await authService.deleteUser(userId);
        if (response.success) {
          toast.success('User deleted successfully');
          // Remove the deleted user from the state
          setBuyers(buyers.filter(buyer => buyer._id !== userId));
        } else {
          toast.error(response.message || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Error deleting user. Please try again later.');
      }
      setConfirmDelete(null);
    } else {
      setConfirmDelete(userId);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  // Image viewer component
  const ImageViewer = ({ image }) => {
    if (!image || !image.path) {
      console.log('No image or path found');
      return (
        <div className="document-viewer-overlay" onClick={() => setViewImage(null)}>
          <div className="document-viewer-content" onClick={e => e.stopPropagation()}>
            <div className="document-viewer-header">
              <h3>Profile Image</h3>
              <button className="close-button" onClick={() => setViewImage(null)}>×</button>
            </div>
            <div className="document-viewer-body">
              <p className="no-document">No profile image available</p>
            </div>
          </div>
        </div>
      );
    }
    
    // Fix image path to ensure it works properly
    // Handle case where image.path might be a full path or just a filename
    let fileName;
    if (image.path.includes('/')) {
      fileName = image.path.split('/').pop();
    } else if (image.path.includes('\\')) {
      fileName = image.path.split('\\').pop();
    } else {
      fileName = image.path;
    }
    
    // Check if path already contains the directory structure
    let imagePath;
    if (image.path.includes('profiles/') || image.path.includes('profiles\\')) {
      imagePath = `http://localhost:5000/uploads/${image.path.replace(/^.*profiles[/\\]/, 'profiles/')}`;
    } else {
      imagePath = `http://localhost:5000/uploads/profiles/${fileName}`;
    }
    
    console.log('Original image path:', image.path);
    console.log('Extracted filename:', fileName);
    console.log('Constructed image URL:', imagePath);
      
    return (
      <div className="document-viewer-overlay" onClick={() => setViewImage(null)}>
        <div className="document-viewer-content" onClick={e => e.stopPropagation()}>
          <div className="document-viewer-header">
            <h3>Profile Image</h3>
            <button className="close-button" onClick={() => setViewImage(null)}>×</button>
          </div>
          <div className="document-viewer-body">
            <img 
              src={imagePath} 
              alt="Buyer Profile" 
              onError={(e) => {
                console.error('Error loading image:', e);
                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Error';
                e.target.alt = 'Error loading image';
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // PropTypes for ImageViewer
  ImageViewer.propTypes = {
    image: PropTypes.shape({
      path: PropTypes.string
    })
  };

  // Filter buyers based on search term and filter status
  const filteredBuyers = buyers.filter(buyer => {
    const matchesSearch = 
      buyer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'verified' && buyer.isVerified) ||
      (filterStatus === 'unverified' && !buyer.isVerified);
    
    return matchesSearch && matchesFilter;
  });

  // Sort buyers based on sort configuration
  const sortedBuyers = [...filteredBuyers].sort((a, b) => {
    if (!a[sortConfig.key] || !b[sortConfig.key]) return 0;
    
    const aValue = a[sortConfig.key].toString().toLowerCase();
    const bValue = b[sortConfig.key].toString().toLowerCase();
    
    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Handle column sort
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Handle export data (dummy function)
  const handleExport = () => {
    toast.info('Exporting buyer data...');
    // In a real app, this would generate a CSV or Excel file
  };

  if (loading) {
    return (
      <div className="buyer-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading buyers data...</p>
      </div>
    );
  }

  return (
    <div className="buyer-management-container">
      <div className="buyer-management-tools">
        <div className="search-filter-container">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search buyers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-container">
            <FaFilter className="filter-icon" />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Buyers</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
        </div>
        
        <div className="action-buttons">
          <button className="refresh-button" onClick={fetchBuyers}>
            <FaSync /> Refresh
          </button>
          <button className="export-button" onClick={handleExport}>
            <FaDownload /> Export
          </button>
        </div>
      </div>
      
      <div className="buyer-stats">
        <div className="stat-card">
          <FaUser className="stat-icon" />
          <div className="stat-content">
            <h4>Total Buyers</h4>
            <p>{buyers.length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <FaCheckCircle className="stat-icon" />
          <div className="stat-content">
            <h4>Verified</h4>
            <p>{buyers.filter(buyer => buyer.isVerified).length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <FaTimesCircle className="stat-icon" />
          <div className="stat-content">
            <h4>Unverified</h4>
            <p>{buyers.filter(buyer => !buyer.isVerified).length}</p>
          </div>
        </div>
      </div>
      
      {sortedBuyers.length === 0 ? (
        <div className="buyer-management-empty">
          <FaUser className="empty-icon" />
          <p>No buyers found matching your criteria</p>
        </div>
      ) : (
        <div className="buyer-list">
          <table className="buyer-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('name')}>
                  Name
                  {sortConfig.key === 'name' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th onClick={() => requestSort('email')}>
                  Email
                  {sortConfig.key === 'email' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th onClick={() => requestSort('phoneNumber')}>
                  Phone
                  {sortConfig.key === 'phoneNumber' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th>Profile</th>
                <th onClick={() => requestSort('gender')}>
                  Gender
                  {sortConfig.key === 'gender' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th onClick={() => requestSort('isVerified')}>
                  Status
                  {sortConfig.key === 'isVerified' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedBuyers.map(buyer => (
                <tr key={buyer._id}>
                  <td>{buyer.name}</td>
                  <td>{buyer.email}</td>
                  <td>{buyer.phoneNumber || 'N/A'}</td>
                  <td>
                    {buyer.profilePic ? (
                      <button 
                        className="view-button"
                        onClick={() => {
                          console.log('Viewing buyer profile image:', buyer.profilePic);
                          setViewImage(buyer.profilePic);
                        }}
                      >
                        <FaEye /> View
                      </button>
                    ) : (
                      <span className="no-document">No image</span>
                    )}
                  </td>
                  <td>{buyer.gender || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${buyer.isVerified ? 'verified' : 'unverified'}`}>
                      {buyer.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="action-buttons-cell">
                    <button 
                      className={`delete-button ${confirmDelete === buyer._id ? 'confirm' : ''}`}
                      onClick={() => handleDeleteUser(buyer._id)}
                    >
                      {confirmDelete === buyer._id ? 'Confirm' : <FaTrash />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {viewImage && <ImageViewer image={viewImage} />}
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default BuyerManagement; 