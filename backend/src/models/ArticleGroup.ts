/// <reference path="promise-bluebird.d.ts" />
import { Schema, Model, model} from 'mongoose';
import {IArticleGroup} from '../interfaces/articlegroup';
//import {IArticle, IToken} from '../interfaces/article';
// const mongoose = require('mongoose');
import * as Bluebird from 'bluebird';
require('mongoose').Promise = Bluebird;
// const Schema   = mongoose.Schema;
//const Article = require('./Article');


const TokenSchema: Schema = new Schema({
	token: String,
	matched: Boolean,
	ignore: Boolean
})

const ArticleSchema: Schema = new Schema({
	sourceId:String,
	sourceName: String,
	title: String,
	url: String,
	publishedAt: Date,
	keyPhrases: [String],
	tokenizedTitle:[TokenSchema],
	tokenCount: String, 
	similarityScore:Number
});

const ArticleGroupSchema:Schema = new Schema({
	similarityScore:Number,
	articles: [ArticleSchema]
}, {timestamps: true});

//ArticleGroupSchema.plugin(autopopulate);

const ArticleGroup =  model<IArticleGroup>('ArticleGroup', ArticleGroupSchema);

export = ArticleGroup;