let IdPDomain = "http://localhost:8080/openid-connect-server-webapp";
const pKeyHex = "04de679e99a22c3f3f5e43379654f03e615fb8f532a88e3bf90bd7d4abc84ef7938eae1c96e011fb6fa9fc1018ce46cf1c461d06769bfc746aaa69ce09f98b055d";

let USE_CODE_FLOW = false;
let state = null;
let challenge = null;
let rtStart = null;

const PKCE_challenge_supported = ['S256'];

let cert = getCert();
if(cert){
	sessionStorage.setItem("cert", cert);
}

let redirect_url = getRedirectURL()
if(redirect_url){
	sessionStorage.setItem("redirect_url", redirect_url);
}

let t = sessionStorage.getItem("t") || getTFromUrl();
if (!t) {
	alert("缺少盲因子 t");
	throw new Error("Missing t");
}
if (t) {
	sessionStorage.setItem("t", t);
}

(async () => {
if (window.location.pathname.includes('/post_token') ||
	window.location.pathname.includes('/post_code')) {
	// 由对应脚本处理
} else {


	const fragment = window.location.hash.substring(1);
	const params = new URLSearchParams(fragment);
	const flow = params.get("flow");

	const delta1Str = params.get("rt_start");
	rtStart = delta1Str ? parseInt(delta1Str, 10) : null;

	if (flow === 'code') {
		USE_CODE_FLOW = true;
		state = params.get('state');
		challenge = params.get('code_challenge');
		method = params.get('code_challenge_method');

		if (!state) {
			alert('授权码模式缺少 state');
			throw new Error('Missing state');
		}
		if(!challenge) {
			alert('授权码模式缺少 pkce challenge');
			throw new Error('Missing pkce challenge');
		}
		if(!method) {
			alert('PKCE：缺少 pkce_challenge_method');
			throw new Error('Missing pkce_challenge_method');
		}
		if(!PKCE_challenge_supported.includes(method)) {
			alert(`PKCE：不支持的 challenge_method → ${method}`);
			throw new Error('Unsupported pkce_challenge_method: ' + method);
		}
		sessionStorage.setItem('code_challenge', challenge);
		sessionStorage.setItem('code_challenge_method', method);
	}

	await doAuthorize();
}
})();

function stringToBytes(str) {
  let bytes = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
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

	if (!fragment) return null;

	const params = new URLSearchParams(fragment);
	const certParam = params.get('cert');

	if (!certParam) return null;


	const [header, payload, sigDer] = certParam.split('.');
	if (!header || !payload || !sigDer) {
		alert("Invalid cert format, retry.");
		return null;
	}

	const { r, s } = derToRs128(sigDer);

	const msgHash = stringToBytes(header + '.' + payload);
	const key = ec.keyFromPublic(pKeyHex, 'hex');
	if (!key.verify(msgHash, { r, s })) {
		alert("Cert verification failed, retry.");
		return null;
	}
	return certParam;
}

function getRedirectURL() {
	const params = new URLSearchParams(window.location.hash.substring(1));
	return params.get('redirect_url');
}

function getTFromUrl() {
	const params = new URLSearchParams(window.location.hash.substring(1));
	return params.get('t');
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

async function generatePID() {
	if (!t) {
		alert("No blind factor t provided.");
		throw new Error("Missing t");
	}

	if (cert) {
		const CertTup = cert.split('.');
		const payload = base64urlDecode(CertTup[1]);
		const payloadObj = JSON.parse(payload);
		certPayload = payloadObj;

		const ID_RP = ec.keyFromPublic(payloadObj.RP_ID, 'hex').getPublic();

		if (ec.curve.validate(ID_RP)) {
			console.log("ID_RP 在 secp256k1 曲线上");
		} else {
			console.log("ID_RP 不在曲线上");
		}

		const key = ec.keyFromPrivate(t, 'hex');
		const PID = ID_RP.mul(key.getPrivate());

		if (ec.curve.validate(PID)) {
			console.log("PID 在 secp256k1 曲线上");
		} else {
			console.log("PID 不在曲线上");
		}
		return PID.encode('hex');
	}

	if (redirect_url) {
		console.log("redirect_url =", redirect_url)

		const msgBytes = new TextEncoder().encode(redirect_url);
		const dstBytes = new TextEncoder().encode("QUUX-V01-CS02-with-secp256k1_XMD:SHA-256_SSWU_RO_");

		// Hash-to-Curve
		const point = await hashToCurve(msgBytes, dstBytes);

		// 与 Cert 模式统一格式
		const pointHex = point.encode('hex', false);
		const ID_RP = ec.keyFromPublic(pointHex, 'hex').getPublic();

		if (ec.curve.validate(ID_RP)) {
			console.log("ID_RP 在 secp256k1 曲线上");
		} else {
			console.log("ID_RP 不在曲线上");
		}

		// 用盲因子 t 做标量乘法
		const key = ec.keyFromPrivate(t, 'hex');
		const PID = ID_RP.mul(key.getPrivate());

		if (ec.curve.validate(PID)) {
			console.log("PID 在 secp256k1 曲线上");
		} else {
			console.warn("PID 不在曲线上");
		}

		return PID.encode('hex');
	}

	throw new Error("Neither cert nor redirect_url provided.");
}



async function doAuthorize() {
	const PID = await generatePID();
	const base = IdPDomain

	if(USE_CODE_FLOW){
		//授权码流,带 challenge & method
		const codeUrl = `${base}/authorize?` +
			`client_id=${PID}&` +
			`redirect_uri=${encodeURIComponent(IdPDomain + '/post_code')}&` +
			`response_type=code&` +
			`scope=openid%20email&` +
			`state=${state}`+
			`&code_challenge=${encodeURIComponent(challenge)}` +
			`&code_challenge_method=${method}`;

		if (rtStart) {
			const endPerf = Date.now();
			const deltaMs = endPerf -  rtStart;

			const metricPayload = {
				flow: "code",
				ms: deltaMs,
				ts: endPerf
			};
			const data = JSON.stringify(metricPayload);

			try {
				const url = "http://localhost:8090/time/request";
				if (navigator.sendBeacon) {
					const blob = new Blob([data], { type: 'application/json' });
					navigator.sendBeacon(url, blob);
				} else {
					fetch(url, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: data,
						keepalive: true
					}).catch(() => {});
				}
			} catch (e) {
				console && console.warn && console.warn("client metric send failed", e);
			}
		}

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



