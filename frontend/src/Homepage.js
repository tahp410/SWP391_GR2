import React from 'react';

const Homepage = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">CineTicket</h1>
          <div className="flex items-center space-x-4">
            <span className="text-yellow-400">Xin chào, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
        
        <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-yellow-400/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Trang chủ</h2>
          <p className="text-gray-300">
            Đây là trang chủ của ứng dụng đặt vé xem phim. 
            Chức năng đang được phát triển...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Homepage;