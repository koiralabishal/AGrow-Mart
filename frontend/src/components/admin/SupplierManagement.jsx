import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authService from '../../api';
import '../../styles/admin/BuyerManagement.css';
import '../../styles/admin/FarmerManagement.css';
import { FaTrash, FaSync, FaSearch, FaFilter, FaDownload, FaCheckCircle, FaTimesCircle, FaStore, FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import PropTypes from 'prop-types';

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [viewDocument, setViewDocument] = useState(null);

  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await authService.getUsersByType('supplier');
      if (response.success) {
        setSuppliers(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch suppliers');
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Error fetching suppliers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (confirmDelete === userId) {
      try {
        const response = await authService.deleteUser(userId);
        if (response.success) {
          toast.success('Supplier deleted successfully');
          // Remove the deleted user from the state
          setSuppliers(suppliers.filter(supplier => supplier._id !== userId));
        } else {
          toast.error(response.message || 'Failed to delete supplier');
        }
      } catch (error) {
        console.error('Error deleting supplier:', error);
        toast.error('Error deleting supplier. Please try again later.');
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
        
        // Update supplier in the state
        setSuppliers(suppliers.map(supplier => 
          supplier._id === userId ? { ...supplier, documentApproval: approved } : supplier
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
              <h3>Business Certificate</h3>
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
            <h3>Business Certificate</h3>
            <button className="close-button" onClick={() => setViewDocument(null)}>×</button>
          </div>
          <div className="document-viewer-body">
            <img 
              src={documentPath} 
              alt="Supplier Business Certificate" 
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

  // Filter suppliers based on search term and filter status
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'verified' && supplier.isVerified) ||
      (filterStatus === 'unverified' && !supplier.isVerified);
    
    return matchesSearch && matchesFilter;
  });

  // Sort suppliers based on sort configuration
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
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
    toast.info('Exporting supplier data...');
    // In a real app, this would generate a CSV or Excel file
  };

  if (loading) {
    return (
      <div className="buyer-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading suppliers data...</p>
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
              placeholder="Search suppliers..."
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
              <option value="all">All Suppliers</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
        </div>
        
        <div className="action-buttons">
          <button className="refresh-button" onClick={fetchSuppliers}>
            <FaSync /> Refresh
          </button>
          <button className="export-button" onClick={handleExport}>
            <FaDownload /> Export
          </button>
        </div>
      </div>
      
      <div className="buyer-stats">
        <div className="stat-card">
          <FaStore className="stat-icon" />
          <div className="stat-content">
            <h4>Total Suppliers</h4>
            <p>{suppliers.length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <FaCheckCircle className="stat-icon" />
          <div className="stat-content">
            <h4>Verified</h4>
            <p>{suppliers.filter(supplier => supplier.isVerified).length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <FaTimesCircle className="stat-icon" />
          <div className="stat-content">
            <h4>Unverified</h4>
            <p>{suppliers.filter(supplier => !supplier.isVerified).length}</p>
          </div>
        </div>
      </div>
      
      {sortedSuppliers.length === 0 ? (
        <div className="buyer-management-empty">
          <FaStore className="empty-icon" />
          <p>No suppliers found matching your criteria</p>
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
                <th onClick={() => requestSort('businessName')}>
                  Business
                  {sortConfig.key === 'businessName' && (
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
              {sortedSuppliers.map(supplier => (
                <tr key={supplier._id}>
                  <td>{supplier.name}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.businessName || 'N/A'}</td>
                  <td>{supplier.phoneNumber || 'N/A'}</td>
                  <td>
                    {supplier.businessCertificate ? (
                      <button 
                        className="view-button"
                        onClick={() => {
                          console.log('Viewing supplier document:', supplier.businessCertificate);
                          setViewDocument(supplier.businessCertificate);
                        }}
                      >
                        <FaEye /> View
                      </button>
                    ) : (
                      <span className="no-document">No document</span>
                    )}
                  </td>
                  <td>
                    <span className={`doc-status ${supplier.documentApproval ? 'approved' : 'pending'}`}>
                      {supplier.documentApproval ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${supplier.isVerified ? 'verified' : 'unverified'}`}>
                      {supplier.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="action-buttons-cell">
                    {!supplier.documentApproval && supplier.businessCertificate && (
                      <button 
                        className="approve-button"
                        onClick={() => handleApproveDocument(supplier._id, true)}
                        title="Approve document"
                      >
                        <FaCheck />
                      </button>
                    )}
                    {supplier.documentApproval && (
                      <button 
                        className="reject-button"
                        onClick={() => handleApproveDocument(supplier._id, false)}
                        title="Revoke approval"
                      >
                        <FaTimes />
                      </button>
                    )}
                    <button 
                      className={`delete-button ${confirmDelete === supplier._id ? 'confirm' : ''}`}
                      onClick={() => handleDeleteUser(supplier._id)}
                    >
                      {confirmDelete === supplier._id ? 'Confirm' : <FaTrash />}
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

export default SupplierManagement; 