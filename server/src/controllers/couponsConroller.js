const db = require('../config/connection');
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const cloudinary = require("../utils/cloudinary");
const ErrorHandler = require('../utils/errorhandler');
const jwt = require('jsonwebtoken');

//global method to convert file into uri
const uploadAndCreateDocument = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'Store_logos',
        });

        return result.secure_url;
    } catch (error) {
        console.log(error);
        throw new ErrorHandler("Unable to upload to Cloudinary", 400);
    }
};

//add new store with basic details
exports.addStore = catchAsyncErrors(async (req, res, next) => {
    const { name, type, description } = req.body;
    const storeFile = req.file;

    try {
        const logo_url = await uploadAndCreateDocument(storeFile);
        const sql = `INSERT INTO store (name, logo_url, type, description) VALUES (?, ?, ?, ?)`;

        const result = await db.query(sql, [name, logo_url, type, description]);
        const storeId = result[0].insertId;

        const store = `SELECT * FROM store WHERE id = ?`;
        const [resObj] = await db.query(store, [storeId]);

        const newStore = resObj[0];

        res.status(201).json({ message: "Store added successfully", store: newStore });
    } catch (err) {
        console.log(err);
        return next(new ErrorHandler("Unable to proceed", 400));
    }
});

// Update store 
exports.updateStore = catchAsyncErrors(async (req, res, next) => {
    const { storeId } = req.params;
    const { name, type, description } = req.body;
    const storeFile = req.file;

    try {
        // Check if the store exists
        const [storeResult] = await db.query('SELECT * FROM store WHERE id = ?', [storeId]);

        if (storeResult.length === 0) {
            return next(new ErrorHandler(`Store with ID ${storeId} not found`, 404));
        }

        // Build the update query and parameters based on the provided fields
        let updateSql = 'UPDATE store SET ';
        const updateParams = [];
        const validFields = ['name', 'type', 'description'];

        // If there's a new storeFile, update logo_url
        if (storeFile) {
            const logo_url = await uploadAndCreateDocument(storeFile);
            updateSql += 'logo_url = ?, ';
            updateParams.push(logo_url);
        }

        // Update other fields provided in the request body
        for (const field of validFields) {
            if (req.body[field]) {
                updateSql += `${field} = ?, `;
                updateParams.push(req.body[field]);
            }
        }

        // Remove the trailing comma and add the WHERE clause
        updateSql = updateSql.slice(0, -2) + ` WHERE id = ?`;
        updateParams.push(storeId);

        // Execute the update query
        await db.query(updateSql, updateParams);

        // Fetch the updated store data
        const fetchStoreSql = 'SELECT * FROM store WHERE id = ?';
        const [updatedStore] = await db.query(fetchStoreSql, [storeId]);

        res.status(200).json({ message: `Store with ID ${storeId} updated successfully`, store: updatedStore[0] });
    } catch (err) {
        console.error(err);
        return next(new ErrorHandler("Unable to update store", 500));
    }
});


// Add FAQs for a specific store
exports.addStoreFAQs = catchAsyncErrors(async (req, res, next) => {
    const { storeId } = req.params;
    const faq = req.body;

    try {
        // Convert the FAQs from form-data format to JSON
        const faqArray = Object.entries(faq).map(([question, answer]) => ({ question, answer }));
        console.log(faqArray);

        const sql = `UPDATE store SET faq = ? WHERE id = ?`;
        await db.query(sql, [JSON.stringify(faqArray), storeId]);

        const updatedStore = `SELECT * FROM store WHERE id = ?`;
        const [resObj] = await db.query(updatedStore, [storeId]);

        const updatedStoreData = resObj[0];

        res.status(200).json({ message: "Store FAQs updated successfully", store: updatedStoreData });
    } catch (err) {
        console.log(err);
        return next(new ErrorHandler("Unable to proceed", 400));
    }
});

