const prefix = process.env.NODE_ENV === 'development' ? '' : '/api'

async function request(url, opts) {
  const resp = await fetch(prefix + url, {
    credentials: 'include',
    ...opts
  })
  if (resp.status >= 200 && resp.status < 300) {
    return resp
  }
  const { msg, code } = await resp.json()
  const err = Error(msg)
  err.msg = msg
  err.status = resp.status
  err.code = code

  throw err
}

// 用户 - 登陆
export function login(username, password) {
  return request('/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
}

// 用户 - 注册
export function register(username, password) {
  return request('/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
}

// 用户 - 注销
export function logout() {
  return request('/logout')
}

// 获取站点列表
export function getSiteList() {
  return request('/site')
}

// 添加站点
export function addSite(type, username, password, otp, rule) {
  return request('/site', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, username, password, otp, rule })
  })
}

// 更新站点
export function updateSite(siteID, type, payload) {
  return request('/site/' + siteID, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, ...payload })
  })
}

// 删除站点
export function deleteSite(siteID) {
  return request(`/site/${siteID}`, { method: 'DELETE' })
}

// 立即抓取
export function refreshSite(siteID) {
  return request(`/site/${siteID}/history`, { method: 'POST' })
}

// 获取某个站点的抓取记录
export function getRecords(id, page = 1, limit = 10) {
  return request(`/site/${id}/history?page=${page}&limit=${limit}`)
}
