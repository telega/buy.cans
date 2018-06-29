const mongoose = require('mongoose');
const bluebird = require('bluebird');
const Schema = mongoose.Schema;
//const autopopulate = require('mongoose-autopopulate');
//const Article = require('./Article');
mongoose.Promise = bluebird;
const ArticleSchema = new Schema({
	sourceId: String,
	sourceName: String,
	title: String,
	url: String,
	publishedAt: Date
});

const ArticleGroupSchema = new Schema({
	otherTokens: [{
		token: String,
		matched: Boolean,
	}],
	ftTokens: [{
		token: String,
		matched: Boolean
	}],
	similarityScore: {
		type: Number
	},
	articles: [ArticleSchema]
}, { timestamps: true });
//ArticleGroupSchema.plugin(autopopulate);
module.exports = mongoose.model('ArticleGroup', ArticleGroupSchema);
