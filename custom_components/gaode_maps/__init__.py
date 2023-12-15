from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
import homeassistant.helpers.config_validation as cv
import voluptuous as vol
from homeassistant.components import websocket_api
import datetime
import logging

from .manifest import manifest
DOMAIN = manifest.domain
VERSION = manifest.version

CONFIG_SCHEMA = cv.deprecated(DOMAIN)

_LOGGER = logging.getLogger(__name__)

SCHEMA_WEBSOCKET = websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend(
    {
        "type": DOMAIN,
        vol.Optional("data"): dict,
    }
)

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:

    hasstoken = entry.data.get('longtoken',"") 
    if hasstoken == "null":
        hasstoken = ""
    gaodekey = entry.data.get('gaodekey')
    jscode = entry.data.get('jscode')
    trackerids = entry.options.get('trackerids')
    if isinstance(trackerids,list):
        devicetrackeridlist = ','.join(trackerids)
    else:
        devicetrackeridlist = ''
    hass.http.register_static_path("/gaode_maps_www", hass.config.path("custom_components/" + DOMAIN + "/www"), False)
    hass.components.frontend.async_register_built_in_panel(
                        "iframe",
                        "墨澜地图",
                        "mdi:map",
                        DOMAIN,
                        { "url": f"/gaode_maps_www/index.html?hasstoken={hasstoken}&gaodekey={gaodekey}&jscode={jscode}&devicetrackeridlist={devicetrackeridlist}&v={VERSION}" },
                        require_admin=False)
                        
    hass.components.frontend.add_extra_js_url(hass, f'/gaode_maps_www/map.js?v={VERSION}')
    
    def receive_data(hass, connection, msg):
        data = msg['data']
        msg_type = data.get('type', '')
        if msg_type == 'gaodekey':
            connection.send_message(
                websocket_api.result_message(
                    msg["id"],
                    {
                        "hasstoken": hasstoken,
                        "gaodekey": gaodekey,
                        "jscode": jscode
                    }
                )
            )

    hass.components.websocket_api.async_register_command(
            DOMAIN,
            receive_data,
            SCHEMA_WEBSOCKET
        )
        
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.components.frontend.async_remove_panel(DOMAIN)
    return True