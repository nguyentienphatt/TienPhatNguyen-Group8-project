// Minimal demo client for refresh token flow
const API = location.origin.replace(/:\d+$/, ':5000'); // assume backend on 5000

const logEl = document.getElementById('log');
const setLog = (s) => { logEl.textContent = (new Date()).toISOString()+" - "+s };

let accessToken = null; // keep in memory

function saveRefreshToken(rt){ localStorage.setItem('refreshToken', rt); }
function getRefreshToken(){ return localStorage.getItem('refreshToken'); }
function clearTokens(){ accessToken=null; localStorage.removeItem('refreshToken'); }

async function apiFetch(url, opts={}){
  opts.headers = opts.headers || {};
  if (accessToken) opts.headers['Authorization'] = 'Bearer '+accessToken;
  opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json';
  if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);

  let res = await fetch(API+url, opts);
  if (res.status === 401){
    setLog('Access token expired or invalid, trying refresh...');
    const refreshed = await tryRefresh();
    if (!refreshed) { setLog('Refresh failed'); throw new Error('refresh failed'); }
    // retry original
    opts.headers['Authorization'] = 'Bearer '+accessToken;
    res = await fetch(API+url, opts);
  }
  const data = await res.json().catch(()=>({}));
  return { ok: res.ok, status: res.status, data };
}

async function tryRefresh(){
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const r = await fetch(API+'/auth/refresh', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ refreshToken: rt })
    });
    if (!r.ok) return false;
    const j = await r.json();
    accessToken = j.accessToken;
    if (j.refreshToken) saveRefreshToken(j.refreshToken);
    setLog('Refreshed accessToken');
    return true;
  } catch(e){ console.error(e); return false; }
}

// UI handlers
document.getElementById('btnLogin').addEventListener('click', async ()=>{
  setLog('Logging in...');
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    const r = await fetch(API+'/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
    const j = await r.json();
    if (!r.ok){ setLog('Login failed: '+(j.message||r.status)); return; }
    accessToken = j.accessToken;
    if (j.refreshToken) saveRefreshToken(j.refreshToken);
    setLog('Login ok — accessToken stored in memory, refreshToken in localStorage');
  } catch(e){ setLog('Login error'); console.error(e); }
});

document.getElementById('btnMe').addEventListener('click', async ()=>{
  setLog('Calling /auth/me...');
  try{
    const r = await apiFetch('/auth/me');
    if (r.ok) setLog('OK: '+JSON.stringify(r.data)); else setLog('Err '+r.status+': '+JSON.stringify(r.data));
  }catch(e){ setLog('Request error'); }
});

document.getElementById('btnLogout').addEventListener('click', async ()=>{
  setLog('Logging out...');
  const rt = getRefreshToken();
  try{
    await fetch(API+'/auth/logout', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ refreshToken: rt }) });
  }catch(e){}
  clearTokens();
  setLog('Logged out (tokens cleared)');
});

setLog('Demo ready — backend assumed at port 5000');