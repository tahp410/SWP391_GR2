import React, { useState } from 'react';
import { Settings } from 'lucide-react';

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

export default SeatLayoutDesigner;


