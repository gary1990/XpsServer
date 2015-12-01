/**
 * Created by garychen on 11/16/15.
 */
module.exports = {
	"user": {
		"designdocumentName":"user",
		"designdocumentViews":{
			"user_by_userid_password": {
				"name":"user_by_userid_password",
				"needUpdate":true,
				"oldViewname":"user_by_userid_password",
				"mapfunc":{
					map: function (doc, meta) {
						if (doc.type === "User" && doc._sync) {
							emit(meta.id, doc.password);
						}
					}
				}
			}
		}
	},
	"patient": {
		"designdocumentName":"patient",
		"designdocumentViews":{
			"patient_by_name_gender_age": {
				"name": "patient_by_name_gender_age",
				"needUpdate": true,
				"oldViewname": "patient_by_name_gender_age",
				"mapfunc": {
					map: function (doc, meta) {
						if (doc.type === "Patient" && doc._sync) {
							var patientName = doc["name"];
							var patientGender = doc["gender"];
							var patientAge = doc["age"];
							if (patientName && patientGender && patientAge) {
								emit([patientName + "_" + patientGender + "_" + patientAge, doc["user"]], meta.id);
							}
						}
					}
				}
			}
		}
	},
	"record": {
		"designdocumentName":"record",
		"designdocumentViews": {
			"record_imgs": {
				"name": "record_imgs",
				"needUpdate": true,
				"oldViewname": "record_imgs",
				"mapfunc": {
					map: function (doc, meta) {
						if (doc.type === "Record" && doc._sync) {
							var needProcessImgs = doc["need_process_imgs"];
							if (needProcessImgs) {
								for(var i = 0; i < needProcessImgs.length; i++) {
									emit(needProcessImgs[i]["indexOf"], needProcessImgs[i]["value"]);
								}
							}
						}
					}
				}
			}
		}
	}
};