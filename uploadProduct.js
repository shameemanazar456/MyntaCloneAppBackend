const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
require('dotenv').config();

const db = require('./db'); // Your MongoDB connection
const products = require('./model/productModel'); // Your Mongoose Product model

const productsMap = new Map();

fs.createReadStream('./productDetails1.csv')
  .pipe(csv())
  .on('data', (row) => {
    try {
      // Basic required field check
      if (!row['Handle'] || !row['Variant SKU'] || !row['Option2 Value']) {
        console.warn(`⚠️ Skipping row due to missing required fields: ${JSON.stringify(row)}`);
        return;
      }

      const handle = row['Handle'].trim();

      // Build variant
      const variant = {
        sku: row['Variant SKU'].trim(),
        color: row['Option1 Value']?.trim() || '',
        size: row['Option2 Value']?.trim() || '',
        price: parseFloat(row['Variant Price']) || 0,
        stock: parseInt(row['Variant Inventory Qty'], 10) || 0,
        images: row['Image Src'] ? [row['Image Src'].trim()] : [],
      };

      // Add discount to variant if valid
      if (
        row['Discount Type'] &&
        ['flat', 'percentage'].includes(row['Discount Type'].trim()) &&
        row['Discount Value'] &&
        row['Discount Start Date'] &&
        row['Discount End Date']
      ) {
        const value = parseFloat(row['Discount Value']);
        const startDate = new Date(row['Discount Start Date']);
        const endDate = new Date(row['Discount End Date']);

        if (!isNaN(value) && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          variant.discount = {
            type: row['Discount Type'].trim(),
            value,
            startDate,
            endDate,
            isActive: row['Discount IsActive']?.trim() === 'true',
          };
        }
      }

      // Initialize product data if not yet added
      if (!productsMap.has(handle)) {
        const productData = {
          title: row['Title']?.trim(),
          brand: {
            name: row['Vendor']?.trim(),
            image: row['Brand Image']?.trim() || ''
          },
          category: row['Type']?.trim(),
          description: row['Body (HTML)']?.trim(),
          variants: [variant],
          reviews: []
        };

        // Attach review if valid
        if (row['Review User ID'] && row['Review Rating']) {
          const rating = Number(row['Review Rating']);
          if (!isNaN(rating)) {
            productData.reviews.push({
              user: row['Review User ID'].trim(),
              rating,
              comment: row['Review Comment']?.trim() || '',
              createdAt: new Date()
            });
          }
        }

        productsMap.set(handle, productData);
      } else {
        // Add new variant to existing product
        productsMap.get(handle).variants.push(variant);
      }

    } catch (error) {
      console.error(`❌ Error parsing row:\n${JSON.stringify(row)}\n${error.message}`);
    }
  })
  .on('end', async () => {
    console.log('✅ Finished parsing CSV. Saving products to MongoDB...');

    try {
      for (const [handle, data] of productsMap.entries()) {
        const product = new products(data);
        await product.save();
        console.log(`✔️ Saved: ${product.title}`);
      }
      console.log('🎉 All products saved successfully.');
    } catch (err) {
      console.error('❌ Failed saving products:', err.message);
    }
  });