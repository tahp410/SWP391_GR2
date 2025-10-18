import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, X, Package, Upload, Link } from 'lucide-react';
import AdminLayout from './AdminLayout';

// FormField component moved outside to prevent recreation
const FormField = ({ label, type = "text", required, className, ...props }) => {
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'textarea' ? 
        <textarea className={className || inputClass} rows="3" {...props} /> :
        <input type={type} className={className || inputClass} {...props} />
      }
    </div>
  );
};

const ComboManagement = () => {
  const [state, setState] = useState({
    combos: [], availableItems: [], searchTerm: '', loading: true,
    showForm: false, showDetailModal: false, editingCombo: null,
    formData: { name: '', description: '', price: '', image_url: '', image_file: null, items: [] },
    message: { type: '', text: '' },
    imagePreview: '',
    uploadMethod: 'url',
    uploading: false
  });

  const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
  
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

  const fetchData = useCallback(async () => {
    try {
      const [combosRes, itemsRes] = await Promise.all([
        fetch(`${API_BASE}/combos/admin/all`),
        fetch(`${API_BASE}/items`)
      ]);
      const [combos, availableItems] = await Promise.all([combosRes.json(), itemsRes.json()]);
      setState(prev => ({ ...prev, combos, availableItems, loading: false }));
    } catch (error) {
      console.error('Error:', error);
      setState(prev => ({ ...prev, loading: false }));
      showMessage('error', 'Lỗi khi tải dữ liệu');
    }
  }, [API_BASE]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, description, price, items, image_url, image_file } = state.formData;
    
    if (!name || !description || !price || items.length === 0) {
      return showMessage('error', 'Vui lòng điền đầy đủ thông tin và thêm ít nhất một sản phẩm');
    }

    // Validation ảnh - bắt buộc phải có ảnh
    if (!state.editingCombo && !image_url.trim() && !image_file) {
      return showMessage('error', 'Vui lòng thêm ảnh combo (URL hoặc tải từ máy)');
    }

    if (state.editingCombo && !image_url.trim() && !image_file && !state.editingCombo.image_url) {
      return showMessage('error', 'Vui lòng thêm ảnh combo (URL hoặc tải từ máy)');
    }

    let finalImageUrl = image_url.trim();
    
    // Nếu có file ảnh được chọn, upload lên server
    if (image_file) {
      const uploadedUrl = await uploadImage(image_file);
      if (!uploadedUrl) {
        return; // Upload failed, error message already shown
      }
      finalImageUrl = uploadedUrl;
    }

    const submitData = {
      name,
      description,
      price: parseFloat(price),
      image: finalImageUrl,
      image_url: finalImageUrl, // Để đảm bảo tương thích với backend
      items
    };

    try {
      const token = localStorage.getItem('token');
      const url = state.editingCombo ? `${API_BASE}/combos/${state.editingCombo._id}` : `${API_BASE}/combos`;
      const response = await fetch(url, {
        method: state.editingCombo ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        await fetchData();
        resetForm();
        showMessage('success', `Combo ${state.editingCombo ? 'cập nhật' : 'tạo'} thành công!`);
      } else {
        const error = await response.json();
        showMessage('error', error.message || 'Thao tác thất bại');
      }
    } catch (error) {
      showMessage('error', 'Lỗi khi lưu combo');
    }
  };

  const handleEdit = (combo) => setState(prev => ({
    ...prev, editingCombo: combo, showForm: true,
    formData: { 
      ...combo, 
      image_url: combo.image_url || combo.image || '',
      image_file: null
    },
    imagePreview: combo.image_url || combo.image || '',
    uploadMethod: 'url'
  }));

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa combo này?')) return;
    try {
      const response = await fetch(`${API_BASE}/combos/${id}/permanent`, { method: 'DELETE' });
      if (response.ok) {
        await fetchData();
        showMessage('success', 'Combo đã xóa thành công!');
      } else showMessage('error', 'Lỗi khi xóa combo');
    } catch (error) {
      showMessage('error', 'Lỗi khi thao tác combo');
    }
  };

  const updateComboItem = (index, field, value) => {
    const items = state.formData.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setState(prev => ({ ...prev, formData: { ...prev.formData, items } }));
  };

  const resetForm = () => setState(prev => ({
    ...prev, 
    formData: { name: '', description: '', price: '', image_url: '', image_file: null, items: [] },
    editingCombo: null, 
    showForm: false,
    imagePreview: '',
    uploadMethod: 'url'
  }));

  const addItemToCombo = () => setState(prev => ({
    ...prev, formData: { ...prev.formData, items: [...prev.formData.items, { name: '', quantity: 1 }] }
  }));

  const removeComboItem = (index) => setState(prev => ({
    ...prev, formData: { ...prev.formData, items: prev.formData.items.filter((_, i) => i !== index) }
  }));

  const handleViewDetail = (combo) => setState(prev => ({
    ...prev, editingCombo: combo, showDetailModal: true
  }));

  const updateFormField = (field, value) => setState(prev => ({
    ...prev, formData: { ...prev.formData, [field]: value }
  }));

  const filteredCombos = state.combos.filter(combo => 
    combo.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    combo.description.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  if (state.loading) {
    return (
      <AdminLayout title="Quản Lý Combo">
        <div className="p-6">
          <div className="text-center py-12 text-gray-500">
            Đang tải danh sách combo...
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản Lý Combo">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản Lý Combo</h1>
          <p className="text-gray-600">Quản lý thông tin các combo sản phẩm tại rạp</p>
        </div>

        {/* Message */}
        {state.message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            state.message.type === 'success' ? 'bg-green-100 text-green-700' :
            state.message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {state.message.text}
          </div>
        )}

        {/* Search and Add */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm combo..."
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
              Thêm Combo Mới
            </button>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {state.showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {state.editingCombo ? 'Chỉnh Sửa Combo' : 'Thêm Combo Mới'}
                  </h2>
                  <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField
                    label="Tên combo"
                    required
                    value={state.formData.name}
                    onChange={(e) => updateFormField('name', e.target.value)}
                  />
                  
                  <FormField
                    label="Mô tả"
                    type="textarea"
                    required
                    value={state.formData.description}
                    onChange={(e) => updateFormField('description', e.target.value)}
                  />
                  
                  <FormField
                    label="Giá (VNĐ)"
                    type="number"
                    required
                    min="0"
                    value={state.formData.price}
                    onChange={(e) => updateFormField('price', e.target.value)}
                  />
                  
                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ảnh combo <span className="text-red-500">*</span>
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
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          formData: { ...prev.formData, image_url: e.target.value },
                          imagePreview: e.target.value
                        }))}
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
                        <strong>Lưu ý:</strong> Ảnh là bắt buộc cho mọi combo. Vui lòng cung cấp ảnh chất lượng cao.
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Sản phẩm <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={addItemToCombo}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        <Plus size={16} />
                        Thêm sản phẩm
                      </button>
                    </div>
                    
                    {state.formData.items.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2 items-center">
                        <select
                          value={item.name}
                          onChange={(e) => updateComboItem(index, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Chọn sản phẩm</option>
                          {state.availableItems.map((availableItem) => {
                            const sizeMap = { small: 'S', medium: 'M', large: 'L', extra_large: 'XL' };
                            const sizeText = availableItem.size ? ` (${sizeMap[availableItem.size] || availableItem.size})` : '';
                            const displayText = `${availableItem.name}${sizeText} - ${availableItem.type} - ${availableItem.price.toLocaleString()}đ`;
                            return (
                              <option key={availableItem._id} value={availableItem.name}>
                                {displayText}
                              </option>
                            );
                          })}
                        </select>
                        
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateComboItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          placeholder="SL"
                        />
                        
                        <button
                          type="button"
                          onClick={() => removeComboItem(index)}
                          className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
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
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {state.editingCombo ? 'Cập nhật' : 'Tạo combo'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {state.showDetailModal && state.editingCombo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Chi Tiết Combo</h2>
                  <button
                    onClick={() => setState(prev => ({ ...prev, showDetailModal: false }))}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {(state.editingCombo.image || state.editingCombo.image_url) && (
                    <img
                      src={state.editingCombo.image || state.editingCombo.image_url}
                      alt={state.editingCombo.name}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <Package size={20} className="text-purple-600" />
                    <div>
                      <h3 className="text-lg font-semibold">{state.editingCombo.name}</h3>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        state.editingCombo.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {state.editingCombo.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600">{state.editingCombo.description}</p>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Giá combo:</span>
                      <span className="text-lg font-bold text-green-600">
                        {state.editingCombo.price?.toLocaleString()} VNĐ
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 block mb-2">Sản phẩm bao gồm:</span>
                      {state.editingCombo.items.map((item, index) => (
                        <div key={index} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                          <span>{item.name}</span>
                          <span>x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setState(prev => ({ ...prev, showDetailModal: false }));
                        handleEdit(state.editingCombo);
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

        {/* Combos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCombos.map((combo) => (
            <div
              key={combo._id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                {(combo.image || combo.image_url) ? (
                  <img
                    src={combo.image || combo.image_url}
                    alt={combo.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = '<div class="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400"><span>Không có ảnh</span></div>';
                    }}
                  />
                ) : (
                  <span className="text-gray-400 text-sm">Không có ảnh</span>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Package size={20} className="text-purple-600" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {combo.name}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        combo.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {combo.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {combo.description}
                </p>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Giá combo:</span>
                    <span className="text-lg font-bold text-green-600">
                      {combo.price.toLocaleString()}đ
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-700 mb-2 block">Sản phẩm bao gồm:</span>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {combo.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          <span>{item.name}</span>
                          <span>x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetail(combo)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={16} />
                    Xem
                  </button>
                  <button
                    onClick={() => handleEdit(combo)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Edit2 size={16} />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(combo._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredCombos.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              {state.searchTerm ? "Không tìm thấy combo nào phù hợp" : "Chưa có combo nào. Tạo combo đầu tiên!"}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ComboManagement;