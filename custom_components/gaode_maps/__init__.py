from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
import homeassistant.helpers.config_validation as cv
import voluptuous as vol
from homeassistant.components import websocket_api, frontend
from homeassistant.components.http import StaticPathConfig

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

    await hass.http.async_register_static_paths([
        StaticPathConfig("/gaode_maps_www", hass.config.path("custom_components/" + DOMAIN + "/www"), False)
    ])
    
    frontend.async_register_built_in_panel(
        hass,
        component_name="iframe",
        sidebar_title="墨澜地图",
        sidebar_icon="mdi:map",
        frontend_url_path=DOMAIN,
        config={ "url": f"/gaode_maps_www/index.html?hasstoken={hasstoken}&gaodekey={gaodekey}&jscode={jscode}&devicetrackeridlist={devicetrackeridlist}&v={VERSION}" },
        require_admin=False
    )
                        
    frontend.add_extra_js_url(hass, f'/gaode_maps_www/map.js?v={VERSION}')
    
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

    websocket_api.async_register_command(
            hass,
            DOMAIN,
            receive_data,
            SCHEMA_WEBSOCKET
        )
        
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    frontend.async_remove_panel(hass, DOMAIN)
    return True
