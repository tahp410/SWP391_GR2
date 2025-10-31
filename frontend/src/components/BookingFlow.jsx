import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function BookingFlow() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [seatData, setSeatData] = useState({ seats: [] });
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [holding, setHolding] = useState(false);
  const [combos, setCombos] = useState([]);
  const [comboQty, setComboQty] = useState({});
  const [voucherId, setVoucherId] = useState('');
  const [movie, setMovie] = useState(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState('');
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/branches`);
        setBranches(data);
      } catch {}
    })();
  }, []);

  // Read preselected branch/date from query (?branchId=&date=YYYY-MM-DD)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qBranch = params.get('branchId');
    const qDate = params.get('date');
    if (qBranch) setBranchId(qBranch);
    if (qDate) setDate(qDate);
  }, [location.search]);

  // Fetch movie detail to show header
  useEffect(() => {
    (async () => {
      try {
        if (movieId) {
          const { data } = await axios.get(`${API_BASE}/movies/${movieId}`);
          setMovie(data);
        }
      } catch {}
    })();
  }, [movieId]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/combos`);
        setCombos(data || []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set('date', date);
        if (branchId) params.set('branchId', branchId);
        if (movieId) params.set('movieId', movieId);
        const { data } = await axios.get(`${API_BASE}/showtimes/public?${params.toString()}`);
        setShowtimes(data);
        // Auto-pick the first upcoming showtime
        if (!selectedShowtime && data && data.length) {
          setSelectedShowtime(data[0]);
          await fetchSeats(data[0]._id);
        }
      } catch {}
    })();
  }, [date, branchId, movieId]);

  const fetchSeats = async (showtimeId) => {
    const { data } = await axios.get(`${API_BASE}/bookings/showtimes/${showtimeId}/seats`);
    setSeatData(data);
  };

  // Poll seats while a showtime is selected
  useEffect(() => {
    if (!selectedShowtime) return;
    const id = setInterval(() => fetchSeats(selectedShowtime._id), 5000);
    return () => clearInterval(id);
  }, [selectedShowtime]);

  // Totals (compute early so hooks below can reference safely)
  const selectedSeats = (seatData.seats || []).filter((s) => selectedSeatIds.includes(s.seatId));
  const seatsSubtotal = selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0);
  const combosSubtotal = Object.entries(comboQty).reduce((sum, [id, q]) => {
    const c = combos.find((x) => x._id === id);
    return sum + (Number(q) || 0) * (c?.price || 0);
  }, 0);
  const subtotal = seatsSubtotal + combosSubtotal;

  // Voucher preview: fetch all vouchers and compute discount
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
      } catch {
        // ignore
      }
    })();
    return () => { active = false; };
  }, [voucherId, selectedShowtime, seatsSubtotal, combosSubtotal, branchId, movieId]);

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
    } catch (e) {
      // ignore
    } finally {
      setHolding(false);
    }
  };

  const confirmBooking = async () => {
    if (!selectedShowtime || selectedSeatIds.length === 0) return;
    try {
      // Auto-hold seats that aren't reserved yet
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
        { showtimeId: selectedShowtime._id, seats, combos: combosPayload, voucher: voucherId || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Đặt vé thành công');
      setSelectedSeatIds([]);
      await fetchSeats(selectedShowtime._id);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Đặt vé thất bại';
      alert(msg);
    }
  };

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

  const vipRowsNote = useMemo(() => {
    const rows = Object.entries(seatsGrouped)
      .filter(([, arr]) => arr.some((s) => s.type === 'vip'))
      .map(([row]) => row)
      .sort();
    return rows;
  }, [seatsGrouped]);

  const coupleRangesNote = useMemo(() => {
    const result = {};
    for (const [row, arr] of Object.entries(seatsGrouped)) {
      const couples = arr.filter((s) => s.type === 'couple').map((s) => s.number).sort((a,b)=>a-b);
      if (!couples.length) continue;
      const ranges = [];
      let start = couples[0], prev = couples[0];
      for (let i = 1; i < couples.length; i++) {
        if (couples[i] === prev + 1) {
          prev = couples[i];
        } else {
          ranges.push([start, prev]);
          start = couples[i];
          prev = couples[i];
        }
      }
      ranges.push([start, prev]);
      result[row] = ranges;
    }
    return result;
  }, [seatsGrouped]);

  const formatTime = (iso) => {
    try {
      return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(iso));
    } catch {
      const d = new Date(iso);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const formatTimeRange = (startIso, endIso) => `${formatTime(startIso)} - ${formatTime(endIso)}`;

  

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Đặt vé</h1>
        <button onClick={() => navigate(-1)} className="px-3 py-2 rounded border hover:bg-gray-100">Quay lại</button>
      </div>

      {/* Movie header */}
      {movie && (
        <div className="mb-6 border rounded-lg bg-white p-4 flex gap-4">
          <img src={movie.poster} alt={movie.title} className="w-24 h-36 object-cover rounded" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">{movie.title}</h2>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              <span className="mr-3">Đạo diễn: {movie.director || '-'}</span>
              <span className="mr-3">Thời lượng: {movie.duration} phút</span>
              <span>Ngôn ngữ: {movie.language}</span>
            </div>
            {selectedShowtime?.price && (
              <div className="mt-2 text-sm">
                <span className="mr-4">Giá ghế thường: <b>{(selectedShowtime.price.standard || 0).toLocaleString()}đ</b></span>
                {selectedShowtime.price.vip ? (
                  <span className="mr-4">VIP: <b>{selectedShowtime.price.vip.toLocaleString()}đ</b></span>
                ) : null}
                {selectedShowtime.price.couple ? (
                  <span>Couple: <b>{selectedShowtime.price.couple.toLocaleString()}đ</b></span>
                ) : null}
              </div>
            )}
            {/* Area note from seat layout types */}
            {(vipRowsNote.length || Object.keys(coupleRangesNote).length) ? (
              <div className="mt-2 text-xs text-gray-700 space-y-1">
                {vipRowsNote.length ? (
                  <div>Hàng VIP: <b>{vipRowsNote.join(', ')}</b></div>
                ) : null}
                {Object.keys(coupleRangesNote).length ? (
                  <div>
                    Ghế Couple: {Object.entries(coupleRangesNote).map(([row, ranges]) => (
                      <span key={row} className="mr-2">{row}{ranges.map(([a,b],i)=>` ${a}${a!==b?'-'+b:''}`)}</span>
                    ))}
                  </div>
                ) : null}
                <div className="text-gray-500">Các ghế còn lại là ghế thường.</div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: filters, combos, voucher */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border px-3 py-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rạp (chi nhánh)</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="border px-3 py-2 rounded w-full">
              <option value="">Tất cả</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suất chiếu</label>
            <div className="flex flex-wrap gap-2">
              {showtimes.map((st) => (
                <button
                  key={st._id}
                  onClick={async () => { setSelectedShowtime(st); setSelectedSeatIds([]); await fetchSeats(st._id); }}
                  className={`px-3 py-2 rounded border transition text-left ${selectedShowtime?._id === st._id ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}
                >
                  <div className="font-semibold">{formatTimeRange(st.startTime, st.endTime)}</div>
                  <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded ${selectedShowtime?._id === st._id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {st.theater?.name || ''}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Combos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Combo</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voucher code</label>
            <input value={voucherId} onChange={(e) => setVoucherId(e.target.value)} className="border px-3 py-2 rounded w-full" placeholder="Nhập mã voucher (tùy chọn)" />
            {voucherMsg ? <div className={`text-xs mt-1 ${voucherDiscount>0?'text-green-600':'text-gray-500'}`}>{voucherMsg}</div> : null}
          </div>

          {/* Summary */}
          <div className="border rounded p-4 space-y-2 bg-white">
            <div className="text-sm text-gray-600">Ghế đã chọn: {selectedSeats.length ? selectedSeats.map(s => `${s.row}${s.number}`).join(', ') : '—'}</div>
            <div className="flex justify-between text-sm"><span>Tiền vé</span><span>{seatsSubtotal.toLocaleString()}đ</span></div>
            <div className="flex justify-between text-sm"><span>Combo</span><span>{combosSubtotal.toLocaleString()}đ</span></div>
            {voucherDiscount>0 && (
              <div className="flex justify-between text-sm text-green-700"><span>Giảm giá (voucher)</span><span>-{voucherDiscount.toLocaleString()}đ</span></div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold"><span>Tạm tính</span><span>{(subtotal - voucherDiscount).toLocaleString()}đ</span></div>
          </div>
        </div>

        {/* Right column: seat map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded p-4 bg-white">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">Màn hình</div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1"><span className="w-4 h-4 inline-block border bg-white" /> Trống</div>
                <div className="flex items-center gap-1"><span className="w-4 h-4 inline-block border bg-green-600" /> Đã chọn</div>
                <div className="flex items-center gap-1"><span className="w-4 h-4 inline-block border bg-yellow-400" /> Giữ chỗ</div>
                <div className="flex items-center gap-1"><span className="w-4 h-4 inline-block border bg-gray-700" /> Đã đặt</div>
              </div>
            </div>
            <div className="space-y-2 overflow-auto max-h-[60vh]">
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
            <div className="mt-4 flex items-center gap-3">
              <button onClick={holdSelected} disabled={!selectedShowtime || selectedSeatIds.length===0 || holding} className="bg-yellow-500 text-white px-4 py-2 rounded shadow disabled:opacity-50">
                Giữ chỗ 1 phút
              </button>
              <button onClick={confirmBooking} disabled={!selectedShowtime || selectedSeatIds.length===0} className="bg-blue-600 text-white px-4 py-2 rounded shadow disabled:opacity-50">
                Xác nhận đặt vé
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


