import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Movie from './models/movieModel.js';
import Theater from './models/theaterModel.js';
import Branch from './models/branchModel.js';
import Showtime from './models/showtimeModel.js';
import Seat from './models/seatModel.js';
import Booking from './models/bookingModel.js';
import Voucher from './models/voucherModel.js';
import connectDB from './config/db.js';

dotenv.config();

// Connect to MongoDB
connectDB();

// Function to clear all collections
const clearCollections = async () => {
  try {
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Branch.deleteMany({});
    await Theater.deleteMany({});
    await Showtime.deleteMany({});
    await Seat.deleteMany({});
    await Booking.deleteMany({});
    await Voucher.deleteMany({});
    console.log('Collections cleared');
  } catch (error) {
    console.error('Error clearing collections:', error);
    process.exit(1);
  }
};

// Function to seed data
const seedData = async () => {
  try {
    // Create users (passwords will be hashed by userModel pre('save'))
    const users = await User.create([
      {
        name: 'Bùi Giang',
        email: 'lan22011971@gmail.com',
        password: '123456',
        phone: '0852244888',
        province: 'Hà Nội',
        city: 'Hà Nội',
        gender: 'male',
        dob: new Date('2005-09-12'),
        role: 'customer',
        preferences: {
          genres: ['Action', 'Comedy'],
          favoriteMovies: []
        }
      },
      {
        name: 'Đặng Phát',
        email: 'dphat@example.com',
        password: '123456',
        phone: '0123456789',
        province: 'Hồ Chí Minh',
        city: 'Quận 1',
        gender: 'male',
        dob: new Date('2000-01-01'),
        role: 'customer',
        preferences: {
          genres: ['Action', 'Comedy'],
          favoriteMovies: []
        }
      },
      {
        name: 'Admin User',
        email: 'admin@cineticket.com',
        password: '123456',
        phone: '0987654321',
        province: 'Hồ Chí Minh',
        city: 'Quận 1',
        gender: 'male',
        dob: new Date('1990-01-01'),
        role: 'admin',
        preferences: {
          genres: [],
          favoriteMovies: []
        }
      },
      {
        name: 'Nguyễn Thu Hà',
        email: 'thuha@example.com',
        password: '123456',
        phone: '0334455667',
        province: 'Hồ Chí Minh',
        city: 'Quận 7',
        gender: 'female',
        dob: new Date('1995-05-15'),
        role: 'customer',
        preferences: {
          genres: ['Romance', 'Drama'],
          favoriteMovies: []
        }
      },
      {
        name: 'Trần Minh Hoàng',
        email: 'hoang.staff@cineticket.com',
        password: '123456',
        phone: '0778899001',
        province: 'Hồ Chí Minh',
        city: 'Quận 3',
        gender: 'male',
        dob: new Date('1993-08-20'),
        role: 'employee',
        preferences: {
          genres: ['Action', 'Sci-Fi'],
          favoriteMovies: []
        }
      },
      {
        name: 'Lê Thị Ánh',
        email: 'anh.staff@cineticket.com',
        password: '123456',
        phone: '0445566778',
        province: 'Hồ Chí Minh',
        city: 'Quận 5',
        gender: 'female',
        dob: new Date('1997-12-10'),
        role: 'employee',
        preferences: {
          genres: ['Horror', 'Thriller'],
          favoriteMovies: []
        }
      }
    ]);

    // Create movies
    const movies = await Movie.create([
      {
        title: 'Avengers: Endgame',
        description: 'Sau sự kiện Thanos, các Avengers còn sống phải tập hợp lại một lần nữa',
        duration: 181,
        releaseDate: new Date('2025-10-01'),
        endDate: new Date('2025-12-31'),
        genre: ['Action', 'Adventure', 'Drama'],
        language: 'English',
        director: 'Anthony Russo, Joe Russo',
        cast: ['Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo'],
        poster: 'avengers_endgame.jpg',
        trailer: 'https://youtube.com/watch?v=TcMBFSGVi1c',
        status: 'coming-soon'
      },
      {
        title: 'Spider-Man: No Way Home',
        description: 'Peter Parker đối mặt với đa vũ trụ',
        duration: 148,
        releaseDate: new Date('2025-09-30'),
        endDate: new Date('2025-11-30'),
        genre: ['Action', 'Adventure', 'Fantasy'],
        language: 'English',
        director: 'Jon Watts',
        cast: ['Tom Holland', 'Zendaya', 'Benedict Cumberbatch'],
        poster: 'spiderman.jpg',
        trailer: 'https://youtube.com/watch?v=JfVOs4VSpmA',
        status: 'now-showing'
      }
    ]);

    // Create branches first
    const branches = await Branch.create([
      {
        name: 'CineTicket Quận 1',
        location: {
          address: '123 Nguyễn Huệ',
          city: 'Quận 1',
          province: 'TP.HCM',
          coordinates: {
            latitude: 10.7721,
            longitude: 106.7037
          }
        },
        contact: {
          phone: '028-1234567',
          email: 'quan1@cineticket.com'
        },
        facilities: ['IMAX', '4DX', 'VIP Lounge'],
        operatingHours: {
          open: '09:00',
          close: '23:00'
        },
        isActive: true
      }
    ]);

    // Create theaters
    const theaters = await Theater.create([
      {
        name: 'Cinema 1',
        branch: branches[0]._id,
      },
      {
        name: 'Cinema 2',
        branch: branches[0]._id,
      }
    ]);

    // Create showtimes
    const showtimes = await Showtime.create([
      {
        movie: movies[0]._id,
        theater: theaters[0]._id,
        branch: branches[0]._id,
        startTime: new Date('2025-09-25T10:00:00Z'),
        endTime: new Date('2025-09-25T12:30:00Z'),
        price: {
          standard: 90000,
          vip: 120000,
          couple: 160000
        },
        status: 'active'
      }
    ]);

    // Create seats
    const seats = await Seat.create([
      {
        theater: theaters[0]._id,
        branch: branches[0]._id,
        row: 'A',
        number: 1,
        type: 'standard',
        isActive: true,
        position: {
          x: 1,
          y: 1
        }
      },
      {
        theater: theaters[0]._id,
        branch: branches[0]._id,
        row: 'B',
        number: 1,
        type: 'vip',
        isActive: true,
        position: {
          x: 1,
          y: 2
        }
      }
    ]);

    // Create vouchers
    const vouchers = await Voucher.create([
      {
        code: 'WELCOME2025',
        description: 'Giảm 20% cho khách hàng mới',
        discountType: 'percentage',
        discountValue: 20,
        minPurchase: 100000,
        maxDiscount: 50000,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-12-31'),
        usageLimit: 1000,
        usedCount: 0,
        status: 'active'
      }
    ]);

    console.log('Data seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seeding process
const runSeed = async () => {
  await clearCollections();
  await seedData();
};

runSeed();