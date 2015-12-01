var express = require('express');
var router = express.Router();
var request = require('request');
var async = require('async');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get("/test", function(req, res) {
  //var kk;
  //Fiber(function () {
  //  kk = get("http://localhost:4985/test/doctor_135859230522");
  //  console.dir(kk);
  //}).run();
  //console.dir(kk);
  //Fiber(function() {
  //  var m = get("http://localhost:4985/test/doctor_135859230522");
  //  console.dir(m);
  //  if (m === null || m.error) {
  //    res.status(200).json(m);
  //    return;
  //  }
  //  var ss = get("http://localhost:4985/test/doctor_13585923052");
  //  if (ss === null || ss.error) {
  //    res.status(200).json(ss);
  //    return;
  //  }
  //  res.status(200).json({success: ""});
  //}).run();
});


//
//function get(url) {
//  var result;
//  var fiber = Fiber.current;
//  request({
//    url: url,
//    method: "GET"
//  }, function (err, response, body) {
//    if (typeof body === "string") {
//      body = JSON.parse(body);
//    }
//    result = body;
//    fiber.run();
//  });
//  Fiber.yield();
//  return result;
//}

module.exports = router;
