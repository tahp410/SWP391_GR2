// ============================================================================
// USER MANAGEMENT COMPONENT - Quản lý người dùng cho Admin
// ============================================================================

// 1. IMPORTS VÀ DEPENDENCIES
import React, { useMemo, useState, useEffect } from 'react'; // React hooks tối ưu performance
import AdminLayout from './AdminLayout'; // Layout wrapper cho admin pages
import axios from 'axios'; // HTTP client để gọi API

// 2. DATA CONSTANTS - Dữ liệu tĩnh dùng trong component

// ROLES - Định nghĩa các vai trò người dùng trong hệ thống
const ROLES = [
  { label: 'Tất cả', value: 'all' },      // Option để hiển thị tất cả users
  { label: 'ADMIN', value: 'admin' },     // Quản trị viên - quyền cao nhất
  { label: 'EMPLOYEE', value: 'employee' }, // Nhân viên - quản lý rạp
  { label: 'CUSTOMER', value: 'customer' }  // Khách hàng - đặt vé
];

// PROVINCES - Dữ liệu tỉnh/thành và quận/huyện Việt Nam
// Dùng cho dropdown chọn địa chỉ khi tạo/sửa user

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

// 3. HELPER COMPONENTS - Components tái sử dụng cho clean code

// TableHeaderCell - Component cho header của table
const TableHeaderCell = ({ children }) => (
  <th className="px-4 py-3 text-left text-sm font-semibold text-black border-b bg-gray-50">
    {children}
  </th>
);

// TableCell - Component cho cell của table
const TableCell = ({ children }) => (
  <td className="px-4 py-4 text-sm text-black border-b">{children}</td>
);

// getRoleStyle - Function trả về CSS class cho từng role (màu sắc khác nhau)
const getRoleStyle = (role) => {
  switch(role.toUpperCase()) {
    case 'ADMIN':
      return 'px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800'; // Đỏ cho Admin
    case 'EMPLOYEE':
      return 'px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800'; // Xanh cho Employee  
    case 'CUSTOMER':
      return 'px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800'; // Xanh lá cho Customer
    default:
      return 'px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800'; // Xám cho role khác
  }
};

// Modal Component - Popup window cho các actions (view, edit, delete, create)
const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null; // Không render nếu modal đóng
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

