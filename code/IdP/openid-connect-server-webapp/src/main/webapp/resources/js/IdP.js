
var EC = elliptic.ec;
let IdPDomain = "http://localhost:8080/openid-connect-server-webapp";
var ec = new EC('secp256k1');
var pKeyHex = "04de679e99a22c3f3f5e43379654f03e615fb8f532a88e3bf90bd7d4abc84ef7938eae1c96e011fb6fa9fc1018ce46cf1c461d06769bfc746aaa69ce09f98b055d";
let cert = getCert();
sessionStorage.setItem("cert", cert);
let certPayload;
let t;

//checkAuthentication();
doAuthorize();


function stringToBytes(str) {
  let bytes = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}

function bytesToHexString(bytes) {
  return bytes.map(function(byte) {
    let hex = byte.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}


function getCert (){
	let fragment = window.location.hash.substring(1);
	if (fragment) {
		let [name, value] = fragment.split('=');
		if (name === 'cert') {
			let CertTup = value.split('.')
			let header = CertTup[0]
			let payload = CertTup[1]
			let sig = CertTup[2]
			if (header==null||payload==null||sig==null){
				alert("Invalid cert format, retry.");
				return null;
			}
			var msgHash = stringToBytes(header + "." + payload);
			var key = ec.keyFromPublic(pKeyHex, 'hex');
			var verify = key.verify(msgHash, sig);
			if (!verify){
				alert("Cert verification failed, retry.");
				return null;
			}
			return value;
		} else {
			alert("No cert provided, retry.");
			return null;
		}
    } else {
		alert("No cert provided, retry.");
		return null;
    }
}

function initXML(){
	if (window.XMLHttpRequest)
	{
		//  IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
		return new XMLHttpRequest();
	}
	else
	{
		// IE6, IE5 浏览器执行代码
		return ActiveXObject("Microsoft.XMLHTTP");
	}
}

//function checkAuthentication() {
//	$.ajax({
//		url : 'isAuthenticated',
//		// dataType : 'json',
//		complete : function(xhr){
//			if(xhr.status == 200 ){
//				let data = JSON.parse(xhr.responseText);
//				if (data.authenticated == "true") {
//					alert("You are already authenticated.");
//				} else {
//					document.getElementById("login").style = "";
//				}
//			}
//		},
//		success : function(result){
//
//		}
//
//	});
//}

//function logFuc(){
//	let username = document.getElementById("username").value;
//	let password = document.getElementById("password").value;
//	let _csrf = document.getElementById("_csrf").value;
//	let registrationUrl = IdPDomain + "/login"
//	let xmlhttp = initXML()
//	xmlhttp.onreadystatechange = function () {
//		if (xmlhttp.readyState == 3 && xmlhttp.status == 200) {
//			let redirection = xmlhttp.responseURL
//			if (redirection.endsWith("failure")){
//				alert("Login failed. Please check your username and password.");
//			}else {
//				doAuthorize()
//			}
//		} else {
//			if (xmlhttp.readyState == 4 && xmlhttp.status != 200) {
//				alert("An error occurred during login. Please try again.");
//			}
//		}
//	}
//	let body = "username=" + username + "&password=" + password + "&_csrf="+ _csrf + "&submit=Login"
//	xmlhttp.open("POST", registrationUrl, true);
//	xmlhttp.setRequestHeader("Upgrade-Insecure-Requests", "1")
//	xmlhttp.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9")
//	xmlhttp.setRequestHeader("Cache-Control", "max-age=0")
//	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
//	xmlhttp.send(body);
//}

function doAuthorize() {
	let PID = generatePID();
	let redirect_uri = IdPDomain + '/post_token'
	let auth_uri = IdPDomain + '/authorize?client_id=' + PID + '&redirect_uri=' + redirect_uri + '&response_type=token&scope=openid%20email';
	location.href = auth_uri;
//	$.ajax({
//		url : 'authorize?client_id=' + PID + '&redirect_uri='+redirect_uri+'&response_type=token&scope=openid%20email',
//		// dataType : 'json',
//		complete : function(xhr){
//			if((xhr.status >= 300 && xhr.status < 400) && xhr.status != 304){
//				//重定向网址在响应头中，取出再执行跳转
//				let redirectUrl = xhr.getResponseHeader('X-Redirect');
//				location.href = redirectUrl;
//			}
//		},
//		success : function(result){
//			let origin = certPayload.redirect_uri;
//			let message = {"t": t, "token": result}
//			window.opener.postMessage(JSON.stringify(message), origin)
//		}
//
//	});
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

function generatePID() {
	var key = ec.genKeyPair();
	t = key.getPrivate().toString();

	sessionStorage.setItem("t", t);

	let CertTup = cert.split('.');
	let payload = base64urlDecode(CertTup[1]);
	let payloadObj = JSON.parse(payload);
	certPayload = payloadObj;

	let ID_RP = ec.keyFromPublic(payloadObj.RP_ID, 'hex').getPublic();
	let PID = ID_RP.mul(key.getPrivate());
	return PID.encode('hex');
}













