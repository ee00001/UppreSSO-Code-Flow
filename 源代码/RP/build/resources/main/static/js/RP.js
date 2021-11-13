let state = "expectNU"
let Domain = "http://192.168.0.190:8090"
let loginDialog
let start
let point1
let point2
let point3
let count = 0

function onReceiveMessage(event) {
    const message = JSON.parse(event.data)
    switch (message.Type){
        // case "Ready":

            // if (state != "start")
            //     break
            // processCertResponse()
            // break
        case "N_U":
            if (state != "expectNU")
                break
            let date3 = new Date();
            point3 = date3.getTime();
            processNU(message.N_U)
            break
        case "RegistrationResult":
            if (state != "expectRegistration")
                break
            processRegistrationResult(message.RegistrationResult)
            break
        case "Token":
            if (state != "expectToken")
                break
            processToken(message.Token)
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

function processToken(Token){
    let registrationUrl = Domain + "/authorization"
    let xmlhttp = initXML();
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            let dateEnd = new Date();
            let end = dateEnd.getTime();
            console.log(count + ":" + (point3-start) +" "+ (point1-point3) +" "+ (point2-point1) +" "+ (end-point2))
            loginDialog.close()
            count++
            if(count<1000)
                begin()
            // let data = JSON.parse(xmlhttp.responseText)
            // let mes = {"Type": "Request", "Content": data}
            // if (data != null) {
            //     state = "expectToken"
            //     loginDialog.postMessage(JSON.stringify(mes), '*');
            // }
        }
    }
    let result = {"Token": Token}
    let date2 = new Date();
    point2 = date2.getTime();
    xmlhttp.open("POST",registrationUrl,true);
    xmlhttp.send(Token);
}


function processRegistrationResult(RegistrationResult){
    let registrationUrl = Domain + "/register_finished"
    let xmlhttp = initXML();
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            let data = JSON.parse(xmlhttp.responseText)
            let mes = {"Type": "Request", "Content": data}
            if (data != null) {
                state = "expectToken"
                let date1 = new Date();
                point1 = date1.getTime();

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
                let Cert_RP = data.Cert_RP
                let content = {"Type": "Cert", "Cert": Cert_RP}
                if (Cert_RP!= null){
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
begin();
function begin()
{
    let date = new Date();
    start = date.getTime();
    state = "expectNU"
    loginDialog = window.open(
        `/redir`,
        'loginDialog',
        'width=600,height=400',
    );

}


