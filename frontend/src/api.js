const BASE=import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const getToken=()=>localStorage.getItem('eac_token');
export async function api(path,options={}){
 const res=await fetch(`${BASE}${path}`,{...options,headers:{'Content-Type':'application/json',...(getToken()?{Authorization:`Bearer ${getToken()}`} : {}),...(options.headers||{})}});
 const data=await res.json().catch(()=>({}));
 if(!res.ok) throw new Error(data.message||'Une erreur est survenue');
 return data;
}
