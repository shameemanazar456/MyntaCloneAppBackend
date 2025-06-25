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

//import user jwtmidddleware
const Authjwt=require('./middleware/jwtMiddleware')

//import Admin jwtmidddleware
const Adminjwt=require('./middleware/AdminMiddleware')
const multerConfig = require('./middleware/multerMiddleware')



//2)create an object for router class
const router =new express.Router()
//3)set up path for each request from view

            /* User Controller Routes */
            
//register request
router.post('/register',userController.registerController)

//login 
router.post('/login',userController.loginController)

//update Profile
router.put('/update-profile',userController.updateProfileController)

// get Particular customer details with id
router.get('/View-profile/:id',userController.getUserByIdController)

        /* product controller  Routes*/

//add product
router.post('/add_product',Adminjwt,multerConfig.array('images',10),productController.addProduct); //')

//get All product
router.get('/all-products',Authjwt,productController.getAllProductController)


//get product by Id
router.get('/product/:id', productController.getProductById)

//to add a coupon code
router.post('/addCoupon', coupenController.createCouponController);


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
router.post('/order/place-an-order/:userId', orderController.placeOrderController);

// to view orderhistory of a particular user
router.get('/orders/:userId', orderController.viewOrderHistoryController);

//to view an order in detail
router.get('/order/:orderId', orderController.getOrderDetailsByIdController);

//to cancel an order
// Cancel an order
router.put('/order/:orderId/cancel', orderController.cancelOrderController);

// Update order status (admin)
router.put('/order/:orderId/status', orderController.updateOrderStatusController);


//4)export the router
module.exports=router