// 4. MAIN COMPONENT - Component chính quản lý users
const UserManagementContent = () => {
  // 5. STATE MANAGEMENT - Quản lý các trạng thái của component
  
  // Search & Filter States
  const [searchText, setSearchText] = useState(''); // Text user nhập trong ô search
  const [query, setQuery] = useState(''); // Query thực tế được áp dụng khi bấm tìm kiếm
  const [role, setRole] = useState('all'); // Role được chọn để filter
  
  // Data States  
  const [users, setUsers] = useState([]); // Danh sách users từ database
  const [loading, setLoading] = useState(true); // Trạng thái loading khi fetch data

  // Modal States - Quản lý các popup windows
  const [viewing, setViewing] = useState(null); // User đang được xem chi tiết
  const [editing, setEditing] = useState(null); // User đang được chỉnh sửa
  const [deleting, setDeleting] = useState(null); // User đang được xóa
  const [creating, setCreating] = useState(null); // Dữ liệu user mới đang tạo
  const [createErrors, setCreateErrors] = useState({}); // Lỗi validation khi tạo user
  const [editErrors, setEditErrors] = useState({}); // Lỗi validation khi edit user

  // 6. DATA FETCHING - Lấy dữ liệu users từ backend API
  const fetchUsers = async () => {
    try {
      setLoading(true); // Bắt đầu loading state
      const token = localStorage.getItem('token'); // Lấy JWT token từ localStorage
      console.log('Token from localStorage:', token ? 'Token exists' : 'No token'); // Debug log
      
      // SECURITY CHECK: Kiểm tra xem user đã đăng nhập chưa
      if (!token) {
        console.error('No token found in localStorage');
        setUsers([]);
        alert('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      console.log('Making API request to fetch users...');
      // GỌI API: Lấy danh sách users với authorization header
      const response = await axios.get('http://localhost:5000/api/users/', {
        headers: { Authorization: `Bearer ${token}` } // Gửi token để xác thực
      });
      
      console.log('API Response successful, users count:', response.data.length); // Debug log
      
      // DATA TRANSFORMATION: Chuyển đổi dữ liệu từ API format sang UI format
      const transformedUsers = response.data.map(user => ({
        id: user._id,                    // MongoDB _id → id
        name: user.name,                 // Tên user
        email: user.email,               // Email user
        phone: user.phone,               // Số điện thoại
        role: user.role.toUpperCase(),   // Role viết hoa để consistent
        gender: user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác', // Convert gender
        province: user.province || 'N/A', // Tỉnh/thành (N/A nếu không có)
        city: user.city || 'N/A',        // Quận/huyện (N/A nếu không có)
        createdAt: new Date(user.createdAt).toLocaleDateString('vi-VN') // Format ngày theo VN
      }));
      
      setUsers(transformedUsers); // Cập nhật state với dữ liệu đã transform
      console.log('Users set successfully:', transformedUsers.length);
    } catch (error) {
      console.error('Lỗi khi fetch users:', error);
      console.error('Error response:', error.response?.data);
      
      // XỬ LÝ LỖI 401: Token hết hạn hoặc không hợp lệ
      if (error.response?.status === 401) {
        console.error('Token might be expired or invalid');
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        // Xóa token và user data, chuyển về login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      } 
      else {
        // Lỗi khác: server error, network error, etc.
        alert('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
      }
      setUsers([]); // Reset users list
    } finally {
      setLoading(false); // Kết thúc loading state
    }
  };

  // 7. COMPONENT LIFECYCLE - useEffect để fetch data khi component mount
  useEffect(() => {
    fetchUsers(); // Gọi API lấy users ngay khi component được render lần đầu
  }, []); // Dependencies rỗng = chỉ chạy 1 lần

  // 8. SEARCH FUNCTIONALITY - Xử lý tìm kiếm
  const handleSearch = () => {
    setQuery(searchText.trim()); // Áp dụng search text vào query state
  };

  // 9. FILTER & SEARCH LOGIC - useMemo để tối ưu performance
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase(); // Chuẩn hóa query để so sánh
    return users.filter(u => {
      // Filter theo ROLE
      const matchRole = role === 'all' || u.role.toLowerCase() === role;
      // Filter theo SEARCH QUERY (tìm trong email)
      const matchQuery = !q || (u.email || '').toLowerCase().includes(q);
      return matchRole && matchQuery; // Phải thỏa mãn cả 2 điều kiện
    });
  }, [query, role, users]); // Chỉ tính toán lại khi 1 trong 3 dependencies thay đổi

  // 10. CREATE USER FUNCTIONS
  const startCreate = () => {
    // Khởi tạo form tạo user mới với giá trị mặc định
    setCreating({ 
      name: '',           // Tên trống
      email: '',          // Email trống  
      phone: '',          // SĐT trống
      role: 'CUSTOMER',   // Role mặc định là customer
      gender: 'Nam',      // Giới tính mặc định
      province: '',       // Tỉnh trống
      city: ''           // Thành phố trống
    });
    setCreateErrors({}); // Reset errors
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
      await axios.post('http://localhost:5000/api/users/register', {
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
      
      // REMOVED: Không lưu token của user mới để tránh ghi đè token admin
      // Giữ nguyên token admin trong localStorage để tiếp tục có quyền quản lý
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
    
    // Reset errors trước khi validate
    setEditErrors({});
    
    // VALIDATION: Kiểm tra các trường bắt buộc
    const newErrors = {};
    
    // Kiểm tra tên bắt buộc
    if (!editing.name || !editing.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên';
    }
    
    // Kiểm tra email bắt buộc và format
    if (!editing.email || !editing.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else {
      // Kiểm tra email có đuôi được phép
      const allowedDomains = ['@gmail.com', '@example.com', '@cineticket.com'];
      const emailLower = editing.email.toLowerCase();
      const hasValidDomain = allowedDomains.some(domain => emailLower.endsWith(domain));
      if (!hasValidDomain) {
        newErrors.email = 'Email phải có đuôi @gmail.com, @example.com hoặc @cineticket.com';
      } else {
        // Kiểm tra email trùng lặp (trừ user hiện tại)
        const emailExists = users.some(u => 
          u.id !== editing.id && 
          (u.email || '').toLowerCase() === editing.email.toLowerCase()
        );
        if (emailExists) {
          newErrors.email = 'Email đã tồn tại';
        }
      }
    }
    
    // Kiểm tra số điện thoại (bắt buộc)
    if (!editing.phone || !editing.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^\d{10}$/.test(editing.phone.trim())) {
      newErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số';
    }
    
    // Kiểm tra role (bắt buộc)
    if (!editing.role) {
      newErrors.role = 'Vui lòng chọn vai trò';
    }
    
    // Kiểm tra gender (bắt buộc)
    if (!editing.gender) {
      newErrors.gender = 'Vui lòng chọn giới tính';
    }
    
    // Kiểm tra province (bắt buộc)
    if (!editing.province || !editing.province.trim()) {
      newErrors.province = 'Vui lòng nhập tỉnh/thành phố';
    }
    
    // Kiểm tra city (bắt buộc)
    if (!editing.city || !editing.city.trim()) {
      newErrors.city = 'Vui lòng nhập quận/huyện';
    }
    
    // Nếu có lỗi, hiển thị và dừng
    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }
    
    try {
      // Gọi API cập nhật DB
      const token = localStorage.getItem('token');
      // Tạo object dữ liệu cập nhật (không bao gồm password)
      const updateData = {
        name: editing.name,
        email: editing.email,
        phone: editing.phone,
        role: (editing.role || 'CUSTOMER').toLowerCase(),
        gender: (editing.gender === 'Nữ' ? 'female' : editing.gender === 'Nam' ? 'male' : 'other'),
        province: editing.province || 'N/A',
        city: editing.city || 'N/A'
      };
      
      const response = await axios.put(`http://localhost:5000/api/users/${editing.id}`, updateData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setEditing(null);
      // Refresh danh sách users từ database
      await fetchUsers();
      
      // Hiển thị thông báo thành công
      const message = response.data?.message || '✅ Cập nhật người dùng thành công!';
      alert(message);
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
                      <button className="text-black hover:underline" onClick={() => { setEditing({ ...u }); setEditErrors({}); }}>Sửa</button>
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
      <Modal open={!!editing} title="Chỉnh sửa người dùng" onClose={() => { setEditing(null); setEditErrors({}); }}>
        {editing && (
          <div className="space-y-3">
            {/* Tên */}
            <div>
              <input 
                value={editing.name} 
                onChange={e => { 
                  setEditing({ ...editing, name: e.target.value }); 
                  setEditErrors({ ...editErrors, name: undefined }); 
                }} 
                className={`w-full border-2 rounded px-3 py-2 text-black bg-white ${editErrors.name ? 'border-red-500' : 'border-gray-400'}`} 
                placeholder="Tên *" 
              />
              {editErrors.name && <p className="text-red-600 text-sm mt-1">{editErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <input 
                value={editing.email} 
                onChange={e => { 
                  setEditing({ ...editing, email: e.target.value }); 
                  setEditErrors({ ...editErrors, email: undefined }); 
                }} 
                className={`w-full border-2 rounded px-3 py-2 text-black bg-white ${editErrors.email ? 'border-red-500' : 'border-gray-400'}`} 
                placeholder="Email * (@gmail.com, @example.com, @cineticket.com)" 
              />
              {editErrors.email && <p className="text-red-600 text-sm mt-1">{editErrors.email}</p>}
            </div>

            {/* Số điện thoại */}
            <div>
              <input 
                value={editing.phone} 
                onChange={e => { 
                  setEditing({ ...editing, phone: e.target.value }); 
                  setEditErrors({ ...editErrors, phone: undefined }); 
                }} 
                className={`w-full border-2 rounded px-3 py-2 text-black bg-white ${editErrors.phone ? 'border-red-500' : 'border-gray-400'}`} 
                placeholder="Số điện thoại * (10 chữ số)" 
              />
              {editErrors.phone && <p className="text-red-600 text-sm mt-1">{editErrors.phone}</p>}
            </div>

            {/* Tỉnh/Thành phố */}
            <div>
              <select 
                value={editing.province || ''} 
                onChange={e => {
                  const newProvince = e.target.value;
                  setEditing({ ...editing, province: newProvince, city: '' });
                  setEditErrors({ ...editErrors, province: undefined, city: undefined }); 
                }} 
                className={`w-full border-2 rounded px-3 py-2 bg-white text-black ${editErrors.province ? 'border-red-500' : 'border-gray-400'}`}
              >
                <option value="">Chọn Tỉnh/Thành phố *</option>
                {PROVINCES.map(province => (
                  <option key={province.name} value={province.name}>{province.name}</option>
                ))}
              </select>
              {editErrors.province && <p className="text-red-600 text-sm mt-1">{editErrors.province}</p>}
            </div>

            {/* Quận/Huyện */}
            <div>
              <select 
                value={editing.city || ''} 
                onChange={e => { 
                  setEditing({ ...editing, city: e.target.value }); 
                  setEditErrors({ ...editErrors, city: undefined }); 
                }} 
                className={`w-full border-2 rounded px-3 py-2 bg-white text-black ${editErrors.city ? 'border-red-500' : 'border-gray-400'}`}
                disabled={!editing.province}
              >
                <option value="">Chọn Quận/Huyện *</option>
                {editing.province && PROVINCES.find(p => p.name === editing.province)?.cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {editErrors.city && <p className="text-red-600 text-sm mt-1">{editErrors.city}</p>}
            </div>

            {/* Giới tính */}
            <div>
              <select 
                value={editing.gender || 'Nam'} 
                onChange={e => { 
                  setEditing({ ...editing, gender: e.target.value }); 
                  setEditErrors({ ...editErrors, gender: undefined }); 
                }} 
                className={`w-full border-2 rounded px-3 py-2 bg-white text-black ${editErrors.gender ? 'border-red-500' : 'border-gray-400'}`}
              >
                <option value="">Chọn giới tính *</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
              {editErrors.gender && <p className="text-red-600 text-sm mt-1">{editErrors.gender}</p>}
            </div>

            {/* Vai trò */}
            <div>
              <select 
                value={editing.role} 
                onChange={e => { 
                  setEditing({ ...editing, role: e.target.value }); 
                  setEditErrors({ ...editErrors, role: undefined }); 
                }} 
                className={`w-full border-2 rounded px-3 py-2 bg-white text-black ${editErrors.role ? 'border-red-500' : 'border-gray-400'}`}
              >
                <option value="">Chọn vai trò *</option>
                <option value="ADMIN">ADMIN</option>
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="CUSTOMER">CUSTOMER</option>
              </select>
              {editErrors.role && <p className="text-red-600 text-sm mt-1">{editErrors.role}</p>}
            </div>
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


