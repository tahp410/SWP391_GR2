```javascript
// ...existing code...

// Hàm xử lý đăng nhập
const handleLogin = async (credentials) => {
  try {
    const response = await api.post('/login', credentials);
    
    // Nếu đăng nhập thành công, lưu token vào localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // ...existing code...
    }
  } catch (error) {
    console.error('Đăng nhập thất bại:', error);
    // ...existing code...
  }
};

// ...existing code...
```