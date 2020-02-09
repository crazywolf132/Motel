import express from 'express';
import morgan from 'morgan';
import timeout from 'express-timeout-handler';
import { json, urlencoded } from 'body-parser';
import cors from 'cors';

/*
 
 ███████╗███████╗████████╗██╗   ██╗██████╗ 
 ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
 ███████╗█████╗     ██║   ██║   ██║██████╔╝
 ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝ 
 ███████║███████╗   ██║   ╚██████╔╝██║     
 ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝     
                                           
 
*/

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();

if (process.env.NODE_ENV !== 'test') {
	app.use(morgan('dev'));
}

const corsOptions = {
	origin:
		process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development'
			? process.env.WHITELIST.split(',')
			: 'http://localhost:9070',
	credentials: true,
	methods: ['GET', 'PUT', 'POST', 'OPTIONS'],
	optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(json());
app.use(urlencoded({ extended: true }));
app.use('*', cors(corsOptions));

app.use(
	timeout.handler({
		timeout: 30000,
		onTimeout: function(req, res) {
			res.status(503).send('Request timeout. Please retry again later');
		}
	})
);

/*
 
 ██████╗  ██████╗ ██╗   ██╗████████╗███████╗███████╗
 ██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔════╝
 ██████╔╝██║   ██║██║   ██║   ██║   █████╗  ███████╗
 ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ╚════██║
 ██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗███████║
 ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚══════╝
                                                    
 
*/

const base = require(`${process.cwd()}/routes/baseRoute`);

app.use('/v1/', base.default);

module.exports = app;
