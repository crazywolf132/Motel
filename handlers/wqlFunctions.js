const handler = (module.exports = {});

handler.fixNullResults = data => {
	return data.filter(result => {
		if (result !== null) {
			return result;
		}
	});
};

handler.ignore = (ignoreOptions, data) => {
	if (!(ignoreOptions instanceof Object)) {
		return data;
	}

	if (ignoreOptions.hasOwnProperty('hasFields')) {
		ignoreOptions.hasFields.forEach(field => {
			if (field instanceof Object) {
				let holder = data;
				holder.forEach((result, index) => {
					if (dataContainsField(result, field.key, field.value)) {
						delete holder[index];
					}
				});
			}
		});
	}

	return handler.fixNullResults(data);
};

handler.duplicate = (fieldList, json_data) => {
	if (!Array.isArray(fieldList)) {
		return json_data;
	}

	fieldList.forEach(entry => {
		json_data.body.hits.hits.forEach(result => {
			const data = result._source;
			data[`${entry}_copy`] = data[entry];
			return result;
		});
	});

	return json_data;
};

handler.rename = (renameData, json_data) => {
	if (!Array.isArray(renameData)) {
		return json_data;
	}

	renameData.forEach(renameEntry => {
		json_data.body.hits.hits.forEach(result => {
			const data = result._source;
			if (renameEntry.old in data) {
				data[renameEntry.new] = data[renameEntry.old];
				delete data[renameEntry.old];
			}
			return result;
		});
	});

	return json_data;
};

handler.reValue = (revalueData, json_data) => {
	if (!Array.isArray(revalueData)) {
		return json_data;
	}

	revalueData.forEach(revalue => {
		json_data.body.hits.hits.forEach(result => {
			const data = result._source;
			if (data[revalue.field] === revalue.old) {
				data[revalue.field] = revalue.new;
				return result;
			}
		});
	});

	return json_data;
};

handler.defaultHandler = (defaultList, json_data) => {
	if (!Array.isArray(defaultList)) return json_data;

	defaultList.forEach(defaultEntry => {
		json_data.body.hits.hits.forEach(result => {
			const data = result._source;
			if (!Object.keys(data).includes(defaultEntry.title)) {
				data[defaultEntry.title] = defaultEntry.value;
			}

			return result;
		});
	});

	return json_data;
};

const dataContainsField = (json_data, field, value) => {
	return json_data.hasOwnProperty(field) && json_data[field] === value;
};
