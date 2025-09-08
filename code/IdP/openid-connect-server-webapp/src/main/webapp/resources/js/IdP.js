
var EC = elliptic.ec;
let IdPDomain = "http://localhost:8080/openid-connect-server-webapp";
var ec = new EC('secp256k1');
var pKeyHex = "04de679e99a22c3f3f5e43379654f03e615fb8f532a88e3bf90bd7d4abc84ef7938eae1c96e011fb6fa9fc1018ce46cf1c461d06769bfc746aaa69ce09f98b055d";

let USE_CODE_FLOW = false;
let state = null;

let cert = getCert();
if(cert){
	sessionStorage.setItem("cert", cert);
}

let t = sessionStorage.getItem("t") || getTFromUrl();
if (!t) {
	alert("缺少盲因子 t");
	throw new Error("Missing t");
}
if (t) {
	sessionStorage.setItem("t", t);
}

if (window.location.pathname.includes('/post_token') ||
	window.location.pathname.includes('/post_code')) {
	// 由对应脚本处理
} else {
	const fragment = window.location.hash.substring(1);
	const params = new URLSearchParams(fragment);
	const flow = params.get("flow");


	if (flow === 'code') {
		USE_CODE_FLOW = true;
		state = params.get('state');
		if (!state) {
			alert('授权码模式缺少 state');
			throw new Error('Missing state');
		}
		sessionStorage.setItem('oauth_state', state);
	}

	doAuthorize();
}

function stringToBytes(str) {
  let bytes = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}



function bytesToHexString(bytes) {
	return Array.from(bytes).map(function(byte) {
		let hex = byte.toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	}).join('');
}

function pad(arr) {
	const buf = new Uint8Array(32);
	// 如果 arr 长度超过 32，截取后 32 字节
	// 如果 arr 长度小于 32，前面补零
	const len = Math.min(arr.length, 32);
	buf.set(arr.subarray(-len), 32 - len);
	return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

function derToRs128(hexStr) {
	const bytes = new Uint8Array(hexStr.match(/.{2}/g).map(b => parseInt(b, 16)));
	let pos = 0;

	// 解析序列
	if (bytes[pos] !== 0x30) throw new Error('Invalid DER: Expected sequence');
	pos++;

	// 跳过序列长度
	if (bytes[pos] === 0x81) {
		pos += 2;
	} else if (bytes[pos] === 0x82) {
		pos += 3;
	} else {
		pos++;
	}

	// 提取 r
	if (bytes[pos] !== 0x02) throw new Error('Invalid DER: Expected integer for r');
	pos++;
	const rLen = bytes[pos];
	pos++;
	const r = bytes.subarray(pos, pos + rLen);
	pos += rLen;

	// 提取 s
	if (bytes[pos] !== 0x02) throw new Error('Invalid DER: Expected integer for s');
	pos++;
	const sLen = bytes[pos];
	pos++;
	const s = bytes.subarray(pos, pos + sLen);

	// 确保 r 和 s 都是 32 字节
	const pad = (arr) => {
		const buf = new Uint8Array(32);
		buf.set(arr.subarray(-32));
		return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
	};

	return { r: pad(r), s: pad(s) };
}

function getCert() {
	const fragment = window.location.hash.substring(1);
	// console.log('fragment =', fragment);

	if (!fragment) return null;

	const params = new URLSearchParams(fragment);
	const certParam = params.get('cert');


	const [header, payload, sigDer] = certParam.split('.');
	if (!header || !payload || !sigDer) {
		alert("Invalid cert format, retry.");
		return null;
	}

	const { r, s } = derToRs128(sigDer);

	// console.log('Decoded header:', base64urlDecode(header));
	// console.log('Decoded payload:', base64urlDecode(payload));
	// console.log('Decoded signature:', base64urlDecode(sigDer));
	// console.log('r value:', bytesToHexString(r));
	// console.log('s value:', bytesToHexString(s));

	const msgHash = stringToBytes(header + '.' + payload);
	const key = ec.keyFromPublic(pKeyHex, 'hex');
	if (!key.verify(msgHash, { r, s })) {
		alert("Cert verification failed, retry.");
		return null;
	}
	return certParam;
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



function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

function generatePID() {
	if (!t) {
		alert("No blind factor t provided.");
		throw new Error("Missing t");
	}

	const CertTup = cert.split('.');
	const payload = base64urlDecode(CertTup[1]);
	const payloadObj = JSON.parse(payload);
	certPayload = payloadObj;

	const ID_RP = ec.keyFromPublic(payloadObj.RP_ID, 'hex').getPublic();
	const key = ec.keyFromPrivate(t, 'hex');
	const PID = ID_RP.mul(key.getPrivate());
	return PID.encode('hex');
}

function getTFromUrl() {
	const params = new URLSearchParams(window.location.hash.substring(1));
	return params.get('t');
}

function doAuthorize() {
	const PID = generatePID();
	const base = IdPDomain

	if(USE_CODE_FLOW){
		//授权码流,修改为302重定向，端点需要对应修改
		const codeUrl = `${base}/authorize?` +
			`client_id=${PID}&` +
			`redirect_uri=${encodeURIComponent(IdPDomain + '/post_code')}&` +
			`response_type=code&` +
			`scope=openid%20email&` +
			`state=${state}`;

		location.href = codeUrl;
	}else{
		//隐式流,通过 302 重定向
		const implicitUrl = `${base}/authorize?` +
			`client_id=${PID}&` +
			`redirect_uri=${encodeURIComponent(IdPDomain + '/post_token')}&` +
			`response_type=token&` +
			`scope=openid%20email`;

		location.href = implicitUrl;
	}
}












