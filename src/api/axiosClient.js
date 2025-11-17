import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:5000/api',
    // ...existing config...
});

// Thêm interceptor để tự động thêm token vào mỗi request
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosClient;