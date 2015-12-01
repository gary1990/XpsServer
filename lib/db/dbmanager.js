/**
 * Created by garychen on 11/16/15.
 */
var couchbase = require('couchbase');

function DBManager() {
}

DBManager.prototype.dbconnections = {};

DBManager.prototype.openBucket = function(clusterUrl, bucketName, callback) {
	var connKey = clusterUrl + "_" + bucketName;
	var self = this;
	if (!this.dbconnections[connKey]) {
		var cluster = new couchbase.Cluster(clusterUrl);
		var bucketConn = cluster.openBucket(bucketName, function (err, result) {
			if (err) {
				console.error("can not open bucket, cluster: " + clusterUrl + ", bucket: " + bucketName);
				callback(err);
			} else {
				self.dbconnections[connKey] = bucketConn;
				callback(null, bucketConn);
			}
		});
	} else {
		callback(null, self.dbconnections[connKey]);
	}
}

module.exports = new DBManager();
