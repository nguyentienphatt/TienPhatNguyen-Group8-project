import { createSlice } from '@reduxjs/toolkit'

const KEY = 'app_auth_v1'
const initial = JSON.parse(localStorage.getItem(KEY) || 'null') || { user: null }

const slice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    setAuth(state, action){
      const next = { ...state, ...action.payload }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    },
    clearAuth(state){
      localStorage.removeItem(KEY)
      return { user: null }
    }
  }
})

export const { setAuth, clearAuth } = slice.actions
export default slice.reducer
