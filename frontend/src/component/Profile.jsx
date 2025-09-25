import React, { useState } from 'react';

const Profile = () => {
  const [profileData, setProfileData] = useState({
    fullName: 'Nguyen Duy Anh',
    email: 'abc@gmail.com',
    dateOfBirth: '16/01/2003',
    phoneNumber: '0911007428',
    district: 'Đống Đa',
    city: 'Hà Nội',
    sex: 'Male',
    password: '••••••••••••••••••••'
  });

  const [isEditing, setIsEditing] = useState({
    profile: false,
    password: false
  });

  const [formData, setFormData] = useState({ ...profileData });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleUpdateProfile = () => {
    setProfileData({ ...formData });
    setIsEditing(prev => ({ ...prev, profile: false }));
    alert('Cập nhật thông tin thành công!');
  };

  const handleUpdatePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      alert('Mật khẩu phải có ít nhất 8 ký tự!');
      return;
    }
    alert('Cập nhật mật khẩu thành công!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditing(prev => ({ ...prev, password: false }));
  };

  const handleCancel = (type) => {
    if (type === 'profile') {
      setFormData({ ...profileData });
      setIsEditing(prev => ({ ...prev, profile: false }));
    } else {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsEditing(prev => ({ ...prev, password: false }));
    }
  };

  return (
    <div className="cgv-profile-container">
      {/* Header */}
      <header className="profile-header">
        <div className="header-content">
          <div className="logo">
            <span className="cgv-logo">CGV</span>
            <span className="logo-star">*</span>
          </div>
          <nav className="header-nav">
            <a href="/" className="nav-link">Home</a>
            <a href="#movies" className="nav-link">Movies</a>
            <a href="#showtime" className="nav-link">Showtime</a>
          </nav>
          <div className="header-actions">
            <button className="action-btn" title="Yêu thích">
              <span className="heart-icon">♥</span>
            </button>
            <button className="action-btn" title="Thông báo">
              <span className="bell-icon">🔔</span>
            </button>
            <button className="action-btn profile-btn" title="Tài khoản">
              <div className="avatar">
                <span>👤</span>
              </div>
            </button>
          </div>
        </div>
      </header>

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

      {/* Main Content */}
      <main className="profile-main">
        <div className="profile-content">
          <h1 className="page-title">Profile</h1>

          {/* Profile Information Section */}
          <section className="profile-section">
            <h2 className="section-title">Profile Information</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  disabled={!isEditing.profile}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing.profile}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Date of birth <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  disabled={!isEditing.profile}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  disabled={!isEditing.profile}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  District <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  disabled={!isEditing.profile}
                >
                  <option value="Đống Đa">Đống Đa</option>
                  <option value="Ba Đình">Ba Đình</option>
                  <option value="Hoàn Kiếm">Hoàn Kiếm</option>
                  <option value="Hai Bà Trưng">Hai Bà Trưng</option>
                  <option value="Cầu Giấy">Cầu Giấy</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  City <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  disabled={!isEditing.profile}
                >
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Hải Phòng">Hải Phòng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  Sex <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.sex}
                  onChange={(e) => handleInputChange('sex', e.target.value)}
                  disabled={!isEditing.profile}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              {!isEditing.profile ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsEditing(prev => ({ ...prev, profile: true }))}
                >
                  EDIT
                </button>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={handleUpdateProfile}>
                    UPDATE
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleCancel('profile')}>
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