var tls = require('tls');
var should = require('chai').should();

before(function() { //LAUNCH THE SERVER!

})

var connection;
describe('The Mycroft Mock Server', function() {
  beforeEach(function() { //Initialize a connection to the server
    var port = 1847;
    var host = 'localhost';
    connection = tls.connect(port, host);
  })
  
  describe('certificate validation', function() {
    it('checks that the certificate sent by an app was signed by Mycroft', function(done) {
    
    });
  });
  
  describe('manifest validation', function() {
    it('checks that the manifest follows the correct format', function(done) {
    
    });
  });
  
  describe('app token assignment', function() {
    it('assigns a valid app token to an app that registers', function(done) {
    
    });
  });
  
  describe('dependency notification', function() {
    it('sends "up" notifications to an app who finds them important for a given resource', function(done) {
    
    });
    it('sends "down" notifications to an app who finds them important for a given resource', function(done) {
    
    });
    it('sends "in-use" notifications to an app who finds them important for a given resource', function(done) {
    
    });
    it('does not send "up" notifications to an app who does not find them important for a given resource', function(done) {
    
    });
    it('does not send "down" notifications to an app who does not find them important for a given resource', function(done) {
    
    });
    it('does not send "in-use" notifications to an app who does not find them important for a given resource', function(done) {
    
    });
  });
  
  describe('message board establishment', function() {
    it('tells a client about the messageboard', function(done) {
    
    });
    it('is actually hosting the messageboard', function(done) {
    
    });
  });
  
  describe('information request', function() {
    it('replies to a well-formed information request in a reasonable time', function(done) {
    
    });
    it('replies to a malformed request with an error in a reasonable ammount of time', function(done) {
    
    });
  });
});