(function () {
	// fragment 中提取参数
	const queryParams = new URLSearchParams(window.location.search);
	const code = queryParams.get('code');
	const state = queryParams.get('state');

	if (!code) {
		alert('登录失败：缺少 authorization code');
		return;
	}

	// 尝试从 sessionStorage 获取 cert
	let cert = sessionStorage.getItem("cert");
	let redirectUri = null;

	if (cert) {
		// 解析 cert 获取 redirect_uri
		const [, payloadB64] = cert.split('.');
		const payloadObj = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
		redirectUri = payloadObj.redirect_uri;
	}

	// 如果没有 cert，则从 sessionStorage 获取 redirect_url
	if (!cert) {
		redirectUri = sessionStorage.getItem("redirect_url");
		if (!redirectUri) {
			alert('登录失败：缺少 cert 和 redirect_url');
			return;
		}
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
