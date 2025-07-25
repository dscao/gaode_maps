# 墨澜(高德)地图增强版  gaode_maps
gaode_maps for homeassistant

1、使用自定义集成方式UI配置

2、设备图标上点击快速打开实体卡片

3、手机上在轨迹的标记点按点也可显示时刻

4、增加自定义卡片

5、实体对话框可显示定位地图，增加属性时custom_ui_more_info: gaode-map 显示

6、增加比例尺显示

7、增加卫星视图

8、轨迹中的时间针对macless-haystack的时间点显示更多信息： 最后出现+上报时间+记录时间。（由 [cloud_gps](https://github.com/dscao/cloud_gps) 集成接入时）

9、增加深色模式(高德API key必须正确填写)，统一按系统主题自动显示浅色模式或深色模式


本项目修改自 https://github.com/cxlwill/ha-inkwavemap 

参考借鉴 https://github.com/shaonianzhentan/google_maps 


# 安装方法


HACS > 集成 > 右上角自定义存储库填入： https://github.com/dscao/gaode_maps 集成，随后下载安装，按提示重启ha.

或者下载 [latest release](https://github.com/dscao/gaode_maps/releases) 后解压复制gaode_maps目录到 /config/custom_components目录下，重启ha。

# 配置方法

homeassistant 配置 > 设备与服务 > 添加集成 > 搜索 gaode_maps 或墨澜地图，按提示操作。

高德API key
请至高德开放平台http://lbs.amap.com/ 获取 \
(必填) 不正确则不会显示回家线路及回家时间，其它影响不大 

高德API key的安全密钥 \
可获取到key值和安全密钥jscode（自2021年12月02日升级，升级之后所申请的 key 必须配备安全密钥 jscode 一起使用) \
注意：此次升级不会影响之前已获得 key 的使用；升级之后的新增的key必须要配备安全密钥一起使用（不需要则留空，但不能删除） \
高德说明文档：https://lbs.amap.com/api/javascript-api/guide/abc/prepare 

ha长期访问口令： homeassistant 左下方 点击用户名称进入用户资料页 > 长期访问令牌 > 创建令牌 \
（推荐使用令牌，否则手机app端不可使用。）

备注：追踪设备只针对 device_tracker 类型。

显示轨迹操作：需先在列表中选中一个设备，选好区间时间，再点“显示轨迹”。同一时间只能显示一个设备的轨迹。

![1](https://github.com/dscao/gaode_maps/assets/16587914/0d9ee817-d68a-4776-a1ce-b8ab0267c170)


![2](https://github.com/dscao/gaode_maps/assets/16587914/4ca7d18f-58ea-4adc-8f64-982c79c63e61)


![3](https://github.com/user-attachments/assets/55f94439-b7a9-4fea-b725-d3a141d14be8)

