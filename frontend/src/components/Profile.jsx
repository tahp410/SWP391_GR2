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

       
        const next = {
          name: data.name ?? '',
          email: data.email ?? '',
          dob: fmtDate(data.dob),
          phone: data.phone ?? '',
          province: data.province ?? '',
          city: data.city ?? '',
          gender: data.gender ?? 'other',
        };

        setProfileData(next);
        setFormData(next);
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

// Profile.jsx - sửa handler update
const handleUpdateProfile = async () => {
  try {
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
      const err = await res.json().catch(() => ({}));
      alert(err?.message || 'Cập nhật thất bại');
      return;
    }

    const data = await res.json();
    setProfileData(data);
    setFormData(data);
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
                  type="text"
                  className="form-input"
                  value={formData.dob}
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
