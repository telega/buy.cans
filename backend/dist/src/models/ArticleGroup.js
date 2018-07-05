"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="promise-bluebird.d.ts" />
const mongoose_1 = require("mongoose");
//import {IArticle, IToken} from '../interfaces/article';
// const mongoose = require('mongoose');
const Bluebird = require("bluebird");
require('mongoose').Promise = Bluebird;
// const Schema   = mongoose.Schema;
//const autopopulate = require('mongoose-autopopulate');
//const Article = require('./Article');
//mongoose.Promise = bluebird;
const TokenSchema = new mongoose_1.Schema({
    token: String,
    matched: Boolean,
    ignore: Boolean
});
const ArticleSchema = new mongoose_1.Schema({
    frogs: {
        type: String,
        default: 'a few'
    },
    sourceId: String,
    sourceName: String,
    title: String,
    url: String,
    publishedAt: Date,
    keyPhrases: [String],
    tokenizedTitle: [TokenSchema],
    tokenCount: String,
    similarityScore: Number
});
const ArticleGroupSchema = new mongoose_1.Schema({
    similarityScore: Number,
    articles: [ArticleSchema]
}, { timestamps: true });
//ArticleGroupSchema.plugin(autopopulate);
exports.ArticleGroup = mongoose_1.model('ArticleGroup', ArticleGroupSchema);
