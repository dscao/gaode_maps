HomeAssistantWebAPIUrl="./../.."

const query = new URLSearchParams(location.search)
GaodeMapKey = query.get('gaodekey')
GaodeMapjscode = query.get('jscode')
hasstoken = query.get('hasstoken','')
if (hasstoken==''){
	LongTimeToken = ""
}else{
    LongTimeToken = "Bearer "+hasstoken
}
DeviceTrackerIDList = query.get('devicetrackeridlist','')