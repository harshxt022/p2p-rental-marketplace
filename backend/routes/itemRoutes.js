const express = require('express');
const {
  listItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
} = require('../controllers/itemController');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', optionalAuth, listItems);
router.get('/:id', getItemById);
router.post('/', protect, upload.array('images', 4), createItem);
router.put('/:id', protect, upload.array('images', 4), updateItem);
router.delete('/:id', protect, deleteItem);

module.exports = router;
