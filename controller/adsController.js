const Ad = require('../model/adsModel');
const fs = require('fs');
const path = require('path');
//add ads
exports.addAd = async (req, res) => {
    try {
        const { title, link, expiresAt } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        if (!title || !imagePath) {
            return res.status(400).json({ error: 'Title and image are required.' });
        }

        const newAd = new Ad({ title, image: imagePath, link, expiresAt });
        await newAd.save();

        res.status(201).json({ message: 'Ad created successfully.', ad: newAd });
    } catch (error) {
        console.error('Add Ad Error:', error);
        res.status(500).json({ error: 'Failed to create ad.' });
    }
};

//update ads
exports.updateAd = async (req, res) => {
    try {
        const { adId } = req.params;
        const { title, link, expiresAt, isActive } = req.body;

        // Find existing ad
        const ad = await Ad.findById(adId);
        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }

        // Update fields
        if (title) ad.title = title;
        if (link) ad.link = link;
        if (expiresAt) ad.expiresAt = expiresAt;
        if (typeof isActive !== 'undefined') ad.isActive = isActive;

        // If a new image is uploaded, replace the old one
        if (req.file) {
            // Delete the old image file if it exists
            if (ad.image && fs.existsSync(path.join(__dirname, '..', ad.image))) {
                fs.unlinkSync(path.join(__dirname, '..', ad.image));
            }
            ad.image = `/uploads/${req.file.filename}`;
        }

        await ad.save();

        res.status(200).json({
            message: 'Ad updated successfully',
            ad
        });

    } catch (error) {
        console.error('Update Ad Error:', error);
        res.status(500).json({ error: 'Failed to update ad' });
    }
};
//delete ads
exports.deleteAd = async (req, res) => {
    try {
        const { adId } = req.params;

        // Find the ad by ID
        const ad = await Ad.findById(adId);
        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }

        // Delete the image file if it exists
        if (ad.image) {
            const imagePath = path.join(__dirname, '..', ad.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete ad from the database
        await Ad.findByIdAndDelete(adId);

        res.status(200).json({ message: 'Ad deleted successfully' });
    } catch (error) {
        console.error('Delete Ad Error:', error);
        res.status(500).json({ error: 'Failed to delete ad' });
    }
};


// Get active ads (optionally filter expired ones too)
exports.getAdsController = async (req, res) => {
  try {
    const currentDate = new Date();

    const ads = await Ad.find({
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: currentDate } } // Not expired
      ]
    }).sort({ createdAt: -1 }); // Optional: sort by latest

    res.status(200).json({
      success: true,
      count: ads.length,
      ads
    });

  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ads' });
  }
};
