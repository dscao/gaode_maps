var map = new Map();
var homePoint = null;
var backhomeTrackEnabled = false;
var backhomeTrackType = null;
var getDataMode = null; // 'client','server'
var url = null;
var storage = null;
var authToken = null;
var newTokens = null;
var newToken = null;

function applyTheme(isDarkMode) {
    if (!map) {
        console.warn("applyTheme: map object is not ready yet.");
        return;
    }
    
    if (isDarkMode) {
        console.log("System theme is dark. Applying dark map style.");
        // 直接调用即可，因为我们已经在 map.js 中定义了它
        map.setMapStyle('amap://styles/dark');
    } else {
        console.log("System theme is light. Applying normal map style.");
        // 直接调用即可
        map.setMapStyle('amap://styles/normal');
    }
}

const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');


$(function() {
//alert(txtDrawStart);
	storage=window.localStorage;
	try{
		authToken = storage.getItem("authToken"); //旧版模式
		newTokens = JSON.parse(storage.getItem("tokens")); //新版HA:0.76~0.77.1
	}
	catch(ex){
		null;
	}

	if (LongTimeToken != "")  //config.js配置的长期有效token
	{
		newToken = LongTimeToken;
	}
	else
	{
		if (newTokens == null)
		{
			newTokens = JSON.parse(storage.getItem("hassTokens")); //新版0.77.2
		}
		if (newTokens != null)
		{
			newToken = newTokens.token_type + " " + newTokens.access_token; //新版模式
		}
	}
	

	if (authToken == null && newToken == null)
	{
		alert("获取授权token失败");
		alert("登录HomeAssistant时请选择保存密码（或者选项中配置长期访问令牌），再刷新此页面");
		return;
	}
	
	getDataMode = "client";  //不再使用server模式，client模式安全性没问题

	$('#btnDrawStart').linkbutton({text:txtDrawStart[lang]});
	$('#btnDrawPause').linkbutton({text:txtDrawPause[lang]});
	$('#btnDrawResume').linkbutton({text:txtDrawResume[lang]});
	$('#btnDrawStop').linkbutton({text:txtDrawStop[lang]});
		
	$('#queryTimeFrom').datetimebox('setValue', getCurrentDate()+ " 00:00");
	$('#queryTimeTo').datetimebox('setValue', getCurrentDate()+" 23:59");
	
	$('#btnQuery').linkbutton({text:txtTrackShow[lang]});
	$('#btnBackhome').linkbutton({text:txtBackShow[lang]});
    
    let drawCount = 0; // 计数器，记录1秒内的调用次数
    let lastCallTime = 0; // 记录上一次调用的时间

    function drawDrivingMarkerWithLimit(deviceId, homePoint, backhomeTrackType) {
        const currentTime = Date.now();

        // 检查当前时间与上一次调用的时间差
        if (currentTime - lastCallTime >= 1000) {
            // 如果超过1秒，重置计数器
            drawCount = 0;
            lastCallTime = currentTime;
        }

        // 如果1秒内调用次数小于2次，则执行
        if (drawCount < 2) {
            map.drawdrivingmarker(deviceId, homePoint, backhomeTrackType);
            drawCount++; // 增加计数器
        } else {
            // 如果1秒内已经调用2次，则延迟到下一秒再执行
            setTimeout(() => {
                map.drawdrivingmarker(deviceId, homePoint, backhomeTrackType);
            }, 1000 - (currentTime - lastCallTime));
            drawCount = 0; // 重置计数器
            lastCallTime = Date.now(); // 更新上一次调用的时间
        }
    }
    
	var backhomeType = [];
	backhomeType.push({ "text": txtBackDrive[lang], "id": "drive" });
	backhomeType.push({ "text": txtBackRide[lang], "id": "ride" });
	backhomeType.push({ "text": txtBackWalk[lang], "id": "walk" });
    $("#cbBackhome").combobox("loadData", backhomeType);
	let isComboboxEnabled = true; // 标志变量，记录下拉框是否可操作
    $("#cbBackhome").combobox({
        onChange: function (n, o) {
            if (!isComboboxEnabled) {
                return; // 如果下拉框不可操作，直接返回
            }

            // 禁用下拉框
            isComboboxEnabled = false;
            $("#cbBackhome").combobox('disable'); // 禁用下拉框（如果使用 jQuery EasyUI）

            // 设置2秒后重新启用下拉框
            setTimeout(() => {
                isComboboxEnabled = true;
                $("#cbBackhome").combobox('enable'); // 启用下拉框（如果使用 jQuery EasyUI）
            }, 2000);

            // 原有的逻辑
            backhomeTrackType = n;
            var rows = $("#deviceListGrid").datagrid("getChecked");

            for (var i = 0; i < rows.length; i++) {
                //map.showdevicemarker(rows[i].id, true);
                if (backhomeTrackEnabled == true) {
                    drawDrivingMarkerWithLimit(rows[i].id, homePoint, backhomeTrackType); // 替换为限频调用
                }
            }
            SaveStorage();
        }
    });
	//var cbBackhomedata = $('#cbBackhome').combobox('getData');
	//$('#cbBackhome').combobox('select',cbBackhomedata[0].id);

	LoadStorage();
	trackBtnShow();
	
	if ($("#cbBackhome").combobox("getValue") == "")
	{
		var cbBackhomedata = $('#cbBackhome').combobox('getData');
		$('#cbBackhome').combobox('select',cbBackhomedata[0].id);
	}
	
    $("#deviceListGrid").datagrid({
		idField : 'id',
		
        onClickRow: function(rowIndex,rowData) {
            if(!rowData.lon || !rowData.lat) {
                return;
            }
            
            map.center({
                'lon': rowData.lon,
                'lat': rowData.lat
            });
        },
        
        onCheckAll: function(rows) {
            for(var index in rows) {
                rows[index].checked = true;
                map.showdevicemarker(rows[index].id, true);
                //map.drawdrivingmarker(rows[index].id, homePoint, backhomeTrackType);
                let drawCount = 0; // 计数器，记录1秒内的调用次数
                let lastCallTime = 0; // 记录上一次调用的时间
                for (var index in rows) {
                    map.showdevicemarker(rows[index].id, true);
                }
            }
			//map.drawdrivingmarkerShow(backhomeTrackEnabled);
        },
        
        onCheck: function(rowIndex, rowData) {
            rowData.checked = true;
            map.showdevicemarker(rowData.id, true);
            //map.drawdrivingmarker(rowData.id, homePoint, backhomeTrackType);
			//map.drawdrivingmarkerShow(backhomeTrackEnabled);
        },
        
        onUncheckAll: function(rows) {
            for(var index in rows) {
                rows[index].checked = false;
                map.showdevicemarker(rows[index].id, false);
            }
			//map.drawdrivingmarkerShow(backhomeTrackEnabled);
        },
        
        onUncheck: function(rowIndex, rowData) {
            rowData.checked = false;
            map.showdevicemarker(rowData.id, false);
            //map.drawdrivingmarker(rowData.id, homePoint, backhomeTrackType);
			//map.drawdrivingmarkerShow(backhomeTrackEnabled);
        }	
    });
	
	if (getDataMode == "client"){
		url = HomeAssistantWebAPIUrl + "/api/config";
	}else{
		url = phpUrl + "?type=getConfig";
	}
	//alert(url);
    $.ajax({
        type: "GET",
        url: url,
		beforeSend: function(request) {
			  request.setRequestHeader("x-ha-access", authToken);
			  request.setRequestHeader("Authorization", newToken);
		  },
        cache: false,
        async: false,
        dataType: "json",
        success: function(data) {
            if(typeof(data) === 'string') {
                data = $.parseJSON(data);
				//alert("data:"+data);
            }
            
            homePoint = {
                'lon': data.longitude, 
                'lat': data.latitude
            };
            //map.init(homePoint);
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
                        //alert(XMLHttpRequest.status);
                        //alert(XMLHttpRequest.readyState);
                        alert(errorThrown);
						
                    }
    });
	
	//mengqi
	//读取所有的zone信息
	var arrZone = Array();
	if (getDataMode == "client"){
		url = HomeAssistantWebAPIUrl + "/api/states";
	}else{
		url = phpUrl + "?type=getStates";
	}
	$.ajax({
        type: "GET",
        url: url,
		beforeSend: function(request) {
			  request.setRequestHeader("x-ha-access", authToken);
			  request.setRequestHeader("Authorization", newToken);
		  },
        cache: false,
        async: false,
        dataType: "json",
        success: function(data) {
			var datajson = eval(data);
			$.each(datajson, function (i, n)
			{
				if (JSON.stringify(n.entity_id).search('zone.') >0 && n.attributes['longitude'] != undefined && n.attributes['latitude'] != null)				
				{
					arrZone.push({
						'longitude': n.attributes['longitude'], 
						'latitude': n.attributes['latitude'],
						'friendly_name': n.attributes['friendly_name'],
						'entity_id': n.entity_id,
						'radius': n.attributes['radius']
					});
				}
				
			});
        }
    });
	map.init(homePoint,arrZone);

    $("#toolbar_zoomin").click(function() {
        map.zoomin();
        syncToolbarState(['zoomin', 'zoomout']);
    });
    $("#toolbar_zoomout").click(function() {
        map.zoomout();
        syncToolbarState(['zoomin', 'zoomout']);
    });
	
    $("#toolbar_traffic").click(function() {
        map.traffic();
        syncToolbarState(['traffic']);
    });
	
	//mengqi
	
	$('#btnQuery').bind('click', function(){
		if($("#btnQuery").linkbutton("options").text == txtTrackShow[lang]) {
			var rows = $('#deviceListGrid').datagrid('getSelected');
			if (rows != undefined)
			{
				$('#btnQuery').linkbutton({text:txtTrackHide[lang]});
				var arr = getLocationData(rows["id"]);
				map.query(arr,true);
				trackBtnShow();
				
			}
			
        } else {
			map.DrawStop();
			map.query(null,false);
            $('#btnQuery').linkbutton({text:txtTrackShow[lang]});
			trackBtnShow();
        }
		SaveStorage();
		
    });
	let isButtonEnabled = true; // 标志变量，记录按钮是否可点击

    $('#btnBackhome').bind('click', function () {
        if (!isButtonEnabled) {
            return; // 如果按钮不可点击，直接返回
        }

        // 禁用按钮
        isButtonEnabled = false;
        $('#btnBackhome').linkbutton('disable'); // 禁用按钮（如果使用 jQuery EasyUI）

        // 设置2秒后重新启用按钮
        setTimeout(() => {
            isButtonEnabled = true;
            $('#btnBackhome').linkbutton('enable'); // 启用按钮（如果使用 jQuery EasyUI）
        }, 2000);

        if ($("#btnBackhome").linkbutton("options").text == txtBackShow[lang]) {
            $('#btnBackhome').linkbutton({ text: txtBackHide[lang] });
            backhomeTrackEnabled = true;
            var rows = $("#deviceListGrid").datagrid("getChecked");

            for (var i = 0; i < rows.length; i++) {
                map.showdevicemarker(rows[i].id, true);
                drawDrivingMarkerWithLimit(rows[i].id, homePoint, backhomeTrackType); // 替换为限频调用
            }
        } else {
            $('#btnBackhome').linkbutton({ text: txtBackShow[lang] });
            backhomeTrackEnabled = false;
        }
        map.drawdrivingmarkerShow(backhomeTrackEnabled);
        SaveStorage();
    });
    
	
	$('#btnDrawStart').bind('click', function(){
		map.DrawStart();
    });
	
	$('#btnDrawPause').bind('click', function(){
		map.DrawPause();
    });
	
	$('#btnDrawResume').bind('click', function(){
		map.DrawResume();
    });
	
	$('#btnDrawStop').bind('click', function(){
		map.DrawStop();
    });
	
	
    $("#toolbar_homepoint").click(function() {
        map.homepoint();
        syncToolbarState(['homepoint']);
    });
    $("#toolbar_homerange").click(function() {
        map.homerange();
        syncToolbarState(['homerange']);
    });
    $("#toolbar_devicelist").click(function() {
        map.devicelist();
        syncToolbarState(['devicelist']);
    });
    
});


