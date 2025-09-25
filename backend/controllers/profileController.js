import User from "../models/userModel.js";

export const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không tìm thấy user" });
    }

    const user = await User.findById(req.user._id).select("-password"); 
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};




export const updateUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không tìm thấy user" });
    }

    const {
      name,
      email,
      dob,     
      phone,
      province,
      city,
      sex,
    } = req.body;

    // Chỉ allow các field này
    const updates = {};

    if (typeof name === "string") updates.name = name.trim();

    if (typeof email === "string") {
      const newEmail = email.trim().toLowerCase();
      const existed = await User.findOne({
        email: newEmail,
        _id: { $ne: req.user._id },
      });
      if (existed) {
        return res.status(409).json({ message: "Email đã được sử dụng" });
      }
      updates.email = newEmail;
    }

    if (typeof phone === "string") updates.phone = phone.trim();
    if (typeof province === "string") updates.province = province;
    if (typeof city === "string") updates.city = city;
    if (typeof sex === "string") updates.sex = sex;

    
    if (dob) {
      let parsed;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
        const [dd, mm, yyyy] = dob.split("/");
        parsed = new Date(`${dd}-${mm}-${yyyy}`);
      } else {
        parsed = new Date(dob);
      }
      if (!isNaN(parsed.getTime())) {
        updates.dob = parsed;
      } else {
        return res.status(400).json({ message: "dateOfBirth không hợp lệ" });
      }
    }

    // Cập nhật
    const updated = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
      context: "query",
      select: "-password",
    }).lean();

    if (!updated) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    res.json({
      name: updated.name ?? updated.name ?? "",
      email: updated.email ?? "",
      dob: updated.dob ?? null,
      phone: updated.phone ?? "",
      province: updated.province ?? "",
      city: updated.city ?? updated.address?.city ?? "",
      sex: updated.sex ?? updated.gender ?? "Other",
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

