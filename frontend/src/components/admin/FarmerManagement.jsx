import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authService from '../../api';
import '../../styles/admin/BuyerManagement.css';
import { FaTrash, FaSync, FaSearch, FaFilter, FaDownload, FaCheckCircle, FaTimesCircle, FaSeedling, FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import PropTypes from 'prop-types';

const FarmerManagement = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [viewDocument, setViewDocument] = useState(null);

  // Fetch farmers on component mount
  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const response = await authService.getUsersByType('farmer');
      if (response.success) {
        setFarmers(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch farmers');
      }
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error('Error fetching farmers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (confirmDelete === userId) {
      try {
        const response = await authService.deleteUser(userId);
        if (response.success) {
          toast.success('Farmer deleted successfully');
          // Remove the deleted user from the state
          setFarmers(farmers.filter(farmer => farmer._id !== userId));
        } else {
          toast.error(response.message || 'Failed to delete farmer');
        }
      } catch (error) {
        console.error('Error deleting farmer:', error);
        toast.error('Error deleting farmer. Please try again later.');
      }
      setConfirmDelete(null);
    } else {
      setConfirmDelete(userId);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  // Handle document approval
  const handleApproveDocument = async (userId, approved) => {
    try {
      const response = await authService.approveDocument(userId, approved);
      if (response.success) {
        toast.success(approved ? 'Document approved successfully' : 'Document approval revoked');
        
        // Update farmer in the state
        setFarmers(farmers.map(farmer => 
          farmer._id === userId ? { ...farmer, documentApproval: approved } : farmer
        ));
      } else {
        toast.error(response.message || 'Failed to update document status');
      }
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Error approving document. Please try again later.');
    }
  };

  // Document viewer component
  const DocumentViewer = ({ document }) => {
    if (!document || !document.path) {
      console.log('No document or path found');
      return (
        <div className="document-viewer-overlay" onClick={() => setViewDocument(null)}>
          <div className="document-viewer-content" onClick={e => e.stopPropagation()}>
            <div className="document-viewer-header">
              <h3>License Document</h3>
              <button className="close-button" onClick={() => setViewDocument(null)}>×</button>
            </div>
            <div className="document-viewer-body">
              <p className="no-document">No document available</p>
            </div>
          </div>
        </div>
      );
    }
    
    // Fix document path to ensure it works properly
    // Handle case where document.path might be a full path or just a filename
    let fileName;
    if (document.path.includes('/')) {
      fileName = document.path.split('/').pop();
    } else if (document.path.includes('\\')) {
      fileName = document.path.split('\\').pop();
    } else {
      fileName = document.path;
    }
    
    // Check if path already contains the directory structure
    let documentPath;
    if (document.path.includes('documents/') || document.path.includes('documents\\')) {
      documentPath = `http://localhost:5000/uploads/${document.path.replace(/^.*documents[/\\]/, 'documents/')}`;
    } else {
      documentPath = `http://localhost:5000/uploads/documents/${fileName}`;
    }
    
    console.log('Original document path:', document.path);
    console.log('Extracted filename:', fileName);
    console.log('Constructed document URL:', documentPath);
      
    return (
      <div className="document-viewer-overlay" onClick={() => setViewDocument(null)}>
        <div className="document-viewer-content" onClick={e => e.stopPropagation()}>
          <div className="document-viewer-header">
            <h3>License Document</h3>
            <button className="close-button" onClick={() => setViewDocument(null)}>×</button>
          </div>
          <div className="document-viewer-body">
            <img 
              src={documentPath} 
              alt="Farmer License Document" 
              onError={(e) => {
                console.error('Error loading image:', e);
                e.target.src = 'https://via.placeholder.com/400x300?text=Document+Error';
                e.target.alt = 'Error loading document';
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // PropTypes for DocumentViewer
  DocumentViewer.propTypes = {
    document: PropTypes.shape({
      path: PropTypes.string
    })
  };

  // Filter farmers based on search term and filter status
  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = 
      farmer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'verified' && farmer.isVerified) ||
      (filterStatus === 'unverified' && !farmer.isVerified);
    
    return matchesSearch && matchesFilter;
  });

  // Sort farmers based on sort configuration
  const sortedFarmers = [...filteredFarmers].sort((a, b) => {
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
    toast.info('Exporting farmer data...');
    // In a real app, this would generate a CSV or Excel file
  };

  if (loading) {
    return (
      <div className="buyer-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading farmers data...</p>
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
              placeholder="Search farmers..."
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
              <option value="all">All Farmers</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
        </div>
        
        <div className="action-buttons">
          <button className="refresh-button" onClick={fetchFarmers}>
            <FaSync /> Refresh
          </button>
          <button className="export-button" onClick={handleExport}>
            <FaDownload /> Export
          </button>
        </div>
      </div>
      
      <div className="buyer-stats">
        <div className="stat-card">
          <FaSeedling className="stat-icon" />
          <div className="stat-content">
            <h4>Total Farmers</h4>
            <p>{farmers.length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <FaCheckCircle className="stat-icon" />
          <div className="stat-content">
            <h4>Verified</h4>
            <p>{farmers.filter(farmer => farmer.isVerified).length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <FaTimesCircle className="stat-icon" />
          <div className="stat-content">
            <h4>Unverified</h4>
            <p>{farmers.filter(farmer => !farmer.isVerified).length}</p>
          </div>
        </div>
      </div>
      
      {sortedFarmers.length === 0 ? (
        <div className="buyer-management-empty">
          <FaSeedling className="empty-icon" />
          <p>No farmers found matching your criteria</p>
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
                <th>Document</th>
                <th onClick={() => requestSort('documentApproval')}>
                  Document Status
                  {sortConfig.key === 'documentApproval' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th onClick={() => requestSort('isVerified')}>
                  Account Status
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
              {sortedFarmers.map(farmer => (
                <tr key={farmer._id}>
                  <td>{farmer.name}</td>
                  <td>{farmer.email}</td>
                  <td>{farmer.phoneNumber || 'N/A'}</td>
                  <td>
                    {farmer.licenseDocument ? (
                      <button 
                        className="view-button"
                        onClick={() => {
                          console.log('Viewing farmer document:', farmer.licenseDocument);
                          setViewDocument(farmer.licenseDocument);
                        }}
                      >
                        <FaEye /> View
                      </button>
                    ) : (
                      <span className="no-document">No document</span>
                    )}
                  </td>
                  <td>
                    <span className={`doc-status ${farmer.documentApproval ? 'approved' : 'pending'}`}>
                      {farmer.documentApproval ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${farmer.isVerified ? 'verified' : 'unverified'}`}>
                      {farmer.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="action-buttons-cell">
                    {!farmer.documentApproval && farmer.licenseDocument && (
                      <button 
                        className="approve-button"
                        onClick={() => handleApproveDocument(farmer._id, true)}
                        title="Approve document"
                      >
                        <FaCheck />
                      </button>
                    )}
                    {farmer.documentApproval && (
                      <button 
                        className="reject-button"
                        onClick={() => handleApproveDocument(farmer._id, false)}
                        title="Revoke approval"
                      >
                        <FaTimes />
                      </button>
                    )}
                    <button 
                      className={`delete-button ${confirmDelete === farmer._id ? 'confirm' : ''}`}
                      onClick={() => handleDeleteUser(farmer._id)}
                    >
                      {confirmDelete === farmer._id ? 'Confirm' : <FaTrash />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {viewDocument && <DocumentViewer document={viewDocument} />}
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default FarmerManagement; 