//mengqi
function SaveStorage(){
	var data = {//'btnBackhome.state': $("#btnBackhome").linkbutton("options").text,
				'cbBackhome.state': $("#cbBackhome").combobox("getValue")
				//'btnQuery.state': $("#btnQuery").linkbutton("options").text
				};
	
	storage.inkwavemap = JSON.stringify(data);
}

function LoadStorage(){
	var data = storage.inkwavemap;
	try
	{
		var dataObj = $.parseJSON(data);
		//$('#btnBackhome').linkbutton({text:dataObj['btnBackhome.state']});
		//$('#btnQuery').linkbutton({text:dataObj['btnQuery.state']});
		$('#cbBackhome').combobox('select',dataObj['cbBackhome.state']);
		
		//alert("loadSuccess");
	}
	catch(ex)
	{
		//alert(ex);
		null;
	}
}

function getLocationData(deviceId){
	var str_deviceid = "device_tracker." + deviceId;
	var str_queryTimeFrom = getStandardDatetime($('#queryTimeFrom').datetimebox('getValue'));
	var str_queryTimeTo = getStandardDatetime($('#queryTimeTo').datetimebox('getValue'));
	
	if (getDataMode == "client"){
		url = HomeAssistantWebAPIUrl + "/api/history/period/"+ str_queryTimeFrom+ "?end_time="+ str_queryTimeTo+ "&filter_entity_id="+ str_deviceid;
	}else{
		url = phpUrl + "?type=getHistoryPeriodForDeviceId&timeFrom="+str_queryTimeFrom+"&timeTo="+str_queryTimeTo+"&deviceId="+deviceId;
	}
	
	var arr = new Array();
	//alert(url);
	$.ajax({
		type: "GET",
		url: url,
		beforeSend: function(request) {
			  request.setRequestHeader("x-ha-access", authToken);
			  request.setRequestHeader("Authorization", newToken);
		  },
		cache: false,
		async: false,
		dataType: "json",
		success: function(data) {
            var datajson = eval(data[0]);
            $.each(datajson, function (i, n) {
            if (//n.attributes["source_type"] == "gps" &&  取消过滤设备类型
                n.attributes['longitude'] !== null &&
                n.attributes['longitude'] !== undefined &&
                n.attributes['latitude'] !== null &&
                n.attributes['latitude'] !== undefined &&
                n.attributes['longitude'] !== "" &&
                n.attributes['latitude'] !== "") {
                    arr.push({
                        'longitude': n.attributes['longitude'],
                        'latitude': n.attributes['latitude'],
                        'updatedate': (n.attributes['lastseen'] ? '最后出现：'+n.attributes['lastseen'] +'<br/>': '') + 
                                       (n.attributes['latest_report_time'] ? '上报时间：' + n.attributes['latest_report_time'] +'<br/>记录时间：' : '') +
                                       (getDatetime(n.last_updated) ? '' + getDatetime(n.last_updated) : ''),
                        'lnglat': [n.attributes['longitude'], n.attributes['latitude']]
                    });
                }
            });
            //map.query(arr);
        }
	});
	return arr;
}

