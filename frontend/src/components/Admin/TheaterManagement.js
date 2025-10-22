import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, X, Monitor, Calendar, MapPin, Settings } from 'lucide-react';
import AdminLayout from './AdminLayout';

// FormField component
const FormField = ({ label, type = "text", required, className, ...props }) => {
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea className={className || inputClass} rows="3" {...props} />
      ) : type === 'select' ? (
        <select className={className || inputClass} {...props}>
          {props.children}
        </select>
      ) : (
        <input type={type} className={className || inputClass} {...props} />
      )}
    </div>
  );
};

// Theater Card Component
const TheaterCard = ({ theater, onViewDetail, onViewSchedule, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Monitor size={24} className="text-blue-600" />
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{theater.name}</h3>
          </div>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        {theater.seatLayout && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Số hàng ghế:</span>
              <span className="text-sm font-medium">{theater.seatLayout.rows || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ghế mỗi hàng:</span>
              <span className="text-sm font-medium">{theater.seatLayout.seatsPerRow || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tổng ghế:</span>
              <span className="text-sm font-bold text-blue-600">
                {(theater.seatLayout.rows || 0) * (theater.seatLayout.seatsPerRow || 0)} ghế
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Hàng VIP:</span>
              <span className="text-sm font-medium text-yellow-600">
                {(theater.seatLayout.vipRows || []).length} hàng
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ghế đôi:</span>
              <span className="text-sm font-medium text-pink-600">
                {(theater.seatLayout.coupleSeats || []).length} cặp
              </span>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onViewDetail(theater)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Eye size={16} />
          Xem
        </button>
        <button
          onClick={() => onViewSchedule(theater)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
        >
          <Calendar size={16} />
          Lịch
        </button>
        <button
          onClick={() => onEdit(theater)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
        >
          <Edit2 size={16} />
          Sửa
        </button>
        <button
          onClick={() => onDelete(theater._id)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
        >
          <Trash2 size={16} />
          Xóa
        </button>
      </div>
    </div>
  </div>
);

// Seat Layout Designer Component
const SeatLayoutDesigner = ({ layout, onLayoutChange, theater }) => {
  const [showDesigner, setShowDesigner] = useState(false);
  const [editMode, setEditMode] = useState('disable'); // 'disable', 'couple'
  const [selectedCoupleStart, setSelectedCoupleStart] = useState(null);
  
  const updateLayout = (field, value) => {
    const newLayout = {
      ...layout,
      [field]: value
    };
    
    // Auto-generate rowLabels when rows change
    if (field === 'rows' && value > 0) {
      newLayout.rowLabels = Array.from({length: value}, (_, i) => String.fromCharCode(65 + i));
    }
    
    onLayoutChange(newLayout);
  };

  const toggleVipRow = (rowLabel) => {
    if (!rowLabel) return; // Prevent adding null/undefined
    
    const vipRows = (layout.vipRows || []).filter(r => r !== null && r !== undefined); // Clean existing nulls
    const newVipRows = vipRows.includes(rowLabel)
      ? vipRows.filter(r => r !== rowLabel)
      : [...vipRows, rowLabel];
    updateLayout('vipRows', newVipRows);
  };

  const toggleDisabledSeat = (row, number) => {
    const disabledSeats = layout.disabledSeats || [];
    const seatExists = disabledSeats.find(s => s.row === row && s.number === number);
    
    const newDisabledSeats = seatExists
      ? disabledSeats.filter(s => !(s.row === row && s.number === number))
      : [...disabledSeats, { row, number }];
    
    updateLayout('disabledSeats', newDisabledSeats);
  };

  const toggleCoupleSeat = (row, number) => {
    const coupleSeats = layout.coupleSeats || [];
    
    // Check if this seat is already in a couple
    const existingCouple = coupleSeats.find(c => 
      c.row === row && number >= c.startSeat && number <= c.endSeat
    );
    
    if (existingCouple) {
      // Remove the couple
      const newCoupleSeats = coupleSeats.filter(c => 
        !(c.row === row && c.startSeat === existingCouple.startSeat)
      );
      updateLayout('coupleSeats', newCoupleSeats);
      setSelectedCoupleStart(null);
      return;
    }

    if (!selectedCoupleStart) {
      // First seat selected
      setSelectedCoupleStart({ row, number });
    } else {
      // Second seat selected
      if (selectedCoupleStart.row === row && Math.abs(selectedCoupleStart.number - number) === 1) {
        // Valid couple (same row, adjacent seats)
        const newCouple = {
          row,
          startSeat: Math.min(selectedCoupleStart.number, number),
          endSeat: Math.max(selectedCoupleStart.number, number)
        };
        updateLayout('coupleSeats', [...coupleSeats, newCouple]);
      }
      setSelectedCoupleStart(null);
    }
  };

  const handleSeatClick = (row, number) => {
    if (editMode === 'disable') {
      toggleDisabledSeat(row, number);
    } else if (editMode === 'couple') {
      toggleCoupleSeat(row, number);
    }
  };

  const isCoupleSeat = (rowLabel, seatNumber) => {
    const coupleSeats = layout.coupleSeats || [];
    return coupleSeats.find(c => 
      c.row === rowLabel && seatNumber >= c.startSeat && seatNumber <= c.endSeat
    );
  };

  const getSeatClass = (rowLabel, seatNumber) => {
    const isVip = (layout.vipRows || []).includes(rowLabel);
    const isDisabled = (layout.disabledSeats || []).find(s => s.row === rowLabel && s.number === seatNumber);
    const isCouple = isCoupleSeat(rowLabel, seatNumber);
    const isSelected = selectedCoupleStart?.row === rowLabel && selectedCoupleStart?.number === seatNumber;
    
    if (isDisabled) return 'bg-gray-400 cursor-not-allowed';
    if (isCouple) return 'bg-pink-500 hover:bg-pink-600 cursor-pointer';
    if (isSelected) return 'bg-green-500 border-2 border-green-700 cursor-pointer';
    if (isVip) return 'bg-yellow-400 hover:bg-yellow-500 cursor-pointer';
    return 'bg-blue-400 hover:bg-blue-500 cursor-pointer';
  };

  const renderSeatLayout = () => {
    if (!layout.rows || !layout.seatsPerRow) return null;

    const rows = [];
    // Generate row labels if empty or undefined
    const rowLabels = (layout.rowLabels && layout.rowLabels.length > 0) 
      ? layout.rowLabels 
      : Array.from({length: layout.rows}, (_, i) => String.fromCharCode(65 + i));

    for (let i = 0; i < layout.rows; i++) {
      const rowLabel = rowLabels[i];
      if (!rowLabel) continue; // Skip if rowLabel is undefined
      
      const seats = [];
      
      for (let j = 1; j <= layout.seatsPerRow; j++) {
        const isCouple = isCoupleSeat(rowLabel, j);
        seats.push(
          <button
            key={`${rowLabel}-${j}`}
            type="button"
            className={`w-6 h-6 m-0.5 text-xs text-white ${getSeatClass(rowLabel, j)} ${
              isCouple ? 'rounded-lg' : 'rounded'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSeatClick(rowLabel, j);
            }}
            title={`${rowLabel}${j} - ${editMode === 'couple' ? 'Click để tạo ghế đôi' : 'Click để toggle ghế'}`}
          >
            {j}
          </button>
        );
      }
      
      rows.push(
        <div key={`row-${i}-${rowLabel}`} className="flex items-center mb-1">
          <button
            type="button"
            className={`w-8 h-6 mr-2 rounded text-xs font-bold border-2 ${
              (layout.vipRows || []).includes(rowLabel)
                ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                : 'bg-gray-100 border-gray-400 text-gray-800'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleVipRow(rowLabel);
            }}
            title="Click để toggle hàng VIP"
          >
            {rowLabel}
          </button>
          <div className="flex">{seats}</div>
        </div>
      );
    }

    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="mb-4">
          <div className="text-center mb-2">
            <div className="inline-block bg-gray-800 text-white px-8 py-2 rounded">MÀN HÌNH</div>
          </div>
        </div>
        <div className="text-center">
          {rows}
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-400 rounded"></div>
              <span>Ghế thường</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Ghế VIP</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-pink-500 rounded-lg"></div>
              <span>Ghế đôi</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span>Ghế tắt</span>
            </div>
          </div>
          
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation();
                setEditMode('disable'); 
                setSelectedCoupleStart(null); 
              }}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                editMode === 'disable' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🚫 Tắt ghế
            </button>
            <button
              type="button"
              onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation();
                setEditMode('couple'); 
                setSelectedCoupleStart(null); 
              }}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                editMode === 'couple' 
                  ? 'bg-pink-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              💑 Tạo ghế đôi
            </button>
          </div>
          
          {editMode === 'couple' && selectedCoupleStart && (
            <div className="text-center text-xs text-blue-600 font-medium">
              ✓ Đã chọn ghế {selectedCoupleStart.row}{selectedCoupleStart.number}. Click ghế kế bên để tạo cặp.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Sơ đồ ghế ngồi</h3>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowDesigner(!showDesigner);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Settings size={16} />
          {showDesigner ? 'Ẩn thiết kế' : 'Thiết kế ghế'}
        </button>
      </div>

      {showDesigner && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Số hàng"
              type="number"
              min="1"
              max="20"
              value={layout.rows || ''}
              onChange={(e) => updateLayout('rows', parseInt(e.target.value) || 0)}
            />
            <FormField
              label="Số ghế mỗi hàng"
              type="number"
              min="1"
              max="30"
              value={layout.seatsPerRow || ''}
              onChange={(e) => updateLayout('seatsPerRow', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <FormField
            label="Tên layout"
            value={layout.name || ''}
            onChange={(e) => updateLayout('name', e.target.value)}
            placeholder="VD: Layout Standard, Layout VIP..."
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <h4 className="font-semibold text-blue-900 mb-2">📝 Hướng dẫn:</h4>
            <ul className="space-y-1 text-blue-800">
              <li>• Click vào <span className="font-bold">chữ hàng (A, B, C...)</span> để chuyển đổi hàng VIP</li>
              <li>• Chọn mode <span className="font-bold">"🚫 Tắt ghế"</span>, click ghế để vô hiệu hóa/kích hoạt ghế</li>
              <li>• Chọn mode <span className="font-bold">"💑 Tạo ghế đôi"</span>, click 2 ghế kế bên để tạo cặp</li>
              <li>• Ghế VIP sẽ có giá cao hơn ghế thường</li>
              <li>• Ghế đôi có thể đặt bởi 1 người (giá = 2 ghế)</li>
            </ul>
          </div>
        </div>
      )}

      {layout.rows && layout.seatsPerRow && renderSeatLayout()}
    </div>
  );
};

const TheaterManagement = () => {
  const [state, setState] = useState({
    theaters: [],
    branches: [],
    searchTerm: '',
    selectedBranch: '', // Thêm state để lọc theo chi nhánh
    loading: true,
    showForm: false,
    showDetailModal: false,
    showScheduleModal: false,
    editingTheater: null,
    formData: { 
      name: '', 
      branch: '', 
      seatLayout: {
        name: '',
        rows: 8,
        seatsPerRow: 12,
        rowLabels: Array.from({length: 8}, (_, i) => String.fromCharCode(65 + i)),
        vipRows: [],
        disabledSeats: [],
        coupleSeats: []
      }
    },
    message: { type: '', text: '' }
  });

  const API_BASE = 'http://localhost:5000/api';

  const showMessage = (type, text) => setState(prev => ({ 
    ...prev, message: { type, text } 
  }));

  const updateFormField = (field, value) => setState(prev => ({
    ...prev, 
    formData: { ...prev.formData, [field]: value }
  }));

  const updateSeatLayout = (layoutData) => setState(prev => ({
    ...prev,
    formData: { ...prev.formData, seatLayout: layoutData }
  }));

  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  // Create headers with token
  const getHeaders = useCallback(() => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }, []);

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
      setState(prev => ({ ...prev, loading: true }));
      const [theatersRes, branchesRes] = await Promise.all([
        fetch(`${API_BASE}/theaters`, { headers: getHeaders() }),
        fetch(`${API_BASE}/branches`, { headers: getHeaders() })
      ]);
      
      if (theatersRes.ok && branchesRes.ok) {
        const [theaters, branches] = await Promise.all([
          theatersRes.json(),
          branchesRes.json()
        ]);
        setState(prev => ({ ...prev, theaters, branches, loading: false }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
        showMessage('error', 'Lỗi khi tải dữ liệu');
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      showMessage('error', 'Lỗi khi tải dữ liệu');
    }
  }, [getHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, branch, seatLayout } = state.formData;
    
    if (!name || !branch) {
      return showMessage('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }

    if (!seatLayout.name || !seatLayout.rows || !seatLayout.seatsPerRow) {
      return showMessage('error', 'Vui lòng hoàn thành thiết kế sơ đồ ghế');
    }

    const submitData = {
      name: name.trim(),
      branch,
      seatLayout: {
        ...seatLayout,
        name: seatLayout.name.trim()
      }
    };

    try {
      const url = state.editingTheater 
        ? `${API_BASE}/theaters/${state.editingTheater._id}` 
        : `${API_BASE}/theaters`;
      
      const response = await fetch(url, {
        method: state.editingTheater ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        await fetchData();
        resetForm();
        showMessage('success', `Phòng chiếu ${state.editingTheater ? 'cập nhật' : 'tạo'} thành công!`);
      } else {
        const error = await response.json();
        showMessage('error', error.message || 'Thao tác thất bại');
      }
    } catch (error) {
      showMessage('error', 'Lỗi khi lưu phòng chiếu');
    }
  };

  const handleEdit = (theater) => {
    console.log('Editing theater:', theater);
    
    const rows = theater.seatLayout?.rows || 8;
    const rowLabels = (theater.seatLayout?.rowLabels && theater.seatLayout.rowLabels.length > 0)
      ? theater.seatLayout.rowLabels
      : Array.from({length: rows}, (_, i) => String.fromCharCode(65 + i));
    
    // Clean vipRows to remove null/undefined
    const vipRows = (theater.seatLayout?.vipRows || []).filter(r => r !== null && r !== undefined);
    
    setState(prev => ({
      ...prev, 
      editingTheater: theater, 
      showForm: true,
      formData: { 
        name: theater.name || '',
        branch: theater.branch?._id || theater.branch || '',
        seatLayout: {
          name: theater.seatLayout?.name || '',
          rows: rows,
          seatsPerRow: theater.seatLayout?.seatsPerRow || 12,
          rowLabels: rowLabels,
          vipRows: vipRows,
          disabledSeats: theater.seatLayout?.disabledSeats || [],
          coupleSeats: theater.seatLayout?.coupleSeats || [],
          aisleAfterColumns: theater.seatLayout?.aisleAfterColumns || [],
          screenPosition: theater.seatLayout?.screenPosition || { x: 0, y: 0, width: 100 }
        }
      }
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng chiếu này?')) return;
    try {
      const response = await fetch(`${API_BASE}/theaters/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      if (response.ok) {
        await fetchData();
        showMessage('success', 'Phòng chiếu đã xóa thành công!');
      } else {
        showMessage('error', 'Lỗi khi xóa phòng chiếu');
      }
    } catch (error) {
      showMessage('error', 'Lỗi khi thao tác phòng chiếu');
    }
  };

  const resetForm = () => setState(prev => ({
    ...prev, 
    formData: { 
      name: '', 
      branch: '', 
      seatLayout: {
        name: '',
        rows: 8,
        seatsPerRow: 12,
        rowLabels: Array.from({length: 8}, (_, i) => String.fromCharCode(65 + i)),
        vipRows: [],
        disabledSeats: [],
        coupleSeats: []
      }
    },
    editingTheater: null, 
    showForm: false
  }));

  const handleViewDetail = (theater) => setState(prev => ({
    ...prev, editingTheater: theater, showDetailModal: true
  }));

  const handleViewSchedule = (theater) => setState(prev => ({
    ...prev, editingTheater: theater, showScheduleModal: true
  }));

  const closeModal = (modalType) => setState(prev => ({
    ...prev, [modalType]: false
  }));

  const filteredTheaters = state.theaters.filter(theater => {
    const matchesSearch = 
      (theater.name || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (theater.branch?.name || '').toLowerCase().includes(state.searchTerm.toLowerCase());
    
    const matchesBranch = !state.selectedBranch || 
      theater.branch?._id === state.selectedBranch || 
      theater.branch === state.selectedBranch;
    
    return matchesSearch && matchesBranch;
  });

  const getBranchName = (branchId) => {
    const branch = state.branches.find(b => b._id === branchId);
    return branch ? branch.name : 'N/A';
  };

  if (state.loading) {
    return (
      <AdminLayout title="Quản Lý Phòng Chiếu">
        <div className="p-6">
          <div className="text-center py-12 text-gray-500">Đang tải danh sách phòng chiếu...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản Lý Phòng Chiếu">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Phòng Chiếu</h1>
          <p className="text-gray-600">Quản lý thông tin các phòng chiếu và sơ đồ ghế ngồi</p>
        </div>

        {state.message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            state.message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {state.message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="relative md:col-span-5">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên phòng chiếu..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={state.searchTerm}
                onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>
            
            <div className="relative md:col-span-4">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
              <select
                value={state.selectedBranch}
                onChange={(e) => setState(prev => ({ ...prev, selectedBranch: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="">🎬 Tất cả chi nhánh</option>
                {state.branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setState(prev => ({ ...prev, showForm: true }))}
              className="md:col-span-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Thêm Phòng Chiếu
            </button>
          </div>
          
          {/* Stats Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{state.theaters.length}</p>
                <p className="text-sm text-gray-600">Tổng phòng chiếu</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{filteredTheaters.length}</p>
                <p className="text-sm text-gray-600">Đang hiển thị</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{state.branches.length}</p>
                <p className="text-sm text-gray-600">Chi nhánh</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {state.theaters.reduce((total, t) => total + ((t.seatLayout?.rows || 0) * (t.seatLayout?.seatsPerRow || 0)), 0)}
                </p>
                <p className="text-sm text-gray-600">Tổng ghế</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {state.showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {state.editingTheater ? "Chỉnh Sửa Phòng Chiếu" : "Thêm Phòng Chiếu Mới"}
                  </h2>
                  <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Tên phòng chiếu"
                      required
                      value={state.formData.name}
                      onChange={(e) => updateFormField('name', e.target.value)}
                      placeholder="VD: Phòng 1, Theater A..."
                    />
                    
                    <FormField
                      label="Chi nhánh"
                      type="select"
                      required
                      value={state.formData.branch}
                      onChange={(e) => updateFormField('branch', e.target.value)}
                    >
                      <option value="">Chọn chi nhánh</option>
                      {state.branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </FormField>
                  </div>

                  <SeatLayoutDesigner
                    layout={state.formData.seatLayout}
                    onLayoutChange={updateSeatLayout}
                    theater={state.editingTheater}
                  />

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
                      {state.editingTheater ? "Cập nhật" : "Tạo phòng chiếu"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {state.showDetailModal && state.editingTheater && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Chi Tiết Phòng Chiếu</h2>
                  <button
                    onClick={() => closeModal('showDetailModal')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Monitor size={24} className="text-blue-600" />
                    <div>
                      <h3 className="text-xl font-semibold">{state.editingTheater.name}</h3>
                      <p className="text-gray-600">Chi nhánh: {getBranchName(state.editingTheater.branch?._id || state.editingTheater.branch)}</p>
                    </div>
                  </div>

                  {state.editingTheater.seatLayout && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Sơ đồ ghế ngồi</h4>
                      <SeatLayoutDesigner
                        layout={state.editingTheater.seatLayout}
                        onLayoutChange={() => {}}
                        theater={state.editingTheater}
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setState(prev => ({ ...prev, showDetailModal: false }));
                        handleEdit(state.editingTheater);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => closeModal('showDetailModal')}
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

        {/* Schedule Modal */}
        {state.showScheduleModal && state.editingTheater && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    Lịch Chiếu - {state.editingTheater.name}
                  </h2>
                  <button
                    onClick={() => closeModal('showScheduleModal')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800">
                      <strong>Lưu ý:</strong> Chức năng quản lý lịch chiếu chi tiết sẽ được triển khai trong phần "Quản Lý Lịch Chiếu" riêng biệt.
                    </p>
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          closeModal('showScheduleModal');
                          // Navigate to showtime management - implement later
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Đi tới Quản Lý Lịch Chiếu
                      </button>
                    </div>
                  </div>

                  <div className="text-center text-gray-500 py-8">
                    <Monitor size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>Tính năng quản lý lịch chiếu đang được phát triển</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => closeModal('showScheduleModal')}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Theaters Grid - Grouped by Branch */}
        {state.selectedBranch ? (
          // Hiển thị theo grid khi đã chọn chi nhánh
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <MapPin size={20} className="text-blue-600" />
                {getBranchName(state.selectedBranch)}
                <span className="text-sm font-normal text-gray-500">
                  ({filteredTheaters.length} phòng chiếu)
                </span>
              </h2>
              <button
                onClick={() => setState(prev => ({ ...prev, selectedBranch: '' }))}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Xem tất cả
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTheaters.map((theater) => (
                <TheaterCard
                  key={theater._id}
                  theater={theater}
                  onViewDetail={handleViewDetail}
                  onViewSchedule={handleViewSchedule}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            {filteredTheaters.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Chưa có phòng chiếu nào tại chi nhánh này
              </div>
            )}
          </div>
        ) : (
          // Hiển thị nhóm theo chi nhánh khi chưa chọn
          <div className="space-y-8">
            {state.branches.map((branch) => {
              const branchTheaters = filteredTheaters.filter(
                t => t.branch?._id === branch._id || t.branch === branch._id
              );
              
              if (branchTheaters.length === 0) return null;
              
              return (
                <div key={branch._id} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <MapPin size={20} className="text-blue-600" />
                      {branch.name}
                      <span className="text-sm font-normal text-gray-500">
                        ({branchTheaters.length} phòng chiếu)
                      </span>
                    </h2>
                    <button
                      onClick={() => setState(prev => ({ ...prev, selectedBranch: branch._id }))}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      Xem chi tiết
                      <Eye size={14} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branchTheaters.map((theater) => (
                      <TheaterCard
                        key={theater._id}
                        theater={theater}
                        onViewDetail={handleViewDetail}
                        onViewSchedule={handleViewSchedule}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            
            {filteredTheaters.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {state.searchTerm ? "Không tìm thấy phòng chiếu nào phù hợp" : "Chưa có phòng chiếu nào"}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TheaterManagement;