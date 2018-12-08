var supertest = require("supertest");
var server = supertest.agent("http://localhost:3000");

describe("Login",function(){

  it("should return code 200 on success",function(done){
    server
    .post("/api/login")
		.send({email: 'test@test.com', password: 'test'})
    .expect(200)
		.then(response => {
			done();
		})
  });

	it("should return code 400 on unknown user",function(done){
    server
    .post("/api/login")
		.send({email: 'unknown@test.com', password: 'test'})
		.expect(400, [false, {
			message: 'Incorrect username.'
		}], done);
  });

	it("should return code 400 on wrong password",function(done){
    server
    .post("/api/login")
		.send({email: 'test@test.com', password: 'wrong'})
		.expect(400, [false, {
			message: 'Incorrect password.'
		}], done);
  });
});

describe("Logout",function(){

  it("should return code 200",function(done){
    server
    .get("/api/logout")
		.expect(200, {
		}, done);
  });
});

describe("Logout",function(){

  it("should return code 200",function(done){
    server
    .get("/api/logout")
		.expect(200, {
		}, done);
  });
});

