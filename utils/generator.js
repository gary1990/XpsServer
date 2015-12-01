/**
 * Created by garychen on 11/16/15.
 */
var Generator = function () {
}

/**
 * 根据用户名和用户类型生成用户id(不是couchbase用，是couchbase里userprofile的id)
 * @param phoneNumber
 * @param userRole
 * @returns {string}
 */
Generator.prototype.generateUserId = function (phoneNumber, userRole) {
	var roleName;
	switch (userRole) {
		case 0:
			roleName = "doctor";
			break;
		case 1:
			roleName = "patient";
			break;
		default:
			roleName = "doctor";
			break;
	}
	return roleName + "_" + phoneNumber;
};

/**
 * patient的channel
 * @param patientId
 * @returns {string}
 */
Generator.prototype.getPatientChannelById = function(patientId) {
	return "patients-" + patientId;
};

/**
 * 根据UserProfile的id，取得couchbase user的channel
 * @param ufId
 */
Generator.prototype.getCBUserChannelByUFid = function(ufId) {
	return "user_" + ufId;
}

Generator.prototype.getRecordType = function (typeNumber) {
	var recordType;
	switch (typeNumber) {
		case "出院记录":
			recordType = "出院";
			break;
		case "入院记录":
			recordType = "入院";
			break;
		case "化验记录":
			recordType = "化验";
			break;
		default:
			recordType = "图片";
			break;
	}
	return recordType;
}

module.exports = new Generator();