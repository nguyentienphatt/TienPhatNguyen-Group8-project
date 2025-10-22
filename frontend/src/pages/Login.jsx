import React, { useState } from 'react'
import api from '../api/axios'
import { useDispatch } from 'react-redux'
import { setAuth } from '../features/auth/authSlice'

export default function Login(){
  const [email,setEmail] = useState('admin@example.com')
  const [password,setPassword] = useState('password')
  const dispatch = useDispatch()
  const onSubmit = async e =>{
    e.preventDefault()
    const r = await api.post('/auth/login',{ email, password })
    dispatch(setAuth(r.data))
    alert('Đăng nhập thành công')
  }
  return (
    <form onSubmit={onSubmit}>
      <h2>Đăng nhập</h2>
      <input value={email} onChange={e=>setEmail(e.target.value)} />
      <input value={password} onChange={e=>setPassword(e.target.value)} />
      <button type="submit">Đăng nhập</button>
    </form>
  )
}
