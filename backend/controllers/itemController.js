// controllers/itemController.js
import Item from "../models/itemModel.js";

// @desc    Lấy tất cả items
// @route   GET /api/items
// @access  Public
export const getAllItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách sản phẩm" });
  }
};

// @desc    Lấy item theo ID
// @route   GET /api/items/:id
// @access  Public
export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    
    res.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    }
    res.status(500).json({ message: "Lỗi server khi lấy thông tin sản phẩm" });
  }
};

// @desc    Tạo item mới
// @route   POST /api/items
// @access  Private/Admin
export const createItem = async (req, res) => {
  try {
    const { name, type, size, price, cost, image_url } = req.body;

    // Validation
    if (!name || !type || !size || !price || !cost) {
      return res.status(400).json({ 
        message: "Vui lòng điền đầy đủ thông tin: tên, loại, kích cỡ, giá bán và giá vốn sản phẩm" 
      });
    }

    // Kiểm tra loại sản phẩm hợp lệ
    const validTypes = ["popcorn", "drink", "snack"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: "Loại sản phẩm không hợp lệ. Chỉ chấp nhận: popcorn, drink, snack" 
      });
    }

    // Kiểm tra giá hợp lệ
    if (price <= 0) {
      return res.status(400).json({ 
        message: "Giá bán sản phẩm phải lớn hơn 0" 
      });
    }

    // Kiểm tra giá vốn hợp lệ
    if (cost < 0) {
      return res.status(400).json({ 
        message: "Giá vốn sản phẩm phải lớn hơn hoặc bằng 0" 
      });
    }

    // Tạo item mới
    const item = new Item({
      name: name.trim(),
      type,
      size,
      price: Number(price),
      cost: Number(cost),
      image_url: image_url ? image_url.trim() : "",
    });

    const savedItem = await item.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ message: "Lỗi server khi tạo sản phẩm" });
  }
};

// @desc    Cập nhật item
// @route   PUT /api/items/:id
// @access  Private/Admin
export const updateItem = async (req, res) => {
  try {
    const { name, type, size, price, cost, image_url } = req.body;

    // Validation
    if (!name || !type || !size || !price || cost === undefined) {
      return res.status(400).json({ 
        message: "Vui lòng điền đầy đủ thông tin: tên, loại, kích cỡ, giá bán và giá vốn sản phẩm" 
      });
    }

    // Kiểm tra loại sản phẩm hợp lệ
    const validTypes = ["popcorn", "drink", "snack"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: "Loại sản phẩm không hợp lệ. Chỉ chấp nhận: popcorn, drink, snack" 
      });
    }

    // Kiểm tra giá hợp lệ
    if (price <= 0) {
      return res.status(400).json({ 
        message: "Giá bán sản phẩm phải lớn hơn 0" 
      });
    }

    // Kiểm tra giá vốn hợp lệ
    if (cost < 0) {
      return res.status(400).json({ 
        message: "Giá vốn sản phẩm phải lớn hơn hoặc bằng 0" 
      });
    }

    // Tìm item
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Cập nhật item
    item.name = name.trim();
    item.type = type;
    item.size = size;
    item.price = Number(price);
    item.cost = Number(cost);
    if (image_url !== undefined) {
      item.image_url = image_url ? image_url.trim() : "";
    }

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    }
    res.status(500).json({ message: "Lỗi server khi cập nhật sản phẩm" });
  }
};

// @desc    Xóa item
// @route   DELETE /api/items/:id
// @access  Private/Admin
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    console.error("Error deleting item:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    }
    res.status(500).json({ message: "Lỗi server khi xóa sản phẩm" });
  }
};

// @desc    Tìm kiếm items
// @route   GET /api/items/search?q=keyword
// @access  Public
export const searchItems = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm" });
    }

    const searchRegex = new RegExp(q.trim(), "i");
    
    const items = await Item.find({
      $or: [
        { name: { $regex: searchRegex } },
        { type: { $regex: searchRegex } }
      ]
    }).sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    console.error("Error searching items:", error);
    res.status(500).json({ message: "Lỗi server khi tìm kiếm sản phẩm" });
  }
};