import React from 'react'
import api from '../api/axios'
import { useDispatch } from 'react-redux'
import { clearAuth } from '../features/auth/authSlice'

export default function Navbar(){
  const dispatch = useDispatch()
  const onLogout = async ()=>{
    const raw = localStorage.getItem('app_auth_v1')
    if(raw){
      const auth = JSON.parse(raw)
      try{ await api.post('/auth/logout',{ refreshToken: auth.refreshToken }) }catch(e){}
    }
    dispatch(clearAuth())
  }
  return (
    <div>
      <button onClick={onLogout}>Đăng xuất</button>
    </div>
  )
}
