const Swap = require('../models/Swap');

// Create swap request
exports.createSwap = async (req, res) => {
  try {
    const { toUserId, skillOffered, skillWanted } = req.body;

    const swap = new Swap({
      fromUser: req.user.userId,
      toUser: toUserId,
      skillOffered,
      skillWanted,
      status: 'pending'
    });

    await swap.save();

    res.status(201).json(swap);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user swaps
exports.getUserSwaps = async (req, res) => {
  try {
    const swaps = await Swap.find({
      $or: [
        { fromUser: req.user.userId },
        { toUser: req.user.userId }
      ]
    }).populate('fromUser toUser', 'name email');

    res.json(swaps);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update swap status
exports.updateSwapStatus = async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    swap.status = req.body.status; // accepted / rejected / completed

    await swap.save();

    res.json(swap);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};