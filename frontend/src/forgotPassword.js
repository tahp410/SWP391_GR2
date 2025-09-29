import React, { useState } from "react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("⏳ Đang gửi email...");

    try {
      const res = await fetch("http://localhost:5000/api/users/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Email reset password đã được gửi. Hãy kiểm tra hộp thư!");
      } else {
        setMessage(`❌ ${data.message || "Có lỗi xảy ra"}`);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setMessage("🚨 Lỗi kết nối server");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-b from-red-900 to-black">
      <div className="bg-black bg-opacity-70 p-8 rounded-xl w-96">
        <h2 className="text-2xl text-center text-yellow-400 mb-6">
          Quên mật khẩu
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition duration-200"
          >
            Gửi yêu cầu
          </button>
        </form>
        {message && (
          <p className="text-center text-white mt-4">{message}</p>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
