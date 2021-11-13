var pk_server
var pk_client
var sk_server
var sk_client = "18132675304244965712574178412562805309170243883812490881917784690458958402323698579217816857353830219465484956086401123971050105259230905348762696582339851621052730383090904291677554770296911315349682713895520890219731589175200647346345831105747619551655143577179572599529561582865885572690251289011162420954226052042153277557731357053069202016573955703365041398760743450913168847106359725683590602427669161356058458907341119014350122900252386583280286190084183137387697138171356842139644337923577499939729680207824338479892809407161702924978351792490747835314168476603329546065079971347354203231234598124754683198606"
var hex_sk_client
var g
var result
var P = "32317006071311007300338913926423828248817941241140239112842009751400741706634354222619689417363569347117901737909704191754605873209195028853758986185622153212175412514901774520270235796078236248884246189477587641105928646099411723245426622522193230540919037680524235519125679715870117001058055877651038861847280257976054903569732561526167081339361799541336476559160368317896729073178384589680639671900977202194168647225871031411336429319536193471636533209717077448227988588565369208645296636077250268955505928362751121174096972998068410554359584866583291642136218231078990999448652468262416972035911852507045361090559"
var DHsKey = "18132675304244965712574178412562805309170243883812490881917784690458958402323698579217816857353830219465484956086401123971050105259230905348762696582339851621052730383090904291677554770296911315349682713895520890219731589175200647346345831105747619551655143577179572599529561582865885572690251289011162420954226052042153277557731357053069202016573955703365041398760743450913168847106359725683590602427669161356058458907341119014350122900252386583280286190084183137387697138171356842139644337923577499939729680207824338479892809407161702924978351792490747835314168476603329546065079971347354203231234598124754683198606"
var ID
var access_token
var basicUrl
var parameters
var basic_client_id
var client_id
var point1
var point2
var point3
var point4
var tokenStart;
var tokenEnd;

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
		//if(request.email == null)
		//	sendResponse(access_token);
		//else{
		//var userInfo = request.email + g
		//var hash = sha1.create();
		//hash.update(userInfo);
		var tokenUrl = basicUrl + "/authorization?" + parameters + "&ID=" + ID;
		sendResponse(tokenUrl)
		//}
    }
)

chrome.webRequest.onBeforeRequest.addListener (
 
    function(details) {
        //chrome.tabs.query({active:true},function(tab){
            // 当前页面的url
         //   var pageUrl = tab[0].url;
            // 在这可以写判断逻辑，将请求cancel掉，或者将请求打印出来
         //   alert(pageUrl)
        //});
		//chrome.tabs.getSelected(function(tab) {
		//	alert(tab.url)
		//});
		if(details.url.indexOf("http://oidc.localhost:8080/openid-connect-server-webapp/authorize")==0){
			doRequest(details.url)
			return {cancel: true};
		}
		else if(details.url.indexOf("http://oidcupload.12450.com/token")==0){
			var date = new Date();
			point4 = date.getTime();
			processToken(details.url);
			return {redirectUrl: "http://localhost:8080/openid-connect-server-webapp/userinfo"};
		}else if(details.url.indexOf("http://159.226.94.152")==0){
			return {redirectUrl: "http://10.10.81.148:9999" + details.url.substring(21)};
			//return {cancel: true};
		}
		else if(details.url.indexOf("http://159.226.94.153/Account/Login")==0){
			return {redirectUrl: "http://localhost:8080/token" + details.url.substring(35)};
			//return {cancel: true};
		}
    },
     
    {urls:["http://oidc.localhost:8080/openid-connect-server-webapp/authorize*", "http://oidcupload.12450.com/token*", "http://159.226.94.152/*", "http://159.226.94.153/Account/Login?id_token*"]},  //监听页面请求,你也可以通过*来匹配。
    ["blocking"] 
);

function processToken(url){
	access_token = url.substring(47,url.indexOf("&"))
	parameters = url.substring(url.indexOf("&") + 1)
	var tokenUrl = basicUrl + "/authorization?" + parameters + "&ID=" + ID;
	if (window.XMLHttpRequest)
	{
		//  IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
		xmlhttp=new XMLHttpRequest();
	}
	else
	{
		// IE6, IE5 浏览器执行代码
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			obj = JSON.parse(xmlhttp.responseText)
			if(obj.result=="ok")
				doEnd();
			else if(obj.result=="register")
				startLogin("http://localhost:8090/")
		}
	}
	xmlhttp.open("GET",tokenUrl,true);
	xmlhttp.send();
}

function doEnd(){
	var tokenUrl = basicUrl + "/end?time1=" + (point2 - point1) + "&time2=" + (point4 - point3); 
	if (window.XMLHttpRequest)
	{
		//  IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
		xmlhttp=new XMLHttpRequest();
	}
	else
	{
		// IE6, IE5 浏览器执行代码
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			//startLogin("http://localhost:8090/")
		}
	}
	xmlhttp.open("GET",tokenUrl,true);
	xmlhttp.send();
}


function doRequest(url){
	url = "http://" + url.substring(12)
	chrome.tabs.create({ url: url })
	var date = new Date();
	point3 = date.getTime();
}

function startLogin(url){
	basicUrl = url
	var loginUrl = url + "/login"
	var xmlhttp;
	if (window.XMLHttpRequest)
	{
		//  IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
		xmlhttp=new XMLHttpRequest();
	}
	else
	{
		// IE6, IE5 浏览器执行代码
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			obj = JSON.parse(xmlhttp.responseText)
			pk_server = obj.pk_server
			g = obj.g
			ID = obj.ID
			basic_client_id = obj.basic_client_id
			sk_client = bigInt.randBetween("0", P).toString();		
			var skbn = nbi();
			var pkbn = nbi();
			var gbn = nbi();
			var pbn = nbi();			
			skbn.fromString(sk_client);
			pkbn.fromString(pk_server);
			gbn.fromString(g);
			pbn.fromString(P);			
			result = pkbn.modPow(skbn, pbn);
			pk_client = gbn.modPow(skbn, pbn)
			
			
			let signatureVf = new KJUR.crypto.Signature({alg:"SHA256withRSA"});
			var key = new RSAKey()
			key = KEYUTIL.getKey("MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnzyis1ZjfNB0bBgKFMSvvkTtwlvBsaJq7S5wA+kzeVOVpVWwkWdVha4s38XM/pa/yr47av7+z3VTmvDRyAHcaT92whREFpLv9cj5lTeJSibyr/Mrm/YtjCZVWgaOYIhwrXwKLqPr/11inWsAkfIytvHWTxZYEcXLgAXFuUuaS3uF9gEiNQwzGTU1v0FqkqTBr4B8nW3HCN47XUu0t8Y0e+lf4s4OxQawWD79J9/5d3Ry0vbV3Am1FtGJiJvOwRsIfVChDpYStTcHTCMqtvWbV6L11BWkpzGXSW4Hv43qa+GSYOD2QU68Mb59oSk2OB+BtOLpJofmbGEGgvmwyCI9MwIDAQAB")
			signatureVf.init(key);
			signatureVf.update("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0")
			var verify = signatureVf.verify("POstGetfAytaZS82wHcjoTyoqhMyxXiWdR7Nn7A29DNSl0EiXLdwJ6xC6AfgZWF1bOsS_TuYI3OG85AmiExREkrS6tDfTQ2B3WXlrr-wp5AokiRbz3_oB4OxG-W9KcEEbDRcZc0nH3L7LzYptiy1PtAylQGxHTWZXtGz4ht0bAecBgmpdgXMguEIcoqPJ1n3pIWk_dUZegpqx0Lka21H6XxUTxiy8OcaarA8zdnPUnV6AmNP3ecFawIFYdvJB_cm-GvpCSbr8G8y_Mllj8f4x9nBH8pQux89_6gUY618iYv7tuPWBFfEbLxtF2pZS6YC1aSfLQxeNe8djT9YjpvRZA");
			alert(verify);
			
			
			uploadpk(url, result, pk_client)
			
			
			
			
			
			
			
			
			
			
			
		}
	}
	xmlhttp.open("GET",loginUrl,true);
	xmlhttp.send();
}

function uploadpk(url, result, pk){
	var uploadpkUrl = url + "/uploadPK"
	var xmlhttp;
	if (window.XMLHttpRequest)
	{
		//  IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
		xmlhttp=new XMLHttpRequest();
	}
	else
	{
		// IE6, IE5 浏览器执行代码
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			obj = JSON.parse(xmlhttp.responseText)
			client_id = obj.client_id
			var basic_client_idbn = nbi();
			basic_client_idbn.fromString(basic_client_id);
			var pbn = nbi();
			pbn.fromString(P);
			var localClient_id = basic_client_idbn.modPow(result, pbn);
			//bigInt(basic_client_id).modPow(result, P)
			//alert(localClient_id);
			//alert(client_id);
			var client_idbn = nbi();
			client_idbn.fromString(client_id);
			if(localClient_id.compareTo(client_idbn) == 0){
				doRegistration(url)
			}
		}
	}
	xmlhttp.open("POST",uploadpkUrl,true);
	var body = "{\"ID\":\"" + ID + "\",\"pk_client\":\"" + pk + "\", \"result\":\"" + result + "\"}"
	xmlhttp.send(body);
}

function doRegistration(url){
	var registrationUrl = "http://localhost:8080/openid-connect-server-webapp/register"
	var xmlhttp;
	var date = new Date();			
	var p1 = date.getTime();
	if (window.XMLHttpRequest)
	{
		//  IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
		xmlhttp=new XMLHttpRequest();
	}
	else
	{
		// IE6, IE5 浏览器执行代码
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==201)
		{
			var date = new Date();
			point2 = date.getTime();
			register_finished(xmlhttp.responseText, url)
		}
		else
		{
			
		}
	}
	xmlhttp.open("POST",registrationUrl,true);
	var body = "{\"client_id\":\"" + client_id + "\",\"application_type\":\"web\",\"client_name\":\"M_OIDC\",\"redirect_uris\":\"http://oidcupload.12450.com/token\", \"grant_types\": \"implicit\"}"// \"response_types\": [\"id_token\", \"token\"],
	var date = new Date();
	point1 = date.getTime();
	xmlhttp.send(body);
}

