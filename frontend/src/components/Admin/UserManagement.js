import React, { useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';

const ROLES = [
  { label: 'Tất cả vai trò', value: 'all' },
  { label: 'ADMIN', value: 'admin' },
  { label: 'EMPLOYEE', value: 'employee' },
  { label: 'CUSTOMER', value: 'customer' }
];

// Dữ liệu mẫu tạm thời – sẽ thay bằng API sau
const SAMPLE_USERS = [
  { id: 'u1', name: 'Đăng Phát', gender: 'Nam', email: 'dphat@example.com', phone: '0123456789', role: 'CUSTOMER', createdAt: '29/9/2025' },
  { id: 'u2', name: 'Trần Minh Hoàng', gender: 'Nam', email: 'hoang.staff@cineticket.com', phone: '0778899001', role: 'EMPLOYEE', createdAt: '29/9/2025' },
  { id: 'u3', name: 'Admin User', gender: 'Nam', email: 'admin@cineticket.com', phone: '0987654321', role: 'ADMIN', createdAt: '29/9/2025' },
  { id: 'u4', name: 'Nguyễn Thu Hà', gender: 'Nữ', email: 'thuha@example.com', phone: '0334455667', role: 'CUSTOMER', createdAt: '29/9/2025' },
  { id: 'u5', name: 'Lê Thị Ánh', gender: 'Nữ', email: 'anh.staff@cineticket.com', phone: '0445566778', role: 'EMPLOYEE', createdAt: '29/9/2025' }
];

const TableHeaderCell = ({ children }) => (
  <th className="px-4 py-3 text-left text-sm font-semibold text-black border-b bg-gray-50">
    {children}
  </th>
);

const TableCell = ({ children }) => (
  <td className="px-4 py-4 text-sm text-black border-b">{children}</td>
);

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
  const [users, setUsers] = useState(SAMPLE_USERS);

  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [creating, setCreating] = useState(null);
  const [createErrors, setCreateErrors] = useState({});

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
    setCreating({ name: '', email: '', phone: '', role: 'CUSTOMER', gender: 'Nam' });
    setCreateErrors({});
  };

  const commitCreate = async () => {
    if (!creating?.name || !creating?.email) {
      setCreateErrors({ form: 'Vui lòng nhập tên và email' });
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
        province: 'N/A',
        city: 'N/A',
        dob: '2000-01-01'
      });

      const apiUser = res.data;
      const newUser = {
        id: apiUser._id,
        name: apiUser.name,
        email: apiUser.email,
        phone: creating.phone,
        role: (creating.role || 'CUSTOMER').toUpperCase(),
        gender: creating.gender || 'Nam',
        createdAt: new Date().toLocaleDateString('vi-VN')
      };
      setUsers(prev => [newUser, ...prev]);
      setCreating(null);
      // optional: lưu token để có thể đăng nhập ngay (tùy flow hiện tại)
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

  const commitEdit = () => {
    if (!editing) return;
    // Gọi API cập nhật DB
    const token = localStorage.getItem('token');
    axios.put(`http://localhost:5000/api/users/${editing.id}`, {
      name: editing.name,
      email: editing.email,
      phone: editing.phone,
      role: (editing.role || 'CUSTOMER').toLowerCase(),
      gender: (editing.gender === 'Nữ' ? 'female' : editing.gender === 'Nam' ? 'male' : 'other')
    }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(() => {
      setUsers(prev => prev.map(u => u.id === editing.id ? editing : u));
      setEditing(null);
    }).catch((e) => {
      console.error(e);
      alert('Cập nhật thất bại');
    });
  };

  const commitDelete = () => {
    if (!deleting) return;
    setUsers(prev => prev.filter(u => u.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-extrabold text-black mb-2">Quản lý người dùng</h1>
        <p className="text-lg text-black">Quản lý tài khoản người dùng trong hệ thống</p>
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
              <TableHeaderCell>Vai trò</TableHeaderCell>
              <TableHeaderCell>Ngày tạo</TableHeaderCell>
              <TableHeaderCell>Thao tác</TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
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
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-black">
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
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-black" colSpan={6}>Không có người dùng phù hợp</td>
              </tr>
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
            <div><b>Vai trò:</b> {viewing.role}</div>
            <div><b>Ngày tạo:</b> {viewing.createdAt}</div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} title="Chỉnh sửa người dùng" onClose={() => setEditing(null)}>
        {editing && (
          <div className="space-y-3">
            <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full border rounded px-3 py-2 text-black bg-white" placeholder="Tên" />
            <input value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} className="w-full border rounded px-3 py-2 text-black bg-white" placeholder="Email" />
            <input value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} className="w-full border rounded px-3 py-2 text-black bg-white" placeholder="Số điện thoại" />
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
            <input value={creating.email} onChange={e => { setCreating({ ...creating, email: e.target.value }); setCreateErrors({ ...createErrors, email: undefined }); }} className="w-full border rounded px-3 py-2 text-black bg-white" placeholder="Email" />
            {createErrors.email && <p className="text-red-600 text-sm">{createErrors.email}</p>}
            <input
              value={creating.password || ''}
              onChange={e => setCreating({ ...creating, password: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mật khẩu"
              type="password"
              autoComplete="new-password"
              style={{ backgroundColor: '#ffffff', color: '#000000', WebkitBoxShadow: '0 0 0px 1000px #ffffff inset', borderColor: '#d1d5db' }}
            />
            <input value={creating.phone} onChange={e => { setCreating({ ...creating, phone: e.target.value }); setCreateErrors({ ...createErrors, phone: undefined }); }} className="w-full border rounded px-3 py-2 text-black bg-white" placeholder="Số điện thoại" />
            {createErrors.phone && <p className="text-red-600 text-sm">{createErrors.phone}</p>}
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


