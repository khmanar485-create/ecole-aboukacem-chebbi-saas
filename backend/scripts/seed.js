import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
const {Pool}=pg; const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:false}:undefined});
const id=()=>randomUUID();
try {
 const schoolId='school-aboukacem-chebbi';
 await pool.query(`INSERT INTO schools(id,name,slug,email,plan) VALUES($1,$2,$3,$4,$5) ON CONFLICT(slug) DO NOTHING`,[schoolId,'École Aboukacem Chebbi','aboukacem-chebbi','contact@aboukacem.tn','PRO']);
 const school=(await pool.query('SELECT id FROM schools WHERE slug=$1',['aboukacem-chebbi'])).rows[0].id;
 const accounts=[['Administrateur SaaS','saas@demo.tn','SAAS_ADMIN',null],['Direction de l’école','direction@demo.tn','DIRECTOR',school],['Amira Ben Salem','enseignant@demo.tn','TEACHER',school],['Service comptabilité','compta@demo.tn','ACCOUNTANT',school],['Sonia Trabelsi','parent@demo.tn','PARENT',school],['Youssef Trabelsi','eleve@demo.tn','STUDENT',school]];
 for(const [name,email,role,sid] of accounts){const hash=await bcrypt.hash('Demo123!',12);await pool.query(`INSERT INTO users(id,school_id,full_name,email,password_hash,role) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(email) DO NOTHING`,[id(),sid,name,email,hash,role]);}
 const teacherUser=(await pool.query('SELECT id FROM users WHERE email=$1',['enseignant@demo.tn'])).rows[0].id;
 await pool.query('INSERT INTO teachers(id,school_id,user_id,specialty) VALUES($1,$2,$3,$4) ON CONFLICT(user_id) DO NOTHING',[id(),school,teacherUser,'Français']);
 const parentUser=(await pool.query('SELECT id FROM users WHERE email=$1',['parent@demo.tn'])).rows[0].id;
 await pool.query('INSERT INTO parents(id,school_id,user_id) VALUES($1,$2,$3) ON CONFLICT(user_id) DO NOTHING',[id(),school,parentUser]);
 const parent=(await pool.query('SELECT id FROM parents WHERE user_id=$1',[parentUser])).rows[0].id;
 await pool.query(`INSERT INTO classes(id,school_id,name,level,section,capacity,academic_year) VALUES($1,$2,'CE2-A','CE2','A',28,'2026-2027') ON CONFLICT(school_id,name,academic_year) DO NOTHING`,['class-demo-ce2',school]);
 const cls=(await pool.query('SELECT id FROM classes WHERE school_id=$1 AND name=$2 AND academic_year=$3',[school,'CE2-A','2026-2027'])).rows[0].id;
 const studentUser=(await pool.query('SELECT id FROM users WHERE email=$1',['eleve@demo.tn'])).rows[0].id;
 await pool.query(`INSERT INTO students(id,school_id,user_id,first_name,last_name,admission_year,class_id,parent_id) VALUES($1,$2,$3,'Youssef','Trabelsi','2024',$4,$5) ON CONFLICT(id) DO NOTHING`,['student-demo-youssef',school,studentUser,cls,parent]);
 for(const [i,name] of ['Français','Mathématiques','Sciences','Arabe'].entries()) await pool.query(`INSERT INTO subjects(id,school_id,name,coefficient,academic_year) VALUES($1,$2,$3,$4,'2026-2027') ON CONFLICT(id) DO NOTHING`,[`subject-demo-${i}`,school,name,name==='Mathématiques'?2:1]);
 await pool.query(`INSERT INTO announcements(id,school_id,title,body,audience) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING`,['announcement-welcome',school,'Bienvenue sur votre espace scolaire','Retrouvez ici les informations et actualités de l’établissement.','ALL']);
 console.log('Données de démonstration créées. Mot de passe des comptes : Demo123!');
} finally { await pool.end(); }
