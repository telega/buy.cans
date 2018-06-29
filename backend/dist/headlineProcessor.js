require('dotenv').config();
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const TEXT_API_KEY = process.env.AZ_ANALYTICS_KEY;
const TEXT_API_ENDPOINT = process.env.AZ_ENDPOINT;
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(NEWS_API_KEY);
const sources = 'financial-times,the-guardian-uk,the-telegraph,independent,bbc-news';
const cognitiveServices = require('cognitive-services');
const textAnalyticsClient = new cognitiveServices.textAnalytics({
    apiKey: TEXT_API_KEY,
    endpoint: TEXT_API_ENDPOINT
});
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const stopWords = ["a", "able", "about", "across", "after", "all", "almost", "also", "am", "among", "an", "and", "any", "are", "as", "at", "be", "because", "been", "but", "by", "can", "cannot", "could", "dear", "did", "do", "does", "either", "else", "ever", "every", "for", "from", "get", "got", "had", "has", "have", "he", "her", "hers", "him", "his", "how", "however", "i", "if", "in", "into", "is", "it", "its", "just", "least", "let", "like", "likely", "may", "me", "might", "most", "must", "my", "neither", "no", "nor", "not", "of", "off", "often", "on", "only", "or", "other", "our", "own", "rather", "said", "say", "says", "she", "should", "since", "so", "some", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "tis", "to", "too", "twas", "us", "wants", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would", "yet", "you", "your", "ain't", "aren't", "can't", "could've", "couldn't", "didn't", "doesn't", "don't", "hasn't", "he'd", "he'll", "he's", "how'd", "how'll", "how's", "i'd", "i'll", "i'm", "i've", "isn't", "it's", "might've", "mightn't", "must've", "mustn't", "shan't", "she'd", "she'll", "she's", "should've", "shouldn't", "that'll", "that's", "there's", "they'd", "they'll", "they're", "they've", "wasn't", "we'd", "we'll", "we're", "weren't", "what'd", "what's", "when'd", "when'll", "when's", "where'd", "where'll", "where's", "who'd", "who'll", "who's", "why'd", "why'll", "why's", "won't", "would've", "wouldn't", "you'd", "you'll", "you're", "you've"];
const logg = require('./logger');
const _ = require('lodash');
const mongoose = require('mongoose');
const bluebird = require('bluebird');
mongoose.Promise = bluebird;
const ArticleGroup = require('./models/ArticleGroup');
//const Article = require('./models/Article');
const dbUrl = process.env.DB_URL;
;
;
class headlineProcessor {
    constructor() {
        mongoose.connect(dbUrl);
    }
    createNewArticleGroup() {
        return this.shouldUpdateHeadlines()
            .then((u) => {
            if (!u) {
                throw new Error('Nothing to Update');
            }
            return this.getNewHeadlines()
                .then((articleGroup) => {
                let articles = this.getLatestArticlesFromGroup(articleGroup);
                return [articles, articleGroup];
            })
                .then(([articles, articleGroup]) => {
                return this.getKeyPhrasesFromHeadlines(articles)
                    .then((keyPhrases) => {
                    return [keyPhrases, articleGroup];
                });
            })
                .then(([keyPhrases, articleGroup]) => {
                let toeknizedFtCloud = this.tokenizePhrases(keyPhrases.ftCloud);
                let tokenizedOtherCloud = this.tokenizePhrases(keyPhrases.otherCloud);
                let ftCloud = toeknizedFtCloud.map((phrase) => {
                    return { token: phrase };
                });
                let otherCloud = tokenizedOtherCloud.map((phrase) => {
                    return { token: phrase };
                });
                let matchedClouds = this.matchClouds({ terms: ftCloud }, { terms: otherCloud });
                return [matchedClouds, articleGroup];
            })
                .then(([matchedClouds, articleGroup]) => {
                let score = this.scoreClouds(matchedClouds.matchedFtCloud, matchedClouds.matchedOtherCloud);
                articleGroup.similarityScore = score;
                articleGroup.ftTokens = matchedClouds.matchedFtCloud;
                articleGroup.otherTokens = matchedClouds.matchedOtherCloud;
                return articleGroup.save();
            })
                .catch((err) => {
                if (err) {
                    logg.error(err);
                }
            });
        })
            .then((ag) => {
            return ag;
        })
            .catch((err) => {
            if (err) {
                logg.error(err);
            }
        });
    }
    getKeyPhrasesFromHeadlines(articles) {
        let ft = articles.ftArticles.map((article, i) => {
            return {
                'language': 'en',
                'id': 'ft_' + i,
                'text': article.title
            };
        });
        let other = articles.otherArticles.map((article, i) => {
            return {
                language: 'en',
                id: 'other_' + i,
                text: article.title
            };
        });
        let documents = _.concat(ft, other);
        let body = { documents: documents };
        let headers = {
            'Content-type': 'application/json'
        };
        return textAnalyticsClient.keyPhrases({
            headers,
            body
        }).then((res) => {
            if (!res) {
                throw ('no response');
            }
            if (res.errors.length > 0) {
                throw (res.errors);
            }
            let ftCloud = [];
            let otherCloud = [];
            res.documents.forEach((document) => {
                if (document.id.substr(0, 2) === 'ft') {
                    ftCloud = _.concat(ftCloud, document.keyPhrases);
                }
                else {
                    otherCloud = _.concat(otherCloud, document.keyPhrases);
                }
            });
            return { ftCloud, otherCloud };
        }).catch((err) => {
            logg.error(err);
        });
    }
    tokenizePhrases(phrases) {
        let tokenizedPhrases = [];
        phrases.forEach((phrase) => {
            let tokens = tokenizer.tokenize(phrase);
            tokenizedPhrases = _.concat(tokenizedPhrases, tokens);
        });
        let uniqTokenizedPhrases = _.uniq(tokenizedPhrases);
        let filteredUniqTokenizedPhrases = uniqTokenizedPhrases.filter((token) => {
            let idx = stopWords.indexOf(token);
            return ((token.length > 2) && (idx === -1));
        });
        return filteredUniqTokenizedPhrases;
    }
    getLatestArticles() {
        return ArticleGroup.findOne({})
            .sort({ 'createdAt': 'asc' })
            .limit(1)
            .exec()
            .then((articleGroup) => {
            if (!articleGroup) {
                return { ftArticles: [], otherArticles: [] };
            }
            let ftArticles = articleGroup.articles.filter((article) => {
                return article.sourceId === 'financial-times';
            });
            let otherArticles = articleGroup.articles.filter((article) => {
                return article.sourceId != 'financial-times';
            });
            return { ftArticles: ftArticles, otherArticles: otherArticles };
        })
            .catch((err) => {
            if (err) {
                logg.error(err);
            }
        });
    }
    getLatestArticlesFromGroup(articleGroup) {
        let ftArticles = articleGroup.articles.filter((article) => {
            return article.sourceId === 'financial-times';
        });
        let otherArticles = articleGroup.articles.filter((article) => {
            return article.sourceId != 'financial-times';
        });
        return { ftArticles: ftArticles, otherArticles: otherArticles };
    }
    matchClouds(ftCloud, otherCloud) {
        // this is pretty expensive
        let targetScore = 0.9;
        let matchedFtCloud = ftCloud.terms.map((ftPhrase) => {
            let scores = otherCloud.terms.map((otherPhrase) => {
                return natural.JaroWinklerDistance(ftPhrase.token, otherPhrase.token);
            });
            let maxScore = Math.max.apply(null, scores);
            if (maxScore >= targetScore) {
                return { token: ftPhrase, matched: true };
            }
            else {
                return { token: ftPhrase, matched: false };
            }
        });
        let matchedOtherCloud = otherCloud.terms.map((otherPhrase) => {
            let scores = ftCloud.terms.map((ftPhrase) => {
                return natural.JaroWinklerDistance(otherPhrase.token, ftPhrase.token);
            });
            let maxScore = Math.max.apply(null, scores);
            if (maxScore >= targetScore) {
                return { token: otherPhrase, matched: true };
            }
            else {
                return { token: otherPhrase, matched: false };
            }
        });
        return { matchedFtCloud: { terms: matchedFtCloud }, matchedOtherCloud: { terms: matchedOtherCloud } };
    }
    scoreClouds(matchedFtCloud, matchedOtherCloud) {
        let termsCount = matchedFtCloud.terms.length + matchedOtherCloud.terms.length;
        let reducedFtCloud = matchedFtCloud.terms.filter((term) => {
            return term.matched === true;
        });
        let reducedOtherCloud = matchedOtherCloud.terms.filter((term) => {
            return term.matched === true;
        });
        let matchedTermsCount = reducedFtCloud.length + reducedOtherCloud.length;
        return matchedTermsCount / termsCount;
    }
    getLatestHeadlineDate() {
        return ArticleGroup.findOne({})
            .sort({ 'createdAt': 'asc' })
            .limit(1)
            .exec()
            .then((articleGroup) => {
            if (!articleGroup) {
                return 0;
            }
            return Date.parse(articleGroup.createdAt);
        })
            .catch((err) => {
            if (err) {
                logg.error(err);
            }
        });
    }
    shouldUpdateHeadlines() {
        return this.getLatestHeadlineDate()
            .then((date) => {
            if ((Date.now() - 432000) >= date) { // 2hrs
                return true;
            }
            else {
                return false;
            }
        })
            .catch((err) => {
            if (err) {
                logg.error(err);
            }
        });
    }
    getNewHeadlines() {
        return newsapi.v2.topHeadlines({
            sources: sources,
            language: 'en'
        })
            .then(response => {
            if (response.status === 'error') {
                throw (response.message);
            }
            return response.articles.map((article) => {
                return {
                    sourceId: article.source.id,
                    sourceName: article.source.name,
                    title: article.title,
                    url: article.url,
                    publishedAt: article.publishedAt
                };
            });
        })
            .then((articles) => {
            let articleGroup = new ArticleGroup();
            articleGroup.articles = articles;
            return articleGroup.save();
        })
            .then((articleGroup) => {
            return articleGroup;
        })
            .catch((err) => {
            logg.error(err);
        });
    }
}
module.exports = headlineProcessor;