function register_finished(responseText, url){
	var register_finishedUrl = url + "/register_finished"
	var xmlhttp;
	if (window.XMLHttpRequest)
	{
		//  IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
		xmlhttp=new XMLHttpRequest();
	}
	else
	{
		// IE6, IE5 浏览器执行代码
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange=function()
	{
		//if (xmlhttp.readyState==4 && xmlhttp.status==201)
		//{
		//	register_finished(xmlhttp.responseText)
		//}
	}
	xmlhttp.open("POST",register_finishedUrl,true);
	var body = "{\"client_id\":\"" + client_id + "\",\"ID\":\"" +ID+ "\",\"redirect_uri\":\"http://oidcupload.12450.com/token\",\"resultOK\":\"true\"}"
	xmlhttp.send(body);
	var date = new Date();
	tokenStart = date.getTime();
}




























var bigInt = (function (undefined) {
    "use strict";

    var BASE = 1e7,
        LOG_BASE = 7,
        MAX_INT = 9007199254740992,
        MAX_INT_ARR = smallToArray(MAX_INT),
        LOG_MAX_INT = Math.log(MAX_INT);

    function Integer(v, radix) {
        if (typeof v === "undefined") return Integer[0];
        if (typeof radix !== "undefined") return +radix === 10 ? parseValue(v) : parseBase(v, radix);
        return parseValue(v);
    }

    function BigInteger(value, sign) {
        this.value = value;
        this.sign = sign;
        this.isSmall = false;
    }
    BigInteger.prototype = Object.create(Integer.prototype);

    function SmallInteger(value) {
        this.value = value;
        this.sign = value < 0;
        this.isSmall = true;
    }
    SmallInteger.prototype = Object.create(Integer.prototype);

    function isPrecise(n) {
        return -MAX_INT < n && n < MAX_INT;
    }

    function smallToArray(n) { // For performance reasons doesn't reference BASE, need to change this function if BASE changes
        if (n < 1e7)
            return [n];
        if (n < 1e14)
            return [n % 1e7, Math.floor(n / 1e7)];
        return [n % 1e7, Math.floor(n / 1e7) % 1e7, Math.floor(n / 1e14)];
    }

    function arrayToSmall(arr) { // If BASE changes this function may need to change
        trim(arr);
        var length = arr.length;
        if (length < 4 && compareAbs(arr, MAX_INT_ARR) < 0) {
            switch (length) {
                case 0: return 0;
                case 1: return arr[0];
                case 2: return arr[0] + arr[1] * BASE;
                default: return arr[0] + (arr[1] + arr[2] * BASE) * BASE;
            }
        }
        return arr;
    }

    function trim(v) {
        var i = v.length;
        while (v[--i] === 0);
        v.length = i + 1;
    }

    function createArray(length) { // function shamelessly stolen from Yaffle's library https://github.com/Yaffle/BigInteger
        var x = new Array(length);
        var i = -1;
        while (++i < length) {
            x[i] = 0;
        }
        return x;
    }

    function truncate(n) {
        if (n > 0) return Math.floor(n);
        return Math.ceil(n);
    }

    function add(a, b) { // assumes a and b are arrays with a.length >= b.length
        var l_a = a.length,
            l_b = b.length,
            r = new Array(l_a),
            carry = 0,
            base = BASE,
            sum, i;
        for (i = 0; i < l_b; i++) {
            sum = a[i] + b[i] + carry;
            carry = sum >= base ? 1 : 0;
            r[i] = sum - carry * base;
        }
        while (i < l_a) {
            sum = a[i] + carry;
            carry = sum === base ? 1 : 0;
            r[i++] = sum - carry * base;
        }
        if (carry > 0) r.push(carry);
        return r;
    }

    function addAny(a, b) {
        if (a.length >= b.length) return add(a, b);
        return add(b, a);
    }

    function addSmall(a, carry) { // assumes a is array, carry is number with 0 <= carry < MAX_INT
        var l = a.length,
            r = new Array(l),
            base = BASE,
            sum, i;
        for (i = 0; i < l; i++) {
            sum = a[i] - base + carry;
            carry = Math.floor(sum / base);
            r[i] = sum - carry * base;
            carry += 1;
        }
        while (carry > 0) {
            r[i++] = carry % base;
            carry = Math.floor(carry / base);
        }
        return r;
    }

    BigInteger.prototype.add = function (v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
            return this.subtract(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall) {
            return new BigInteger(addSmall(a, Math.abs(b)), this.sign);
        }
        return new BigInteger(addAny(a, b), this.sign);
    };
    BigInteger.prototype.plus = BigInteger.prototype.add;

    SmallInteger.prototype.add = function (v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
            return this.subtract(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
            if (isPrecise(a + b)) return new SmallInteger(a + b);
            b = smallToArray(Math.abs(b));
        }
        return new BigInteger(addSmall(b, Math.abs(a)), a < 0);
    };
    SmallInteger.prototype.plus = SmallInteger.prototype.add;

    function subtract(a, b) { // assumes a and b are arrays with a >= b
        var a_l = a.length,
            b_l = b.length,
            r = new Array(a_l),
            borrow = 0,
            base = BASE,
            i, difference;
        for (i = 0; i < b_l; i++) {
            difference = a[i] - borrow - b[i];
            if (difference < 0) {
                difference += base;
                borrow = 1;
            } else borrow = 0;
            r[i] = difference;
        }
        for (i = b_l; i < a_l; i++) {
            difference = a[i] - borrow;
            if (difference < 0) difference += base;
            else {
                r[i++] = difference;
                break;
            }
            r[i] = difference;
        }
        for (; i < a_l; i++) {
            r[i] = a[i];
        }
        trim(r);
        return r;
    }

    function subtractAny(a, b, sign) {
        var value;
        if (compareAbs(a, b) >= 0) {
            value = subtract(a, b);
        } else {
            value = subtract(b, a);
            sign = !sign;
        }
        value = arrayToSmall(value);
        if (typeof value === "number") {
            if (sign) value = -value;
            return new SmallInteger(value);
        }
        return new BigInteger(value, sign);
    }

    function subtractSmall(a, b, sign) { // assumes a is array, b is number with 0 <= b < MAX_INT
        var l = a.length,
            r = new Array(l),
            carry = -b,
            base = BASE,
            i, difference;
        for (i = 0; i < l; i++) {
            difference = a[i] + carry;
            carry = Math.floor(difference / base);
            difference %= base;
            r[i] = difference < 0 ? difference + base : difference;
        }
        r = arrayToSmall(r);
        if (typeof r === "number") {
            if (sign) r = -r;
            return new SmallInteger(r);
        } return new BigInteger(r, sign);
    }

    BigInteger.prototype.subtract = function (v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
            return this.add(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall)
            return subtractSmall(a, Math.abs(b), this.sign);
        return subtractAny(a, b, this.sign);
    };
    BigInteger.prototype.minus = BigInteger.prototype.subtract;

    SmallInteger.prototype.subtract = function (v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
            return this.add(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
            return new SmallInteger(a - b);
        }
        return subtractSmall(b, Math.abs(a), a >= 0);
    };
    SmallInteger.prototype.minus = SmallInteger.prototype.subtract;

    BigInteger.prototype.negate = function () {
        return new BigInteger(this.value, !this.sign);
    };
    SmallInteger.prototype.negate = function () {
        var sign = this.sign;
        var small = new SmallInteger(-this.value);
        small.sign = !sign;
        return small;
    };

    BigInteger.prototype.abs = function () {
        return new BigInteger(this.value, false);
    };
    SmallInteger.prototype.abs = function () {
        return new SmallInteger(Math.abs(this.value));
    };

    function multiplyLong(a, b) {
        var a_l = a.length,
            b_l = b.length,
            l = a_l + b_l,
            r = createArray(l),
            base = BASE,
            product, carry, i, a_i, b_j;
        for (i = 0; i < a_l; ++i) {
            a_i = a[i];
            for (var j = 0; j < b_l; ++j) {
                b_j = b[j];
                product = a_i * b_j + r[i + j];
                carry = Math.floor(product / base);
                r[i + j] = product - carry * base;
                r[i + j + 1] += carry;
            }
        }
        trim(r);
        return r;
    }

    function multiplySmall(a, b) { // assumes a is array, b is number with |b| < BASE
        var l = a.length,
            r = new Array(l),
            base = BASE,
            carry = 0,
            product, i;
        for (i = 0; i < l; i++) {
            product = a[i] * b + carry;
            carry = Math.floor(product / base);
            r[i] = product - carry * base;
        }
        while (carry > 0) {
            r[i++] = carry % base;
            carry = Math.floor(carry / base);
        }
        return r;
    }

    function shiftLeft(x, n) {
        var r = [];
        while (n-- > 0) r.push(0);
        return r.concat(x);
    }

    function multiplyKaratsuba(x, y) {
        var n = Math.max(x.length, y.length);

        if (n <= 30) return multiplyLong(x, y);
        n = Math.ceil(n / 2);

        var b = x.slice(n),
            a = x.slice(0, n),
            d = y.slice(n),
            c = y.slice(0, n);

        var ac = multiplyKaratsuba(a, c),
            bd = multiplyKaratsuba(b, d),
            abcd = multiplyKaratsuba(addAny(a, b), addAny(c, d));

        var product = addAny(addAny(ac, shiftLeft(subtract(subtract(abcd, ac), bd), n)), shiftLeft(bd, 2 * n));
        trim(product);
        return product;
    }

    // The following function is derived from a surface fit of a graph plotting the performance difference
    // between long multiplication and karatsuba multiplication versus the lengths of the two arrays.
    function useKaratsuba(l1, l2) {
        return -0.012 * l1 - 0.012 * l2 + 0.000015 * l1 * l2 > 0;
    }

    BigInteger.prototype.multiply = function (v) {
        var n = parseValue(v),
            a = this.value, b = n.value,
            sign = this.sign !== n.sign,
            abs;
        if (n.isSmall) {
            if (b === 0) return Integer[0];
            if (b === 1) return this;
            if (b === -1) return this.negate();
            abs = Math.abs(b);
            if (abs < BASE) {
                return new BigInteger(multiplySmall(a, abs), sign);
            }
            b = smallToArray(abs);
        }
        if (useKaratsuba(a.length, b.length)) // Karatsuba is only faster for certain array sizes
            return new BigInteger(multiplyKaratsuba(a, b), sign);
        return new BigInteger(multiplyLong(a, b), sign);
    };

    BigInteger.prototype.times = BigInteger.prototype.multiply;

    function multiplySmallAndArray(a, b, sign) { // a >= 0
        if (a < BASE) {
            return new BigInteger(multiplySmall(b, a), sign);
        }
        return new BigInteger(multiplyLong(b, smallToArray(a)), sign);
    }
    SmallInteger.prototype._multiplyBySmall = function (a) {
        if (isPrecise(a.value * this.value)) {
            return new SmallInteger(a.value * this.value);
        }
        return multiplySmallAndArray(Math.abs(a.value), smallToArray(Math.abs(this.value)), this.sign !== a.sign);
    };
    BigInteger.prototype._multiplyBySmall = function (a) {
        if (a.value === 0) return Integer[0];
        if (a.value === 1) return this;
        if (a.value === -1) return this.negate();
        return multiplySmallAndArray(Math.abs(a.value), this.value, this.sign !== a.sign);
    };
    SmallInteger.prototype.multiply = function (v) {
        return parseValue(v)._multiplyBySmall(this);
    };
    SmallInteger.prototype.times = SmallInteger.prototype.multiply;

    function square(a) {
        //console.assert(2 * BASE * BASE < MAX_INT);
        var l = a.length,
            r = createArray(l + l),
            base = BASE,
            product, carry, i, a_i, a_j;
        for (i = 0; i < l; i++) {
            a_i = a[i];
            carry = 0 - a_i * a_i;
            for (var j = i; j < l; j++) {
                a_j = a[j];
                product = 2 * (a_i * a_j) + r[i + j] + carry;
                carry = Math.floor(product / base);
                r[i + j] = product - carry * base;
            }
            r[i + l] = carry;
        }
        trim(r);
        return r;
    }

    BigInteger.prototype.square = function () {
        return new BigInteger(square(this.value), false);
    };

    SmallInteger.prototype.square = function () {
        var value = this.value * this.value;
        if (isPrecise(value)) return new SmallInteger(value);
        return new BigInteger(square(smallToArray(Math.abs(this.value))), false);
    };

    function divMod1(a, b) { // Left over from previous version. Performs faster than divMod2 on smaller input sizes.
        var a_l = a.length,
            b_l = b.length,
            base = BASE,
            result = createArray(b.length),
            divisorMostSignificantDigit = b[b_l - 1],
            // normalization
            lambda = Math.ceil(base / (2 * divisorMostSignificantDigit)),
            remainder = multiplySmall(a, lambda),
            divisor = multiplySmall(b, lambda),
            quotientDigit, shift, carry, borrow, i, l, q;
        if (remainder.length <= a_l) remainder.push(0);
        divisor.push(0);
        divisorMostSignificantDigit = divisor[b_l - 1];
        for (shift = a_l - b_l; shift >= 0; shift--) {
            quotientDigit = base - 1;
            if (remainder[shift + b_l] !== divisorMostSignificantDigit) {
                quotientDigit = Math.floor((remainder[shift + b_l] * base + remainder[shift + b_l - 1]) / divisorMostSignificantDigit);
            }
            // quotientDigit <= base - 1
            carry = 0;
            borrow = 0;
            l = divisor.length;
            for (i = 0; i < l; i++) {
                carry += quotientDigit * divisor[i];
                q = Math.floor(carry / base);
                borrow += remainder[shift + i] - (carry - q * base);
                carry = q;
                if (borrow < 0) {
                    remainder[shift + i] = borrow + base;
                    borrow = -1;
                } else {
                    remainder[shift + i] = borrow;
                    borrow = 0;
                }
            }
            while (borrow !== 0) {
                quotientDigit -= 1;
                carry = 0;
                for (i = 0; i < l; i++) {
                    carry += remainder[shift + i] - base + divisor[i];
                    if (carry < 0) {
                        remainder[shift + i] = carry + base;
                        carry = 0;
                    } else {
                        remainder[shift + i] = carry;
                        carry = 1;
                    }
                }
                borrow += carry;
            }
            result[shift] = quotientDigit;
        }
        // denormalization
        remainder = divModSmall(remainder, lambda)[0];
        return [arrayToSmall(result), arrayToSmall(remainder)];
    }

    function divMod2(a, b) { // Implementation idea shamelessly stolen from Silent Matt's library http://silentmatt.com/biginteger/
        // Performs faster than divMod1 on larger input sizes.
        var a_l = a.length,
            b_l = b.length,
            result = [],
            part = [],
            base = BASE,
            guess, xlen, highx, highy, check;
        while (a_l) {
            part.unshift(a[--a_l]);
            trim(part);
            if (compareAbs(part, b) < 0) {
                result.push(0);
                continue;
            }
            xlen = part.length;
            highx = part[xlen - 1] * base + part[xlen - 2];
            highy = b[b_l - 1] * base + b[b_l - 2];
            if (xlen > b_l) {
                highx = (highx + 1) * base;
            }
            guess = Math.ceil(highx / highy);
            do {
                check = multiplySmall(b, guess);
                if (compareAbs(check, part) <= 0) break;
                guess--;
            } while (guess);
            result.push(guess);
            part = subtract(part, check);
        }
        result.reverse();
        return [arrayToSmall(result), arrayToSmall(part)];
    }

    function divModSmall(value, lambda) {
        var length = value.length,
            quotient = createArray(length),
            base = BASE,
            i, q, remainder, divisor;
        remainder = 0;
        for (i = length - 1; i >= 0; --i) {
            divisor = remainder * base + value[i];
            q = truncate(divisor / lambda);
            remainder = divisor - q * lambda;
            quotient[i] = q | 0;
        }
        return [quotient, remainder | 0];
    }

    function divModAny(self, v) {
        var value, n = parseValue(v);
        var a = self.value, b = n.value;
        var quotient;
        if (b === 0) throw new Error("Cannot divide by zero");
        if (self.isSmall) {
            if (n.isSmall) {
                return [new SmallInteger(truncate(a / b)), new SmallInteger(a % b)];
            }
            return [Integer[0], self];
        }
        if (n.isSmall) {
            if (b === 1) return [self, Integer[0]];
            if (b == -1) return [self.negate(), Integer[0]];
            var abs = Math.abs(b);
            if (abs < BASE) {
                value = divModSmall(a, abs);
                quotient = arrayToSmall(value[0]);
                var remainder = value[1];
                if (self.sign) remainder = -remainder;
                if (typeof quotient === "number") {
                    if (self.sign !== n.sign) quotient = -quotient;
                    return [new SmallInteger(quotient), new SmallInteger(remainder)];
                }
                return [new BigInteger(quotient, self.sign !== n.sign), new SmallInteger(remainder)];
            }
            b = smallToArray(abs);
        }
        var comparison = compareAbs(a, b);
        if (comparison === -1) return [Integer[0], self];
        if (comparison === 0) return [Integer[self.sign === n.sign ? 1 : -1], Integer[0]];

        // divMod1 is faster on smaller input sizes
        if (a.length + b.length <= 200)
            value = divMod1(a, b);
        else value = divMod2(a, b);

        quotient = value[0];
        var qSign = self.sign !== n.sign,
            mod = value[1],
            mSign = self.sign;
        if (typeof quotient === "number") {
            if (qSign) quotient = -quotient;
            quotient = new SmallInteger(quotient);
        } else quotient = new BigInteger(quotient, qSign);
        if (typeof mod === "number") {
            if (mSign) mod = -mod;
            mod = new SmallInteger(mod);
        } else mod = new BigInteger(mod, mSign);
        return [quotient, mod];
    }

    BigInteger.prototype.divmod = function (v) {
        var result = divModAny(this, v);
        return {
            quotient: result[0],
            remainder: result[1]
        };
    };
    SmallInteger.prototype.divmod = BigInteger.prototype.divmod;

    BigInteger.prototype.divide = function (v) {
        return divModAny(this, v)[0];
    };
    SmallInteger.prototype.over = SmallInteger.prototype.divide = BigInteger.prototype.over = BigInteger.prototype.divide;

    BigInteger.prototype.mod = function (v) {
        return divModAny(this, v)[1];
    };
    SmallInteger.prototype.remainder = SmallInteger.prototype.mod = BigInteger.prototype.remainder = BigInteger.prototype.mod;

    BigInteger.prototype.pow = function (v) {
        var n = parseValue(v),
            a = this.value,
            b = n.value,
            value, x, y;
        if (b === 0) return Integer[1];
        if (a === 0) return Integer[0];
        if (a === 1) return Integer[1];
        if (a === -1) return n.isEven() ? Integer[1] : Integer[-1];
        if (n.sign) {
            return Integer[0];
        }
        if (!n.isSmall) throw new Error("The exponent " + n.toString() + " is too large.");
        if (this.isSmall) {
            if (isPrecise(value = Math.pow(a, b)))
                return new SmallInteger(truncate(value));
        }
        x = this;
        y = Integer[1];
        while (true) {
            if (b & 1 === 1) {
                y = y.times(x);
                --b;
            }
            if (b === 0) break;
            b /= 2;
            x = x.square();
        }
        return y;
    };
    SmallInteger.prototype.pow = BigInteger.prototype.pow;

    BigInteger.prototype.modPow = function (exp, mod) {
        exp = parseValue(exp);
        mod = parseValue(mod);
        if (mod.isZero()) throw new Error("Cannot take modPow with modulus 0");
        var r = Integer[1],
            base = this.mod(mod);
        while (exp.isPositive()) {
            if (base.isZero()) return Integer[0];
            if (exp.isOdd()) r = r.multiply(base).mod(mod);
            exp = exp.divide(2);
            base = base.square().mod(mod);
        }
        return r;
    };
    SmallInteger.prototype.modPow = BigInteger.prototype.modPow;

    function compareAbs(a, b) {
        if (a.length !== b.length) {
            return a.length > b.length ? 1 : -1;
        }
        for (var i = a.length - 1; i >= 0; i--) {
            if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
        }
        return 0;
    }

    BigInteger.prototype.compareAbs = function (v) {
        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (n.isSmall) return 1;
        return compareAbs(a, b);
    };
    SmallInteger.prototype.compareAbs = function (v) {
        var n = parseValue(v),
            a = Math.abs(this.value),
            b = n.value;
        if (n.isSmall) {
            b = Math.abs(b);
            return a === b ? 0 : a > b ? 1 : -1;
        }
        return -1;
    };

    BigInteger.prototype.compare = function (v) {
        // See discussion about comparison with Infinity:
        // https://github.com/peterolson/BigInteger.js/issues/61
        if (v === Infinity) {
            return -1;
        }
        if (v === -Infinity) {
            return 1;
        }

        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (this.sign !== n.sign) {
            return n.sign ? 1 : -1;
        }
        if (n.isSmall) {
            return this.sign ? -1 : 1;
        }
        return compareAbs(a, b) * (this.sign ? -1 : 1);
    };
    BigInteger.prototype.compareTo = BigInteger.prototype.compare;

    SmallInteger.prototype.compare = function (v) {
        if (v === Infinity) {
            return -1;
        }
        if (v === -Infinity) {
            return 1;
        }

        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (n.isSmall) {
            return a == b ? 0 : a > b ? 1 : -1;
        }
        if (a < 0 !== n.sign) {
            return a < 0 ? -1 : 1;
        }
        return a < 0 ? 1 : -1;
    };
    SmallInteger.prototype.compareTo = SmallInteger.prototype.compare;

    BigInteger.prototype.equals = function (v) {
        return this.compare(v) === 0;
    };
    SmallInteger.prototype.eq = SmallInteger.prototype.equals = BigInteger.prototype.eq = BigInteger.prototype.equals;

    BigInteger.prototype.notEquals = function (v) {
        return this.compare(v) !== 0;
    };
    SmallInteger.prototype.neq = SmallInteger.prototype.notEquals = BigInteger.prototype.neq = BigInteger.prototype.notEquals;

    BigInteger.prototype.greater = function (v) {
        return this.compare(v) > 0;
    };
    SmallInteger.prototype.gt = SmallInteger.prototype.greater = BigInteger.prototype.gt = BigInteger.prototype.greater;

    BigInteger.prototype.lesser = function (v) {
        return this.compare(v) < 0;
    };
    SmallInteger.prototype.lt = SmallInteger.prototype.lesser = BigInteger.prototype.lt = BigInteger.prototype.lesser;

    BigInteger.prototype.greaterOrEquals = function (v) {
        return this.compare(v) >= 0;
    };
    SmallInteger.prototype.geq = SmallInteger.prototype.greaterOrEquals = BigInteger.prototype.geq = BigInteger.prototype.greaterOrEquals;

    BigInteger.prototype.lesserOrEquals = function (v) {
        return this.compare(v) <= 0;
    };
    SmallInteger.prototype.leq = SmallInteger.prototype.lesserOrEquals = BigInteger.prototype.leq = BigInteger.prototype.lesserOrEquals;

    BigInteger.prototype.isEven = function () {
        return (this.value[0] & 1) === 0;
    };
    SmallInteger.prototype.isEven = function () {
        return (this.value & 1) === 0;
    };

    BigInteger.prototype.isOdd = function () {
        return (this.value[0] & 1) === 1;
    };
    SmallInteger.prototype.isOdd = function () {
        return (this.value & 1) === 1;
    };

    BigInteger.prototype.isPositive = function () {
        return !this.sign;
    };
    SmallInteger.prototype.isPositive = function () {
        return this.value > 0;
    };

    BigInteger.prototype.isNegative = function () {
        return this.sign;
    };
    SmallInteger.prototype.isNegative = function () {
        return this.value < 0;
    };

    BigInteger.prototype.isUnit = function () {
        return false;
    };
    SmallInteger.prototype.isUnit = function () {
        return Math.abs(this.value) === 1;
    };

    BigInteger.prototype.isZero = function () {
        return false;
    };
    SmallInteger.prototype.isZero = function () {
        return this.value === 0;
    };
    BigInteger.prototype.isDivisibleBy = function (v) {
        var n = parseValue(v);
        var value = n.value;
        if (value === 0) return false;
        if (value === 1) return true;
        if (value === 2) return this.isEven();
        return this.mod(n).equals(Integer[0]);
    };
    SmallInteger.prototype.isDivisibleBy = BigInteger.prototype.isDivisibleBy;

    function isBasicPrime(v) {
        var n = v.abs();
        if (n.isUnit()) return false;
        if (n.equals(2) || n.equals(3) || n.equals(5)) return true;
        if (n.isEven() || n.isDivisibleBy(3) || n.isDivisibleBy(5)) return false;
        if (n.lesser(49)) return true;
        // we don't know if it's prime: let the other functions figure it out
    }
    
    function millerRabinTest(n, a) {
        var nPrev = n.prev(),
            b = nPrev,
            r = 0,
            d, t, i, x;
        while (b.isEven()) b = b.divide(2), r++;
        next : for (i = 0; i < a.length; i++) {
            if (n.lesser(a[i])) continue;
            x = bigInt(a[i]).modPow(b, n);
            if (x.equals(Integer[1]) || x.equals(nPrev)) continue;
            for (d = r - 1; d != 0; d--) {
                x = x.square().mod(n);
                if (x.isUnit()) return false;    
                if (x.equals(nPrev)) continue next;
            }
            return false;
        }
        return true;
    }
    
// Set "strict" to true to force GRH-supported lower bound of 2*log(N)^2
    BigInteger.prototype.isPrime = function (strict) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined) return isPrime;
        var n = this.abs();
        var bits = n.bitLength();
        if(bits <= 64)
            return millerRabinTest(n, [2, 325, 9375, 28178, 450775, 9780504, 1795265022]);
        var logN = Math.log(2) * bits;
        var t = Math.ceil((strict === true) ? (2 * Math.pow(logN, 2)) : logN);
        for (var a = [], i = 0; i < t; i++) {
            a.push(bigInt(i + 2));
        }
        return millerRabinTest(n, a);
    };
    SmallInteger.prototype.isPrime = BigInteger.prototype.isPrime;

    BigInteger.prototype.isProbablePrime = function (iterations) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined) return isPrime;
        var n = this.abs();
        var t = iterations === undefined ? 5 : iterations;
        for (var a = [], i = 0; i < t; i++) {
            a.push(bigInt.randBetween(2, n.minus(2)));
        }
        return millerRabinTest(n, a);
    };
    SmallInteger.prototype.isProbablePrime = BigInteger.prototype.isProbablePrime;

    BigInteger.prototype.modInv = function (n) {
        var t = bigInt.zero, newT = bigInt.one, r = parseValue(n), newR = this.abs(), q, lastT, lastR;
        while (!newR.equals(bigInt.zero)) {
            q = r.divide(newR);
            lastT = t;
            lastR = r;
            t = newT;
            r = newR;
            newT = lastT.subtract(q.multiply(newT));
            newR = lastR.subtract(q.multiply(newR));
        }
        if (!r.equals(1)) throw new Error(this.toString() + " and " + n.toString() + " are not co-prime");
        if (t.compare(0) === -1) {
            t = t.add(n);
        }
        if (this.isNegative()) {
            return t.negate();
        }
        return t;
    };

    SmallInteger.prototype.modInv = BigInteger.prototype.modInv;

    BigInteger.prototype.next = function () {
        var value = this.value;
        if (this.sign) {
            return subtractSmall(value, 1, this.sign);
        }
        return new BigInteger(addSmall(value, 1), this.sign);
    };
    SmallInteger.prototype.next = function () {
        var value = this.value;
        if (value + 1 < MAX_INT) return new SmallInteger(value + 1);
        return new BigInteger(MAX_INT_ARR, false);
    };

    BigInteger.prototype.prev = function () {
        var value = this.value;
        if (this.sign) {
            return new BigInteger(addSmall(value, 1), true);
        }
        return subtractSmall(value, 1, this.sign);
    };
    SmallInteger.prototype.prev = function () {
        var value = this.value;
        if (value - 1 > -MAX_INT) return new SmallInteger(value - 1);
        return new BigInteger(MAX_INT_ARR, true);
    };

    var powersOfTwo = [1];
    while (2 * powersOfTwo[powersOfTwo.length - 1] <= BASE) powersOfTwo.push(2 * powersOfTwo[powersOfTwo.length - 1]);
    var powers2Length = powersOfTwo.length, highestPower2 = powersOfTwo[powers2Length - 1];

    function shift_isSmall(n) {
        return ((typeof n === "number" || typeof n === "string") && +Math.abs(n) <= BASE) ||
            (n instanceof BigInteger && n.value.length <= 1);
    }

    BigInteger.prototype.shiftLeft = function (n) {
        if (!shift_isSmall(n)) {
            throw new Error(String(n) + " is too large for shifting.");
        }
        n = +n;
        if (n < 0) return this.shiftRight(-n);
        var result = this;
        if (result.isZero()) return result;
        while (n >= powers2Length) {
            result = result.multiply(highestPower2);
            n -= powers2Length - 1;
        }
        return result.multiply(powersOfTwo[n]);
    };
    SmallInteger.prototype.shiftLeft = BigInteger.prototype.shiftLeft;

    BigInteger.prototype.shiftRight = function (n) {
        var remQuo;
        if (!shift_isSmall(n)) {
            throw new Error(String(n) + " is too large for shifting.");
        }
        n = +n;
        if (n < 0) return this.shiftLeft(-n);
        var result = this;
        while (n >= powers2Length) {
            if (result.isZero() || (result.isNegative() && result.isUnit())) return result;
            remQuo = divModAny(result, highestPower2);
            result = remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
            n -= powers2Length - 1;
        }
        remQuo = divModAny(result, powersOfTwo[n]);
        return remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
    };
    SmallInteger.prototype.shiftRight = BigInteger.prototype.shiftRight;

    function bitwise(x, y, fn) {
        y = parseValue(y);
        var xSign = x.isNegative(), ySign = y.isNegative();
        var xRem = xSign ? x.not() : x,
            yRem = ySign ? y.not() : y;
        var xDigit = 0, yDigit = 0;
        var xDivMod = null, yDivMod = null;
        var result = [];
        while (!xRem.isZero() || !yRem.isZero()) {
            xDivMod = divModAny(xRem, highestPower2);
            xDigit = xDivMod[1].toJSNumber();
            if (xSign) {
                xDigit = highestPower2 - 1 - xDigit; // two's complement for negative numbers
            }

            yDivMod = divModAny(yRem, highestPower2);
            yDigit = yDivMod[1].toJSNumber();
            if (ySign) {
                yDigit = highestPower2 - 1 - yDigit; // two's complement for negative numbers
            }

            xRem = xDivMod[0];
            yRem = yDivMod[0];
            result.push(fn(xDigit, yDigit));
        }
        var sum = fn(xSign ? 1 : 0, ySign ? 1 : 0) !== 0 ? bigInt(-1) : bigInt(0);
        for (var i = result.length - 1; i >= 0; i -= 1) {
            sum = sum.multiply(highestPower2).add(bigInt(result[i]));
        }
        return sum;
    }

    BigInteger.prototype.not = function () {
        return this.negate().prev();
    };
    SmallInteger.prototype.not = BigInteger.prototype.not;

    BigInteger.prototype.and = function (n) {
        return bitwise(this, n, function (a, b) { return a & b; });
    };
    SmallInteger.prototype.and = BigInteger.prototype.and;

    BigInteger.prototype.or = function (n) {
        return bitwise(this, n, function (a, b) { return a | b; });
    };
    SmallInteger.prototype.or = BigInteger.prototype.or;

    BigInteger.prototype.xor = function (n) {
        return bitwise(this, n, function (a, b) { return a ^ b; });
    };
    SmallInteger.prototype.xor = BigInteger.prototype.xor;

    var LOBMASK_I = 1 << 30, LOBMASK_BI = (BASE & -BASE) * (BASE & -BASE) | LOBMASK_I;
    function roughLOB(n) { // get lowestOneBit (rough)
        // SmallInteger: return Min(lowestOneBit(n), 1 << 30)
        // BigInteger: return Min(lowestOneBit(n), 1 << 14) [BASE=1e7]
        var v = n.value, x = typeof v === "number" ? v | LOBMASK_I : v[0] + v[1] * BASE | LOBMASK_BI;
        return x & -x;
    }

    function integerLogarithm(value, base) {
        if (base.compareTo(value) <= 0) {
            var tmp = integerLogarithm(value, base.square(base));
            var p = tmp.p;
            var e = tmp.e;
            var t = p.multiply(base);
            return t.compareTo(value) <= 0 ? { p: t, e: e * 2 + 1 } : { p: p, e: e * 2 };
        }
        return { p: bigInt(1), e: 0 };
    }

    BigInteger.prototype.bitLength = function () {
        var n = this;
        if (n.compareTo(bigInt(0)) < 0) {
            n = n.negate().subtract(bigInt(1));
        }
        if (n.compareTo(bigInt(0)) === 0) {
            return bigInt(0);
        }
        return bigInt(integerLogarithm(n, bigInt(2)).e).add(bigInt(1));
    }
    SmallInteger.prototype.bitLength = BigInteger.prototype.bitLength;

    function max(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.greater(b) ? a : b;
    }
    function min(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.lesser(b) ? a : b;
    }
    function gcd(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        if (a.equals(b)) return a;
        if (a.isZero()) return b;
        if (b.isZero()) return a;
        var c = Integer[1], d, t;
        while (a.isEven() && b.isEven()) {
            d = Math.min(roughLOB(a), roughLOB(b));
            a = a.divide(d);
            b = b.divide(d);
            c = c.multiply(d);
        }
        while (a.isEven()) {
            a = a.divide(roughLOB(a));
        }
        do {
            while (b.isEven()) {
                b = b.divide(roughLOB(b));
            }
            if (a.greater(b)) {
                t = b; b = a; a = t;
            }
            b = b.subtract(a);
        } while (!b.isZero());
        return c.isUnit() ? a : a.multiply(c);
    }
    function lcm(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        return a.divide(gcd(a, b)).multiply(b);
    }
    function randBetween(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        var low = min(a, b), high = max(a, b);
        var range = high.subtract(low).add(1);
        if (range.isSmall) return low.add(Math.floor(Math.random() * range));
        var length = range.value.length - 1;
        var result = [], restricted = true;
        for (var i = length; i >= 0; i--) {
            var top = restricted ? range.value[i] : BASE;
            var digit = truncate(Math.random() * top);
            result.unshift(digit);
            if (digit < top) restricted = false;
        }
        result = arrayToSmall(result);
        return low.add(typeof result === "number" ? new SmallInteger(result) : new BigInteger(result, false));
    }
    var parseBase = function (text, base) {
        var length = text.length;
        var i;
        var absBase = Math.abs(base);
        for (var i = 0; i < length; i++) {
            var c = text[i].toLowerCase();
            if (c === "-") continue;
            if (/[a-z0-9]/.test(c)) {
                if (/[0-9]/.test(c) && +c >= absBase) {
                    if (c === "1" && absBase === 1) continue;
                    throw new Error(c + " is not a valid digit in base " + base + ".");
                } else if (c.charCodeAt(0) - 87 >= absBase) {
                    throw new Error(c + " is not a valid digit in base " + base + ".");
                }
            }
        }
        if (2 <= base && base <= 36) {
            if (length <= LOG_MAX_INT / Math.log(base)) {
                var result = parseInt(text, base);
                if (isNaN(result)) {
                    throw new Error(c + " is not a valid digit in base " + base + ".");
                }
                return new SmallInteger(parseInt(text, base));
            }
        }
        base = parseValue(base);
        var digits = [];
        var isNegative = text[0] === "-";
        for (i = isNegative ? 1 : 0; i < text.length; i++) {
            var c = text[i].toLowerCase(),
                charCode = c.charCodeAt(0);
            if (48 <= charCode && charCode <= 57) digits.push(parseValue(c));
            else if (97 <= charCode && charCode <= 122) digits.push(parseValue(c.charCodeAt(0) - 87));
            else if (c === "<") {
                var start = i;
                do { i++; } while (text[i] !== ">");
                digits.push(parseValue(text.slice(start + 1, i)));
            }
            else throw new Error(c + " is not a valid character");
        }
        return parseBaseFromArray(digits, base, isNegative);
    };

    function parseBaseFromArray(digits, base, isNegative) {
        var val = Integer[0], pow = Integer[1], i;
        for (i = digits.length - 1; i >= 0; i--) {
            val = val.add(digits[i].times(pow));
            pow = pow.times(base);
        }
        return isNegative ? val.negate() : val;
    }

    function stringify(digit) {
        if (digit <= 35) {
            return "0123456789abcdefghijklmnopqrstuvwxyz".charAt(digit);
        }
        return "<" + digit + ">";
    }

    function toBase(n, base) {
        base = bigInt(base);
        if (base.isZero()) {
            if (n.isZero()) return { value: [0], isNegative: false };
            throw new Error("Cannot convert nonzero numbers to base 0.");
        }
        if (base.equals(-1)) {
            if (n.isZero()) return { value: [0], isNegative: false };
            if (n.isNegative())
                return {
                    value: [].concat.apply([], Array.apply(null, Array(-n))
                        .map(Array.prototype.valueOf, [1, 0])
                    ),
                    isNegative: false
                };

            var arr = Array.apply(null, Array(+n - 1))
                .map(Array.prototype.valueOf, [0, 1]);
            arr.unshift([1]);
            return {
                value: [].concat.apply([], arr),
                isNegative: false
            };
        }

        var neg = false;
        if (n.isNegative() && base.isPositive()) {
            neg = true;
            n = n.abs();
        }
        if (base.equals(1)) {
            if (n.isZero()) return { value: [0], isNegative: false };

            return {
                value: Array.apply(null, Array(+n))
                    .map(Number.prototype.valueOf, 1),
                isNegative: neg
            };
        }
        var out = [];
        var left = n, divmod;
        while (left.isNegative() || left.compareAbs(base) >= 0) {
            divmod = left.divmod(base);
            left = divmod.quotient;
            var digit = divmod.remainder;
            if (digit.isNegative()) {
                digit = base.minus(digit).abs();
                left = left.next();
            }
            out.push(digit.toJSNumber());
        }
        out.push(left.toJSNumber());
        return { value: out.reverse(), isNegative: neg };
    }

    function toBaseString(n, base) {
        var arr = toBase(n, base);
        return (arr.isNegative ? "-" : "") + arr.value.map(stringify).join('');
    }

    BigInteger.prototype.toArray = function (radix) {
        return toBase(this, radix);
    };

    SmallInteger.prototype.toArray = function (radix) {
        return toBase(this, radix);
    };

    BigInteger.prototype.toString = function (radix) {
        if (radix === undefined) radix = 10;
        if (radix !== 10) return toBaseString(this, radix);
        var v = this.value, l = v.length, str = String(v[--l]), zeros = "0000000", digit;
        while (--l >= 0) {
            digit = String(v[l]);
            str += zeros.slice(digit.length) + digit;
        }
        var sign = this.sign ? "-" : "";
        return sign + str;
    };

    SmallInteger.prototype.toString = function (radix) {
        if (radix === undefined) radix = 10;
        if (radix != 10) return toBaseString(this, radix);
        return String(this.value);
    };
    BigInteger.prototype.toJSON = SmallInteger.prototype.toJSON = function () { return this.toString(); }

    BigInteger.prototype.valueOf = function () {
        return parseInt(this.toString(), 10);
    };
    BigInteger.prototype.toJSNumber = BigInteger.prototype.valueOf;

    SmallInteger.prototype.valueOf = function () {
        return this.value;
    };
    SmallInteger.prototype.toJSNumber = SmallInteger.prototype.valueOf;

    function parseStringValue(v) {
        if (isPrecise(+v)) {
            var x = +v;
            if (x === truncate(x))
                return new SmallInteger(x);
            throw new Error("Invalid integer: " + v);
        }
        var sign = v[0] === "-";
        if (sign) v = v.slice(1);
        var split = v.split(/e/i);
        if (split.length > 2) throw new Error("Invalid integer: " + split.join("e"));
        if (split.length === 2) {
            var exp = split[1];
            if (exp[0] === "+") exp = exp.slice(1);
            exp = +exp;
            if (exp !== truncate(exp) || !isPrecise(exp)) throw new Error("Invalid integer: " + exp + " is not a valid exponent.");
            var text = split[0];
            var decimalPlace = text.indexOf(".");
            if (decimalPlace >= 0) {
                exp -= text.length - decimalPlace - 1;
                text = text.slice(0, decimalPlace) + text.slice(decimalPlace + 1);
            }
            if (exp < 0) throw new Error("Cannot include negative exponent part for integers");
            text += (new Array(exp + 1)).join("0");
            v = text;
        }
        var isValid = /^([0-9][0-9]*)$/.test(v);
        if (!isValid) throw new Error("Invalid integer: " + v);
        var r = [], max = v.length, l = LOG_BASE, min = max - l;
        while (max > 0) {
            r.push(+v.slice(min, max));
            min -= l;
            if (min < 0) min = 0;
            max -= l;
        }
        trim(r);
        return new BigInteger(r, sign);
    }

    function parseNumberValue(v) {
        if (isPrecise(v)) {
            if (v !== truncate(v)) throw new Error(v + " is not an integer.");
            return new SmallInteger(v);
        }
        return parseStringValue(v.toString());
    }

    function parseValue(v) {
        if (typeof v === "number") {
            return parseNumberValue(v);
        }
        if (typeof v === "string") {
            return parseStringValue(v);
        }
        return v;
    }
    // Pre-define numbers in range [-999,999]
    for (var i = 0; i < 1000; i++) {
        Integer[i] = new SmallInteger(i);
        if (i > 0) Integer[-i] = new SmallInteger(-i);
    }
    // Backwards compatibility
    Integer.one = Integer[1];
    Integer.zero = Integer[0];
    Integer.minusOne = Integer[-1];
    Integer.max = max;
    Integer.min = min;
    Integer.gcd = gcd;
    Integer.lcm = lcm;
    Integer.isInstance = function (x) { return x instanceof BigInteger || x instanceof SmallInteger; };
    Integer.randBetween = randBetween;

    Integer.fromArray = function (digits, base, isNegative) {
        return parseBaseFromArray(digits.map(parseValue), parseValue(base || 10), isNegative);
    };

    return Integer;
})();


