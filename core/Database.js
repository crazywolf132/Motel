const MongoClient = require('mongodb').MongoClient;

export class Database {
	constructor(information, type) {
		this.information = information;
		this.client;
		this.type = type;
		return this;
	}
	registerClient() {
		switch (this.type) {
			case 'mongo':
				this.client = new MongoClient(`mongodb://${this.information.url}`, {
					useNewUrlParser: true,
					useunifiedTopology: true
				});
				break;
		}

		return this;
	}
	save(document, res) {
		switch (this.information.type.toLowerCase()) {
			case 'mongo':
				console.log(this.client);
				this.client.connect(async err => {
					console.log('in heree');
					if (err) {
						console.log(err);
						res.json({ status: 0, error: err });
						return;
					}
					const collection = this.client
						.db(this.information.db)
						.collection(this.information.collection);
					await collection.insertOne(document, error => {
						if (error) {
							console.log(error);
							res.json({ status: 0, error: error });
							return;
						}
						this.client.close();
						res.json({ status: 1 });
					});
				});
		}
	}
}
