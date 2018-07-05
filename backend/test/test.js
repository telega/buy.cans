/* eslint-disable */
require('dotenv').config();
var should = require('chai').should();
const hp = require('../dist/headlineProcessor');

const mongoose = require('mongoose');
const bluebird = require('bluebird');
mongoose.Promise = bluebird;
const dbUrl = process.env.DB_URL;

headlineProcessor = new hp();


describe('Test Headline Processor', function () {

	before('Clear DB', function(done){
		mongoose.connect(dbUrl).then(()=>{
		mongoose.connection.db.dropDatabase();
		done()
	})

	})
 	it('should be empty with nothing in db', function (done) {
	
    	headlineProcessor.getLatestArticles().then((articles)=>{
			articles.should.be.an('array');
    	  	articles.should.be.empty;
    	  	done();
		})
	});

	it('should return true if the db needs to update headlines', function(done){
		headlineProcessor.shouldUpdateHeadlines().then((u)=>{
			u.should.be.a('boolean');
			u.should.equal(true);
			done();
		})
	})
	
   	it('should return 0 when there is nohting in the DB ', function (done) {
	
		headlineProcessor.getLatestHeadlineDate().then((date)=>{
			date.should.exist;
	 		date.should.be.a('number');
			date.should.equal(0);
			done();
		})
	   
	});


	it('should get new headlines and add to db', function (done) {
	
		headlineProcessor.getNewHeadlines(done)
		.then((r)=>{
			should.exist(r);
			r.should.be.an('object');
			r.should.have.property('articles');
			done();
		});

	});

	it('should return a date', function (done) {
	
		headlineProcessor.getLatestHeadlineDate().then((date)=>{
		  date.should.exist;
		  date.should.be.a('number');
		  done();
		})
	});

	it('should return false if the db does not need to update headlines', function(done){
		headlineProcessor.shouldUpdateHeadlines().then((u)=>{
			u.should.be.a('boolean');
			u.should.equal(false);
			done();
		})
	})

	it('should return an array of tokenized phrases', function (done) {
		let phrases = ['the quick', 'brown fox jumped', 'over the lazy dogs'];
		let tokens = headlineProcessor.tokenizePhrases(phrases)
		tokens.should.exist;
		tokens.should.be.an('array');
		done();
	});

	it('should return an object with two arrays of matched clouds', function (done) {
		//let clouds = {ftCloud: ['quick', 'brown', 'dogs'], otherCloud: ['quick','fox']};
		let matched = headlineProcessor.matchClouds({terms:[{token: 'quick'}, {token:'brown'}, {token:'dogs'} ]},{terms: [{token:'quick'},{token:'fox'}]});
		matched.should.exist;
		matched.should.be.an('object');
		done();
	});

	it('should return a score for the clouds', function(done){
		let matched = headlineProcessor.matchClouds({terms:[{token: 'quick'}, {token:'brown'}, {token:'dogs'} ]},{terms: [{token:'quick'},{token:'fox'}]});
		let score = headlineProcessor.scoreClouds(matched.matchedFtCloud, matched.matchedOtherCloud);
		score.should.exist;
		score.should.be.a('number');
		done();
	})

});


// describe('Test Headline Processor', function () {

// 	before('Clear DB', function(done){
// 			mongoose.connect(dbUrl).then(()=>{
// 			mongoose.connection.db.dropDatabase();
// 			done()
// 		})
// 	})

//  	it('Should create a complete Article Group', function (done) {
	
// 		headlineProcessor.createNewArticleGroup().then((ag)=>{
// 			should.exist(ag);
// 			done();
// 		})
		
// 	});

// })