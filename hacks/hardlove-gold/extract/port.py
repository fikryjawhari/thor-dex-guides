"""Port the Emerald Imperium app script to Hardlove Gold: exact replacements, each must match once."""
import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
def R(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: raise SystemExit('expected %d match(es), found %d: %r' % (n, c, a[:90]))
    s = s.replace(a, b)

# ---- storage keys (hgtrack and hgcalc keep the old guide's keys and shapes, so saved runs carry over)
R("localStorage.getItem('eidex1')", "localStorage.getItem('hgdex4')"); R("localStorage.setItem('eidex1'", "localStorage.setItem('hgdex4'")
R("'eicalc:'+p.id", "'hgcalc:'+p.id", 2); R("'eicalc:lastlv'", "'hgcalc:lastlv'", 2)
R("localStorage.getItem('eitrack')", "localStorage.getItem('hgtrack')"); R("localStorage.setItem('eitrack'", "localStorage.setItem('hgtrack'")
R("localStorage.getItem('eiwalk')", "localStorage.getItem('hgwalk2')"); R("localStorage.setItem('eiwalk'", "localStorage.setItem('hgwalk2'")
R("localStorage.getItem('eicap')", "localStorage.getItem('hgcap2')"); R("localStorage.setItem('eicap'", "localStorage.setItem('hgcap2'", 2)
R("localStorage.getItem('eitr')", "localStorage.getItem('hgtr')"); R("localStorage.setItem('eitr'", "localStorage.setItem('hgtr'")
R("localStorage.getItem('eirecent')", "localStorage.getItem('hgrecent')", 2); R("localStorage.setItem('eirecent'", "localStorage.setItem('hgrecent'")
R("localStorage.getItem('eipos')", "localStorage.getItem('hgpos')", 2); R("localStorage.setItem('eipos'", "localStorage.setItem('hgpos'")
R('Recent picks ("eirecent")', 'Recent picks ("hgrecent")'); R('also saved ("eipos")', 'also saved ("hgpos")')
R('(state in localStorage "eitrack"; see notes at top)', '(state in localStorage "hgtrack"; see notes at top)')
R('// ===== WALKTHROUGH TAB (D.WK; checklist state in localStorage "eiwalk" {c:{stepKey:1}, o:{splitIdx:1}, x:{stopKey:0}})', '// ===== WALKTHROUGH TAB (D.WK; state in localStorage "hgwalk2" {o:{open splits}, x:{stopKey:0 closed, docN:1 open}})')
R("// What a walkthrough search matches: the stop's steps, items, areas (and their Pokemon) and trainers.", "// What a walkthrough search matches: the stop's name and notes, items, areas (and their Pokemon) and trainers.")
R("P.forEach(p=>{if(p.g===1||p.fc){const b=P.find(x=>x.dex===p.dex&&x.g!==1&&!x.fc);", "P.forEach(p=>{if(p.g===1&&p.dex){const b=P.find(x=>x.dex===p.dex&&x.g!==1);")
R("// FAM = evolution family via union-find over evolution links (dupes clause); Megas and form changes join their base.", "// FAM = evolution family via union-find over evolution links (dupes clause); Megas join their base.")

# ---- Pokemon: tutor moves, abilities without hidden/EI tags, trainer-only species
R("function tag(p){let r='';if(p.g===1)r+='<span class=\"tag\">Mega<\/span>';if(p.fc)r+='<span class=\"tag\">Form change<\/span>';else if(p.g===3)r+=TRUSE&&TRUSE[p.id]?'<span class=\"tag\">Trainer only<\/span>':'<span class=\"tag\">Not found<\/span>';if(p.g===0&&!p.w.length&&!p.fc)r+='<span class=\"tag\">evo/breed<\/span>';return r;}",
  "function tag(p){let r='';if(p.g===1)r+='<span class=\"tag\">Mega<\/span>';if(p.g===3||p.nu)r+='<span class=\"tag\">Trainer only<\/span>';if(p.g===0&&!p.w.length)r+='<span class=\"tag\">evo/breed<\/span>';return r;}")
R("P.forEach(p=>{p.lv.forEach(([l,m])=>L(m,p,l?'Lv '+l:'Evo'));p.tm.forEach(m=>L(m,p,'TM'));p.eg.forEach(m=>L(m,p,'Egg'));});",
  "P.forEach(p=>{p.lv.forEach(([l,m])=>L(m,p,l?'Lv '+l:'Evo'));p.tm.forEach(m=>L(m,p,'TM'));p.tu.forEach(m=>L(m,p,'Tutor'));p.eg.forEach(m=>L(m,p,'Egg'));});")
R("p.ms=new Set([...p.lv.map(x=>x[1]),...p.tm,...p.eg]);", "p.ms=new Set([...p.lv.map(x=>x[1]),...p.tm,...p.tu,...p.eg]);")
R("if(p.tm.includes(i))r.push('TM');if(p.eg.includes(i))r.push('Egg');return r.join(', ');}",
  "if(p.tm.includes(i))r.push('TM');if(p.tu.includes(i))r.push('Tutor');if(p.eg.includes(i))r.push('Egg');return r.join(', ');}")
R("[['all','All Pokémon'],['obt','Wild + evolutions'],['nomega','Hide Megas'],['nw','Not found only'],['chg','Changed from vanilla']]",
  "[['all','All Pokémon'],['obt','Obtainable only'],['nomega','Hide Megas'],['nw','Trainer only']]")
R("const avOk=p=>st.av==='all'||(st.av==='obt'&&p.g===0)||(st.av==='nomega'&&p.g!==1)||(st.av==='nw'&&p.g===3)||(st.av==='chg'&&!!p.vc);",
  "const avOk=p=>st.av==='all'||(st.av==='obt'&&p.g===0)||(st.av==='nomega'&&p.g!==1)||(st.av==='nw'&&(p.g===3||!!p.nu));")
R("if(st.sort==='bst')st.sort='dex';", "if(st.sort==='bst')st.sort='dex';if(st.av==='chg')st.av='all';")
R(""" if(p.g===1)h=`<div class="mut">Mega form. ${p.stone?esc(p.stone)+': '+esc(p.sloc||''):p.n.startsWith('Primal')||/Rayquaza/.test(p.n)?'Orb or move based (see Useful NPCs in Items).':'No stone location in the items sheet.'}<\/div>`;
 else if(p.fc){const b=P.find(x=>x.dex===p.dex&&!x.fc&&x.g!==1);h=`<div class="mut">Form change of ${b?plink(b.id):'its base form'} (held item, move or in battle), so it is available whenever ${b?esc(b.name):'the base form'} is.<\/div>`;}
 else if(p.g===3)h=`<div class="mut">Not found in any location source (wild tables, Locations PDF, encounter tracker), so probably not obtainable in 1.3.<\/div>`;""",
  """ if(p.g===1)h=p.nu?`<div class="mut">Mega form. ${p.stone?esc(p.stone)+' is':'Its stone is'} not obtainable in Hardlove Gold; listed because trainers use it.<\/div>`:`<div class="mut">Mega form. ${p.stone?esc(p.stone)+': '+esc(p.sloc||''):'No stone location in the items sheet.'}<\/div>`;
 else if(p.g===3)h=`<div class="mut">Not obtainable in Hardlove Gold. Listed because trainers use it.<\/div>`;""")
R("""function confBox(cf){return cf&&cf.length?`<div class="card conf"><h3>Sources disagree<\/h3><ul>${cf.map(x=>`<li>${esc(x)}<\/li>`).join('')}<\/ul><div class="mut small" style="margin-top:4px">The page shows the EI Dex values (the game's data files). Check in game if it matters.<\/div><\/div>`:'';}
function vanCard(p){const v=p.vc;if(!v)return '';const r=[];
 if(v.s){const ch=SN.map((n,i)=>v.s[i]!==p.s[i]?`${n} ${v.s[i]} → ${p.s[i]}`:null).filter(Boolean);if(ch.length)r.push('<b>Stats:<\/b> '+esc(ch.join(', ')));}
 if(v.t)r.push('<b>Type:<\/b> '+v.t.map(ty).join('')+' → '+p.t.map(ty).join(''));
 if(v.a)r.push('<b>Abilities:<\/b> '+esc(v.a.join(', '))+' → '+esc([...p.a,p.ha].filter(x=>x>=0).map(i=>AB[i][0]).join(', ')));
 return r.length?`<div class="card"><h3>Changes from vanilla<\/h3>${r.map(x=>`<div style="margin:4px 0">${x}<\/div>`).join('')}<div class="mut small">From the EI changes doc (vanilla) compared with the game data.<\/div><\/div>`:'';}
""", "")
R("""'<div class="mut small" style="margin-top:4px">From the hack\\'s type chart. Abilities (Levitate and so on) not included.<\/div>';}""",
  """'<div class="mut small" style="margin-top:4px">Gen 9 type chart (the hack follows Gen 9 mechanics). Abilities (Levitate and so on) not included.<\/div>';}""")
R("""const mcells=i=>{const v=MV[i]||{};return `<td>${mlink(i)}${v.x?' <span class="tag">EI<\/span>':v.dc||(v.h&&v.h.length)?' <span class="tag">changed<\/span>':''}${v.cf?'<span class="warn">!<\/span>':''}<\/td>""",
  """const mcells=i=>{const v=MV[i]||{};return `<td>${mlink(i)}${v.h&&v.h.length?' <span class="tag">changed<\/span>':''}<\/td>""")
R("""const abLine=i=>`${alink(i)}${AB[i][2]?' <span class="tag">EI<\/span>':AB[i][3]?' <span class="tag">changed<\/span>':''}<div class="mut small">${esc(AB[i][3]||AB[i][1])}<\/div>`;""",
  """const abLine=i=>`${alink(i)}<div class="mut small">${esc(AB[i][1])}<\/div>`;""")
R("const mv={lv:['Level-up',p.lv.length,()=>tbl(p.lv,true)],tm:['TM/HM',p.tm.length,()=>tbl(byName(p.tm))],eg:['Egg',p.eg.length,()=>tbl(byName(p.eg))]};",
  "const mv={lv:['Level-up',p.lv.length,()=>tbl(p.lv,true)],tm:['TM/HM',p.tm.length,()=>tbl(byName(p.tm))],tu:['Tutor',p.tu.length,()=>tbl(byName(p.tu))],eg:['Egg',p.eg.length,()=>tbl(byName(p.eg))]};")
R("""<div class="mut small">#${p.dex}<\/div>""", """${p.dex?`<div class="mut small">#${p.dex}<\/div>`:''}""")
R(" ${confBox(p.cf)}${vanCard(p)}\n", "")
# EVs are removed from the game (Mechanics), so the calculator has IVs only
R(""" <tr><th>EV<\/th>${SN.map((n,i)=>`<td>${numBox(`data-ev="${i}"`,s.ev[i],{min:0,max:252,step:4,label:'EV '+n})}<\/td>`).join('')}<\/tr>
""", "")
R("""ev:[...app.querySelectorAll('[data-ev]')].map(e=>Math.max(0,Math.min(252,parseInt(e.value)||0)))};""", """ev:[0,0,0,0,0,0]};""")
R("""<div class="mut small" style="margin-top:8px">Speed by level (rare candy planning)<\/div>""",
  """<div class="mut small" style="margin-top:6px">No EVs: Hardlove Gold removes them.<\/div><div class="mut small" style="margin-top:8px">Speed by level (rare candy planning)<\/div>""")

# ---- move and ability pages
R("""const tmr=(D.IT||[]).filter(s=>s.k==='tm').flatMap(s=>s.r).find(x=>x[2]===i);""",
  """const tms=(D.IT||[]).filter(s=>s.k==='tm').flatMap(s=>s.r.filter(x=>x[2]===i).map(x=>[s.n==='Move Tutors'?'Tutor':x[0].split(' ')[0],x[1]]));""")
R("const order={Evo:0,Lv:0,TM:1,Egg:2};", "const order={Evo:0,Lv:0,TM:1,Tutor:2,Egg:3};")
R("""<h2 style="margin:0 0 6px">${esc(M[i])}${v.x?' <span class="tag">EI original<\/span>':''}<\/h2>""", """<h2 style="margin:0 0 6px">${esc(M[i])}<\/h2>""")
R("""${tmr?`<div style="margin-top:6px"><b>${esc(tmr[0].split(' ')[0])}:<\/b> ${esc(tmr[1])}<\/div>`:''}""",
  """${tms.map(t=>`<div style="margin-top:6px"><b>${esc(t[0])}:<\/b> ${esc(t[1])}<\/div>`).join('')}""")
R(""" ${v.e?`<div style="margin-top:8px"><b style="color:var(--acc)">EI changes doc<\/b><div>${esc(v.e).replace(/\\n/g,'<br>')}<\/div><\/div>`:''}
 ${v.h&&v.h.length?`<div style="margin-top:8px"><b style="color:var(--acc)">Differences from standard Gen 9<\/b><ul>${v.h.map(x=>`<li>${esc(x)}<\/li>`).join('')}<\/ul>${v.dc?'':'<div class="mut small">Not listed in the EI changes doc, so this may be an engine default rather than an intentional change.<\/div>'}<\/div>`:''}${v.cf?confBox(v.cf):''}
 <div class="mut small" style="margin-top:8px">Stats from the hack's data (EI Dex). Priority from Showdown Gen 9${v.x?', so it may be wrong for this EI original':''}.<\/div><\/div>""",
  """ ${v.h&&v.h.length?`<div style="margin-top:8px"><b style="color:var(--acc)">Hardlove changes<\/b><ul>${v.h.map(x=>`<li>${esc(x)}<\/li>`).join('')}<\/ul><\/div>`:''}
 <div class="mut small" style="margin-top:8px">Type, category, power, accuracy, PP and priority from the game's own data (0.8.3 source); the description is standard Gen 9 (Showdown).<\/div><\/div>""")
R("""<h2 style="margin:0 0 6px">${esc(a[0])}${a[2]?' <span class="tag">EI original<\/span>':''}<\/h2><p style="margin:0">${esc(a[1])}<\/p>${a[3]?`<div style="margin-top:8px"><b style="color:var(--acc)">EI changes doc<\/b><div>${esc(a[3])}<\/div><\/div>`:''}<\/div>""",
  """<h2 style="margin:0 0 6px">${esc(a[0])}<\/h2><p style="margin:0">${esc(a[1]||'No description.')}<\/p><div class="mut small" style="margin-top:6px">Description from Showdown (Gen 9).<\/div><\/div>""")

# ---- tracker: starter choice, trades (from the old Hardlove guide), roamers
R("const TK={e:{}};", "const TK={s:'',e:{},t:{}};")
R("""const caughtFams=(skip)=>{const s=new Set();for(const [a,e] of Object.entries(TK.e)){""",
  """const caughtFams=(skip)=>{const s=new Set();for(const v of Object.values(TK.t||{})){if(v)s.add(FAM[v]||v);}for(const [a,e] of Object.entries(TK.e)){""")
R("""const areaSpecies=a=>{const seen=new Set(),out=[];(AR[a]?.l||[]).forEach(li=>(locs[li]||[]).forEach(([p])=>{if(!seen.has(p.id)){seen.add(p.id);out.push(p);}}));return out;};""",
  """const areaSpecies=a=>{const seen=new Set(),out=[];(AR[a]?.l||[]).forEach(li=>(locs[li]||[]).forEach(([p,w])=>{if(w[1]==='Trade')return;if(!seen.has(p.id)){seen.add(p.id);out.push(p);}}));return out;};
// Starter choice (Turtwig, Litten, Froakie) decides some gifts, trades and the rival's team: "Starter: X" in notes, [Starter X] on trainers.
const STARTERS=[...new Set(P.flatMap(p=>p.w.filter(w=>w[1]==='Starter choice').map(()=>p.name)))];
const starterOk=txt=>{const m=String(txt||'').match(/Starter:\\s*([A-Za-z ,]+?)\\.?\\s*$/);return !(m&&TK.s)||m[1].split(',').map(x=>x.trim()).includes(TK.s);};
function tradeHTML(a){const g={};(AR[a]?.l||[]).forEach(li=>(locs[li]||[]).forEach(([p,w])=>{if(w[1]!=='Trade'||!starterOk(w[4]))return;(g[w[4]]=g[w[4]]||[]).push(p);}));
 return Object.entries(g).map(([n,ps])=>{const k=a+'|'+n;const cur=(TK.t||{})[k]||'';return `<div class="trk"><span class="mut small">Trade (${esc(n.replace(/^For /,'for '))})<\/span><select class="tk-trade" data-k="${esc(k)}"><option value="">Not traded<\/option>${ps.map(p=>`<option value="${p.id}" ${cur===p.id?'selected':''}>${esc(p.name)}<\/option>`).join('')}<\/select><\/div>`;}).join('');}""")
R("""function trackerHTML(a){if(AR[a]?.ns)return '<div class="mut small" style="margin:6px 0">Not in the official encounter tracker, so it has no encounter slot here.<\/div>';""",
  """function trackerHTML(a){if(AR[a]?.ns)return '<div class="mut small" style="margin:6px 0">Roamers appear on many routes, so they have no encounter slot here.<\/div>';return trackerHTML0(a)+tradeHTML(a);}
function trackerHTML0(a){""")
R("""b.onclick=()=>{if(confirm('Clear every tracked encounter?')){TK.e={};tkSave();rerender();}};});""",
  """b.onclick=()=>{if(confirm('Clear every tracked encounter, trade and the starter choice?')){TK.e={};TK.t={};TK.s='';tkSave();rerender();}};});""")
R("""try{const o=JSON.parse(t);TK.e=o.e||{};tkSave();rerender();}catch(e){alert('That code could not be read.');}});}""",
  """try{const o=JSON.parse(t);TK.s=o.s||'';TK.e=o.e||{};TK.t=o.t||{};tkSave();rerender();}catch(e){alert('That code could not be read.');}});
 app.querySelectorAll('.tk-trade').forEach(s=>{if(s.dataset.b)return;s.dataset.b=1;s.onchange=()=>{TK.t=TK.t||{};if(s.value)TK.t[s.dataset.k]=s.value;else delete TK.t[s.dataset.k];tkSave();rerender();};});
 app.querySelectorAll('.tk-starter').forEach(s=>{if(s.dataset.b)return;s.dataset.b=1;s.onchange=()=>{TK.s=s.value;tkSave();rerender();};});}""")
R("""function tkBar(){const n=Object.values(TK.e).filter(e=>e&&e.p).length,f=Object.values(TK.e).filter(e=>e&&e.f).length;
 return `<div class="card tkbar"><div class="bar" style="margin:0"><span class="mut small">${n} caught · ${f} failed · dupes clause on whole evolution lines<\/span><\/div>""",
  """function tkBar(){const n=Object.values(TK.e).filter(e=>e&&e.p).length+Object.values(TK.t||{}).filter(Boolean).length,f=Object.values(TK.e).filter(e=>e&&e.f).length;
 return `<div class="card tkbar"><div class="bar" style="margin:0"><span class="mut small">Starter<\/span><select class="tk-starter"><option value="">Not chosen (show all)<\/option>${STARTERS.map(s=>`<option ${TK.s===s?'selected':''}>${esc(s)}<\/option>`).join('')}<\/select><\/div>
 <div class="mut small" style="margin-top:6px">${n} caught · ${f} failed · dupes clause on whole evolution lines<\/div>""")
R("""<div class="mut small" style="margin:6px 0">${list.length} areas in the official tracker's order. Rates are recalculated for the dupes clause from your tracked encounters. Search matches places or Pokémon.<\/div>""",
  """<div class="mut small" style="margin:6px 0">${list.length} areas in game order (the locations sheet). Rates are recalculated for the dupes clause from your tracked encounters. Search matches places or Pokémon.<\/div>""")

# ---- items
R("""From the official items sheet (TMs, HMs, Mega Stones, battle rewards, shops, useful NPCs).""",
  """From the Item Location sheet: held items, berries, heart scales, rare candies, TMs, HMs, tutors, evolution items, Mega Stones and other key items.""")

# ---- walkthrough: no official walkthrough or checklist; the order comes from the trainer sheet's splits; game docs card
R("""function cheatCard(){const W=D.WK;return `<details class="split" ${WO.o.ch?'open':''} data-wo="ch"><summary>Cheat codes<\/summary><div class="card"><div class="mut small" style="margin-bottom:6px">${esc(W.cnote)}<\/div><table class="itbl">${W.cheats.map(c=>`<tr><td><b>${esc(c[0])}<\/b>${c[1]?`<div class="mut small">or ${esc(c[1])}<\/div>`:''}<\/td><td>${esc(c[2])}${c[3]?' <span class="tag">toggle<\/span>':''}<\/td><\/tr>`).join('')}<\/table><\/div><\/details>`;}""",
  """// Game docs (Mechanics, the trainer AI doc, post-KO switch-in scores): built when opened.
// Blocks aligned with runs of spaces (the starter choice table, the level cap list) keep their columns in monospace.
function docsHTML(){const W=D.WK;const para=t=>esc(t).split(/\\n\\s*\\n/).map(x=>/\\S(?: {2,}|\\t)\\S/.test(x)?`<pre class="dpre">${x}<\/pre>`:`<p style="margin:6px 0">${x.replace(/\\n/g,'<br>')}<\/p>`).join('');
 return W.docs.map(([n,t],j)=>`<details class="stopd" data-k="doc${j}" ${WO.x['doc'+j]===1?'open':''}><summary class="stoph">${esc(n)}<\/summary><div class="stop small doc">${para(t)}<\/div><\/details>`).join('')+
  `<details class="stopd" data-k="docko" ${WO.x.docko===1?'open':''}><summary class="stoph">Post-KO switch-in AI<\/summary><div class="stop"><table class="itbl">${W.ko.rows.map(r=>`<tr><td>${esc(r[0])}<\/td><td>${esc(r[1])}<\/td><\/tr>`).join('')}<\/table>${W.ko.note.map(x=>`<div class="mut small" style="margin-top:6px">${esc(x)}<\/div>`).join('')}<\/div><\/details>`;}
function docsCard(){return `<details class="split" ${WO.o.doc?'open':''} data-wo="doc"><summary>Game docs<\/summary><div class="body" data-docs="1"><\/div><\/details>`;}""")
R("""function walkStop(s,si,ti,cf,shown){const k=si+'.'+ti;const closed=WO.x[k]===0;const q=st.q;
 const steps=s.s.map((x,j)=>{const sk=k+'.'+j;const done=!!WO.c[sk];return `<label class="wstep ${done?'done':''}"><input type="checkbox" data-sk="${sk}" ${done?'checked':''}><span>${esc(x[0])}${x[1]?`<div class="mut small">${esc(x[1])}<\/div>`:''}<\/span><\/label>`;}).join('');""",
  """function walkStop(s,si,ti,cf,shown){const k=si+'.'+ti;const closed=WO.x[k]===0;const q=st.q;
 const steps=s.note?`<div class="trnote" style="margin:6px 0">${esc(s.note)}<\/div>`:'';""")
R("""' boss'+((s.tr||[]).length>1?'es':'')+'<\/span>':''}""", """' trainer'+((s.tr||[]).length>1?'s':'')+'<\/span>':''}""")
R("""h+=`<div class="sech" style="margin-top:8px">${esc(A.n)}<\/div>`+trackerHTML(ai)+enc.map(""",
  """h+=`<div class="sech" style="margin-top:8px">${esc(A.n)}<\/div>`+trackerHTML(ai)+(A.note?`<div class="trnote">${esc(A.note)}<\/div>`:'')+enc.map(""")
R("""if(s.it.length)h+=`<table class="itbl wt">${s.it.map(i=>`<tr><td>${i[3]!=null&&(i[0]==='TMs'||i[0]==='HMs')?`<a href="#/m/${i[3]}">${esc(i[1])}<\/a>`:i[0]==='Mega Stones'&&i[3]?`<a href="#/p/${i[3]}">${esc(i[1])}<\/a>`:esc(i[1])}<div class="mut small">${esc(i[0])}<\/div><\/td><td>${esc(i[2])}<\/td><\/tr>`).join('')}<\/table>`;""",
  """const its=s.it.filter(i=>starterOk(i[2]));if(its.length)h+=`<table class="itbl wt">${its.map(i=>`<tr><td>${i[3]!=null&&(i[0]==='TMs'||i[0]==='HMs'||i[0]==='Move Tutors')?`<a href="#/m/${i[3]}">${esc(i[1])}<\/a>`:i[0]==='Mega Stones'&&i[3]?`<a href="#/p/${i[3]}">${esc(i[1])}<\/a>`:esc(i[1])}<div class="mut small">${esc(i[0])}<\/div><\/td><td>${esc(i[2])}${/miss permanently/i.test(i[2])?'<span class="warn">MISSABLE<\/span>':''}<\/td><\/tr>`).join('')}<\/table>`;""")
R("""const stopText=s=>s.tx??=(s.n+' '+s.s.map(x=>x.join(' ')).join(' ')+' '+""", """const stopText=s=>s.tx??=(s.n+' '+(s.note||'')+' '+""")
R(""" app.innerHTML=cheatCard()+tkBar()+`<div class="mut small" style="margin:6px 0">From the official walkthrough. Stops marked "on the way" are areas from the encounter tracker placed where you pass them. Boss teams sit inside their stop (tap a trainer to open the team); the Trainers tab has them all by split.<\/div>`+
  W.splits.map((sp,si)=>{const all=sp.st.flatMap((s,ti)=>s.s.map((x,j)=>si+'.'+ti+'.'+j));const done=all.filter(k=>WO.c[k]).length;
   return `<details class="split" data-wo="${si}" ${WO.o[si]?'open':''}><summary>${esc(sp.n)} <span class="tag ${done===all.length&&all.length?'got':''}">${done}/${all.length}<\/span><\/summary>${sp.note?`<div class="trnote" style="margin:8px 2px">${esc(sp.note)}<\/div>`:''}<div class="body" data-si="${si}"><\/div><\/details>`;}).join('')+""",
  """ app.innerHTML=docsCard()+tkBar()+`<div class="mut small" style="margin:6px 0">Hardlove Gold has no written walkthrough. The order follows the trainer sheet's level-cap splits: each stop is a place with its trainers, items and encounters. Stops marked "on the way" are encounter areas placed where you pass them. Tap a trainer to open the team; the Trainers tab has them all by split.<\/div>`+
  W.splits.map((sp,si)=>`<details class="split" data-wo="${si}" ${WO.o[si]?'open':''}><summary>${esc(sp.n)} <span class="mut small">${sp.st.length} stop${sp.st.length===1?'':'s'}<\/span><\/summary>${sp.note?`<div class="trnote" style="margin:8px 2px">${esc(sp.note)}<\/div>`:''}<div class="body" data-si="${si}"><\/div><\/details>`).join('')+""")
R("""  `<div style="margin:14px 0"><button class="btn danger wk-reset">Reset checklist<\/button><\/div>`;
 app.querySelectorAll('details.split[data-wo]').forEach(d=>{const fill=()=>{const b=d.querySelector('.body');if(b&&d.open&&!b.innerHTML){const si=+b.dataset.si;b.innerHTML=W.splits[si].st.map((s,ti)=>walkStop(s,si,ti,cf,shown)).join('');bindWalk();}};""",
  """  '';
 app.querySelectorAll('details.split[data-wo]').forEach(d=>{const fill=()=>{const b=d.querySelector('.body');if(b&&d.open&&!b.innerHTML){if(b.dataset.docs){b.innerHTML=docsHTML();bindWalk();return;}const si=+b.dataset.si;b.innerHTML=W.splits[si].st.map((s,ti)=>walkStop(s,si,ti,cf,shown)).join('');bindWalk();}};""")
R(""" const r=app.querySelector('.wk-reset');if(r)r.onclick=()=>{if(confirm('Clear every walkthrough checkbox?')){WO.c={};woSave();rerender();}};
""", "")
R("""d.addEventListener('toggle',()=>{const k=d.dataset.k;if(d.open)delete WO.x[k];else WO.x[k]=0;woSave();});});}""",
  """d.addEventListener('toggle',()=>{const k=d.dataset.k;if(/^doc/.test(k)){if(d.open)WO.x[k]=1;else delete WO.x[k];}else if(d.open)delete WO.x[k];else WO.x[k]=0;woSave();});});}""")

# ---- trainers: real IVs from the calc where matched, no EVs, starter-filtered rivals, level cap per split
R("""// ===== TRAINERS TAB (D.TR, see notes). Speeds use each Pokemon's real IVs and nature; EVs on or off via the Minimal
// Grinding Mode switch ("eimgm"). Relative levels ("Highest Lv -1" in the sheet, r:-1) use the trainer's level cap,
// which can be overridden per trainer ("eicap"). Rival teams follow the starter recorded in the Littleroot tracker slot.""",
  """// ===== TRAINERS TAB (D.TR, see notes). Speeds use each Pokemon's IVs (from the Hardlove calc where it matches, else 31)
// and nature; Hardlove Gold has no EVs. Relative levels ("X-2" in the sheet, r:-2) are relative to the level cap, which
// can be set per trainer ("hgcap2"). Rival teams follow the starter chosen in the tracker bar.""")
R("""let MGM=false;try{MGM=localStorage.getItem('eimgm')==='1'}catch(e){}
""", "")
R("""const starterType=()=>{const e=TK.e&&TK.e[0];const p=e&&e.p&&byId[e.p];return p?(p.t.find(x=>['Grass','Fire','Water'].includes(x))||''):'';};
const rivalHidden=t=>{const s=starterType();return !!(t.st&&s&&t.st!==s);};""",
  """const rivalHidden=t=>!!(t.st&&TK.s&&t.st!==TK.s);""")
R("""function monCard(x,cap){const p=byId[x.id];const lv=x.l!=null?x.l:cap?cap+x.r:NaN;
 const sp=e=>p&&lv?stat(p.s[5],5,x.iv[5],e,lv,x.na):null;const s0=sp(0),s1=sp(x.ev[5]);
 const main=MGM?s0:s1,alt=MGM?s1:s0;
 const spd=main==null?'':`<div class="spd">Spe <b>${main}<\/b>${alt!==main?` <span class="mut small">${MGM?'with EVs':'no EVs'} ${alt}<\/span>`:''}${/choice scarf/i.test(x.i)?` <span class="mut small">Scarf ${Math.floor(main*1.5)}<\/span>`:''}<\/div>`;
 const lvs=x.l!=null?`Lv ${x.l}`:`Lv ${lv||'?'} <span class="mut small">cap${x.r?(x.r>0?'+':'−')+Math.abs(x.r):''}<\/span>`;
 const tags=(x.ld?`<span class="tag">Lead ${x.ld}<\/span>`:'')+(x.pre||[]).map(z=>`<span class="tag warnb">${esc(PRE[z]||z)}<\/span>`).join('')+(x.src==='s'?'<span class="tag">sheet only<\/span>':'');
 const ab=x.a>=0?(x.a0!=null?alink(x.a0)+' → ':'')+alink(x.a):'';
 const iv=x.iv.every(v=>v===31)?'':`<div class="mut small">IVs ${x.iv.join('/')}<\/div>`;const ev=evTxt(x.ev);""",
  """function monCard(x,cap){const p=byId[x.id];const lv=x.l!=null?x.l:x.r!=null&&cap?cap+x.r:NaN;
 const main=p&&lv?stat(p.s[5],5,x.iv[5],0,lv,x.na):null;
 const spd=main==null?'':`<div class="spd">Spe <b>${main}<\/b>${x.ia?'<span class="mut" title="IVs assumed 31">*<\/span>':''}${x.t0?` <span class="mut small">0 IV ${stat(p.s[5],5,0,0,lv,x.na)}<\/span>`:''}${/choice scarf/i.test(x.i)?` <span class="mut small">Scarf ${Math.floor(main*1.5)}<\/span>`:''}<\/div>`;
 const lvs=x.l!=null||x.r==null?`Lv ${x.l??'?'}`:`Lv ${lv||'?'} <span class="mut small">cap${x.r?(x.r>0?'+':'−')+Math.abs(x.r):''}<\/span>`;
 const tags=x.src==='s'?'<span class="tag">sheet only<\/span>':'';
 const ab=x.ao?esc(x.ao):(x.a0!=null&&x.a0>=0?alink(x.a0)+' → ':'')+(x.a>=0?alink(x.a):'');
 const iv=x.iv.every(v=>v===31)?'':`<div class="mut small">IVs ${x.iv.join('/')}<\/div>`;const ev='';""")
R("""<div><div>${p?`<a href="#/p/${x.id}">${esc(p.name)}<\/a>`:'?'} <b>${lvs}<\/b><\/div><\/div>""",
  """<div><div>${p?`<a href="#/p/${x.id}">${esc(p.name)}<\/a>`:esc(x.s||'?')} <b>${lvs}<\/b><\/div><\/div>""")
R("""${rel?`<div class="trk"><span class="mut small">Your highest level<\/span>${INV?numBox(`data-k="${t.k}"`,cap||'',{min:1,max:100,steppers:true,label:'Your highest level'}).replace('class="nv"','class="nv capin"'):`<input class="capin" type="number" inputmode="numeric" min="1" max="100" style="width:72px" data-k="${t.k}" value="${cap||''}">`}<span class="mut small">${own?`<a href="#" class="capreset" data-k="${t.k}">reset to cap ${t.cap}<\/a>`:`level cap ${t.cap}`}<\/span><\/div>`:''}""",
  """${rel?`<div class="trk"><span class="mut small">Level cap<\/span>${INV?numBox(`data-k="${t.k}"`,cap||'',{min:1,max:100,steppers:true,label:'Level cap'}).replace('class="nv"','class="nv capin"'):`<input class="capin" type="number" inputmode="numeric" min="1" max="100" style="width:72px" data-k="${t.k}" value="${cap||''}">`}<span class="mut small">${own&&t.cap?`<a href="#" class="capreset" data-k="${t.k}">reset to cap ${t.cap}<\/a>`:t.cap?`split cap ${t.cap}`:'levels follow the cap of the split you are in'}<\/span><\/div>`:''}""")
R("""const capOf=t=>+TCAP[t.k]||t.cap||0;""", """const capOf=t=>+TCAP[t.k]||t.cap||+TCAP._last||0;""")
R("""i.onchange=()=>{const v=+i.value;if(v>0&&v<=100)TCAP[i.dataset.k]=v;else delete TCAP[i.dataset.k];""",
  """i.onchange=()=>{const v=+i.value;if(v>0&&v<=100)TCAP[i.dataset.k]=TCAP._last=v;else delete TCAP[i.dataset.k];""")
R("""function trHead(){const s=starterType();return `<div class="card"><label class="row" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="mgm" ${MGM?'checked':''}> <span>Minimal Grinding Mode <span class="mut small">(speeds without trainer EVs)<\/span><\/span><\/label>
 <div class="mut small" style="margin-top:6px">Sets come from the game's trainer data (hzla calc); where the boss sheet disagrees, the card says so. Speeds use real IVs and natures${MGM?', no EVs':' and EVs'}. "cap−1" levels scale to your highest level, assumed to be the level cap. ${s?`Rival teams shown for your ${esc(s)} starter (from the Littleroot tracker slot).`:'Record your starter in the Littleroot tracker slot to hide the other rival teams.'}<\/div>
 <details style="margin-top:6px"><summary class="mut small">Level caps<\/summary><table class="itbl">${TRD.caps.map(c=>`<tr><td>${esc(c[0])}<\/td><td>${c[1]}<\/td><\/tr>`).join('')}<\/table><\/details><\/div>`;}
function bindHead(){const m=app.querySelector('#mgm');if(m)m.onchange=()=>{MGM=m.checked;try{localStorage.setItem('eimgm',MGM?'1':'0')}catch(e){}rerender();};}""",
  """function trHead(){const s=TK.s;return `<div class="card"><div class="mut small">Sets are the game's own trainer data (0.8.3 source): species, levels, items, abilities, natures, moves and IVs. Where the Trainer Battles sheet says something else, the card shows "Sheet says". Order, places and notes come from the sheet. Speeds use the real IVs and nature and no EVs (Hardlove Gold removes them). Trick Room teams also show the speed at 0 IVs. "cap−2" levels follow the level cap. ${s?`Rival teams shown for your ${esc(s)} starter (set in the Locations or Walkthrough tracker bar).`:'Choose your starter in the Locations or Walkthrough tracker bar to hide the other rival teams.'}<\/div>
 <details style="margin-top:6px"><summary class="mut small">Level caps<\/summary><table class="itbl">${TRD.caps.map(c=>`<tr><td>${esc(c[0])}<\/td><td>${c[1]}<\/td><\/tr>`).join('')}<\/table><\/details><\/div>`;}
function bindHead(){}""")
R("""b.innerHTML=g.sec.map(s=>(s.h?`<div class="sech">${esc(s.h)}<\/div>${s.rw?""", """b.innerHTML=(g.note&&g.note.length?`<div class="trnote" style="margin:8px 2px">${g.note.map(esc).join('<br>')}<\/div>`:'')+g.sec.map(s=>(s.h?`<div class="sech">${esc(s.h)}<\/div>${(s.note||[]).length?`<div class="trnote">${s.note.map(esc).join('<br>')}<\/div>`:''}${s.rw?""")
R("""const UP={p:'#/',m:'#/',a:'#/',tr:'#/trainers'};""", """const UP={p:'#/',m:'#/',a:'#/',tr:'#/trainers'};""")
R("""Emerald Imperium offline dex · ${P.length} Pokémon and forms (${P.filter(p=>p.g===0).length} obtainable) · ${MV.filter(m=>m.h.length).length} changed moves · ${TRS.length} boss trainers · built ${D.built}""",
  """Hardlove Gold offline dex · ${P.length} Pokémon and forms (${P.filter(p=>p.g===0).length} obtainable) · ${MV.filter(m=>m.h.length).length} changed moves · ${TRS.length} trainers · built ${D.built}""")
R("""<div class="card"><h3>Used by trainers (${u.length})<\/h3>${u.map(t=>`<div><a href="#/tr/${t.k}">${esc(t.n)}<\/a> <span class="mut small">${esc(t.loc)} · ${esc(t.g)}${t.st?' · '+esc(t.st)+' starter':''}<\/span><\/div>`).join('')}<\/div>""",
  """<div class="card"><h3>Used by trainers (${u.length})<\/h3>${u.map(t=>`<div><a href="#/tr/${t.k}">${esc(t.n)}<\/a> <span class="mut small">${esc(t.loc)} · ${esc(t.g)}${t.st?' · if your starter is '+esc(t.st):''}<\/span><\/div>`).join('')}<\/div>""")

R("""function bindWalk(){bindTrackers();bindTrd();app.querySelectorAll('.wstep input').forEach(c=>{if(c.dataset.b)return;c.dataset.b=1;c.onchange=()=>{if(c.checked)WO.c[c.dataset.sk]=1;else delete WO.c[c.dataset.sk];woSave();c.closest('.wstep').classList.toggle('done',c.checked);
  const det=c.closest('details.split');if(det){const si=det.dataset.wo;const all=[...det.querySelectorAll('.wstep input')];const tg=det.querySelector('summary .tag');if(tg){tg.textContent=all.filter(x=>x.checked).length+'/'+all.length;}}};});
""", """function bindWalk(){bindTrackers();bindTrd();
""")
R("""const PRE={Burned:'BRN',Poisoned:'PSN',Frostbitten:'FRB',Burn:'BRN',Poison:'PSN',Frostbite:'FRB'};
const evTxt=ev=>ev.map((v,i)=>v?v+' '+SN[i]:'').filter(Boolean).join(' / ');
""", "")
R("const WO=(()=>{try{return Object.assign({c:{},o:{},x:{}},JSON.parse(localStorage.getItem('hgwalk2')||'{}'))}catch(e){return {c:{},o:{},x:{}}}})();",
  "const WO=(()=>{try{return Object.assign({o:{},x:{}},JSON.parse(localStorage.getItem('hgwalk2')||'{}'))}catch(e){return {o:{},x:{}}}})();")
open(dst, 'w', encoding='utf-8').write(s)
print('ok', len(s))
