// controllers/comboController.js
import Combo from '../models/comboModel.js';
import Item from '../models/itemModel.js';

// @desc    Get all combos
// @route   GET /api/combos
// @access  Public
export const getCombos = async (req, res) => {
  try {
    const combos = await Combo.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all combos (including inactive) - Admin only
// @route   GET /api/combos/admin/all
// @access  Private/Admin
export const getAllCombosAdmin = async (req, res) => {
  try {
    console.log('Getting all combos for admin...');
    const combos = await Combo.find({}).sort({ createdAt: -1 });
    console.log(`Found ${combos.length} combos`);
    res.json(combos);
  } catch (error) {
    console.error('Error in getAllCombosAdmin:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get combo by ID
// @route   GET /api/combos/:id
// @access  Public
export const getComboById = async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id);
    if (!combo) {
      return res.status(404).json({ message: 'Combo not found' });
    }
    res.json(combo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create combo
// @route   POST /api/combos
// @access  Private/Admin
export const createCombo = async (req, res) => {
  try {
    const { name, description, items, image_url, price } = req.body;
    console.log('Creating combo with data:', { name, description, items, image_url, price });

    // Validate required fields
    if (!name || !description || !price || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Filter out empty items and validate
    const validItems = items.filter(item => item.name && item.quantity);
    if (validItems.length === 0) {
      return res.status(400).json({ message: 'No valid items provided' });
    }

    // Validate that all items exist
    const itemNames = validItems.map(item => item.name);
    const existingItems = await Item.find({ name: { $in: itemNames } });
    
    if (existingItems.length !== itemNames.length) {
      console.log('Item validation failed:', { 
        providedItems: itemNames, 
        foundItems: existingItems.map(item => item.name) 
      });
      return res.status(400).json({ message: 'Some items do not exist' });
    }

    const combo = new Combo({
      name,
      description,
      price,
      items: validItems,
      image: image_url,
      category: 'combo'
    });

    const createdCombo = await combo.save();
    console.log('Created combo:', createdCombo);
    res.status(201).json(createdCombo);
  } catch (error) {
    console.error('Error creating combo:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update combo
// @route   PUT /api/combos/:id
// @access  Private/Admin
export const updateCombo = async (req, res) => {
  try {
    const { name, description, price, items, image_url, isActive } = req.body;

    const combo = await Combo.findById(req.params.id);
    if (!combo) {
      return res.status(404).json({ message: 'Combo not found' });
    }

    // Validate that all items exist if items are being updated
    if (items) {
      const itemNames = items.map(item => item.name);
      const existingItems = await Item.find({ name: { $in: itemNames } });
      
      if (existingItems.length !== itemNames.length) {
        return res.status(400).json({ message: 'Some items do not exist' });
      }
    }

    combo.name = name || combo.name;
    combo.description = description || combo.description;
    combo.price = price !== undefined ? price : combo.price;
    combo.items = items || combo.items;
    combo.image = image_url !== undefined ? image_url : combo.image;
    combo.isActive = isActive !== undefined ? isActive : combo.isActive;

    const updatedCombo = await combo.save();
    res.json(updatedCombo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete combo (soft delete)
// @route   DELETE /api/combos/:id
// @access  Private/Admin
export const deleteCombo = async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id);
    if (!combo) {
      return res.status(404).json({ message: 'Combo not found' });
    }

    combo.isActive = false;
    await combo.save();
    
    res.json({ message: 'Combo deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Permanently delete combo
// @route   DELETE /api/combos/:id/permanent
// @access  Private/Admin
export const permanentDeleteCombo = async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id);
    if (!combo) {
      return res.status(404).json({ message: 'Combo not found' });
    }

    await Combo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Combo deleted permanently' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available items for combo creation
// @route   GET /api/combos/admin/available-items
// @access  Private/Admin
export const getAvailableItems = async (req, res) => {
  try {
    console.log('Getting available items...');
    const items = await Item.find({}).select('name type price').sort({ type: 1, name: 1 });
    console.log(`Found ${items.length} items`);
    res.json(items);
  } catch (error) {
    console.error('Error in getAvailableItems:', error);
    res.status(500).json({ message: error.message });
  }
};