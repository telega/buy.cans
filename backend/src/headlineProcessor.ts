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
const stopWords = ["a", "able", "about", "across", "after", "all", "almost", "also", "am", "among", "an", "and", "any", "are", "as", "at", "be", "because", "been", "but", "by", "can", "cannot", "could", "dear", "did", "do", "does", "either", "else", "ever", "every", "for", "from", "get", "got", "had", "has", "have", "he", "her", "hers", "him", "his", "how", "however", "i", "if", "in", "into", "is", "it", "its", "just", "least", "let", "like", "likely", "may", "me", "might", "most", "must", "my", "neither", "no", "nor", "not", "of", "off", "often", "on", "only", "or", "other", "our", "own", "rather", "said", "say", "says", "she", "should", "since", "so", "some", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "tis", "to", "too", "twas", "us", "wants", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would", "yet", "you", "your", "ain't", "aren't", "can't", "could've", "couldn't", "didn't", "doesn't", "don't", "hasn't", "he'd", "he'll", "he's", "how'd", "how'll", "how's", "i'd", "i'll", "i'm", "i've", "isn't", "it's", "might've", "mightn't", "must've", "mustn't", "shan't", "she'd", "she'll", "she's", "should've", "shouldn't", "that'll", "that's", "there's", "they'd", "they'll", "they're", "they've", "wasn't", "we'd", "we'll", "we're", "weren't", "what'd", "what's", "when'd", "when'll", "when's", "where'd", "where'll", "where's", "who'd", "who'll", "who's", "why'd", "why'll", "why's", "won't", "would've", "wouldn't", "you'd", "you'll", "you're", "you've"]
//const logger = require('./logger');
const _ = require('lodash');
const mongoose = require('mongoose');
const bluebird = require('bluebird');
mongoose.Promise = bluebird;
const ArticleGroup = require('./models/ArticleGroup');
//const Article = require('./models/Article');
const dbUrl = process.env.DB_URL;



interface Clouds{
	ftCloud: Array<string>,
	otherCloud: Array<string>,
};

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

	tokenizePhrases(phrases: Array<string>){
		let tokenizedPhrases = [];
		
        phrases.forEach((phrase) => {
            let tokens = tokenizer.tokenize(phrase);
            tokenizedPhrases = _.concat(tokenizedPhrases, tokens);
		});
		
		let uniqTokenizedPhrases = _.uniq(tokenizedPhrases);
		
        let filteredUniqTokenizedPhrases = uniqTokenizedPhrases.filter((token) => {
			let idx = stopWords.indexOf(token);
			return ( (token.length > 2) && (idx === -1) ) ;
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
                logger.error(err);
            }
        });
	}
	
    matchClouds(clouds: Clouds) {   
		// this is pretty expensive

		let targetScore = 0.9;

		let matchedFtCloud = clouds.ftCloud.map((ftPhrase)=>{

			let scores = clouds.otherCloud.map((otherPhrase)=>{
				return natural.JaroWinklerDistance(ftPhrase, otherPhrase);
			})

			let maxScore = Math.max.apply(null,scores);
			if (maxScore >= targetScore){
				return {token: ftPhrase, matched: true}
			} else {
				return {token: ftPhrase, matched: false}
			}
		})

		let matchedOtherCloud = clouds.otherCloud.map((otherPhrase)=>{
			let scores = clouds.ftCloud.map((ftPhrase)=>{
				return natural.JaroWinklerDistance(otherPhrase, ftPhrase);
			})

			let maxScore = Math.max.apply(null,scores);

			if (maxScore >= targetScore){
				return {token: otherPhrase, matched: true}
			} else {
				return {token: otherPhrase, matched: false}
			}
		})
		return {matchedFtCloud, matchedOtherCloud}

    }
	
	getLatestHeadlineDate(){

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

	shouldUpdateHeadlines(){

		return this.getLatestHeadlineDate()
			.then((date) => {
				if( (Date.now() - 432000 ) >= date ){   // 2hrs
					return true;
				} else {
					return false;
				}
			})
			.catch((err)=>{
				if(err){
					logger.error(err);
			}
		})
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
