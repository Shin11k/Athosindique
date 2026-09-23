import { env } from 'cloudflare:workers';
export function db(){const d=(env as unknown as {DB:D1Database}).DB;if(!d)throw new Error('Banco indisponível');return d;}
export function ownerEmail(){return (env as unknown as {ADMIN_OWNER_EMAIL?:string}).ADMIN_OWNER_EMAIL;}
export const digits=(s:string)=>s.replace(/\D/g,'');
export function cpfValid(s:string){const c=digits(s);if(!/^\d{11}$/.test(c)||/^(\d)\1+$/.test(c))return false;for(let n=9;n<11;n++){let sum=0;for(let i=0;i<n;i++)sum+=Number(c[i])*(n+1-i);let d=(sum*10)%11;if(d===10)d=0;if(d!==Number(c[n]))return false;}return true;}
export function field(v:unknown,label:string,min=2,max=160){if(typeof v!=='string'||v.trim().length<min||v.length>max)throw new Error('Confira '+label+'.');return v.trim();}
