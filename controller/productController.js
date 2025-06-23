const Product = require('../model/productModel');


//admin add products
exports.addProduct = async (req, res) => {
  try {
    const {
      title,
      brand,
      category,
      description,
      variants // will be a string in multipart/form-data
    } = req.body;

    // ✅ Parse JSON string from form-data
    let parsedVariants = [];
    try {
      parsedVariants = JSON.parse(variants);
    } catch (err) {
      return res.status(400).json({
        error: '❌ Invalid variants format. Must be a valid JSON string.'
      });
    }

    // ✅ Validate core fields
    if (!title || !brand || !category || parsedVariants.length === 0) {
      return res.status(400).json({
        error: '❌ Missing required fields or empty variants list'
      });
    }

    // ✅ Validate each variant
    for (const v of parsedVariants) {
      if (!v.sku || !v.color || !v.size || !v.price) {
        return res.status(400).json({
          error: '❌ Each variant must include sku, color, size, and price'
        });
      }
    }

    // 🖼️ Optional: Attach uploaded image URLs to first variant
    if (req.files && req.files.length > 0) {
      const uploadedImagePaths = req.files.map(f => `/uploads/${f.filename}`);
      parsedVariants[0].images = uploadedImagePaths;
    }

    // 📦 Create and save new product
    const newProduct = new Product({
      title,
      brand,
      category,
      description: description || '',
      variants: parsedVariants,
      createdBy: req.user?._id // optional
    });

    await newProduct.save();

    res.status(201).json({
      message: '✅ Product added successfully with variants',
      product: newProduct
    });

  } catch (error) {
    console.error('Add Product Error:', error);
    res.status(500).json({ error: '❌ Failed to add product' });
  }
};


//get all products
exports.getAllProductController = async (req, res) => {
  try {
    const allProducts = await Product.find();

    if (allProducts && allProducts.length > 0) {
      res.status(200).json(allProducts);
    } else {
      res.status(404).json({ message: '❌ No products found' });
    }

  } catch (error) {
    console.error('Get All Products Error:', error);
    res.status(500).json({ error: '❌ Failed to fetch products' });
  }
};
