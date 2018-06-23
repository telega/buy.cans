require('dotenv').config();
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(NEWS_API_KEY);
const logger = require('./logger');

const sources ='financial-times,the-guardian-uk,the-telegraph,independent,bbc-news';

exports.getHeadlines = function(req,res){
	newsapi.v2.topHeadlines({
		sources: sources,
		language: 'en'
	}).then(response => {
		res.json(response);
    /*
      {
        status: "ok",
        articles: [...]
      }
    */

		res.send('ok');
	})
    .catch((err)=>{
	logger.error(err);
});
};
