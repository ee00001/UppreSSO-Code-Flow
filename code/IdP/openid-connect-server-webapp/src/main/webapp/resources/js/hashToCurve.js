// hashToCurve.js
window.hashToCurve = hashToCurve;

const L_BYTES = 48;
const P = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F");
const A = 0n;
const B = 7n;
const Z = -11n; // RFC 推荐

async function sha256(msgBytes) {
	const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(msgBytes));
	return new Uint8Array(hashBuffer);
}

function bytesToHex(bytes) {
	return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
}

// --- RFC 9380 expand_message_xmd (SHA256)
async function expandMessageXMD(msgBytes, dstBytes, len) {
	const b_in_bytes = 32;
	const ell = Math.ceil(len / b_in_bytes);
	if(ell > 255) throw new Error('ell too large');

	const Z_pad = new Uint8Array(b_in_bytes).fill(0);
	const lenBytes = new Uint8Array([ (len >> 8) & 0xff, len & 0xff ]);

	const msgPrime = new Uint8Array([...Z_pad, ...msgBytes, ...lenBytes, 0, ...dstBytes]);
	const b0 = await sha256(msgPrime);

	let bVals = [];
	let bi = await sha256(new Uint8Array([...b0, 1, ...dstBytes]));
	bVals.push(bi);

	for(let i=2; i<=ell; i++){
		const tmp = b0.map((v, idx) => v ^ bi[idx]);
		bi = await sha256(new Uint8Array([...tmp, i, ...dstBytes]));
		bVals.push(bi);
	}

	const out = new Uint8Array(len);
	for(let i=0; i<ell; i++){
		const copyLen = Math.min(b_in_bytes, len - i * b_in_bytes);
		out.set(bVals[i].subarray(0, copyLen), i * b_in_bytes);
	}
	return out;
}

// --- 将 BigInt 转为 ECPoint
function mapToCurveSSWU(u) {
	const curve = ec.curve;
	const pField = P;

	const uFe = modP(u);

	const u2 = modP(uFe * uFe);
	const Zu2 = modP(Z * u2);
	let den = modP(Zu2 * modP(Z * u2 + 1n));

	let x, y;

	if(den === 0n){
		x = modP(B * modInv(A, P));
		y = modSqrt(modP(x**3n + A*x + B), P);
		if(y === null) throw new Error('exceptional QR fail');
		if((uFe & 1n) !== (y & 1n)) y = modP(P - y);
		return curve.point(x, y);
	}

	const tv1 = modP(modInv(den, P));
	const c1 = modP(B * modInv(A, P));

	let x1 =  modP(-c1 * modP(tv1 + 1n));
	let x2 = modP(Zu2 * x1);

	let gx1 = modP(x1**3n + A*x1 + B);
	let y1 = modSqrt(gx1, P);

	if(y1 !== null){
		x = x1; y = y1;
	} else {
		let gx2 = modP(x2**3n + A*x2 + B);
		let y2 = modSqrt(gx2, P);
		if(y2 === null) throw new Error('2nd candidate QR fail');
		x = x2; y = y2;
	}

	if((uFe & 1n) !== (y & 1n)) y = modP(P - y);
	return ec.curve.point(x, y);
}

// --- 模平方根 (p ≡ 3 mod 4)
function modSqrt(a, p) {
	a = ((a % p) + p) % p;
	if(a === 0n) return 0n;
	if(p % 4n === 3n) return modPow(a, (p+1n)/4n, p);
	return null;
}

// --- 逆元
function modInv(a, m) {
	let m0 = m, x0 = 0n, x1 = 1n;
	if(m === 1n) return 0n;
	while(a > 1n){
		const q = a / m;
		let t = m;
		m = a % m;
		a = t;
		t = x0;
		x0 = x1 - q * x0;
		x1 = t;
	}
	if(x1 < 0n) x1 += m0;
	return x1;
}

// --- 快速幂
function modPow(base, exp, mod) {
	let result = 1n;
	base = base % mod;
	while(exp > 0){
		if(exp % 2n === 1n) result = (result * base) % mod;
		base = (base * base) % mod;
		exp = exp / 2n;
	}
	return result;
}

function modP(a) {
	const res = a % P;
	return res >= 0n ? res : res + P;
}

// --- hash-to-curve 主函数
async function hashToCurve(msgBytes, dstBytes) {
	const uniform = await expandMessageXMD(msgBytes, dstBytes, 2 * L_BYTES);
	const u0 = BigInt('0x' + bytesToHex(uniform.subarray(0, L_BYTES)));
	const u1 = BigInt('0x' + bytesToHex(uniform.subarray(L_BYTES, 2*L_BYTES)));

	const Q0 = mapToCurveSSWU(u0);
	const Q1 = mapToCurveSSWU(u1);

	return Q0.add(Q1); // 返回 ECPoint
}
