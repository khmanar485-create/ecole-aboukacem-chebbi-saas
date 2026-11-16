import React,{useEffect,useState} from 'react';
import {Routes,Route,Navigate,useNavigate,NavLink,Outlet} from 'react-router-dom';
import {LayoutDashboard,Users,GraduationCap,BookOpen,DoorOpen,CalendarDays,ClipboardList,Wallet,MessagesSquare,FileText,Bell,Settings,LogOut,Menu,X,School,ChartNoAxesCombined,ShieldCheck,Search,Plus,ChevronRight,ArrowUpRight,Clock3,CheckCircle2,AlertCircle,Trash2,Edit,Download,Send,UserRound,Building2,BookMarked,CalendarCheck,ClipboardCheck,ChartPie} from 'lucide-react';
import {api} from './api';
const roleNames={SAAS_ADMIN:'Administrateur SaaS',DIRECTOR:'Direction',TEACHER:'Enseignant',ACCOUNTANT:'Comptabilité',PARENT:'Parent',STUDENT:'Élève'};
const nav=[
 {label:'Vue générale',path:'/',icon:LayoutDashboard,roles:['ALL']},
 {label:'Établissements',path:'/schools',icon:Building2,roles:['SAAS_ADMIN']},
 {label:'Élèves',path:'/students',icon:Users,roles:['DIRECTOR','ACCOUNTANT','TEACHER']},
 {label:'Enseignants',path:'/teachers',icon:GraduationCap,roles:['DIRECTOR']},
 {label:'Classes',path:'/classes',icon:School,roles:['DIRECTOR','TEACHER']},
 {label:'Matières',path:'/subjects',icon:BookOpen,roles:['DIRECTOR','TEACHER']},
 {label:'Salles',path:'/rooms',icon:DoorOpen,roles:['DIRECTOR']},
 {label:'Emploi du temps',path:'/timetable',icon:CalendarDays,roles:['DIRECTOR','TEACHER','PARENT','STUDENT']},
 {label:'Notes & évaluations',path:'/grades',icon:ClipboardList,roles:['DIRECTOR','TEACHER','PARENT','STUDENT']},
 {label:'Présences',path:'/attendance',icon:CalendarCheck,roles:['DIRECTOR','TEACHER','PARENT']},
 {label:'Paiements',path:'/payments',icon:Wallet,roles:['DIRECTOR','ACCOUNTANT','PARENT']},
 {label:'Devoirs',path:'/homework',icon:BookMarked,roles:['DIRECTOR','TEACHER','PARENT','STUDENT']},
 {label:'Messagerie',path:'/messages',icon:MessagesSquare,roles:['ALL']},
 {label:'Annonces',path:'/announcements',icon:Bell,roles:['DIRECTOR','TEACHER','PARENT','STUDENT']},
 {label:'Documents',path:'/documents',icon:FileText,roles:['ALL']},
 {label:'Business Intelligence',path:'/bi',icon:ChartNoAxesCombined,roles:['DIRECTOR','ACCOUNTANT','SAAS_ADMIN']},
 {label:'Journal d’activité',path:'/audit',icon:ShieldCheck,roles:['DIRECTOR','SAAS_ADMIN']},
 {label:'Paramètres',path:'/settings',icon:Settings,roles:['DIRECTOR','SAAS_ADMIN']}
];
function App(){
 const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('eac_user'))}catch{return null}});
 const [token,setToken]=useState(()=>localStorage.getItem('eac_token'));
 const logout=()=>{localStorage.removeItem('eac_token');localStorage.removeItem('eac_user');setToken(null);setUser(null)};
 return <Routes><Route path="/login" element={user?<Navigate to="/" replace/>:<Login onLogin={(u,t)=>{setUser(u);setToken(t)}}/>}/><Route element={user&&token?<Shell user={user} onLogout={logout}/>:<Navigate to="/login" replace/>}>
 <Route path="/" element={<Dashboard user={user}/>}/>
 {nav.filter(n=>n.path!=='/').map(n=><Route key={n.path} path={n.path.slice(1)} element={<ModulePage moduleKey={n.path.slice(1)} user={user}/>}/>)}
 <Route path="*" element={<Navigate to="/" replace/>}/>
 </Route></Routes>;
}
function Login({onLogin}){
 const [email,setEmail]=useState('direction@demo.tn'),[password,setPassword]=useState('Demo123!'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{const d=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});localStorage.setItem('eac_token',d.token);localStorage.setItem('eac_user',JSON.stringify(d.user));onLogin(d.user,d.token)}catch(e){setError(e.message)}finally{setBusy(false)}};
 return <div className="login-page"><div className="login-visual"><div className="brand-mark"><School size={30}/></div><div className="login-copy"><span className="eyebrow">ESPACE NUMÉRIQUE SCOLAIRE</span><h1>La réussite de chaque élève commence ici.</h1><p>Une plateforme unique pour connecter l’école, les familles et les équipes pédagogiques.</p><div className="visual-stats"><span><b>360°</b><small>Suivi scolaire</small></span><span><b>24/7</b><small>Accès sécurisé</small></span><span><b>1</b><small>Espace connecté</small></span></div></div><div className="visual-footer">École Aboukacem Chebbi · Sousse, Tunisie</div></div><div className="login-panel"><div className="login-form-wrap"><div className="mobile-brand"><School/> École Aboukacem Chebbi</div><span className="eyebrow">BON RETOUR</span><h2>Connectez-vous</h2><p className="muted">Accédez à votre espace de travail.</p><form onSubmit={submit}><label>Adresse e-mail</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="nom@ecole.tn"/><label>Mot de passe</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Votre mot de passe"/>{error&&<div className="error-msg">{error}</div>}<button className="primary full" disabled={busy}>{busy?'Connexion…':'Se connecter'} <ChevronRight size={17}/></button></form><div className="demo-box"><b>Accès de démonstration</b><p>Direction : direction@demo.tn</p><p>Mot de passe : Demo123!</p><small>Les autres profils de démonstration sont indiqués dans le README.</small></div><div className="login-bottom">© 2026 École Aboukacem Chebbi · Tous droits réservés</div></div></div></div>
}
function Shell({user,onLogout}){
 const [open,setOpen]=useState(false);
 const visible=nav.filter(n=>n.roles.includes('ALL')||n.roles.includes(user.role));
 return <div className="app-shell"><aside className={`sidebar ${open?'show':''}`}><div className="side-brand"><div className="brand-mark small"><School size={22}/></div><div><b>Aboukacem Chebbi</b><small>ESPACE SCOLAIRE</small></div><button className="mobile-close" onClick={()=>setOpen(false)}><X/></button></div><div className="school-chip"><span className="school-avatar"><School size={17}/></span><span><b>{user.school?.name||'Console SaaS'}</b><small>{roleNames[user.role]}</small></span></div><div className="nav-caption">MENU PRINCIPAL</div><nav>{visible.map(n=><NavLink key={n.path} to={n.path} end={n.path==='/'} onClick={()=>setOpen(false)} className={({isActive})=>`nav-link ${isActive?'active':''}`}><n.icon size={18}/><span>{n.label}</span>{n.path==='/messages'&&<i className="nav-dot"/>}</NavLink>)}</nav><div className="side-bottom"><div className="help-card"><div className="help-icon"><ShieldCheck size={17}/></div><b>Votre espace est protégé</b><p>Vos données scolaires sont accessibles selon vos autorisations.</p></div><button className="logout-btn" onClick={onLogout}><LogOut size={18}/> Déconnexion</button></div></aside><div className="main-area"><header className="topbar"><button className="menu-toggle" onClick={()=>setOpen(!open)}><Menu/></button><div className="breadcrumb">Espace de travail <ChevronRight size={14}/> <b>{roleNames[user.role]}</b></div><div className="top-actions"><button className="icon-btn" title="Notifications"><Bell size={19}/><i/></button><div className="profile"><div className="avatar">{user.fullName?.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div><b>{user.fullName}</b><small>{roleNames[user.role]}</small></div></div></div></header><main className="content"><Outlet/></main><footer className="footer">© 2026 École Aboukacem Chebbi <span>Plateforme de gestion scolaire</span></footer></div>{open&&<div className="mobile-overlay" onClick={()=>setOpen(false)}/>}</div>
}
function PageHeader({eyebrow,title,subtitle,action}){return <div className="page-header"><div><div className="eyebrow">{eyebrow||'GESTION SCOLAIRE'}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>}
function Dashboard({user}){
 const [data,setData]=useState(null),[err,setErr]=useState('');
 useEffect(()=>{api('/dashboard').then(setData).catch(e=>setErr(e.message))},[]);
 return <><PageHeader eyebrow="TABLEAU DE BORD" title={`Bonjour, ${user.fullName?.split(' ')[0]} 👋`} subtitle="Voici un aperçu de l’activité de votre espace scolaire." action={<button className="outline-btn"><Clock3 size={16}/> Année scolaire 2026–2027</button>}/>{err&&<div className="error-msg">{err}</div>}<div className="welcome-banner"><div><span className="banner-label">ESPACE DE PILOTAGE</span><h2>Ensemble, faisons grandir les réussites.</h2><p>Retrouvez les indicateurs clés et les dernières informations de votre établissement.</p></div><div className="banner-art"><div className="art-circle"><GraduationCap size={68}/></div></div></div><div className="section-head"><div><h3>Indicateurs clés</h3><p>Vue synthétique de votre établissement</p></div><span className="live-label"><i/> Données en direct</span></div><div className="kpi-grid">{(data?.kpis||[]).map((k,i)=><div className="kpi-card" key={k.label}><div className={`kpi-icon tone-${k.tone||['blue','violet','cyan','green'][i%4]}`}><ChartPie size={19}/></div><div className="kpi-value">{k.value}</div><div className="kpi-label">{k.label}</div><div className="kpi-foot"><span className="positive">Vue actualisée</span><ArrowUpRight size={14}/></div></div>)}</div><div className="dashboard-bottom"><div className="panel chart-panel"><div className="panel-heading"><div><h3>Activité de l’établissement</h3><p>Exemple de tendance mensuelle</p></div><span className="tag">2026–2027</span></div><div className="chart-bars">{['Jan','Fév','Mar','Avr','Mai','Juin'].map((m,i)=><div className="bar-col" key={m}><div className="bar-track"><div className="bar-fill" style={{height:[42,55,48,68,76,90][i]+'%'}}/></div><small>{m}</small></div>)}</div><div className="chart-legend"><span><i className="legend-dot teal"/> Activité mensuelle</span><span className="muted">Illustration — connectez vos données pour les valeurs réelles</span></div></div><div className="panel quick-panel"><div className="panel-heading"><div><h3>Accès rapides</h3><p>Les actions les plus utilisées</p></div></div><div className="quick-list"><Quick to="/students" icon={Users} label="Gérer les élèves" desc="Dossiers et inscriptions"/><Quick to="/payments" icon={Wallet} label="Suivre les paiements" desc="Recettes et impayés"/><Quick to="/messages" icon={MessagesSquare} label="Ouvrir la messagerie" desc="Échanges et annonces"/><Quick to="/bi" icon={ChartNoAxesCombined} label="Consulter les analyses" desc="Indicateurs décisionnels"/></div></div></div><div className="notice-strip"><CheckCircle2 size={18}/><span><b>Bienvenue sur votre plateforme.</b> Les menus disponibles dépendent de votre profil et de vos autorisations.</span></div></>
}
function Quick({to,icon:Icon,label,desc}){return <NavLink to={to} className="quick-item"><span className="quick-icon"><Icon size={18}/></span><span><b>{label}</b><small>{desc}</small></span><ChevronRight size={16}/></NavLink>}
const config={
 students:{title:'Gestion des élèves',sub:'Centralisez les dossiers, inscriptions et affectations.',icon:Users,endpoint:'/students',columns:[['firstName','Prénom'],['lastName','Nom'],['admissionYear','Année d’entrée'],['status','Statut']],fields:[['firstName','Prénom'],['lastName','Nom'],['admissionYear','Année d’entrée'],['classId','Identifiant de classe'],['status','Statut']]},
 classes:{title:'Classes & niveaux',sub:'Organisez les niveaux, sections et capacités.',icon:School,endpoint:'/classes',columns:[['name','Classe'],['level','Niveau'],['section','Section'],['capacity','Capacité']],fields:[['name','Nom de la classe'],['level','Niveau'],['section','Section'],['capacity','Capacité'],['academicYear','Année scolaire']]},
 subjects:{title:'Matières',sub:'Gérez les disciplines et leurs coefficients.',icon:BookOpen,endpoint:'/subjects',columns:[['name','Matière'],['coefficient','Coefficient'],['level','Niveau'],['academicYear','Année scolaire']],fields:[['name','Nom'],['coefficient','Coefficient'],['level','Niveau'],['academicYear','Année scolaire']]},
 grades:{title:'Notes & évaluations',sub:'Saisissez les évaluations et suivez les résultats.',icon:BookOpen,endpoint:'/grades',columns:[['studentId','Élève (ID)'],['subjectId','Matière (ID)'],['assessment','Évaluation'],['score','Note'],['term','Trimestre']],fields:[['studentId','Identifiant élève'],['subjectId','Identifiant matière'],['assessment','Évaluation'],['score','Note obtenue'],['maxScore','Barème'],['term','Trimestre'],['academicYear','Année scolaire']]},
 attendance:{title:'Présences & absences',sub:'Enregistrez les présences et les justificatifs.',icon:CalendarDays,endpoint:'/attendance',columns:[['studentId','Élève (ID)'],['date','Date'],['status','Statut'],['justification','Justificatif']],fields:[['studentId','Identifiant élève'],['date','Date'],['status','Statut (PRESENT/ABSENT/LATE/EXCUSED)'],['justification','Justification']]},
 teachers:{title:'Enseignants',sub:'Suivez les équipes pédagogiques et leurs spécialités.',icon:GraduationCap,endpoint:'/teachers',columns:[['fullName','Enseignant'],['email','E-mail'],['specialty','Spécialité'],['hireDate','Date de recrutement']],fields:[['fullName','Nom complet'],['email','E-mail professionnel'],['password','Mot de passe initial'],['specialty','Spécialité'],['hireDate','Date de recrutement']]},
 rooms:{title:'Gestion des salles',sub:'Répertoriez les salles et leur capacité.',icon:DoorOpen,endpoint:'/rooms',columns:[['name','Salle'],['capacity','Capacité'],['isAvailable','Disponibilité']],fields:[['name','Nom'],['capacity','Capacité'],['isAvailable','Disponible (true/false)']]},
 payments:{title:'Gestion financière',sub:'Suivez les règlements et les opérations financières.',icon:Wallet,endpoint:'/payments',columns:[['amount','Montant (TND)'],['method','Mode'],['status','Statut'],['academicYear','Année']],fields:[['studentId','Identifiant élève'],['amount','Montant'],['method','Mode (CASH/BANK_TRANSFER/MOBILE_MONEY)'],['status','Statut (PAID/PARTIAL/UNPAID)'],['academicYear','Année scolaire']]},
 homework:{title:'Devoirs & travaux',sub:'Publiez les devoirs et suivez les remises.',icon:BookMarked,endpoint:'/homework',columns:[['title','Titre'],['dueDate','Date limite']],fields:[['title','Titre'],['description','Description'],['classId','Identifiant classe'],['subjectId','Identifiant matière'],['dueDate','Date limite']]},
 announcements:{title:'Annonces',sub:'Diffusez les informations importantes aux familles et aux équipes.',icon:Bell,endpoint:'/announcements',columns:[['title','Titre'],['audience','Audience'],['publishedAt','Date de publication']],fields:[['title','Titre'],['body','Contenu'],['audience','Audience (ALL/PARENTS/TEACHERS/STUDENTS)']]},
 timetable:{title:'Emploi du temps',sub:'Planifiez les cours et organisez les créneaux.',icon:CalendarDays,endpoint:'/timetable',columns:[['subjectName','Matière'],['dayOfWeek','Jour (0–6)'],['startTime','Début'],['endTime','Fin']],fields:[['classId','Identifiant classe'],['subjectName','Matière'],['dayOfWeek','Jour (0–6)'],['startTime','Heure début'],['endTime','Heure fin'],['academicYear','Année scolaire']]}
};
function ModulePage({moduleKey,user}){
 if(moduleKey==='bi')return <BI/>;
 if(moduleKey==='messages')return <Messages user={user}/>;
 if(moduleKey==='schools')return <Schools/>;
 if(moduleKey==='grades')return <InfoPage title="Notes & évaluations" sub="Saisie des notes, calcul des moyennes pondérées et préparation des bulletins." items={['Évaluations par matière et par trimestre','Calcul automatique des moyennes selon les coefficients','Bulletins scolaires téléchargeables en PDF','Consultation des résultats par les parents']}/>;
 if(moduleKey==='attendance')return <InfoPage title="Suivi des présences" sub="Consultez les absences et gérez les justificatifs." items={['Registre des présences par classe','Suivi des retards et absences','Justificatifs transmis par les parents','Indicateurs d’absentéisme']}/>;
 if(moduleKey==='documents')return <InfoPage title="Documents & bulletins" sub="Un espace centralisé pour les documents de la communauté scolaire." items={['Bulletins et relevés de notes','Reçus de paiement','Documents administratifs','Pièces jointes et justificatifs']}/>;
 if(moduleKey==='audit')return <Audit/>;
 if(moduleKey==='settings')return <InfoPage title="Paramètres" sub="Configuration de l’établissement et de votre espace." items={['Informations de l’établissement','Année scolaire active','Gestion des utilisateurs et permissions','Préférences de notifications','Sécurité et confidentialité']}/>;
 const cfg=config[moduleKey];return cfg?<CrudPage cfg={cfg} user={user}/>:<InfoPage title="Espace scolaire" sub="Module en cours de configuration." items={[]}/>;
}


function CrudPage({cfg,user}){
 const [items,setItems]=useState([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [modal,setModal]=useState(false);
 const [editing,setEditing]=useState(null);
 const [form,setForm]=useState({});

 const today = new Date();
 const todayLocal = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

 const load=()=>{
  setLoading(true);
  api(cfg.endpoint)
   .then(setItems)
   .catch(e=>setError(e.message))
   .finally(()=>setLoading(false));
 };

 useEffect(()=>{
  load();
 },[cfg.endpoint]);

 const save=async e=>{
  e.preventDefault();
  setError('');

  // Validate teacher recruitment date
  if(cfg.endpoint==='/teachers' && form.hireDate){
   if(
    form.hireDate<'2000-01-01' ||
    form.hireDate>todayLocal
   ){
    setError('La date de recrutement doit être comprise entre le 01/01/2000 et aujourd’hui.');
    return;
   }
  }

  // Validate student enrollment date
  if (cfg.endpoint === '/students' && form.admissionYear) {
  if (
    form.admissionYear < '2020-01-01' ||
    form.admissionYear > todayLocal
  ) {
    setError('La date d’inscription doit être comprise entre le 01/01/2020 et aujourd’hui.');
    return;
  }
}

  try{
   const url=editing
    ?`${cfg.endpoint}/${editing.id}`
    :cfg.endpoint;

   await api(url,{
    method:editing?'PATCH':'POST',
    body:JSON.stringify(form)
   });

   setModal(false);
   setForm({});
   setEditing(null);
   load();
  }catch(e){
   setError(e.message);
  }
 };

 const remove=async id=>{
  if(!confirm('Confirmer la suppression de cet élément ?'))return;

  try{
   await api(`${cfg.endpoint}/${id}`,{method:'DELETE'});
   load();
  }catch(e){
   setError(e.message);
  }
 };

 const openEdit=item=>{
  setEditing(item);
  setForm(
   Object.fromEntries(
    cfg.fields.map(([k])=>[k,item[k]??''])
   )
  );
  setModal(true);
 };

 return <>
  <PageHeader
   title={cfg.title}
   subtitle={cfg.sub}
   action={
    <button
     className="primary"
     onClick={()=>{
      setEditing(null);
      setForm({});
      setError('');
      setModal(true);
     }}
    >
     <Plus size={17}/> Ajouter
    </button>
   }
  />

  <div className="toolbar">
   <div className="search-box">
    <Search size={17}/>
    <input placeholder="Rechercher dans la liste…"/>
   </div>
   <span className="count-label">{items.length} élément(s)</span>
  </div>

  {error&&<div className="error-msg">{error}</div>}

  <div className="panel table-panel">
   {loading?
    <div className="empty-state">Chargement des données…</div>
    :
    items.length===0?
    <div className="empty-state">
     <cfg.icon size={34}/>
     <b>Aucun élément pour le moment</b>
     <span>Commencez par ajouter votre premier élément.</span>
     <button
      className="primary"
      onClick={()=>{
       setEditing(null);
       setForm({});
       setError('');
       setModal(true);
      }}
     >
      <Plus size={16}/> Ajouter
     </button>
    </div>
    :
    <div className="table-scroll">
     <table>
      <thead>
       <tr>
        {cfg.columns.map(c=><th key={c[0]}>{c[1]}</th>)}
        <th>Actions</th>
       </tr>
      </thead>
      <tbody>
       {items.map(item=>
        <tr key={item.id}>
         {cfg.columns.map(([key])=>
          <td key={key}>
           {typeof item[key]==='boolean'
            ?(item[key]?'Disponible':'Indisponible')
            :item[key]??'—'}
          </td>
         )}
         <td>
          <div className="row-actions">
           <button title="Modifier" onClick={()=>openEdit(item)}>
            <Edit size={16}/>
           </button>
           <button title="Supprimer" onClick={()=>remove(item.id)}>
            <Trash2 size={16}/>
           </button>
          </div>
         </td>
        </tr>
       )}
      </tbody>
     </table>
    </div>
   }
  </div>

  {modal&&
   <div className="modal-backdrop" onClick={()=>setModal(false)}>
    <div className="modal" onClick={e=>e.stopPropagation()}>
     <div className="modal-head">
      <div>
       <span className="eyebrow">FORMULAIRE</span>
       <h3>{editing?'Modifier':'Ajouter'} — {cfg.title}</h3>
      </div>
      <button className="icon-btn" onClick={()=>setModal(false)}>
       <X/>
      </button>
     </div>

     <form onSubmit={save}>
      <div className="form-grid">
       {cfg.fields.map(([key,label])=>
        <label key={key}>
         {label}
         <input
          value={form[key]??''}
          onChange={e=>setForm({...form,[key]:e.target.value})}
          type={
           key==='email'?'email':
           key==='password'?'password':
           key==='admissionYear'?'date':
           key.toLowerCase().includes('date')?'date':
           'text'
          }
          min={
  key === 'hireDate' ? '2000-01-01' :
  key === 'admissionYear' ? '2020-01-01' :
  undefined
}
max={
  key === 'hireDate' || key === 'admissionYear'
    ? todayLocal
    : undefined
}
required={
  ['name','firstName','lastName','title','amount','level','academicYear','subjectName','admissionYear'].includes(key) ||
  (key === 'password' && !editing)
}
         />
        </label>
       )}
      </div>

      <div className="modal-actions">
       <button
        type="button"
        className="outline-btn"
        onClick={()=>setModal(false)}
       >
        Annuler
       </button>
       <button className="primary" type="submit">
        Enregistrer
       </button>
      </div>
     </form>
    </div>
   </div>
  }
 </>;
}


function Schools(){
 const [items,setItems]=useState([]),[name,setName]=useState(''),[slug,setSlug]=useState('');
 useEffect(()=>{api('/saas/schools').then(setItems).catch(()=>{})},[]);
 const add=async e=>{e.preventDefault();try{const s=await api('/saas/schools',{method:'POST',body:JSON.stringify({name,slug})});setItems([s,...items]);setName('');setSlug('')}catch(e){alert(e.message)}};
 return <><PageHeader title="Établissements clients" subtitle="Administrez les écoles inscrites sur la plateforme SaaS."/><div className="panel form-panel"><h3>Créer un établissement</h3><form className="inline-form" onSubmit={add}><input placeholder="Nom de l’établissement" value={name} onChange={e=>setName(e.target.value)} required/><input placeholder="Identifiant (ex. ecole-sousse)" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} required/><button className="primary"><Plus size={16}/> Créer</button></form></div><div className="school-grid">{items.map(s=><div className="panel school-card" key={s.id}><div className="school-avatar"><School/></div><h3>{s.name}</h3><p>{s.slug}</p><div className="school-meta"><span>{s._count?.users||0} utilisateurs</span><span>{s._count?.students||0} élèves</span></div><span className="tag">{s.plan}</span></div>)}</div></>;
}
function Messages({user}){
 const [items,setItems]=useState([]),[recipient,setRecipient]=useState(''),[subject,setSubject]=useState(''),[body,setBody]=useState(''),[error,setError]=useState('');
 const load=()=>api('/messages').then(setItems).catch(e=>setError(e.message));useEffect(()=>{load()},[]);
 const send=async e=>{e.preventDefault();try{await api('/messages',{method:'POST',body:JSON.stringify({recipientId:recipient,subject,body})});setSubject('');setBody('');load()}catch(e){setError(e.message)}};
 return <><PageHeader title="Messagerie" subtitle="Échangez avec les familles, les enseignants et l’administration."/><div className="message-layout"><div className="panel compose"><h3>Nouveau message</h3><form onSubmit={send}><label>ID du destinataire</label><input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Identifiant utilisateur" required/><label>Objet</label><input value={subject} onChange={e=>setSubject(e.target.value)} required/><label>Message</label><textarea rows="5" value={body} onChange={e=>setBody(e.target.value)} required/><button className="primary full"><Send size={16}/> Envoyer</button></form></div><div className="panel inbox"><div className="panel-heading"><div><h3>Historique des échanges</h3><p>Messages envoyés et reçus</p></div></div>{error&&<div className="error-msg">{error}</div>}{items.length?items.map(m=><div className="message-row" key={m.id}><div className="message-avatar"><UserRound/></div><div><b>{m.subject}</b><p>{m.body}</p><small>{new Date(m.sentAt).toLocaleString('fr-FR')}</small></div></div>):<div className="empty-state">Aucun message à afficher.</div>}</div></div></>;
}
function BI(){
 return <><PageHeader eyebrow="BUSINESS INTELLIGENCE" title="Pilotage & aide à la décision" subtitle="Transformez les données scolaires en indicateurs utiles pour agir."/><div className="bi-highlight"><div className="bi-icon"><ChartNoAxesCombined size={25}/></div><div><b>Vue décisionnelle de l’établissement</b><p>Suivez la performance pédagogique, financière et administrative sur une seule interface.</p></div><span className="tag">Année 2026–2027</span></div><div className="kpi-grid bi-kpis">{[['Taux de recouvrement','87 %','+4,2 %'],['Taux de présence','94,6 %','+1,8 %'],['Moyenne générale','14,2 / 20','+0,6 pt'],['Élèves à suivre','12','À surveiller']].map((x,i)=><div className="kpi-card" key={x[0]}><div className="kpi-label">{x[0]}</div><div className="kpi-value">{x[1]}</div><div className={i===3?'warning-text':'positive'}>{x[2]} vs période précédente</div></div>)}</div><div className="bi-grid"><div className="panel"><h3>Performance par domaine</h3><div className="metric-list">{[['Pédagogie',78],['Assiduité',94],['Recouvrement',87],['Suivi administratif',91]].map(([n,v])=><div className="metric" key={n}><div><span>{n}</span><b>{v}%</b></div><div className="progress"><i style={{width:v+'%'}}/></div></div>)}</div></div><div className="panel"><h3>Alertes & recommandations</h3><div className="alert-item"><span className="alert-icon orange"><AlertCircle/></span><div><b>Impayés à relancer</b><p>Certains dossiers présentent un solde restant à régler.</p></div></div><div className="alert-item"><span className="alert-icon blue"><ChartNoAxesCombined/></span><div><b>Suivi pédagogique</b><p>Identifiez les élèves dont les résultats nécessitent un accompagnement.</p></div></div><div className="alert-item"><span className="alert-icon green"><CheckCircle2/></span><div><b>Bonne assiduité globale</b><p>Le taux de présence est supérieur à l’objectif indicatif de 90 %.</p></div></div></div></div><p className="footnote">Les valeurs de ce tableau de bord sont des données illustratives. Les indicateurs réels sont alimentés par les données enregistrées dans les modules métier.</p></>;
}
function Audit(){const [items,setItems]=useState([]);useEffect(()=>{api('/audit').then(setItems).catch(()=>{})},[]);return <><PageHeader title="Journal d’activité" subtitle="Historique des actions réalisées sur la plateforme."/><div className="panel table-panel"><table><thead><tr><th>Action</th><th>Module</th><th>Identifiant</th><th>Date</th></tr></thead><tbody>{items.map(i=><tr key={i.id}><td>{i.action}</td><td>{i.entity}</td><td>{i.entityId||'—'}</td><td>{new Date(i.createdAt).toLocaleString('fr-FR')}</td></tr>)}</tbody></table>{!items.length&&<div className="empty-state">Aucune activité enregistrée.</div>}</div></>}
function InfoPage({title,sub,items}){return <><PageHeader title={title} subtitle={sub}/><div className="info-grid">{items.map((x,i)=><div className="panel info-card" key={x}><span className="info-number">0{i+1}</span><CheckCircle2 size={19}/><b>{x}</b><small>Fonctionnalité prévue dans le parcours métier.</small></div>)}</div><div className="notice-strip"><AlertCircle size={18}/><span>Ce module est présent dans l’interface de démonstration. Son workflow détaillé et ses connexions aux données nécessitent une phase d’implémentation complémentaire.</span></div></>}
export default App;
