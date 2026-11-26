const Item = require('../models/Item');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

const listItems = async (req, res) => {
  try {
    const { q, category, city, owner } = req.query;
    const filter = {};

    if (owner === 'me') {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      filter.owner = req.user._id;
    } else {
      filter.isActive = true;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (city && city !== 'All' && city !== 'All Cities') {
      filter.city = city;
    }
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const items = await Item.find(filter)
      .populate('owner', 'name city isVerified ratingSum ratingCount')
      .sort({ createdAt: -1 });

    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      'owner',
      'name city phone isVerified ratingSum ratingCount'
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    const reviews = await Review.find({ item: item._id })
      .populate('reviewer', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({ item, reviews });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const createItem = async (req, res) => {
  try {
    const { title, description, category, city, dailyRate, securityDeposit } = req.body;
    if (!title || !description || !category || !city || dailyRate === undefined || securityDeposit === undefined) {
      return res.status(400).json({ message: 'All item fields are required' });
    }
    const images = (req.files || []).map((file) => `/uploads/${file.filename}`);
    const item = await Item.create({
      owner: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      city: city.trim(),
      dailyRate: Number(dailyRate),
      securityDeposit: Number(securityDeposit),
      images
    });
    const populated = await item.populate('owner', 'name city isVerified ratingSum ratingCount');
    return res.status(201).json({ item: populated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    const { title, description, category, city, dailyRate, securityDeposit, isActive } = req.body;
    if (typeof title === 'string' && title.trim()) item.title = title.trim();
    if (typeof description === 'string' && description.trim()) item.description = description.trim();
    if (typeof category === 'string' && category.trim()) item.category = category.trim();
    if (typeof city === 'string' && city.trim()) item.city = city.trim();
    if (dailyRate !== undefined) item.dailyRate = Number(dailyRate);
    if (securityDeposit !== undefined) item.securityDeposit = Number(securityDeposit);
    if (typeof isActive === 'boolean') item.isActive = isActive;
    if (isActive === 'true' || isActive === 'false') item.isActive = isActive === 'true';

    if (req.files && req.files.length > 0) {
      item.images = req.files.map((file) => `/uploads/${file.filename}`);
    }

    await item.save();
    const populated = await item.populate('owner', 'name city isVerified ratingSum ratingCount');
    return res.status(200).json({ item: populated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }
    if (req.query.permanent === 'true') {
      const hasActiveBookings = await Booking.exists({
        item: item._id,
        status: { $in: ['PENDING', 'APPROVED', 'LIVE'] }
      });
      if (hasActiveBookings) {
        return res.status(409).json({
          message: 'Cannot permanently delete an item with active or pending bookings. Pause it instead.'
        });
      }
      await Item.findByIdAndDelete(item._id);
      return res.status(200).json({ message: 'Item permanently deleted', deletedId: item._id });
    }
    item.isActive = false;
    await item.save();
    return res.status(200).json({ message: 'Item deactivated' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { listItems, getItemById, createItem, updateItem, deleteItem };
