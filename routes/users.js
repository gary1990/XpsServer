var express = require('express');
var generator = require('../utils/generator');
var async = require('async');
var dbmanager = require('../lib/db/dbmanager');
var requestmethod = require('../lib/httprequest/requestmethod');
var config = require('../config');
var logger = require('../utils/logger');
var viewManager = require('../lib/views/viewmanager');
var viewconfig = require('../lib/views/viewsconfig');

var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/**
 * 用户登录
 */
router.post("/login", function (req, res) {
  var user = req.body;
  if (!user || !(user.username) || !(user.password)) {
    res.status(400).json({error: "Invalid username or password."});
    return;
  }
  var session;
  //user role默认为医生
  user["role_type"] = "doctor";
  //根据用户类型及手机号获得用户信息的id，也是couchbase本身用户的name
  var userId = generator.generateUserId(user.username, user.role_type);
  var couchbaseCluster = config.urls.couchbase_cluster || "http://127.0.0.1/";
  var bucketName = config.buckets.couchbase_server || "test";
  var syncGatewayUrl = config.urls.sync_gateway || "http://127.0.0.1:4985";
  async.waterfall([
    //获取bucket连接
    function (callback) {
      dbmanager.openBucket(couchbaseCluster, bucketName, callback);
    },
    //查询view获得当前用户信息
    function (openBucket, callback) {
      var disginDocName = viewconfig.user.designdocumentName;
      var disginViewName = viewconfig.user.designdocumentViews.user_by_userid_password.name;
      viewManager.QueryView(openBucket, disginDocName, disginViewName, userId, 1, 1, callback);
    },
    //获得用户信息, 校验用户信息
    function(viewResult, callback) {
      console.dir(viewResult);
      if (viewResult.length === 0) {
        var error = new Error("user not found");
        callback(error);
      } else {
        var userFind = viewResult[0];
        if (!userFind["value"] || (userFind["value"] !== user.password)) {
          var error = new Error("user authorize failed");
          callback(error);
        } else {
          callback(null, userFind);
        }
      }
    },
    //获取用户session
    function (userFind, callback) {
      if (userFind["id"]) {
        var subUrl = config.urls.sync_gateway_urls.get_session;
        var jsonData = { name: userFind["id"]};
        requestmethod.requestPost(syncGatewayUrl + bucketName + subUrl, jsonData, callback);
      } else {
        var error = new Error("user id not found, ask administrator check the query view");
        callback(error);
      }
    },
    //处理用户session
    function (sessionRes, callback) {
      if (typeof sessionRes === "string") {
        sessionRes = JSON.stringify(sessionRes);
      }

      if (!sessionRes || (sessionRes["error"])) {
        var error = new Error("get user session failed");
        callback(error);
      } else {
        callback(null, sessionRes);
      }
    }
  ],function (err, results) {
    if (err) {
      logger.error(err);
      res.status(200).json({error: err.toString()});
    } else {
      res.status(200).json(results);
    }
    return;
  });
});

module.exports = router;
