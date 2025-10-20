import Theater from '../models/theaterModel.js';
import SeatLayout from '../models/seatLayoutModel.js';
import Branch from '../models/branchModel.js';

// @desc    Get all theaters
// @route   GET /api/theaters
// @access  Private/Admin
const getTheaters = async (req, res) => {
  try {
    const theaters = await Theater.find({})
      .populate('branch', 'name location')
      .populate({
        path: 'seatLayout',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 });

    res.json(theaters);
  } catch (error) {
    console.error('Error fetching theaters:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch theaters' });
  }
};

// @desc    Get theater by ID
// @route   GET /api/theaters/:id
// @access  Private/Admin
const getTheaterById = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id)
      .populate('branch', 'name location')
      .populate({
        path: 'seatLayout',
        options: { strictPopulate: false }
      });

    if (theater) {
      res.json(theater);
    } else {
      res.status(404).json({ message: 'Theater not found' });
    }
  } catch (error) {
    console.error('Error fetching theater by ID:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch theater' });
  }
};

// @desc    Create new theater
// @route   POST /api/theaters
// @access  Private/Admin
const createTheater = async (req, res) => {
  try {
    const { name, branch, seatLayout } = req.body;

    console.log('Creating theater with data:', { name, branch, seatLayout });

    // Validate required fields
    if (!name || !branch) {
      return res.status(400).json({ message: 'Name and branch are required' });
    }

    if (!seatLayout || !seatLayout.name || !seatLayout.rows || !seatLayout.seatsPerRow) {
      return res.status(400).json({ message: 'Seat layout information is incomplete' });
    }

    // Check if branch exists
    const branchExists = await Branch.findById(branch);
    if (!branchExists) {
      return res.status(400).json({ message: 'Branch not found' });
    }

    // Check if theater name already exists in this branch
    const theaterExists = await Theater.findOne({ name, branch });
    if (theaterExists) {
      return res.status(400).json({ message: 'Theater with this name already exists in this branch' });
    }

    // Create seat layout first
    const newSeatLayout = new SeatLayout({
      name: seatLayout.name,
      branch,
      theater: null, // Will be updated after theater creation
      rows: seatLayout.rows,
      seatsPerRow: seatLayout.seatsPerRow,
      rowLabels: seatLayout.rowLabels || Array.from({length: seatLayout.rows}, (_, i) => String.fromCharCode(65 + i)),
      vipRows: seatLayout.vipRows || [],
      disabledSeats: seatLayout.disabledSeats || [],
      coupleSeats: seatLayout.coupleSeats || [],
      aisleAfterColumns: seatLayout.aisleAfterColumns || [],
      screenPosition: seatLayout.screenPosition || { x: 0, y: 0, width: 100 }
    });

    const savedSeatLayout = await newSeatLayout.save();

    // Create theater
    const theater = new Theater({
      name,
      branch,
      seatLayout: savedSeatLayout._id
    });

    const savedTheater = await theater.save();

    // Update seat layout with theater reference
    savedSeatLayout.theater = savedTheater._id;
    await savedSeatLayout.save();

    // Populate and return the created theater
    const populatedTheater = await Theater.findById(savedTheater._id)
      .populate('branch', 'name location')
      .populate({
        path: 'seatLayout',
        options: { strictPopulate: false }
      });

    console.log('Theater created successfully:', populatedTheater._id);
    res.status(201).json(populatedTheater);
  } catch (error) {
    console.error('Error creating theater:', error);
    res.status(500).json({ message: error.message || 'Failed to create theater' });
  }
};

// @desc    Update theater
// @route   PUT /api/theaters/:id
// @access  Private/Admin
const updateTheater = async (req, res) => {
  try {
    const { name, branch, seatLayout } = req.body;

    const theater = await Theater.findById(req.params.id);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }

    // Check if branch exists
    if (branch) {
      const branchExists = await Branch.findById(branch);
      if (!branchExists) {
        return res.status(400).json({ message: 'Branch not found' });
      }
    }

    // Check if name already exists in this branch (excluding current theater)
    if (name && branch) {
      const theaterExists = await Theater.findOne({ 
        name, 
        branch, 
        _id: { $ne: req.params.id } 
      });
      if (theaterExists) {
        return res.status(400).json({ message: 'Theater with this name already exists in this branch' });
      }
    }

    // Update theater basic info
    if (name) theater.name = name;
    if (branch) theater.branch = branch;

    // Update seat layout if provided
    if (seatLayout && theater.seatLayout) {
      const existingSeatLayout = await SeatLayout.findById(theater.seatLayout);
      if (existingSeatLayout) {
        existingSeatLayout.name = seatLayout.name || existingSeatLayout.name;
        existingSeatLayout.rows = seatLayout.rows || existingSeatLayout.rows;
        existingSeatLayout.seatsPerRow = seatLayout.seatsPerRow || existingSeatLayout.seatsPerRow;
        existingSeatLayout.rowLabels = seatLayout.rowLabels || existingSeatLayout.rowLabels;
        existingSeatLayout.vipRows = seatLayout.vipRows || existingSeatLayout.vipRows;
        existingSeatLayout.disabledSeats = seatLayout.disabledSeats || existingSeatLayout.disabledSeats;
        existingSeatLayout.coupleSeats = seatLayout.coupleSeats || existingSeatLayout.coupleSeats;
        existingSeatLayout.aisleAfterColumns = seatLayout.aisleAfterColumns || existingSeatLayout.aisleAfterColumns;
        existingSeatLayout.screenPosition = seatLayout.screenPosition || existingSeatLayout.screenPosition;
        existingSeatLayout.branch = branch || existingSeatLayout.branch;
        
        await existingSeatLayout.save();
      }
    }

    const updatedTheater = await theater.save();

    // Populate and return the updated theater
    const populatedTheater = await Theater.findById(updatedTheater._id)
      .populate('branch', 'name location')
      .populate('seatLayout');

    res.json(populatedTheater);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete theater
// @route   DELETE /api/theaters/:id
// @access  Private/Admin
const deleteTheater = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }

    // Delete associated seat layout
    if (theater.seatLayout) {
      await SeatLayout.findByIdAndDelete(theater.seatLayout);
    }

    // Delete theater
    await Theater.findByIdAndDelete(req.params.id);

    res.json({ message: 'Theater and associated seat layout deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get theaters by branch
// @route   GET /api/theaters/branch/:branchId
// @access  Private/Admin
const getTheatersByBranch = async (req, res) => {
  try {
    const theaters = await Theater.find({ branch: req.params.branchId })
      .populate('branch', 'name location')
      .populate({
        path: 'seatLayout',
        options: { strictPopulate: false }
      })
      .sort({ name: 1 });

    res.json(theaters);
  } catch (error) {
    console.error('Error fetching theaters by branch:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch theaters' });
  }
};

// @desc    Get seat layout by theater
// @route   GET /api/theaters/:id/seat-layout
// @access  Private/Admin
const getSeatLayoutByTheater = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id).populate('seatLayout');
    
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }

    if (!theater.seatLayout) {
      return res.status(404).json({ message: 'Seat layout not found for this theater' });
    }

    res.json(theater.seatLayout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getTheaters,
  getTheaterById,
  createTheater,
  updateTheater,
  deleteTheater,
  getTheatersByBranch,
  getSeatLayoutByTheater
};