import React, { useMemo, useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';

const ROLES = [
  { label: 'Tất cả', value: 'all' },
  { label: 'ADMIN', value: 'admin' },
  { label: 'EMPLOYEE', value: 'employee' },
  { label: 'CUSTOMER', value: 'customer' }
];

const PROVINCES = [
  { name: 'Hà Nội', cities: ['Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân', 'Sóc Sơn', 'Đông Anh', 'Gia Lâm', 'Nam Từ Liêm', 'Bắc Từ Liêm', 'Mê Linh', 'Hà Đông', 'Sơn Tây', 'Ba Vì', 'Phúc Thọ', 'Đan Phượng', 'Hoài Đức', 'Quốc Oai', 'Thạch Thất', 'Chương Mỹ', 'Thanh Oai', 'Thường Tín', 'Phú Xuyên', 'Ứng Hòa', 'Mỹ Đức'] },
  { name: 'TP. Hồ Chí Minh', cities: ['Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12', 'Quận Bình Thạnh', 'Quận Gò Vấp', 'Quận Phú Nhuận', 'Quận Tân Bình', 'Quận Tân Phú', 'Quận Thủ Đức', 'Huyện Bình Chánh', 'Huyện Cần Giờ', 'Huyện Củ Chi', 'Huyện Hóc Môn', 'Huyện Nhà Bè'] },
  { name: 'Đà Nẵng', cities: ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang'] },
  { name: 'Hải Phòng', cities: ['Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Hải An', 'Kiến An', 'Đồ Sơn', 'Dương Kinh', 'Thuỷ Nguyên', 'An Dương', 'An Lão', 'Kiến Thuỵ', 'Tiên Lãng', 'Vĩnh Bảo', 'Cát Hải', 'Bạch Long Vĩ'] },
  { name: 'Cần Thơ', cities: ['Ninh Kiều', 'Ô Môn', 'Bình Thuỷ', 'Cái Răng', 'Thốt Nốt', 'Vĩnh Thạnh', 'Cờ Đỏ', 'Phong Điền', 'Thới Lai'] },
  { name: 'An Giang', cities: ['Long Xuyên', 'Châu Đốc', 'An Phú', 'Tân Châu', 'Phú Tân', 'Châu Phú', 'Tịnh Biên', 'Tri Tôn', 'Châu Thành', 'Chợ Mới', 'Thoại Sơn'] },
  { name: 'Bà Rịa - Vũng Tàu', cities: ['Vũng Tàu', 'Bà Rịa', 'Châu Đức', 'Xuyên Mộc', 'Long Điền', 'Đất Đỏ', 'Tân Thành', 'Côn Đảo'] },
  { name: 'Bắc Giang', cities: ['Bắc Giang', 'Yên Thế', 'Tân Yên', 'Lạng Giang', 'Lục Nam', 'Lục Ngạn', 'Sơn Động', 'Yên Dũng', 'Việt Yên', 'Hiệp Hòa'] },
  { name: 'Bắc Kạn', cities: ['Bắc Kạn', 'Pác Nặm', 'Ba Bể', 'Ngân Sơn', 'Bạch Thông', 'Chợ Đồn', 'Chờ Rã', 'Na Rì'] },
  { name: 'Bắc Ninh', cities: ['Bắc Ninh', 'Từ Sơn', 'Tiên Du', 'Quế Võ', 'Yên Phong', 'Gia Bình', 'Lương Tài', 'Thuận Thành'] }
];

const TableHeaderCell = ({ children }) => (
  <th className="px-4 py-3 text-left text-sm font-semibold text-black border-b bg-gray-50">
    {children}
  </th>
);

const TableCell = ({ children }) => (
  <td className="px-4 py-4 text-sm text-black border-b">{children}</td>
);

const getRoleStyle = (role) => {
  switch(role.toUpperCase()) {
    case 'ADMIN':
      return 'px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800';
    case 'EMPLOYEE':
      return 'px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800';
    case 'CUSTOMER':
      return 'px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800';
    default:
      return 'px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800';
  }
};

const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black">{title}</h3>
          <button onClick={onClose} className="px-2 py-1 rounded bg-gray-100 text-black">Đóng</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const UserManagementContent = () => {
  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState(''); // truy vấn áp dụng khi bấm tìm kiếm
  const [role, setRole] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [creating, setCreating] = useState(null);
  const [createErrors, setCreateErrors] = useState({});

  // Fetch users từ database
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'Token exists' : 'No token'); // Debug log
      
      if (!token) {
        console.error('No token found in localStorage');
        setUsers([]);
        alert('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      console.log('Making API request to fetch users...');
      const response = await axios.get('http://localhost:5000/api/users/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('API Response successful, users count:', response.data.length); // Debug log
      
      // Transform dữ liệu từ API để phù hợp với format hiện tại
      const transformedUsers = response.data.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.toUpperCase(),
        gender: user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác',
        province: user.province || 'N/A',
        city: user.city || 'N/A',
        createdAt: new Date(user.createdAt).toLocaleDateString('vi-VN')
      }));
      
      setUsers(transformedUsers);
      console.log('Users set successfully:', transformedUsers.length);
    } catch (error) {
      console.error('Lỗi khi fetch users:', error);
      console.error('Error response:', error.response?.data);
      
      // Nếu lỗi 401 (Unauthorized), có thể token đã hết hạn
      if (error.response?.status === 401) {
        console.error('Token might be expired or invalid');
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      } 
      else {
        alert('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect để fetch dữ liệu khi component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = () => {
    setQuery(searchText.trim());
  };

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u => {
      const matchRole = role === 'all' || u.role.toLowerCase() === role;
      // Tìm theo email
      const matchQuery = !q || (u.email || '').toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [query, role, users]);

  const startCreate = () => {
    setCreating({ 
      name: '', 
      email: '', 
      phone: '', 
      role: 'CUSTOMER', 
      gender: 'Nam',
      province: '',
      city: ''
    });
    setCreateErrors({});
  };

  const commitCreate = async () => {
    if (!creating?.name || !creating?.email) {
      setCreateErrors({ form: 'Vui lòng nhập tên và email' });
      return;
    }
    // Kiểm tra email có đuôi được phép
    const allowedDomains = ['@gmail.com', '@example.com', '@cineticket.com'];
    const emailLower = creating.email.toLowerCase();
    const hasValidDomain = allowedDomains.some(domain => emailLower.endsWith(domain));
    if (!hasValidDomain) {
      setCreateErrors({ email: 'Email phải có đuôi @gmail.com, @example.com hoặc @cineticket.com' });
      return;
    }
    // Kiểm tra mật khẩu phải có ít nhất 6 ký tự
    if (!creating.password || creating.password.length < 6) {
      setCreateErrors({ password: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }
    // Đối chiếu email đã có trong danh sách hiện tại để báo lỗi ngay
    const emailExists = users.some(u => (u.email || '').toLowerCase() === creating.email.toLowerCase());
    if (emailExists) {
      setCreateErrors({ email: 'Email đã tồn tại' });
      return;
    }
    if (!/^\d{10}$/.test((creating.phone || '').trim())) {
      setCreateErrors({ phone: 'Số điện thoại phải gồm đúng 10 chữ số' });
      return;
    }
    try {
      const genderApi = (creating.gender || 'Nam') === 'Nữ' ? 'female' : (creating.gender || 'Nam') === 'Nam' ? 'male' : 'other';
      const res = await axios.post('http://localhost:5000/api/users/register', {
        name: creating.name,
        email: creating.email,
        password: creating.password || 'Password@123',
        phone: creating.phone,
        role: (creating.role || 'CUSTOMER').toLowerCase(),
        gender: genderApi,
        province: creating.province || 'N/A',
        city: creating.city || 'N/A',
        dob: '2000-01-01'
      });

      setCreating(null);
      // Refresh danh sách users từ database
      await fetchUsers();
      
      // Hiển thị thông báo thành công
      alert('✅ Tạo người dùng thành công!');
      
      // optional: lưu token để có thể đăng nhập ngay (tùy flow hiện tại)
      const apiUser = res.data;
      if (apiUser.token) {
        localStorage.setItem('token', apiUser.token);
      }
    } catch (e) {
      console.error(e);
      const status = e.response?.status;
      const msg = e.response?.data?.message || e.message;
      if (status === 409 || /tồn tại|duplicate|exists/i.test(msg)) {
        setCreateErrors({ email: 'email đã tồn tại' });
      } else if (status === 400 && /điện thoại|phone/i.test(msg)) {
        setCreateErrors({ phone: 'sdt k hop le' });
      } else {
        setCreateErrors({ form: msg || 'Đã có lỗi, vui lòng thử lại' });
      }
    }
  };

  const commitEdit = async () => {
    if (!editing) return;
    
    // Kiểm tra tên và email bắt buộc
    if (!editing.name || !editing.email) {
      alert('Vui lòng nhập tên và email');
      return;
    }
    
    // Kiểm tra email có đuôi được phép
    const allowedDomains = ['@gmail.com', '@example.com', '@cineticket.com'];
    const emailLower = editing.email.toLowerCase();
    const hasValidDomain = allowedDomains.some(domain => emailLower.endsWith(domain));
    if (!hasValidDomain) {
      alert('Email phải có đuôi @gmail.com, @example.com hoặc @cineticket.com');
      return;
    }
    
    // Kiểm tra mật khẩu nếu có thay đổi (phải có ít nhất 6 ký tự)
    if (editing.password && editing.password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    // Kiểm tra email trùng lặp (trừ user hiện tại)
    const emailExists = users.some(u => 
      u.id !== editing.id && 
      (u.email || '').toLowerCase() === editing.email.toLowerCase()
    );
    if (emailExists) {
      alert('Email đã tồn tại');
      return;
    }
    
    // Kiểm tra số điện thoại phải đúng 10 chữ số
    if (editing.phone && !/^\d{10}$/.test(editing.phone.trim())) {
      alert('Số điện thoại phải gồm đúng 10 chữ số');
      return;
    }
    
    try {
      // Gọi API cập nhật DB
      const token = localStorage.getItem('token');
      // Tạo object dữ liệu cập nhật
      const updateData = {
        name: editing.name,
        email: editing.email,
        phone: editing.phone,
        role: (editing.role || 'CUSTOMER').toLowerCase(),
        gender: (editing.gender === 'Nữ' ? 'female' : editing.gender === 'Nam' ? 'male' : 'other'),
        province: editing.province || 'N/A',
        city: editing.city || 'N/A'
      };
      
      // Chỉ thêm password nếu có thay đổi
      if (editing.password && editing.password.trim()) {
        updateData.password = editing.password;
      }
      
      const response = await axios.put(`http://localhost:5000/api/users/${editing.id}`, updateData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setEditing(null);
      // Refresh danh sách users từ database
      await fetchUsers();
      
      // Hiển thị thông báo thành công với thông tin cụ thể
      const message = response.data?.message || '✅ Cập nhật người dùng thành công!';
      const hasPasswordUpdate = editing.password && editing.password.trim();
      if (hasPasswordUpdate) {
        alert(message + '\n\n💡 Mật khẩu đã được thay đổi. Người dùng có thể đăng nhập với mật khẩu mới.');
      } else {
        alert(message);
      }
    } catch (e) {
      console.error(e);
      alert('Cập nhật thất bại: ' + (e.response?.data?.message || e.message));
    }
  };

  const commitDelete = async () => {
    if (!deleting) return;
    
    console.log('Starting delete for user:', deleting);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      console.log('Making DELETE request to:', `http://localhost:5000/api/users/${deleting.id}`);
      
      const response = await axios.delete(`http://localhost:5000/api/users/${deleting.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      console.log('Delete successful:', response.data);
      
      setDeleting(null);
      // Refresh danh sách users từ database
      await fetchUsers();
      
      // Hiển thị thông báo thành công
      alert('✅ Xóa người dùng thành công!');
    } catch (e) {
      console.error('Delete failed:', e);
      console.error('Error response:', e.response?.data);
      
      const errorMsg = e.response?.data?.message || e.message;
      alert('Xóa thất bại: ' + errorMsg);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold text-black mb-2">User Management</h1>
        <p className="text-lg text-black">Quản lý tài khoản người dùng trong hệ thống</p>
        {users.length === 0 && !loading && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              💡 <strong>Lưu ý:</strong> Nếu không thể tải danh sách, vui lòng đăng nhập với tài khoản <strong>admin@cineticket.com</strong> để có quyền truy cập.
            </p>
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          placeholder="Tìm theo email..."
          className="flex-1 border rounded-lg px-4 py-3 text-black placeholder-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Tìm kiếm
        </button>
        <button
          onClick={startCreate}
          className="px-4 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          Thêm người dùng
        </button>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full md:w-60 border rounded-lg px-3 py-3 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <TableHeaderCell>Người dùng</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Số điện thoại</TableHeaderCell>
              <TableHeaderCell>Địa chỉ</TableHeaderCell>
              <TableHeaderCell>Vai trò</TableHeaderCell>
              <TableHeaderCell>Ngày tạo</TableHeaderCell>
              <TableHeaderCell>Thao tác</TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-8 text-center text-black" colSpan={7}>Đang tải dữ liệu...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-black" colSpan={7}>
                  {users.length === 0 
                    ? "Không thể tải danh sách người dùng."
                    : "Không có người dùng phù hợp với bộ lọc hiện tại."
                  }
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="leading-tight">
                      <div className="font-medium text-black">{u.name}</div>
                      <div className="text-black text-xs mt-1">{u.gender}</div>
                    </div>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{u.province}</div>
                      <div className="text-gray-600">{u.city}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={getRoleStyle(u.role)}>
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell>{u.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-4 text-sm">
                      <button className="text-black hover:underline" onClick={() => setViewing(u)}>Xem</button>
                      <button className="text-black hover:underline" onClick={() => setEditing({ ...u })}>Sửa</button>
                      <button className="text-black hover:underline" onClick={() => setDeleting(u)}>Xóa</button>
                    </div>
                  </TableCell>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      <Modal open={!!viewing} title="Chi tiết người dùng" onClose={() => setViewing(null)}>
        {viewing && (
          <div className="space-y-2 text-black">
            <div><b>Tên:</b> {viewing.name}</div>
            <div><b>Email:</b> {viewing.email}</div>
            <div><b>SĐT:</b> {viewing.phone}</div>
            <div><b>Giới tính:</b> {viewing.gender}</div>
            <div><b>Tỉnh/Thành phố:</b> {viewing.province}</div>
            <div><b>Quận/Huyện:</b> {viewing.city}</div>
            <div><b>Vai trò:</b> <span className={getRoleStyle(viewing.role)}>{viewing.role}</span></div>
            <div><b>Ngày tạo:</b> {viewing.createdAt}</div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} title="Chỉnh sửa người dùng" onClose={() => setEditing(null)}>
        {editing && (
          <div className="space-y-3">
            <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full border rounded px-3 py-2 text-black bg-white" placeholder="Tên" />
            <input value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} className="w-full border rounded px-3 py-2 text-black bg-white" placeholder="Email (@gmail.com, @example.com, @cineticket.com)" />
            <input 
              type="password"
              value={editing.password || ''} 
              onChange={e => setEditing({ ...editing, password: e.target.value })} 
              className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mật khẩu mới (để trống nếu không đổi, tối thiểu 6 ký tự)"
              autoComplete="new-password"
              style={{ backgroundColor: '#ffffff', color: '#000000', WebkitBoxShadow: '0 0 0px 1000px #ffffff inset', borderColor: '#d1d5db' }}
            />
            <input value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} className="w-full border rounded px-3 py-2 text-black bg-white" placeholder="Số điện thoại" />
            <select 
              value={editing.province || ''} 
              onChange={e => {
                const newProvince = e.target.value;
                setEditing({ ...editing, province: newProvince, city: '' });
              }} 
              className="w-full border rounded px-3 py-2 bg-white text-black"
            >
              <option value="">Chọn Tỉnh/Thành phố</option>
              {PROVINCES.map(province => (
                <option key={province.name} value={province.name}>{province.name}</option>
              ))}
            </select>
            <select 
              value={editing.city || ''} 
              onChange={e => setEditing({ ...editing, city: e.target.value })} 
              className="w-full border rounded px-3 py-2 bg-white text-black"
              disabled={!editing.province}
            >
              <option value="">Chọn Quận/Huyện</option>
              {editing.province && PROVINCES.find(p => p.name === editing.province)?.cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <select value={editing.gender || 'Nam'} onChange={e => setEditing({ ...editing, gender: e.target.value })} className="w-full border rounded px-3 py-2 bg-white text-black">
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
            <select value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })} className="w-full border rounded px-3 py-2 bg-white text-black">
              <option value="ADMIN">ADMIN</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="CUSTOMER">CUSTOMER</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-100 text-black rounded">Hủy</button>
              <button onClick={commitEdit} className="px-4 py-2 bg-blue-600 text-white rounded">Lưu</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={!!creating} title="Thêm người dùng" onClose={() => setCreating(null)}>
        {creating && (
          <div className="space-y-3">
            <input value={creating.name} onChange={e => setCreating({ ...creating, name: e.target.value })} className="w-full border rounded px-3 py-2 text-black bg-white" placeholder="Tên" />
            <input value={creating.email} onChange={e => { setCreating({ ...creating, email: e.target.value }); setCreateErrors({ ...createErrors, email: undefined }); }} className="w-full border rounded px-3 py-2 text-black bg-white" placeholder="Email (@gmail.com, @example.com, @cineticket.com)" />
            {createErrors.email && <p className="text-red-600 text-sm">{createErrors.email}</p>}
            <input
              value={creating.password || ''}
              onChange={e => { 
                setCreating({ ...creating, password: e.target.value }); 
                setCreateErrors({ ...createErrors, password: undefined }); 
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              type="password"
              autoComplete="new-password"
              style={{ backgroundColor: '#ffffff', color: '#000000', WebkitBoxShadow: '0 0 0px 1000px #ffffff inset', borderColor: '#d1d5db' }}
            />
            {createErrors.password && <p className="text-red-600 text-sm">{createErrors.password}</p>}
            <input value={creating.phone} onChange={e => { setCreating({ ...creating, phone: e.target.value }); setCreateErrors({ ...createErrors, phone: undefined }); }} className="w-full border rounded px-3 py-2 text-black bg-white" placeholder="Số điện thoại" />
            {createErrors.phone && <p className="text-red-600 text-sm">{createErrors.phone}</p>}
            <select 
              value={creating.province || ''} 
              onChange={e => {
                const newProvince = e.target.value;
                setCreating({ ...creating, province: newProvince, city: '' });
              }} 
              className="w-full border rounded px-3 py-2 bg-white text-black"
            >
              <option value="">Chọn Tỉnh/Thành phố</option>
              {PROVINCES.map(province => (
                <option key={province.name} value={province.name}>{province.name}</option>
              ))}
            </select>
            <select 
              value={creating.city || ''} 
              onChange={e => setCreating({ ...creating, city: e.target.value })} 
              className="w-full border rounded px-3 py-2 bg-white text-black"
              disabled={!creating.province}
            >
              <option value="">Chọn Quận/Huyện</option>
              {creating.province && PROVINCES.find(p => p.name === creating.province)?.cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <select value={creating.gender || 'Nam'} onChange={e => setCreating({ ...creating, gender: e.target.value })} className="w-full border rounded px-3 py-2 bg-white text-black">
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
            <select value={creating.role} onChange={e => setCreating({ ...creating, role: e.target.value })} className="w-full border rounded px-3 py-2 bg-white text-black">
              <option value="ADMIN">ADMIN</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="CUSTOMER">CUSTOMER</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCreating(null)} className="px-4 py-2 bg-gray-100 text-black rounded">Hủy</button>
              <button onClick={commitCreate} className="px-4 py-2 bg-green-600 text-white rounded">Tạo</button>
            </div>
            {createErrors.form && <p className="text-red-600 text-sm text-right">{createErrors.form}</p>}
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleting} title="Xóa người dùng" onClose={() => setDeleting(null)}>
        {deleting && (
          <div className="space-y-4">
            <p className="text-black">Bạn có chắc muốn xóa người dùng "{deleting.name}"?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="px-4 py-2 bg-gray-100 text-black rounded">Hủy</button>
              <button onClick={commitDelete} className="px-4 py-2 bg-red-600 text-white rounded">Xóa</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const UserManagement = () => {
  return (
    <AdminLayout title="Người Dùng">
      <UserManagementContent />
    </AdminLayout>
  );
};

export default UserManagement;