// Node.js check
if (typeof module !== "undefined" && module.hasOwnProperty("exports")) {
    module.exports = bigInt;
}

//amd check
if (typeof define === "function" && define.amd) {
    define("big-integer", [], function () {
        return bigInt;
    });
}


if(YAHOO===undefined){
var YAHOO={

}

}
YAHOO.lang={
extend:function(g,h,f){
if(!h||!g){
throw new Error("YAHOO.lang.extend failed, please check that all dependencies are included.")
}
var d=function(){

}
;
d.prototype=h.prototype;
g.prototype=new d();
g.prototype.constructor=g;
g.superclass=h.prototype;
if(h.prototype.constructor==Object.prototype.constructor){
h.prototype.constructor=h
}
if(f){
var b;
for(b in f){
g.prototype[b]=f[b]
}
var e=function(){

}
,c=["toString","valueOf"];
try{
if(/MSIE/.test(navigator.userAgent)){
e=function(j,i){
for(b=0;
b<c.length;
b=b+1){
var l=c[b],k=i[l];
if(typeof k==="function"&&k!=Object.prototype[l]){
j[l]=k
}

}

}

}

}
catch(a){

}
e(g.prototype,f)
}

}

}
;


/*! CryptoJS v3.1.2 core-fix.js
 * code.google.com/p/crypto-js
 * (c) 2009-2013 by Jeff Mott. All rights reserved.
 * code.google.com/p/crypto-js/wiki/License
 * THIS IS FIX of 'core.js' to fix Hmac issue.
 * https://code.google.com/p/crypto-js/issues/detail?id=84
 * https://crypto-js.googlecode.com/svn-history/r667/branches/3.x/src/core.js
 */
var CryptoJS=CryptoJS||(function(e,g){
var a={

}
;
var b=a.lib={

}
;
var j=b.Base=(function(){
function n(){

}
return{
extend:function(p){
n.prototype=this;
var o=new n();
if(p){
o.mixIn(p)
}
if(!o.hasOwnProperty("init")){
o.init=function(){
o.$super.init.apply(this,arguments)
}

}
o.init.prototype=o;
o.$super=this;
return o
}
,create:function(){
var o=this.extend();
o.init.apply(o,arguments);
return o
}
,init:function(){

}
,mixIn:function(p){
for(var o in p){
if(p.hasOwnProperty(o)){
this[o]=p[o]
}

}
if(p.hasOwnProperty("toString")){
this.toString=p.toString
}

}
,clone:function(){
return this.init.prototype.extend(this)
}

}

}
());
var l=b.WordArray=j.extend({
init:function(o,n){
o=this.words=o||[];
if(n!=g){
this.sigBytes=n
}
else{
this.sigBytes=o.length*4
}

}
,toString:function(n){
return(n||h).stringify(this)
}
,concat:function(t){
var q=this.words;
var p=t.words;
var n=this.sigBytes;
var s=t.sigBytes;
this.clamp();
if(n%4){
for(var r=0;
r<s;
r++){
var o=(p[r>>>2]>>>(24-(r%4)*8))&255;
q[(n+r)>>>2]|=o<<(24-((n+r)%4)*8)
}

}
else{
for(var r=0;
r<s;
r+=4){
q[(n+r)>>>2]=p[r>>>2]
}

}
this.sigBytes+=s;
return this
}
,clamp:function(){
var o=this.words;
var n=this.sigBytes;
o[n>>>2]&=4294967295<<(32-(n%4)*8);
o.length=e.ceil(n/4)
}
,clone:function(){
var n=j.clone.call(this);
n.words=this.words.slice(0);
return n
}
,random:function(p){
var o=[];
for(var n=0;
n<p;
n+=4){
o.push((e.random()*4294967296)|0)
}
return new l.init(o,p)
}

}
);
var m=a.enc={

}
;
var h=m.Hex={
stringify:function(p){
var r=p.words;
var o=p.sigBytes;
var q=[];
for(var n=0;
n<o;
n++){
var s=(r[n>>>2]>>>(24-(n%4)*8))&255;
q.push((s>>>4).toString(16));
q.push((s&15).toString(16))
}
return q.join("")
}
,parse:function(p){
var n=p.length;
var q=[];
for(var o=0;
o<n;
o+=2){
q[o>>>3]|=parseInt(p.substr(o,2),16)<<(24-(o%8)*4)
}
return new l.init(q,n/2)
}

}
;
var d=m.Latin1={
stringify:function(q){
var r=q.words;
var p=q.sigBytes;
var n=[];
for(var o=0;
o<p;
o++){
var s=(r[o>>>2]>>>(24-(o%4)*8))&255;
n.push(String.fromCharCode(s))
}
return n.join("")
}
,parse:function(p){
var n=p.length;
var q=[];
for(var o=0;
o<n;
o++){
q[o>>>2]|=(p.charCodeAt(o)&255)<<(24-(o%4)*8)
}
return new l.init(q,n)
}

}
;
var c=m.Utf8={
stringify:function(n){
try{
return decodeURIComponent(escape(d.stringify(n)))
}
catch(o){
throw new Error("Malformed UTF-8 data")
}

}
,parse:function(n){
return d.parse(unescape(encodeURIComponent(n)))
}

}
;
var i=b.BufferedBlockAlgorithm=j.extend({
reset:function(){
this._data=new l.init();
this._nDataBytes=0
}
,_append:function(n){
if(typeof n=="string"){
n=c.parse(n)
}
this._data.concat(n);
this._nDataBytes+=n.sigBytes
}
,_process:function(w){
var q=this._data;
var x=q.words;
var n=q.sigBytes;
var t=this.blockSize;
var v=t*4;
var u=n/v;
if(w){
u=e.ceil(u)
}
else{
u=e.max((u|0)-this._minBufferSize,0)
}
var s=u*t;
var r=e.min(s*4,n);
if(s){
for(var p=0;
p<s;
p+=t){
this._doProcessBlock(x,p)
}
var o=x.splice(0,s);
q.sigBytes-=r
}
return new l.init(o,r)
}
,clone:function(){
var n=j.clone.call(this);
n._data=this._data.clone();
return n
}
,_minBufferSize:0
}
);
var f=b.Hasher=i.extend({
cfg:j.extend(),init:function(n){
this.cfg=this.cfg.extend(n);
this.reset()
}
,reset:function(){
i.reset.call(this);
this._doReset()
}
,update:function(n){
this._append(n);
this._process();
return this
}
,finalize:function(n){
if(n){
this._append(n)
}
var o=this._doFinalize();
return o
}
,blockSize:512/32,_createHelper:function(n){
return function(p,o){
return new n.init(o).finalize(p)
}

}
,_createHmacHelper:function(n){
return function(p,o){
return new k.HMAC.init(n,o).finalize(p)
}

}

}
);
var k=a.algo={

}
;
return a
}
(Math));

