let p = "18111848663142005571178770624881214696591339256823507023544605891411707081617152319519180201250440615163700426054396403795303435564101919053459832890139496933938670005799610981765220283775567361483662648340339405220348871308593627647076689407931875483406244310337925809427432681864623551598136302441690546585427193224254314088256212718983105131138772434658820375111735710449331518776858786793875865418124429269409118756812841019074631004956409706877081612616347900606555802111224022921017725537417047242635829949739109274666495826205002104010355456981211025738812433088757102520562459649777989718122219159982614304359";
let q = "19689526866605154788513693571065914024068069442724893395618704484701"
let g = "3"
let Domain = "http://192.168.0.190:8080/openid-connect-server-webapp"
let state = "start"
let pubKey = ""
let Cert, Y_RP, N_U,  ID_RP, N_RP, PID_RP, redirect_uri, payload
function doAuthorize() {
	$.ajax({
		url : 'authorize?client_id=' + PID_RP + '&redirect_uri=' + redirect_uri + '&response_type=token&scope=openid%20email',
		// dataType : 'json',
		complete : function(xhr){
			if((xhr.status >= 300 && xhr.status < 400) && xhr.status != 304){
				//重定向网址在响应头中，取出再执行跳转
				let redirectUrl = xhr.getResponseHeader('X-Redirect');
				location.href = redirectUrl;
			}
		},
		success : function(result){
			let origin = "http://192.168.0.190:8090/"
			let message = {"Type": "Token", "Token": result}
			window.opener.postMessage(JSON.stringify(message), origin)
		}

	});
}


function logFuc(){
	let username = document.getElementById("username").value;
	let password = document.getElementById("password").value;
	let _csrf = document.getElementById("_csrf").value;
	let registrationUrl = Domain + "/login"
	let xmlhttp = initXML()
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 3 && xmlhttp.status == 200) {
			let redirection = xmlhttp.responseURL
			if (redirection.endsWith("failure")){

			}else {
				doAuthorize()
			}
		} else {

		}
	}
	let body = "username=" + username + "&password=" + password + "&_csrf="+ _csrf + "&submit=Login"
	xmlhttp.open("POST", registrationUrl, true);
	xmlhttp.setRequestHeader("Upgrade-Insecure-Requests", "1")
	xmlhttp.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9")
	xmlhttp.setRequestHeader("Cache-Control", "max-age=0")
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
	xmlhttp.send(body);
}
var pKey = KEYUTIL.getKey("-----BEGIN PUBLIC KEY-----\n" +
	"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnzyis1ZjfNB0bBgKFMSv\n" +
	"vkTtwlvBsaJq7S5wA+kzeVOVpVWwkWdVha4s38XM/pa/yr47av7+z3VTmvDRyAHc\n" +
	"aT92whREFpLv9cj5lTeJSibyr/Mrm/YtjCZVWgaOYIhwrXwKLqPr/11inWsAkfIy\n" +
	"tvHWTxZYEcXLgAXFuUuaS3uF9gEiNQwzGTU1v0FqkqTBr4B8nW3HCN47XUu0t8Y0\n" +
	"e+lf4s4OxQawWD79J9/5d3Ry0vbV3Am1FtGJiJvOwRsIfVChDpYStTcHTCMqtvWb\n" +
	"V6L11BWkpzGXSW4Hv43qa+GSYOD2QU68Mb59oSk2OB+BtOLpJofmbGEGgvmwyCI9\n" +
	"MwIDAQAB\n" +
	"-----END PUBLIC KEY-----")

var sKey = 	KEYUTIL.getKey("-----BEGIN RSA PRIVATE KEY-----\n" +
	"MIIEogIBAAKCAQEAnzyis1ZjfNB0bBgKFMSvvkTtwlvBsaJq7S5wA+kzeVOVpVWw\n" +
	"kWdVha4s38XM/pa/yr47av7+z3VTmvDRyAHcaT92whREFpLv9cj5lTeJSibyr/Mr\n" +
	"m/YtjCZVWgaOYIhwrXwKLqPr/11inWsAkfIytvHWTxZYEcXLgAXFuUuaS3uF9gEi\n" +
	"NQwzGTU1v0FqkqTBr4B8nW3HCN47XUu0t8Y0e+lf4s4OxQawWD79J9/5d3Ry0vbV\n" +
	"3Am1FtGJiJvOwRsIfVChDpYStTcHTCMqtvWbV6L11BWkpzGXSW4Hv43qa+GSYOD2\n" +
	"QU68Mb59oSk2OB+BtOLpJofmbGEGgvmwyCI9MwIDAQABAoIBACiARq2wkltjtcjs\n" +
	"kFvZ7w1JAORHbEufEO1Eu27zOIlqbgyAcAl7q+/1bip4Z/x1IVES84/yTaM8p0go\n" +
	"amMhvgry/mS8vNi1BN2SAZEnb/7xSxbflb70bX9RHLJqKnp5GZe2jexw+wyXlwaM\n" +
	"+bclUCrh9e1ltH7IvUrRrQnFJfh+is1fRon9Co9Li0GwoN0x0byrrngU8Ak3Y6D9\n" +
	"D8GjQA4Elm94ST3izJv8iCOLSDBmzsPsXfcCUZfmTfZ5DbUDMbMxRnSo3nQeoKGC\n" +
	"0Lj9FkWcfmLcpGlSXTO+Ww1L7EGq+PT3NtRae1FZPwjddQ1/4V905kyQFLamAA5Y\n" +
	"lSpE2wkCgYEAy1OPLQcZt4NQnQzPz2SBJqQN2P5u3vXl+zNVKP8w4eBv0vWuJJF+\n" +
	"hkGNnSxXQrTkvDOIUddSKOzHHgSg4nY6K02ecyT0PPm/UZvtRpWrnBjcEVtHEJNp\n" +
	"bU9pLD5iZ0J9sbzPU/LxPmuAP2Bs8JmTn6aFRspFrP7W0s1Nmk2jsm0CgYEAyH0X\n" +
	"+jpoqxj4efZfkUrg5GbSEhf+dZglf0tTOA5bVg8IYwtmNk/pniLG/zI7c+GlTc9B\n" +
	"BwfMr59EzBq/eFMI7+LgXaVUsM/sS4Ry+yeK6SJx/otIMWtDfqxsLD8CPMCRvecC\n" +
	"2Pip4uSgrl0MOebl9XKp57GoaUWRWRHqwV4Y6h8CgYAZhI4mh4qZtnhKjY4TKDjx\n" +
	"QYufXSdLAi9v3FxmvchDwOgn4L+PRVdMwDNms2bsL0m5uPn104EzM6w1vzz1zwKz\n" +
	"5pTpPI0OjgWN13Tq8+PKvm/4Ga2MjgOgPWQkslulO/oMcXbPwWC3hcRdr9tcQtn9\n" +
	"Imf9n2spL/6EDFId+Hp/7QKBgAqlWdiXsWckdE1Fn91/NGHsc8syKvjjk1onDcw0\n" +
	"NvVi5vcba9oGdElJX3e9mxqUKMrw7msJJv1MX8LWyMQC5L6YNYHDfbPF1q5L4i8j\n" +
	"8mRex97UVokJQRRA452V2vCO6S5ETgpnad36de3MUxHgCOX3qL382Qx9/THVmbma\n" +
	"3YfRAoGAUxL/Eu5yvMK8SAt/dJK6FedngcM3JEFNplmtLYVLWhkIlNRGDwkg3I5K\n" +
	"y18Ae9n7dHVueyslrb6weq7dTkYDi3iOYRW8HRkIQh06wEdbxt0shTzAJvvCQfrB\n" +
	"jg/3747WSsf/zBTcHihTRBdAv6OmdhV4/dD5YBfLAkLrd+mX7iE=\n" +
	"-----END RSA PRIVATE KEY----");