function trackBtnShow(){
	if($("#btnQuery").linkbutton("options").text == txtTrackShow[lang]) {
		$("#btnDrawStart").hide();
		$("#btnDrawResume").hide();
		$("#btnDrawPause").hide();
		$("#btnDrawStop").hide();
	}else{
		$("#btnDrawStart").show();
		$("#btnDrawResume").show();
		$("#btnDrawPause").show();
		$("#btnDrawStop").show();
	}

}

function getDevice(deviceId) {
    var getDeviceFun = function() {
		if (getDataMode == "client"){
			url = HomeAssistantWebAPIUrl + "/api/states/device_tracker." + deviceId;
		}else{
			url = phpUrl + "?type=getStatesForDeviceId&deviceId="+ deviceId;
		}
        $.ajax({
            type: "GET",
            url: url,
			beforeSend: function(request) {
			  request.setRequestHeader("x-ha-access", authToken);
			  request.setRequestHeader("Authorization", newToken);
		  },
            cache: false,
            async: true,
            success: function(data) {
                if(null == data) {
                    return;
                }
                if(typeof(data) === 'string') {
                    data = $.parseJSON(data);
                }
                if(null == data.attributes) {
                    return;
                }
             //   var deviceFullId = data.entity_id;
             //   var deviceId = deviceFullId.replace("device_tracker.", "");
             //   var deviceName = unicode2hanzi(data.attributes.friendly_name);
                var deviceName = data.attributes.friendly_name;
				var state_r = data.state;
				var state = data.attributes.address || "---";
				
				if (state_r == "not_home")
				{
					state_r = getLeftFiveChars(state);
				}
				else
				{
					state = state_r;
				}
				
			    
				
                if(null == deviceName) {
                    deviceName = deviceId;
                }
                updateDeviceList(deviceId, {'name': deviceName});
                
                var longitude = data.attributes.longitude;
                var latitude = data.attributes.latitude;
                if(null != longitude && null != latitude) {
                    if(longitude != getDeviceListValue(deviceId, 'lon') && latitude != getDeviceListValue(deviceId, 'lat')) {
                        updateDeviceList(deviceId, {'lon': longitude, 'lat': latitude, 'state': state ,'state_r': state_r});
                        map.drawdevicemarker(deviceId, deviceName, {'lon': longitude, 'lat': latitude});
                        // 注释掉以下代码，避免默认请求回家的时间
                        // map.drawDrivingMarkerWithLimit(deviceId, homePoint, backhomeTrackType);
                    }
                }
            }
        });
    };
    getDeviceFun();
    setInterval(getDeviceFun, 10000);
}