/*
CryptoJS v3.1.2 x64-core-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(g){
var a=CryptoJS,f=a.lib,e=f.Base,h=f.WordArray,a=a.x64={

}
;
a.Word=e.extend({
init:function(b,c){
this.high=b;
this.low=c
}

}
);
a.WordArray=e.extend({
init:function(b,c){
b=this.words=b||[];
this.sigBytes=c!=g?c:8*b.length
}
,toX32:function(){
for(var b=this.words,c=b.length,a=[],d=0;
d<c;
d++){
var e=b[d];
a.push(e.high);
a.push(e.low)
}
return h.create(a,this.sigBytes)
}
,clone:function(){
for(var b=e.clone.call(this),c=b.words=this.words.slice(0),a=c.length,d=0;
d<a;
d++)c[d]=c[d].clone();
return b
}

}
)
}
)();


/*
CryptoJS v3.1.2 cipher-core.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
CryptoJS.lib.Cipher||function(u){
var g=CryptoJS,f=g.lib,k=f.Base,l=f.WordArray,q=f.BufferedBlockAlgorithm,r=g.enc.Base64,v=g.algo.EvpKDF,n=f.Cipher=q.extend({
cfg:k.extend(),createEncryptor:function(a,b){
return this.create(this._ENC_XFORM_MODE,a,b)
}
,createDecryptor:function(a,b){
return this.create(this._DEC_XFORM_MODE,a,b)
}
,init:function(a,b,c){
this.cfg=this.cfg.extend(c);
this._xformMode=a;
this._key=b;
this.reset()
}
,reset:function(){
q.reset.call(this);
this._doReset()
}
,process:function(a){
this._append(a);

return this._process()
}
,finalize:function(a){
a&&this._append(a);
return this._doFinalize()
}
,keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(a){
return{
encrypt:function(b,c,d){
return("string"==typeof c?s:j).encrypt(a,b,c,d)
}
,decrypt:function(b,c,d){
return("string"==typeof c?s:j).decrypt(a,b,c,d)
}

}

}

}
);
f.StreamCipher=n.extend({
_doFinalize:function(){
return this._process(!0)
}
,blockSize:1
}
);
var m=g.mode={

}
,t=function(a,b,c){
var d=this._iv;
d?this._iv=u:d=this._prevBlock;
for(var e=
0;
e<c;
e++)a[b+e]^=d[e]
}
,h=(f.BlockCipherMode=k.extend({
createEncryptor:function(a,b){
return this.Encryptor.create(a,b)
}
,createDecryptor:function(a,b){
return this.Decryptor.create(a,b)
}
,init:function(a,b){
this._cipher=a;
this._iv=b
}

}
)).extend();
h.Encryptor=h.extend({
processBlock:function(a,b){
var c=this._cipher,d=c.blockSize;
t.call(this,a,b,d);
c.encryptBlock(a,b);
this._prevBlock=a.slice(b,b+d)
}

}
);
h.Decryptor=h.extend({
processBlock:function(a,b){
var c=this._cipher,d=c.blockSize,e=a.slice(b,b+d);
c.decryptBlock(a,
b);
t.call(this,a,b,d);
this._prevBlock=e
}

}
);
m=m.CBC=h;
h=(g.pad={

}
).Pkcs7={
pad:function(a,b){
for(var c=4*b,c=c-a.sigBytes%c,d=c<<24|c<<16|c<<8|c,e=[],f=0;
f<c;
f+=4)e.push(d);
c=l.create(e,c);
a.concat(c)
}
,unpad:function(a){
a.sigBytes-=a.words[a.sigBytes-1>>>2]&255
}

}
;
f.BlockCipher=n.extend({
cfg:n.cfg.extend({
mode:m,padding:h
}
),reset:function(){
n.reset.call(this);
var a=this.cfg,b=a.iv,a=a.mode;
if(this._xformMode==this._ENC_XFORM_MODE)var c=a.createEncryptor;
else c=a.createDecryptor,this._minBufferSize=1;

this._mode=c.call(a,this,b&&b.words)
}
,_doProcessBlock:function(a,b){
this._mode.processBlock(a,b)
}
,_doFinalize:function(){
var a=this.cfg.padding;
if(this._xformMode==this._ENC_XFORM_MODE){
a.pad(this._data,this.blockSize);
var b=this._process(!0)
}
else b=this._process(!0),a.unpad(b);
return b
}
,blockSize:4
}
);
var p=f.CipherParams=k.extend({
init:function(a){
this.mixIn(a)
}
,toString:function(a){
return(a||this.formatter).stringify(this)
}

}
),m=(g.format={

}
).OpenSSL={
stringify:function(a){
var b=a.ciphertext;
a=a.salt;

return(a?l.create([1398893684,1701076831]).concat(a).concat(b):b).toString(r)
}
,parse:function(a){
a=r.parse(a);
var b=a.words;
if(1398893684==b[0]&&1701076831==b[1]){
var c=l.create(b.slice(2,4));
b.splice(0,4);
a.sigBytes-=16
}
return p.create({
ciphertext:a,salt:c
}
)
}

}
,j=f.SerializableCipher=k.extend({
cfg:k.extend({
format:m
}
),encrypt:function(a,b,c,d){
d=this.cfg.extend(d);
var e=a.createEncryptor(c,d);
b=e.finalize(b);
e=e.cfg;
return p.create({
ciphertext:b,key:c,iv:e.iv,algorithm:a,mode:e.mode,padding:e.padding,
blockSize:a.blockSize,formatter:d.format
}
)
}
,decrypt:function(a,b,c,d){
d=this.cfg.extend(d);
b=this._parse(b,d.format);
return a.createDecryptor(c,d).finalize(b.ciphertext)
}
,_parse:function(a,b){
return"string"==typeof a?b.parse(a,this):a
}

}
),g=(g.kdf={

}
).OpenSSL={
execute:function(a,b,c,d){
d||(d=l.random(8));
a=v.create({
keySize:b+c
}
).compute(a,d);
c=l.create(a.words.slice(b),4*c);
a.sigBytes=4*b;
return p.create({
key:a,iv:c,salt:d
}
)
}

}
,s=f.PasswordBasedCipher=j.extend({
cfg:j.cfg.extend({
kdf:g
}
),encrypt:function(a,
b,c,d){
d=this.cfg.extend(d);
c=d.kdf.execute(c,a.keySize,a.ivSize);
d.iv=c.iv;
a=j.encrypt.call(this,a,b,c.key,d);
a.mixIn(c);
return a
}
,decrypt:function(a,b,c,d){
d=this.cfg.extend(d);
b=this._parse(b,d.format);
c=d.kdf.execute(c,a.keySize,a.ivSize,b.salt);
d.iv=c.iv;
return j.decrypt.call(this,a,b,c.key,d)
}

}
)
}
();


/*
CryptoJS v3.1.2 sha1-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){
var k=CryptoJS,b=k.lib,m=b.WordArray,l=b.Hasher,d=[],b=k.algo.SHA1=l.extend({
_doReset:function(){
this._hash=new m.init([1732584193,4023233417,2562383102,271733878,3285377520])
}
,_doProcessBlock:function(n,p){
for(var a=this._hash.words,e=a[0],f=a[1],h=a[2],j=a[3],b=a[4],c=0;
80>c;
c++){
if(16>c)d[c]=n[p+c]|0;
else{
var g=d[c-3]^d[c-8]^d[c-14]^d[c-16];
d[c]=g<<1|g>>>31
}
g=(e<<5|e>>>27)+b+d[c];
g=20>c?g+((f&h|~f&j)+1518500249):40>c?g+((f^h^j)+1859775393):60>c?g+((f&h|f&j|h&j)-1894007588):g+((f^h^
j)-899497514);
b=j;
j=h;
h=f<<30|f>>>2;
f=e;
e=g
}
a[0]=a[0]+e|0;
a[1]=a[1]+f|0;
a[2]=a[2]+h|0;
a[3]=a[3]+j|0;
a[4]=a[4]+b|0
}
,_doFinalize:function(){
var b=this._data,d=b.words,a=8*this._nDataBytes,e=8*b.sigBytes;
d[e>>>5]|=128<<24-e%32;
d[(e+64>>>9<<4)+14]=Math.floor(a/4294967296);
d[(e+64>>>9<<4)+15]=a;
b.sigBytes=4*d.length;
this._process();
return this._hash
}
,clone:function(){
var b=l.clone.call(this);
b._hash=this._hash.clone();
return b
}

}
);
k.SHA1=l._createHelper(b);
k.HmacSHA1=l._createHmacHelper(b)
}
)();


/*
CryptoJS v3.1.2 sha256-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(k){
for(var g=CryptoJS,h=g.lib,v=h.WordArray,j=h.Hasher,h=g.algo,s=[],t=[],u=function(q){
return 4294967296*(q-(q|0))|0
}
,l=2,b=0;
64>b;
){
var d;
a:{
d=l;
for(var w=k.sqrt(d),r=2;
r<=w;
r++)if(!(d%r)){
d=!1;
break a
}
d=!0
}
d&&(8>b&&(s[b]=u(k.pow(l,0.5))),t[b]=u(k.pow(l,1/3)),b++);
l++
}
var n=[],h=h.SHA256=j.extend({
_doReset:function(){
this._hash=new v.init(s.slice(0))
}
,_doProcessBlock:function(q,h){
for(var a=this._hash.words,c=a[0],d=a[1],b=a[2],k=a[3],f=a[4],g=a[5],j=a[6],l=a[7],e=0;
64>e;
e++){
if(16>e)n[e]=
q[h+e]|0;
else{
var m=n[e-15],p=n[e-2];
n[e]=((m<<25|m>>>7)^(m<<14|m>>>18)^m>>>3)+n[e-7]+((p<<15|p>>>17)^(p<<13|p>>>19)^p>>>10)+n[e-16]
}
m=l+((f<<26|f>>>6)^(f<<21|f>>>11)^(f<<7|f>>>25))+(f&g^~f&j)+t[e]+n[e];
p=((c<<30|c>>>2)^(c<<19|c>>>13)^(c<<10|c>>>22))+(c&d^c&b^d&b);
l=j;
j=g;
g=f;
f=k+m|0;
k=b;
b=d;
d=c;
c=m+p|0
}
a[0]=a[0]+c|0;
a[1]=a[1]+d|0;
a[2]=a[2]+b|0;
a[3]=a[3]+k|0;
a[4]=a[4]+f|0;
a[5]=a[5]+g|0;
a[6]=a[6]+j|0;
a[7]=a[7]+l|0
}
,_doFinalize:function(){
var d=this._data,b=d.words,a=8*this._nDataBytes,c=8*d.sigBytes;

b[c>>>5]|=128<<24-c%32;
b[(c+64>>>9<<4)+14]=k.floor(a/4294967296);
b[(c+64>>>9<<4)+15]=a;
d.sigBytes=4*b.length;
this._process();
return this._hash
}
,clone:function(){
var b=j.clone.call(this);
b._hash=this._hash.clone();
return b
}

}
);
g.SHA256=j._createHelper(h);
g.HmacSHA256=j._createHmacHelper(h)
}
)(Math);


/*
CryptoJS v3.1.2 sha512-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){
function a(){
return d.create.apply(d,arguments)
}
for(var n=CryptoJS,r=n.lib.Hasher,e=n.x64,d=e.Word,T=e.WordArray,e=n.algo,ea=[a(1116352408,3609767458),a(1899447441,602891725),a(3049323471,3964484399),a(3921009573,2173295548),a(961987163,4081628472),a(1508970993,3053834265),a(2453635748,2937671579),a(2870763221,3664609560),a(3624381080,2734883394),a(310598401,1164996542),a(607225278,1323610764),a(1426881987,3590304994),a(1925078388,4068182383),a(2162078206,991336113),a(2614888103,633803317),
a(3248222580,3479774868),a(3835390401,2666613458),a(4022224774,944711139),a(264347078,2341262773),a(604807628,2007800933),a(770255983,1495990901),a(1249150122,1856431235),a(1555081692,3175218132),a(1996064986,2198950837),a(2554220882,3999719339),a(2821834349,766784016),a(2952996808,2566594879),a(3210313671,3203337956),a(3336571891,1034457026),a(3584528711,2466948901),a(113926993,3758326383),a(338241895,168717936),a(666307205,1188179964),a(773529912,1546045734),a(1294757372,1522805485),a(1396182291,
2643833823),a(1695183700,2343527390),a(1986661051,1014477480),a(2177026350,1206759142),a(2456956037,344077627),a(2730485921,1290863460),a(2820302411,3158454273),a(3259730800,3505952657),a(3345764771,106217008),a(3516065817,3606008344),a(3600352804,1432725776),a(4094571909,1467031594),a(275423344,851169720),a(430227734,3100823752),a(506948616,1363258195),a(659060556,3750685593),a(883997877,3785050280),a(958139571,3318307427),a(1322822218,3812723403),a(1537002063,2003034995),a(1747873779,3602036899),
a(1955562222,1575990012),a(2024104815,1125592928),a(2227730452,2716904306),a(2361852424,442776044),a(2428436474,593698344),a(2756734187,3733110249),a(3204031479,2999351573),a(3329325298,3815920427),a(3391569614,3928383900),a(3515267271,566280711),a(3940187606,3454069534),a(4118630271,4000239992),a(116418474,1914138554),a(174292421,2731055270),a(289380356,3203993006),a(460393269,320620315),a(685471733,587496836),a(852142971,1086792851),a(1017036298,365543100),a(1126000580,2618297676),a(1288033470,
3409855158),a(1501505948,4234509866),a(1607167915,987167468),a(1816402316,1246189591)],v=[],w=0;
80>w;
w++)v[w]=a();
e=e.SHA512=r.extend({
_doReset:function(){
this._hash=new T.init([new d.init(1779033703,4089235720),new d.init(3144134277,2227873595),new d.init(1013904242,4271175723),new d.init(2773480762,1595750129),new d.init(1359893119,2917565137),new d.init(2600822924,725511199),new d.init(528734635,4215389547),new d.init(1541459225,327033209)])
}
,_doProcessBlock:function(a,d){
for(var f=this._hash.words,
F=f[0],e=f[1],n=f[2],r=f[3],G=f[4],H=f[5],I=f[6],f=f[7],w=F.high,J=F.low,X=e.high,K=e.low,Y=n.high,L=n.low,Z=r.high,M=r.low,$=G.high,N=G.low,aa=H.high,O=H.low,ba=I.high,P=I.low,ca=f.high,Q=f.low,k=w,g=J,z=X,x=K,A=Y,y=L,U=Z,B=M,l=$,h=N,R=aa,C=O,S=ba,D=P,V=ca,E=Q,m=0;
80>m;
m++){
var s=v[m];
if(16>m)var j=s.high=a[d+2*m]|0,b=s.low=a[d+2*m+1]|0;
else{
var j=v[m-15],b=j.high,p=j.low,j=(b>>>1|p<<31)^(b>>>8|p<<24)^b>>>7,p=(p>>>1|b<<31)^(p>>>8|b<<24)^(p>>>7|b<<25),u=v[m-2],b=u.high,c=u.low,u=(b>>>19|c<<13)^(b<<
3|c>>>29)^b>>>6,c=(c>>>19|b<<13)^(c<<3|b>>>29)^(c>>>6|b<<26),b=v[m-7],W=b.high,t=v[m-16],q=t.high,t=t.low,b=p+b.low,j=j+W+(b>>>0<p>>>0?1:0),b=b+c,j=j+u+(b>>>0<c>>>0?1:0),b=b+t,j=j+q+(b>>>0<t>>>0?1:0);
s.high=j;
s.low=b
}
var W=l&R^~l&S,t=h&C^~h&D,s=k&z^k&A^z&A,T=g&x^g&y^x&y,p=(k>>>28|g<<4)^(k<<30|g>>>2)^(k<<25|g>>>7),u=(g>>>28|k<<4)^(g<<30|k>>>2)^(g<<25|k>>>7),c=ea[m],fa=c.high,da=c.low,c=E+((h>>>14|l<<18)^(h>>>18|l<<14)^(h<<23|l>>>9)),q=V+((l>>>14|h<<18)^(l>>>18|h<<14)^(l<<23|h>>>9))+(c>>>0<E>>>0?1:
0),c=c+t,q=q+W+(c>>>0<t>>>0?1:0),c=c+da,q=q+fa+(c>>>0<da>>>0?1:0),c=c+b,q=q+j+(c>>>0<b>>>0?1:0),b=u+T,s=p+s+(b>>>0<u>>>0?1:0),V=S,E=D,S=R,D=C,R=l,C=h,h=B+c|0,l=U+q+(h>>>0<B>>>0?1:0)|0,U=A,B=y,A=z,y=x,z=k,x=g,g=c+b|0,k=q+s+(g>>>0<c>>>0?1:0)|0
}
J=F.low=J+g;
F.high=w+k+(J>>>0<g>>>0?1:0);
K=e.low=K+x;
e.high=X+z+(K>>>0<x>>>0?1:0);
L=n.low=L+y;
n.high=Y+A+(L>>>0<y>>>0?1:0);
M=r.low=M+B;
r.high=Z+U+(M>>>0<B>>>0?1:0);
N=G.low=N+h;
G.high=$+l+(N>>>0<h>>>0?1:0);
O=H.low=O+C;
H.high=aa+R+(O>>>0<C>>>0?1:0);
P=I.low=P+D;

I.high=ba+S+(P>>>0<D>>>0?1:0);
Q=f.low=Q+E;
f.high=ca+V+(Q>>>0<E>>>0?1:0)
}
,_doFinalize:function(){
var a=this._data,d=a.words,f=8*this._nDataBytes,e=8*a.sigBytes;
d[e>>>5]|=128<<24-e%32;
d[(e+128>>>10<<5)+30]=Math.floor(f/4294967296);
d[(e+128>>>10<<5)+31]=f;
a.sigBytes=4*d.length;
this._process();
return this._hash.toX32()
}
,clone:function(){
var a=r.clone.call(this);
a._hash=this._hash.clone();
return a
}
,blockSize:32
}
);
n.SHA512=r._createHelper(e);
n.HmacSHA512=r._createHmacHelper(e)
}
)();



var b64map="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var b64pad="=";
function hex2b64(d){
var b;
var e;
var a="";
for(b=0;
b+3<=d.length;
b+=3){
e=parseInt(d.substring(b,b+3),16);
a+=b64map.charAt(e>>6)+b64map.charAt(e&63)
}
if(b+1==d.length){
e=parseInt(d.substring(b,b+1),16);
a+=b64map.charAt(e<<2)
}
else{
if(b+2==d.length){
e=parseInt(d.substring(b,b+2),16);
a+=b64map.charAt(e>>2)+b64map.charAt((e&3)<<4)
}

}
if(b64pad){
while((a.length&3)>0){
a+=b64pad
}

}
return a
}
function b64tohex(f){
var d="";
var e;
var b=0;
var c;
var a;
for(e=0;
e<f.length;
++e){
if(f.charAt(e)==b64pad){
break
}
a=b64map.indexOf(f.charAt(e));
if(a<0){
continue
}
if(b==0){
d+=int2char(a>>2);
c=a&3;
b=1
}
else{
if(b==1){
d+=int2char((c<<2)|(a>>4));
c=a&15;
b=2
}
else{
if(b==2){
d+=int2char(c);
d+=int2char(a>>2);
c=a&3;
b=3
}
else{
d+=int2char((c<<2)|(a>>4));
d+=int2char(a&15);
b=0
}

}

}

}
if(b==1){
d+=int2char(c<<2)
}
return d
}
function b64toBA(e){
var d=b64tohex(e);
var c;
var b=new Array();
for(c=0;
2*c<d.length;
++c){
b[c]=parseInt(d.substring(2*c,2*c+2),16)
}
return b
}
;

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
var dbits;
var canary=244837814094590;
var j_lm=((canary&16777215)==15715070);
function BigInteger(e,d,f){
if(e!=null){
if("number"==typeof e){
this.fromNumber(e,d,f)
}
else{
if(d==null&&"string"!=typeof e){
this.fromString(e,256)
}
else{
this.fromString(e,d)
}

}

}

}


function nbi(){
	return new BigInteger(null);

}


function am1(f,a,b,e,h,g){
while(--g>=0){
var d=a*this[f++]+b[e]+h;
h=Math.floor(d/67108864);
b[e++]=d&67108863
}
return h
}
function am2(f,q,r,e,o,a){
var k=q&32767,p=q>>15;
while(--a>=0){
var d=this[f]&32767;
var g=this[f++]>>15;
var b=p*d+g*k;
d=k*d+((b&32767)<<15)+r[e]+(o&1073741823);
o=(d>>>30)+(b>>>15)+p*g+(o>>>30);
r[e++]=d&1073741823
}
return o
}
function am3(f,q,r,e,o,a){
var k=q&16383,p=q>>14;
while(--a>=0){
var d=this[f]&16383;
var g=this[f++]>>14;
var b=p*d+g*k;
d=k*d+((b&16383)<<14)+r[e]+o;
o=(d>>28)+(b>>14)+p*g;
r[e++]=d&268435455
}
return o
}
if(j_lm&&(navigator.appName=="Microsoft Internet Explorer")){
BigInteger.prototype.am=am2;
dbits=30
}
else{
if(j_lm&&(navigator.appName!="Netscape")){
BigInteger.prototype.am=am1;
dbits=26
}
else{
BigInteger.prototype.am=am3;
dbits=28
}

}
BigInteger.prototype.DB=dbits;
BigInteger.prototype.DM=((1<<dbits)-1);
BigInteger.prototype.DV=(1<<dbits);
var BI_FP=52;
BigInteger.prototype.FV=Math.pow(2,BI_FP);
BigInteger.prototype.F1=BI_FP-dbits;
BigInteger.prototype.F2=2*dbits-BI_FP;
var BI_RM="0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC=new Array();
var rr,vv;
rr="0".charCodeAt(0);
for(vv=0;
vv<=9;
++vv){
BI_RC[rr++]=vv
}
rr="a".charCodeAt(0);
for(vv=10;
vv<36;
++vv){
BI_RC[rr++]=vv
}
rr="A".charCodeAt(0);
for(vv=10;
vv<36;
++vv){
BI_RC[rr++]=vv
}
function int2char(a){
return BI_RM.charAt(a)
}
function intAt(b,a){
var d=BI_RC[b.charCodeAt(a)];
return(d==null)?-1:d
}
function bnpCopyTo(b){
for(var a=this.t-1;
a>=0;
--a){
b[a]=this[a]
}
b.t=this.t;
b.s=this.s
}


function bnpFromInt(a){
	this.t=1;
	this.s=(a<0)?-1:0;
	if(a>0){
		this[0]=a;
	
}
else{
		if(a<-1){
			this[0]=a+this.DV;
		
}
else{
			this.t=0;
		
}

	
}


}


function nbv(a){
	var b=nbi();
	b.fromInt(a);
	return b;

}


function bnpFromString(h,c){
var e;
if(c==16){
e=4
}
else{
if(c==8){
e=3
}
else{
if(c==256){
e=8
}
else{
if(c==2){
e=1
}
else{
if(c==32){
e=5
}
else{
if(c==4){
e=2
}
else{
this.fromRadix(h,c);
return
}

}

}

}

}

}
this.t=0;
this.s=0;
var g=h.length,d=false,f=0;
while(--g>=0){
var a=(e==8)?h[g]&255:intAt(h,g);
if(a<0){
if(h.charAt(g)=="-"){
d=true
}
continue
}
d=false;
if(f==0){
this[this.t++]=a
}
else{
if(f+e>this.DB){
this[this.t-1]|=(a&((1<<(this.DB-f))-1))<<f;
this[this.t++]=(a>>(this.DB-f))
}
else{
this[this.t-1]|=a<<f
}

}
f+=e;
if(f>=this.DB){
f-=this.DB
}

}
if(e==8&&(h[0]&128)!=0){
this.s=-1;
if(f>0){
this[this.t-1]|=((1<<(this.DB-f))-1)<<f
}

}
this.clamp();
if(d){
BigInteger.ZERO.subTo(this,this)
}

}
function bnpClamp(){
var a=this.s&this.DM;
while(this.t>0&&this[this.t-1]==a){
--this.t
}

}
function bnToString(c){
if(this.s<0){
return"-"+this.negate().toString(c)
}
var e;
if(c==16){
e=4
}
else{
if(c==8){
e=3
}
else{
if(c==2){
e=1
}
else{
if(c==32){
e=5
}
else{
if(c==4){
e=2
}
else{
return this.toRadix(c)
}

}

}

}

}
var g=(1<<e)-1,l,a=false,h="",f=this.t;
var j=this.DB-(f*this.DB)%e;
if(f-->0){
if(j<this.DB&&(l=this[f]>>j)>0){
a=true;
h=int2char(l)
}
while(f>=0){
if(j<e){
l=(this[f]&((1<<j)-1))<<(e-j);
l|=this[--f]>>(j+=this.DB-e)
}
else{
l=(this[f]>>(j-=e))&g;
if(j<=0){
j+=this.DB;
--f
}

}
if(l>0){
a=true
}
if(a){
h+=int2char(l)
}

}

}
return a?h:"0"
}
function bnNegate(){
var a=nbi();
BigInteger.ZERO.subTo(this,a);
return a
}
function bnAbs(){
return(this.s<0)?this.negate():this
}
function bnCompareTo(b){
var d=this.s-b.s;
if(d!=0){
return d
}
var c=this.t;
d=c-b.t;
if(d!=0){
return(this.s<0)?-d:d
}
while(--c>=0){
if((d=this[c]-b[c])!=0){
return d
}

}
return 0
}
function nbits(a){
var c=1,b;
if((b=a>>>16)!=0){
a=b;
c+=16
}
if((b=a>>8)!=0){
a=b;
c+=8
}
if((b=a>>4)!=0){
a=b;
c+=4
}
if((b=a>>2)!=0){
a=b;
c+=2
}
if((b=a>>1)!=0){
a=b;
c+=1
}
return c
}
function bnBitLength(){
if(this.t<=0){
return 0
}
return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM))
}
function bnpDLShiftTo(c,b){
var a;
for(a=this.t-1;
a>=0;
--a){
b[a+c]=this[a]
}
for(a=c-1;
a>=0;
--a){
b[a]=0
}
b.t=this.t+c;
b.s=this.s
}
function bnpDRShiftTo(c,b){
for(var a=c;
a<this.t;
++a){
b[a-c]=this[a]
}
b.t=Math.max(this.t-c,0);
b.s=this.s
}
function bnpLShiftTo(j,e){
var b=j%this.DB;
var a=this.DB-b;
var g=(1<<a)-1;
var f=Math.floor(j/this.DB),h=(this.s<<b)&this.DM,d;
for(d=this.t-1;
d>=0;
--d){
e[d+f+1]=(this[d]>>a)|h;
h=(this[d]&g)<<b
}
for(d=f-1;
d>=0;
--d){
e[d]=0
}
e[f]=h;
e.t=this.t+f+1;
e.s=this.s;
e.clamp()
}
function bnpRShiftTo(g,d){
d.s=this.s;
var e=Math.floor(g/this.DB);
if(e>=this.t){
d.t=0;
return
}
var b=g%this.DB;
var a=this.DB-b;
var f=(1<<b)-1;
d[0]=this[e]>>b;
for(var c=e+1;
c<this.t;
++c){
d[c-e-1]|=(this[c]&f)<<a;
d[c-e]=this[c]>>b
}
if(b>0){
d[this.t-e-1]|=(this.s&f)<<a
}
d.t=this.t-e;
d.clamp()
}
function bnpSubTo(d,f){
var e=0,g=0,b=Math.min(d.t,this.t);
while(e<b){
g+=this[e]-d[e];
f[e++]=g&this.DM;
g>>=this.DB
}
if(d.t<this.t){
g-=d.s;
while(e<this.t){
g+=this[e];
f[e++]=g&this.DM;
g>>=this.DB
}
g+=this.s
}
else{
g+=this.s;
while(e<d.t){
g-=d[e];
f[e++]=g&this.DM;
g>>=this.DB
}
g-=d.s
}
f.s=(g<0)?-1:0;
if(g<-1){
f[e++]=this.DV+g
}
else{
if(g>0){
f[e++]=g
}

}
f.t=e;
f.clamp()
}
function bnpMultiplyTo(c,e){
var b=this.abs(),f=c.abs();
var d=b.t;
e.t=d+f.t;
while(--d>=0){
e[d]=0
}
for(d=0;
d<f.t;
++d){
e[d+b.t]=b.am(0,f[d],e,d,0,b.t)
}
e.s=0;
e.clamp();
if(this.s!=c.s){
BigInteger.ZERO.subTo(e,e)
}

}
function bnpSquareTo(d){
var a=this.abs();
var b=d.t=2*a.t;
while(--b>=0){
d[b]=0
}
for(b=0;
b<a.t-1;
++b){
var e=a.am(b,a[b],d,2*b,0,1);
if((d[b+a.t]+=a.am(b+1,2*a[b],d,2*b+1,e,a.t-b-1))>=a.DV){
d[b+a.t]-=a.DV;
d[b+a.t+1]=1
}

}
if(d.t>0){
d[d.t-1]+=a.am(b,a[b],d,2*b,0,1)
}
d.s=0;
d.clamp()
}
function bnpDivRemTo(n,h,g){
var w=n.abs();
if(w.t<=0){
return
}
var k=this.abs();
if(k.t<w.t){
if(h!=null){
h.fromInt(0)
}
if(g!=null){
this.copyTo(g)
}
return
}
if(g==null){
g=nbi()
}
var d=nbi(),a=this.s,l=n.s;
var v=this.DB-nbits(w[w.t-1]);
if(v>0){
w.lShiftTo(v,d);
k.lShiftTo(v,g)
}
else{
w.copyTo(d);
k.copyTo(g)
}
var p=d.t;
var b=d[p-1];
if(b==0){
return
}
var o=b*(1<<this.F1)+((p>1)?d[p-2]>>this.F2:0);
var A=this.FV/o,z=(1<<this.F1)/o,x=1<<this.F2;
var u=g.t,s=u-p,f=(h==null)?nbi():h;
d.dlShiftTo(s,f);
if(g.compareTo(f)>=0){
g[g.t++]=1;
g.subTo(f,g)
}
BigInteger.ONE.dlShiftTo(p,f);
f.subTo(d,d);
while(d.t<p){
d[d.t++]=0
}
while(--s>=0){
var c=(g[--u]==b)?this.DM:Math.floor(g[u]*A+(g[u-1]+x)*z);
if((g[u]+=d.am(0,c,g,s,0,p))<c){
d.dlShiftTo(s,f);
g.subTo(f,g);
while(g[u]<--c){
g.subTo(f,g)
}

}

}
if(h!=null){
g.drShiftTo(p,h);
if(a!=l){
BigInteger.ZERO.subTo(h,h)
}

}
g.t=p;
g.clamp();
if(v>0){
g.rShiftTo(v,g)
}
if(a<0){
BigInteger.ZERO.subTo(g,g)
}

}
function bnMod(b){
var c=nbi();
this.abs().divRemTo(b,null,c);
if(this.s<0&&c.compareTo(BigInteger.ZERO)>0){
b.subTo(c,c)
}
return c
}
function Classic(a){
this.m=a
}
function cConvert(a){
if(a.s<0||a.compareTo(this.m)>=0){
return a.mod(this.m)
}
else{
return a
}

}
function cRevert(a){
return a
}
function cReduce(a){
a.divRemTo(this.m,null,a)
}
function cMulTo(a,c,b){
a.multiplyTo(c,b);
this.reduce(b)
}
function cSqrTo(a,b){
a.squareTo(b);
this.reduce(b)
}
Classic.prototype.convert=cConvert;
Classic.prototype.revert=cRevert;
Classic.prototype.reduce=cReduce;
Classic.prototype.mulTo=cMulTo;
Classic.prototype.sqrTo=cSqrTo;
function bnpInvDigit(){
if(this.t<1){
return 0
}
var a=this[0];
if((a&1)==0){
return 0
}
var b=a&3;
b=(b*(2-(a&15)*b))&15;
b=(b*(2-(a&255)*b))&255;
b=(b*(2-(((a&65535)*b)&65535)))&65535;
b=(b*(2-a*b%this.DV))%this.DV;
return(b>0)?this.DV-b:-b
}
function Montgomery(a){
this.m=a;
this.mp=a.invDigit();
this.mpl=this.mp&32767;
this.mph=this.mp>>15;
this.um=(1<<(a.DB-15))-1;
this.mt2=2*a.t
}
function montConvert(a){
var b=nbi();
a.abs().dlShiftTo(this.m.t,b);
b.divRemTo(this.m,null,b);
if(a.s<0&&b.compareTo(BigInteger.ZERO)>0){
this.m.subTo(b,b)
}
return b
}
function montRevert(a){
var b=nbi();
a.copyTo(b);
this.reduce(b);
return b
}
function montReduce(a){
while(a.t<=this.mt2){
a[a.t++]=0
}
for(var c=0;
c<this.m.t;
++c){
var b=a[c]&32767;
var d=(b*this.mpl+(((b*this.mph+(a[c]>>15)*this.mpl)&this.um)<<15))&a.DM;
b=c+this.m.t;
a[b]+=this.m.am(0,d,a,c,0,this.m.t);
while(a[b]>=a.DV){
a[b]-=a.DV;
a[++b]++
}

}
a.clamp();
a.drShiftTo(this.m.t,a);
if(a.compareTo(this.m)>=0){
a.subTo(this.m,a)
}

}
function montSqrTo(a,b){
a.squareTo(b);
this.reduce(b)
}
function montMulTo(a,c,b){
a.multiplyTo(c,b);
this.reduce(b)
}
Montgomery.prototype.convert=montConvert;
Montgomery.prototype.revert=montRevert;
Montgomery.prototype.reduce=montReduce;
Montgomery.prototype.mulTo=montMulTo;
Montgomery.prototype.sqrTo=montSqrTo;
function bnpIsEven(){
return((this.t>0)?(this[0]&1):this.s)==0
}
function bnpExp(h,j){
if(h>4294967295||h<1){
return BigInteger.ONE
}
var f=nbi(),a=nbi(),d=j.convert(this),c=nbits(h)-1;
d.copyTo(f);
while(--c>=0){
j.sqrTo(f,a);
if((h&(1<<c))>0){
j.mulTo(a,d,f)
}
else{
var b=f;
f=a;
a=b
}

}
return j.revert(f)
}
function bnModPowInt(b,a){
var c;
if(b<256||a.isEven()){
c=new Classic(a)
}
else{
c=new Montgomery(a)
}
return this.exp(b,c)
}
BigInteger.prototype.copyTo=bnpCopyTo;
BigInteger.prototype.fromInt=bnpFromInt;
BigInteger.prototype.fromString=bnpFromString;
BigInteger.prototype.clamp=bnpClamp;
BigInteger.prototype.dlShiftTo=bnpDLShiftTo;
BigInteger.prototype.drShiftTo=bnpDRShiftTo;
BigInteger.prototype.lShiftTo=bnpLShiftTo;
BigInteger.prototype.rShiftTo=bnpRShiftTo;
BigInteger.prototype.subTo=bnpSubTo;
BigInteger.prototype.multiplyTo=bnpMultiplyTo;
BigInteger.prototype.squareTo=bnpSquareTo;
BigInteger.prototype.divRemTo=bnpDivRemTo;
BigInteger.prototype.invDigit=bnpInvDigit;
BigInteger.prototype.isEven=bnpIsEven;
BigInteger.prototype.exp=bnpExp;
BigInteger.prototype.toString=bnToString;
BigInteger.prototype.negate=bnNegate;
BigInteger.prototype.abs=bnAbs;
BigInteger.prototype.compareTo=bnCompareTo;
BigInteger.prototype.bitLength=bnBitLength;
BigInteger.prototype.mod=bnMod;
BigInteger.prototype.modPowInt=bnModPowInt;
BigInteger.ZERO=nbv(0);
BigInteger.ONE=nbv(1);

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function bnClone(){
var a=nbi();
this.copyTo(a);
return a
}
function bnIntValue(){
if(this.s<0){
if(this.t==1){
return this[0]-this.DV
}
else{
if(this.t==0){
return -1
}

}

}
else{
if(this.t==1){
return this[0]
}
else{
if(this.t==0){
return 0
}

}

}
return((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0]
}
function bnByteValue(){
return(this.t==0)?this.s:(this[0]<<24)>>24
}
function bnShortValue(){
return(this.t==0)?this.s:(this[0]<<16)>>16
}
function bnpChunkSize(a){
return Math.floor(Math.LN2*this.DB/Math.log(a))
}
function bnSigNum(){
if(this.s<0){
return -1
}
else{
if(this.t<=0||(this.t==1&&this[0]<=0)){
return 0
}
else{
return 1
}

}

}
function bnpToRadix(c){
if(c==null){
c=10
}
if(this.signum()==0||c<2||c>36){
return"0"
}
var f=this.chunkSize(c);
var e=Math.pow(c,f);
var i=nbv(e),j=nbi(),h=nbi(),g="";
this.divRemTo(i,j,h);
while(j.signum()>0){
g=(e+h.intValue()).toString(c).substr(1)+g;
j.divRemTo(i,j,h)
}
return h.intValue().toString(c)+g
}
function bnpFromRadix(m,h){
this.fromInt(0);
if(h==null){
h=10
}
var f=this.chunkSize(h);
var g=Math.pow(h,f),e=false,a=0,l=0;
for(var c=0;
c<m.length;
++c){
var k=intAt(m,c);
if(k<0){
if(m.charAt(c)=="-"&&this.signum()==0){
e=true
}
continue
}
l=h*l+k;
if(++a>=f){
this.dMultiply(g);
this.dAddOffset(l,0);
a=0;
l=0
}

}
if(a>0){
this.dMultiply(Math.pow(h,a));
this.dAddOffset(l,0)
}
if(e){
BigInteger.ZERO.subTo(this,this)
}

}
function bnpFromNumber(f,e,h){
if("number"==typeof e){
if(f<2){
this.fromInt(1)
}
else{
this.fromNumber(f,h);
if(!this.testBit(f-1)){
this.bitwiseTo(BigInteger.ONE.shiftLeft(f-1),op_or,this)
}
if(this.isEven()){
this.dAddOffset(1,0)
}
while(!this.isProbablePrime(e)){
this.dAddOffset(2,0);
if(this.bitLength()>f){
this.subTo(BigInteger.ONE.shiftLeft(f-1),this)
}

}

}

}
else{
var d=new Array(),g=f&7;
d.length=(f>>3)+1;
e.nextBytes(d);
if(g>0){
d[0]&=((1<<g)-1)
}
else{
d[0]=0
}
this.fromString(d,256)
}

}
function bnToByteArray(){
var b=this.t,c=new Array();
c[0]=this.s;
var e=this.DB-(b*this.DB)%8,f,a=0;
if(b-->0){
if(e<this.DB&&(f=this[b]>>e)!=(this.s&this.DM)>>e){
c[a++]=f|(this.s<<(this.DB-e))
}
while(b>=0){
if(e<8){
f=(this[b]&((1<<e)-1))<<(8-e);
f|=this[--b]>>(e+=this.DB-8)
}
else{
f=(this[b]>>(e-=8))&255;
if(e<=0){
e+=this.DB;
--b
}

}
if((f&128)!=0){
f|=-256
}
if(a==0&&(this.s&128)!=(f&128)){
++a
}
if(a>0||f!=this.s){
c[a++]=f
}

}

}
return c
}
function bnEquals(b){
return(this.compareTo(b)==0)
}
function bnMin(b){
return(this.compareTo(b)<0)?this:b
}
function bnMax(b){
return(this.compareTo(b)>0)?this:b
}
function bnpBitwiseTo(c,h,e){
var d,g,b=Math.min(c.t,this.t);
for(d=0;
d<b;
++d){
e[d]=h(this[d],c[d])
}
if(c.t<this.t){
g=c.s&this.DM;
for(d=b;
d<this.t;
++d){
e[d]=h(this[d],g)
}
e.t=this.t
}
else{
g=this.s&this.DM;
for(d=b;
d<c.t;
++d){
e[d]=h(g,c[d])
}
e.t=c.t
}
e.s=h(this.s,c.s);
e.clamp()
}
function op_and(a,b){
return a&b
}
function bnAnd(b){
var c=nbi();
this.bitwiseTo(b,op_and,c);
return c
}
function op_or(a,b){
return a|b
}
function bnOr(b){
var c=nbi();
this.bitwiseTo(b,op_or,c);
return c
}
function op_xor(a,b){
return a^b
}
function bnXor(b){
var c=nbi();
this.bitwiseTo(b,op_xor,c);
return c
}
function op_andnot(a,b){
return a&~b
}
function bnAndNot(b){
var c=nbi();
this.bitwiseTo(b,op_andnot,c);
return c
}
function bnNot(){
var b=nbi();
for(var a=0;
a<this.t;
++a){
b[a]=this.DM&~this[a]
}
b.t=this.t;
b.s=~this.s;
return b
}
function bnShiftLeft(b){
var a=nbi();
if(b<0){
this.rShiftTo(-b,a)
}
else{
this.lShiftTo(b,a)
}
return a
}
function bnShiftRight(b){
var a=nbi();
if(b<0){
this.lShiftTo(-b,a)
}
else{
this.rShiftTo(b,a)
}
return a
}
function lbit(a){
if(a==0){
return -1
}
var b=0;
if((a&65535)==0){
a>>=16;
b+=16
}
if((a&255)==0){
a>>=8;
b+=8
}
if((a&15)==0){
a>>=4;
b+=4
}
if((a&3)==0){
a>>=2;
b+=2
}
if((a&1)==0){
++b
}
return b
}
function bnGetLowestSetBit(){
for(var a=0;
a<this.t;
++a){
if(this[a]!=0){
return a*this.DB+lbit(this[a])
}

}
if(this.s<0){
return this.t*this.DB
}
return -1
}
function cbit(a){
var b=0;
while(a!=0){
a&=a-1;
++b
}
return b
}
function bnBitCount(){
var c=0,a=this.s&this.DM;
for(var b=0;
b<this.t;
++b){
c+=cbit(this[b]^a)
}
return c
}
function bnTestBit(b){
var a=Math.floor(b/this.DB);
if(a>=this.t){
return(this.s!=0)
}
return((this[a]&(1<<(b%this.DB)))!=0)
}
function bnpChangeBit(c,b){
var a=BigInteger.ONE.shiftLeft(c);
this.bitwiseTo(a,b,a);
return a
}
function bnSetBit(a){
return this.changeBit(a,op_or)
}
function bnClearBit(a){
return this.changeBit(a,op_andnot)
}
function bnFlipBit(a){
return this.changeBit(a,op_xor)
}
function bnpAddTo(d,f){
var e=0,g=0,b=Math.min(d.t,this.t);
while(e<b){
g+=this[e]+d[e];
f[e++]=g&this.DM;
g>>=this.DB
}
if(d.t<this.t){
g+=d.s;
while(e<this.t){
g+=this[e];
f[e++]=g&this.DM;
g>>=this.DB
}
g+=this.s
}
else{
g+=this.s;
while(e<d.t){
g+=d[e];
f[e++]=g&this.DM;
g>>=this.DB
}
g+=d.s
}
f.s=(g<0)?-1:0;
if(g>0){
f[e++]=g
}
else{
if(g<-1){
f[e++]=this.DV+g
}

}
f.t=e;
f.clamp()
}
function bnAdd(b){
var c=nbi();
this.addTo(b,c);
return c
}
function bnSubtract(b){
var c=nbi();
this.subTo(b,c);
return c
}
function bnMultiply(b){
var c=nbi();
this.multiplyTo(b,c);
return c
}
function bnSquare(){
var a=nbi();
this.squareTo(a);
return a
}
function bnDivide(b){
var c=nbi();
this.divRemTo(b,c,null);
return c
}
function bnRemainder(b){
var c=nbi();
this.divRemTo(b,null,c);
return c
}
function bnDivideAndRemainder(b){
var d=nbi(),c=nbi();
this.divRemTo(b,d,c);
return new Array(d,c)
}
function bnpDMultiply(a){
this[this.t]=this.am(0,a-1,this,0,0,this.t);
++this.t;
this.clamp()
}
function bnpDAddOffset(b,a){
if(b==0){
return
}
while(this.t<=a){
this[this.t++]=0
}
this[a]+=b;
while(this[a]>=this.DV){
this[a]-=this.DV;
if(++a>=this.t){
this[this.t++]=0
}
++this[a]
}

}
function NullExp(){

}
function nNop(a){
return a
}
function nMulTo(a,c,b){
a.multiplyTo(c,b)
}
function nSqrTo(a,b){
a.squareTo(b)
}
NullExp.prototype.convert=nNop;
NullExp.prototype.revert=nNop;
NullExp.prototype.mulTo=nMulTo;
NullExp.prototype.sqrTo=nSqrTo;
function bnPow(a){
return this.exp(a,new NullExp())
}
function bnpMultiplyLowerTo(b,f,e){
var d=Math.min(this.t+b.t,f);
e.s=0;
e.t=d;
while(d>0){
e[--d]=0
}
var c;
for(c=e.t-this.t;
d<c;
++d){
e[d+this.t]=this.am(0,b[d],e,d,0,this.t)
}
for(c=Math.min(b.t,f);
d<c;
++d){
this.am(0,b[d],e,d,0,f-d)
}
e.clamp()
}
function bnpMultiplyUpperTo(b,e,d){
--e;
var c=d.t=this.t+b.t-e;
d.s=0;
while(--c>=0){
d[c]=0
}
for(c=Math.max(e-this.t,0);
c<b.t;
++c){
d[this.t+c-e]=this.am(e-c,b[c],d,0,0,this.t+c-e)
}
d.clamp();
d.drShiftTo(1,d)
}
function Barrett(a){
this.r2=nbi();
this.q3=nbi();
BigInteger.ONE.dlShiftTo(2*a.t,this.r2);
this.mu=this.r2.divide(a);
this.m=a
}
function barrettConvert(a){
if(a.s<0||a.t>2*this.m.t){
return a.mod(this.m)
}
else{
if(a.compareTo(this.m)<0){
return a
}
else{
var b=nbi();
a.copyTo(b);
this.reduce(b);
return b
}

}

}
function barrettRevert(a){
return a
}
function barrettReduce(a){
a.drShiftTo(this.m.t-1,this.r2);
if(a.t>this.m.t+1){
a.t=this.m.t+1;
a.clamp()
}
this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);
this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);
while(a.compareTo(this.r2)<0){
a.dAddOffset(1,this.m.t+1)
}
a.subTo(this.r2,a);
while(a.compareTo(this.m)>=0){
a.subTo(this.m,a)
}

}
function barrettSqrTo(a,b){
a.squareTo(b);
this.reduce(b)
}
function barrettMulTo(a,c,b){
a.multiplyTo(c,b);
this.reduce(b)
}
Barrett.prototype.convert=barrettConvert;
Barrett.prototype.revert=barrettRevert;
Barrett.prototype.reduce=barrettReduce;
Barrett.prototype.mulTo=barrettMulTo;
Barrett.prototype.sqrTo=barrettSqrTo;





function bnModPow(q,f)
{
	var o=q.bitLength(),h,b=nbv(1),v;
	if(o<=0){
		return b;	
	}
	else{
		if(o<18){
			h=1;
		}
		else{
			if(o<48){
				h=3;
			}
			else{
				if(o<144){
					h=4;
				}
				else{
					if(o<768){
						h=5;		
					}
					else{
						h=6
					}
				}
			}
		}
	}
	if(o<8){
		v=new Classic(f);
	}
	else{
		if(f.isEven()){
			v=new Barrett(f);
		}
		else{
			v=new Montgomery(f);
		}
	}
	var p=new Array(),d=3,s=h-1,a=(1<<h)-1;
	p[1]=v.convert(this);
	if(h>1){
		var A=nbi();
		v.sqrTo(p[1],A);
		while(d<=a){
			p[d]=nbi();
			v.mulTo(A,p[d-2],p[d]);
			d+=2;		
		}
	}
	var l=q.t-1,x,u=true,c=nbi(),y;
	o=nbits(q[l])-1;
	while(l>=0){
		if(o>=s){
			x=(q[l]>>(o-s))&a;
		}
		else{
			x=(q[l]&((1<<(o+1))-1))<<(s-o);
			if(l>0){
				x|=q[l-1]>>(this.DB+o-s);
			}
		}
		d=h;
		while((x&1)==0){
			x>>=1;
            --d;
		}
        if((o-=d)<0){
        	o+=this.DB;
            --l;
		}
        if(u){
        	p[x].copyTo(b);
			u=false;
		}
		else{
			while(d>1){
				v.sqrTo(b,c);
				v.sqrTo(c,b);
				d-=2;
			}
			if(d>0){
				v.sqrTo(b,c);
			}
			else{
				y=b;
				b=c;
				c=y;
			}
			v.mulTo(c,p[x],b);
		}
		while(l>=0&&(q[l]&(1<<o))==0){
			v.sqrTo(b,c);
			y=b;
			b=c;
			c=y;
			if(--o<0){
				o=this.DB-1;
                --l;
			}
		}
	}
    return v.revert(b);
}

    


    function bnGCD(c){
var b=(this.s<0)?this.negate():this.clone();
var h=(c.s<0)?c.negate():c.clone();
if(b.compareTo(h)<0){
var e=b;
b=h;
h=e
}
var d=b.getLowestSetBit(),f=h.getLowestSetBit();
if(f<0){
return b
}
if(d<f){
f=d
}
if(f>0){
b.rShiftTo(f,b);
h.rShiftTo(f,h)
}
while(b.signum()>0){
if((d=b.getLowestSetBit())>0){
b.rShiftTo(d,b)
}
if((d=h.getLowestSetBit())>0){
h.rShiftTo(d,h)
}
if(b.compareTo(h)>=0){
b.subTo(h,b);
b.rShiftTo(1,b)
}
else{
h.subTo(b,h);
h.rShiftTo(1,h)
}

}
if(f>0){
h.lShiftTo(f,h)
}
return h
}
function bnpModInt(e){
if(e<=0){
return 0
}
var c=this.DV%e,b=(this.s<0)?e-1:0;
if(this.t>0){
if(c==0){
b=this[0]%e
}
else{
for(var a=this.t-1;
a>=0;
--a){
b=(c*b+this[a])%e
}

}

}
return b
}
function bnModInverse(f){
var j=f.isEven();
if((this.isEven()&&j)||f.signum()==0){
return BigInteger.ZERO
}
var i=f.clone(),h=this.clone();
var g=nbv(1),e=nbv(0),l=nbv(0),k=nbv(1);
while(i.signum()!=0){
while(i.isEven()){
i.rShiftTo(1,i);
if(j){
if(!g.isEven()||!e.isEven()){
g.addTo(this,g);
e.subTo(f,e)
}
g.rShiftTo(1,g)
}
else{
if(!e.isEven()){
e.subTo(f,e)
}

}
e.rShiftTo(1,e)
}
while(h.isEven()){
h.rShiftTo(1,h);
if(j){
if(!l.isEven()||!k.isEven()){
l.addTo(this,l);
k.subTo(f,k)
}
l.rShiftTo(1,l)
}
else{
if(!k.isEven()){
k.subTo(f,k)
}

}
k.rShiftTo(1,k)
}
if(i.compareTo(h)>=0){
i.subTo(h,i);
if(j){
g.subTo(l,g)
}
e.subTo(k,e)
}
else{
h.subTo(i,h);
if(j){
l.subTo(g,l)
}
k.subTo(e,k)
}

}
if(h.compareTo(BigInteger.ONE)!=0){
return BigInteger.ZERO
}
if(k.compareTo(f)>=0){
return k.subtract(f)
}
if(k.signum()<0){
k.addTo(f,k)
}
else{
return k
}
if(k.signum()<0){
return k.add(f)
}
else{
return k
}

}
var lowprimes=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997];
var lplim=(1<<26)/lowprimes[lowprimes.length-1];
function bnIsProbablePrime(e){
var d,b=this.abs();
if(b.t==1&&b[0]<=lowprimes[lowprimes.length-1]){
for(d=0;
d<lowprimes.length;
++d){
if(b[0]==lowprimes[d]){
return true
}

}
return false
}
if(b.isEven()){
return false
}
d=1;
while(d<lowprimes.length){
var a=lowprimes[d],c=d+1;
while(c<lowprimes.length&&a<lplim){
a*=lowprimes[c++]
}
a=b.modInt(a);
while(d<c){
if(a%lowprimes[d++]==0){
return false
}

}

}
return b.millerRabin(e)
}
function bnpMillerRabin(f){
var g=this.subtract(BigInteger.ONE);
var c=g.getLowestSetBit();
if(c<=0){
return false
}
var h=g.shiftRight(c);
f=(f+1)>>1;
if(f>lowprimes.length){
f=lowprimes.length
}
var b=nbi();
for(var e=0;
e<f;
++e){
b.fromInt(lowprimes[Math.floor(Math.random()*lowprimes.length)]);
var l=b.modPow(h,this);
if(l.compareTo(BigInteger.ONE)!=0&&l.compareTo(g)!=0){
var d=1;
while(d++<c&&l.compareTo(g)!=0){
l=l.modPowInt(2,this);
if(l.compareTo(BigInteger.ONE)==0){
return false
}

}
if(l.compareTo(g)!=0){
return false
}

}

}
return true
}
BigInteger.prototype.chunkSize=bnpChunkSize;
BigInteger.prototype.toRadix=bnpToRadix;
BigInteger.prototype.fromRadix=bnpFromRadix;
BigInteger.prototype.fromNumber=bnpFromNumber;
BigInteger.prototype.bitwiseTo=bnpBitwiseTo;
BigInteger.prototype.changeBit=bnpChangeBit;
BigInteger.prototype.addTo=bnpAddTo;
BigInteger.prototype.dMultiply=bnpDMultiply;
BigInteger.prototype.dAddOffset=bnpDAddOffset;
BigInteger.prototype.multiplyLowerTo=bnpMultiplyLowerTo;
BigInteger.prototype.multiplyUpperTo=bnpMultiplyUpperTo;
BigInteger.prototype.modInt=bnpModInt;
BigInteger.prototype.millerRabin=bnpMillerRabin;
BigInteger.prototype.clone=bnClone;
BigInteger.prototype.intValue=bnIntValue;
BigInteger.prototype.byteValue=bnByteValue;
BigInteger.prototype.shortValue=bnShortValue;
BigInteger.prototype.signum=bnSigNum;
BigInteger.prototype.toByteArray=bnToByteArray;
BigInteger.prototype.equals=bnEquals;
BigInteger.prototype.min=bnMin;
BigInteger.prototype.max=bnMax;
BigInteger.prototype.and=bnAnd;
BigInteger.prototype.or=bnOr;
BigInteger.prototype.xor=bnXor;
BigInteger.prototype.andNot=bnAndNot;
BigInteger.prototype.not=bnNot;
BigInteger.prototype.shiftLeft=bnShiftLeft;
BigInteger.prototype.shiftRight=bnShiftRight;
BigInteger.prototype.getLowestSetBit=bnGetLowestSetBit;
BigInteger.prototype.bitCount=bnBitCount;
BigInteger.prototype.testBit=bnTestBit;
BigInteger.prototype.setBit=bnSetBit;
BigInteger.prototype.clearBit=bnClearBit;
BigInteger.prototype.flipBit=bnFlipBit;
BigInteger.prototype.add=bnAdd;
BigInteger.prototype.subtract=bnSubtract;
BigInteger.prototype.multiply=bnMultiply;
BigInteger.prototype.divide=bnDivide;
BigInteger.prototype.remainder=bnRemainder;
BigInteger.prototype.divideAndRemainder=bnDivideAndRemainder;
BigInteger.prototype.modPow=bnModPow;
BigInteger.prototype.modInverse=bnModInverse;
BigInteger.prototype.pow=bnPow;
BigInteger.prototype.gcd=bnGCD;
BigInteger.prototype.isProbablePrime=bnIsProbablePrime;
BigInteger.prototype.square=bnSquare;

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function Arcfour(){
this.i=0;
this.j=0;
this.S=new Array()
}
function ARC4init(d){
var c,a,b;
for(c=0;
c<256;
++c){
this.S[c]=c
}
a=0;
for(c=0;
c<256;
++c){
a=(a+this.S[c]+d[c%d.length])&255;
b=this.S[c];
this.S[c]=this.S[a];
this.S[a]=b
}
this.i=0;
this.j=0
}
function ARC4next(){
var a;
this.i=(this.i+1)&255;
this.j=(this.j+this.S[this.i])&255;
a=this.S[this.i];
this.S[this.i]=this.S[this.j];
this.S[this.j]=a;
return this.S[(a+this.S[this.i])&255]
}
Arcfour.prototype.init=ARC4init;
Arcfour.prototype.next=ARC4next;
function prng_newstate(){
return new Arcfour()
}
var rng_psize=256;

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
var rng_state;
var rng_pool;
var rng_pptr;
function rng_seed_int(a){
rng_pool[rng_pptr++]^=a&255;
rng_pool[rng_pptr++]^=(a>>8)&255;
rng_pool[rng_pptr++]^=(a>>16)&255;
rng_pool[rng_pptr++]^=(a>>24)&255;
if(rng_pptr>=rng_psize){
rng_pptr-=rng_psize
}

}
function rng_seed_time(){
rng_seed_int(new Date().getTime())
}
if(rng_pool==null){
rng_pool=new Array();
rng_pptr=0;
var t;
if(window!==undefined&&(window.crypto!==undefined||window.msCrypto!==undefined)){
var crypto=window.crypto||window.msCrypto;
if(crypto.getRandomValues){
var ua=new Uint8Array(32);
crypto.getRandomValues(ua);
for(t=0;
t<32;
++t){
rng_pool[rng_pptr++]=ua[t]
}

}
else{
if(navigator.appName=="Netscape"&&navigator.appVersion<"5"){
var z=window.crypto.random(32);
for(t=0;
t<z.length;
++t){
rng_pool[rng_pptr++]=z.charCodeAt(t)&255
}

}

}

}
while(rng_pptr<rng_psize){
t=Math.floor(65536*Math.random());
rng_pool[rng_pptr++]=t>>>8;
rng_pool[rng_pptr++]=t&255
}
rng_pptr=0;
rng_seed_time()
}
function rng_get_byte(){
if(rng_state==null){
rng_seed_time();
rng_state=prng_newstate();
rng_state.init(rng_pool);
for(rng_pptr=0;
rng_pptr<rng_pool.length;
++rng_pptr){
rng_pool[rng_pptr]=0
}
rng_pptr=0
}
return rng_state.next()
}
function rng_get_bytes(b){
var a;
for(a=0;
a<b.length;
++a){
b[a]=rng_get_byte()
}

}
function SecureRandom(){

}
SecureRandom.prototype.nextBytes=rng_get_bytes;

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function parseBigInt(b,a){
return new BigInteger(b,a)
}
function linebrk(c,d){
var a="";
var b=0;
while(b+d<c.length){
a+=c.substring(b,b+d)+"\n";
b+=d
}
return a+c.substring(b,c.length)
}
function byte2Hex(a){
if(a<16){
return"0"+a.toString(16)
}
else{
return a.toString(16)
}

}
function pkcs1pad2(e,h){
if(h<e.length+11){
throw"Message too long for RSA";
return null
}
var g=new Array();
var d=e.length-1;
while(d>=0&&h>0){
var f=e.charCodeAt(d--);
if(f<128){
g[--h]=f
}
else{
if((f>127)&&(f<2048)){
g[--h]=(f&63)|128;
g[--h]=(f>>6)|192
}
else{
g[--h]=(f&63)|128;
g[--h]=((f>>6)&63)|128;
g[--h]=(f>>12)|224
}

}

}
g[--h]=0;
var b=new SecureRandom();
var a=new Array();
while(h>2){
a[0]=0;
while(a[0]==0){
b.nextBytes(a)
}
g[--h]=a[0]
}
g[--h]=2;
g[--h]=0;
return new BigInteger(g)
}
function oaep_mgf1_arr(c,a,e){
var b="",d=0;
while(b.length<a){
b+=e(String.fromCharCode.apply(String,c.concat([(d&4278190080)>>24,(d&16711680)>>16,(d&65280)>>8,d&255])));
d+=1
}
return b
}
function oaep_pad(q,a,f,l){
var c=KJUR.crypto.MessageDigest;
var o=KJUR.crypto.Util;
var b=null;
if(!f){
f="sha1"
}
if(typeof f==="string"){
b=c.getCanonicalAlgName(f);
l=c.getHashLength(b);
f=function(i){
return hextorstr(o.hashHex(rstrtohex(i),b))
}

}
if(q.length+2*l+2>a){
throw"Message too long for RSA"
}
var k="",e;
for(e=0;
e<a-q.length-2*l-2;
e+=1){
k+="\x00"
}
var h=f("")+k+"\x01"+q;
var g=new Array(l);
new SecureRandom().nextBytes(g);
var j=oaep_mgf1_arr(g,h.length,f);
var p=[];
for(e=0;
e<h.length;
e+=1){
p[e]=h.charCodeAt(e)^j.charCodeAt(e)
}
var m=oaep_mgf1_arr(p,g.length,f);
var d=[0];
for(e=0;
e<g.length;
e+=1){
d[e+1]=g[e]^m.charCodeAt(e)
}
return new BigInteger(d.concat(p))
}
function RSAKey(){
this.n=null;
this.e=0;
this.d=null;
this.p=null;
this.q=null;
this.dmp1=null;
this.dmq1=null;
this.coeff=null
}
function RSASetPublic(b,a){
this.isPublic=true;
this.isPrivate=false;
if(typeof b!=="string"){
this.n=b;
this.e=a
}
else{
if(b!=null&&a!=null&&b.length>0&&a.length>0){
this.n=parseBigInt(b,16);
this.e=parseInt(a,16)
}
else{
throw"Invalid RSA public key"
}

}

}
function RSADoPublic(a){
return a.modPowInt(this.e,this.n)
}
function RSAEncrypt(d){
var a=pkcs1pad2(d,(this.n.bitLength()+7)>>3);
if(a==null){
return null
}
var e=this.doPublic(a);
if(e==null){
return null
}
var b=e.toString(16);
if((b.length&1)==0){
return b
}
else{
return"0"+b
}

}
function RSAEncryptOAEP(f,e,b){
var a=oaep_pad(f,(this.n.bitLength()+7)>>3,e,b);
if(a==null){
return null
}
var g=this.doPublic(a);
if(g==null){
return null
}
var d=g.toString(16);
if((d.length&1)==0){
return d
}
else{
return"0"+d
}

}
RSAKey.prototype.doPublic=RSADoPublic;
RSAKey.prototype.setPublic=RSASetPublic;
RSAKey.prototype.encrypt=RSAEncrypt;
RSAKey.prototype.encryptOAEP=RSAEncryptOAEP;
RSAKey.prototype.type="RSA";

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function pkcs1unpad2(g,j){
var a=g.toByteArray();
var f=0;
while(f<a.length&&a[f]==0){
++f
}
if(a.length-f!=j-1||a[f]!=2){
return null
}
++f;
while(a[f]!=0){
if(++f>=a.length){
return null
}

}
var e="";
while(++f<a.length){
var h=a[f]&255;
if(h<128){
e+=String.fromCharCode(h)
}
else{
if((h>191)&&(h<224)){
e+=String.fromCharCode(((h&31)<<6)|(a[f+1]&63));
++f
}
else{
e+=String.fromCharCode(((h&15)<<12)|((a[f+1]&63)<<6)|(a[f+2]&63));
f+=2
}

}

}
return e
}
function oaep_mgf1_str(c,a,e){
var b="",d=0;
while(b.length<a){
b+=e(c+String.fromCharCode.apply(String,[(d&4278190080)>>24,(d&16711680)>>16,(d&65280)>>8,d&255]));
d+=1
}
return b
}
function oaep_unpad(o,b,g,p){
var e=KJUR.crypto.MessageDigest;
var r=KJUR.crypto.Util;
var c=null;
if(!g){
g="sha1"
}
if(typeof g==="string"){
c=e.getCanonicalAlgName(g);
p=e.getHashLength(c);
g=function(d){
return hextorstr(r.hashHex(rstrtohex(d),c))
}

}
o=o.toByteArray();
var h;
for(h=0;
h<o.length;
h+=1){
o[h]&=255
}
while(o.length<b){
o.unshift(0)
}
o=String.fromCharCode.apply(String,o);
if(o.length<2*p+2){
throw"Cipher too short"
}
var f=o.substr(1,p);
var s=o.substr(p+1);
var q=oaep_mgf1_str(s,p,g);
var k=[],h;
for(h=0;
h<f.length;
h+=1){
k[h]=f.charCodeAt(h)^q.charCodeAt(h)
}
var l=oaep_mgf1_str(String.fromCharCode.apply(String,k),o.length-p,g);
var j=[];
for(h=0;
h<s.length;
h+=1){
j[h]=s.charCodeAt(h)^l.charCodeAt(h)
}
j=String.fromCharCode.apply(String,j);
if(j.substr(0,p)!==g("")){
throw"Hash mismatch"
}
j=j.substr(p);
var a=j.indexOf("\x01");
var m=(a!=-1)?j.substr(0,a).lastIndexOf("\x00"):-1;
if(m+1!=a){
throw"Malformed data"
}
return j.substr(a+1)
}
function RSASetPrivate(c,a,b){
this.isPrivate=true;
if(typeof c!=="string"){
this.n=c;
this.e=a;
this.d=b
}
else{
if(c!=null&&a!=null&&c.length>0&&a.length>0){
this.n=parseBigInt(c,16);
this.e=parseInt(a,16);
this.d=parseBigInt(b,16)
}
else{
throw"Invalid RSA private key"
}

}

}
function RSASetPrivateEx(g,d,e,c,b,a,h,f){
this.isPrivate=true;
this.isPublic=false;
if(g==null){
throw"RSASetPrivateEx N == null"
}
if(d==null){
throw"RSASetPrivateEx E == null"
}
if(g.length==0){
throw"RSASetPrivateEx N.length == 0"
}
if(d.length==0){
throw"RSASetPrivateEx E.length == 0"
}
if(g!=null&&d!=null&&g.length>0&&d.length>0){
this.n=parseBigInt(g,16);
this.e=parseInt(d,16);
this.d=parseBigInt(e,16);
this.p=parseBigInt(c,16);
this.q=parseBigInt(b,16);
this.dmp1=parseBigInt(a,16);
this.dmq1=parseBigInt(h,16);
this.coeff=parseBigInt(f,16)
}
else{
throw"Invalid RSA private key in RSASetPrivateEx"
}

}
function RSAGenerate(b,i){
var a=new SecureRandom();
var f=b>>1;
this.e=parseInt(i,16);
var c=new BigInteger(i,16);
for(;
;
){
for(;
;
){
this.p=new BigInteger(b-f,1,a);
if(this.p.subtract(BigInteger.ONE).gcd(c).compareTo(BigInteger.ONE)==0&&this.p.isProbablePrime(10)){
break
}

}
for(;
;
){
this.q=new BigInteger(f,1,a);
if(this.q.subtract(BigInteger.ONE).gcd(c).compareTo(BigInteger.ONE)==0&&this.q.isProbablePrime(10)){
break
}

}
if(this.p.compareTo(this.q)<=0){
var h=this.p;
this.p=this.q;
this.q=h
}
var g=this.p.subtract(BigInteger.ONE);
var d=this.q.subtract(BigInteger.ONE);
var e=g.multiply(d);
if(e.gcd(c).compareTo(BigInteger.ONE)==0){
this.n=this.p.multiply(this.q);
this.d=c.modInverse(e);
this.dmp1=this.d.mod(g);
this.dmq1=this.d.mod(d);
this.coeff=this.q.modInverse(this.p);
break
}

}
this.isPrivate=true
}
function RSADoPrivate(a){
if(this.p==null||this.q==null){
return a.modPow(this.d,this.n)
}
var c=a.mod(this.p).modPow(this.dmp1,this.p);
var b=a.mod(this.q).modPow(this.dmq1,this.q);
while(c.compareTo(b)<0){
c=c.add(this.p)
}
return c.subtract(b).multiply(this.coeff).mod(this.p).multiply(this.q).add(b)
}
function RSADecrypt(b){
var d=parseBigInt(b,16);
var a=this.doPrivate(d);
if(a==null){
return null
}
return pkcs1unpad2(a,(this.n.bitLength()+7)>>3)
}
function RSADecryptOAEP(e,d,b){
var f=parseBigInt(e,16);
var a=this.doPrivate(f);
if(a==null){
return null
}
return oaep_unpad(a,(this.n.bitLength()+7)>>3,d,b)
}
RSAKey.prototype.doPrivate=RSADoPrivate;
RSAKey.prototype.setPrivate=RSASetPrivate;
RSAKey.prototype.setPrivateEx=RSASetPrivateEx;
RSAKey.prototype.generate=RSAGenerate;
RSAKey.prototype.decrypt=RSADecrypt;
RSAKey.prototype.decryptOAEP=RSADecryptOAEP;

if(typeof KJUR=="undefined"||!KJUR){
KJUR={

}

}
if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){
KJUR.asn1={

}

}
KJUR.asn1.ASN1Util=new function(){
this.integerToByteHex=function(a){
var b=a.toString(16);
if((b.length%2)==1){
b="0"+b
}
return b
}
;
this.bigIntToMinTwosComplementsHex=function(j){
var f=j.toString(16);
if(f.substr(0,1)!="-"){
if(f.length%2==1){
f="0"+f
}
else{
if(!f.match(/^[0-7]/)){
f="00"+f
}

}

}
else{
var a=f.substr(1);
var e=a.length;
if(e%2==1){
e+=1
}
else{
if(!f.match(/^[0-7]/)){
e+=2
}

}
var g="";
for(var d=0;
d<e;
d++){
g+="f"
}
var c=new BigInteger(g,16);
var b=c.xor(j).add(BigInteger.ONE);
f=b.toString(16).replace(/^-/,"")
}
return f
}
;
this.getPEMStringFromHex=function(a,b){
return hextopem(a,b)
}
;
this.newObject=function(k){
var D=KJUR,n=D.asn1,z=n.DERBoolean,e=n.DERInteger,s=n.DERBitString,h=n.DEROctetString,v=n.DERNull,w=n.DERObjectIdentifier,l=n.DEREnumerated,g=n.DERUTF8String,f=n.DERNumericString,y=n.DERPrintableString,u=n.DERTeletexString,p=n.DERIA5String,C=n.DERUTCTime,j=n.DERGeneralizedTime,m=n.DERSequence,c=n.DERSet,r=n.DERTaggedObject,o=n.ASN1Util.newObject;
var t=Object.keys(k);
if(t.length!=1){
throw"key of param shall be only one."
}
var F=t[0];
if(":bool:int:bitstr:octstr:null:oid:enum:utf8str:numstr:prnstr:telstr:ia5str:utctime:gentime:seq:set:tag:".indexOf(":"+F+":")==-1){
throw"undefined key: "+F
}
if(F=="bool"){
return new z(k[F])
}
if(F=="int"){
return new e(k[F])
}
if(F=="bitstr"){
return new s(k[F])
}
if(F=="octstr"){
return new h(k[F])
}
if(F=="null"){
return new v(k[F])
}
if(F=="oid"){
return new w(k[F])
}
if(F=="enum"){
return new l(k[F])
}
if(F=="utf8str"){
return new g(k[F])
}
if(F=="numstr"){
return new f(k[F])
}
if(F=="prnstr"){
return new y(k[F])
}
if(F=="telstr"){
return new u(k[F])
}
if(F=="ia5str"){
return new p(k[F])
}
if(F=="utctime"){
return new C(k[F])
}
if(F=="gentime"){
return new j(k[F])
}
if(F=="seq"){
var d=k[F];
var E=[];
for(var x=0;
x<d.length;
x++){
var B=o(d[x]);
E.push(B)
}
return new m({
array:E
}
)
}
if(F=="set"){
var d=k[F];
var E=[];
for(var x=0;
x<d.length;
x++){
var B=o(d[x]);
E.push(B)
}
return new c({
array:E
}
)
}
if(F=="tag"){
var A=k[F];
if(Object.prototype.toString.call(A)==="[object Array]"&&A.length==3){
var q=o(A[2]);
return new r({
tag:A[0],explicit:A[1],obj:q
}
)
}
else{
var b={

}
;
if(A.explicit!==undefined){
b.explicit=A.explicit
}
if(A.tag!==undefined){
b.tag=A.tag
}
if(A.obj===undefined){
throw"obj shall be specified for 'tag'."
}
b.obj=o(A.obj);
return new r(b)
}

}

}
;
this.jsonToASN1HEX=function(b){
var a=this.newObject(b);
return a.getEncodedHex()
}

}
;
KJUR.asn1.ASN1Util.oidHexToInt=function(a){
var j="";
var k=parseInt(a.substr(0,2),16);
var d=Math.floor(k/40);
var c=k%40;
var j=d+"."+c;
var e="";
for(var f=2;
f<a.length;
f+=2){
var g=parseInt(a.substr(f,2),16);
var h=("00000000"+g.toString(2)).slice(-8);
e=e+h.substr(1,7);
if(h.substr(0,1)=="0"){
var b=new BigInteger(e,2);
j=j+"."+b.toString(10);
e=""
}

}
return j
}
;
KJUR.asn1.ASN1Util.oidIntToHex=function(f){
var e=function(a){
var k=a.toString(16);
if(k.length==1){
k="0"+k
}
return k
}
;
var d=function(o){
var n="";
var k=new BigInteger(o,10);
var a=k.toString(2);
var l=7-a.length%7;
if(l==7){
l=0
}
var q="";
for(var m=0;
m<l;
m++){
q+="0"
}
a=q+a;
for(var m=0;
m<a.length-1;
m+=7){
var p=a.substr(m,7);
if(m!=a.length-7){
p="1"+p
}
n+=e(parseInt(p,2))
}
return n
}
;
if(!f.match(/^[0-9.]+$/)){
throw"malformed oid string: "+f
}
var g="";
var b=f.split(".");
var j=parseInt(b[0])*40+parseInt(b[1]);
g+=e(j);
b.splice(0,2);
for(var c=0;
c<b.length;
c++){
g+=d(b[c])
}
return g
}
;
KJUR.asn1.ASN1Object=function(){
var c=true;
var b=null;
var d="00";
var e="00";
var a="";
this.getLengthHexFromValue=function(){
if(typeof this.hV=="undefined"||this.hV==null){
throw"this.hV is null or undefined."
}
if(this.hV.length%2==1){
throw"value hex must be even length: n="+a.length+",v="+this.hV
}
var i=this.hV.length/2;
var h=i.toString(16);
if(h.length%2==1){
h="0"+h
}
if(i<128){
return h
}
else{
var g=h.length/2;
if(g>15){
throw"ASN.1 length too long to represent by 8x: n = "+i.toString(16)
}
var f=128+g;
return f.toString(16)+h
}

}
;
this.getEncodedHex=function(){
if(this.hTLV==null||this.isModified){
this.hV=this.getFreshValueHex();
this.hL=this.getLengthHexFromValue();
this.hTLV=this.hT+this.hL+this.hV;
this.isModified=false
}
return this.hTLV
}
;
this.getValueHex=function(){
this.getEncodedHex();
return this.hV
}
;
this.getFreshValueHex=function(){
return""
}

}
;
KJUR.asn1.DERAbstractString=function(c){
KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
var b=null;
var a=null;
this.getString=function(){
return this.s
}
;
this.setString=function(d){
this.hTLV=null;
this.isModified=true;
this.s=d;
this.hV=utf8tohex(this.s).toLowerCase()
}
;
this.setStringHex=function(d){
this.hTLV=null;
this.isModified=true;
this.s=null;
this.hV=d
}
;
this.getFreshValueHex=function(){
return this.hV
}
;
if(typeof c!="undefined"){
if(typeof c=="string"){
this.setString(c)
}
else{
if(typeof c.str!="undefined"){
this.setString(c.str)
}
else{
if(typeof c.hex!="undefined"){
this.setStringHex(c.hex)
}

}

}

}

}
;
YAHOO.lang.extend(KJUR.asn1.DERAbstractString,KJUR.asn1.ASN1Object);
KJUR.asn1.DERAbstractTime=function(c){
KJUR.asn1.DERAbstractTime.superclass.constructor.call(this);
var b=null;
var a=null;
this.localDateToUTC=function(f){
utc=f.getTime()+(f.getTimezoneOffset()*60000);
var e=new Date(utc);
return e
}
;
this.formatDate=function(m,o,e){
var g=this.zeroPadding;
var n=this.localDateToUTC(m);
var p=String(n.getFullYear());
if(o=="utc"){
p=p.substr(2,2)
}
var l=g(String(n.getMonth()+1),2);
var q=g(String(n.getDate()),2);
var h=g(String(n.getHours()),2);
var i=g(String(n.getMinutes()),2);
var j=g(String(n.getSeconds()),2);
var r=p+l+q+h+i+j;
if(e===true){
var f=n.getMilliseconds();
if(f!=0){
var k=g(String(f),3);
k=k.replace(/[0]+$/,"");
r=r+"."+k
}

}
return r+"Z"
}
;
this.zeroPadding=function(e,d){
if(e.length>=d){
return e
}
return new Array(d-e.length+1).join("0")+e
}
;
this.getString=function(){
return this.s
}
;
this.setString=function(d){
this.hTLV=null;
this.isModified=true;
this.s=d;
this.hV=stohex(d)
}
;
this.setByDateValue=function(h,j,e,d,f,g){
var i=new Date(Date.UTC(h,j-1,e,d,f,g,0));
this.setByDate(i)
}
;
this.getFreshValueHex=function(){
return this.hV
}

}
;
YAHOO.lang.extend(KJUR.asn1.DERAbstractTime,KJUR.asn1.ASN1Object);
KJUR.asn1.DERAbstractStructured=function(b){
KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
var a=null;
this.setByASN1ObjectArray=function(c){
this.hTLV=null;
this.isModified=true;
this.asn1Array=c
}
;
this.appendASN1Object=function(c){
this.hTLV=null;
this.isModified=true;
this.asn1Array.push(c)
}
;
this.asn1Array=new Array();
if(typeof b!="undefined"){
if(typeof b.array!="undefined"){
this.asn1Array=b.array
}

}

}
;
YAHOO.lang.extend(KJUR.asn1.DERAbstractStructured,KJUR.asn1.ASN1Object);
KJUR.asn1.DERBoolean=function(){
KJUR.asn1.DERBoolean.superclass.constructor.call(this);
this.hT="01";
this.hTLV="0101ff"
}
;
YAHOO.lang.extend(KJUR.asn1.DERBoolean,KJUR.asn1.ASN1Object);
KJUR.asn1.DERInteger=function(a){
KJUR.asn1.DERInteger.superclass.constructor.call(this);
this.hT="02";
this.setByBigInteger=function(b){
this.hTLV=null;
this.isModified=true;
this.hV=KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(b)
}
;
this.setByInteger=function(c){
var b=new BigInteger(String(c),10);
this.setByBigInteger(b)
}
;
this.setValueHex=function(b){
this.hV=b
}
;
this.getFreshValueHex=function(){
return this.hV
}
;
if(typeof a!="undefined"){
if(typeof a.bigint!="undefined"){
this.setByBigInteger(a.bigint)
}
else{
if(typeof a["int"]!="undefined"){
this.setByInteger(a["int"])
}
else{
if(typeof a=="number"){
this.setByInteger(a)
}
else{
if(typeof a.hex!="undefined"){
this.setValueHex(a.hex)
}

}

}

}

}

}
;
YAHOO.lang.extend(KJUR.asn1.DERInteger,KJUR.asn1.ASN1Object);
KJUR.asn1.DERBitString=function(b){
if(b!==undefined&&typeof b.obj!=="undefined"){
var a=KJUR.asn1.ASN1Util.newObject(b.obj);
b.hex="00"+a.getEncodedHex()
}
KJUR.asn1.DERBitString.superclass.constructor.call(this);
this.hT="03";
this.setHexValueIncludingUnusedBits=function(c){
this.hTLV=null;
this.isModified=true;
this.hV=c
}
;
this.setUnusedBitsAndHexValue=function(c,e){
if(c<0||7<c){
throw"unused bits shall be from 0 to 7: u = "+c
}
var d="0"+c;
this.hTLV=null;
this.isModified=true;
this.hV=d+e
}
;
this.setByBinaryString=function(e){
e=e.replace(/0+$/,"");
var f=8-e.length%8;
if(f==8){
f=0
}
for(var g=0;
g<=f;
g++){
e+="0"
}
var j="";
for(var g=0;
g<e.length-1;
g+=8){
var d=e.substr(g,8);
var c=parseInt(d,2).toString(16);
if(c.length==1){
c="0"+c
}
j+=c
}
this.hTLV=null;
this.isModified=true;
this.hV="0"+f+j
}
;
this.setByBooleanArray=function(e){
var d="";
for(var c=0;
c<e.length;
c++){
if(e[c]==true){
d+="1"
}
else{
d+="0"
}

}
this.setByBinaryString(d)
}
;
this.newFalseArray=function(e){
var c=new Array(e);
for(var d=0;
d<e;
d++){
c[d]=false
}
return c
}
;
this.getFreshValueHex=function(){
return this.hV
}
;
if(typeof b!="undefined"){
if(typeof b=="string"&&b.toLowerCase().match(/^[0-9a-f]+$/)){
this.setHexValueIncludingUnusedBits(b)
}
else{
if(typeof b.hex!="undefined"){
this.setHexValueIncludingUnusedBits(b.hex)
}
else{
if(typeof b.bin!="undefined"){
this.setByBinaryString(b.bin)
}
else{
if(typeof b.array!="undefined"){
this.setByBooleanArray(b.array)
}

}

}

}

}

}
;
YAHOO.lang.extend(KJUR.asn1.DERBitString,KJUR.asn1.ASN1Object);
KJUR.asn1.DEROctetString=function(b){
if(b!==undefined&&typeof b.obj!=="undefined"){
var a=KJUR.asn1.ASN1Util.newObject(b.obj);
b.hex=a.getEncodedHex()
}
KJUR.asn1.DEROctetString.superclass.constructor.call(this,b);
this.hT="04"
}
;
YAHOO.lang.extend(KJUR.asn1.DEROctetString,KJUR.asn1.DERAbstractString);
KJUR.asn1.DERNull=function(){
KJUR.asn1.DERNull.superclass.constructor.call(this);
this.hT="05";
this.hTLV="0500"
}
;
YAHOO.lang.extend(KJUR.asn1.DERNull,KJUR.asn1.ASN1Object);
KJUR.asn1.DERObjectIdentifier=function(c){
var b=function(d){
var e=d.toString(16);
if(e.length==1){
e="0"+e
}
return e
}
;
var a=function(k){
var j="";
var e=new BigInteger(k,10);
var d=e.toString(2);
var f=7-d.length%7;
if(f==7){
f=0
}
var m="";
for(var g=0;
g<f;
g++){
m+="0"
}
d=m+d;
for(var g=0;
g<d.length-1;
g+=7){
var l=d.substr(g,7);
if(g!=d.length-7){
l="1"+l
}
j+=b(parseInt(l,2))
}
return j
}
;
KJUR.asn1.DERObjectIdentifier.superclass.constructor.call(this);
this.hT="06";
this.setValueHex=function(d){
this.hTLV=null;
this.isModified=true;
this.s=null;
this.hV=d
}
;
this.setValueOidString=function(f){
if(!f.match(/^[0-9.]+$/)){
throw"malformed oid string: "+f
}
var g="";
var d=f.split(".");
var j=parseInt(d[0])*40+parseInt(d[1]);
g+=b(j);
d.splice(0,2);
for(var e=0;
e<d.length;
e++){
g+=a(d[e])
}
this.hTLV=null;
this.isModified=true;
this.s=null;
this.hV=g
}
;
this.setValueName=function(e){
var d=KJUR.asn1.x509.OID.name2oid(e);
if(d!==""){
this.setValueOidString(d)
}
else{
throw"DERObjectIdentifier oidName undefined: "+e
}

}
;
this.getFreshValueHex=function(){
return this.hV
}
;
if(c!==undefined){
if(typeof c==="string"){
if(c.match(/^[0-2].[0-9.]+$/)){
this.setValueOidString(c)
}
else{
this.setValueName(c)
}

}
else{
if(c.oid!==undefined){
this.setValueOidString(c.oid)
}
else{
if(c.hex!==undefined){
this.setValueHex(c.hex)
}
else{
if(c.name!==undefined){
this.setValueName(c.name)
}

}

}

}

}

}
;
YAHOO.lang.extend(KJUR.asn1.DERObjectIdentifier,KJUR.asn1.ASN1Object);
KJUR.asn1.DEREnumerated=function(a){
KJUR.asn1.DEREnumerated.superclass.constructor.call(this);
this.hT="0a";
this.setByBigInteger=function(b){
this.hTLV=null;
this.isModified=true;
this.hV=KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(b)
}
;
this.setByInteger=function(c){
var b=new BigInteger(String(c),10);
this.setByBigInteger(b)
}
;
this.setValueHex=function(b){
this.hV=b
}
;
this.getFreshValueHex=function(){
return this.hV
}
;
if(typeof a!="undefined"){
if(typeof a["int"]!="undefined"){
this.setByInteger(a["int"])
}
else{
if(typeof a=="number"){
this.setByInteger(a)
}
else{
if(typeof a.hex!="undefined"){
this.setValueHex(a.hex)
}

}

}

}

}
;
YAHOO.lang.extend(KJUR.asn1.DEREnumerated,KJUR.asn1.ASN1Object);
KJUR.asn1.DERUTF8String=function(a){
KJUR.asn1.DERUTF8String.superclass.constructor.call(this,a);
this.hT="0c"
}
;
YAHOO.lang.extend(KJUR.asn1.DERUTF8String,KJUR.asn1.DERAbstractString);
KJUR.asn1.DERNumericString=function(a){
KJUR.asn1.DERNumericString.superclass.constructor.call(this,a);
this.hT="12"
}
;
YAHOO.lang.extend(KJUR.asn1.DERNumericString,KJUR.asn1.DERAbstractString);
KJUR.asn1.DERPrintableString=function(a){
KJUR.asn1.DERPrintableString.superclass.constructor.call(this,a);
this.hT="13"
}
;
YAHOO.lang.extend(KJUR.asn1.DERPrintableString,KJUR.asn1.DERAbstractString);
KJUR.asn1.DERTeletexString=function(a){
KJUR.asn1.DERTeletexString.superclass.constructor.call(this,a);
this.hT="14"
}
;
YAHOO.lang.extend(KJUR.asn1.DERTeletexString,KJUR.asn1.DERAbstractString);
KJUR.asn1.DERIA5String=function(a){
KJUR.asn1.DERIA5String.superclass.constructor.call(this,a);
this.hT="16"
}
;
YAHOO.lang.extend(KJUR.asn1.DERIA5String,KJUR.asn1.DERAbstractString);
KJUR.asn1.DERUTCTime=function(a){
KJUR.asn1.DERUTCTime.superclass.constructor.call(this,a);
this.hT="17";
this.setByDate=function(b){
this.hTLV=null;
this.isModified=true;
this.date=b;
this.s=this.formatDate(this.date,"utc");
this.hV=stohex(this.s)
}
;
this.getFreshValueHex=function(){
if(typeof this.date=="undefined"&&typeof this.s=="undefined"){
this.date=new Date();
this.s=this.formatDate(this.date,"utc");
this.hV=stohex(this.s)
}
return this.hV
}
;
if(a!==undefined){
if(a.str!==undefined){
this.setString(a.str)
}
else{
if(typeof a=="string"&&a.match(/^[0-9]{12}Z$/)){
this.setString(a)
}
else{
if(a.hex!==undefined){
this.setStringHex(a.hex)
}
else{
if(a.date!==undefined){
this.setByDate(a.date)
}

}

}

}

}

}
;
YAHOO.lang.extend(KJUR.asn1.DERUTCTime,KJUR.asn1.DERAbstractTime);
KJUR.asn1.DERGeneralizedTime=function(a){
KJUR.asn1.DERGeneralizedTime.superclass.constructor.call(this,a);
this.hT="18";
this.withMillis=false;
this.setByDate=function(b){
this.hTLV=null;
this.isModified=true;
this.date=b;
this.s=this.formatDate(this.date,"gen",this.withMillis);
this.hV=stohex(this.s)
}
;
this.getFreshValueHex=function(){
if(this.date===undefined&&this.s===undefined){
this.date=new Date();
this.s=this.formatDate(this.date,"gen",this.withMillis);
this.hV=stohex(this.s)
}
return this.hV
}
;
if(a!==undefined){
if(a.str!==undefined){
this.setString(a.str)
}
else{
if(typeof a=="string"&&a.match(/^[0-9]{14}Z$/)){
this.setString(a)
}
else{
if(a.hex!==undefined){
this.setStringHex(a.hex)
}
else{
if(a.date!==undefined){
this.setByDate(a.date)
}

}

}

}
if(a.millis===true){
this.withMillis=true
}

}

}
;
YAHOO.lang.extend(KJUR.asn1.DERGeneralizedTime,KJUR.asn1.DERAbstractTime);
KJUR.asn1.DERSequence=function(a){
KJUR.asn1.DERSequence.superclass.constructor.call(this,a);
this.hT="30";
this.getFreshValueHex=function(){
var c="";
for(var b=0;
b<this.asn1Array.length;
b++){
var d=this.asn1Array[b];
c+=d.getEncodedHex()
}
this.hV=c;
return this.hV
}

}
;
YAHOO.lang.extend(KJUR.asn1.DERSequence,KJUR.asn1.DERAbstractStructured);
KJUR.asn1.DERSet=function(a){
KJUR.asn1.DERSet.superclass.constructor.call(this,a);
this.hT="31";
this.sortFlag=true;
this.getFreshValueHex=function(){
var b=new Array();
for(var c=0;
c<this.asn1Array.length;
c++){
var d=this.asn1Array[c];
b.push(d.getEncodedHex())
}
if(this.sortFlag==true){
b.sort()
}
this.hV=b.join("");
return this.hV
}
;
if(typeof a!="undefined"){
if(typeof a.sortflag!="undefined"&&a.sortflag==false){
this.sortFlag=false
}

}

}
;
YAHOO.lang.extend(KJUR.asn1.DERSet,KJUR.asn1.DERAbstractStructured);
KJUR.asn1.DERTaggedObject=function(a){
KJUR.asn1.DERTaggedObject.superclass.constructor.call(this);
this.hT="a0";
this.hV="";
this.isExplicit=true;
this.asn1Object=null;
this.setASN1Object=function(b,c,d){
this.hT=c;
this.isExplicit=b;
this.asn1Object=d;
if(this.isExplicit){
this.hV=this.asn1Object.getEncodedHex();
this.hTLV=null;
this.isModified=true
}
else{
this.hV=null;
this.hTLV=d.getEncodedHex();
this.hTLV=this.hTLV.replace(/^../,c);
this.isModified=false
}

}
;
this.getFreshValueHex=function(){
return this.hV
}
;
if(typeof a!="undefined"){
if(typeof a.tag!="undefined"){
this.hT=a.tag
}
if(typeof a.explicit!="undefined"){
this.isExplicit=a.explicit
}
if(typeof a.obj!="undefined"){
this.asn1Object=a.obj;
this.setASN1Object(this.isExplicit,this.hT,this.asn1Object)
}

}

}
;
YAHOO.lang.extend(KJUR.asn1.DERTaggedObject,KJUR.asn1.ASN1Object);

var ASN1HEX=new function(){

}
;
ASN1HEX.getLblen=function(c,a){
if(c.substr(a+2,1)!="8"){
return 1
}
var b=parseInt(c.substr(a+3,1));
if(b==0){
return -1
}
if(0<b&&b<10){
return b+1
}
return -2
}
;
ASN1HEX.getL=function(c,b){
var a=ASN1HEX.getLblen(c,b);
if(a<1){
return""
}
return c.substr(b+2,a*2)
}
;
ASN1HEX.getVblen=function(d,a){
var c,b;
c=ASN1HEX.getL(d,a);
if(c==""){
return -1
}
if(c.substr(0,1)==="8"){
b=new BigInteger(c.substr(2),16)
}
else{
b=new BigInteger(c,16)
}
return b.intValue()
}
;
ASN1HEX.getVidx=function(c,b){
var a=ASN1HEX.getLblen(c,b);
if(a<0){
return a
}
return b+(a+1)*2
}
;
ASN1HEX.getV=function(d,a){
var c=ASN1HEX.getVidx(d,a);
var b=ASN1HEX.getVblen(d,a);
return d.substr(c,b*2)
}
;
ASN1HEX.getTLV=function(b,a){
return b.substr(a,2)+ASN1HEX.getL(b,a)+ASN1HEX.getV(b,a)
}
;
ASN1HEX.getNextSiblingIdx=function(d,a){
var c=ASN1HEX.getVidx(d,a);
var b=ASN1HEX.getVblen(d,a);
return c+b*2
}
;
ASN1HEX.getChildIdx=function(e,f){
var j=ASN1HEX;
var g=new Array();
var i=j.getVidx(e,f);
if(e.substr(f,2)=="03"){
g.push(i+2)
}
else{
g.push(i)
}
var l=j.getVblen(e,f);
var c=i;
var d=0;
while(1){
var b=j.getNextSiblingIdx(e,c);
if(b==null||(b-i>=(l*2))){
break
}
if(d>=200){
break
}
g.push(b);
c=b;
d++
}
return g
}
;
ASN1HEX.getNthChildIdx=function(d,b,e){
var c=ASN1HEX.getChildIdx(d,b);
return c[e]
}
;
ASN1HEX.getIdxbyList=function(e,d,c,i){
var g=ASN1HEX;
var f,b;
if(c.length==0){
if(i!==undefined){
if(e.substr(d,2)!==i){
throw"checking tag doesn't match: "+e.substr(d,2)+"!="+i
}

}
return d
}
f=c.shift();
b=g.getChildIdx(e,d);
return g.getIdxbyList(e,b[f],c,i)
}
;
ASN1HEX.getTLVbyList=function(d,c,b,f){
var e=ASN1HEX;
var a=e.getIdxbyList(d,c,b);
if(a===undefined){
throw"can't find nthList object"
}
if(f!==undefined){
if(d.substr(a,2)!=f){
throw"checking tag doesn't match: "+d.substr(a,2)+"!="+f
}

}
return e.getTLV(d,a)
}
;
ASN1HEX.getVbyList=function(e,c,b,g,i){
var f=ASN1HEX;
var a,d;
a=f.getIdxbyList(e,c,b,g);
if(a===undefined){
throw"can't find nthList object"
}
d=f.getV(e,a);
if(i===true){
d=d.substr(2)
}
return d
}
;
ASN1HEX.hextooidstr=function(e){
var h=function(b,a){
if(b.length>=a){
return b
}
return new Array(a-b.length+1).join("0")+b
}
;
var l=[];
var o=e.substr(0,2);
var f=parseInt(o,16);
l[0]=new String(Math.floor(f/40));
l[1]=new String(f%40);
var m=e.substr(2);
var k=[];
for(var g=0;
g<m.length/2;
g++){
k.push(parseInt(m.substr(g*2,2),16))
}
var j=[];
var d="";
for(var g=0;
g<k.length;
g++){
if(k[g]&128){
d=d+h((k[g]&127).toString(2),7)
}
else{
d=d+h((k[g]&127).toString(2),7);
j.push(new String(parseInt(d,2)));
d=""
}

}
var n=l.join(".");
if(j.length>0){
n=n+"."+j.join(".")
}
return n
}
;
ASN1HEX.dump=function(t,c,l,g){
var p=ASN1HEX;
var j=p.getV;
var y=p.dump;
var w=p.getChildIdx;
var e=t;
if(t instanceof KJUR.asn1.ASN1Object){
e=t.getEncodedHex()
}
var q=function(A,i){
if(A.length<=i*2){
return A
}
else{
var v=A.substr(0,i)+"..(total "+A.length/2+"bytes).."+A.substr(A.length-i,i);
return v
}

}
;
if(c===undefined){
c={
ommit_long_octet:32
}

}
if(l===undefined){
l=0
}
if(g===undefined){
g=""
}
var x=c.ommit_long_octet;
if(e.substr(l,2)=="01"){
var h=j(e,l);
if(h=="00"){
return g+"BOOLEAN FALSE\n"
}
else{
return g+"BOOLEAN TRUE\n"
}

}
if(e.substr(l,2)=="02"){
var h=j(e,l);
return g+"INTEGER "+q(h,x)+"\n"
}
if(e.substr(l,2)=="03"){
var h=j(e,l);
return g+"BITSTRING "+q(h,x)+"\n"
}
if(e.substr(l,2)=="04"){
var h=j(e,l);
if(p.isASN1HEX(h)){
var k=g+"OCTETSTRING, encapsulates\n";
k=k+y(h,c,0,g+"  ");
return k
}
else{
return g+"OCTETSTRING "+q(h,x)+"\n"
}

}
if(e.substr(l,2)=="05"){
return g+"NULL\n"
}
if(e.substr(l,2)=="06"){
var m=j(e,l);
var a=KJUR.asn1.ASN1Util.oidHexToInt(m);
var o=KJUR.asn1.x509.OID.oid2name(a);
var b=a.replace(/\./g," ");
if(o!=""){
return g+"ObjectIdentifier "+o+" ("+b+")\n"
}
else{
return g+"ObjectIdentifier ("+b+")\n"
}

}
if(e.substr(l,2)=="0c"){
return g+"UTF8String '"+hextoutf8(j(e,l))+"'\n"
}
if(e.substr(l,2)=="13"){
return g+"PrintableString '"+hextoutf8(j(e,l))+"'\n"
}
if(e.substr(l,2)=="14"){
return g+"TeletexString '"+hextoutf8(j(e,l))+"'\n"
}
if(e.substr(l,2)=="16"){
return g+"IA5String '"+hextoutf8(j(e,l))+"'\n"
}
if(e.substr(l,2)=="17"){
return g+"UTCTime "+hextoutf8(j(e,l))+"\n"
}
if(e.substr(l,2)=="18"){
return g+"GeneralizedTime "+hextoutf8(j(e,l))+"\n"
}
if(e.substr(l,2)=="30"){
if(e.substr(l,4)=="3000"){
return g+"SEQUENCE {}\n"
}
var k=g+"SEQUENCE\n";
var d=w(e,l);
var f=c;
if((d.length==2||d.length==3)&&e.substr(d[0],2)=="06"&&e.substr(d[d.length-1],2)=="04"){
var o=p.oidname(j(e,d[0]));
var r=JSON.parse(JSON.stringify(c));
r.x509ExtName=o;
f=r
}
for(var u=0;
u<d.length;
u++){
k=k+y(e,f,d[u],g+"  ")
}
return k
}
if(e.substr(l,2)=="31"){
var k=g+"SET\n";
var d=w(e,l);
for(var u=0;
u<d.length;
u++){
k=k+y(e,c,d[u],g+"  ")
}
return k
}
var z=parseInt(e.substr(l,2),16);
if((z&128)!=0){
var n=z&31;
if((z&32)!=0){
var k=g+"["+n+"]\n";
var d=w(e,l);
for(var u=0;
u<d.length;
u++){
k=k+y(e,c,d[u],g+"  ")
}
return k
}
else{
var h=j(e,l);
if(h.substr(0,8)=="68747470"){
h=hextoutf8(h)
}
if(c.x509ExtName==="subjectAltName"&&n==2){
h=hextoutf8(h)
}
var k=g+"["+n+"] "+h+"\n";
return k
}

}
return g+"UNKNOWN("+e.substr(l,2)+") "+j(e,l)+"\n"
}
;
ASN1HEX.isASN1HEX=function(e){
var d=ASN1HEX;
if(e.length%2==1){
return false
}
var c=d.getVblen(e,0);
var b=e.substr(0,2);
var f=d.getL(e,0);
var a=e.length-b.length-f.length;
if(a==c*2){
return true
}
return false
}
;
ASN1HEX.oidname=function(a){
var c=KJUR.asn1;
if(KJUR.lang.String.isHex(a)){
a=c.ASN1Util.oidHexToInt(a)
}
var b=c.x509.OID.oid2name(a);
if(b===""){
b=a
}
return b
}
;

var KJUR;
if(typeof KJUR=="undefined"||!KJUR){
KJUR={

}

}
if(typeof KJUR.lang=="undefined"||!KJUR.lang){
KJUR.lang={

}

}
KJUR.lang.String=function(){

}
;
function Base64x(){

}
function stoBA(d){
var b=new Array();
for(var c=0;
c<d.length;
c++){
b[c]=d.charCodeAt(c)
}
return b
}
function BAtos(b){
var d="";
for(var c=0;
c<b.length;
c++){
d=d+String.fromCharCode(b[c])
}
return d
}
function BAtohex(b){
var e="";
for(var d=0;
d<b.length;
d++){
var c=b[d].toString(16);
if(c.length==1){
c="0"+c
}
e=e+c
}
return e
}
function stohex(a){
return BAtohex(stoBA(a))
}
function stob64(a){
return hex2b64(stohex(a))
}
function stob64u(a){
return b64tob64u(hex2b64(stohex(a)))
}
function b64utos(a){
return BAtos(b64toBA(b64utob64(a)))
}
function b64tob64u(a){
a=a.replace(/\=/g,"");
a=a.replace(/\+/g,"-");
a=a.replace(/\//g,"_");
return a
}
function b64utob64(a){
if(a.length%4==2){
a=a+"=="
}
else{
if(a.length%4==3){
a=a+"="
}

}
a=a.replace(/-/g,"+");
a=a.replace(/_/g,"/");
return a
}
function hextob64u(a){
if(a.length%2==1){
a="0"+a
}
return b64tob64u(hex2b64(a))
}
function b64utohex(a){
return b64tohex(b64utob64(a))
}
var utf8tob64u,b64utoutf8;
if(typeof Buffer==="function"){
utf8tob64u=function(a){
return b64tob64u(new Buffer(a,"utf8").toString("base64"))
}
;
b64utoutf8=function(a){
return new Buffer(b64utob64(a),"base64").toString("utf8")
}

}
else{
utf8tob64u=function(a){
return hextob64u(uricmptohex(encodeURIComponentAll(a)))
}
;
b64utoutf8=function(a){
return decodeURIComponent(hextouricmp(b64utohex(a)))
}

}
function utf8tob64(a){
return hex2b64(uricmptohex(encodeURIComponentAll(a)))
}
function b64toutf8(a){
return decodeURIComponent(hextouricmp(b64tohex(a)))
}
function utf8tohex(a){
return uricmptohex(encodeURIComponentAll(a))
}
function hextoutf8(a){
return decodeURIComponent(hextouricmp(a))
}
function hextorstr(c){
var b="";
for(var a=0;
a<c.length-1;
a+=2){
b+=String.fromCharCode(parseInt(c.substr(a,2),16))
}
return b
}
function rstrtohex(c){
var a="";
for(var b=0;
b<c.length;
b++){
a+=("0"+c.charCodeAt(b).toString(16)).slice(-2)
}
return a
}
function hextob64(a){
return hex2b64(a)
}
function hextob64nl(b){
var a=hextob64(b);
var c=a.replace(/(.{64})/g,"$1\r\n");
c=c.replace(/\r\n$/,"");
return c
}
function b64nltohex(b){
var a=b.replace(/[^0-9A-Za-z\/+=]*/g,"");
var c=b64tohex(a);
return c
}
function hextopem(a,b){
var c=hextob64nl(a);
return"-----BEGIN "+b+"-----\r\n"+c+"\r\n-----END "+b+"-----\r\n"
}
function pemtohex(a,b){
if(a.indexOf("-----BEGIN ")==-1){
throw"can't find PEM header: "+b
}
if(b!==undefined){
a=a.replace("-----BEGIN "+b+"-----","");
a=a.replace("-----END "+b+"-----","")
}
else{
a=a.replace(/-----BEGIN [^-]+-----/,"");
a=a.replace(/-----END [^-]+-----/,"")
}
return b64nltohex(a)
}
function hextoArrayBuffer(d){
if(d.length%2!=0){
throw"input is not even length"
}
if(d.match(/^[0-9A-Fa-f]+$/)==null){
throw"input is not hexadecimal"
}
var b=new ArrayBuffer(d.length/2);
var a=new DataView(b);
for(var c=0;
c<d.length/2;
c++){
a.setUint8(c,parseInt(d.substr(c*2,2),16))
}
return b
}
function ArrayBuffertohex(b){
var d="";
var a=new DataView(b);
for(var c=0;
c<b.byteLength;
c++){
d+=("00"+a.getUint8(c).toString(16)).slice(-2)
}
return d
}
function zulutomsec(n){
var l,j,m,e,f,i,b,k;
var a,h,g,c;
c=n.match(/^(\d{2}|\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(|\.\d+)Z$/);
if(c){
a=c[1];
l=parseInt(a);
if(a.length===2){
if(50<=l&&l<100){
l=1900+l
}
else{
if(0<=l&&l<50){
l=2000+l
}

}

}
j=parseInt(c[2])-1;
m=parseInt(c[3]);
e=parseInt(c[4]);
f=parseInt(c[5]);
i=parseInt(c[6]);
b=0;
h=c[7];
if(h!==""){
g=(h.substr(1)+"00").substr(0,3);
b=parseInt(g)
}
return Date.UTC(l,j,m,e,f,i,b)
}
throw"unsupported zulu format: "+n
}
function zulutosec(a){
var b=zulutomsec(a);
return ~~(b/1000)
}
function zulutodate(a){
return new Date(zulutomsec(a))
}
function datetozulu(g,e,f){
var b;
var a=g.getUTCFullYear();
if(e){
if(a<1950||2049<a){
throw"not proper year for UTCTime: "+a
}
b=(""+a).slice(-2)
}
else{
b=("000"+a).slice(-4)
}
b+=("0"+(g.getUTCMonth()+1)).slice(-2);
b+=("0"+g.getUTCDate()).slice(-2);
b+=("0"+g.getUTCHours()).slice(-2);
b+=("0"+g.getUTCMinutes()).slice(-2);
b+=("0"+g.getUTCSeconds()).slice(-2);
if(f){
var c=g.getUTCMilliseconds();
if(c!==0){
c=("00"+c).slice(-3);
c=c.replace(/0+$/g,"");
b+="."+c
}

}
b+="Z";
return b
}
function uricmptohex(a){
return a.replace(/%/g,"")
}
function hextouricmp(a){
return a.replace(/(..)/g,"%$1")
}
function ipv6tohex(g){
var b="malformed IPv6 address";
if(!g.match(/^[0-9A-Fa-f:]+$/)){
throw b
}
g=g.toLowerCase();
var d=g.split(":").length-1;
if(d<2){
throw b
}
var e=":".repeat(7-d+2);
g=g.replace("::",e);
var c=g.split(":");
if(c.length!=8){
throw b
}
for(var f=0;
f<8;
f++){
c[f]=("0000"+c[f]).slice(-4)
}
return c.join("")
}
function hextoipv6(e){
if(!e.match(/^[0-9A-Fa-f]{32}$/)){
throw"malformed IPv6 address octet"
}
e=e.toLowerCase();
var b=e.match(/.{1,4}/g);
for(var d=0;
d<8;
d++){
b[d]=b[d].replace(/^0+/,"");
if(b[d]==""){
b[d]="0"
}

}
e=":"+b.join(":")+":";
var c=e.match(/:(0:){2,}/g);
if(c===null){
return e.slice(1,-1)
}
var f="";
for(var d=0;
d<c.length;
d++){
if(c[d].length>f.length){
f=c[d]
}

}
e=e.replace(f,"::");
return e.slice(1,-1)
}
function hextoip(b){
var d="malformed hex value";
if(!b.match(/^([0-9A-Fa-f][0-9A-Fa-f]){1,}$/)){
throw d
}
if(b.length==8){
var c;
try{
c=parseInt(b.substr(0,2),16)+"."+parseInt(b.substr(2,2),16)+"."+parseInt(b.substr(4,2),16)+"."+parseInt(b.substr(6,2),16);
return c
}
catch(a){
throw d
}

}
else{
if(b.length==32){
return hextoipv6(b)
}
else{
return b
}

}

}
function iptohex(f){
var j="malformed IP address";
f=f.toLowerCase(f);
if(f.match(/^[0-9.]+$/)){
var b=f.split(".");
if(b.length!==4){
throw j
}
var g="";
try{
for(var e=0;
e<4;
e++){
var h=parseInt(b[e]);
g+=("0"+h.toString(16)).slice(-2)
}
return g
}
catch(c){
throw j
}

}
else{
if(f.match(/^[0-9a-f:]+$/)&&f.indexOf(":")!==-1){
return ipv6tohex(f)
}
else{
throw j
}

}

}
function encodeURIComponentAll(a){
var d=encodeURIComponent(a);
var b="";
for(var c=0;
c<d.length;
c++){
if(d[c]=="%"){
b=b+d.substr(c,3);
c=c+2
}
else{
b=b+"%"+stohex(d[c])
}

}
return b
}
function newline_toUnix(a){
a=a.replace(/\r\n/mg,"\n");
return a
}
function newline_toDos(a){
a=a.replace(/\r\n/mg,"\n");
a=a.replace(/\n/mg,"\r\n");
return a
}
KJUR.lang.String.isInteger=function(a){
if(a.match(/^[0-9]+$/)){
return true
}
else{
if(a.match(/^-[0-9]+$/)){
return true
}
else{
return false
}

}

}
;
KJUR.lang.String.isHex=function(a){
if(a.length%2==0&&(a.match(/^[0-9a-f]+$/)||a.match(/^[0-9A-F]+$/))){
return true
}
else{
return false
}

}
;
KJUR.lang.String.isBase64=function(a){
a=a.replace(/\s+/g,"");
if(a.match(/^[0-9A-Za-z+\/]+={0,3}$/)&&a.length%4==0){
return true
}
else{
return false
}

}
;
KJUR.lang.String.isBase64URL=function(a){
if(a.match(/[+/=]/)){
return false
}
a=b64utob64(a);
return KJUR.lang.String.isBase64(a)
}
;
KJUR.lang.String.isIntegerArray=function(a){
a=a.replace(/\s+/g,"");
if(a.match(/^\[[0-9,]+\]$/)){
return true
}
else{
return false
}

}
;
function hextoposhex(a){
if(a.length%2==1){
return"0"+a
}
if(a.substr(0,1)>"7"){
return"00"+a
}
return a
}
function intarystrtohex(b){
b=b.replace(/^\s*\[\s*/,"");
b=b.replace(/\s*\]\s*$/,"");
b=b.replace(/\s*/g,"");
try{
var c=b.split(/,/).map(function(g,e,h){
var f=parseInt(g);
if(f<0||255<f){
throw"integer not in range 0-255"
}
var d=("00"+f.toString(16)).slice(-2);
return d
}
).join("");
return c
}
catch(a){
throw"malformed integer array string: "+a
}

}
var strdiffidx=function(c,a){
var d=c.length;
if(c.length>a.length){
d=a.length
}
for(var b=0;
b<d;
b++){
if(c.charCodeAt(b)!=a.charCodeAt(b)){
return b
}

}
if(c.length!=a.length){
return d
}
return -1
}
;

if(typeof KJUR=="undefined"||!KJUR){
KJUR={

}

}
if(typeof KJUR.crypto=="undefined"||!KJUR.crypto){
KJUR.crypto={

}

}
KJUR.crypto.Util=new function(){
this.DIGESTINFOHEAD={
sha1:"3021300906052b0e03021a05000414",sha224:"302d300d06096086480165030402040500041c",sha256:"3031300d060960864801650304020105000420",sha384:"3041300d060960864801650304020205000430",sha512:"3051300d060960864801650304020305000440",md2:"3020300c06082a864886f70d020205000410",md5:"3020300c06082a864886f70d020505000410",ripemd160:"3021300906052b2403020105000414",
}
;
this.DEFAULTPROVIDER={
md5:"cryptojs",sha1:"cryptojs",sha224:"cryptojs",sha256:"cryptojs",sha384:"cryptojs",sha512:"cryptojs",ripemd160:"cryptojs",hmacmd5:"cryptojs",hmacsha1:"cryptojs",hmacsha224:"cryptojs",hmacsha256:"cryptojs",hmacsha384:"cryptojs",hmacsha512:"cryptojs",hmacripemd160:"cryptojs",MD5withRSA:"cryptojs/jsrsa",SHA1withRSA:"cryptojs/jsrsa",SHA224withRSA:"cryptojs/jsrsa",SHA256withRSA:"cryptojs/jsrsa",SHA384withRSA:"cryptojs/jsrsa",SHA512withRSA:"cryptojs/jsrsa",RIPEMD160withRSA:"cryptojs/jsrsa",MD5withECDSA:"cryptojs/jsrsa",SHA1withECDSA:"cryptojs/jsrsa",SHA224withECDSA:"cryptojs/jsrsa",SHA256withECDSA:"cryptojs/jsrsa",SHA384withECDSA:"cryptojs/jsrsa",SHA512withECDSA:"cryptojs/jsrsa",RIPEMD160withECDSA:"cryptojs/jsrsa",SHA1withDSA:"cryptojs/jsrsa",SHA224withDSA:"cryptojs/jsrsa",SHA256withDSA:"cryptojs/jsrsa",MD5withRSAandMGF1:"cryptojs/jsrsa",SHA1withRSAandMGF1:"cryptojs/jsrsa",SHA224withRSAandMGF1:"cryptojs/jsrsa",SHA256withRSAandMGF1:"cryptojs/jsrsa",SHA384withRSAandMGF1:"cryptojs/jsrsa",SHA512withRSAandMGF1:"cryptojs/jsrsa",RIPEMD160withRSAandMGF1:"cryptojs/jsrsa",
}
;
this.CRYPTOJSMESSAGEDIGESTNAME={
md5:CryptoJS.algo.MD5,sha1:CryptoJS.algo.SHA1,sha224:CryptoJS.algo.SHA224,sha256:CryptoJS.algo.SHA256,sha384:CryptoJS.algo.SHA384,sha512:CryptoJS.algo.SHA512,ripemd160:CryptoJS.algo.RIPEMD160
}
;
this.getDigestInfoHex=function(a,b){
if(typeof this.DIGESTINFOHEAD[b]=="undefined"){
throw"alg not supported in Util.DIGESTINFOHEAD: "+b
}
return this.DIGESTINFOHEAD[b]+a
}
;
this.getPaddedDigestInfoHex=function(h,a,j){
var c=this.getDigestInfoHex(h,a);
var d=j/4;
if(c.length+22>d){
throw"key is too short for SigAlg: keylen="+j+","+a
}
var b="0001";
var k="00"+c;
var g="";
var l=d-b.length-k.length;
for(var f=0;
f<l;
f+=2){
g+="ff"
}
var e=b+g+k;
return e
}
;
this.hashString=function(a,c){
var b=new KJUR.crypto.MessageDigest({
alg:c
}
);
return b.digestString(a)
}
;
this.hashHex=function(b,c){
var a=new KJUR.crypto.MessageDigest({
alg:c
}
);
return a.digestHex(b)
}
;
this.sha1=function(a){
var b=new KJUR.crypto.MessageDigest({
alg:"sha1",prov:"cryptojs"
}
);
return b.digestString(a)
}
;
this.sha256=function(a){
var b=new KJUR.crypto.MessageDigest({
alg:"sha256",prov:"cryptojs"
}
);
return b.digestString(a)
}
;
this.sha256Hex=function(a){
var b=new KJUR.crypto.MessageDigest({
alg:"sha256",prov:"cryptojs"
}
);
return b.digestHex(a)
}
;
this.sha512=function(a){
var b=new KJUR.crypto.MessageDigest({
alg:"sha512",prov:"cryptojs"
}
);
return b.digestString(a)
}
;
this.sha512Hex=function(a){
var b=new KJUR.crypto.MessageDigest({
alg:"sha512",prov:"cryptojs"
}
);
return b.digestHex(a)
}

}
;
KJUR.crypto.Util.md5=function(a){
var b=new KJUR.crypto.MessageDigest({
alg:"md5",prov:"cryptojs"
}
);
return b.digestString(a)
}
;
KJUR.crypto.Util.ripemd160=function(a){
var b=new KJUR.crypto.MessageDigest({
alg:"ripemd160",prov:"cryptojs"
}
);
return b.digestString(a)
}
;
KJUR.crypto.Util.SECURERANDOMGEN=new SecureRandom();
KJUR.crypto.Util.getRandomHexOfNbytes=function(b){
var a=new Array(b);
KJUR.crypto.Util.SECURERANDOMGEN.nextBytes(a);
return BAtohex(a)
}
;
KJUR.crypto.Util.getRandomBigIntegerOfNbytes=function(a){
return new BigInteger(KJUR.crypto.Util.getRandomHexOfNbytes(a),16)
}
;
KJUR.crypto.Util.getRandomHexOfNbits=function(d){
var c=d%8;
var a=(d-c)/8;
var b=new Array(a+1);
KJUR.crypto.Util.SECURERANDOMGEN.nextBytes(b);
b[0]=(((255<<c)&255)^255)&b[0];
return BAtohex(b)
}
;
KJUR.crypto.Util.getRandomBigIntegerOfNbits=function(a){
return new BigInteger(KJUR.crypto.Util.getRandomHexOfNbits(a),16)
}
;
KJUR.crypto.Util.getRandomBigIntegerZeroToMax=function(b){
var a=b.bitLength();
while(1){
var c=KJUR.crypto.Util.getRandomBigIntegerOfNbits(a);
if(b.compareTo(c)!=-1){
return c
}

}

}
;
KJUR.crypto.Util.getRandomBigIntegerMinToMax=function(e,b){
var c=e.compareTo(b);
if(c==1){
throw"biMin is greater than biMax"
}
if(c==0){
return e
}
var a=b.subtract(e);
var d=KJUR.crypto.Util.getRandomBigIntegerZeroToMax(a);
return d.add(e)
}
;
KJUR.crypto.MessageDigest=function(c){
var b=null;
var a=null;
var d=null;
this.setAlgAndProvider=function(g,f){
g=KJUR.crypto.MessageDigest.getCanonicalAlgName(g);
if(g!==null&&f===undefined){
f=KJUR.crypto.Util.DEFAULTPROVIDER[g]
}
if(":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(g)!=-1&&f=="cryptojs"){
try{
this.md=KJUR.crypto.Util.CRYPTOJSMESSAGEDIGESTNAME[g].create()
}
catch(e){
throw"setAlgAndProvider hash alg set fail alg="+g+"/"+e
}
this.updateString=function(h){
this.md.update(h)
}
;
this.updateHex=function(h){
var i=CryptoJS.enc.Hex.parse(h);
this.md.update(i)
}
;
this.digest=function(){
var h=this.md.finalize();
return h.toString(CryptoJS.enc.Hex)
}
;
this.digestString=function(h){
this.updateString(h);
return this.digest()
}
;
this.digestHex=function(h){
this.updateHex(h);
return this.digest()
}

}
if(":sha256:".indexOf(g)!=-1&&f=="sjcl"){
try{
this.md=new sjcl.hash.sha256()
}
catch(e){
throw"setAlgAndProvider hash alg set fail alg="+g+"/"+e
}
this.updateString=function(h){
this.md.update(h)
}
;
this.updateHex=function(i){
var h=sjcl.codec.hex.toBits(i);
this.md.update(h)
}
;
this.digest=function(){
var h=this.md.finalize();
return sjcl.codec.hex.fromBits(h)
}
;
this.digestString=function(h){
this.updateString(h);
return this.digest()
}
;
this.digestHex=function(h){
this.updateHex(h);
return this.digest()
}

}

}
;
this.updateString=function(e){
throw"updateString(str) not supported for this alg/prov: "+this.algName+"/"+this.provName
}
;
this.updateHex=function(e){
throw"updateHex(hex) not supported for this alg/prov: "+this.algName+"/"+this.provName
}
;
this.digest=function(){
throw"digest() not supported for this alg/prov: "+this.algName+"/"+this.provName
}
;
this.digestString=function(e){
throw"digestString(str) not supported for this alg/prov: "+this.algName+"/"+this.provName
}
;
this.digestHex=function(e){
throw"digestHex(hex) not supported for this alg/prov: "+this.algName+"/"+this.provName
}
;
if(c!==undefined){
if(c.alg!==undefined){
this.algName=c.alg;
if(c.prov===undefined){
this.provName=KJUR.crypto.Util.DEFAULTPROVIDER[this.algName]
}
this.setAlgAndProvider(this.algName,this.provName)
}

}

}
;
KJUR.crypto.MessageDigest.getCanonicalAlgName=function(a){
if(typeof a==="string"){
a=a.toLowerCase();
a=a.replace(/-/,"")
}
return a
}
;
KJUR.crypto.MessageDigest.getHashLength=function(c){
var b=KJUR.crypto.MessageDigest;
var a=b.getCanonicalAlgName(c);
if(b.HASHLENGTH[a]===undefined){
throw"not supported algorithm: "+c
}
return b.HASHLENGTH[a]
}
;
KJUR.crypto.MessageDigest.HASHLENGTH={
md5:16,sha1:20,sha224:28,sha256:32,sha384:48,sha512:64,ripemd160:20
}
;
KJUR.crypto.Mac=function(d){
var f=null;
var c=null;
var a=null;
var e=null;
var b=null;
this.setAlgAndProvider=function(k,i){
k=k.toLowerCase();
if(k==null){
k="hmacsha1"
}
k=k.toLowerCase();
if(k.substr(0,4)!="hmac"){
throw"setAlgAndProvider unsupported HMAC alg: "+k
}
if(i===undefined){
i=KJUR.crypto.Util.DEFAULTPROVIDER[k]
}
this.algProv=k+"/"+i;
var g=k.substr(4);
if(":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(g)!=-1&&i=="cryptojs"){
try{
var j=KJUR.crypto.Util.CRYPTOJSMESSAGEDIGESTNAME[g];
this.mac=CryptoJS.algo.HMAC.create(j,this.pass)
}
catch(h){
throw"setAlgAndProvider hash alg set fail hashAlg="+g+"/"+h
}
this.updateString=function(l){
this.mac.update(l)
}
;
this.updateHex=function(l){
var m=CryptoJS.enc.Hex.parse(l);
this.mac.update(m)
}
;
this.doFinal=function(){
var l=this.mac.finalize();
return l.toString(CryptoJS.enc.Hex)
}
;
this.doFinalString=function(l){
this.updateString(l);
return this.doFinal()
}
;
this.doFinalHex=function(l){
this.updateHex(l);
return this.doFinal()
}

}

}
;
this.updateString=function(g){
throw"updateString(str) not supported for this alg/prov: "+this.algProv
}
;
this.updateHex=function(g){
throw"updateHex(hex) not supported for this alg/prov: "+this.algProv
}
;
this.doFinal=function(){
throw"digest() not supported for this alg/prov: "+this.algProv
}
;
this.doFinalString=function(g){
throw"digestString(str) not supported for this alg/prov: "+this.algProv
}
;
this.doFinalHex=function(g){
throw"digestHex(hex) not supported for this alg/prov: "+this.algProv
}
;
this.setPassword=function(h){
if(typeof h=="string"){
var g=h;
if(h.length%2==1||!h.match(/^[0-9A-Fa-f]+$/)){
g=rstrtohex(h)
}
this.pass=CryptoJS.enc.Hex.parse(g);
return
}
if(typeof h!="object"){
throw"KJUR.crypto.Mac unsupported password type: "+h
}
var g=null;
if(h.hex!==undefined){
if(h.hex.length%2!=0||!h.hex.match(/^[0-9A-Fa-f]+$/)){
throw"Mac: wrong hex password: "+h.hex
}
g=h.hex
}
if(h.utf8!==undefined){
g=utf8tohex(h.utf8)
}
if(h.rstr!==undefined){
g=rstrtohex(h.rstr)
}
if(h.b64!==undefined){
g=b64tohex(h.b64)
}
if(h.b64u!==undefined){
g=b64utohex(h.b64u)
}
if(g==null){
throw"KJUR.crypto.Mac unsupported password type: "+h
}
this.pass=CryptoJS.enc.Hex.parse(g)
}
;
if(d!==undefined){
if(d.pass!==undefined){
this.setPassword(d.pass)
}
if(d.alg!==undefined){
this.algName=d.alg;
if(d.prov===undefined){
this.provName=KJUR.crypto.Util.DEFAULTPROVIDER[this.algName]
}
this.setAlgAndProvider(this.algName,this.provName)
}

}

}
;
KJUR.crypto.Signature=function(o){
var q=null;
var n=null;
var r=null;
var c=null;
var l=null;
var d=null;
var k=null;
var h=null;
var p=null;
var e=null;
var b=-1;
var g=null;
var j=null;
var a=null;
var i=null;
var f=null;
this._setAlgNames=function(){
var s=this.algName.match(/^(.+)with(.+)$/);
if(s){
this.mdAlgName=s[1].toLowerCase();
this.pubkeyAlgName=s[2].toLowerCase()
}

}
;
this._zeroPaddingOfSignature=function(x,w){
var v="";
var t=w/4-x.length;
for(var u=0;
u<t;
u++){
v=v+"0"
}
return v+x
}
;
this.setAlgAndProvider=function(u,t){
this._setAlgNames();
if(t!="cryptojs/jsrsa"){
throw"provider not supported: "+t
}
if(":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(this.mdAlgName)!=-1){
try{
this.md=new KJUR.crypto.MessageDigest({
alg:this.mdAlgName
}
)
}
catch(s){
throw"setAlgAndProvider hash alg set fail alg="+this.mdAlgName+"/"+s
}
this.init=function(w,x){
var y=null;
try{
if(x===undefined){
y=KEYUTIL.getKey(w)
}
else{
y=KEYUTIL.getKey(w,x)
}

}
catch(v){
throw"init failed:"+v
}
if(y.isPrivate===true){
this.prvKey=y;
this.state="SIGN"
}
else{
if(y.isPublic===true){
this.pubKey=y;
this.state="VERIFY"
}
else{
throw"init failed.:"+y
}

}

}
;
this.updateString=function(v){
this.md.updateString(v)
}
;
this.updateHex=function(v){
this.md.updateHex(v)
}
;
this.sign=function(){
this.sHashHex=this.md.digest();
if(typeof this.ecprvhex!="undefined"&&typeof this.eccurvename!="undefined"){
var v=new KJUR.crypto.ECDSA({
curve:this.eccurvename
}
);
this.hSign=v.signHex(this.sHashHex,this.ecprvhex)
}
else{
if(this.prvKey instanceof RSAKey&&this.pubkeyAlgName==="rsaandmgf1"){
this.hSign=this.prvKey.signWithMessageHashPSS(this.sHashHex,this.mdAlgName,this.pssSaltLen)
}
else{
if(this.prvKey instanceof RSAKey&&this.pubkeyAlgName==="rsa"){
this.hSign=this.prvKey.signWithMessageHash(this.sHashHex,this.mdAlgName)
}
else{
if(this.prvKey instanceof KJUR.crypto.ECDSA){
this.hSign=this.prvKey.signWithMessageHash(this.sHashHex)
}
else{
if(this.prvKey instanceof KJUR.crypto.DSA){
this.hSign=this.prvKey.signWithMessageHash(this.sHashHex)
}
else{
throw"Signature: unsupported private key alg: "+this.pubkeyAlgName
}

}

}

}

}
return this.hSign
}
;
this.signString=function(v){
this.updateString(v);
return this.sign()
}
;
this.signHex=function(v){
this.updateHex(v);
return this.sign()
}
;
this.verify=function(v){
this.sHashHex=this.md.digest();
if(typeof this.ecpubhex!="undefined"&&typeof this.eccurvename!="undefined"){
var w=new KJUR.crypto.ECDSA({
curve:this.eccurvename
}
);
return w.verifyHex(this.sHashHex,v,this.ecpubhex)
}
else{
if(this.pubKey instanceof RSAKey&&this.pubkeyAlgName==="rsaandmgf1"){
return this.pubKey.verifyWithMessageHashPSS(this.sHashHex,v,this.mdAlgName,this.pssSaltLen)
}
else{
if(this.pubKey instanceof RSAKey&&this.pubkeyAlgName==="rsa"){
return this.pubKey.verifyWithMessageHash(this.sHashHex,v)
}
else{
if(KJUR.crypto.ECDSA!==undefined&&this.pubKey instanceof KJUR.crypto.ECDSA){
return this.pubKey.verifyWithMessageHash(this.sHashHex,v)
}
else{
if(KJUR.crypto.DSA!==undefined&&this.pubKey instanceof KJUR.crypto.DSA){
return this.pubKey.verifyWithMessageHash(this.sHashHex,v)
}
else{
throw"Signature: unsupported public key alg: "+this.pubkeyAlgName
}

}

}

}

}

}

}

}
;
this.init=function(s,t){
throw"init(key, pass) not supported for this alg:prov="+this.algProvName
}
;
this.updateString=function(s){
throw"updateString(str) not supported for this alg:prov="+this.algProvName
}
;
this.updateHex=function(s){
throw"updateHex(hex) not supported for this alg:prov="+this.algProvName
}
;
this.sign=function(){
throw"sign() not supported for this alg:prov="+this.algProvName
}
;
this.signString=function(s){
throw"digestString(str) not supported for this alg:prov="+this.algProvName
}
;
this.signHex=function(s){
throw"digestHex(hex) not supported for this alg:prov="+this.algProvName
}
;
this.verify=function(s){
throw"verify(hSigVal) not supported for this alg:prov="+this.algProvName
}
;
this.initParams=o;
if(o!==undefined){
if(o.alg!==undefined){
this.algName=o.alg;
if(o.prov===undefined){
this.provName=KJUR.crypto.Util.DEFAULTPROVIDER[this.algName]
}
else{
this.provName=o.prov
}
this.algProvName=this.algName+":"+this.provName;
this.setAlgAndProvider(this.algName,this.provName);
this._setAlgNames()
}
if(o.psssaltlen!==undefined){
this.pssSaltLen=o.psssaltlen
}
if(o.prvkeypem!==undefined){
if(o.prvkeypas!==undefined){
throw"both prvkeypem and prvkeypas parameters not supported"
}
else{
try{
var q=KEYUTIL.getKey(o.prvkeypem);
this.init(q)
}
catch(m){
throw"fatal error to load pem private key: "+m
}

}

}

}

}
;
KJUR.crypto.Cipher=function(a){

}
;
KJUR.crypto.Cipher.encrypt=function(e,f,d){
if(f instanceof RSAKey&&f.isPublic){
var c=KJUR.crypto.Cipher.getAlgByKeyAndName(f,d);
if(c==="RSA"){
return f.encrypt(e)
}
if(c==="RSAOAEP"){
return f.encryptOAEP(e,"sha1")
}
var b=c.match(/^RSAOAEP(\d+)$/);
if(b!==null){
return f.encryptOAEP(e,"sha"+b[1])
}
throw"Cipher.encrypt: unsupported algorithm for RSAKey: "+d
}
else{
throw"Cipher.encrypt: unsupported key or algorithm"
}

}
;
KJUR.crypto.Cipher.decrypt=function(e,f,d){
if(f instanceof RSAKey&&f.isPrivate){
var c=KJUR.crypto.Cipher.getAlgByKeyAndName(f,d);
if(c==="RSA"){
return f.decrypt(e)
}
if(c==="RSAOAEP"){
return f.decryptOAEP(e,"sha1")
}
var b=c.match(/^RSAOAEP(\d+)$/);
if(b!==null){
return f.decryptOAEP(e,"sha"+b[1])
}
throw"Cipher.decrypt: unsupported algorithm for RSAKey: "+d
}
else{
throw"Cipher.decrypt: unsupported key or algorithm"
}

}
;
KJUR.crypto.Cipher.getAlgByKeyAndName=function(b,a){
if(b instanceof RSAKey){
if(":RSA:RSAOAEP:RSAOAEP224:RSAOAEP256:RSAOAEP384:RSAOAEP512:".indexOf(a)!=-1){
return a
}
if(a===null||a===undefined){
return"RSA"
}
throw"getAlgByKeyAndName: not supported algorithm name for RSAKey: "+a
}
throw"getAlgByKeyAndName: not supported algorithm name: "+a
}
;
KJUR.crypto.OID=new function(){
this.oidhex2name={
"2a864886f70d010101":"rsaEncryption","2a8648ce3d0201":"ecPublicKey","2a8648ce380401":"dsa","2a8648ce3d030107":"secp256r1","2b8104001f":"secp192k1","2b81040021":"secp224r1","2b8104000a":"secp256k1","2b81040023":"secp521r1","2b81040022":"secp384r1","2a8648ce380403":"SHA1withDSA","608648016503040301":"SHA224withDSA","608648016503040302":"SHA256withDSA",
}

}
;

RSAKey.getPosArrayOfChildrenFromHex=function(a){
return ASN1HEX.getChildIdx(a,0)
}
;
RSAKey.getHexValueArrayOfChildrenFromHex=function(f){
var n=ASN1HEX;
var i=n.getV;
var k=RSAKey.getPosArrayOfChildrenFromHex(f);
var e=i(f,k[0]);
var j=i(f,k[1]);
var b=i(f,k[2]);
var c=i(f,k[3]);
var h=i(f,k[4]);
var g=i(f,k[5]);
var m=i(f,k[6]);
var l=i(f,k[7]);
var d=i(f,k[8]);
var k=new Array();
k.push(e,j,b,c,h,g,m,l,d);
return k
}
;
RSAKey.prototype.readPrivateKeyFromPEMString=function(d){
var c=pemtohex(d);
var b=RSAKey.getHexValueArrayOfChildrenFromHex(c);
this.setPrivateEx(b[1],b[2],b[3],b[4],b[5],b[6],b[7],b[8])
}
;
RSAKey.prototype.readPKCS5PrvKeyHex=function(c){
var b=RSAKey.getHexValueArrayOfChildrenFromHex(c);
this.setPrivateEx(b[1],b[2],b[3],b[4],b[5],b[6],b[7],b[8])
}
;
RSAKey.prototype.readPKCS8PrvKeyHex=function(e){
var c,j,l,b,a,f,d,k;
var m=ASN1HEX;
var g=m.getVbyList;
if(m.isASN1HEX(e)===false){
throw"not ASN.1 hex string"
}
try{
c=g(e,0,[2,0,1],"02");
j=g(e,0,[2,0,2],"02");
l=g(e,0,[2,0,3],"02");
b=g(e,0,[2,0,4],"02");
a=g(e,0,[2,0,5],"02");
f=g(e,0,[2,0,6],"02");
d=g(e,0,[2,0,7],"02");
k=g(e,0,[2,0,8],"02")
}
catch(i){
throw"malformed PKCS#8 plain RSA private key"
}
this.setPrivateEx(c,j,l,b,a,f,d,k)
}
;
RSAKey.prototype.readPKCS5PubKeyHex=function(c){
var e=ASN1HEX;
var b=e.getV;
if(e.isASN1HEX(c)===false){
throw"keyHex is not ASN.1 hex string"
}
var a=e.getChildIdx(c,0);
if(a.length!==2||c.substr(a[0],2)!=="02"||c.substr(a[1],2)!=="02"){
throw"wrong hex for PKCS#5 public key"
}
var f=b(c,a[0]);
var d=b(c,a[1]);
this.setPublic(f,d)
}
;
RSAKey.prototype.readPKCS8PubKeyHex=function(b){
var c=ASN1HEX;
if(c.isASN1HEX(b)===false){
throw"not ASN.1 hex string"
}
if(c.getTLVbyList(b,0,[0,0])!=="06092a864886f70d010101"){
throw"not PKCS8 RSA public key"
}
var a=c.getTLVbyList(b,0,[1,0]);
this.readPKCS5PubKeyHex(a)
}
;
RSAKey.prototype.readCertPubKeyHex=function(b,d){
var a,c;
a=new X509();
a.readCertHex(b);
c=a.getPublicKeyHex();
this.readPKCS8PubKeyHex(c)
}
;

var _RE_HEXDECONLY=new RegExp("");
_RE_HEXDECONLY.compile("[^0-9a-f]","gi");
function _rsasign_getHexPaddedDigestInfoForString(d,e,a){
var b=function(f){
return KJUR.crypto.Util.hashString(f,a)
}
;
var c=b(d);
return KJUR.crypto.Util.getPaddedDigestInfoHex(c,a,e)
}
function _zeroPaddingOfSignature(e,d){
var c="";
var a=d/4-e.length;
for(var b=0;
b<a;
b++){
c=c+"0"
}
return c+e
}
RSAKey.prototype.sign=function(d,a){
var b=function(e){
return KJUR.crypto.Util.hashString(e,a)
}
;
var c=b(d);
return this.signWithMessageHash(c,a)
}
;
RSAKey.prototype.signWithMessageHash=function(e,c){
var f=KJUR.crypto.Util.getPaddedDigestInfoHex(e,c,this.n.bitLength());
var b=parseBigInt(f,16);
var d=this.doPrivate(b);
var a=d.toString(16);
return _zeroPaddingOfSignature(a,this.n.bitLength())
}
;
function pss_mgf1_str(c,a,e){
var b="",d=0;
while(b.length<a){
b+=hextorstr(e(rstrtohex(c+String.fromCharCode.apply(String,[(d&4278190080)>>24,(d&16711680)>>16,(d&65280)>>8,d&255]))));
d+=1
}
return b
}
RSAKey.prototype.signPSS=function(e,a,d){
var c=function(f){
return KJUR.crypto.Util.hashHex(f,a)
}
;
var b=c(rstrtohex(e));
if(d===undefined){
d=-1
}
return this.signWithMessageHashPSS(b,a,d)
}
;
RSAKey.prototype.signWithMessageHashPSS=function(l,a,k){
var b=hextorstr(l);
var g=b.length;
var m=this.n.bitLength()-1;
var c=Math.ceil(m/8);
var d;
var o=function(i){
return KJUR.crypto.Util.hashHex(i,a)
}
;
if(k===-1||k===undefined){
k=g
}
else{
if(k===-2){
k=c-g-2
}
else{
if(k<-2){
throw"invalid salt length"
}

}

}
if(c<(g+k+2)){
throw"data too long"
}
var f="";
if(k>0){
f=new Array(k);
new SecureRandom().nextBytes(f);
f=String.fromCharCode.apply(String,f)
}
var n=hextorstr(o(rstrtohex("\x00\x00\x00\x00\x00\x00\x00\x00"+b+f)));
var j=[];
for(d=0;
d<c-k-g-2;
d+=1){
j[d]=0
}
var e=String.fromCharCode.apply(String,j)+"\x01"+f;
var h=pss_mgf1_str(n,e.length,o);
var q=[];
for(d=0;
d<e.length;
d+=1){
q[d]=e.charCodeAt(d)^h.charCodeAt(d)
}
var p=(65280>>(8*c-m))&255;
q[0]&=~p;
for(d=0;
d<g;
d++){
q.push(n.charCodeAt(d))
}
q.push(188);
return _zeroPaddingOfSignature(this.doPrivate(new BigInteger(q)).toString(16),this.n.bitLength())
}
;
function _rsasign_getDecryptSignatureBI(a,d,c){
var b=new RSAKey();
b.setPublic(d,c);
var e=b.doPublic(a);
return e
}
function _rsasign_getHexDigestInfoFromSig(a,c,b){
var e=_rsasign_getDecryptSignatureBI(a,c,b);
var d=e.toString(16).replace(/^1f+00/,"");
return d
}
function _rsasign_getAlgNameAndHashFromHexDisgestInfo(f){
for(var e in KJUR.crypto.Util.DIGESTINFOHEAD){
var d=KJUR.crypto.Util.DIGESTINFOHEAD[e];
var b=d.length;
if(f.substring(0,b)==d){
var c=[e,f.substring(b)];
return c
}

}
return[]
}
RSAKey.prototype.verify=function(f,j){
j=j.replace(_RE_HEXDECONLY,"");
j=j.replace(/[ \n]+/g,"");
var b=parseBigInt(j,16);
if(b.bitLength()>this.n.bitLength()){
return 0
}
var i=this.doPublic(b);
var e=i.toString(16).replace(/^1f+00/,"");
var g=_rsasign_getAlgNameAndHashFromHexDisgestInfo(e);
if(g.length==0){
return false
}
var d=g[0];
var h=g[1];
var a=function(k){
return KJUR.crypto.Util.hashString(k,d)
}
;
var c=a(f);
return(h==c)
}
;
RSAKey.prototype.verifyWithMessageHash=function(e,a){
a=a.replace(_RE_HEXDECONLY,"");
a=a.replace(/[ \n]+/g,"");
var b=parseBigInt(a,16);
if(b.bitLength()>this.n.bitLength()){
return 0
}
var h=this.doPublic(b);
var g=h.toString(16).replace(/^1f+00/,"");
var c=_rsasign_getAlgNameAndHashFromHexDisgestInfo(g);
if(c.length==0){
return false
}
var d=c[0];
var f=c[1];
return(f==e)
}
;
RSAKey.prototype.verifyPSS=function(c,b,a,f){
var e=function(g){
return KJUR.crypto.Util.hashHex(g,a)
}
;
var d=e(rstrtohex(c));
if(f===undefined){
f=-1
}
return this.verifyWithMessageHashPSS(d,b,a,f)
}
;
RSAKey.prototype.verifyWithMessageHashPSS=function(f,s,l,c){
var k=new BigInteger(s,16);
if(k.bitLength()>this.n.bitLength()){
return false
}
var r=function(i){
return KJUR.crypto.Util.hashHex(i,l)
}
;
var j=hextorstr(f);
var h=j.length;
var g=this.n.bitLength()-1;
var m=Math.ceil(g/8);
var q;
if(c===-1||c===undefined){
c=h
}
else{
if(c===-2){
c=m-h-2
}
else{
if(c<-2){
throw"invalid salt length"
}

}

}
if(m<(h+c+2)){
throw"data too long"
}
var a=this.doPublic(k).toByteArray();
for(q=0;
q<a.length;
q+=1){
a[q]&=255
}
while(a.length<m){
a.unshift(0)
}
if(a[m-1]!==188){
throw"encoded message does not end in 0xbc"
}
a=String.fromCharCode.apply(String,a);
var d=a.substr(0,m-h-1);
var e=a.substr(d.length,h);
var p=(65280>>(8*m-g))&255;
if((d.charCodeAt(0)&p)!==0){
throw"bits beyond keysize not zero"
}
var n=pss_mgf1_str(e,d.length,r);
var o=[];
for(q=0;
q<d.length;
q+=1){
o[q]=d.charCodeAt(q)^n.charCodeAt(q)
}
o[0]&=~p;
var b=m-h-c-2;
for(q=0;
q<b;
q+=1){
if(o[q]!==0){
throw"leftmost octets not zero"
}

}
if(o[b]!==1){
throw"0x01 marker not found"
}
return e===hextorstr(r(rstrtohex("\x00\x00\x00\x00\x00\x00\x00\x00"+j+String.fromCharCode.apply(String,o.slice(-c)))))
}
;
RSAKey.SALT_LEN_HLEN=-1;
RSAKey.SALT_LEN_MAX=-2;
RSAKey.SALT_LEN_RECOVER=-2;








