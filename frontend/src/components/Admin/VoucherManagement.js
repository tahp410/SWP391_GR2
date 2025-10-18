import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Percent,
  Tag,
  Eye,
  X,
} from "lucide-react";
import AdminLayout from "./AdminLayout";

const API_BASE_URL = "http://localhost:5000/api";

const toInputDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD for <input type="date" />
  } catch {
    return "";
  }
};

const formatDisplayDate = (d) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("vi-VN");
  } catch {
    return d;
  }
};

const VoucherPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "Percentage", // "percentage" or "fixed"
    discountValue: "", // number
    minPurchase: "",
    maxDiscount: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const getToken = () => localStorage.getItem("token");

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // Fetch vouchers
  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/vouchers`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showMessage("error", err.message || "Lỗi khi tải danh sách voucher");
        return;
      }
      const data = await res.json();
      setVouchers(data);
    } catch (err) {
      console.error(err);
      showMessage("error", "Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // Search local (basic)
  const filtered = vouchers.filter((v) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      (v.code && v.code.toLowerCase().includes(q)) ||
      (v.description && v.description.toLowerCase().includes(q)) ||
      (v.discountType && v.discountType.toLowerCase().includes(q))
    );
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // create or update
  const handleSubmit = async (e) => {
    e.preventDefault();

    // basic client validation
    if (
      !formData.code ||
      !formData.description ||
      formData.discountValue === "" ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.discountType
    ) {
      showMessage("error", "Vui lòng điền đủ các trường bắt buộc.");
      return;
    }

    const payload = {
      code: formData.code,
      description: formData.description,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minPurchase: formData.minPurchase ? Number(formData.minPurchase) : 0,
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : 0,
      startDate: formData.startDate, // 'YYYY-MM-DD' is OK for backend
      endDate: formData.endDate,
      isActive: !!formData.isActive,
    };

    const token = getToken();
    if (!token) {
      showMessage("error", "Bạn chưa đăng nhập hoặc token không hợp lệ.");
      return;
    }

    try {
      setLoading(true);

      if (selectedVoucher) {
        // update
        const res = await fetch(`${API_BASE_URL}/vouchers/${selectedVoucher._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
          showMessage("error", resJson.message || "Lỗi khi cập nhật voucher");
          return;
        }
        // update local state
        setVouchers((prev) => prev.map((v) => (v._id === selectedVoucher._id ? resJson : v)));
        showMessage("success", "Cập nhật voucher thành công");
      } else {
        // create
        const res = await fetch(`${API_BASE_URL}/vouchers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
          showMessage("error", resJson.message || "Lỗi khi tạo voucher");
          return;
        }
        setVouchers((prev) => [...prev, resJson]);
        showMessage("success", "Tạo voucher thành công");
      }

      closeModal();
    } catch (err) {
      console.error(err);
      showMessage("error", "Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (v) => {
    setSelectedVoucher(v);
    setFormData({
      code: v.code || "",
      description: v.description || "",
      discountType: v.discountType || "Percentage",
      discountValue: v.discountValue != null ? String(v.discountValue) : "",
      minPurchase: v.minPurchase != null ? String(v.minPurchase) : "",
      maxDiscount: v.maxDiscount != null ? String(v.maxDiscount) : "",
      startDate: toInputDate(v.startDate),
      endDate: toInputDate(v.endDate),
      isActive: !!v.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa voucher này?")) return;
    const token = getToken();
    if (!token) {
      showMessage("error", "Bạn chưa đăng nhập.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/vouchers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const resJson = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMessage("error", resJson.message || "Lỗi khi xóa voucher");
        return;
      }
      setVouchers((prev) => prev.filter((v) => v._id !== id));
      showMessage("success", "Xóa voucher thành công");
    } catch (err) {
      console.error(err);
      showMessage("error", "Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (v) => {
    setSelectedVoucher(v);
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVoucher(null);
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minPurchase: "",
      maxDiscount: "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
  };

  return (
    <AdminLayout title="Quản Lý Voucher">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản Lý Voucher</h1>
          <p className="text-gray-600">Tạo, chỉnh sửa và quản lý mã giảm giá</p>
        </div>

        {message.text && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã hoặc mô tả..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
              <Plus size={18} /> Thêm Voucher
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-gray-500">Đang tải...</div>}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((v) => {
              const isExpired = v.endDate ? new Date(v.endDate) < new Date() : false;
              const discountText =
                v.discountType === "percentage"
                  ? `${v.discountValue}%`
                  : `${Number(v.discountValue).toLocaleString()}đ`;
              return (
                <div key={v._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{v.code}</h3>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${v.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {v.isActive ? (isExpired ? "Hết hạn" : "Hoạt động") : "Không hoạt động"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Percent size={16} />
                      <span>{discountText}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>HSD: {formatDisplayDate(v.endDate)}</span>
                    </div>
                    {v.minPurchase ? (
                      <div className="text-sm text-gray-500">Min purchase: {Number(v.minPurchase).toLocaleString()}đ</div>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleView(v)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2">
                      <Eye size={16} /> Chi tiết
                    </button>
                    <button onClick={() => handleEdit(v)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(v._id)} className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">Không tìm thấy voucher nào</div>
        )}

        {/* Modal add/edit */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">{selectedVoucher ? "Cập nhật Voucher" : "Thêm Voucher mới"}</h2>
                <button onClick={closeModal} className="modal-close"><X size={20} /></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Mã Voucher *</label>
                    <input name="code" value={formData.code} onChange={handleInputChange} className="form-input" required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mô tả *</label>
                    <input name="description" value={formData.description} onChange={handleInputChange} className="form-input" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Kiểu giảm *</label>
                      <select name="discountType" value={formData.discountType} onChange={handleInputChange} className="form-input" required>
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed (VNĐ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Giá trị giảm *</label>
                      <input name="discountValue" value={formData.discountValue} onChange={handleInputChange} type="number" step="any" className="form-input" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Min purchase</label>
                      <input name="minPurchase" value={formData.minPurchase} onChange={handleInputChange} type="number" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Max discount</label>
                      <input name="maxDiscount" value={formData.maxDiscount} onChange={handleInputChange} type="number" className="form-input" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Start date *</label>
                      <input name="startDate" value={formData.startDate} onChange={handleInputChange} type="date" className="form-input" required />
                    </div>
                    <div>
                      <label className="form-label">End date *</label>
                      <input name="endDate" value={formData.endDate} onChange={handleInputChange} type="date" className="form-input" required />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4" />
                    <label className="text-sm">Đang hoạt động</label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">Hủy</button>
                    <button type="submit" disabled={loading} className="btn btn-primary flex-1">{selectedVoucher ? "Cập nhật" : "Thêm mới"}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Detail modal */}
        {showDetailModal && selectedVoucher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Chi tiết Voucher</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedVoucher.code}</h3>
                <p className="text-sm text-gray-600 mb-2">{selectedVoucher.description}</p>
                <div className="mt-4">
                  <div className="font-semibold">Giảm giá:</div>
                  <div>{selectedVoucher.discountType === "percentage" ? `${selectedVoucher.discountValue}%` : `${Number(selectedVoucher.discountValue).toLocaleString()}đ`}</div>
                </div>
                <div className="mt-4">
                  <div className="font-semibold">Hết hạn:</div>
                  <div>{formatDisplayDate(selectedVoucher.endDate)}</div>
                </div>
                <div className="mt-4">
                  <div className="font-semibold">Trạng thái:</div>
                  <div>{selectedVoucher.isActive ? "Hoạt động" : "Không hoạt động"}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default VoucherPage;
