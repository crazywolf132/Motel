const share = (module.exports = {});
import { Router } from 'express';
import { writeFileSync, existsSync, mkdirSync, fstat } from 'fs';
import OracleDB from 'oracledb';
import axios from 'axios';
import { Database } from './Database';

import { log, findFilesAndFolders, asyncForEach } from '../handlers/utils';
import { checkWQL } from '../middleware/base';

import {
	manipulate,
	ignore,
	rename,
	reValue,
	duplicate,
	defaultHandler,
	manualSort,
	combineHandler,
	countHandler
} from '../handlers/wqlFunctions';

share._baseUrls = {};
share._connections = {};
share._router = Router();
share._middleware = checkWQL;
share._presets = {};
share._customFunctions = {};
share._routes = {};
share._environments = {};

let currentMod = '';

share.start = async () => {
	// Need to get the latest routes file.
	await axios.get(`${process.env.HOME_URL}/ROUTES.json`).then(response => {
		share._routes = response.data;
	});

	await axios
		.get(`${process.env.HOME_URL}/ROUTES.json`)
		.then(response => {
			share._routes = response.data;
		})
		.catch(err => {
			// This means that we cant get it for some reason... so we will do a scan for everything we have.
			let mods = [];
			findFilesAndFolders(`${process.cwd()}/mods/`, mods, true, true, false);
			log(mods);
			mods.forEach(mod => {
				share._routes[mod] = mod;
			});
		});

	share.loadModules();
};

share.wipe = async () => {
	share._baseUrls = {};
	share._connections = {};
	share.router = Router();
	share.middleware = checkWQL;
	share._presets = {};
	share._customFunctions = {};
	share._routes = {};
	share._environments = {};
};

