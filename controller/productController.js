const Product = require('../model/productModel'); // Adjust the path if needed
const mongoose = require('mongoose');
// exports.addProduct = async (req, res) => {
//   try {
//     const {
//       title,
//       brand,        // JSON string: { name, image }
//       category,
//       gender,       // New field
//       description,
//       variants,     // JSON string array
//       discount      // Optional JSON string
//     } = req.body;

//     // === Basic field validation ===
//     if (!title || !category || !variants || !gender) {
//       return res.status(400).json({ error: 'Title, category, gender, and variants are required.' });
//     }

//     // === Validate gender ===
//     const validGenders = ['Men', 'Women', 'Unisex','Kids'];
//     if (!validGenders.includes(gender)) {
//       return res.status(400).json({ error: `Invalid gender. Must be one of: ${validGenders.join(', ')}` });
//     }

//     // === Parse brand ===
//     let parsedBrand = {};
//     if (brand) {
//       try {
//         parsedBrand = JSON.parse(brand);
//         if (!parsedBrand.name) {
//           return res.status(400).json({ error: 'Brand name is required in brand object.' });
//         }
//       } catch (err) {
//         return res.status(400).json({ error: 'Invalid brand format. Must be JSON.' });
//       }
//     }

//     // === Parse variants ===
//     let parsedVariants = [];
//     try {
//       parsedVariants = JSON.parse(variants);
//       if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
//         return res.status(400).json({ error: 'Variants must be a non-empty array.' });
//       }
//     } catch (err) {
//       return res.status(400).json({ error: 'Invalid variants format. Must be JSON.' });
//     }

//     // === Validate variants and discounts ===
//     for (let i = 0; i < parsedVariants.length; i++) {
//       const v = parsedVariants[i];
//       if (!v.sku || !v.color || !v.size || typeof v.price !== 'number') {
//         return res.status(400).json({ error: 'Each variant must have sku, color, size, price.' });
//       }

//       if (v.discount) {
//         const { type, value, startDate, endDate } = v.discount;
//         if (!['flat', 'percentage'].includes(type) || typeof value !== 'number' || !startDate || !endDate) {
//           return res.status(400).json({ error: 'Invalid discount inside a variant.' });
//         }
//       }

//       // Add empty image array for now
//       parsedVariants[i].images = [];
//     }

//     // === Parse product-level discount ===
//     let parsedDiscount = null;
//     if (discount) {
//       try {
//         parsedDiscount = JSON.parse(discount);
//         const { type, value, startDate, endDate } = parsedDiscount;
//         if (!['flat', 'percentage'].includes(type) || typeof value !== 'number' || !startDate || !endDate) {
//           return res.status(400).json({ error: 'Invalid product discount format.' });
//         }
//         parsedDiscount.isActive = true;
//       } catch (err) {
//         return res.status(400).json({ error: 'Product discount must be valid JSON.' });
//       }
//     }

//     // === Image upload logic ===
//     if (req.files && req.files.length > 0) {
//       const imagePaths = req.files.map(f => `/uploads/${f.filename}`);
//       parsedVariants[0].images = imagePaths;
//     }

//     // === Save to DB ===
//     const newProduct = new Product({
//       title,
//       brand: parsedBrand,
//       category,
//       gender, // <- Added here
//       description: description || '',
//       variants: parsedVariants,
//       discount: parsedDiscount,
//       createdBy: req.user?._id
//     });

//     await newProduct.save();

//     return res.status(201).json({
//       message: 'Product added successfully with variants',
//       product: newProduct
//     });

//   } catch (error) {
//     console.error('Add Product Error:', error);
//     return res.status(500).json({ error: 'Internal server error while adding product.' });
//   }
// };


//get all products


// exports.addProduct = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       category,
//       brandName,
//       gender,
//       variants,
//       discount
//     } = req.body;

//     // Parse variants and discount
//     const parsedVariants = JSON.parse(variants);
//     const parsedDiscount = JSON.parse(discount);

//     // Image handling
//     const allImages = req.files.map(file => `/uploads/products/${file.filename}`);
//     const brandImage = allImages[0];
//     const variantImages = allImages.slice(1); // Distribute accordingly

//     // Attach images to parsedVariants based on your logic (e.g., equal distribution or custom structure)

//     // Save to DB or any storage here
//     return res.status(200).json({ message: "Product added successfully" });
//   } catch (error) {
//     console.error('Add product error:', error);
//     res.status(400).json({ message: "Failed to add product", error });
//   }
// };


