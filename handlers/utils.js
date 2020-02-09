const utils = (module.exports = {});
import { readdirSync, statSync, existsSync } from 'fs';
import chalk from 'chalk';
const log = console.log;

utils.asyncForEach = (data, todoFunction, passables) => {
	return new Promise((resolve, reject) => {
		let dataHolder = passables;
		data.forEach((item, index, array) => {
			dataHolder = todoFunction(item, index, array, dataHolder, passables);
			if (Object.is(array.length - 1, index)) {
				resolve({
					status: 'Finished',
					count: array.length,
					dataHolder: dataHolder
				});
			}
		});
	});
};

utils.findFilesAndFolders = (
	_path,
	_list,
	returnNamesOnly,
	checkForDir,
	checkForFile
) => {
	readdirSync(_path).forEach(file => {
		if (checkForDir && !checkForFile) {
			if (statSync(_path + file).isDirectory()) {
				returnNamesOnly ? _list.push(file) : _list.push(_path + file);
			}
		} else if (!checkedForDir && checkForFile) {
			if (statSync(_path + file).isFile()) {
				_list.push(_path + file);
			}
		} else {
			returnNamesOnly ? _list.push(file) : _list.push(_path + file);
		}
	});
};

utils.log = (message, type = 'INFO') => {
	log(
		chalk`[${new Date().toJSON()}] {bgRed.bold ${type}} {bgCyan.black.bold ${message}}`
	);
};
