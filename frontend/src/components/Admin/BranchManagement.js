import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, MapPin, Phone, Mail, Clock, Eye, X } from 'lucide-react';
import AdminLayout from './AdminLayout';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: { address: '', city: '', province: '' },
    contact: { phone: '', email: '' },
    operatingHours: { open: '09:00', close: '23:00' },
    facilities: '',
    image: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // API base URL - thay đổi theo server của bạn
  const API_BASE_URL = 'http://localhost:5000/api';

  // Lấy token từ localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Fetch all branches
  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/branches`);
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      } else {
        showMessage('error', 'Lỗi khi tải danh sách chi nhánh');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      showMessage('error', 'Lỗi khi tải danh sách chi nhánh');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search branches
  const searchBranches = useCallback(async (term) => {
    if (!term.trim()) {
      fetchBranches();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/branches/search?q=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      } else {
        showMessage('error', 'Lỗi khi tìm kiếm chi nhánh');
      }
    } catch (error) {
      console.error('Error searching branches:', error);
      showMessage('error', 'Lỗi khi tìm kiếm chi nhánh');
    }
  }, [fetchBranches]);

  // Create branch
  const createBranch = async (data) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const newBranch = await response.json();
        setBranches(prev => [...prev, newBranch]);
        showMessage('success', 'Thêm chi nhánh thành công');
      } else {
        const error = await response.json();
        showMessage('error', error.message || 'Lỗi khi thêm chi nhánh');
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      showMessage('error', 'Lỗi khi thêm chi nhánh');
    }
  };

  // Update branch
  const updateBranch = async (id, data) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const updatedBranch = await response.json();
        setBranches(prev => prev.map(b => b._id === id ? updatedBranch : b));
        showMessage('success', 'Cập nhật chi nhánh thành công');
      } else {
        const error = await response.json();
        showMessage('error', error.message || 'Lỗi khi cập nhật chi nhánh');
      }
    } catch (error) {
      console.error('Error updating branch:', error);
      showMessage('error', 'Lỗi khi cập nhật chi nhánh');
    }
  };

  // Delete branch
  const deleteBranch = async (id) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setBranches(prev => prev.filter(b => b._id !== id));
        showMessage('success', 'Xóa chi nhánh thành công');
      } else {
        const error = await response.json();
        showMessage('error', error.message || 'Lỗi khi xóa chi nhánh');
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      showMessage('error', 'Lỗi khi xóa chi nhánh');
    }
  };

  // Load branches on component mount
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Search functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchBranches(searchTerm);
      } else {
        fetchBranches();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchBranches, searchBranches]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      if (grandchild) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandchild]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: { ...prev[parent], [child]: value }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const facilitiesArray = formData.facilities.split(',').map(f => f.trim()).filter(f => f);
    
    const submitData = {
      ...formData,
      facilities: facilitiesArray
    };

    if (selectedBranch) {
      await updateBranch(selectedBranch._id, submitData);
    } else {
      await createBranch(submitData);
    }
    
    closeModal();
  };

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    setFormData({
      ...branch,
      facilities: branch.facilities.join(', ')
    });
    setShowModal(true);
  };

  const handleDeleteConfirm = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chi nhánh này?')) {
      await deleteBranch(id);
    }
  };

  const handleViewDetail = (branch) => {
    setSelectedBranch(branch);
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBranch(null);
    setFormData({
      name: '',
      location: { address: '', city: '', province: '' },
      contact: { phone: '', email: '' },
      operatingHours: { open: '09:00', close: '23:00' },
      facilities: '',
      image: '',
      isActive: true
    });
  };

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.location.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Quản Lý Chi Nhánh">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản Lý Chi Nhánh</h1>
          <p className="text-gray-600">Quản lý thông tin các rạp chiếu phim</p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-700' :
            message.type === 'error' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Search and Add */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc thành phố..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              <Plus size={20} />
              Thêm Chi Nhánh
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-gray-500">
            Đang tải danh sách chi nhánh...
          </div>
        )}

        {/* Branch List */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map(branch => (
              <div key={branch._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <img 
                  src={branch.image || 'https://via.placeholder.com/400x200?text=Cinema'} 
                  alt={branch.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{branch.name}</h3>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {branch.isActive ? 'Hoạt động' : 'Tạm đóng'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{branch.location.address}, {branch.location.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      <span>{branch.contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{branch.operatingHours.open} - {branch.operatingHours.close}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {branch.facilities.slice(0, 3).map((facility, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                        {facility}
                      </span>
                    ))}
                    {branch.facilities.length > 3 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        +{branch.facilities.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetail(branch)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Eye size={16} />
                      Chi tiết
                    </button>
                    <button
                      onClick={() => handleEdit(branch)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(branch._id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredBranches.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Không tìm thấy chi nhánh nào
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">
                  {selectedBranch ? 'Cập Nhật Chi Nhánh' : 'Thêm Chi Nhánh Mới'}
                </h2>
                <button onClick={closeModal} className="modal-close">
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Tên Chi Nhánh *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Địa Chỉ *</label>
                      <input
                        type="text"
                        name="location.address"
                        value={formData.location.address}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Thành Phố *</label>
                      <input
                        type="text"
                        name="location.city"
                        value={formData.location.city}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành *</label>
                    <input
                      type="text"
                      name="location.province"
                      value={formData.location.province}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>


                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Số Điện Thoại *</label>
                      <input
                        type="text"
                        name="contact.phone"
                        value={formData.contact.phone}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        name="contact.email"
                        value={formData.contact.email}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Giờ Mở Cửa</label>
                      <input
                        type="time"
                        name="operatingHours.open"
                        value={formData.operatingHours.open}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Giờ Đóng Cửa</label>
                      <input
                        type="time"
                        name="operatingHours.close"
                        value={formData.operatingHours.close}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiện Ích (ngăn cách bởi dấu phẩy)</label>
                    <input
                      type="text"
                      name="facilities"
                      value={formData.facilities}
                      onChange={handleInputChange}
                      placeholder="IMAX, 4DX, Parking"
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Hình Ảnh</label>
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700">Đang hoạt động</label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn btn-secondary flex-1"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                    >
                      {selectedBranch ? 'Cập Nhật' : 'Thêm Mới'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedBranch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">ChiTiết Chi Nhánh</h2>
                  <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>

                <img 
                  src={selectedBranch.image || 'https://via.placeholder.com/600x300?text=Cinema'} 
                  alt={selectedBranch.name}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedBranch.name}</h3>
                    <span className={`inline-block px-3 py-1 text-sm rounded-full ${selectedBranch.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedBranch.isActive ? 'Đang hoạt động' : 'Tạm đóng cửa'}
                    </span>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">ThôngTin Liên Hệ</h4>
                    <div className="space-y-2 text-gray-600">
                      <div className="flex items-start gap-2">
                        <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <p>{selectedBranch.location.address}</p>
                          <p>{selectedBranch.location.city}, {selectedBranch.location.province}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={18} />
                        <span>{selectedBranch.contact.phone}</span>
                      </div>
                      {selectedBranch.contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={18} />
                          <span>{selectedBranch.contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">GiờHoạt Động</h4>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={18} />
                      <span>{selectedBranch.operatingHours.open} - {selectedBranch.operatingHours.close}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">TiệnÍch</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedBranch.facilities.map((facility, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                          {facility}
                          </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Phòng Chiếu</h4>
                    <p className="text-gray-600">{selectedBranch.theaters.length} phòng chiếu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BranchManagement;