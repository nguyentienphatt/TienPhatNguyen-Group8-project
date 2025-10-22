import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Profile from './pages/Profile'
import './index.css'

export default function App(){
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link> | <Link to="/login">Đăng nhập</Link> | <Link to="/profile">Hồ sơ</Link>
      </nav>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/profile" element={<Profile/>} />
        <Route path="/" element={<div>Trang chủ</div>} />
      </Routes>
    </BrowserRouter>
  )
}
