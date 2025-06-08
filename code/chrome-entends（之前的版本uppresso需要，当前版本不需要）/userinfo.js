chrome.extension.sendMessage(  
	{cmd: "start"}, 
	function(response){
		window.close()
		//window.location.replace(response)
	});
	//function(response) {  
	//	var url = window.location.href
	//	var xmlhttp;
	////	if (window.XMLHttpRequest)
	//	{
			//  IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
	//		xmlhttp=new XMLHttpRequest();
	//	}
	//	else
	//	{
			// IE6, IE5 浏览器执行代码
	//		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	//	}
		//xmlhttp.onreadystatechange=function()
		//{
			//if (xmlhttp.readyState==4 && xmlhttp.status==200)
	//		{
	//			//var response = xmlhttp.getAllResponseHeaders()
				//alert(response)
	//			obj = JSON.parse(xmlhttp.responseText)
	//			var email = obj.email
	//			chrome.extension.sendMessage(
	//				{email, email}, 
	//				function(response){
	//					window.location.replace(response)
	//				})
	//		}
	//	}
	//	xmlhttp.open("GET",url,true);
	//	xmlhttp.setRequestHeader("Authorization", "Bearer " + response)
	//	xmlhttp.send();
	//}  );