//add ratings
exports.addStoreRating = catchAsyncErrors(async (req, res, next) => {
    const { storeId } = req.params;
    const { rating } = req.body;
    console.log(rating);

    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user_id = decoded.userId;

    try {
        // Add the rating to the user_ratings table
        const addUserRatingSql = `INSERT INTO user_ratings (user_id, store_id, rating) VALUES (?, ?, ?)`;
        await db.query(addUserRatingSql, [user_id, storeId, rating]);

        // Update the store table with the new rating
        const updateStoreRatingSql = `
            UPDATE store 
            SET total_ratings = total_ratings + ?, ratings_count = ratings_count + 1
            WHERE id = ?
        `;
        await db.query(updateStoreRatingSql, [rating, storeId]);

        // Fetch the updated store data
        const fetchStoreSql = `SELECT * FROM store WHERE id = ?`;
        const [updatedStore] = await db.query(fetchStoreSql, [storeId]);

        res.status(200).json({ message: "Rating added successfully", store: updatedStore });
    } catch (err) {
        console.error(err);
        return next(new ErrorHandler("Unable to add rating", 400));
    }
});

//add coupons
exports.addCoupons = catchAsyncErrors(async (req, res, next) => {
    const { storeId } = req.params;
    const { title, couponCode, type, link, dueDate, description } = req.body;

    try {

        if (!title || !couponCode || !dueDate || !type) {
            return res.status(400).json({ error: 'Incomplete data' });
        }

        // Inserting the coupon into the coupons table
        const insertCouponSql = `
            INSERT INTO coupons (store_id, title, coupon_code, type, link, due_date, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result, fields] = await db.query(insertCouponSql, [storeId, title, couponCode, type, link, dueDate, description]);

        // Updating the stock count in the store table
        const updateStockSql = `
            UPDATE store 
            SET stock = stock + 1
            WHERE id = ?
        `;
        await db.query(updateStockSql, [storeId]);

        res.status(201).json({ message: 'Coupon added successfully' });
    } catch (err) {
        console.error('Error adding coupon:', err);
        return next(new ErrorHandler('Internal server error', 400));
    }
});

// Delete a coupon
exports.deleteCoupon = catchAsyncErrors(async (req, res, next) => {
    const { cId } = req.params;

    try {
        // Check if the coupon exists
        const [couponResult] = await db.query('SELECT * FROM coupons WHERE coupon_id = ?', [cId]);

        if (couponResult.length === 0) {
            return next(new ErrorHandler(`Coupon with ID ${cId} not found`, 404));
        }

        // Delete the coupon
        await db.query('DELETE FROM coupons WHERE coupon_id = ?', [cId]);

        // Update the stock count in the store table (assuming there's a stock field)
        const storeId = couponResult[0].store_id;
        await db.query('UPDATE store SET stock = stock - 1 WHERE id = ?', [storeId]);

        res.status(200).json({ message: `Coupon with ID ${cId} deleted successfully` });
    } catch (err) {
        console.error(err);
        return next(new ErrorHandler("Unable to delete coupon", 500));
    }
});

//redeem coupon
exports.redeem = catchAsyncErrors(async (req, res, next) => {
    const { cId } = req.params;

    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user_id = decoded.userId;

    try {
        // Check if the user has already redeemed the coupon
        const checkRedemptionSql = `SELECT * FROM redeemed_coupons WHERE coupon_id = ? AND user_id = ?`;
        const [redemptionResult] = await db.query(checkRedemptionSql, [cId, user_id]);

        if (redemptionResult.length > 0) {
            return res.status(400).json({ error: 'Coupon already redeemed by You' });
        }

        // Update the coupon count
        const updateCountSql = `UPDATE coupons SET user_count = user_count + 1 WHERE coupon_id = ?`;
        await db.query(updateCountSql, [cId]);

        // Record the redemption in the redeemed_coupons table
        const recordRedemptionSql = `INSERT INTO redeemed_coupons (user_id, coupon_id) VALUES (?, ?)`;
        await db.query(recordRedemptionSql, [user_id, cId]);

        res.status(201).json({ message: 'Coupon redemption successful!' });
    } catch (err) {
        console.error('Error in redeeming coupon:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});