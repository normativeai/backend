var express = require('express');
var router = express.Router();
var passport = require('../config/passport');

router.post('/api/login', function(req, res, next) {
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
});

router.get("/api/logout", function(req, res) {
  req.logout();

  console.log("logged out")

  return res.send();
});

const authMiddleware = (req, res, next) => {
		console.log(req.isAuthenticated());
  if (!req.isAuthenticated()) {
    res.status(401).send('You are not authenticated')
  } else {
    return next()
  }
}

let users = [
  {
    id: 1,
    name: "Jude",
    email: "user@email.com",
    password: "password"
  },
  {
    id: 2,
    name: "Emma",
    email: "emma@email.com",
    password: "password2"
  }
]

router.get("/api/user", authMiddleware, (req, res) => {
  let user = users.find(user => {
    return user.id === req.session.passport.user
  })

  console.log([user, req.session])

  res.send({ user: user })
})

module.exports = router;
