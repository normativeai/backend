var passport = require('passport');

var User = require('../models/user');
var Query= require('../models/query');

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
				/*var q = new Query({
					name: 'Q1',
					content: '([un, t , (~ c1), c2], (Ob d2))',
					user : user._id
				});
				q.save(function (err) {
				user.queries.push(q)
				user.save(function (err) {
});
  });*/
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
  User.findById(id, function(err, user) {
    done(null, user.id === id)
  })
})

module.exports = passport;
