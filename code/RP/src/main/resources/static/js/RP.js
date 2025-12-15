let cert = "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJSUF9JRCI6IjA0NGJjMDA4NWRhOTFkYTJiZDUzYTZmOWQ4ODExZDIxYjQ4MjE1N2FhMzdjNmE2YmFhZGMwZDA0ZGZkN2E0MTE0ODU1N2QyMzJjM2VhNTliMzU3YTU1MDJiODBjZjFlMzMxMzM4MWE5MzA2YmJkMjFiMTk3NGYyOTM4MTE3ZTA0MjEiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwOTAiLCJyZWRpcmVjdF91cmkiOiJodHRwOi8vbG9jYWxob3N0OjgwOTAiLCJSUF9uYW1lIjoicHJvdG90eXBlIiwiaWF0IjoxNzQ5MzEwMjg2fQ.304502207b7367f44274ffbb7e8ff155fa004dab82839c8c4ba1e9f89dda734544e10d0e02210084856de34d6141f6eb80dbaf32d94d243e09a14f15a2461cfe4581c6e8ec0b6f";
let IdPDomain = "http://localhost:8080";
let RPDomain = "http://localhost:8090";


window.addEventListener('message', function(event) {
    if (event.origin !== IdPDomain) {
        return; // Ignore messages from other origins
    }

    const message = JSON.parse(event.data);
    const payload = {};

    if (message.token) {
        payload.token = message.token;
    } else if (message.code) {
        const savedState = sessionStorage.getItem('oauth_state');
        if (!message.state || message.state !== savedState) {
            alert("Invalid state parameter, possible CSRF attack.");
            return;
        }
        sessionStorage.removeItem('oauth_state');

        payload.code = message.code;
    } else {
        alert("Invalid message from IdP.");
        return;
    }

    const xmlhttp = initXML();
    xmlhttp.open("POST", `${RPDomain}/authorization`, true);
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            const data = JSON.parse(xmlhttp.responseText);
            console.log("SSO Result:", data);
            if (data.result === "ok") {
                alert("SSO successful!");
            } else if (data.result === "register") {
                alert("SSO registered!");
            }
            else {
                alert("SSO failed: " + data.error);
            }
        }
    };
    xmlhttp.send(JSON.stringify(payload));
});

function initXML(){
    return window.XMLHttpRequest
        ? new XMLHttpRequest()
        : new ActiveXObject("Microsoft.XMLHTTP");
}

// 隐式流入口
export async function onBTNClick() {
    const t = await fetch(`${RPDomain}/getT?flow=implicit`, { credentials: 'include' }).then(r => r.text());

    const ImplicitFlowUrl = `${IdPDomain}/openid-connect-server-webapp/script` +
        `#cert=${encodeURIComponent(cert)}` +
        `&t=${encodeURIComponent(t)}` +
        `&flow=implicit`;

    location.href = ImplicitFlowUrl;
}

// 授权码流入口
export async function onBTNClickCode(){
    // time test
    const startPerf = Date.now();

    const {t, challenge, method} = await fetch(`${RPDomain}/getT?flow=code`, { credentials: 'include' }).then(r => r.json());

    const state = generateState();
    sessionStorage.setItem('oauth_state', state);

    const CodeFlowUrl = `${IdPDomain}/openid-connect-server-webapp/script` +
        `#redirect_url=${encodeURIComponent(RPDomain)}` +
        `&t=${encodeURIComponent(t)}` +
        `&flow=code` +
        `&state=${state}` +
        `&code_challenge=${encodeURIComponent(challenge)}` +
        `&code_challenge_method=${method}`+
        `&rt_start=${startPerf}`;

    location.href = CodeFlowUrl;
}


function generateState() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}