function getLeftFiveChars(str) {
  if (str === null || str === undefined) {
    return "";
  }
  const len = str.length;
  if (len < 5) {
    return str;
  }
  return str.slice(0, 5);
}

function getRightFiveChars(str) {
  if (str === null || str === undefined) {
    return "";
  }
  const len = str.length;
  if (len < 5) {
    return str;
  }
  return str.slice(-5);
}

    
$(document).on("zoomchange", function() {
    syncToolbarState(['zoomin', 'zoomout']);
});


$(document).on("mapInitFinished", function() {
    console.log("Map init finished. Setting up theme.");
    // 1. 立即根据当前系统设置应用主题
    applyTheme(darkModeMediaQuery.matches);
    // 2. 添加监听器，以便在系统主题变化时自动切换
    darkModeMediaQuery.addEventListener('change', (e) => {
        applyTheme(e.matches);
    });
    syncToolbarState(['zoomin', 'zoomout', 'traffic', 'homepoint', 'homerange', 'devicelist']);
	if (getDataMode == "client"){
		url = HomeAssistantWebAPIUrl + "/api/states";
	}else{
		url = phpUrl + "?type=getAllDevices";
	}
    $.ajax({
        type: "GET",
        url: url,
        beforeSend: function(request) {
              request.setRequestHeader("x-ha-access", authToken);
              request.setRequestHeader("Authorization", newToken);
          },
        cache: false,
        async: true,
        dataType: "json",
        success: function (data) {
            var idlist = DeviceTrackerIDList.replaceAll("device_tracker.","").split(",");
            for (var index in data) {
                var str = JSON.stringify(data[index].entity_id);
                if (str == null)
                    continue;
                
                if (str.search('device_tracker') == -1)
                    continue;	                
				
                var deviceId = data[index].entity_id.replace("device_tracker.", "");
					
                if (idlist != "" && idlist.indexOf(deviceId) == -1)
                    continue;			
                
                if (data[index].attributes['longitude'] == undefined || data[index].attributes['latitude'] == null)
                    continue;
                
                insertDeviceList(0, {
                    //checked: true,
                    id: deviceId,
                    name: 'loading...',
                    state: '---'
                });
                getDevice(deviceId);
            }
        }
    });
});


