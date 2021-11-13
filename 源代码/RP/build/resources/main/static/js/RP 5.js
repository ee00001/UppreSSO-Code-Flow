let state = "start"
let Domain = "http://192.168.0.190:8090"
let loginDialog

function onReceiveMessage(event) {
    const message = JSON.parse(event.data)
    switch (message.Type){
        case "Ready":
            if (state != "start")
                break
            processCertResponse()
            break
        case "N_U":
            if (state != "expectNU")
                break
            processNU(message.N_U)
            break
        case "RegistrationResult":
            if (state != "expectRegistration")
                break
            processRegistrationResult(message.RegistrationResult)


    }

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


function processRegistrationResult(RegistrationResult){
    let registrationUrl = Domain + "/register_finished"
    let xmlhttp = initXML();
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            console.log(xmlhttp.responseText)
            let data = JSON.parse(xmlhttp.responseText)
            let mes = {"Type": "Request", "Content": data}
            if (data != null) {
                state = "expectToken"
                loginDialog.postMessage(JSON.stringify(mes), '*');
            }
        }
    }
    let result = JSON.parse(RegistrationResult)
    xmlhttp.open("POST",registrationUrl,true);
    xmlhttp.send(JSON.stringify(result));
}

function processNU(N_U){
    let uploadpkUrl = Domain + "/uploadPK"
    let xmlhttp = initXML();
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            let data = JSON.parse(xmlhttp.responseText)
            if (data.result == "ok"){
                let PID_RP = data.PID_RP
                let content = {"Type": "PID_RP", "PID_RP": PID_RP}
                if (PID_RP!= null){
                    state = "expectRegistration"
                    loginDialog.postMessage(JSON.stringify(content), '*');
                }
            }
        }
    }
    xmlhttp.open("POST",uploadpkUrl,true);
    let body = {"N_U": N_U}
    xmlhttp.send(JSON.stringify(body));
}

function processCertResponse(){
    let loginUrl = Domain + "/login";
    let xmlhttp = initXML()
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            let data = JSON.parse(xmlhttp.responseText)
            let Cert = data.Cert
            let content = {"Type": "Cert", "Cert": Cert}
            if (Cert!= null){
                state = "expectNU"
                loginDialog.postMessage(JSON.stringify(content), '*');
            }
        }
    }
    xmlhttp.open("GET",loginUrl,true);
    xmlhttp.send();
}




window.addEventListener('message', onReceiveMessage);

loginDialog = window.open(
    `/redir`,
    'loginDialog',
    'width=600,height=400',
);


