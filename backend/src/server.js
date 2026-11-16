import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
const {Pool}=pg;
if(!process.env.DATABASE_URL) console.warn('DATABASE_URL absent : configure backend/.env puis exécutez npm run db:migrate.');
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:false}:undefined});
const app=express(); app.use(helmet()); app.use(cors({origin:process.env.CLIENT_URL?.split(',')||true,credentials:true})); app.use(express.json({limit:'5mb'})); app.use(morgan('dev'));
const uid=()=>randomUUID(); const secret=process.env.JWT_SECRET||'dev-secret-change-before-production';
const tokenFor=u=>jwt.sign({id:u.id,role:u.role,schoolId:u.school_id},secret,{expiresIn:'12h'});
const auth=(req,res,next)=>{try{const t=(req.headers.authorization||'').replace(/^Bearer\s+/,'');if(!t)return res.status(401).json({message:'Authentification requise.'});req.user=jwt.verify(t,secret);next();}catch{return res.status(401).json({message:'Session invalide ou expirée.'});}};
const allow=(...roles)=>(req,res,next)=>roles.includes(req.user.role)?next():res.status(403).json({message:'Accès non autorisé.'});
const run=(sql,args=[])=>pool.query(sql,args);
const getTunisiaToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Tunis',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const dateParts = Object.fromEntries(
    parts
      .filter(p => p.type !== 'literal')
      .map(p => [p.type, p.value])
  );

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
};


const isValidHireDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  const validCalendarDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return (
    validCalendarDate &&
    value >= '2000-01-01' &&
    value <= getTunisiaToday()
  );
}; // CLOSE hire-date function HERE

const isValidEnrollmentDate = (value) => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    value >= '2020-01-01' &&
    value <= getTunisiaToday()
  );
};

const hireDateError =
  'La date de recrutement doit être comprise entre le 01/01/2000 et aujourd’hui.';

const enrollmentDateError =
  'La date d’inscription doit être valide et ne pas être antérieure au 01/01/2020.';

