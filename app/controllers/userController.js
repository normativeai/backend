var passport = require('../config/passport');
const jwt = require('jsonwebtoken');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var User = require('../models/user');

exports.signup = [
	body('email', 'email required').isLength({ min: 1 }).trim(),
  body('password', 'password required').isLength({ min: 1 }).trim(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    User.create({
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
    }).then(user => res.json(user));

  }
];

exports.login = async function(req, res, next) {
  passport.authenticate('login', async function(err, user, info) {
		try {
			if (err) {
				return next(err);
			}
			if (!user) {
				return res.status(400).send([user, info])
			}
			req.login(user, { session : false }, async (error) => {
				if( error ) return next(error)
				//We don't want to store the sensitive information such as the
				//user password in the token so we pick only the email and id
				const body = { _id : user._id, email : user.email };
				//Sign the JWT token and populate the payload with the user email and id
				const token = jwt.sign({ user : body },'top_secret');
				//Send back the token to the user
				return res.json({ token });
			});
		} catch (error) {
			return next(error);
		}
  })(req, res, next);
};

exports.logout = function(req, res, next) {
  req.logout();

  return res.status(200).send('Logged out.');
};

exports.authMiddleware = (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.status(401).send('You are not authenticated')
  } else {
    return next()
  }
};

exports.user = function(req, res, next) {
  User.findById(req.session.passport.user).populate('queries').exec(function(err, user) {
    console.log([user, req.session])
    res.send({ user: user })
  })
};

exports.create = [
  body('email', 'email required').isLength({ min: 1 }).trim(),
  body('password', 'password required').isLength({ min: 1 }).trim(),

  function(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    User.create({
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
    }).then(user => res.json(user));

  }
];



