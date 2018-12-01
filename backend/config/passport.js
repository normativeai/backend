var passport = require('passport');

var User = require('../models/user');

// getting the local authentication type
var LocalStrategy = require('passport-local').Strategy;

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password"
    },

    (email, password, done) => {
			console.log("Validtaing user...");
			User.findOne({ email: email}, function(err, user) {
				console.log(email);
				console.log(user);
				if (err) { return done(err); }
				if (!user) {
					return done(null, false, { message: 'Incorrect username.' });
				}
				if (!user.validPassword(password)) {
					return done(null, false, { message: 'Incorrect password.' });
				}
				return done(null, user);
			});
    }
  )
)

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
	console.log(id);
  User.findById(id, function(err, user) {
    done(null, user.id === id)
  })
})

module.exports = passport;
