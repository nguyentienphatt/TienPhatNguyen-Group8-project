import React, { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Profile(){
  const [profile,setProfile] = useState(null)
  useEffect(()=>{
    api.get('/profile').then(r=>setProfile(r.data)).catch(()=>setProfile(null))
  },[])
  if(!profile) return <div>Không thể lấy thông tin, hãy đăng nhập</div>
  return <div>
    <h2>Hồ sơ</h2>
    <pre>{JSON.stringify(profile, null, 2)}</pre>
  </div>
}