share.loadModules = () => {
	let alreadyLoaded = [];
	let mods = [];
	findFilesAndFolders(process.cwd() + '/mods/', mods, true, true, false);
	mods.forEach(item => {
		if (!(item in alreadyLoaded)) {
			alreadyLoaded.push(item);
			currentMod = item;
			// Loading the ENVIRONMENT file
			const enviroPath = `${process.cwd()}/mods/${item}/ENVIRONMENT.json`;
			if (existsSync(enviroPath)) {
				let enviro = require(enviroPath);

				Object.keys(enviro).forEach(key => {
					share.addEnvironment(item, key, enviro[key]);
				});
			}
			// Loading the mod
			let res = require(process.cwd() + `/mods/${item}/mod.js`);
			res.core(share, share.using);
		}
	});
};
share.route = (path, callBack, options = {}) => {
	switch (options.method ? options.method.toLowerCase() : 'post') {
		case 'delete':
			share._router.delete(
				`/${currentMod}${path}`,
				options.disableWQLMiddleware
					? (req, res, next) => {
							next();
					  }
					: share._middleware,
				(req, res, next) => {
					callBack(req, res, next);
				}
			);
			return;
		case 'put':
			share._router.put(
				`/${currentMod}${path}`,
				options.disableWQLMiddleware
					? (req, res, next) => {
							next();
					  }
					: share._middleware,
				(req, res, next) => {
					callBack(req, res, next);
				}
			);
			return;
		case 'patch':
			share._router.patch(
				`/${currentMod}${path}`,
				options.disableWQLMiddleware
					? (req, res, next) => {
							next();
					  }
					: share._middleware,
				(req, res, next) => {
					callBack(req, res, next);
				}
			);
			return;
		case 'get':
			share._router.get(
				`/${currentMod}${path}`,
				options.disableWQLMiddleware
					? (req, res, next) => {
							next();
					  }
					: share._middleware,
				(req, res, next) => {
					callBack(req, res, next);
				}
			);
			return;
		case 'post':
		default:
			share._router.post(
				`/${currentMod}${path}`,
				options.disableWQLMiddleware
					? (req, res, next) => {
							next();
					  }
					: share._middleware,
				(req, res, next) => {
					callBack(req, res, next);
				}
			);
	}
};
share.modExists = modName => {
	return Object.keys(share._routes).indexOf(modName) > -1;
};
share.findModule = async (modName, res) => {
	const modPath = `${process.cwd()}/mods/${share._routes[modName]}/`;

	if (!existsSync(modPath)) {
		mkdirSync(modPath);
	}

	await axios
		.get(`${process.env.HOME_URL}/${share._routes[modName]}/VERSION`)
		.then(response => {
			writeFileSync(
				`${modPath}VERSION.json`,
				JSON.stringify(response.data, null, 2)
			);
		})
		.then(() => {
			axios
				.get(
					`${process.env.HOME_URL}/${share._routes[modName]}/ENVIRONMENTS.js`
				)
				.then(res => {
					writeFileSync(
						`${modPath}ENVIRONMENTS.js`,
						JSON.stringify(res.data, null, 2)
					);
				});
		})
		.then(() => {
			res.json({ status: 'Success!', info: 'Module installed!' });
			log('INSTALLED ' + modName, 'DOWNLOAD');
		});
};
share.updateModule = (modName, res) => {
	axios
		.get(`${process.env.HOME_URL}/${share._routes[modName]}/VERSION`)
		.then(response => {
			const latestVersion = response.data.version;
			let currentVersion;
			const modPath = `${process.cwd()}/mods/${share._routes[modName]}/`;
			if (!existsSync(modPath + 'VERSION.json')) {
				mkdirSync(modPath);
				currentVersion = '0.0.0.0.0.0';
			} else {
				currentVersion = require(`${modPath}/VERSION.json`).version;
			}

			if (latestVersion !== currentVersion) {
				// Need to download module.
				share.findModule(modName, res);
			} else {
				res.json({ status: 'Success!', info: 'Module already up to date.' });
			}
		});
};
share.addFunction = (modName, name, callBack) => {
	if (Object.keys(share._customFunctions).indexOf(modName) === -1) {
		share._customFunctions[modName] = {};
	}
	share._customFunctions[modName][name] = callBack;
};
share.addConnection = (modName, data) => {
	switch (data.type) {
		case 'elastic':
			let esClient = new require(`${process.cwd()}/clients/ElasticSearchClient`)
				.default;
			let client = new esClient();
			if (data.auth) {
				client.addAuth(data.auth);
			}
			if (data.ssl) {
				client.addSSL(data.ssl);
			}
			data.client = client.setUrl(data.url).regenerate();
	}
	share._connections[modName] = data;
};
share.performEndpointSearch = async (req, res) => {
	log('endpoint search');
	const modName = req.params.modName;
	const WQL = req.body;
	const details = share._connections[modName];

	// Working out the type of request.
	await axios({
		url: details.url,
		method: details.method,
		data: details.data || {}
	})
		.then(response => {
			if (details.callBack) {
				details.callBack(response, res);
			} else {
				res.json(response.data);
			}
		})
		.catch(err => {
			if (details.catchCallBack) {
				details.catchCallBack(error, res);
			} else {
				res.status(err.response.status).json({ err: err.response.statusText });
			}
		});
};
share.performMongoSearch = async (req, res) => {
	const modName = req.params.modName;
	const WQL = req.body;
	const details = share._connections[modName];

	WQL.strict = true;

	const MongoClient = require('mongodb').MongoClient;
	const client = new MongoClient(`mongodb://${details.url}`, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	});

	const searchOptions = {};

	WQL.searchFields.forEach(field => {
		searchOptions[field] = { $regex: WQL.searchTerm, $options: 'i' };
	});

	client.connect(async err => {
		if (err) {
			res.status(500);
			res.json(err);
			return;
		}
		const collection = client.db(details.db).collection(details.collection);
		const cursor = await collection
			.find(searchOptions)
			.limit(WQL.limit ? WQL.limit : 0)
			.toArray();
		client.close();
		// res.json(cursor);
		let changed = [];
		cursor.forEach(document => {
			changed.push({
				_source: document
			});
		});
		res.json(
			share.cleanElasticData(WQL, { body: { hits: { hits: changed } } })
		);
	});
};
share.performOracleSearch = async (req, res) => {
	const modName = req.params.modName;
	const WQL = req.body;
	let connection;

	WQL.strict = true;

	if (!WQL.sql) {
		res.status(400);
		res.json({
			status: 'FAILED',
			message:
				'As you are using an SQL DB, this WQL query needs to be altered. Replace "searchTerm" and "searchFields" with an "sql" field'
		});

		return;
	}

	WQL.sql = Array.isArray(WQL.sql) ? WQL.sql : [WQL.sql];
	try {
		const details = share._connections[modName];
		connection = await OracleDB.getConnection(details);
		//TODO: CREATE SEARCH QUERY...
		new Promise((resolve, reject) => {
			let result = [];
			WQL.sql.forEach(async (statement, index, array) => {
				const results = await connection.execute(statement);
				results.rows.forEach(document => {
					let temp = {
						'FROM_QUERY_#': index
					};
					document.forEach((value, index) => {
						temp[results.metaData[index].name] = value;
					});
					result.push({
						_source: temp
					});
				});
				if (Object.is(array.length - 1, index)) {
					resolve({
						result: result
					});
				}
			});
		}).then(result => {
			res.json(
				share.cleanElasticData(
					WQL,
					{ body: { hits: { hits: result.result } } },
					modName
				)
			);
		});
	} catch (error) {
		log(error, 'ERROR');
	}
};
share.performElasticSearch = (req, res) => {
	const modName = req.params.modName;
	const WQL = req.body;
	let connection = share._connections[modName];
	let payload = {
		query: {
			bool: {
				must_not: [],
				must: []
			}
		}
	};

	if (WQL.body !== undefined) {
		payload = WQL.body;
		log(JSON.stringify(WQL.body, null, 2), 'ERROR');
	} else if (WQL.search !== undefined) {
		WQL.search.forEach(wqlStatement => {
			payload = share.createWQLBody(payload, wqlStatement);
		});
	} else {
		payload = share.createWQLBody(payload, WQL);
	}

	if (WQL.from !== undefined) {
		payload.from = WQL.from;
	}

	if (WQL.sort !== undefined) {
		payload.sort = {};
		payload.sort[WQL.sort.key] = { order: WQL.sort.order };
	}
	payload.size = WQL.size !== undefined ? WQL.size : 200;

	const options = {
		body: payload,
		index: connection.index || ' '
	};

	if (WQL.index) {
		options.index = WQL.index;
	}

	connection.client.getClient().search(options, (err, json_data) => {
		if (err) {
			res.status(500).json({
				status: 'FAILED',
				message: 'It seems something is wrong with the connection...',
				response: err
			});
			return;
		}

		res.json(share.cleanElasticData(WQL, json_data, modName));
	});
};
share.cleanElasticData = (WQL, json_data, modName) => {
	// return json_data;
	let results = {};

	if (!WQL.strict) {
		results.took = json_data.body.took;
		results.searchTerm = WQL.searchTerm;
		results.searchFields =
			WQL.searchFields instanceof Array ? WQL.searchFields : [WQL.searchFields];
		results.totalResults = json_data.body.hits.total;
		results.size = WQL.size !== undefined ? WQL.size : 200;
	}

	results.results = [];

	const requiredFields =
		WQL.wantBack instanceof Array ? WQL.wantBack : [WQL.wantBack];

	// DOING ALL THE CHECKS FOR THE DIFFERENT METHODS NOW...

	if (WQL.manipulate !== undefined) {
		if (Array.isArray(WQL.manipulate)) {
			WQL.manipulate.forEach(func => {
				if (
					Object.keys(share._customFunctions).indexOf(modName) > -1 &&
					Object.keys(share._customFunctions[modName]).indexOf(func) > -1
				) {
					json_data = share._customFunctions[modName][func](WQL, json_data);
				}
			});
		}

		// json_data = manipulate(WQL.manipulate, json_data);
	}

	if (WQL.duplicate !== undefined) {
		json_data = duplicate(WQL.duplicate, json_data);
	}

	if (WQL.rename !== undefined) {
		json_data = rename(WQL.rename, json_data);
	}

	if (WQL.revalue !== undefined) {
		json_data = reValue(WQL.revalue, json_data);
	}

	if (WQL.default !== undefined) {
		json_data = defaultHandler(WQL.default, json_data);
	}

	if (WQL.combine !== undefined) {
		json_data = combineHandler(WQL.combine, json_data);
	}

	// Changing whats returned
	if (requiredFields.length > 0) {
		json_data.body.hits.hits.forEach(hit => {
			const newObject = {};
			requiredFields.forEach(field => {
				if (hit._source.hasOwnProperty(field)) {
					newObject[field] = hit._source[field];
				}
			});

			results.results.push(newObject);
		});
	} else {
		json_data.body.hits.hits.forEach(hit => {
			results.results.push(hit._source);
		});
	}

	// Ignore being loaded.
	if (WQL.ignore !== undefined) {
		results.results = ignore(WQL.ignore, results.results);
	}

	if (json_data.body.aggregations !== undefined) {
		results.aggregations = json_data.body.aggregations;
	}

	if (json_data.body.counts !== undefined) {
		results.counts = json_data.body.counts;
	}

	// RETURNING THE FINISHED PRODUCT
	return results;
};
share.createWQLBody = (Payload, WQL) => {
	let payload = Payload;

	if (WQL.hasNot) {
		payload.query.bool.must_not.push({
			query_string: {
				query: `*${WQL.searchTerm}*`,
				fields:
					WQL.searchFields instanceof Array
						? WQL.searchFields
						: [WQL.searchFields]
			}
		});
	} else {
		let temp = {};
		temp[WQL.searchType !== undefined ? WQL.searchType : 'query_string'] = {
			query: `*${WQL.searchTerm}*`,
			fields:
				WQL.searchFields instanceof Array
					? WQL.searchFields
					: [WQL.searchFields]
		};
		payload.query.bool.must.push(temp);
	}

	return payload;
};
share.addPreset = (presetName, data) => {
	if (!(Object.keys(share._presets).indexOf(presetName) > -1)) {
		// It is not in there.
		share._presets[presetName] = {};
	}
	share._presets[presetName][data.key] = data;
};
share.workoutMode = modName => {
	switch (share._connections[modName].type) {
		case 'elastic':
			return share.performElasticSearch;
		case 'oracledb':
			return share.performOracleSearch;
		case 'mongo':
			return share.performMongoSearch;
		case 'endpoint':
			return share.performEndpointSearch;
		case 'customData':
			return share._connections[modName].data;
		default:
			log(`IT IS ::: ${share._connections[modName].type}`);
	}
};
share.moduleFailed = modName => {
	share._routes[modName].failCount = 1;
	share._routes[modName].down = share._routes[modName].failCount >= 3;
};
share.addEnviroment = (modName, data, value) => {
	if (Object.keys(share._environments).indexOf(modName) === -1) {
		share._environments[modName] = {};
	}
	share._environments[modName][data] = value;
};