exports.addProduct = async (req, res) => {
  try {
    console.log("🟢 Received Product Data from Frontend:");
    console.log("Body:", req.body);
    console.log("Files:", req.files);

    const {
      title,
      description,
      category,
      brandName,
      gender,
      variants,
      discount,
      status
    } = req.body;

    // 🔒 Required Fields Check
    if (!title || !category || !variants || !req.files || req.files.length < 2) {
      return res.status(400).json({ message: "Missing required fields or at least 2 images" });
    }

    // ✅ Parse Variants & Discount
    let parsedVariants = [];
    let parsedDiscount = { type: "flat", value: 0 };

    try {
      parsedVariants = JSON.parse(variants);
    } catch (err) {
      return res.status(400).json({ message: "Invalid 'variants' JSON format" });
    }

    try {
      parsedDiscount = discount ? JSON.parse(discount) : parsedDiscount;
    } catch (err) {
      return res.status(400).json({ message: "Invalid 'discount' JSON format" });
    }

    // 🖼️ Handle Images
    const allImages = req.files.map(file => `uploads/${file.filename}`);
    const brandImage = allImages[0];
    const variantImages = allImages.slice(1);

    // 🧩 Distribute variant images equally (or you can change logic)
    const imagesPerVariant = Math.floor(variantImages.length / parsedVariants.length);
    parsedVariants.forEach((variant, i) => {
      const start = i * imagesPerVariant;
      const end = start + imagesPerVariant;
      variant.images = variantImages.slice(start, end);
    });

    // 📦 Create new Product document
    const newProduct = new Product({
      title,
      description,
      category,
      gender,
      status: status || 'Active',
      brand: { name: brandName, image: brandImage },
      variants: parsedVariants,
      discount: parsedDiscount,
      isActive: true, // default active
      createdAt: new Date()
    });

    // 💾 Save to DB
    const savedProduct = await newProduct.save();

    return res.status(201).json({
      message: "✅ Product added successfully",
      product: savedProduct
    });

  } catch (error) {
    console.error('❌ Error while adding product:', error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};


exports.getAllProductController = async (req, res) => {
  try {
    const allProducts = await Product.find();

    if (allProducts && allProducts.length > 0) {
      res.status(200).json(allProducts);
    } else {
      res.status(404).json({ message: ' No products found' });
    }

  } catch (error) {
    console.error('Get All Products Error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

//get product by ID
exports.getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    // Validate ID format
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: ' Product not found' });
    }

    res.status(200).json(product);

  } catch (error) {
    console.error('Get Product Error:', error);
    res.status(500).json({ error: ' Failed to fetch product' });
  }
};

//delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
     console.log(id);
     
    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: '❌ Product not found' });
    }

    // Optional: You can also remove associated image files here (using fs.unlink)

    // Delete product
    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: '✅ Product deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

//updateProduct 




exports.updateProductController = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      title,
      category,
      brandName,
      gender,
      description,
      status,
      variants,
      discount
    } = req.body;

    // Log incoming fields
    console.log('====== UPDATE PRODUCT CONTROLLER ======');
    console.log('Product ID:', productId);
    console.log('Title:', title);
    console.log('Category:', category);
    console.log('Brand Name:', brandName);
    console.log('Gender:', gender);
    console.log('Description:', description);
    console.log('Status:', status);
    console.log('Discount:', discount);
    console.log('Variants (raw):', variants);
    console.log('Uploaded Images:', req.files?.map(f => f.originalname));

    // Parse strings
    const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    const parsedDiscount = typeof discount === 'string' ? JSON.parse(discount) : discount;

    console.log('Parsed Variants:', JSON.stringify(parsedVariants, null, 2));
    console.log('Parsed Discount:', parsedDiscount);

    // Manage images
    const uploadedImages = req.files || [];
    let imageIndex = 0;

    const updatedVariants = parsedVariants.map((variant) => {
      const retainedImages = (variant.images || []).filter(
        (img) => typeof img === 'string' && !img.startsWith('blob:')
      );

      const newImages = [];

      if (uploadedImages[imageIndex]) {
        newImages.push(`/uploads/${uploadedImages[imageIndex].filename}`);
        imageIndex++;
      }

      return {
        ...variant,
        images: [...retainedImages, ...newImages],
      };
    });

    console.log('Final Variants with images:', JSON.stringify(updatedVariants, null, 2));

    const updateFields = {
      title,
      category,
      gender,
      description,
      status,
      'brand.name': brandName,
      discount: parsedDiscount,
      variants: updatedVariants
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};






//add product review by customer
exports.addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?._id;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ error: 'You have already reviewed this product.' });
    }

    // Create review object
    const newReview = {
      user: userId,
      rating,
      comment: comment || '',
      createdAt: new Date()
    };

    product.reviews.push(newReview);
    await product.save();

    res.status(201).json({ message: 'Review added successfully', review: newReview });
  } catch (error) {
    console.error('Review Error:', error);
    res.status(500).json({ error: 'Server error while adding review' });
  }
};

//update review by customer
exports.updateReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format.' });
    }

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Find the user's review
    const review = product.reviews.find(
      (rev) => rev.user.toString() === userId.toString()
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found for this user.' });
    }

    // Update review fields
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    review.createdAt = new Date(); // Optional: update timestamp

    await product.save();

    res.status(200).json({
      message: 'Review updated successfully.',
      review
    });

  } catch (error) {
    console.error('Update Review Error:', error);
    res.status(500).json({ error: 'Server error while updating review.' });
  }
};

//Delete Customer Review
exports.deleteReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID.' });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    // Check if the review exists
    const existingReviewIndex = product.reviews.findIndex(
      (r) => r.user.toString() === userId.toString()
    );

    if (existingReviewIndex === -1) {
      return res.status(404).json({ error: 'Review not found for this user.' });
    }

    // Remove the review
    product.reviews.splice(existingReviewIndex, 1);
    await product.save();

    res.status(200).json({ message: 'Review deleted successfully.' });

  } catch (error) {
    console.error('Delete Review Error:', error);
    res.status(500).json({ error: 'Something went wrong while deleting the review.' });
  }
};