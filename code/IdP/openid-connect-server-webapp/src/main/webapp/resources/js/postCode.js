(function () {
	// fragment 中提取参数
	const queryParams = new URLSearchParams(window.location.search);
	const code = queryParams.get('code');
	const state = queryParams.get('state');

	if (!code) {
		alert('登录失败：缺少 authorization code');
		return;
	}

	const cert = sessionStorage.getItem("cert");
	if (!cert) {
		alert('登录失败：缺少 cert');
		return;
	}

	const [, payloadB64] = cert.split('.');
	const payloadObj = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
	const redirectUri = payloadObj.redirect_uri;

	if (!redirectUri) {
		alert('登录失败：redirect_uri 缺失');
		return;
	}

	const body = JSON.stringify({
		code:  code,
		state: state
	});

	const url = new URL(redirectUri);
	const base = `${url.protocol}//${url.host}`;
	const authEndpoint = `${base}/authorization`;

	fetch(authEndpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: body,
		credentials: 'include'
	})
		.then(res => res.json())
		.then(data => {
			if (data.result === 'ok') {
				alert('登录成功');
			} else if (data.result === 'register') {
				alert('首次登录，已注册');
			} else {
				alert('登录失败');
			}
		})
		.catch(err => {
			console.error(err);
			alert('网络或服务器错误');
		});
})();
