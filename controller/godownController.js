const Godown = require('../model/godownModel');

// @desc    Create a new godown
exports.createGodown = async (req, res) => {
  try {
    const { name, address, location, isActive } = req.body;

    if (!name || !address || !location?.coordinates) {
      return res.status(400).json({ message: 'Name, address, and coordinates are required' });
    }

    const newGodown = await Godown.create({
      name,
      address,
      location,
      isActive: isActive ?? true,
    });

    res.status(201).json({ message: 'Godown created successfully', godown: newGodown });
  } catch (error) {
    console.error('Error creating godown:', error);
    res.status(500).json({ error: 'Server error while creating godown' });
  }
};

// @desc    Get all godowns
exports.getAllGodowns = async (req, res) => {
  try {
    const godowns = await Godown.find();
    res.status(200).json(godowns);
  } catch (error) {
    console.error('Error fetching godowns:', error);
    res.status(500).json({ error: 'Server error while fetching godowns' });
  }
};

// @desc    Get a single godown by ID
exports.getGodownById = async (req, res) => {
  try {
    const godown = await Godown.findById(req.params.id);

    if (!godown) {
      return res.status(404).json({ message: 'Godown not found' });
    }

    res.status(200).json(godown);
  } catch (error) {
    console.error('Error fetching godown:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update godown
exports.updateGodown = async (req, res) => {
  try {
    const updated = await Godown.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Godown not found' });
    }

    res.status(200).json({ message: 'Godown updated successfully', godown: updated });
  } catch (error) {
    console.error('Error updating godown:', error);
    res.status(500).json({ error: 'Failed to update godown' });
  }
};

// @desc    Delete godown
exports.deleteGodown = async (req, res) => {
  try {
    const deleted = await Godown.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Godown not found' });
    }

    res.status(200).json({ message: 'Godown deleted successfully' });
  } catch (error) {
    console.error('Error deleting godown:', error);
    res.status(500).json({ error: 'Failed to delete godown' });
  }
};

// @desc    Get nearby godowns based on lat/lng
exports.getNearbyGodowns = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10000 } = req.query; // default 10km

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const nearbyGodowns = await Godown.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    });

    res.status(200).json(nearbyGodowns);
  } catch (error) {
    console.error('Error fetching nearby godowns:', error);
    res.status(500).json({ error: 'Failed to fetch nearby godowns' });
  }
};
