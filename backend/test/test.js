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
	
    	headlineProcessor.getLatestArticles().then((headlines)=>{
    	  headlines.ftArticles.should.be.empty;
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
		let clouds = {ftCloud: ['quick', 'brown', 'dogs'], otherCloud: ['quick','fox']};
		let matched = headlineProcessor.matchClouds(clouds);
		matched.should.exist;
		matched.should.be.an('object');
		done();
	});


	
	// it('should be undefined if empty', function (done) {
	
	// 	return headlineProcessor.sortLatestArticles().then((r)=>{
	// 		return headlineProcessor.getKeyPhrasesFromHeadlines(r).then(()=>{
	// 			console.log('here')
	// 			done();
	// 		});
	// 	})
	// 	should.equal(headlines, undefined);
	
	// });

// 	it('should do something with the key phrases', function(){
// 		headlineProcessor.matchAndScore(
// 			{ ftCloud: [ 'Switzerland',
//   'Radical reform',
//   'Apple',
//   'tn',
//   'Pret',
//   'Manger',
//   'Graduate applications',
//   'North Korea official',
//   'Trump',
//   'Soros',
//   'Europe',
//   'Italy’s new technocrat',
//   'inner populist',
//   'euro',
//   'Italy',
//   'fallout',
//   'Italian bank bond yields',
//   'Rome',
//   'Bank of Italy',
//   'asset of trust' ],
//   otherCloud: 
// [ 'Hurricane Maria',
//   'Puerto Rico',
//   'Serena Williams vs Kristyna Pliskova live score updates',
//   'referendum',
//   'Italy\'s snap elections',
//   'UK',
//   'Israeli passport',
//   'Abramovich',
//   'EDL founder Tommy Robinson',
//   'contempt of court',
//   'industrial-scale beef farming',
//   'UK',
//   'risk of new financial crisis',
//   'wake of coalition\'s collapse',
//   'Car Share\'s ending',
//   'cop',
//   'Putin',
//   'lot',
//   'Middle East',
//   'Brexit',
//   'European Union',
//   'Jacob Rees-Mogg' ]
// 			}
// 		)
// 	})

});