import axiosClient from '../api/axiosClient';

// Ví dụ gọi API:
axiosClient.get('/showtimes')
    .then(res => {
        // ...existing code...
    })
    .catch(err => {
        // ...existing code...
    });