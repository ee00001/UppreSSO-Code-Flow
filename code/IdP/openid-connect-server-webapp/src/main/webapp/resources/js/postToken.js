(function () {
	// 从 fragment 中提取参数
	const hash = window.location.hash.substring(1);
	const params = new URLSearchParams(hash);

	const accessToken = params.get('access_token');
	const idToken = params.get('id_token');

	if (!accessToken || !idToken) {
		alert('登录失败：缺少 token');
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
		access_token: accessToken,
		id_token: idToken
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
