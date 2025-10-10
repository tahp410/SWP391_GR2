import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Kiểm tra mật khẩu khớp nhau
    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/users/reset-password/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password, confirmPassword }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Đổi mật khẩu thành công! Đang chuyển về trang đăng nhập...");
        setTimeout(() => navigate("/"), 2000);
      } else {
        setMessage(data.message || "❌ Có lỗi xảy ra");
      }
    } catch (err) {
      setMessage("❌ Lỗi kết nối server");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-b from-red-900 to-black">
      <div className="bg-black bg-opacity-70 p-8 rounded-xl w-96">
        <h2 className="text-2xl text-center text-yellow-400 mb-6">
          Đặt lại mật khẩu
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
              required
              minLength="6"
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="p-3 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
              required
              minLength="6"
            />
          </div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition duration-200"
          >
            Đặt lại mật khẩu
          </button>
        </form>
        {error && (
          <p className="text-center text-red-500 mt-4">{error}</p>
        )}
        {message && (
          <p className="text-center text-green-500 mt-4">{message}</p>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;