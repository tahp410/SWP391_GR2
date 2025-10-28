import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'
import Header from './Header';
const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api/users';

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; 
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};


const Profile = () => {
  const navigate = useNavigate();
  // State hiển thị
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    dob: '',
    phone: '',
    province: '',
    city: '',
    gender: 'other',
  });
  const [formData, setFormData] = useState({ ...profileData });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Fetch profile khi mở trang
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');

        // Lấy token từ localStorage (đã set khi login)
        const token = localStorage.getItem('token');

        const res = await fetch(`${API_BASE}/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
        });

        if (!alive) return;

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || res.statusText);
        }

        const data = await res.json();

        // profileData.dob => formatted for display (dd/mm/yyyy)
        // formData.dob => ISO (YYYY-MM-DD) for input[type=date]
        const profileDob = data.dob ? fmtDate(data.dob) : '';
        const formDobISO = data.dob ? new Date(data.dob).toISOString().slice(0, 10) : '';

        const nextProfile = {
          name: data.name ?? '',
          email: data.email ?? '',
          dob: profileDob,
          phone: data.phone ?? '',
          province: data.province ?? '',
          city: data.city ?? '',
          gender: data.gender ?? 'other',
        };

        setProfileData(nextProfile);
        setFormData(prev => ({ ...prev, name: nextProfile.name, email: nextProfile.email, dob: formDobISO, phone: nextProfile.phone, province: nextProfile.province, city: nextProfile.city, gender: nextProfile.gender }));
      } catch (e) {
        setError(e.message || 'Lỗi tải hồ sơ');
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

// Thêm hàm kiểm tra email tồn tại trên server
const checkEmailExists = async (email) => {
  if (!email) return false;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/check-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    // Nếu server dùng status 409 để báo trùng
    if (res.status === 409) return true;

    // Nếu endpoint không tồn tại, cho phép tiếp tục (không chặn cập nhật)
    if (res.status === 404) {
      console.warn('check-email endpoint not found, skipping email existence check.');
      return false;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('check-email returned non-ok:', err?.message || res.statusText);
      // Không ném lỗi; cho phép tiến tiếp để backend chính xử lý
      return false;
    }

    const data = await res.json().catch(() => ({}));
    return !!data.exists;
  } catch (e) {
    // Lỗi mạng / CORS / v.v. -> không chặn cập nhật, ghi log để debug
    console.warn('Failed to check email existence:', e);
    return false;
  }
};

  // Profile.jsx - sửa handler update
  const handleUpdateProfile = async () => {
    try {
      // Kiểm tra trùng email chỉ khi email đã thay đổi so với profile hiện tại
      const newEmail = (formData.email || '').trim();
      const currentEmail = (profileData.email || '').trim();

      if (newEmail && newEmail !== currentEmail) {
        const exists = await checkEmailExists(newEmail);
        if (exists) {
          alert('Email đã tồn tại');
          return;
        }
        // Nếu checkEmailExists trả false (endpoint 404 hoặc lỗi), tiếp tục và để backend xử lý
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        // Luôn đọc text, sau đó cố parse JSON để lấy message chi tiết
        const text = await res.text().catch(() => '');
        let parsed;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = null;
        }

        // Lấy message từ nhiều dạng response phổ biến
        let msgParts = [];
        if (parsed && typeof parsed === 'object') {
          if (parsed.message) msgParts.push(parsed.message);
          if (parsed.error) msgParts.push(parsed.error);
          if (parsed.errors && Array.isArray(parsed.errors)) {
            msgParts.push(parsed.errors.map(e => (e.msg || e.message || JSON.stringify(e))).join(' '));
          }
          // fallback stringify parsed object
          if (msgParts.length === 0) msgParts.push(JSON.stringify(parsed));
        } else if (text) {
          msgParts.push(text);
        }

        const msgStr = msgParts.join(' ').trim();

        // Mở rộng nhận diện lỗi trùng email: status 409/422 hoặc nội dung chứa từ khoá
        const dupRegex = /(email|e-?mail|duplicate|duplicate key|e11000|already in use|already exists|unique constraint|unique index|trùng|tồn tại)/i;
        if (res.status === 409 || res.status === 422 || dupRegex.test(msgStr)) {
          alert('Email đã tồn tại');
          return;
        }

        // Nếu không phải lỗi trùng, show thông điệp chi tiết nếu có, ngược lại thông báo tổng quát
        if (msgStr) {
          alert(msgStr);
        } else if (res.status >= 500) {
          alert('Lỗi server nội bộ. Vui lòng thử lại sau.');
        } else {
          alert('Cập nhật thất bại');
        }
        return;
      }

      const data = await res.json();
      // Update profileData (display) and keep formData.dob as ISO for date input
      const profileDob = data.dob ? fmtDate(data.dob) : '';
      const formDobISO = data.dob ? new Date(data.dob).toISOString().slice(0, 10) : '';
      setProfileData({
        name: data.name ?? '',
        email: data.email ?? '',
        dob: profileDob,
        phone: data.phone ?? '',
        province: data.province ?? '',
        city: data.city ?? '',
        gender: data.gender ?? 'other',
      });
      setFormData(prev => ({ ...prev, email: data.email ?? '', name: data.name ?? '', dob: formDobISO, phone: data.phone ?? '', province: data.province ?? '', city: data.city ?? '', gender: data.gender ?? 'other' }));
      setIsEditing(false);
      alert('Cập nhật thông tin thành công!');
    } catch (e) {
      alert(e.message || 'Lỗi kết nối server');
    }
  };

  const handleCancel = () => {
    setFormData({ ...profileData });
    setIsEditing(false);
  };

  // UI
  if (loading) return <div className="cgv-profile-container"><p>Đang tải hồ sơ…</p></div>;
  if (error)   return <div className="cgv-profile-container"><p style={{ color: 'red' }}>Lỗi: {error}</p></div>;

  return (
    <div className="cgv-profile-container">
      {/*header*/}
      <Header />

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <div className="breadcrumb-content">
          <span className="breadcrumb-item">
            <span className="home-icon">🏠</span>
            Home
          </span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item active">Profile</span>
        </div>
      </div>

      {/* Main */}
      <main className="profile-main">
        <div className="profile-content">
          <h1 className="page-title">Profile</h1>

          {/* Profile Information */}
          <section className="profile-section">
            <h2 className="section-title">Profile Information</h2>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                  style={isEditing ? { color: '#000', background: '#fff', opacity: 1 } : {}}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  style={isEditing ? { color: '#000', background: '#fff', opacity: 1 } : {}}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of birth <span className="required">*</span></label>
                <input
                  type={isEditing ? "date" : "text"}
                  className="form-input"
                  value={isEditing ? (formData.dob || '') : (formData.dob ? fmtDate(formData.dob) : '')}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  disabled={!isEditing}
                  style={isEditing ? { color: '#000', background: '#fff', opacity: 1 } : {}}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  style={isEditing ? { color: '#000', background: '#fff', opacity: 1 } : {}}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  disabled={!isEditing}
                  style={isEditing ? { color: '#000', background: '#fff', opacity: 1 } : {}}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Province</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  disabled={!isEditing}
                  style={isEditing ? { color: '#000', background: '#fff', opacity: 1 } : {}}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  className="form-input"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  disabled={!isEditing}
                  style={isEditing ? { color: '#000', background: '#fff', opacity: 1 } : {}}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-primary"
                onClick={() => navigate('/change-password')}
                >
                  CHANGE PASSWORD
                </button>
              {!isEditing ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  EDIT
                </button>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={handleUpdateProfile}>
                    UPDATE
                  </button>
                  <button className="btn btn-secondary" onClick={handleCancel}>
                    CANCEL
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Profile;
