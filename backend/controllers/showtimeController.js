import Showtime from '../models/showtimeModel.js';
import Movie from '../models/movieModel.js';
import Theater from '../models/theaterModel.js';
import Branch from '../models/branchModel.js';

// @desc    Get all showtimes
// @route   GET /api/showtimes
// @access  Private/Admin
const getShowtimes = async (req, res) => {
  try {
    const showtimes = await Showtime.find({})
      .populate('movie', 'title duration genre rating')
      .populate('branch', 'name location')
      .populate('theater', 'name')
      .sort({ startTime: 1 });

    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get showtime by ID
// @route   GET /api/showtimes/:id
// @access  Private/Admin
const getShowtimeById = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate('movie', 'title duration genre rating')
      .populate('branch', 'name location')
      .populate('theater', 'name');

    if (showtime) {
      res.json(showtime);
    } else {
      res.status(404).json({ message: 'Showtime not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new showtime
// @route   POST /api/showtimes
// @access  Private/Admin
const createShowtime = async (req, res) => {
  try {
    const { movie, branch, theater, startTime, endTime, price, status } = req.body;

    // Validate required fields
    if (!movie || !branch || !theater || !startTime || !endTime || !price?.standard) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if movie exists
    const movieExists = await Movie.findById(movie);
    if (!movieExists) {
      return res.status(400).json({ message: 'Movie not found' });
    }

    // Check if showtime date is valid (must be after or equal to release date)
    const showtimeDate = new Date(startTime);
    const movieReleaseDate = new Date(movieExists.releaseDate);
    
    // Set both dates to start of day for comparison
    showtimeDate.setHours(0, 0, 0, 0);
    movieReleaseDate.setHours(0, 0, 0, 0);
    
    if (showtimeDate < movieReleaseDate) {
      return res.status(400).json({ 
        message: `Không thể tạo lịch chiếu trước ngày ra mắt phim (${movieReleaseDate.toLocaleDateString('vi-VN')})` 
      });
    }

    // Check if branch exists
    const branchExists = await Branch.findById(branch);
    if (!branchExists) {
      return res.status(400).json({ message: 'Branch not found' });
    }

    // Check if theater exists and belongs to the branch
    const theaterExists = await Theater.findById(theater);
    if (!theaterExists) {
      return res.status(400).json({ message: 'Theater not found' });
    }

    if (theaterExists.branch.toString() !== branch) {
      return res.status(400).json({ message: 'Theater does not belong to the selected branch' });
    }

    // Check for time conflicts in the same theater
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);

    if (startDateTime >= endDateTime) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const conflictingShowtime = await Showtime.findOne({
      theater,
      status: { $ne: 'cancelled' },
      $or: [
        {
          startTime: { $lt: endDateTime },
          endTime: { $gt: startDateTime }
        }
      ]
    });

    if (conflictingShowtime) {
      return res.status(400).json({ 
        message: 'Time conflict with existing showtime in this theater' 
      });
    }

    // Create showtime
    const showtime = new Showtime({
      movie,
      branch,
      theater,
      startTime: startDateTime,
      endTime: endDateTime,
      price: {
        standard: Number(price.standard),
        vip: Number(price.vip) || 0,
        couple: Number(price.couple) || 0
      },
      status: status || 'active'
    });

    const savedShowtime = await showtime.save();

    // Populate and return the created showtime
    const populatedShowtime = await Showtime.findById(savedShowtime._id)
      .populate('movie', 'title duration genre rating')
      .populate('branch', 'name location')
      .populate('theater', 'name');

    res.status(201).json(populatedShowtime);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update showtime
// @route   PUT /api/showtimes/:id
// @access  Private/Admin
const updateShowtime = async (req, res) => {
  try {
    const { movie, branch, theater, startTime, endTime, price, status } = req.body;

    const showtime = await Showtime.findById(req.params.id);
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    // Validate references if provided
    if (movie) {
      const movieExists = await Movie.findById(movie);
      if (!movieExists) {
        return res.status(400).json({ message: 'Movie not found' });
      }

      // Check if showtime date is valid (must be after or equal to release date)
      const checkStartTime = startTime || showtime.startTime;
      const showtimeDate = new Date(checkStartTime);
      const movieReleaseDate = new Date(movieExists.releaseDate);
      
      // Set both dates to start of day for comparison
      showtimeDate.setHours(0, 0, 0, 0);
      movieReleaseDate.setHours(0, 0, 0, 0);
      
      if (showtimeDate < movieReleaseDate) {
        return res.status(400).json({ 
          message: `Không thể tạo lịch chiếu trước ngày ra mắt phim (${movieReleaseDate.toLocaleDateString('vi-VN')})` 
        });
      }
    }

    if (branch) {
      const branchExists = await Branch.findById(branch);
      if (!branchExists) {
        return res.status(400).json({ message: 'Branch not found' });
      }
    }

    if (theater) {
      const theaterExists = await Theater.findById(theater);
      if (!theaterExists) {
        return res.status(400).json({ message: 'Theater not found' });
      }

      const checkBranch = branch || showtime.branch;
      if (theaterExists.branch.toString() !== checkBranch.toString()) {
        return res.status(400).json({ message: 'Theater does not belong to the selected branch' });
      }
    }

    // Check if startTime is being updated and validate against release date
    if (startTime && !movie) {
      // If movie is not being changed, check against existing movie's release date
      const existingMovie = await Movie.findById(showtime.movie);
      if (existingMovie) {
        const showtimeDate = new Date(startTime);
        const movieReleaseDate = new Date(existingMovie.releaseDate);
        
        // Set both dates to start of day for comparison
        showtimeDate.setHours(0, 0, 0, 0);
        movieReleaseDate.setHours(0, 0, 0, 0);
        
        if (showtimeDate < movieReleaseDate) {
          return res.status(400).json({ 
            message: `Không thể tạo lịch chiếu trước ngày ra mắt phim (${movieReleaseDate.toLocaleDateString('vi-VN')})` 
          });
        }
      }
    }

    // Check time conflicts (excluding current showtime)
    if (startTime && endTime) {
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(endTime);

      if (startDateTime >= endDateTime) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }

      const checkTheater = theater || showtime.theater;
      const conflictingShowtime = await Showtime.findOne({
        _id: { $ne: req.params.id },
        theater: checkTheater,
        status: { $ne: 'cancelled' },
        $or: [
          {
            startTime: { $lt: endDateTime },
            endTime: { $gt: startDateTime }
          }
        ]
      });

      if (conflictingShowtime) {
        return res.status(400).json({ 
          message: 'Time conflict with existing showtime in this theater' 
        });
      }
    }

    // Update fields
    if (movie) showtime.movie = movie;
    if (branch) showtime.branch = branch;
    if (theater) showtime.theater = theater;
    if (startTime) showtime.startTime = new Date(startTime);
    if (endTime) showtime.endTime = new Date(endTime);
    if (status) showtime.status = status;
    
    if (price) {
      showtime.price = {
        standard: Number(price.standard) || showtime.price.standard,
        vip: Number(price.vip) || showtime.price.vip || 0,
        couple: Number(price.couple) || showtime.price.couple || 0
      };
    }

    const updatedShowtime = await showtime.save();

    // Populate and return the updated showtime
    const populatedShowtime = await Showtime.findById(updatedShowtime._id)
      .populate('movie', 'title duration genre rating')
      .populate('branch', 'name location')
      .populate('theater', 'name');

    res.json(populatedShowtime);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete showtime
// @route   DELETE /api/showtimes/:id
// @access  Private/Admin
const deleteShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id);
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    await Showtime.findByIdAndDelete(req.params.id);
    res.json({ message: 'Showtime deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get showtimes by branch
// @route   GET /api/showtimes/branch/:branchId
// @access  Private/Admin
const getShowtimesByBranch = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ branch: req.params.branchId })
      .populate('movie', 'title duration genre rating')
      .populate('branch', 'name location')
      .populate('theater', 'name')
      .sort({ startTime: 1 });

    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get showtimes by theater
// @route   GET /api/showtimes/theater/:theaterId
// @access  Private/Admin
const getShowtimesByTheater = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ theater: req.params.theaterId })
      .populate('movie', 'title duration genre rating')
      .populate('branch', 'name location')
      .populate('theater', 'name')
      .sort({ startTime: 1 });

    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get showtimes by date range
// @route   GET /api/showtimes/date-range
// @access  Private/Admin
const getShowtimesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, branch, theater } = req.query;

    const filter = {};
    
    if (startDate && endDate) {
      filter.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (branch) filter.branch = branch;
    if (theater) filter.theater = theater;

    const showtimes = await Showtime.find(filter)
      .populate('movie', 'title duration genre rating')
      .populate('branch', 'name location')
      .populate('theater', 'name')
      .sort({ startTime: 1 });

    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public showtimes (for user homepage)
// @route   GET /api/showtimes/public
// @access  Public
const getPublicShowtimes = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ status: 'active' })
      .populate('movie', 'title duration genre poster rating')
      .populate('branch', 'name location')
      .populate('theater', 'name')
      .sort({ startTime: 1 });

    // Chỉ trả ra những field user cần xem
    const formattedShowtimes = showtimes.map(st => ({
      id: st._id,
      movieTitle: st.movie?.title,
      moviePoster: st.movie?.poster,
      movieGenre: st.movie?.genre,
      branchName: st.branch?.name,
      theaterName: st.theater?.name,
      startTime: st.startTime,
      endTime: st.endTime,
      price: st.price?.standard,
    }));

    res.json(formattedShowtimes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getShowtimesByBranch,
  getShowtimesByTheater,
  getShowtimesByDateRange,
  getPublicShowtimes
};