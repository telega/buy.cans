const express = require('express');
const router = express.Router();
const headlines = require('./headlines');
const logger = require('./logger');
const axios = require('axios');

const headlineProcessor = require('./headlineProcessor')

hp = new headlineProcessor();

module.exports = function(app){

	router.route('/')
    .get((req,res) =>{
		res.render('home.handlebars');
	});
	
	router.route('/test')
		.get((req,res)=>{
			
			
			res.send(hp.sortHeadlines());
		})

    router.route('/headlines')
        .get((req,res)=>{
			let url = 'http://' + req.get('host') + '/api/headlines'
			axios.get(url)
				.then((response)=>{	
					console.log(response.data)		
					res.render('headlines.handlebars', {articles: response.data.articles})
				})
				.catch((err)=>{logger.error(err)})
        })

	router.route('/api/headlines')
        .get(headlines.getHeadlines);

	app.use('/',router);
};