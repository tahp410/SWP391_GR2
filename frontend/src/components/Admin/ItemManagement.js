import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, X, Coffee, ShoppingBag, Upload, Link } from 'lucide-react';
import AdminLayout from './AdminLayout';

const ItemManagement = () => {
  const [state, setState] = useState({
    items: [], 
    searchTerm: '', 
    loading: true,
    showForm: false, 
    showDetailModal: false, 
    editingItem: null,
    formData: { name: '', type: '', size: '', price: '', cost: '', image_url: '', image_file: null },
    message: { type: '', text: '' },
    imagePreview: '',
    uploadMethod: 'url',
    uploading: false
  });

  const API_BASE = 'http://localhost:5000/api';
  
  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // Create headers with token
  const getHeaders = useCallback(() => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }, []);
  
  const showMessage = (type, text) => setState(prev => ({ 
    ...prev, message: { type, text } 
  }));

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setState(prev => ({ ...prev, uploading: true }));
      const response = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setState(prev => ({ ...prev, uploading: false }));
        return result.imageUrl;
      } else {
        setState(prev => ({ ...prev, uploading: false }));
        showMessage('error', 'Lỗi khi tải ảnh lên server');
        return null;
      }
    } catch (error) {
      setState(prev => ({ ...prev, uploading: false }));
      showMessage('error', 'Lỗi khi tải ảnh lên server');
      return null;
    }
  };

  useEffect(() => {
    if (state.message.text) {
      const timer = setTimeout(() => setState(prev => ({ 
        ...prev, message: { type: '', text: '' } 
      })), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.message.text]);

  const fetchItems = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const response = await fetch(`${API_BASE}/items`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const items = await response.json();
        setState(prev => ({ ...prev, items, loading: false }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
        showMessage('error', 'Lỗi khi tải danh sách sản phẩm');
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      showMessage('error', 'Lỗi khi tải danh sách sản phẩm');
    }
  }, [getHeaders]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, type, size, price, cost, image_url, image_file } = state.formData;
    
    if (!name || !type || !size || !price || !cost) {
      return showMessage('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }

    // Validation ảnh - bắt buộc
    if (!state.editingItem && !image_url.trim() && !image_file) {
      return showMessage('error', 'Vui lòng thêm ảnh sản phẩm (URL hoặc tải từ máy)');
    }

    if (state.editingItem && !image_url.trim() && !image_file && !state.editingItem.image_url) {
      return showMessage('error', 'Vui lòng thêm ảnh sản phẩm (URL hoặc tải từ máy)');
    }

    let finalImageUrl = image_url.trim();
    
    if (image_file) {
      const uploadedUrl = await uploadImage(image_file);
      if (!uploadedUrl) return;
      finalImageUrl = uploadedUrl;
    }

    const submitData = {
      name: name.trim(),
      type,
      size,
      price: Number(price),
      cost: Number(cost),
      image_url: finalImageUrl
    };

    try {
      const url = state.editingItem ? `${API_BASE}/items/${state.editingItem._id}` : `${API_BASE}/items`;
      const response = await fetch(url, {
        method: state.editingItem ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        await fetchItems();
        resetForm();
        showMessage('success', `Sản phẩm ${state.editingItem ? 'cập nhật' : 'tạo'} thành công!`);
      } else {
        const error = await response.json();
        showMessage('error', error.message || 'Thao tác thất bại');
      }
    } catch (error) {
      showMessage('error', 'Lỗi khi lưu sản phẩm');
    }
  };

  const handleEdit = (item) => setState(prev => ({
    ...prev, 
    editingItem: item, 
    showForm: true,
    formData: { 
      name: item.name || '',
      type: item.type || '',
      size: item.size || '',
      price: item.price || '',
      cost: item.cost || '',
      image_url: item.image_url || '',
      image_file: null
    },
    imagePreview: item.image_url || '',
    uploadMethod: 'url'
  }));

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      const response = await fetch(`${API_BASE}/items/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      if (response.ok) {
        await fetchItems();
        showMessage('success', 'Sản phẩm đã xóa thành công!');
      } else showMessage('error', 'Lỗi khi xóa sản phẩm');
    } catch (error) {
      showMessage('error', 'Lỗi khi thao tác sản phẩm');
    }
  };

  const resetForm = () => setState(prev => ({
    ...prev, 
    formData: { name: '', type: '', size: '', price: '', cost: '', image_url: '', image_file: null },
    editingItem: null, 
    showForm: false,
    imagePreview: '',
    uploadMethod: 'url'
  }));

  const handleViewDetail = (item) => setState(prev => ({
    ...prev, editingItem: item, showDetailModal: true
  }));

  const updateFormField = useCallback((field, value) => setState(prev => ({
    ...prev, 
    formData: { ...prev.formData, [field]: value },
    ...(field === 'image_url' && value ? { imagePreview: value } : {})
  })), []);

  const filteredItems = state.items.filter(item => 
    (item.name || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    (item.type || '').toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  const getItemIcon = (type) => {
    const iconMap = {
      popcorn: <ShoppingBag size={20} className="text-yellow-600" />,
      drink: <Coffee size={20} className="text-blue-600" />,
      snack: <ShoppingBag size={20} className="text-green-600" />,
      default: <ShoppingBag size={20} className="text-gray-600" />
    };
    return iconMap[type] || iconMap.default;
  };

  const getItemTypeText = (type) => {
    const typeMap = { popcorn: "Bỏng ngô", drink: "Đồ uống", snack: "Đồ ăn vặt" };
    return typeMap[type] || type;
  };

  const getItemTypeColor = (type) => {
    const colorMap = {
      popcorn: "bg-yellow-100 text-yellow-700",
      drink: "bg-blue-100 text-blue-700", 
      snack: "bg-green-100 text-green-700",
      default: "bg-gray-100 text-gray-700"
    };
    return colorMap[type] || colorMap.default;
  };

  const getSizeText = (size) => {
    const sizeMap = { 
      small: "Nhỏ (S)", 
      medium: "Vừa (M)", 
      large: "Lớn (L)", 
      extra_large: "Cực lớn (XL)" 
    };
    return sizeMap[size] || size;
  };

  const getSizeColor = (size) => {
    const colorMap = {
      small: "bg-green-100 text-green-700",
      medium: "bg-blue-100 text-blue-700",
      large: "bg-orange-100 text-orange-700",
      extra_large: "bg-red-100 text-red-700",
      default: "bg-gray-100 text-gray-700"
    };
    return colorMap[size] || colorMap.default;
  };

  const FormField = ({ label, type = 'text', required, ...props }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea 
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          rows="3" 
          {...props} 
        />
      ) : type === 'select' ? (
        <select 
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          {...props}
        >
          {props.children}
        </select>
      ) : (
        <input 
          type={type}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          {...props} 
        />
      )}
    </div>
  );

  return (
    <AdminLayout title="Quản Lý Sản Phẩm">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Sản Phẩm</h1>
          <p className="text-gray-600">Quản lý thông tin các sản phẩm bán tại rạp (Bắt buộc có ảnh)</p>
        </div>

        {state.message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            state.message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {state.message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc loại sản phẩm..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={state.searchTerm}
                onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>
            <button
              onClick={() => setState(prev => ({ ...prev, showForm: true }))}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Thêm Sản Phẩm Mới
            </button>
          </div>
        </div>

        {state.loading ? (
          <div className="text-center py-12 text-gray-500">Đang tải danh sách sản phẩm...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {item.image_url && (
                  <div className="w-full h-40 bg-gray-100 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      onError={(e) => { 
                        e.target.style.display = 'none';
                        e.target.parentElement.style.display = 'flex';
                        e.target.parentElement.style.alignItems = 'center';
                        e.target.parentElement.style.justifyContent = 'center';
                        e.target.parentElement.innerHTML = '<div class="text-gray-400 text-sm">Không thể tải ảnh</div>';
                      }}
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getItemIcon(item.type)}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getItemTypeColor(item.type)}`}>
                            {getItemTypeText(item.type)}
                          </span>
                          {item.size && (
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getSizeColor(item.size)}`}>
                              {getSizeText(item.size)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Giá bán:</span>
                      <span className="text-lg font-bold text-green-600">
                        {item.price?.toLocaleString()} VNĐ
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Giá vốn:</span>
                      <span className="text-sm font-medium text-orange-600">
                        {item.cost?.toLocaleString()} VNĐ
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Lợi nhuận:</span>
                      <span className="text-sm font-medium text-blue-600">
                        {((item.price - item.cost) || 0).toLocaleString()} VNĐ
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetail(item)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Eye size={16} />
                      Xem
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Edit2 size={16} />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && !state.loading && (
              <div className="col-span-full text-center py-12 text-gray-500">
                {state.searchTerm ? "Không tìm thấy sản phẩm nào phù hợp" : "Chưa có sản phẩm nào"}
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        {state.showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {state.editingItem ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
                  </h2>
                  <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField
                    label="Tên sản phẩm"
                    required
                    value={state.formData.name}
                    onChange={(e) => updateFormField('name', e.target.value)}
                    placeholder="Nhập tên sản phẩm"
                  />
                  
                  <FormField
                    label="Loại sản phẩm"
                    type="select"
                    required
                    value={state.formData.type}
                    onChange={(e) => updateFormField('type', e.target.value)}
                  >
                    <option value="">Chọn loại sản phẩm</option>
                    <option value="popcorn">Bỏng ngô</option>
                    <option value="drink">Đồ uống</option>
                    <option value="snack">Đồ ăn vặt</option>
                  </FormField>
                  
                  <FormField
                    label="Kích cỡ"
                    type="select"
                    required
                    value={state.formData.size}
                    onChange={(e) => updateFormField('size', e.target.value)}
                  >
                    <option value="">Chọn kích cỡ</option>
                    <option value="small">Nhỏ (S)</option>
                    <option value="medium">Vừa (M)</option>
                    <option value="large">Lớn (L)</option>
                    <option value="extra_large">Cực lớn (XL)</option>
                  </FormField>
                  
                  <FormField
                    label="Giá bán (VNĐ)"
                    type="text"
                    pattern="[0-9]*"
                    required
                    placeholder="Nhập giá bán"
                    value={state.formData.price}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      updateFormField('price', value);
                    }}
                  />
                  
                  <FormField
                    label="Giá vốn (VNĐ)"
                    type="text"
                    pattern="[0-9]*"
                    required
                    placeholder="Nhập giá vốn"
                    value={state.formData.cost}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      updateFormField('cost', value);
                    }}
                  />

                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ảnh sản phẩm <span className="text-red-500">*</span>
                    </label>
                    
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, uploadMethod: "url" }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                          state.uploadMethod === "url" 
                            ? "bg-blue-100 text-blue-700 border border-blue-300" 
                            : "bg-gray-100 text-gray-600 border border-gray-300"
                        }`}
                      >
                        <Link size={16} />
                        URL Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, uploadMethod: "file" }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                          state.uploadMethod === "file" 
                            ? "bg-blue-100 text-blue-700 border border-blue-300" 
                            : "bg-gray-100 text-gray-600 border border-gray-300"
                        }`}
                      >
                        <Upload size={16} />
                        Tải lên
                      </button>
                    </div>

                    {state.uploadMethod === "url" && (
                      <input
                        type="url"
                        value={state.formData.image_url}
                        onChange={(e) => updateFormField('image_url', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}

                    {state.uploadMethod === "file" && (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (!file.type.startsWith('image/')) {
                                showMessage("error", "Vui lòng chọn file ảnh hợp lệ");
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                showMessage("error", "Kích thước ảnh không được vượt quá 5MB");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setState(prev => ({
                                  ...prev,
                                  imagePreview: e.target.result,
                                  formData: { ...prev.formData, image_file: file }
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500">Chấp nhận: JPG, PNG, GIF. Tối đa 5MB</p>
                        {state.uploading && (
                          <p className="text-sm text-blue-600">Đang tải ảnh lên...</p>
                        )}
                      </div>
                    )}

                    {state.imagePreview && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Xem trước:</p>
                        <img
                          src={state.imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border"
                          onError={() => setState(prev => ({ ...prev, imagePreview: "" }))}
                        />
                      </div>
                    )}

                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-700">
                        <strong>Lưu ý:</strong> Ảnh là bắt buộc cho mọi sản phẩm. Vui lòng cung cấp ảnh chất lượng cao.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={state.uploading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {state.uploading ? "Đang tải..." : (state.editingItem ? "Cập nhật" : "Thêm")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {state.showDetailModal && state.editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Chi Tiết Sản Phẩm</h2>
                  <button
                    onClick={() => setState(prev => ({ ...prev, showDetailModal: false }))}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {state.editingItem.image_url && (
                    <div className="mb-4 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={state.editingItem.image_url}
                        alt={state.editingItem.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => { 
                          e.target.style.display = 'none';
                          e.target.parentElement.style.display = 'flex';
                          e.target.parentElement.style.alignItems = 'center';
                          e.target.parentElement.style.justifyContent = 'center';
                          e.target.parentElement.style.height = '12rem';
                          e.target.parentElement.innerHTML = '<div class="text-gray-400">Không thể tải ảnh</div>';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    {getItemIcon(state.editingItem.type)}
                    <div>
                      <h3 className="text-lg font-semibold">{state.editingItem.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getItemTypeColor(state.editingItem.type)}`}>
                          {getItemTypeText(state.editingItem.type)}
                        </span>
                        {state.editingItem.size && (
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getSizeColor(state.editingItem.size)}`}>
                            {getSizeText(state.editingItem.size)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Giá bán:</span>
                      <span className="text-lg font-bold text-green-600">
                        {state.editingItem.price?.toLocaleString()} VNĐ
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Giá vốn:</span>
                      <span className="text-lg font-medium text-orange-600">
                        {state.editingItem.cost?.toLocaleString()} VNĐ
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Lợi nhuận:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {((state.editingItem.price - state.editingItem.cost) || 0).toLocaleString()} VNĐ
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tỷ lệ lợi nhuận:</span>
                      <span className="text-lg font-bold text-purple-600">
                        {state.editingItem.cost > 0 ? (((state.editingItem.price - state.editingItem.cost) / state.editingItem.cost * 100).toFixed(1)) : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setState(prev => ({ ...prev, showDetailModal: false }));
                        handleEdit(state.editingItem);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => setState(prev => ({ ...prev, showDetailModal: false }))}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Đóng
                    </button>
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

export default ItemManagement;