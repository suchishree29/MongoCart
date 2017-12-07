var express = require('express');
var router = express.Router();
var http = require('http');
var Cart = require('../models/cart');
var Product = require('../models/product');
var recommendations;
/* GET home page. */
router.get('/', function(req, res, next) {
  Product.find(function (err,docs) {
    var productChunks = [];
    var chunkSize = 3;
    for(var i =0; i< docs.length; i +=chunkSize){
      productChunks.push(docs.slice(i,i + chunkSize));
    }
    //console.log(docs);
      res.render('shop/index', { title: 'Shopping Cart', products: productChunks });
  });
});


router.get('/getAllProducts', function(req, res, next) {
    Product.find(function (err,docs) {
        //console.log(docs);
        res.send(docs);
    });
});

router.post('/trendingProducts', function(req, res, next) {
    //var productId = [100,101,102];
   // console.log("**********In trending",req.body.hasOwnProperty(pid));
    productId = req.body.id;
    Product.find({
        '_id': {$in: productId}
    },
    function (err,docs) {
      var productChunks = [];
      var chunkSize = 3;
      for(var i =0; i< docs.length; i +=chunkSize){
        productChunks.push(docs.slice(i,i + chunkSize));
      }
      //console.log(docs);
      res.send(docs);
        //res.render('shop/index', { title: 'Shopping Cart', products: productChunks });
    });
  });

router.get('/product/:id', function(req, res, next) {
    var productId = req.params.id;
    var selectedProduct = null;
    var r = null;
    Product.findById(productId, function (err,docs) {
        if(err){
            console.log('error :' + err);
            return res.status(400).json({success: false, msg: 'Error fetching product from database'});
        }
        else{
            selectedProduct = docs;
            suggestProducts(selectedProduct,res,function(data){
                r = JSON.parse(data);
                if(data  == null){
                    res.render('shop/productdesc', {products: selectedProduct});
                }else{
                    console.log(selectedProduct);
                    console.log(r);
                    res.render('shop/productdesc', {products: selectedProduct, recommendedProducts: r});
                }
           });
        }
        
    });
});
function suggestProducts(selectedProduct,res,callback){
    //console.log("Inside callProducts Function");
    var http = require("http");
	var options = {
	  hostname: '35.165.88.214',
	  port: 3000,
	  path: '/suggestSimilarProducts',
	  method: 'POST',
	  headers: {
	      'Content-Type': 'application/json',
	  }
    };
    var request = http.request(options, function(response) {
         response.on('data', function (body) {
         //    console.log("I have found data.........")
         //  console.log('Body: ' + body)
           callback(body)
         });
       });
       request.on(  'error', function(e) {
        console.log('problem with request: ' + e.message);
      });
      request.write(JSON.stringify(selectedProduct))
      request.end();
}
//Search by Category
router.get('/searchCategory/:category', function(req, res, next) {
    var category = req.params.category;
    Product.find({ "categories": {$regex: category, $options: '-i'} })
        .exec(function (err,docs) {

            if(err){
                console.log('error :' + err);
                return res.status(400).json({success: false, msg: 'Error fetching product from database'});
            }
            else{
                var productChunks = [];
                var chunkSize = 3;
                for(var i =0; i< docs.length; i +=chunkSize){
                    productChunks.push(docs.slice(i,i + chunkSize));
                }
                console.log(docs);
                res.render('shop/index', { title: 'Shopping Cart', products: productChunks });

            }
        });
});

router.get('/search/:text', function(req, res, next) {
    console.log("*********In getProduct By name function ***********");
    var productName = req.params.text;
    var selectedProduct = null;
    Product.find({ "name": {$regex: productName, $options: '-i'} })
        .exec(function (err,docs) {

        if(err){
            console.log('error :' + err);
            return res.status(400).json({success: false, msg: 'Error fetching product from database'});
        }
        else{
            var productChunks = [];
            var chunkSize = 3;
            for(var i =0; i< docs.length; i +=chunkSize){
                productChunks.push(docs.slice(i,i + chunkSize));
            }
            console.log(docs);
            //selectedProduct = docs;
            //res.send(JSON.parse(JSON.stringify(docs)));
            res.render('shop/index', { title: 'Shopping Cart', products: productChunks });
                //res.render('shop/productdesc', {products: selectedProduct });
        }
    });
});

router.get('/add-to-cart/:id',function (req,res,next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  Product.findById(productId, function (err,product) {
      if (err){
        return res.redirect('/');
      }
      cart.add(product, product.id);
      req.session.cart = cart;
      console.log(req.session.cart);
      res.redirect('/');
  });
});



router.get('/shopping-cart', function (req,res,next) {
    if(!req.session.cart){
        return res.render('shop/shopping-cart', {products: null});
    }
    var cart = new Cart(req.session.cart);
    res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});

router.get('/add-to-cart/:id',function (req,res,next) {
});

module.exports = router;
