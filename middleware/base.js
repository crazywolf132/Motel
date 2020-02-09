const base = (module.exports = {});

base.checkWQL = (req, res, next) => {
	console.log('running');
	let WQL = req.body;
	const required = 3;
	let found = 0;

	if (WQL.hasOwnProperty('sql')) found += 2;

	if (WQL.hasOwnProperty('searchTerm')) found++;

	if (WQL.hasOwnProperty('searchFields')) found++;

	if (WQL.hasOwnProperty('wantBack')) found++;

	if (found === required) {
		next();
	} else {
		res.status(400);
		res.json({
			status: 'Failed',
			message: 'Failed to meet query requirements'
		});
	}
};
