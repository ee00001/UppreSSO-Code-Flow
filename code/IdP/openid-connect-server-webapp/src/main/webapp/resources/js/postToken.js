let t = sessionStorage.getItem("t");
let cert = sessionStorage.getItem("cert");

if (!t || !cert) {
	alert("登录过程出错，请重新登录。");
} else {
	let CertTup = cert.split('.');
	let payload = base64urlDecode(CertTup[1]);
	let payloadObj = JSON.parse(payload);
	let certPayload = payloadObj;
	let origin = certPayload.redirect_uri;
	//解析url中的所有参数，生成josn
	let urlParams = new URLSearchParams(window.location.hash.substring(1));
	let id_token = urlParams.get('id_token');
	if (!id_token) {
		alert("登录过程出错，请重新登录。");
	} else{
		let message = {"t": t, "token": id_token}
		window.opener.postMessage(JSON.stringify(message), origin)
	}
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}
