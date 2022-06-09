const productModel = require("../models/product.model");
// const userModel = require("../models/user.model");
// const subscriberModel = require("../models/subscriber-model");
const { isValidToken, fetchCart } = require("../middlewares/auth");
// const {
//   addProduct,
//   deleteProduct,
//   updateProduct,
// } = require("../middlewares/validatepayload");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
// const sendEmail = require("../utils/sendEmail");

exports.addProduct = async (req, res) => {
  /*try {
    req.body = await addProduct(req.body, req.user._id);
    const product = await productModel.create(req.body);
    const projectFields = {
      images: product.images,
      title: product.title,
      _id: product._id,
      thumbnail: product.thumbnail,
    };
    userModel.find({ role: "Client" }).exec((err, users) => {
      if (err) return console.log("Error while sending mail-1", err);
      users.map((each) => {
        sendEmail("new-product", {
          email: each.email,
          product: projectFields,
        });
      });
    });
    subscriberModel.find().exec((err, users) => {
      if (err) return console.log("Error while sending mail-2", err);
      users.map((each) => {
        sendEmail("new-product", {
          email: each.email,
          product: projectFields,
        });
      });
    });
    res.status(200).json({
      success: true,
      data: product,
      message: "Your Product is live now",
    });
  } catch (err) {
    if (req.body.images) {
      const cloudinary = require("cloudinary");
      req.body.images.forEach((data) =>
        cloudinary.v2.uploader.destroy(data.public_id)
      );
    }
    // console.log(err);
    errorResponse(res, err);
  }*/
};

exports.deleteProduct = async (req, res) => {
  /*try {
    const { _id } = req.params;
    const product = await productModel.findById(_id);
    if (!product) throw { message: "No such product Exists" };
    if (product.postedBy.toString() != req.user._id.toString())
      throw { message: "You are not authorized to delete this product" };
    deleteProduct(product.images);
    product.remove();
    res.status(200).json({
      success: true,
      message: "Product has been deleted Successfully.",
    });
  } catch (err) {
    errorResponse(res, err);
  }*/
};

exports.updateProduct = async (req, res) => {
  /*try {
    const { _id } = req.params;
    let product = await productModel.findById(_id);
    if (!product) throw { message: "No such product Exists" };
    if (product.postedBy.toString() != req.user._id.toString())
      throw { message: "You are not authorized to update this product" };
    req.body = await updateProduct(req.body, product);
    // return res.status(200).json({ success: true, message: "Done" });
    productModel.findByIdAndUpdate(_id, req.body).exec(() => {});
    res.status(200).json({
      success: true,
      message: "Product has been updated Successfully.",
    });
  } catch (err) {
    if (req.body.images) {
      const cloudinary = require("cloudinary");
      req.body.images.forEach((data) =>
        cloudinary.v2.uploader.destroy(data.public_id)
      );
    }
    errorResponse(res, err);
  }*/
};

exports.specific = async (req, res) => {
  const user = isValidToken(req.cookies.token, res);
  const cart = fetchCart(req.cookies.cart, res);
  try {
    if (!mongoose.isValidObjectId(req.params._id))
      throw { message: "No such product was found" };
    const product = await productModel.aggregate([
      {
        $match: {
          _id: ObjectId(req.params._id),
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "subcategory",
          foreignField: "_id",
          as: "subcategory",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $unwind: "$subcategory",
      },
    ]);
    if (product.length == 0) throw { message: "No such product was found" };
    const similar = await productModel.aggregate([
      {
        $match: {
          _id: { $ne: ObjectId(req.params._id) },
          category: product[0].category._id,
          subcategory: product[0].subcategory._id,
        },
      },
      { $sample: { size: 10 } },
    ]);
    res.render("pages/product", { product: product[0], user, cart, similar });
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
};

exports.addToCart = (req, res) => {
  const user = isValidToken(req.cookies.token, res);
  let { product, similar } = req.body;
  product = JSON.parse(product);
  similar = JSON.parse(similar);
  let cart = fetchCart(req.cookies.cart, res);
  try {
    let { quantity } = req.body;
    if (!quantity)
      return res.render("pages/product", {
        user,
        error: "Quantity is missing",
        product,
        similar,
        cart,
      });
    // console.log(cart);
    quantity = Math.abs(quantity);
    if (cart) {
      let updatedQty = false;
      cart = cart.map((each) => {
        if (each._id == req.params._id) {
          each.quantity = parseInt(each.quantity) + parseInt(quantity);
          updatedQty = true;
        }
        return each;
      });
      if (!updatedQty) cart.push({ _id: req.params._id, quantity });
      res.cookie("cart", JSON.stringify(cart));
    } else {
      res.cookie("cart", JSON.stringify([{ _id: req.params._id, quantity }]));
    }
    res.render("pages/product", {
      user,
      message: "Added to Cart",
      product,
      similar,
      cart,
    });
  } catch (err) {
    console.log(err);
    res.cookie("cart", "[]");
    res.render("pages/product", {
      user,
      error: "Something went Wrong",
      product,
      similar,
      cart,
    });
  }
};
exports.get = async (req, res) => {
  const user = isValidToken(req.cookies.token, res);
  const cart = fetchCart(req.cookies.cart, res);
  try {
    let {
      getQuery,
      keyword,
      category,
      subcategory,
      low,
      high,
      page,
      sortBy,
      type,
      exclude,
    } = req.query;
    if (page) page = Number(page);
    else page = 1;
    page = Math.abs(page);
    const { get } = require("../utils/aggregation"),
      productsPerPage = 10;
    const query = get(
      keyword,
      category,
      subcategory,
      low,
      high,
      page,
      sortBy,
      productsPerPage,
      type,
      exclude
    );
    if (getQuery) return res.send(query);
    let products = await productModel.aggregate(query),
      response = { productsPerPage };
    if (products.length) {
      response.products = products[0].afterPaginate;
      response.page = page;
      response.noOfPages = Math.ceil(
        parseFloat(products[0].beforePaginate.count) / productsPerPage
      );
    } else {
      response.products = [];
      response.page = page;
      response.noOfPages = 0;
    }
    res.render("pages/products", { data: response, user, cart });
  } catch (err) {
    res.redirect("/");
  }
};