"""Adds config flow for travel_time."""
import logging
import asyncio
import json
import time, datetime
import requests
import re
import hashlib
import urllib.parse
import homeassistant.helpers.config_validation as cv
from homeassistant.const import CONF_API_KEY, CONF_NAME
from homeassistant.helpers.selector import SelectSelector, SelectSelectorConfig, SelectSelectorMode
from collections import OrderedDict
from homeassistant import config_entries
from homeassistant.core import callback

import voluptuous as vol

from .manifest import manifest
DOMAIN = manifest.domain
VERSION = manifest.version

_LOGGER = logging.getLogger(__name__)

@config_entries.HANDLERS.register(DOMAIN)
class FlowHandler(config_entries.ConfigFlow, domain=DOMAIN):
    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        """Get the options flow for this handler."""
        return OptionsFlow(config_entry)

    def __init__(self):
        """Initialize."""
        self._errors = {}
       
    async def async_step_user(self, user_input={}):
        self._errors = {}
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
            
        if user_input is not None:
          
            await self.async_set_unique_id(DOMAIN)
            self._abort_if_unique_id_configured()
            _LOGGER.debug(user_input)
            return self.async_create_entry(
                title=DOMAIN, data=user_input
            )

            return await self._show_config_form(user_input)

        return await self._show_config_form(user_input)

    async def _show_config_form(self, user_input):
        data_schema = OrderedDict()
        data_schema[vol.Required("gaodekey" ,default ="")] = str
        data_schema[vol.Optional("jscode" ,default ="")] = str
        data_schema[vol.Optional("longtoken" ,default ="")] = str
        
        return self.async_show_form(
            step_id="user", data_schema=vol.Schema(data_schema), errors=self._errors
        )

    async def _check_existing(self, host):
        for entry in self._async_current_entries():
            if host == entry.data.get(CONF_NAME):
                return True

class OptionsFlow(config_entries.OptionsFlow):
    """Config flow options for travel_time."""

    def __init__(self, config_entry):
        """Initialize travel_time options flow."""
        self.config = dict(config_entry.data)

    async def async_step_init(self, user_input=None):
        """Manage the options."""
        return await self.async_step_user()

    async def async_step_user(self, user_input=None):
        """Handle a flow initialized by the user."""
        if user_input is not None:
            if user_input["longtoken"] == "null":
                user_input["longtoken"] = ""
            self.config.update(user_input)
            self.hass.config_entries.async_update_entry(
                self.config_entry,
                data=self.config
            )
            _LOGGER.debug(user_input)
            await self.hass.config_entries.async_reload(self.config_entry.entry_id)
            return self.async_create_entry(title="", data=user_input)
            
        device_states = self.hass.states.async_all(['device_tracker'])
        device_entities = []
        for state in device_states:
            if state.attributes.get('latitude') and state.attributes.get('longitude'):
                friendly_name = state.attributes.get('friendly_name')
                platform = state.attributes.get('platform')
                entity_id = state.entity_id
                value = f'{friendly_name}（{entity_id}）'
                device_entities.append(entity_id)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required("gaodekey", default=self.config.get("gaodekey")): cv.string,
                    vol.Optional("jscode", default=self.config.get("jscode")): cv.string,
                    vol.Optional("longtoken", default=self.config.get("longtoken")): cv.string,
                    vol.Optional(
                        "trackerids", 
                        default=self.config_entry.options.get("trackerids",[])
                    ): SelectSelector(
                        SelectSelectorConfig(
                            options=device_entities, 
                            multiple=True,translation_key="trackerids"
                        )
                    )
                }
            )
        )

