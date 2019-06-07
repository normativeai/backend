var passport = require('../config/passport');
var logger = require('../config/winston');
const jwt = require('jsonwebtoken');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var User = require('../models/user');

exports.newuser =
  function(req, res, next) {
  User.findById("5c0288400ce27a2248d716a8").exec(function(err, user) {
    user.password = "test";
    user.save(function (err, user) {
          if (err) return handleError(err);
          res.send(user);
        });
  })
  }

exports.signup = [
	body('email', 'email required').isEmail(),
  body('password', 'password required').not().isEmpty(),
  sanitizeBody('email').normalizeEmail({all_lowercase: true}),
  sanitizeBody('password').trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(`Logging for ${req.body.email} with password ${req.body.password} - ${JSON.stringify(errors.array())}`);
      return res.status(422).json({ errors: errors.array() });
    }
    User.create({
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
    }, function (err, user) {
        if (err) {
          logger.error(`Logging for ${req.body.email} with password ${req.body.password} - User already exists`);
          res.status(400).json({error: 'User already exists'});
        } else {
          logger.info(`Logging for ${req.body.email} with password ${req.body.password} - User successfully created`);
          res.status(201).json({data: user});
        }
    });
  }
];

exports.login = [
	body('email', 'email required').isEmail(),
  body('password', 'password required').not().isEmpty(),
  sanitizeBody('email').normalizeEmail({all_lowercase: true}),
  sanitizeBody('password').trim(),
  async function(req, res, next) {
  passport.authenticate('login', async function(err, user, info) {
		try {
			if (err) {
				return next(err);
			}
			if (!user) {
        logger.error(`User ${JSON.stringify(user)} cannot be logged in: ${info}`);
				return res.status(400).json({data: user, err: info})
			}
			req.login(user, { session : false }, async (error) => {
				if( error ) return next(error)
				//We don't want to store the sensitive information such as the
				//user password in the token so we pick only the email and id
				const body = { _id : user._id, email : user.email, writeProtected: user.writeProtected };
				//Sign the JWT token and populate the payload with the user email and id
				const token = jwt.sign({ user : body },'top_secret');
				//Send back the token to the user
				return res.json({ token });
			});
		} catch (error) {
			return next(error);
		}
  })(req, res, next);
}];

exports.logout = function(req, res, next) {
  req.logout();

  logger.info(`User ${JSON.stringify(req.user)} logged out`);
  return res.status(200).json({message: 'Logged out.'});
};

exports.user = function(req, res, next) {
  User.findById(req.user, ['_id', 'name', 'email'])
    .populate('theories', ['_id', 'lastUpdate', 'name', 'description'])
    .populate('queries', ['_id', 'lastUpdate', 'name', 'description'])
    .exec(function(err, user) {
    res.status(200).json({ data: user })
  })
};

// IMPORTANT!! If adding update for users, make sure to take into account write protection!



