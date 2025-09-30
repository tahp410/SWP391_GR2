import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Coffee,
  ShoppingBag,
} from "lucide-react";
import AdminLayout from "./AdminLayout";

const ItemManagement = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    price: "",
    cost: "",
    image_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // API base URL - thay đổi theo server của bạn
  const API_BASE_URL = "http://localhost:5000/api";

  // Lấy token từ localStorage
  const getToken = () => {
    return localStorage.getItem("token");
  };

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  // Fetch all items
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/items`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        showMessage("error", "Lỗi khi tải danh sách sản phẩm");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      showMessage("error", "Lỗi khi tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  }, []);

  // Search items
  const searchItems = useCallback(
    async (term) => {
      if (!term.trim()) {
        fetchItems();
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/items/search?q=${encodeURIComponent(term)}`
        );
        if (response.ok) {
          const data = await response.json();
          setItems(data);
        } else {
          showMessage("error", "Lỗi khi tìm kiếm sản phẩm");
        }
      } catch (error) {
        console.error("Error searching items:", error);
        showMessage("error", "Lỗi khi tìm kiếm sản phẩm");
      }
    },
    [fetchItems]
  );

  // Create item
  const createItem = async (data) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newItem = await response.json();
        setItems((prev) => [...prev, newItem]);
        showMessage("success", "Thêm sản phẩm thành công");
      } else {
        const error = await response.json();
        showMessage("error", error.message || "Lỗi khi thêm sản phẩm");
      }
    } catch (error) {
      console.error("Error creating item:", error);
      showMessage("error", "Lỗi khi thêm sản phẩm");
    }
  };

  // Update item
  const updateItem = async (id, data) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setItems((prev) => prev.map((item) => (item._id === id ? updatedItem : item)));
        showMessage("success", "Cập nhật sản phẩm thành công");
      } else {
        const error = await response.json();
        showMessage("error", error.message || "Lỗi khi cập nhật sản phẩm");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      showMessage("error", "Lỗi khi cập nhật sản phẩm");
    }
  };

  // Delete item
  const deleteItem = async (id) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setItems((prev) => prev.filter((item) => item._id !== id));
        showMessage("success", "Xóa sản phẩm thành công");
      } else {
        const error = await response.json();
        showMessage("error", error.message || "Lỗi khi xóa sản phẩm");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      showMessage("error", "Lỗi khi xóa sản phẩm");
    }
  };

  // Load items on component mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Search functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchItems(searchTerm);
      } else {
        fetchItems();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchItems, searchItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!formData.name.trim() || !formData.type || !formData.price || !formData.cost) {
      showMessage("error", "Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      type: formData.type,
      price: Number(formData.price),
      cost: Number(formData.cost),
      image_url: formData.image_url.trim(),
    };

    if (selectedItem) {
      await updateItem(selectedItem._id, submitData);
    } else {
      await createItem(submitData);
    }

    closeModal();
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || "",
      type: item.type || "",
      price: item.price || "",
      cost: item.cost || "",
      image_url: item.image_url || "",
    });
    setShowModal(true);
  };

  const handleDeleteConfirm = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      await deleteItem(id);
    }
  };

  const handleViewDetail = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setFormData({
      name: "",
      type: "",
      price: "",
      cost: "",
      image_url: "",
    });
  };

  const filteredItems = items.filter((item) => {
    const name = item.name || "";
    const type = item.type || "";
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getItemIcon = (type) => {
    switch (type) {
      case "popcorn":
        return <ShoppingBag size={20} className="text-yellow-600" />;
      case "drink":
        return <Coffee size={20} className="text-blue-600" />;
      case "snack":
        return <ShoppingBag size={20} className="text-green-600" />;
      default:
        return <ShoppingBag size={20} className="text-gray-600" />;
    }
  };

  const getItemTypeText = (type) => {
    switch (type) {
      case "popcorn":
        return "Bỏng ngô";
      case "drink":
        return "Đồ uống";
      case "snack":
        return "Đồ ăn vặt";
      default:
        return type;
    }
  };

  const getItemTypeColor = (type) => {
    switch (type) {
      case "popcorn":
        return "bg-yellow-100 text-yellow-700";
      case "drink":
        return "bg-blue-100 text-blue-700";
      case "snack":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <AdminLayout title="Quản Lý Sản Phẩm">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Quản Lý Sản Phẩm
          </h1>
          <p className="text-gray-600">Quản lý thông tin các sản phẩm bán tại rạp</p>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : message.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Search and Add */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc loại sản phẩm..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Thêm Sản Phẩm Mới
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-gray-500">
            Đang tải danh sách sản phẩm...
          </div>
        )}

        {/* Items List */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getItemIcon(item.type)}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {item.name}
                        </h3>
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getItemTypeColor(item.type)}`}
                        >
                          {getItemTypeText(item.type)}
                        </span>
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
                      onClick={() => handleDeleteConfirm(item._id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && !loading && (
              <div className="col-span-full text-center py-12 text-gray-500">
                {searchTerm
                  ? "Không tìm thấy sản phẩm nào phù hợp"
                  : "Chưa có sản phẩm nào"}
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {selectedItem ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên sản phẩm *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại sản phẩm *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Chọn loại sản phẩm</option>
                      <option value="popcorn">Bỏng ngô</option>
                      <option value="drink">Đồ uống</option>
                      <option value="snack">Đồ ăn vặt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá bán (VNĐ) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá vốn (VNĐ) *
                    </label>
                    <input
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL hình ảnh
                    </label>
                    <input
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {selectedItem ? "Cập nhật" : "Thêm"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Chi Tiết Sản Phẩm</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Image */}
                  {selectedItem.image_url && (
                    <div className="mb-4">
                      <img
                        src={selectedItem.image_url}
                        alt={selectedItem.name}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    {getItemIcon(selectedItem.type)}
                    <div>
                      <h3 className="text-lg font-semibold">{selectedItem.name}</h3>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${getItemTypeColor(selectedItem.type)}`}
                      >
                        {getItemTypeText(selectedItem.type)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Giá bán:</span>
                      <span className="text-lg font-bold text-green-600">
                        {selectedItem.price?.toLocaleString()} VNĐ
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Giá vốn:</span>
                      <span className="text-lg font-medium text-orange-600">
                        {selectedItem.cost?.toLocaleString()} VNĐ
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Lợi nhuận:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {((selectedItem.price - selectedItem.cost) || 0).toLocaleString()} VNĐ
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tỷ lệ lợi nhuận:</span>
                      <span className="text-lg font-bold text-purple-600">
                        {selectedItem.cost > 0 ? (((selectedItem.price - selectedItem.cost) / selectedItem.cost * 100).toFixed(1)) : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleEdit(selectedItem);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => setShowDetailModal(false)}
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