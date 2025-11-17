import React, { useState } from 'react';
import { loginApi } from '../api'; // Giả sử bạn có một file api.js để gọi API

const UserManagement = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // Gọi API đăng nhập
        loginApi(username, password)
            .then(response => {
                // Giả sử response.data.token là token trả về
                localStorage.setItem('token', response.data.token);
                // Chuyển hướng hoặc thực hiện hành động sau khi đăng nhập thành công
            })
            .catch(error => {
                // Xử lý lỗi đăng nhập
            });
    };

    return (
        <div>
            <h2>Quản lý người dùng</h2>
            <div>
                <input
                    type="text"
                    placeholder="Tên đăng nhập"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
            </div>
            <div>
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
            </div>
            <div>
                <button onClick={handleLogin}>Đăng nhập</button>
            </div>
        </div>
    );
};

export default UserManagement;