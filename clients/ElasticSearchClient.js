import { Client } from '@elastic/elasticsearch';
import { readFileSync } from 'fs';

// const caFile = readFileSync(`${process.env.ELASTIC_CERT_PATH}`);

export default class ElasticSearchClient {
	constructor() {
		this.url = 'http://localhost:9200';
		this.auth;
		this.ssl;
		this.client = new Client({
			node: this.url,
			maxRetries: 1,
			log: 'trace',
			ssl: this.ssl,
			auth: this.auth
		});

		return this;
	}

	setUrl(url) {
		this.url = url;

		return this;
	}

	addSSL(data) {
		this.ssl = data;
	}

	addAuth(data) {
		this.auth = data;
	}

	regenerate() {
		this.client = new Client({
			node: this.url,
			maxRetries: 1,
			log: 'trace',
			ssl: this.ssl,
			auth: this.auth
		});

		return this;
	}

	getClient() {
		return this.client;
	}
}
