const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

exports.fetchCart = (cart, res) => {
  if (!cart) return undefined;
  try {
    cart = JSON.parse(cart);
    return cart;
  } catch (err) {
    res.cookie("cart", "[]");
    return undefined;
  }
};
exports.isValidToken = (token, res) => {
  if (!token) return false;
  try {
    const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return user;
  } catch (err) {
    if (res) res.cookie("token", null);
    return undefined;
  }
};

exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (token) {
      return await jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        async function (err, decoded) {
          if (err) {
            if (err.name == "TokenExpiredError")
              throw new Error("Session Expired, Please Login Again.");
            throw new Error("Invalid Token Provided, Please Log In Again.");
          }
          let user = await User.findById(decoded._id);
          if (!user) throw new Error("Session Expired, Please Login Again.");
          req.user = user;
          return next();
        }
      );
    }
    throw new Error("Please Log In, To Access This Resource.");
  } catch (err) {
    const { message } = err;
    res.redirect("/");
  }
};

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!roles.includes(req.user.role))
        throw new Error("You are not authorized to access this resource");
      return next();
    } catch (err) {
      const { message } = err;
      res.redirect("/");
    }
  };
};
