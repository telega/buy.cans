/* eslint-disable */
require('dotenv').config();
var should = require('chai').should();
const hp = require('../app/headlineProcessor');

const mongoose = require('mongoose');
const bluebird = require('bluebird');
mongoose.Promise = bluebird;
const dbUrl = process.env.DB_URL;

// mongoose.connect(dbUrl).then(()=>{
// 	mongoose.connection.db.dropDatabase();
// });


headlineProcessor = new hp();

describe('Test Headline Processor', function () {
 	// it('should be undefined if empty', function () {
	
	// 	let headlines = headlineProcessor.sortHeadlines()
	// 	should.equal(headlines, undefined);

	// });

	// it('should get new headlines and add to db', function (done) {
	
	// 	headlineProcessor.getNewHeadlines()
	// 	.then((r)=>{
	// 		should.exist(r);
	// 		r.should.be.an('object');
	// 		r.should.have.property('articles');
	// 		done();
	// 	});

	// });

	//it('should be undefined if empty', function () {
	
		// return headlineProcessor.sortLatestArticles().then((r)=>{
		// 	return headlineProcessor.getKeyPhrasesFromHeadlines(r).then(()=>{
		// 		console.log('here')
		// 		done();
		// 	});
		// })
		//should.equal(headlines, undefined);
	
	//});

	it('should do something with the key phrases', function(){
		headlineProcessor.matchAndScore(
			{ ftCloud: [ 'Switzerland',
  'Radical reform',
  'Apple',
  'tn',
  'Pret',
  'Manger',
  'Graduate applications',
  'North Korea official',
  'Trump',
  'Soros',
  'Europe',
  'Italy’s new technocrat',
  'inner populist',
  'euro',
  'Italy',
  'fallout',
  'Italian bank bond yields',
  'Rome',
  'Bank of Italy',
  'asset of trust' ],
  otherCloud: 
[ 'Hurricane Maria',
  'Puerto Rico',
  'Serena Williams vs Kristyna Pliskova live score updates',
  'referendum',
  'Italy\'s snap elections',
  'UK',
  'Israeli passport',
  'Abramovich',
  'EDL founder Tommy Robinson',
  'contempt of court',
  'industrial-scale beef farming',
  'UK',
  'risk of new financial crisis',
  'wake of coalition\'s collapse',
  'Car Share\'s ending',
  'cop',
  'Putin',
  'lot',
  'Middle East',
  'Brexit',
  'European Union',
  'Jacob Rees-Mogg' ]
			}
		)
	})

});