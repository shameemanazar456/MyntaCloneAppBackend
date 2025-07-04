//1)import express
const express=require('express')
//import userController file
const userController=require('./controller/userController')
//import productController file
const productController=require('./controller/productController')
//import cartController file
const cartController = require('./controller/cartController')
//import orderController
const orderController = require('./controller/orderController')

const coupenController = require('./controller/couponController')

const adsController = require('./controller/adsController')

const adminCotroller = require('./controller/adminController')

const godownController = require('./controller/godownController');

//import user jwtmidddleware
const Authjwt=require('./middleware/jwtMiddleware')

//import Admin jwtmidddleware
const Adminjwt=require('./middleware/AdminMiddleware')
const multerConfig = require('./middleware/multerMiddleware')
const adminMiddleware = require('./middleware/AdminMiddleware')



//2)create an object for router class
const router =new express.Router()
//3)set up path for each request from view

            /* User Controller Routes */
            
//register request
router.post('/register',userController.registerController)

//login 
router.post('/login',userController.loginController)

//update Profile
router.put('/update-profile',Authjwt, userController.updateProfileController)

// get Particular customer details with id
router.get('/View-profile/:id',Authjwt,userController.getUserByIdController)

        /* product controller  Routes*/


//add product
router.post('/add_product',Adminjwt,multerConfig.array('images',10),productController.addProduct); //')

//get All product
router.get('/all-products',Authjwt,productController.getAllProductController)
//get All product
router.get('/all-products-admin',Adminjwt,productController.getAllProductController)

//update product details
router.put('/update-product/:id', Adminjwt,multerConfig.array('images',10),productController.updateProductController);

//delete product
router.delete('/delete/:id', productController.deleteProduct);

//get product by Id
router.get('/product/:id', productController.getProductById)

//to add a coupon code
router.post('/addCoupon', coupenController.createCouponController);


/* Ads Controller Routes */
//add ads        
router.post('/add-ads', Adminjwt, multerConfig.single('image'), adsController.addAd);
//update ads
router.put('/update-ad/:adId', Adminjwt, multerConfig.single('image'), adsController.updateAd)
//delete ads
router.delete('/delete-ad/:adId', adsController.deleteAd);

//view ads
router.get('/get-ads-admin',Adminjwt, adsController.getAdsController);

//view ads
router.get('/get-ads', Authjwt, adsController.getAdsController);


        /* Cart Controller Routes */

//to add an item to the cart
router.post('/cart/add-product-to-cart/:userId', cartController.addToCartController);
//path - userId, req.body  { productId, quantity, variantSKU } = req.body;

//to update an item in the cart
router.put('/cart/update-cart', cartController.updateCartItemController);
//req-body- userId, productId, variantSKU, quantity 

//to view cart items of a particular customer
router.get('/cart/:userId', cartController.getCartItemsController);
//userId must be given in the path

//to delete an item from cart
router.delete('/cart/remove-cart-item', cartController.removeFromCartController);
//req-body - userId, productId, variantSKU

//to delete multiple item from cart
router.delete('/cart/remove-multiple-cart-item', cartController.removeMultipleFromCartController);
//req-body - userId, items -[ {productId, variantSKU} ]

//to apply coupon to the cart
router.post('/cart/apply-coupon', cartController.applyCouponController);


        /* Order controller Routes */

//to place an order
router.post('/order/place-an-order/:userId',Authjwt, orderController.placeOrderController);

// to view orderhistory of a particular user
router.get('/orders/:userId', orderController.viewOrderHistoryController);

//to view an order in detail
router.get('/order/:orderId', orderController.getOrderDetailsByIdController);

//to cancel an order
// Cancel an order
router.put('/order/:orderId/cancel', orderController.cancelOrderController);

// Update order status (admin)
router.put('/admin/update-order-status/:orderId',Adminjwt, orderController.updateOrderStatusController);

//to view all orders[admin]
router.get('/admin/getAllOrders',Adminjwt, adminCotroller.viewOrderHistoryByAdminController )

//to view all users[admin]
router.get('/admin/getAllUsers',Adminjwt, adminCotroller.getAllUsersForAdminController )

//to delete a user
router.delete('/admin/deleteaUser/:id',Adminjwt, adminCotroller.deleteUserController )

//to get count of nonAdmin User
router.get('/admin/getUsersCount',Adminjwt, adminCotroller.getNonAdminUsersCountController )

//to get top selling categories
router.get('/admin/getTopSellingCategories',Adminjwt, adminCotroller.getTopSellingCategories )

//to get monthly revenue
router.get('/admin/getMonthlyRevenue',Adminjwt, adminCotroller.getMonthlyRevenue )

//to get weekly revenue
router.get('/admin/getWeeklyRevenue', Adminjwt,adminCotroller.getWeeklyRevenue )

//to view all users[admin]
router.get('/admin/getAllProducts',Adminjwt, adminCotroller.getAllProductController )


router.post('/admin/createGodown', godownController.createGodown);
router.get('/admin/getAllGodowns', godownController.getAllGodowns);
router.get('/admin/nearby', godownController.getNearbyGodowns);
router.get('/:id', godownController.getGodownById);
router.put('/:id', godownController.updateGodown);
router.delete('/:id', godownController.deleteGodown);

//4)export the router
module.exports=router