$(document).on("updateDrivingTime", function(event, params) {
	var strState = null;
	var strState_r = getDeviceListValue(params['deviceId'],'state_r');
	var strState_time = isNaN(params['time']) ? params['time'] : formatSeconds(params['time']);
	if (strState_r != "")
	{
		strState = strState_r + "(";
		strState = strState + strState_time;
		strState = strState + ")";
	}
	else
	{
		strState = strState_time;
	}
    updateDeviceList(params['deviceId'], {state: strState });
});
$(document).on("updateDrivingState", function(event, params) {
    updateDeviceList(params['deviceId'], {state_r: params['state'] });
});

function syncToolbarState(ids) {
    for(var idIndex in ids) {
        var id = ids[idIndex];
        if(eval("map.is" + id + "();")) {
            $("#toolbar_" + id).attr("src", "images/toolbar_" + id + "_enable.png");
        } else {
            $("#toolbar_" + id).attr("src", "images/toolbar_" + id + "_disable.png");
        }
    }
}

function getDeviceListValue(deviceId, colName) {
    var datas = $("#deviceListGrid").datagrid('getRows');
    for(var index in datas) {
        var data = datas[index];
        if(data.id == deviceId) {
            for(var col in data) {
                if(col == colName) {
                    return data[col];
                }
            }
        }
    }
}

function updateDeviceList(deviceId, newData) {
    var datas = $("#deviceListGrid").datagrid('getRows');
    for(var index in datas) {
        var data = datas[index];
        if(data.id == deviceId) {
            $("#deviceListGrid").datagrid('updateRow', {
                index: index,
                row: newData
            });
        }
    }
}

function insertDeviceList(index, newData) {
    $("#deviceListGrid").datagrid('insertRow',{
        index: index,
        row: newData
    });
	$("#deviceListGrid").datagrid('checkRow',index);
}