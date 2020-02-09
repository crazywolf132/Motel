const WQL = require('../core/WQL');

const router = WQL._router;
WQL.start();

router.post('/:modName/', WQL._middleware, (req, res) => {
	if (WQL.modExists(req.params.modName)) {
		const search = WQL.workoutMode(req.params.modName);
		console.log(search);
		search(req, res);
	} else {
		res.status(400);
		res.json({
			status: 'FAILED',
			error: 'Module does not exist. Incorrect name?',
		});
	}
});

router.patch('/:modName/', WQL._middleware, (req, res) => {
	if (WQL.modExists(req.params.modName)) {
		WQL.updateModule(req.params.modName, res);
	} else {
		res.status(400);
		res.json({
			status: 'FAILED',
			error: 'Module does not exist. Incorrect name?',
		});
	}
});

export default router;