const schoolFilter=(u,alias='')=>u.role==='SAAS_ADMIN'?{sql:'',args:[]}:{sql:` AND ${alias}school_id=$1`,args:[u.schoolId]};
async function audit(u,action,entity,entityId,details={}){try{await run('INSERT INTO audit_logs(id,school_id,actor_id,action,entity,entity_id,details) VALUES($1,$2,$3,$4,$5,$6,$7)',[uid(),u.schoolId||null,u.id,action,entity,entityId||null,JSON.stringify(details)]);}catch(e){console.error('Audit log:',e.message)}}
app.get('/api/health',async(req,res)=>{try{await run('SELECT 1');res.json({status:'ok',database:'connected',service:'ecole-saas-api'});}catch{res.status(503).json({status:'error',database:'disconnected'});}});
app.post('/api/auth/login',async(req,res)=>{try{const p=z.object({email:z.string().email(),password:z.string().min(1)}).parse(req.body);const q=await run('SELECT * FROM users WHERE lower(email)=lower($1)',[p.email]);const u=q.rows[0];if(!u||!u.is_active||!(await bcrypt.compare(p.password,u.password_hash)))return res.status(401).json({message:'Identifiants incorrects.'});let school=null;if(u.school_id){const s=await run('SELECT id,name,slug FROM schools WHERE id=$1',[u.school_id]);school=s.rows[0]||null;}res.json({token:tokenFor(u),user:{id:u.id,fullName:u.full_name,email:u.email,role:u.role,school},message:'Connexion réussie.'});}catch(e){res.status(400).json({message:e instanceof z.ZodError?'Veuillez vérifier les champs.':'Connexion impossible. Vérifiez la configuration de la base de données.'});}});
app.get('/api/auth/me',auth,async(req,res)=>{const q=await run('SELECT id,full_name AS "fullName",email,role,school_id AS "schoolId" FROM users WHERE id=$1',[req.user.id]);if(!q.rowCount)return res.status(404).json({message:'Utilisateur introuvable.'});res.json({user:q.rows[0]});});
app.get('/api/saas/schools',auth,allow('SAAS_ADMIN'),async(req,res)=>{const q=await run(`SELECT s.*,COUNT(DISTINCT u.id)::int AS user_count,COUNT(DISTINCT st.id)::int AS student_count FROM schools s LEFT JOIN users u ON u.school_id=s.id LEFT JOIN students st ON st.school_id=s.id GROUP BY s.id ORDER BY s.created_at DESC`);res.json(q.rows.map(x=>({...x,userCount:x.user_count,studentCount:x.student_count,_count:{users:x.user_count,students:x.student_count}})));});
app.post('/api/saas/schools',auth,allow('SAAS_ADMIN'),async(req,res)=>{try{const p=z.object({name:z.string().min(2),slug:z.string().min(3).regex(/^[a-z0-9-]+$/),email:z.string().email().optional(),plan:z.string().optional()}).parse(req.body);const q=await run('INSERT INTO schools(id,name,slug,email,plan) VALUES($1,$2,$3,$4,$5) RETURNING *',[uid(),p.name,p.slug,p.email||null,p.plan||'DEMO']);await audit(req.user,'CREATE','School',q.rows[0].id);res.status(201).json(q.rows[0]);}catch(e){res.status(409).json({message:'Création impossible : identifiant déjà utilisé ou données invalides.'});}});
const resources={
 students:{table:'students',roles:['DIRECTOR','ACCOUNTANT'],cols:{firstName:'first_name',lastName:'last_name',admissionYear:'admission_year',status:'status',classId:'class_id',parentId:'parent_id',birthDate:'birth_date',gender:'gender',address:'address',medicalNotes:'medical_notes'},select:'id,first_name AS "firstName",last_name AS "lastName",admission_year AS "admissionYear",status,class_id AS "classId",parent_id AS "parentId",birth_date AS "birthDate",gender,address,created_at AS "createdAt"'},
 classes:{table:'classes',roles:['DIRECTOR'],cols:{name:'name',level:'level',section:'section',capacity:'capacity',academicYear:'academic_year',teacherId:'teacher_id'},select:'id,name,level,section,capacity,academic_year AS "academicYear",teacher_id AS "teacherId",created_at AS "createdAt"'},
 subjects:{table:'subjects',roles:['DIRECTOR','TEACHER'],cols:{name:'name',coefficient:'coefficient',level:'level',academicYear:'academic_year'},select:'id,name,coefficient,level,academic_year AS "academicYear",created_at AS "createdAt"'},
 grades:{table:'grades',roles:['DIRECTOR','TEACHER'],cols:{studentId:'student_id',subjectId:'subject_id',assessment:'assessment',score:'score',maxScore:'max_score',term:'term',academicYear:'academic_year'},select:'id,student_id AS "studentId",subject_id AS "subjectId",assessment,score,max_score AS "maxScore",term,academic_year AS "academicYear",created_at AS "createdAt"'},
 attendance:{table:'attendance',roles:['DIRECTOR','TEACHER'],cols:{studentId:'student_id',date:'date',status:'status',justification:'justification'},select:'id,student_id AS "studentId",date,status,justification,created_at AS "createdAt"'},
 teachers:{table:'teachers',roles:['DIRECTOR'],cols:{specialty:'specialty',hireDate:'hire_date'},select:'t.id,t.specialty,t.hire_date AS "hireDate",u.full_name AS "fullName",u.email',join:' JOIN users u ON u.id=t.user_id'},
 rooms:{table:'rooms',roles:['DIRECTOR'],cols:{name:'name',capacity:'capacity',isAvailable:'is_available'},select:'id,name,capacity,is_available AS "isAvailable",created_at AS "createdAt"'},
 payments:{table:'payments',roles:['DIRECTOR','ACCOUNTANT'],cols:{studentId:'student_id',amount:'amount',method:'method',status:'status',reference:'reference',academicYear:'academic_year'},select:'id,student_id AS "studentId",amount,method,status,reference,academic_year AS "academicYear",paid_at AS "paidAt",created_at AS "createdAt"'},
 homework:{table:'homework',roles:['DIRECTOR','TEACHER'],cols:{title:'title',description:'description',classId:'class_id',subjectId:'subject_id',dueDate:'due_date',attachmentUrl:'attachment_url'},select:'id,title,description,class_id AS "classId",subject_id AS "subjectId",due_date AS "dueDate",attachment_url AS "attachmentUrl",created_at AS "createdAt"'},
 announcements:{table:'announcements',roles:['DIRECTOR'],cols:{title:'title',body:'body',audience:'audience'},select:'id,title,body,audience,published_at AS "publishedAt"'},
 timetable:{table:'timetable',roles:['DIRECTOR','TEACHER'],cols:{classId:'class_id',teacherId:'teacher_id',roomId:'room_id',subjectName:'subject_name',dayOfWeek:'day_of_week',startTime:'start_time',endTime:'end_time',academicYear:'academic_year'},select:'id,class_id AS "classId",teacher_id AS "teacherId",room_id AS "roomId",subject_name AS "subjectName",day_of_week AS "dayOfWeek",start_time AS "startTime",end_time AS "endTime",academic_year AS "academicYear'}
};
for(const [key,cfg] of Object.entries(resources)){
 app.get(`/api/${key}`,auth,async(req,res)=>{if(req.user.role!=='SAAS_ADMIN'&&!cfg.roles.includes(req.user.role))return res.status(403).json({message:'Accès non autorisé.'});const school=req.user.role==='SAAS_ADMIN'?'':`WHERE ${cfg.table}.school_id=$1`;const sql=cfg.join?`SELECT ${cfg.select} FROM ${cfg.table} t${cfg.join}${req.user.role==='SAAS_ADMIN'?'':' WHERE t.school_id=$1'} ORDER BY t.created_at DESC`:`SELECT ${cfg.select} FROM ${cfg.table} ${school} ORDER BY created_at DESC`;const q=await run(sql,req.user.role==='SAAS_ADMIN'?[]:[req.user.schoolId]);res.json(q.rows);});
 app.post(`/api/${key}`,auth,async(req,res)=>{if(!cfg.roles.includes(req.user.role))return res.status(403).json({message:'Accès non autorisé.'});try{
 if(key==='students'){
  if(!isValidEnrollmentDate(req.body.admissionYear)){
   return res.status(400).json({
    message: enrollmentDateError
   });
  }
 }

 if(key==='teachers'){const p = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  specialty: z.string().optional(),
  hireDate: z.string().optional().refine(
    v => !v || isValidHireDate(v),
    { message: hireDateError }
  )
}).parse(req.body);;const client=await pool.connect();try{await client.query('BEGIN');const userId=uid(),teacherId=uid();await client.query('INSERT INTO users(id,school_id,full_name,email,password_hash,role) VALUES($1,$2,$3,$4,$5,$6)',[userId,req.user.schoolId,p.fullName,p.email,await bcrypt.hash(p.password,12),'TEACHER']);const q=await client.query('INSERT INTO teachers(id,school_id,user_id,specialty,hire_date) VALUES($1,$2,$3,$4,$5) RETURNING id,specialty,hire_date AS "hireDate"',[teacherId,req.user.schoolId,userId,p.specialty||null,p.hireDate||null]);await client.query('COMMIT');await audit(req.user,'CREATE',key,teacherId);return res.status(201).json({...q.rows[0],fullName:p.fullName,email:p.email});}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}
 const pairs=Object.entries(cfg.cols).filter(([k])=>req.body[k]!==undefined);const cols=['id','school_id',...pairs.map(([,c])=>c)];const vals=[uid(),req.user.schoolId,...pairs.map(([k])=>req.body[k])];const marks=vals.map((_,i)=>`$${i+1}`);const q=await run(`INSERT INTO ${cfg.table}(${cols.join(',')}) VALUES(${marks.join(',')}) RETURNING ${cfg.select}` ,vals);await audit(req.user,'CREATE',key,q.rows[0].id);res.status(201).json(q.rows[0]);}catch(e){res.status(400).json({message:'Création impossible. Vérifiez les champs obligatoires et les références.',detail:process.env.NODE_ENV==='development'?e.message:undefined});}});
 app.patch(`/api/${key}/:id`,auth,async(req,res)=>{if(!cfg.roles.includes(req.user.role))return res.status(403).json({message:'Accès non autorisé.'});try{
 if(key==='students' && req.body.admissionYear!==undefined){
  if(!isValidEnrollmentDate(req.body.admissionYear)){
   return res.status(400).json({
    message: enrollmentDateError
   });
  }
 }

 const pairs=Object.entries(cfg.cols).filter(([k])=>req.body[k]!==undefined);if(!pairs.length)return res.status(400).json({message:'Aucune modification fournie.'});const vals=pairs.map(([k])=>req.body[k]);const set=pairs.map(([,c],i)=>`${c}=$${i+1}`).join(',');vals.push(req.params.id,req.user.schoolId);const q=await run(`UPDATE ${cfg.table} SET ${set} WHERE id=$${vals.length-1} AND school_id=$${vals.length} RETURNING id`,vals);if(!q.rowCount)return res.status(404).json({message:'Élément introuvable.'});await audit(req.user,'UPDATE',key,req.params.id,req.body);res.json({id:req.params.id,...req.body});}catch(e){res.status(400).json({message:'Modification impossible : vérifiez les données liées.'});}});
 app.delete(`/api/${key}/:id`,auth,async(req,res)=>{if(!cfg.roles.includes(req.user.role))return res.status(403).json({message:'Accès non autorisé.'});try{const q=await run(`DELETE FROM ${cfg.table} WHERE id=$1 AND school_id=$2 RETURNING id`,[req.params.id,req.user.schoolId]);if(!q.rowCount)return res.status(404).json({message:'Élément introuvable.'});await audit(req.user,'DELETE',key,req.params.id);res.json({message:'Élément supprimé.'});}catch{res.status(409).json({message:'Suppression impossible : cet élément est utilisé par d’autres données.'});}});
}
app.get('/api/dashboard',auth,async(req,res)=>{if(req.user.role==='SAAS_ADMIN'){const [s,u]=await Promise.all([run('SELECT COUNT(*)::int n FROM schools'),run('SELECT COUNT(*)::int n FROM users')]);return res.json({scope:'saas',kpis:[{label:'Établissements',value:s.rows[0].n},{label:'Utilisateurs',value:u.rows[0].n}],series:[]});}const sid=req.user.schoolId;const [st,te,cl,pm,ab,gr,un]=await Promise.all([run('SELECT COUNT(*)::int n FROM students WHERE school_id=$1',[sid]),run('SELECT COUNT(*)::int n FROM teachers WHERE school_id=$1',[sid]),run('SELECT COUNT(*)::int n FROM classes WHERE school_id=$1',[sid]),run('SELECT COALESCE(SUM(amount),0)::numeric total FROM payments WHERE school_id=$1',[sid]),run("SELECT COUNT(*)::int n FROM attendance WHERE school_id=$1 AND status='ABSENT'",[sid]),run('SELECT ROUND(AVG((g.score/g.max_score)*20),1) avg FROM grades g WHERE g.school_id=$1',[sid]),run('SELECT COUNT(*)::int n FROM messages WHERE school_id=$1 AND recipient_id=$2 AND read_at IS NULL',[sid,req.user.id])]);const money=Number(pm.rows[0].total);res.json({scope:'school',kpis:[{label:'Élèves inscrits',value:st.rows[0].n,icon:'users',tone:'blue'},{label:'Enseignants',value:te.rows[0].n,icon:'graduation-cap',tone:'violet'},{label:'Classes',value:cl.rows[0].n,icon:'school',tone:'cyan'},{label:'Recettes enregistrées',value:`${money.toLocaleString('fr-FR')} TND`,icon:'wallet',tone:'green'},{label:'Absences cumulées',value:ab.rows[0].n,icon:'calendar-x',tone:'orange'},{label:'Moyenne générale',value:gr.rows[0].avg??'—',icon:'chart',tone:'blue'},{label:'Messages non lus',value:un.rows[0].n,icon:'mail',tone:'violet'}],series:[]});});
app.get('/api/messages',auth,async(req,res)=>{const q=await run(`SELECT id,sender_id AS "senderId",recipient_id AS "recipientId",subject,body,sent_at AS "sentAt",read_at AS "readAt" FROM messages WHERE school_id=$1 AND (sender_id=$2 OR recipient_id=$2) ORDER BY sent_at DESC`,[req.user.schoolId,req.user.id]);res.json(q.rows);});
app.post('/api/messages',auth,async(req,res)=>{try{const p=z.object({recipientId:z.string(),subject:z.string().min(2),body:z.string().min(1)}).parse(req.body);const r=await run('SELECT id,role FROM users WHERE id=$1 AND school_id=$2 AND is_active=true',[p.recipientId,req.user.schoolId]);if(!r.rowCount)return res.status(404).json({message:'Destinataire introuvable.'});const permitted={DIRECTOR:['PARENT','STUDENT','TEACHER','ACCOUNTANT'],TEACHER:['PARENT'],PARENT:['TEACHER','DIRECTOR'],STUDENT:['DIRECTOR','TEACHER'],ACCOUNTANT:['DIRECTOR','PARENT']};if(!(permitted[req.user.role]||[]).includes(r.rows[0].role))return res.status(403).json({message:'Ce destinataire ne peut pas être contacté avec votre rôle.'});const id=uid();const q=await run('INSERT INTO messages(id,school_id,sender_id,recipient_id,subject,body) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,sender_id AS "senderId",recipient_id AS "recipientId",subject,body,sent_at AS "sentAt"',[id,req.user.schoolId,req.user.id,p.recipientId,p.subject,p.body]);await run('INSERT INTO notifications(id,school_id,user_id,title,body) VALUES($1,$2,$3,$4,$5)',[uid(),req.user.schoolId,p.recipientId,'Nouveau message',p.subject]);await audit(req.user,'SEND','Message',id);res.status(201).json(q.rows[0]);}catch(e){res.status(400).json({message:'Message incomplet ou invalide.'});}});
app.get('/api/notifications',auth,async(req,res)=>{const q=await run('SELECT id,title,body,read_at AS "readAt",created_at AS "createdAt" FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',[req.user.id]);res.json(q.rows);});
app.get('/api/audit',auth,allow('DIRECTOR','SAAS_ADMIN'),async(req,res)=>{const q=await run(`SELECT id,action,entity,entity_id AS "entityId",details,created_at AS "createdAt" FROM audit_logs ${req.user.role==='SAAS_ADMIN'?'':'WHERE school_id=$1'} ORDER BY created_at DESC LIMIT 100`,req.user.role==='SAAS_ADMIN'?[]:[req.user.schoolId]);res.json(q.rows);});
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({message:'Une erreur interne est survenue.'});});
const port=process.env.PORT||4000;const server=app.listen(port,()=>console.log(`API École SaaS démarrée sur http://localhost:${port}`));
process.on('SIGTERM',async()=>{server.close();await pool.end();});
