//Require Mongoose
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

//Define a schema
var Schema = mongoose.Schema;

var userSchema = new Schema({
    name 		          : String,
    email             : {
          type: String,
          unique: true
    },
		password    			: String,
		theories					: [{ type: Schema.Types.ObjectId, ref: 'Theory' }],
		queries						: [{ type: Schema.Types.ObjectId, ref: 'Query' }],
    writeProtected    : Boolean
});

//This is called a pre-hook, before the user information is saved in the database
//this function will be called, we'll get the plain text password, hash it and store it.
userSchema.pre('save', async function(next){
  //'this' refers to the current document about to be saved
  const user = this;

  if (user.isModified("password") || user.isNew) {
    //Hash the password with a salt round of 10, the higher the rounds the more secure, but the slower
    //your application becomes.
    const hash = await bcrypt.hash(this.password, 10);
    //Replace the plain text password with the hash and then store it
    this.password = hash;
  //Indicates we're done and moves on to the next middleware
    next();
  } else {
    return next();
  }
});

//We'll use this later on to make sure that the user trying to log in has the correct credentials
userSchema.methods.isValidPassword = async function(password){
  const user = this;
  //Hashes the password sent by the user for login and checks if the hashed password stored in the
  //database matches the one sent. Returns true if it does else false.
  const compare = await bcrypt.compare(password, user.password);
  return compare;
}

module.exports = mongoose.model('User', userSchema );
