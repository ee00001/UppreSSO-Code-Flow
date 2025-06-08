let cert = "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJSUF9JRCI6IjA0NGJjMDA4NWRhOTFkYTJiZDUzYTZmOWQ4ODExZDIxYjQ4MjE1N2FhMzdjNmE2YmFhZGMwZDA0ZGZkN2E0MTE0ODU1N2QyMzJjM2VhNTliMzU3YTU1MDJiODBjZjFlMzMxMzM4MWE5MzA2YmJkMjFiMTk3NGYyOTM4MTE3ZTA0MjEiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwOTAiLCJyZWRpcmVjdF91cmkiOiJodHRwOi8vbG9jYWxob3N0OjgwOTAiLCJSUF9uYW1lIjoicHJvdG90eXBlIiwiaWF0IjoxNzQ5MzEwMjg2fQ.304502207b7367f44274ffbb7e8ff155fa004dab82839c8c4ba1e9f89dda734544e10d0e02210084856de34d6141f6eb80dbaf32d94d243e09a14f15a2461cfe4581c6e8ec0b6f";
let IdPDomain = "http://localhost:8080";
let RPDomain = "http://localhost:8090";
let loginDialog;


window.addEventListener('message', function(event) {
        if (event.origin !== IdPDomain) {
            return; // Ignore messages from other origins
        }
        const message = JSON.parse(event.data);
        if (message.t !=null & message.token != null) {
            console.log("Received Token:", message.token);
            loginDialog.close();
            let xmlhttp = initXML();
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    let data = JSON.parse(xmlhttp.responseText);
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
            xmlhttp.open("POST", `${RPDomain}/authorization`, true);
            xmlhttp.setRequestHeader("Content-Type", "application/json");
            xmlhttp.send(JSON.stringify({"t": message.t, "token": message.token}));

        }
    });

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


export function onBTNClick() {
    let ssoUrl = `${IdPDomain}/openid-connect-server-webapp/script#cert=${cert}`;
    loginDialog = window.open(
        ssoUrl,
        'loginDialog',
        'width=600,height=400',
    );
}














