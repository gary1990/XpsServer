/**
 * Created by garychen on 11/16/15.
 */
var couchbase = require('couchbase');
var logger = require('../../utils/logger');

function ViewManager() {}

/**
 *
 * @param openBucket bucket连接
 * @param designDocName design document name
 * @param designViewName design view name
 * @param keyStr the key word
 * @param stale query mode, 1: before, 2: none, 3: after
 * @param limitNumber if need limit, number
 * @param callback
 * @constructor
 */
ViewManager.prototype.QueryView = function (openBucket, designDocName, designViewName, keyWord, stale, limitNumber, callback) {
	if (!openBucket || !designDocName || !designViewName) {
		logger.error("openedBucket, designDocName, designViewName must provide");
	}
	var viewQuery = couchbase.ViewQuery.from(designDocName, designViewName);

	if (keyWord) {
		viewQuery = viewQuery.key(keyWord);
	}

	var queryMode;
	switch (stale) {
		case 1:
			queryMode = couchbase.ViewQuery.Update.BEFORE;
			break;
		case 2:
			queryMode = couchbase.ViewQuery.Update.NONE;
			break;
		case 3:
			queryMode = couchbase.ViewQuery.Update.AFTER;
			break;
		default:
			queryMode = couchbase.ViewQuery.Update.AFTER;
			break;
	}
	viewQuery = viewQuery.stale(queryMode);

	if(limitNumber && (typeof limitNumber === "number")) {
		viewQuery = viewQuery.limit(limitNumber);
	}

	openBucket.query(viewQuery, function (err, results) {
		callback(err, results);
	});
}

module.exports = new ViewManager();
