/**
 * Created by garychen on 11/17/15.
 */
var express = require('express');
var logger = require('../utils/logger');
var config = require('../config');
var async = require('async');
var requestmethod = require('../lib/httprequest/requestmethod');
var dbmanager = require('../lib/db/dbmanager');
var viewmanager = require('../lib/views/viewmanager');
var viewconfig = require('../lib/views/viewsconfig');
var generator = require('../utils/generator');
var constant = require('../lib/constant/constant');
var objUtil = require('../utils/objectutil');

var router = express.Router();

/**
 * 上传xps解析内容
 */
router.post('/content_upload', function (req, res) {
  //获取http header里的session_id, record_type
  var sessionId = req.headers["session_id"];
  var recordType = req.body["record_type"];
  var recordObj = req.body;
  if (!sessionId || !recordType || !recordObj) {
    logger.error("need session_id, record_type and record");
    res.status(400).json({error: "need session_id, record_type and record"});
    return;
  }

  recordType = generator.getRecordType(recordType);

  var sync_gateway_url = config.urls.sync_gateway;
  var bucketName = config.buckets.couchbase_server;
  var couchbase_cluster = config.urls.couchbase_cluster;
  //处理传过来的record, 生成patient信息
  var patientName = recordObj["patient_name"];
  var patientGender = recordObj["gender"];
  var patientAge = recordObj["age"];
  var imageBaseUrl = recordObj["imgBaseUrl"];
  if (!patientName || !patientGender || !patientAge || !imageBaseUrl) {
    logger.error("need patient name, gender, age, imageBaseUrl");
    res.status(400).json({error: "need patient name, gender, age, imageBaseUrl"});
    return;
  }

  //医生的id
  var userId;
  var bucket;
  //对应病人的关键字，用来查找当前医生下是否有该病人
  var patientKey = patientName + "_" + patientGender + "_" + patientAge;
  var patientId;

  async.waterfall([
    //根据session_id查询用户信息
    function (callback) {
      var url = sync_gateway_url + bucketName + "/_session/" + sessionId;
      requestmethod.requestGet(url,callback);
    },
    //校验用户信息,获取用户id
    function (userInfo, callback) {
      userInfo = (typeof userInfo) === "string" ? JSON.parse(userInfo) : userInfo;
      if(userInfo.error) {
        var error = new Error("can not find user");
        callback(error);
      } else {
        userId = userInfo["userCtx"]["name"];
        callback();
      }
    },
    //获取bucket连接
    function (callback) {
      dbmanager.openBucket(couchbase_cluster, bucketName, callback)
    },
    //查找是否有对应的patient(病人)
    function (openBucket, callback) {
      bucket = openBucket;
      var designDocName = viewconfig.patient.designdocumentName;
      var designViewName = viewconfig.patient.designdocumentViews.patient_by_name_gender_age.name;
      viewmanager.QueryView(bucket, designDocName, designViewName, [patientKey,userId], 1, 1, callback);
    },
    //获取查询patient的query结果
    function (viewResult, callback) {
      if (viewResult.length !== 0) {
        patientId = viewResult[0]["id"];
        callback();
      } else {
        var patient = {
          name: patientName,
          age: patientAge,
          gender: patientGender,
          type: "Patient",
          user: userId
        };
        //新增patient
        requestmethod.requestPost(sync_gateway_url + bucketName + "/", patient, function(err, result) {
          if (err) {
            callback(err);
          } else {
            result = (typeof result === "string") ? JSON.parse(result) : result;
            patientId = result["id"];
            callback();
          }
        });
      }
    },
    //插入添加记录
    function (callback) {
      var recordNew = {
        type: "Record",
        recordType: recordType,
        status: constant.RECORD_STATUS.COMPLETED,
        patient: patientId,
        user: userId,
        info: recordObj
      };
      //recordNew， 取得所有"img"属性
      var imagList = [];
      objUtil.getPropertyIndex(recordNew, "img", "", imagList, imageBaseUrl);
      recordNew["need_process_imgs"] = imagList;
      requestmethod.requestPost(sync_gateway_url + bucketName + "/", recordNew, callback);
    }
  ], function (err, result) {
    if (err) {
      logger.error(err);
      res.status(200).json({error: err.toString()});
    } else {
      res.status(200).json({success: "add record successfully"});
    }
    return;
  });
});

