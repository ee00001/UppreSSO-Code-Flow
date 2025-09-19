// hashToCurve.js
// 适用于 secp256k1
window.hashToCurve = hashToCurve;

const EC = window.EC;
const ec = window.ec;

const L_BYTES = 48n;
const COORD_BYTES = 32;

const P_BI = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F");
const A_BI = BigInt("0x3f8731abdd661adca08a5558f0f5d272e953d363cb6f0e5d405447c01a444533");
const B_BI = 1771n;
const Z_BI = -11n; // RFC 推荐
const C1 = (P_BI - 3n) / 4n;

// 同源曲线参数 E': y^2 = x^3 + A'*x + B'
const P_PRIME = new BN('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F', 16); // 替换为实际 P
const A_PRIME = new BN('3f8731abdd661adca08a5558f0f5d272e953d363cb6f0e5d405447c01a444533', 16);
const B_PRIME = new BN('1771', 16);

// 创建曲线对象
const CURVE_EPRIME = new elliptic.curve.short({
	p: P_PRIME,
	a: A_PRIME,
	b: B_PRIME,
	g: [null, null], // 生成器点可先留空
	n: null,         // 阶可留空
	hash: null
});

// --- 3-isogeny 常数 RFC 9380 (Appendix E.1)
const K1 = [
	BigInt("0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa8c7"),
	BigInt("0x7d3d4c80bc321d5b9f315cea7fd44c5d595d2fc0bf63b92dfff1044f17c6581"),
	BigInt("0x534c328d23f234e6e2a413deca25caece4506144037c40314ecbd0b53d9dd262"),
	BigInt("0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa88c"),
];
const K2 = [
	BigInt("0xd35771193d94918a9ca34ccbb7b640dd86cd409542f8487d9fe6b745781eb49b"),
	BigInt("0xedadc6f64383dc1df7c4b2d51b54225406d36b641f5e41bbc52a56612a8c6d14")
];
const K3 = [
	BigInt("0x4bda12f684bda12f684bda12f684bda12f684bda12f684bda12f684b8e38e23c"),
	BigInt("0xc75e0c32d5cb7c0fa9d0a54b12a0a6d5647ab046d686da6fdffc90fc201d71a3"),
	BigInt("0x29a6194691f91a73715209ef6512e576722830a201be2018a765e85a9ecee931"),
	BigInt("0x2f684bda12f684bda12f684bda12f684bda12f684bda12f684bda12f38e38d84")
];
const K4 = [
	BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffff93b"),
	BigInt("0x7a06534bb8bdb49fd5e9e6632722c2989467c1bfc8e8d978dfb425d2685c2573"),
	BigInt("0x6484aa716545ca2cf3a70c3fa8fe337e0a3d21162f0d6299a7bf8192bfd2a76f")
];

// ------------------ 工具函数 ------------------
function fe(c, xBI) {
	const xBN = new BN(xBI.toString()).umod(c.p);
	if (!c._red) c._red = BN.red(c.p);
	return xBN.toRed(c._red);
}

function powFE(c, feVal, eBI) {
	const feRed = feVal.fromRed().umod(c.p).toRed(c._red);
	let result = new BN(1).toRed(c._red);
	let base = feRed;
	let exp = eBI;

	while (exp > 0n) {
		if (exp % 2n === 1n) result = result.redMul(base);
		base = base.redMul(base);
		exp /= 2n;
	}
	return result;
}

function sqrtFE(c, feVal) {
	const x = feVal.fromRed();
	const sqrtBN = x.toRed(c._red).redPow((c.p.addn(1)).divn(4));

	return sqrtBN;
}

function sgn0(fe) {
	// 转普通 BN
	const feBN = fe.fromRed();
	return feBN.testn(0) ? 1 : 0;
}


class SqrtRatioResult {
	constructor(isSquare, y) {
		this.isSquare = isSquare;
		this.y = y; // 红域对象
	}
}

function sqrt_ratio_3mod4(c, u, v) {
	if (!c._red) c._red = BN.red(c.p);
	// 1. c2 = sqrt(-Z mod p)
	const minusZ_BI = (P_BI - (Z_BI % P_BI) + P_BI) % P_BI;
	const minusZ_FE = fe(CURVE_EPRIME, minusZ_BI);
	const c2 = sqrtFE(CURVE_EPRIME, minusZ_FE);     // sqrt(-Z mod p)

	// 2. tv1 = u * v^3
	const tv1 = v.redSqr().redMul(v.redMul(u)); // v^2 * (u*v) = u*v^3
	const tv2 = u.redMul(v); // u*v

	// 3. y1 = tv1^C1 * tv2
	const y1 = powFE(c, tv1, C1).redMul(tv2);

	// 4. y2 = y1 * c2
	const y2 = y1.redMul(c2);

	// 5. tv3 = y1^2 * v
	const tv3 = y1.redSqr().redMul(v);

	// 6. isQR 判断
	const isQR = tv3.fromRed().eq(u.fromRed());

	const y = isQR ? y1 : y2;

	return new SqrtRatioResult(isQR, y.redMul(new BN(1).toRed(c._red)));
}

