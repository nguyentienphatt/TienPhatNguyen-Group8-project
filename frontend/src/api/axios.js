import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:5000' })

let isRefreshing = false
let queue = []

api.interceptors.request.use(config => {
  const raw = localStorage.getItem('app_auth_v1')
  if(raw){
    const auth = JSON.parse(raw)
    if(auth?.accessToken) config.headers['Authorization'] = `Bearer ${auth.accessToken}`
  }
  return config
})

api.interceptors.response.use(res => res, async err => {
  const original = err.config
  if(err.response?.status === 401 && !original._retry){
    original._retry = true
    const raw = localStorage.getItem('app_auth_v1')
    if(!raw) return Promise.reject(err)
    const auth = JSON.parse(raw)
    if(isRefreshing){
      return new Promise((resolve,reject)=>{
        queue.push({resolve,reject})
      }).then(token => {
        original.headers['Authorization'] = `Bearer ${token}`
        return api(original)
      })
    }
    isRefreshing = true
    try{
      const r = await api.post('/auth/refresh',{ refreshToken: auth.refreshToken })
      const { accessToken, refreshToken } = r.data
      const next = { ...auth, accessToken, refreshToken }
      localStorage.setItem('app_auth_v1', JSON.stringify(next))
      queue.forEach(q => q.resolve(accessToken)); queue = []
      isRefreshing = false
      original.headers['Authorization'] = `Bearer ${accessToken}`
      return api(original)
    }catch(e){
      queue.forEach(q => q.reject(e)); queue = []
      isRefreshing = false
      localStorage.removeItem('app_auth_v1')
      return Promise.reject(e)
    }
  }
  return Promise.reject(err)
})

export default api