/**
 * 展示xps内容中图片
 */
router.get('/get_record_image', function (req, res) {
  async.waterfall([
    //获取bucket连接
    function(callback) {
      var clusterUrl = config.urls.couchbase_cluster;
      var bucketName = config.buckets.couchbase_server;
      dbmanager.openBucket(clusterUrl,bucketName, callback);
    },
    //查询view获得图片地址
    function (openBucket, callback) {
      var designDocName = viewconfig.record.designdocumentName;
      var designViewName = viewconfig.record.designdocumentViews.record_imgs.name;
      viewmanager.QueryView(openBucket, designDocName, designViewName, null, 1, 1, callback);
    }
  ], function (err, result) {
    if (err) {
      res.render('error', {
        message: err.toString(),
        error: {
          status: 500,
          stack: err.stack
        }
      });
    } else {
      if (result.length === 0) {
        res.render('noitem', {
          message: "暂无待处理图片。",
          error: {
            status: 404,
            stack: "waiting for someone upload some record"
          }
        });
      } else {
        logger.info(result);
        res.render('record/record_img_process', result[0]);
      }
    }
    return;
  });
});

/**
 * 提交xps图片内容
 */
router.post('/img_content', function (req, res) {
  var imgContent = req.body;
  if (!imgContent.recordId || !imgContent.indexOf || !imgContent.imgContent) {
    res.status(400).json({error: "please input image content."});
    return;
  }

  //记录id
  var recordId = imgContent.recordId;
  //图片"img"在记录中存在的位置
  var imgIndex = imgContent.indexOf;
  //人工识别的图片内容
  var imgContent = imgContent.imgContent;

  var syncGatewayUrl = config.urls.sync_gateway;
  var bucketName = config.buckets.couchbase_server;

  async.waterfall([
    //获取记录
    function (callback) {
      requestmethod.requestGet(syncGatewayUrl + bucketName + "/" + recordId, callback);
    },
    //获取到的记录内容, 判断是否为空
    function (recordObj, callback) {
      recordObj = (typeof recordObj === "string") ? JSON.parse(recordObj) : recordObj;
      if (!recordObj.error) {
        callback(null, recordObj);
      } else {
        var err = new Error(recordObj.error);
        callback(err);
      }
    },
    //处理recordObj
    function (recordObj, callback) {
      var rev = recordObj["_rev"];
      //无待处理的图片
      if (recordObj["need_process_imgs"] === undefined) {
        var error = new Error("记录已被他人提交");
        callback(error);
      }
      //取到key数组
      var indexArr = imgIndex.split(":");
      //移除最后一个"img"元素
      indexArr.pop();
      //"content"元素，包含图片及内容的节点
      indexArr.push("content");
      //替换图片内容
      var objRef = recordObj;
      var len = indexArr.length;
      for(var i = 0; i < len-1; i++) {
        var elem = indexArr[i];
        if( !objRef[elem] ) {
          return;
        }
        objRef = objRef[elem];
      }
      var imgVal = objRef["img"];
      var re = new RegExp(imgVal, "i");
      objRef[indexArr[len-1]] = (objRef[indexArr[len-1]]).replace(re,imgContent);

      //移除object中原来的图片标记
      for(var i = 0; i < recordObj["need_process_imgs"].length; i++) {
        if (recordObj["need_process_imgs"][i]["indexOf"] === imgIndex) {
          recordObj["need_process_imgs"].splice(i, 1);
        }
      }
      //如果当前记录无需处理的图片，删除图片标记
      if (recordObj["need_process_imgs"].length === 0) {
        delete recordObj["need_process_imgs"];
      }
      //删除原有记录_id, _rev
      delete recordObj["_id"];
      delete recordObj["_rev"];
      //将changed设为true,触发sync_gateway记录编辑时回调，备份上一版本，保证forward出去的看不到更新
      //recordObj["changed"] = true;
      //更新原纪录
      var putUrl = syncGatewayUrl + bucketName + "/" + recordId + "?rev=" + rev;
      requestmethod.requestPut(putUrl, recordObj, callback);
    }
  ],function (err, result) {
    if (err) {
      res.status(500).json({error: err});
    } else {
      res.status(200).json({success: "upload success"});
    }
    return;
  })
});

module.exports = router;
