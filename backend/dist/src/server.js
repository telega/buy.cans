const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./logger');
const routes = require('./routes');
const hbs = require('express-handlebars');
const port = 3000;
app.engine('handlebars', hbs({ defaultLayout: 'main.handlebars' }));
app.set('view enigne', 'handlebars');
app.use(cors());
app.use(morgan('dev'));
routes(app);
module.exports = app.listen(port, function () {
    logger.info('Listening on ' + port);
});
