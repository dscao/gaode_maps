customElements.whenDefined('ha-panel-lovelace').then(() => {
  const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
  const html = LitElement.prototype.html;
  const css = LitElement.prototype.css;

  customElements.define('gaode-map', class extends LitElement {

    static properties = {
      hass: {},
      stateObj: {},
      config: {},
      gaodekey: {}
    };


    static styles = css`iframe{border: none; width: 100%;}`

    constructor() {
      super();
	  this.hasstoken = sessionStorage['GAODE_HASSTOKEN']
    }

    static getStubConfig() {
      return {
        entity_id: "device_tracker.xxx",
        zoom: 16
      }
    }

    setConfig(config) {
      if (!config.entity_id) {
        throw new Error('你需要定义一个实体');
      }
      this.config = config;
    }

    render() {
      if (this.hasstoken) {
        const version = new Date().toLocaleDateString()
        let click = 1
        let zoom = 15
        let entity_id = null
        let height = this.offsetWidth == 0 ? this.parentElement.offsetWidth : this.offsetWidth

        const { config, stateObj } = this
        if (stateObj) {
          entity_id = stateObj.entity_id
          height = 300
          click = 0
        } else {
          zoom = config.zoom
          entity_id = config.entity_id
        }
        
        return html`<iframe style="height: ${height}px;" 
          src="/gaode_maps_www/card.html?hasstoken=${this.hasstoken}&v=${version}&idlist=${entity_id}&zoom=${zoom}"
          ></iframe>${stateObj ? html`<ha-attributes .hass=${this.hass} .stateObj=${stateObj}></ha-attributes>` : ''}`
      } else {
        if (!this.loading) {
          this.loading = true
          this.hass.callWS({ type: 'gaode_maps', data: { type: 'gaodekey' } }).then(({ hasstoken }) => {
			sessionStorage['GAODE_HASSTOKEN'] = hasstoken;
			this.hasstoken = hasstoken;
		  })
        }
        return html`高德地图卡片加载中...`
      }
    }
  })

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "gaode-map",
    name: "高德地图",
    preview: true,
    description: "高德地图卡片"
  });

})