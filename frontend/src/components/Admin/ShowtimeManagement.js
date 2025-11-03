import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, X, Clock, Film, Monitor, MapPin, DollarSign } from 'lucide-react';
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

const ShowtimeManagement = () => {
  const [state, setState] = useState({
    showtimes: [],
    movies: [],
    branches: [],
    theaters: [],
    searchTerm: '',
    selectedBranch: '',
    selectedTheater: '',
    loading: true,
    showForm: false,
    editingShowtime: null,
    formData: {
      movie: '',
      branch: '',
      theater: '',
      startTime: '',
      endTime: '',
      price: {
        standard: '',
        vip: '',
        couple: ''
      },
      status: 'active'
    },
    message: { type: '', text: '' }
  });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailShowtime, setDetailShowtime] = useState(null);

  const API_BASE = 'http://localhost:5000/api';

  const showMessage = (type, text) => setState(prev => ({ 
    ...prev, message: { type, text } 
  }));

  const updateFormField = (field, value) => setState(prev => ({
    ...prev, 
    formData: { ...prev.formData, [field]: value }
  }));

  const updatePriceField = (priceType, value) => setState(prev => ({
    ...prev,
    formData: {
      ...prev.formData,
      price: { ...prev.formData.price, [priceType]: value }
    }
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
      const [showtimesRes, moviesRes, branchesRes, theatersRes] = await Promise.all([
        fetch(`${API_BASE}/showtimes`, { headers: getHeaders() }),
        fetch(`${API_BASE}/movies`, { headers: getHeaders() }),
        fetch(`${API_BASE}/branches`, { headers: getHeaders() }),
        fetch(`${API_BASE}/theaters`, { headers: getHeaders() })
      ]);
      
      if (showtimesRes.ok && moviesRes.ok && branchesRes.ok && theatersRes.ok) {
        const [showtimes, movies, branches, theaters] = await Promise.all([
          showtimesRes.json(),
          moviesRes.json(),
          branchesRes.json(),
          theatersRes.json()
        ]);
        setState(prev => ({ ...prev, showtimes, movies, branches, theaters, loading: false }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
        showMessage('error', 'Lỗi khi tải dữ liệu');
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      showMessage('error', 'Lỗi khi tải dữ liệu');
    }
  }, [getHeaders]);

  const fetchShowtimes = async (theaterId) => {
  try {
    const res = await fetch(`${API_BASE}/showtimes/theater/${theaterId}`);
    const data = await res.json();
    setState(prev => ({ ...prev, showtimes: data }));
  } catch (err) {
    console.error(err);
  }
};
  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter theaters by selected branch
  const filteredTheaters = state.theaters.filter(theater => 
    !state.formData.branch || theater.branch === state.formData.branch || theater.branch?._id === state.formData.branch
  );

  // Calculate end time based on movie duration and start time
  const calculateEndTime = useCallback((startTime, movieId) => {
    const movie = state.movies.find(m => m._id === movieId);
    if (!movie || !movie.duration || !startTime) return '';
    
    // Parse the datetime-local input value properly
    const start = new Date(startTime);
    const durationMinutes = Number(movie.duration);
    
    // Add duration in milliseconds
    const end = new Date(start.getTime() + durationMinutes * 60000);
    
    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');
    const hours = String(end.getHours()).padStart(2, '0');
    const minutes = String(end.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, [state.movies]);

  // Get minimum allowed date for showtime based on movie release date
  const getMinStartTime = useCallback(() => {
    if (!state.formData.movie) {
      return new Date().toISOString().slice(0, 16);
    }
    
    const movie = state.movies.find(m => m._id === state.formData.movie);
    if (!movie || !movie.releaseDate) {
      return new Date().toISOString().slice(0, 16);
    }
    
    const releaseDate = new Date(movie.releaseDate);
    const today = new Date();
    
    // Return the later of release date or today
    const minDate = releaseDate > today ? releaseDate : today;
    return minDate.toISOString().slice(0, 16);
  }, [state.formData.movie, state.movies]);

  // Update end time when movie or start time changes
  useEffect(() => {
    if (state.formData.movie && state.formData.startTime) {
      const endTime = calculateEndTime(state.formData.startTime, state.formData.movie);
      if (endTime) {
        console.log('Calculating end time:', {
          startTime: state.formData.startTime,
          movieId: state.formData.movie,
          movie: state.movies.find(m => m._id === state.formData.movie),
          calculatedEndTime: endTime
        });
        updateFormField('endTime', endTime);
      }
    }
  }, [state.formData.movie, state.formData.startTime, calculateEndTime, state.movies]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { movie, branch, theater, startTime, endTime, price, status } = state.formData;
    
    if (!movie || !branch || !theater || !startTime || !endTime || !price.standard) {
      return showMessage('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }

    // Validate showtime date against movie release date
    const selectedMovie = state.movies.find(m => m._id === movie);
    if (selectedMovie && selectedMovie.releaseDate) {
      const showtimeDate = new Date(startTime);
      const releaseDate = new Date(selectedMovie.releaseDate);
      
      // Set both to start of day for comparison
      showtimeDate.setHours(0, 0, 0, 0);
      releaseDate.setHours(0, 0, 0, 0);
      
      if (showtimeDate < releaseDate) {
        return showMessage('error', `Không thể tạo lịch chiếu trước ngày ra mắt phim (${releaseDate.toLocaleDateString('vi-VN')})`);
      }
    }

    const submitData = {
      movie,
      branch,
      theater,
      startTime,
      endTime,
      price: {
        standard: Number(price.standard),
        vip: Number(price.vip) || 0,
        couple: Number(price.couple) || 0
      },
      status
    };

    try {
      const url = state.editingShowtime 
        ? `${API_BASE}/showtimes/${state.editingShowtime._id}` 
        : `${API_BASE}/showtimes`;
      
      const response = await fetch(url, {
        method: state.editingShowtime ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        await fetchData();
        resetForm();
        showMessage('success', `Lịch chiếu ${state.editingShowtime ? 'cập nhật' : 'tạo'} thành công!`);
      } else {
        const error = await response.json();
        showMessage('error', error.message || 'Thao tác thất bại');
      }
    } catch (error) {
      showMessage('error', 'Lỗi khi lưu lịch chiếu');
    }
  };

  const handleEdit = (showtime) => setState(prev => ({
    ...prev, 
    editingShowtime: showtime, 
    showForm: true,
    formData: { 
      movie: showtime.movie?._id || showtime.movie || '',
      branch: showtime.branch?._id || showtime.branch || '',
      theater: showtime.theater?._id || showtime.theater || '',
      startTime: new Date(showtime.startTime).toISOString().slice(0, 16),
      endTime: new Date(showtime.endTime).toISOString().slice(0, 16),
      price: {
        standard: showtime.price?.standard || '',
        vip: showtime.price?.vip || '',
        couple: showtime.price?.couple || ''
      },
      status: showtime.status || 'active'
    }
  }));

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch chiếu này?')) return;
    try {
      const response = await fetch(`${API_BASE}/showtimes/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      if (response.ok) {
        await fetchData();
        showMessage('success', 'Lịch chiếu đã xóa thành công!');
      } else {
        showMessage('error', 'Lỗi khi xóa lịch chiếu');
      }
    } catch (error) {
      showMessage('error', 'Lỗi khi thao tác lịch chiếu');
    }
  };

  const resetForm = () => setState(prev => ({
    ...prev, 
    formData: {
      movie: '',
      branch: '',
      theater: '',
      startTime: '',
      endTime: '',
      price: {
        standard: '',
        vip: '',
        couple: ''
      },
      status: 'active'
    },
    editingShowtime: null, 
    showForm: false
  }));

  const handleViewDetail = (showtime) => {
    // Open detail modal without touching editingShowtime (keeps edit flow intact)
    setDetailShowtime(showtime);
    setDetailOpen(true);
  };

  const closeDetailModal = () => {
    setDetailOpen(false);
    setDetailShowtime(null);
  };

  const filteredShowtimes = state.showtimes.filter(showtime => {
    const matchesSearch = 
      (showtime.movie?.title || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (showtime.theater?.name || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (showtime.branch?.name || '').toLowerCase().includes(state.searchTerm.toLowerCase());
    
    const matchesBranch = !state.selectedBranch || 
      showtime.branch?._id === state.selectedBranch || 
      showtime.branch === state.selectedBranch;
    
    const matchesTheater = !state.selectedTheater || 
      showtime.theater?._id === state.selectedTheater || 
      showtime.theater === state.selectedTheater;
    
    return matchesSearch && matchesBranch && matchesTheater;
  });

  const getMovieTitle = (movieId) => {
    const movie = state.movies.find(m => m._id === movieId);
    return movie ? movie.title : 'N/A';
  };

  // Trả về poster cho movie. movieRef có thể là id hoặc object movie.
  const getMoviePoster = (movieRef) => {
    if (!movieRef) return '';
    // Nếu đã là object và có poster, dùng luôn
    if (typeof movieRef === 'object' && movieRef.poster) return movieRef.poster;
    const id = typeof movieRef === 'string' ? movieRef : movieRef._id;
    const movie = state.movies.find(m => m._id === id);
    return movie && movie.poster ? movie.poster : '';
  };

  const getBranchName = (branchId) => {
    const branch = state.branches.find(b => b._id === branchId);
    return branch ? branch.name : 'N/A';
  };

  const getTheaterName = (theaterId) => {
    const theater = state.theaters.find(t => t._id === theaterId);
    return theater ? theater.name : 'N/A';
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colorMap = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const textMap = {
      active: 'Đang chiếu',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy'
    };
    return textMap[status] || status;
  };

  if (state.loading) {
    return (
      <AdminLayout title="Quản Lý Lịch Chiếu">
        <div className="p-6">
          <div className="text-center py-12 text-gray-500">Đang tải danh sách lịch chiếu...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản Lý Lịch Chiếu">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Lịch Chiếu</h1>
          <p className="text-gray-600">Quản lý lịch chiếu phim tại các phòng chiếu</p>
        </div>

        {state.message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            state.message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {state.message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm phim, phòng chiếu..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={state.searchTerm}
                onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>
            
            <select
              value={state.selectedBranch}
              onChange={(e) => setState(prev => ({ ...prev, selectedBranch: e.target.value, selectedTheater: '' }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả chi nhánh</option>
              {state.branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>

            <select
              value={state.selectedTheater}
              onChange={(e) => setState(prev => ({ ...prev, selectedTheater: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!state.selectedBranch}
            >
              <option value="">Tất cả phòng chiếu</option>
              {state.theaters
                .filter(theater => theater.branch === state.selectedBranch || theater.branch?._id === state.selectedBranch)
                .map((theater) => (
                  <option key={theater._id} value={theater._id}>
                    {theater.name}
                  </option>
                ))}
            </select>

            <button
              onClick={() => setState(prev => ({ ...prev, showForm: true }))}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Thêm Lịch Chiếu
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
                    {state.editingShowtime ? "Chỉnh Sửa Lịch Chiếu" : "Thêm Lịch Chiếu Mới"}
                  </h2>
                  <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Phim"
                      type="select"
                      required
                      value={state.formData.movie}
                      onChange={(e) => updateFormField('movie', e.target.value)}
                    >
                      <option value="">Chọn phim</option>
                      {state.movies.filter(movie => movie.status === 'now-showing' || movie.status === 'coming-soon').map((movie) => (
                        <option key={movie._id} value={movie._id}>
                          {movie.title} ({movie.duration} phút) - {movie.status === 'now-showing' ? 'Đang chiếu' : 'Sắp chiếu'}
                        </option>
                      ))}
                    </FormField>

                    <FormField
                      label="Chi nhánh"
                      type="select"
                      required
                      value={state.formData.branch}
                      onChange={(e) => {
                        updateFormField('branch', e.target.value);
                        updateFormField('theater', ''); // Reset theater when branch changes
                      }}
                    >
                      <option value="">Chọn chi nhánh</option>
                      {state.branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </FormField>
                  </div>

                  <FormField
                    label="Phòng chiếu"
                    type="select"
                    required
                    value={state.formData.theater}
                    onChange={(e) => updateFormField('theater', e.target.value)}
                    disabled={!state.formData.branch}
                  >
                    <option value="">Chọn phòng chiếu</option>
                    {filteredTheaters.map((theater) => (
                      <option key={theater._id} value={theater._id}>
                        {theater.name}
                      </option>
                    ))}
                  </FormField>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thời gian bắt đầu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={state.formData.startTime}
                        onChange={(e) => updateFormField('startTime', e.target.value)}
                        min={getMinStartTime()}
                        disabled={!state.formData.movie}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {state.formData.movie && (() => {
                        const movie = state.movies.find(m => m._id === state.formData.movie);
                        if (movie && movie.releaseDate) {
                          const releaseDate = new Date(movie.releaseDate);
                          return (
                            <p className="text-xs text-blue-600 mt-1">
                              Ngày ra mắt phim: {releaseDate.toLocaleDateString('vi-VN')}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thời gian kết thúc <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-2">(Tự động tính dựa trên thời lượng phim)</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={state.formData.endTime}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá vé <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Ghế thường (VNĐ)</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={state.formData.price.standard}
                          onChange={(e) => updatePriceField('standard', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Ghế VIP (VNĐ)</label>
                        <input
                          type="number"
                          min="0"
                          value={state.formData.price.vip}
                          onChange={(e) => updatePriceField('vip', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Ghế đôi (VNĐ)</label>
                        <input
                          type="number"
                          min="0"
                          value={state.formData.price.couple}
                          onChange={(e) => updatePriceField('couple', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <FormField
                    label="Trạng thái"
                    type="select"
                    value={state.formData.status}
                    onChange={(e) => updateFormField('status', e.target.value)}
                  >
                    <option value="active">Đang chiếu</option>
                    <option value="completed">Đã hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </FormField>

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
                      {state.editingShowtime ? "Cập nhật" : "Tạo lịch chiếu"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Showtimes Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredShowtimes.map((showtime) => (
            <div key={showtime._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Film size={24} className="text-blue-600" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {getMovieTitle(showtime.movie?._id || showtime.movie)}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {getBranchName(showtime.branch?._id || showtime.branch)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Monitor size={14} />
                          {getTheaterName(showtime.theater?._id || showtime.theater)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(showtime.status)}`}>
                    {getStatusText(showtime.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock size={14} />
                      Bắt đầu
                    </span>
                    <p className="font-medium">{formatDateTime(showtime.startTime)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock size={14} />
                      Kết thúc
                    </span>
                    <p className="font-medium">{formatDateTime(showtime.endTime)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <DollarSign size={14} />
                      Giá thường
                    </span>
                    <p className="font-medium text-green-600">{showtime.price?.standard?.toLocaleString()} VNĐ</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <DollarSign size={14} />
                      Giá VIP
                    </span>
                    <p className="font-medium text-yellow-600">{showtime.price?.vip?.toLocaleString() || 0} VNĐ</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <DollarSign size={14} />
                      Giá đôi
                    </span>
                    <p className="font-medium text-pink-600">{showtime.price?.couple?.toLocaleString() || 0} VNĐ</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetail(showtime)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={16} />
                    Chi tiết
                  </button>
                  <button
                    onClick={() => handleEdit(showtime)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    <Edit2 size={16} />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(showtime._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                    Xóa
                  </button>
                </div>
              </div>
            </div>
            

          ))}
          

          {filteredShowtimes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {state.searchTerm || state.selectedBranch || state.selectedTheater ? 
                "Không tìm thấy lịch chiếu nào phù hợp" : 
                "Chưa có lịch chiếu nào"}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {detailOpen && detailShowtime && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Chi tiết suất chiếu</h3>
                <button onClick={closeDetailModal} className="text-gray-600 hover:text-gray-800 p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <img
                      src={ getMoviePoster(detailShowtime.movie || detailShowtime.movie?._id) || detailShowtime.poster || detailShowtime.moviePoster || '' }
                      alt={getMovieTitle(detailShowtime.movie?._id || detailShowtime.movie)}
                      className="w-full h-48 object-cover rounded mb-4"
                    />

                    <h4 className="font-semibold text-lg">
                      {getMovieTitle(detailShowtime.movie?._id || detailShowtime.movie)}
                    </h4>
                    <p className="text-sm text-gray-600">{getBranchName(detailShowtime.branch?._id || detailShowtime.branch)}</p>
                    <p className="text-sm text-gray-600">{getTheaterName(detailShowtime.theater?._id || detailShowtime.theater)}</p>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <div className="text-sm text-gray-500">Thời gian bắt đầu</div>
                      <div className="font-medium">{formatDateTime(detailShowtime.startTime)}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Thời gian kết thúc</div>
                      <div className="font-medium">{formatDateTime(detailShowtime.endTime)}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Giá thường</div>
                        <div className="font-medium text-green-600">{detailShowtime.price?.standard?.toLocaleString() || '0'} VNĐ</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Giá VIP</div>
                        <div className="font-medium text-yellow-600">{detailShowtime.price?.vip?.toLocaleString() || '0'} VNĐ</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Giá đôi</div>
                        <div className="font-medium text-pink-600">{detailShowtime.price?.couple?.toLocaleString() || '0'} VNĐ</div>
                      </div>
                    </div>

                    { (detailShowtime.notes || detailShowtime.description) && (
                      <div>
                        <div className="text-sm text-gray-500">Ghi chú</div>
                        <div className="whitespace-pre-wrap text-gray-700">{detailShowtime.notes || detailShowtime.description}</div>
                      </div>
                    )}

                    <div className="pt-4 flex justify-end">
                      <button onClick={closeDetailModal} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Đóng</button>
                    </div>
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

export default ShowtimeManagement;