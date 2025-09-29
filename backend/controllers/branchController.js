import Branch from "../models/branchModel.js";
import Theater from "../models/theaterModel.js";

// Lấy tất cả chi nhánh
export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find().populate('theaters', 'name');
    res.json(branches);
  } catch (error) {
    console.error("Get all branches error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy chi nhánh theo ID
export const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('theaters', 'name');
    if (!branch) {
      return res.status(404).json({ message: "Không tìm thấy chi nhánh" });
    }
    res.json(branch);
  } catch (error) {
    console.error("Get branch by ID error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Tạo chi nhánh mới
export const createBranch = async (req, res) => {
  try {
    const {
      name,
      location,
      contact,
      operatingHours,
      facilities,
      image,
      isActive
    } = req.body;

    // Validate required fields
    if (!name || !location?.address || !location?.city || !location?.province || !contact?.phone) {
      return res.status(400).json({ 
        message: "Thiếu thông tin bắt buộc: tên, địa chỉ, thành phố, tỉnh, số điện thoại" 
      });
    }

    // Process facilities array
    const facilitiesArray = typeof facilities === 'string' 
      ? facilities.split(',').map(f => f.trim()).filter(f => f)
      : Array.isArray(facilities) ? facilities : [];

    const branchData = {
      name: name.trim(),
      location: {
        address: location.address.trim(),
        city: location.city.trim(),
        province: location.province.trim(),
        coordinates: location.coordinates || {}
      },
      contact: {
        phone: contact.phone.trim(),
        email: contact.email?.trim() || ""
      },
      operatingHours: operatingHours || { open: "09:00", close: "23:00" },
      facilities: facilitiesArray,
      image: image || "",
      isActive: isActive !== undefined ? isActive : true,
      theaters: []
    };

    const branch = new Branch(branchData);
    await branch.save();

    res.status(201).json(branch);
  } catch (error) {
    console.error("Create branch error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Cập nhật chi nhánh
export const updateBranch = async (req, res) => {
  try {
    const {
      name,
      location,
      contact,
      operatingHours,
      facilities,
      image,
      isActive
    } = req.body;

    // Validate required fields
    if (!name || !location?.address || !location?.city || !location?.province || !contact?.phone) {
      return res.status(400).json({ 
        message: "Thiếu thông tin bắt buộc: tên, địa chỉ, thành phố, tỉnh, số điện thoại" 
      });
    }

    // Process facilities array
    const facilitiesArray = typeof facilities === 'string' 
      ? facilities.split(',').map(f => f.trim()).filter(f => f)
      : Array.isArray(facilities) ? facilities : [];

    const updateData = {
      name: name.trim(),
      location: {
        address: location.address.trim(),
        city: location.city.trim(),
        province: location.province.trim(),
        coordinates: location.coordinates || {}
      },
      contact: {
        phone: contact.phone.trim(),
        email: contact.email?.trim() || ""
      },
      operatingHours: operatingHours || { open: "09:00", close: "23:00" },
      facilities: facilitiesArray,
      image: image || "",
      isActive: isActive !== undefined ? isActive : true
    };

    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('theaters', 'name');

    if (!branch) {
      return res.status(404).json({ message: "Không tìm thấy chi nhánh" });
    }

    res.json(branch);
  } catch (error) {
    console.error("Update branch error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Xóa chi nhánh
export const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: "Không tìm thấy chi nhánh" });
    }

    // Kiểm tra xem chi nhánh có rạp chiếu nào không
    if (branch.theaters.length > 0) {
      return res.status(400).json({ 
        message: "Không thể xóa chi nhánh này vì còn có rạp chiếu" 
      });
    }

    await Branch.findByIdAndDelete(req.params.id);
    res.json({ message: "Xóa chi nhánh thành công" });
  } catch (error) {
    console.error("Delete branch error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Tìm kiếm chi nhánh
export const searchBranches = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.json([]);
    }

    const searchTerm = q.trim();
    const branches = await Branch.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { 'location.city': { $regex: searchTerm, $options: 'i' } },
        { 'location.province': { $regex: searchTerm, $options: 'i' } }
      ]
    }).populate('theaters', 'name');

    res.json(branches);
  } catch (error) {
    console.error("Search branches error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
