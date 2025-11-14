import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../../style/employee.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function EmployeeBookingFlow() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // step 1 - showtime filters
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [showtimes, setShowtimes] = useState([]);
  const [movie, setMovie] = useState(null);

  // step 2 - seats
  const [seatData, setSeatData] = useState({ seats: [] });
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [holding, setHolding] = useState(false);

  // step 3 - extras
  const [combos, setCombos] = useState([]);
  const [comboQty, setComboQty] = useState({});
  const [voucherId, setVoucherId] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(''); // 'cash' | 'qr'

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  // read query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qBranch = params.get('branchId');
    const qDate = params.get('date');
    if (qBranch) setBranchId(qBranch);
    if (qDate) setDate(qDate);
  }, [location.search]);

  // bootstrap data
  useEffect(() => {
    (async () => {
      try {
        const [{ data: brs }, { data: mv }, { data: cmb }] = await Promise.all([
          axios.get(`${API_BASE}/branches`),
          movieId ? axios.get(`${API_BASE}/movies/${movieId}`) : Promise.resolve({ data: null }),
          axios.get(`${API_BASE}/combos`)
        ]);
        setBranches(Array.isArray(brs) ? brs : []);
        setMovie(mv || null);
        setCombos(Array.isArray(cmb) ? cmb : []);
      } catch {
        // ignore
      }
    })();
  }, [movieId]);

  // list showtimes
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set('date', date);
        if (branchId) params.set('branchId', branchId);
        if (movieId) params.set('movieId', movieId);
        const { data } = await axios.get(`${API_BASE}/showtimes/public?${params.toString()}`);
        setShowtimes(data || []);
      } catch {
        setShowtimes([]);
      }
    })();
  }, [date, branchId, movieId]);

  // seats by showtime
  const fetchSeats = async (showtimeId) => {
    const { data } = await axios.get(`${API_BASE}/bookings/showtimes/${showtimeId}/seats`);
    setSeatData(data);
  };

  useEffect(() => {
    if (!selectedShowtime) return;
    fetchSeats(selectedShowtime._id);
    const id = setInterval(() => fetchSeats(selectedShowtime._id), 5000);
    return () => clearInterval(id);
  }, [selectedShowtime]);

  // derived
  const seatsGrouped = useMemo(() => {
    const byRow = {};
    for (const s of seatData.seats || []) {
      byRow[s.row] = byRow[s.row] || [];
      byRow[s.row].push(s);
    }
    for (const row of Object.keys(byRow)) {
      byRow[row].sort((a, b) => a.number - b.number);
    }
    return byRow;
  }, [seatData]);

  const selectedSeats = (seatData.seats || []).filter((s) => selectedSeatIds.includes(s.seatId));
  const seatsSubtotal = selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0);
  const combosSubtotal = Object.entries(comboQty).reduce((sum, [id, q]) => {
    const c = combos.find((x) => x._id === id);
    return sum + (Number(q) || 0) * (c?.price || 0);
  }, 0);
  const subtotal = seatsSubtotal + combosSubtotal;

  // voucher preview
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setVoucherDiscount(0);
        setVoucherMsg('');
        if (!voucherId || !selectedShowtime) return;
        const { data: vouchers } = await axios.get(`${API_BASE}/vouchers`);
        const v = (vouchers || []).find((x) => String(x.code).toLowerCase() === String(voucherId).toLowerCase());
        if (!v) { setVoucherMsg('Mã không tồn tại'); return; }
        const now = new Date();
        const validDate = now >= new Date(v.startDate) && now <= new Date(v.endDate);
        const activeVoucher = v.isActive !== false;
        const movieOk = !v.applicableMovies?.length || v.applicableMovies.includes(selectedShowtime.movie?._id || movieId);
        const branchOk = !v.applicableBranches?.length || v.applicableBranches.includes(branchId);
        const base = seatsSubtotal + combosSubtotal;
        if (!validDate || !activeVoucher || !movieOk || !branchOk || base < (v.minPurchase || 0)) {
          setVoucherMsg('Voucher không áp dụng cho lựa chọn hiện tại');
          return;
        }
        let disc = 0;
        if (v.discountType === 'percentage') disc = Math.floor((base * v.discountValue) / 100);
        else if (v.discountType === 'fixed') disc = Math.floor(v.discountValue);
        if (v.maxDiscount && v.maxDiscount > 0) disc = Math.min(disc, v.maxDiscount);
        if (!active) return;
        setVoucherDiscount(disc);
        setVoucherMsg(`Áp dụng: giảm ${disc.toLocaleString()}đ`);
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, [voucherId, selectedShowtime, seatsSubtotal, combosSubtotal, branchId, movieId]);

  // actions
  const formatTime = (iso) => {
    try {
      return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
    } catch {
      return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const toggleSeat = (seatId) => {
    setSelectedSeatIds((prev) => prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]);
  };

  const holdSelected = async () => {
    if (!selectedShowtime || selectedSeatIds.length === 0) return;
    setHolding(true);
    try {
      await axios.post(
        `${API_BASE}/bookings/showtimes/${selectedShowtime._id}/hold`,
        { seatIds: selectedSeatIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchSeats(selectedShowtime._id);
    } catch { /* ignore */ }
    finally { setHolding(false); }
  };

  const confirmBooking = async () => {
    if (!selectedShowtime || selectedSeatIds.length === 0) return;
    if (!paymentMethod) {
      alert('Vui lòng chọn phương thức thanh toán (Tiền mặt hoặc QR)');
      return;
    }
    try {
      // ensure seats are held
      const seatsMap = Object.fromEntries((seatData.seats || []).map(s => [String(s.seatId), s]));
      const notHeld = selectedSeatIds.filter(id => {
        const s = seatsMap[String(id)];
        return !(s && s.status === 'reserved' && s.reservedBy && user?._id && s.reservedBy === user._id);
      });
      if (notHeld.length) {
        await axios.post(
          `${API_BASE}/bookings/showtimes/${selectedShowtime._id}/hold`,
          { seatIds: notHeld },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchSeats(selectedShowtime._id);
      }

      const seats = selectedSeatIds.map((seatId) => ({ seatId }));
      const combosPayload = Object.entries(comboQty)
        .filter(([, q]) => Number(q) > 0)
        .map(([combo, quantity]) => {
          const comboObj = combos.find((c) => c._id === combo);
          return { combo, quantity: Number(quantity), price: comboObj?.price || 0 };
        });
      const { data } = await axios.post(
        `${API_BASE}/bookings`,
        { 
          showtimeId: selectedShowtime._id, 
          seats, 
          combos: combosPayload, 
          voucher: voucherId || null,
          paymentMethod 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data?.booking?._id) {
        navigate(`/employee/purchase/${data.booking._id}`);
      } else {
        alert('Đặt vé thành công');
        setSelectedSeatIds([]);
        await fetchSeats(selectedShowtime._id);
      }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Đặt vé thất bại';
      alert(msg);
    }
  };

  return (
    <div className="emp-page">
      <div className="emp-header">
        <h1>Đặt vé cho khách</h1>
        <ol className="emp-steps">
          <li>Chọn phim</li>
          <li className={selectedShowtime ? '' : 'active'}>Chọn suất chiếu</li>
          <li className={selectedShowtime ? 'active' : ''}>Chọn ghế</li>
          <li>Thanh toán</li>
          <li>Xác nhận/in vé</li>
        </ol>
      </div>

      {/* Movie header brief */}
      {movie && (
        <div className="emp-card" style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="emp-card-thumb" style={{ width: 80, aspectRatio: '2 / 3' }}>
              <img src={movie.poster} alt={movie.title} />
            </div>
            <div>
              <div className="emp-card-title" style={{ fontSize: 16 }}>{movie.title}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: filters, combos, voucher */}
        <div className="space-y-6">
          {/* Filters */}
          <div className="emp-card" style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <div>
                <label className="emp-section-title" style={{ margin: 0, fontSize: 14 }}>Ngày</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border px-3 py-2 rounded w-full" />
              </div>
              <div>
                <label className="emp-section-title" style={{ margin: 0, fontSize: 14 }}>Chi nhánh</label>
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="border px-3 py-2 rounded w-full">
                  <option value="">Tất cả</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Combos */}
          <div className="emp-card" style={{ padding: 16 }}>
            <label className="emp-section-title" style={{ marginTop: 0 }}>Combo</label>
            <div className="space-y-2">
              {combos.map((c) => (
                <div key={c._id} className="flex items-center justify-between gap-2">
                  <div className="text-sm text-gray-700">{c.name} - {(c.price || 0).toLocaleString()}đ</div>
                  <input
                    type="number"
                    min="0"
                    value={comboQty[c._id] || 0}
                    onChange={(e) => setComboQty((prev) => ({ ...prev, [c._id]: e.target.value }))}
                    className="w-20 border px-2 py-1 rounded"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Voucher */}
          <div className="emp-card" style={{ padding: 16 }}>
            <label className="emp-section-title" style={{ marginTop: 0 }}>Voucher code</label>
            <input value={voucherId} onChange={(e) => setVoucherId(e.target.value)} className="border px-3 py-2 rounded w-full" placeholder="Nhập mã voucher (tùy chọn)" />
            {voucherMsg ? <div className={`text-xs mt-1 ${voucherDiscount>0?'text-green-600':'text-gray-500'}`}>{voucherMsg}</div> : null}
          </div>

          {/* Summary */}
          <div className="emp-card" style={{ padding: 16 }}>
            <div className="text-sm text-gray-600">Ghế đã chọn: {selectedSeats.length ? selectedSeats.map(s => `${s.row}${s.number}`).join(', ') : '—'}</div>
            <div className="flex justify-between text-sm mt-2"><span>Tiền vé</span><span>{seatsSubtotal.toLocaleString()}đ</span></div>
            <div className="flex justify-between text-sm"><span>Combo</span><span>{combosSubtotal.toLocaleString()}đ</span></div>
            {voucherDiscount>0 && (
              <div className="flex justify-between text-sm text-green-700"><span>Giảm giá (voucher)</span><span>-{voucherDiscount.toLocaleString()}đ</span></div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold"><span>Tạm tính</span><span>{(subtotal - voucherDiscount).toLocaleString()}đ</span></div>
          </div>
        </div>

        {/* Right column: showtimes then seat map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="emp-card" style={{ padding: 16 }}>
            <div className="emp-section-title" style={{ marginTop: 0 }}>Suất chiếu</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {showtimes.map((st) => (
                <button
                  key={st._id}
                  onClick={async () => { setSelectedShowtime(st); setSelectedSeatIds([]); await fetchSeats(st._id); }}
                  className={`emp-chip ${selectedShowtime?._id === st._id ? 'emp-chip--active' : ''}`}
                  title={`${st.theater?.name || ''}`}
                >
                  <div style={{ fontWeight: 600 }}>{formatTime(st.startTime)} - {formatTime(st.endTime)}</div>
                  {st.theater?.name ? <div className="emp-chip-sub">{st.theater.name}</div> : null}
                </button>
              ))}
              {!showtimes.length && <div className="emp-loading">Không có suất chiếu phù hợp.</div>}
            </div>
          </div>

          <div className="emp-card" style={{ padding: 16 }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">Màn hình</div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1"><span className="w-4 h-4 inline-block border bg-white" /> Trống</div>
                <div className="flex items-center gap-1"><span className="w-4 h-4 inline-block border bg-green-600" /> Đã chọn</div>
                <div className="flex items-center gap-1"><span className="w-4 h-4 inline-block border bg-yellow-400" /> Giữ chỗ</div>
                <div className="flex items-center gap-1"><span className="w-4 h-4 inline-block border bg-gray-700" /> Đã đặt</div>
              </div>
            </div>

            <div className="space-y-2 overflow-auto" style={{ maxHeight: '60vh' }}>
              {Object.entries(seatsGrouped).map(([row, arr]) => (
                <div key={row} className="flex items-center gap-2">
                  <div className="w-10 text-right mr-2 text-sm text-gray-600">{row}</div>
                  <div className="flex gap-1 flex-wrap">
                    {arr.map((s) => {
                      const isSelected = selectedSeatIds.includes(s.seatId);
                      const disabled = s.status === 'booked' || s.status === 'reserved' || seatData.hasStarted;
                      // Remaining seconds if seat reserved by current user
                      let remain = null;
                      if (s.expiresAt && s.reservedBy && user?._id && s.reservedBy === user._id) {
                        const diff = Math.max(0, Math.floor((new Date(s.expiresAt).getTime() - Date.now()) / 1000));
                        remain = diff;
                      }
                      return (
                        <button
                          key={s.seatId}
                          disabled={disabled}
                          onClick={() => toggleSeat(s.seatId)}
                          className={`w-9 h-9 text-xs rounded border transition ${
                            s.status === 'booked' ? 'bg-gray-700 text-white cursor-not-allowed' :
                            s.status === 'reserved' ? 'bg-yellow-400 cursor-not-allowed' :
                            isSelected ? 'bg-green-600 text-white' : 'bg-white hover:bg-gray-100'
                          }`}
                          title={`${row}${s.number} - ${s.type} - ${s.price.toLocaleString()}đ`}
                        >
                          {remain !== null ? Math.ceil(remain/60) : s.number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment method selection */}
            <div className="mt-4 p-3 border rounded bg-white flex flex-wrap items-center gap-4">
              <div className="text-sm font-medium text-gray-700 mr-2">Phương thức thanh toán:</div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Tiền mặt</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="qr"
                  checked={paymentMethod === 'qr'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Mã QR</span>
              </label>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button onClick={holdSelected} disabled={!selectedShowtime || selectedSeatIds.length===0 || holding} className="bg-yellow-500 text-white px-4 py-2 rounded shadow disabled:opacity-50">
                Giữ chỗ 1 phút
              </button>
              <button onClick={confirmBooking} disabled={!selectedShowtime || selectedSeatIds.length===0 || !paymentMethod} className="bg-blue-600 text-white px-4 py-2 rounded shadow disabled:opacity-50">
                Xác nhận đặt vé
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