function toBigIntegerString(bn) {
	if (bn.red) {
		return bn.fromRed().toString(10);
	} else {
		return bn.toString(10);
	}
}

// ------------------ SWU 映射到 E' ------------------
function mapToCurveSSWU_Eprime(uBI) {
	// Step 0: 常量域元素
	const A = fe(CURVE_EPRIME, A_BI);
	const B = fe(CURVE_EPRIME, B_BI);
	const Z = fe(CURVE_EPRIME, Z_BI);

	// 输入 u
	const u = fe(CURVE_EPRIME, uBI);

	// Step 1: tv1 = Z * u^2
	let tv1 = u.redSqr().redMul(Z);

	// Step 2: tv2 = tv1^2
	let tv2 = tv1.redSqr();

	// Step 3: x1 = tv1 + tv2
	let x1 = tv1.redAdd(tv2);

	// Step 4: x1 = inv0(x1)
	let x1Inv;
	if (x1.isZero()) {
		x1Inv = Z.redInvm(); // inv0 定义
	} else {
		x1Inv = x1.redInvm();
	}

	let x2;
	// Step 5
	if (!x1Inv.isZero()) {
		// x2 = -B / A * (1 + x1Inv)
		x2 = B.redNeg().redMul(x1Inv.redAdd(fe(CURVE_EPRIME, 1n))).redMul(A.redInvm());
	} else {
		// x2 = B / (Z * A)
		x2 = B.redMul(Z.redInvm()).redMul(A.redInvm());
	}

	// Step 6: x3 = Z * u^2 * x2
	let x3 = tv1.redMul(x2);

	// Step 7: gx1 = x2^3 + A*x2 + B
	let gx1 = x2.redSqr().redMul(x2).redAdd(A.redMul(x2)).redAdd(B);

	// Step 8: gx2 = x3^3 + A*x3 + B
	let gx2 = x3.redSqr().redMul(x3).redAdd(A.redMul(x3)).redAdd(B);

	// Step 9: (isSquare, y1) = sqrt_ratio(gx1, 1)
	const sqrtRes = sqrt_ratio_3mod4(CURVE_EPRIME, gx1, fe(CURVE_EPRIME, 1n));

	let x, y;
	if (sqrtRes.isSquare) {
		x = x2;
		y = sqrtRes.y;
	} else {
		const sqrtRes2 = sqrt_ratio_3mod4(CURVE_EPRIME, gx2, fe(CURVE_EPRIME, 1n));
		x = x3;
		y = sqrtRes2.y;
	}

	// Step 11: Fix sign of y
	if (sgn0(u) !== sgn0(y)) {
		y = y.redNeg();
	}
	// 返回曲线点
	return CURVE_EPRIME.point(x.fromRed(), y.fromRed());
}

// ------------------ 3-isogeny 映射 ------------------
function isoMap(qPrime) {
	if (!qPrime || qPrime.x === null || qPrime.y === null) return ec.curve.point(null, null);

	const xP = new BN(toBigIntegerString(qPrime.x)).umod(ec.curve.p);
	const yP = new BN(toBigIntegerString(qPrime.y)).umod(ec.curve.p);

	// 常量
	const k13 = new BN(toBigIntegerString(K1[3])).umod(ec.curve.p);
	const k12 = new BN(toBigIntegerString(K1[2])).umod(ec.curve.p);
	const k11 = new BN(toBigIntegerString(K1[1])).umod(ec.curve.p);
	const k10 = new BN(toBigIntegerString(K1[0])).umod(ec.curve.p);

	const k21 = new BN(toBigIntegerString(K2[1])).umod(ec.curve.p);
	const k20 = new BN(toBigIntegerString(K2[0])).umod(ec.curve.p);

	const k33 = new BN(toBigIntegerString(K3[3])).umod(ec.curve.p);
	const k32 = new BN(toBigIntegerString(K3[2])).umod(ec.curve.p);
	const k31 = new BN(toBigIntegerString(K3[1])).umod(ec.curve.p);
	const k30 = new BN(toBigIntegerString(K3[0])).umod(ec.curve.p);

	const k42 = new BN(toBigIntegerString(K4[2])).umod(ec.curve.p);
	const k41 = new BN(toBigIntegerString(K4[1])).umod(ec.curve.p);
	const k40 = new BN(toBigIntegerString(K4[0])).umod(ec.curve.p);

	// 幂次
	const x2 = xP.mul(xP).umod(ec.curve.p);
	const x3 = x2.mul(xP).umod(ec.curve.p);

	// 分子/分母
	const xNum = k13.mul(x3).add(k12.mul(x2)).add(k11.mul(xP)).add(k10).umod(ec.curve.p);
	const xDen = x2.add(k21.mul(xP)).add(k20).umod(ec.curve.p);
	const yNum = k33.mul(x3).add(k32.mul(x2)).add(k31.mul(xP)).add(k30).umod(ec.curve.p);
	const yDen = x3.add(k42.mul(x2)).add(k41.mul(xP)).add(k40).umod(ec.curve.p);

	// 特殊情况
	if (xDen.isZero() || yDen.isZero()) return ec.curve.point(null, null);

	// 映射
	const xMapped = xNum.mul(xDen.invm(ec.curve.p)).umod(ec.curve.p);
	const yDenInv = yDen.invm(ec.curve.p);
	const yMapped = yP.mul(yNum).mul(yDenInv).umod(ec.curve.p);

	return ec.curve.point(xMapped, yMapped);
}

