var passport = require('../config/passport');

var User = require('../models/user');

exports.login = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
			return next(err);
		}
    if (!user) {
			return res.status(400).send([user, "Cannot log in", info])
		}
		req.logIn(user, function(err) {
			res.send("Logged in")
		})
  })(req, res, next);
};

exports.logout = function(req, res, next) {
  req.logout();

  console.log("logged out")

  return res.send();
};

exports.authMiddleware = (req, res, next) => {
		console.log(req.isAuthenticated());
  if (!req.isAuthenticated()) {
    res.status(401).send('You are not authenticated')
  } else {
    return next()
  }
};

exports.user = function(req, res, next) {
  User.findById(req.session.passport.user, function(err, user) {
    console.log([user, req.session])
    res.send({ user: user })
  })
};