function verify(mes, key){
	return true
}
function generateModPow(x, y, z){
	let xbn = nbi();
	let ybn = nbi();
	let zbn = nbi();
	xbn.fromString(x);
	ybn.fromString(y);
	zbn.fromString(z);
	return xbn.modPow(ybn, zbn).toString();
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
function doRequestToken (data){
	let registrationUrl = Domain + "/isAuthenticated"
	let xmlhttp = initXML()
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			let date
			try {
				data = JSON.parse(xmlhttp.responseText)
				if (data.Result == "OK"){
					doAuthorize()
				}
			} catch(e) {
				document.getElementById("login").style = ""
			}
		} else {

		}
	}
	xmlhttp.open("GET", registrationUrl, true);
	xmlhttp.send();

}
function doRegistration() {
	let registrationUrl = Domain + "/register"
	let xmlhttp = initXML()
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 201) {
			let data = JSON.parse(xmlhttp.responseText)
			let content = JSON.parse(atob(data.Content))
			if (content.Result == "OK"){
				state = "expectRequest"
				let RegistrationResult = {"Type": "RegistrationResult", "RegistrationResult": xmlhttp.responseText}
				window.opener.postMessage(JSON.stringify(RegistrationResult), '*');
			}
		} else {

		}
	}
	xmlhttp.open("POST", registrationUrl, true);
	let sha256 = new KJUR.crypto.MessageDigest({"alg": "sha256", "prov": "cryptojs"})
	sha256.updateString(N_U)
	let sha256Str = sha256.digest()
	redirect_uri = Domain + "1/" + sha256Str
	let body = {"client_id": PID_RP, "application_type": "web", "client_name": "M_OIDC", "redirect_uris":redirect_uri, "grant_types": "implicit", "response_types": ["id_token"]}
	xmlhttp.send(JSON.stringify(body));
}


function onReceiveMessage(event){
	const message = JSON.parse(event.data)
	let messageType = message.Type
	switch (messageType) {
		case "Cert":
			if (state != "expectCert")
				break
			Cert = message.Cert
			if (Cert==null)//||Y_RP==null)
				break
			let CertTup = Cert.split('\.')
			let header = CertTup[0]
			let payload = CertTup[1]
			let sig = CertTup[2]
			if (header==null||payload==null||sig==null)
				break
			let signatureVf=new KJUR.crypto.Signature({"alg":"SHA256withRSA", "prvkeypem": pKey});
			signatureVf.updateString(header + "." + payload);
			let verify = signatureVf.verify(b64tohex(sig));
			if (!verify)
				break
			ID_RP = "2859278237642201956931085611015389087970918161297522023542900348087718063098423976428252369340967506010054236052095950169272612831491902295835660747775572934757474194739347115870723217560530672532404847508798651915566434553729839971841903983916294692452760249019857108409189016993380919900231322610083060784269299257074905043636029708121288037909739559605347853174853410208334242027740275688698461842637641566056165699733710043802697192696426360843173620679214131951400148855611740858610821913573088059404459364892373027492936037789337011875710759208498486908611261954026964574111219599568903257472567764789616958430"
			PID_RP = generateModPow(ID_RP, N_U, p);
			doRegistration()
			break
		case "Request":
			if(state != "expectRequest")
				break
			let data = message.Content
			if (PID_RP != data.client_id) {
				state = "stop"
				break
			}
			doRequestToken(data)
			break
	}
}
N_U = bigInt.randBetween("0", q).toString();
window.addEventListener('message', onReceiveMessage);
let Ready = {'Type':'N_U', 'N_U': N_U}
state = "expectCert"
window.opener.postMessage(JSON.stringify(Ready), '*');











