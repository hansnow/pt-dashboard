# PT DASHBOARD

PT 站点数据管理，自动记录每天的上传量。

## API

### 用户管理

**注册**

`POST /register`

<details><summary>Request</summary>

| key      | type   |
| -------- | ------ |
| username | string |
| password | string |

</details>

**登录**

`POST /login`

<details><summary>Request</summary>

| key      | type   |
| -------- | ------ |
| username | string |
| password | string |

</details>

**注销**

`GET /logout`

### 指令

**添加站点**

`POST /site`

<details><summary>Request</summary>

| key      | type                 |
| -------- | -------------------- |
| type     | 'ourbits' \| 'mteam' |
| username | string               |
| password | string               |
| otp      | string               |
| rule     | string               |

</details>

** 获取站点列表 **

`GET /site`

**删除站点**

`DELETE /site/:id`

**更新站点信息**

`PUT /site/:id`

<details><summary>Request</summary>

| key      | type               |
| -------- | ------------------ |
| type     | 'cookie' \| 'rule' |
| username | string             |
| password | string             |
| otp      | string             |
| rule     | string             |

`type`为`cookie`时，可以传所有参数，否则参数只能是`rule`

</details>

**立即抓取**

`POST /site/:id/history`

### 获取数据

**获取已添加站点**

`GET /site`

<details><summary>Response</summary>

| key          | type   |
| ------------ | ------ |
| siteID       | string |
| siteUsername | string |
| upload       | string |
| lastRecord   | Record |

</details>

**获取该站点历史数据**

`GET /site/:id/history`

<details><summary>Request</summary>

| key   | type   |
| ----- | ------ |
| page  | number |
| limit | number |

</details>

<details><summary>Response</summary>

| key     | type     |
| ------- | -------- |
| total   | number   |
| records | Record[] |

</details>
