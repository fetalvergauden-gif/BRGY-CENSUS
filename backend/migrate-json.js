import 'dotenv/config';
import fs from 'node:fs';
import mysql from 'mysql2/promise';
const pool=await mysql.createPool({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'barangay_census_db'});
const file=new URL('./census-records.json',import.meta.url);
const records=JSON.parse(fs.readFileSync(file,'utf8'));
for(const r of records){const id=String(r.id||r.householdNumber);await pool.execute(`INSERT INTO households (id,household_number,household_head,sitio,census_year,status,payload) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE household_head=VALUES(household_head),sitio=VALUES(sitio),census_year=VALUES(census_year),status=VALUES(status),payload=VALUES(payload)`,[id,r.householdNumber||id,r.householdHead||'',r.address?.sitio||'',Number(r.censusYear)||new Date().getFullYear(),r.status||'Submitted',JSON.stringify({...r,id})]);await pool.execute('DELETE FROM residents WHERE household_id=?',[id]);for(const m of r.members||[])await pool.execute('INSERT INTO residents (household_id,full_name,payload) VALUES (?,?,?)',[id,m.fullName||m.name||'',JSON.stringify(m)]);}
console.log(`Imported ${records.length} household records.`);await pool.end();
