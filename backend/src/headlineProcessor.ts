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
//const logger = require('./logger');
const _ = require('lodash');
const mongoose = require('mongoose');
const bluebird = require('bluebird');
mongoose.Promise = bluebird;
const ArticleGroup = require('./models/ArticleGroup');
//const Article = require('./models/Article');
const dbUrl = process.env.DB_URL;

interface Clouds{}


interface Article{
    title: string,
};

interface Articles{
    ftArticles: Array<Article>,
    otherArticles: Array<Article>,
};

class headlineProcessor {
    constructor() {
        mongoose.connect(dbUrl);
    }
    getKeyPhrasesFromHeadlines(articles: Articles) {
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
        //let body = {"documents":[{"language":"en","id":"ft_0","text":"Radical reform: Switzerland to vote on banking overhaul"},{"language":"en","id":"ft_1","text":"The iPhone may not be what finally pushes Apple over $1tn"},{"language":"en","id":"ft_2","text":"Deal-hungry JAB to buy Pret A Manger for £1.5bn"},{"language":"en","id":"ft_3","text":"Graduate applications flood Deutsche and other banks"},{"language":"en","id":"ft_4","text":"Trump confirms top North Korea official due in US"},{"language":"en","id":"ft_5","text":"Soros on Europe: ‘Everything that could go wrong has gone wrong’"},{"language":"en","id":"ft_6","text":"Italy’s new technocrat should find his inner populist"},{"language":"en","id":"ft_7","text":"Driving Italy out of the euro makes no sense at all"},{"language":"en","id":"ft_8","text":"Italian bank bond yields surge in fallout from political turmoil"},{"language":"en","id":"ft_9","text":"Bank of Italy warns Rome is close to losing ‘asset of trust’"},{"language":"en","id":"other_0","text":"Hurricane Maria 'killed 4,600 in Puerto Rico'"},{"language":"en","id":"other_1","text":"French Open 2018: Serena Williams vs Kristyna Pliskova live score updates"},{"language":"en","id":"other_2","text":"Italy's snap elections could turn into a referendum on EU and euro"},{"language":"en","id":"other_3","text":"Abramovich cannot work in UK if he arrives on Israeli passport, No 10 says"},{"language":"en","id":"other_4","text":"EDL founder Tommy Robinson jailed for contempt of court"},{"language":"en","id":"other_5","text":"Revealed: industrial-scale beef farming comes to the UK"},{"language":"en","id":"other_6","text":"Italy at risk of new financial crisis in wake of coalition's collapse"},{"language":"en","id":"other_7","text":"Not right, and not real: Car Share's ending was a cop out"},{"language":"en","id":"other_8","text":"In the Middle East, Putin has a lot to thank Trump for"},{"language":"en","id":"other_9","text":"Britain could rejoin the European Union after Brexit, says Jacob Rees-Mogg"}]}
       // console.log(body);
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
            logger.error(err);
        });
	}
	
    sortLatestArticles() {
        return ArticleGroup.findOne({})
            .sort({ 'createdAt': 'asc' })
            .limit(1)
            .exec()
            .then((articleGroup) => {
            if (!articleGroup) {
                return { ftArticles: [], otherArticles: [] };
                ;
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
                logger.error(err);
            }
        });
    }
    matchAndScore(clouds) {
        //console.log(clouds);
        let ftCloud = clouds.ftCloud;
        let otherCloud = clouds.otherCloud;
        console.log(otherCloud);
        let ftCloudTokenized = [];
        let otherCloudTokenized = [];
        ftCloud.forEach((ftPhrase) => {
            let tokens = tokenizer.tokenize(ftPhrase);
            ftCloudTokenized = _.concat(ftCloudTokenized, tokens);
        });
        //console.log(ftCloudTokenized);
        otherCloud.forEach((otherPhrase) => {
            let tokens = tokenizer.tokenize(otherPhrase);
            otherCloudTokenized = _.concat(otherCloudTokenized, tokens);
        });
        //console.log(otherCloudTokenized)
        let uniqFtTokens = _.uniq(ftCloudTokenized);
        let uniqOtherTokens = _.uniq(otherCloudTokenized);
        let filteredUniqFtTokens = uniqFtTokens.filter((token) => {
            return token.length >= 4;
        });
        let filteredUniqOtherTokens = uniqOtherTokens.filter((token) => {
            return token.length >= 4;
        });
        //console.log(uniqFtTokens);
        filteredUniqFtTokens.forEach((ftPhrase) => {
            filteredUniqOtherTokens.forEach((otherPhrase) => {
                let score = natural.JaroWinklerDistance(ftPhrase, otherPhrase);
                if (score >= 0.9) {
                    console.log(score);
                    console.log(ftPhrase + ' : ' + otherPhrase);
                }
            });
        });
        console.log(filteredUniqFtTokens.length);
        console.log(filteredUniqOtherTokens.length);
    }
	
	getLatestHeadlineDate() {

		return ArticleGroup.findOne({})
		.sort({ 'createdAt': 'asc' })
		.limit(1)
		.exec()
		.then((articleGroup) => {
		if (!articleGroup) {
			return 0;
			;
		}
		return Date.parse(articleGroup.createdAt);
	})
		.catch((err) => {
		if (err) {
			logger.error(err);
		}
	});
	}

	getNewHeadlines(){
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
            logger.error(err);
        });
     }
}
module.exports = headlineProcessor;