function concatBytes(...arrays) {
	let totalLen = 0;
	for (const a of arrays) totalLen += a.length;
	const out = new Uint8Array(totalLen);
	let off = 0;
	for (const a of arrays) { out.set(a, off); off += a.length; }
	return out;
}

function i2osp(val, len) {
	// val 是 Number（在本场景 len == 2），返回 Uint8Array 大端表示
	const out = new Uint8Array(len);
	for (let i = len - 1; i >= 0; i--) {
		out[i] = val & 0xff;
		val = val >>> 8;
	}
	return out;
}

function xorBytes(a, b) {
	// a 和 b 均为 Uint8Array，长度相同
	const out = new Uint8Array(a.length);
	for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
	return out;
}

async function sha256Uint8(bytes) {
	// bytes: Uint8Array
	const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
	return new Uint8Array(hashBuffer);
}

// --- expandMessageXMD ---
async function expandMessageXMD(msgBytes, dstBytes, len) {
	const b_in_bytes = 32;
	const ell = Math.ceil(len / b_in_bytes);
	if (ell > 255) throw new Error('expand_message_xmd: ell > 255');

	// DST' = DST || len(DST) as single byte
	const dstPrime = new Uint8Array(dstBytes.length + 1);
	dstPrime.set(dstBytes, 0);
	dstPrime[dstBytes.length] = dstBytes.length & 0xff;

	const Z_pad = new Uint8Array(64); // zero-filled
	const lenBytes = i2osp(len, 2);

	// msgPrime = Z_pad || msg || lenBytes || 0x00 || DST'
	const msgPrime = concatBytes(Z_pad, msgBytes, lenBytes, new Uint8Array([0x00]), dstPrime);

	// b0 = H(msgPrime)
	const b0 = await sha256Uint8(msgPrime);

	// b1 = H(b0 || 0x01 || DST')
	let bi = await sha256Uint8(concatBytes(b0, new Uint8Array([0x01]), dstPrime));

	const out = new Uint8Array(len);
	// copy b1 first
	out.set(bi.subarray(0, Math.min(b_in_bytes, len)), 0);

	let prev = bi; // b(i-1)
	for (let i = 2; i <= ell; i++) {
		// tmp = b0 XOR prev
		const tmp = xorBytes(b0, prev);
		// bi = H(tmp || i || DST')
		const bi_i = await sha256Uint8(concatBytes(tmp, new Uint8Array([i & 0xff]), dstPrime));
		const copyLen = Math.min(b_in_bytes, len - (i - 1) * b_in_bytes);
		out.set(bi_i.subarray(0, copyLen), (i - 1) * b_in_bytes);
		prev = bi_i;
	}
	return out;
}

function bytesToBigIntModP(bytes, p) {
	// 转换成 BigInt
	let hex = Array.from(bytes)
		.map(b => b.toString(16).padStart(2, "0"))
		.join("");
	let bi = BigInt("0x" + hex);

	return bi % p;
}

// --- hash-to-curve 主函数
async function hashToCurve(msgBytes, dstBytes) {
	const L = Number(L_BYTES);
	const uniform = await expandMessageXMD(msgBytes, dstBytes, 2 * L);


	const u0 = BigInt(bytesToBigIntModP(uniform.slice(0, L), P_BI));
	const u1 = BigInt(bytesToBigIntModP(uniform.slice(L, 2 * L), P_BI));

	const Q0prime = mapToCurveSSWU_Eprime(u0);
	const Q1prime = mapToCurveSSWU_Eprime(u1);

	const Q0 = isoMap(Q0prime);
	const Q1 = isoMap(Q1prime);

	const Point = Q0.add(Q1);

	if (ec.curve.validate(Point)) {
		console.log("P 在 secp256k1 曲线上");
	} else {
		console.warn("P 不在曲线上");
	}

	return Point;
}

