/**
 * Created by garychen on 11/17/15.
 */
function ObjectUtil(){
}

ObjectUtil.prototype.getPropertyIndex = function (obj, propertyName, index, indexArr, prefix) {
	var indexOf = index === "" ? "" : index;
	var currIndexArr = indexArr === undefined ? [] : indexArr;
	for(var key in obj) {
		var currentIndex = indexOf === "" ? key : (indexOf + ":" + key);
		if ((typeof obj[key]) === "object") {
			this.getPropertyIndex(obj[key], propertyName, currentIndex, currIndexArr, prefix);
		} else {
			if ((key === propertyName) && ((obj[key]).trim())) {
				var imageObj = {indexOf: currentIndex, value: (prefix + obj[key])};
				currIndexArr.push(imageObj);
			}
		}
	}
}

ObjectUtil.prototype.setProperty = function (obj, pathArr, value) {
	if (!obj || !pathArr || !value) {
		return;
	}
	var objRef = obj;
	var len = pathArr.length;
	for(var i = 0; i < len-1; i++) {
		var elem = pathArr[i];
		if( !objRef[elem] ) {
			return;
		}
		objRef = objRef[elem];
	}
	objRef[pathArr[len-1]] = value;
}

module.exports = new ObjectUtil();