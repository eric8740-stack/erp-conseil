/* ============================================================
   ERP Conseil — Espace Pro
   Application 100% locale (localStorage). Aucune donnée n'est
   envoyée sur un serveur. Vanilla JS, sans dépendance.
   ============================================================ */
(() => {
'use strict';

const KEY = 'erpconseil_data_v1';
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Statuts ---------- */
const DEVIS_STATUS   = ['brouillon', 'envoye', 'accepte', 'refuse'];
const FACTURE_STATUS = ['brouillon', 'envoyee', 'payee'];
const STATUS_LABEL = {
    brouillon:'Brouillon', envoye:'Envoyé', accepte:'Accepté', refuse:'Refusé',
    envoyee:'Envoyée', payee:'Payée'
};

/* ---------- Données par défaut (pré-remplies avec vos infos) ---------- */
const DEFAULTS = {
    settings:{
        name:'ERP Conseil',
        owner:'Eric Paysant — Entrepreneur individuel',
        address:'18 route de Versanas, 87920 Condat-sur-Vienne',
        siret:'[À COMPLÉTER]',
        email:'eric.paysant@outlook.fr',
        phone:'06 21 84 90 54',
        iban:'',
        logo:'',          // dataURL du logo (base64)
        paydays:30,       // délai de paiement par défaut (jours)
        tva:'TVA non applicable, art. 293 B du CGI',
        payterms:'Paiement à 30 jours à réception de facture, par virement bancaire.',
        legal:"Eric Paysant — Entrepreneur individuel · Condat-sur-Vienne (87) · Dispensé d'immatriculation au RCS et au RM",
        validity:'1 mois',
        devprefix:'DEV',
        facprefix:'FAC',
        counters:{},  // {DEV-2026: 1, FAC-2026: 1}
        formurl:'',       // URL publique de satisfaction.html
        satendpoint:''    // URL du relais Apps Script (lecture des avis)
    },
    clients:[
        {id:'cl_demo', name:'A3D Design', address:'', siret:'', contact:'', email:'', phone:''}
    ],
    documents:[]
};

/* ---------- Stockage ---------- */
let DB;
function load(){
    try{ DB = JSON.parse(localStorage.getItem(KEY)) || structuredClone(DEFAULTS); }
    catch(e){ DB = structuredClone(DEFAULTS); }
    // fusion défensive des réglages
    DB.settings = Object.assign({}, DEFAULTS.settings, DB.settings || {});
    DB.settings.counters = DB.settings.counters || {};
    DB.clients   = DB.clients   || [];
    DB.documents = DB.documents || [];
}
function save(){ localStorage.setItem(KEY, JSON.stringify(DB)); }
const uid = p => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

/* ---------- Utilitaires ---------- */
const euro = n => (Number(n)||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' €';
const todayISO = () => new Date().toISOString().slice(0,10);
function frDate(iso){ if(!iso) return ''; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; }
function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
const clientById = id => DB.clients.find(c => c.id === id);
function docTotal(doc){ return (doc.lines||[]).reduce((s,l)=> s + (Number(l.qty)||0)*(Number(l.pu)||0), 0); }
function addDaysISO(iso, days){ const d = new Date(iso||todayISO()); d.setDate(d.getDate()+(Number(days)||0)); return d.toISOString().slice(0,10); }
function isOverdue(doc){ return doc.type==='facture' && doc.status!=='payee' && doc.dueDate && doc.dueDate < todayISO(); }
function daysLate(iso){ return Math.floor((new Date(todayISO()) - new Date(iso)) / 86400000); }

function toast(msg, type=''){
    const t = $('#toast'); t.textContent = msg; t.className = 'toast show ' + type;
    clearTimeout(t._t); t._t = setTimeout(()=> t.className = 'toast', 2600);
}

/* ---------- Numérotation auto : PREFIX-AAAA-NNN ---------- */
function nextNumber(type){
    const s = DB.settings;
    const prefix = type === 'facture' ? s.facprefix : s.devprefix;
    const year = new Date().getFullYear();
    const key = `${prefix}-${year}`;
    const n = (s.counters[key] || 0) + 1;
    return { number:`${prefix}-${year}-${String(n).padStart(3,'0')}`, key, n };
}
function commitNumber(key,n){ DB.settings.counters[key] = n; }

/* ============================================================
   ROUTING
   ============================================================ */
function showView(name){
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-'+name));
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    $('#sidebar').classList.remove('open');
    renderView(name);
}
function renderView(name){
    if(name==='dashboard') renderDashboard();
    if(name==='devis')     renderDocList('devis');
    if(name==='factures')  renderDocList('facture');
    if(name==='bilan')     renderBilan();
    if(name==='satisfaction') renderSatisfaction();
    if(name==='clients')   renderClients();
    if(name==='settings')  fillSettings();
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard(){
    const devis    = DB.documents.filter(d=>d.type==='devis');
    const factures = DB.documents.filter(d=>d.type==='facture');
    const accepted = devis.filter(d=>d.status==='accepte');
    const sent     = devis.filter(d=>d.status==='envoye');
    const caFacture= factures.reduce((s,f)=>s+docTotal(f),0);
    const caPaye   = factures.filter(f=>f.status==='payee').reduce((s,f)=>s+docTotal(f),0);
    const enAttente= factures.filter(f=>f.status!=='payee').reduce((s,f)=>s+docTotal(f),0);
    const txAccept = devis.length ? Math.round(accepted.length/devis.length*100) : 0;

    $('#kpiGrid').innerHTML = `
        ${kpi('CA facturé', euro(caFacture), `${factures.length} facture(s)`)}
        ${kpi('Encaissé', euro(caPaye), `Reste ${euro(enAttente)}`)}
        ${kpi('Devis en attente', sent.length, `Valeur ${euro(sent.reduce((s,d)=>s+docTotal(d),0))}`)}
        ${kpi("Taux d'acceptation", txAccept+' %', `${accepted.length}/${devis.length} accepté(s)`)}
    `;
    renderRelances(factures);
    $('#recentDevis').innerHTML    = miniList(devis);
    $('#recentFactures').innerHTML = miniList(factures);
    bindMiniRows();
}
function renderRelances(factures){
    const late = factures.filter(isOverdue).sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||''));
    const box = $('#relancesCard');
    if(!late.length){ box.innerHTML=''; return; }
    const totalLate = late.reduce((s,f)=>s+docTotal(f),0);
    box.innerHTML = `<div class="relance-card">
        <div class="rc-head">⚠ ${late.length} facture(s) en retard de paiement · ${euro(totalLate)}</div>
        ${late.map(f=>{ const c=clientById(f.clientId);
            return `<div class="relance-row" data-open="${f.id}">
                <div class="mini-info"><div class="mini-num">${esc(f.number)}</div><div class="mini-name">${esc(c?c.name:'—')}</div></div>
                <div style="text-align:right">
                    <div class="amount">${euro(docTotal(f))}</div>
                    <div class="relance-late">échéance ${frDate(f.dueDate)} · +${daysLate(f.dueDate)} j</div>
                </div>
            </div>`;}).join('')}
    </div>`;
}
const kpi = (label,val,sub) => `<div class="kpi"><div class="kpi-label">${label}</div><div class="kpi-value">${val}</div><div class="kpi-sub">${esc(sub)}</div></div>`;

function miniList(docs){
    const recent = [...docs].sort((a,b)=> (b.date||'').localeCompare(a.date||'')).slice(0,5);
    if(!recent.length) return `<div class="empty small">Aucun document pour l'instant.</div>`;
    return recent.map(d=>{
        const c = clientById(d.clientId);
        return `<div class="mini-row" data-open="${d.id}">
            <div class="mini-info">
                <div class="mini-num">${esc(d.number)}</div>
                <div class="mini-name">${esc(c?c.name:'—')}</div>
            </div>
            <div style="text-align:right">
                <div class="amount">${euro(docTotal(d))}</div>
                <span class="badge ${d.status}">${STATUS_LABEL[d.status]}</span>
            </div>
        </div>`;
    }).join('');
}
function bindMiniRows(){ $$('.mini-row,.relance-row').forEach(r=> r.onclick=()=> openDoc(r.dataset.open)); }

/* ============================================================
   LISTES DEVIS / FACTURES
   ============================================================ */
function renderDocList(type){
    const isFac = type==='facture';
    const searchEl = $(isFac?'#facturesSearch':'#devisSearch');
    const q = (searchEl.value||'').toLowerCase();
    let docs = DB.documents.filter(d=>d.type===type);
    if(q) docs = docs.filter(d=>{
        const c = clientById(d.clientId);
        return d.number.toLowerCase().includes(q) || (c&&c.name.toLowerCase().includes(q));
    });
    docs.sort((a,b)=> (b.number||'').localeCompare(a.number||''));

    $(isFac?'#facturesCount':'#devisCount').textContent =
        `${docs.length} ${isFac?'facture':'devis'}${docs.length>1?'s':''}`;

    const table = $(isFac?'#facturesTable':'#devisTable');
    if(!docs.length){
        table.innerHTML = `<tbody><tr><td><div class="empty"><div class="big">${isFac?'🧾':'✎'}</div>Aucun ${isFac?'facture':'devis'}.<br><br><button class="btn btn-primary" data-new="${isFac?'facture':'devis'}">+ Créer ${isFac?'une facture':'un devis'}</button></div></td></tr></tbody>`;
        bindNewButtons(); return;
    }
    table.innerHTML = `
        <thead><tr>
            <th>Numéro</th><th>Date</th><th>Client</th><th>Statut</th><th class="amount">Montant</th>
        </tr></thead>
        <tbody>${docs.map(d=>{
            const c = clientById(d.clientId);
            return `<tr data-open="${d.id}">
                <td class="num-cell">${esc(d.number)}</td>
                <td>${frDate(d.date)}</td>
                <td>${esc(c?c.name:'—')}</td>
                <td><span class="badge ${d.status}">${STATUS_LABEL[d.status]}</span>${isOverdue(d)?' <span class="badge retard">En retard</span>':''}</td>
                <td class="amount">${euro(docTotal(d))}</td>
            </tr>`;
        }).join('')}</tbody>`;
    $$('tr[data-open]', table).forEach(tr=> tr.onclick=()=> openDoc(tr.dataset.open));
}

/* ============================================================
   ÉDITEUR DE DOCUMENT (devis / facture)
   ============================================================ */
let editing = null;          // doc en cours d'édition
let pendingNumberKey = null; // pour ne consommer le compteur qu'à l'enregistrement

function newDoc(type){
    const { number, key, n } = nextNumber(type);
    pendingNumberKey = { key, n };
    editing = {
        id:null, type, number, status:'brouillon',
        date: todayISO(),
        validity: DB.settings.validity,
        dueDate: type==='facture' ? addDaysISO(todayISO(), DB.settings.paydays) : '',
        paidDate:'',
        clientId: DB.clients[0]?.id || '',
        lines:[ {designation:'', qty:1, unit:'forfait', pu:0} ],
        notes:''
    };
    openDocModal();
}
function openDoc(id){
    const d = DB.documents.find(x=>x.id===id); if(!d) return;
    pendingNumberKey = null;
    editing = structuredClone(d);
    openDocModal();
}
function openDocModal(){
    const isFac = editing.type==='facture';
    $('#docModalTitle').textContent = (isFac?'Facture ':'Devis ') + editing.number;
    $('#doc-number').value   = editing.number;
    $('#doc-date').value     = editing.date;
    $('#doc-validity').value = editing.validity || '';
    $('#doc-validity-wrap').style.display = isFac ? 'none' : '';
    $('#doc-echeance').value = editing.dueDate || '';
    $('#doc-paid').value     = editing.paidDate || '';
    $('#doc-echeance-wrap').style.display = isFac ? '' : 'none';
    $('#doc-notes').value    = editing.notes || '';
    $('#doc-tvanote').textContent = DB.settings.tva;

    // statut
    const statuses = isFac ? FACTURE_STATUS : DEVIS_STATUS;
    $('#doc-status').innerHTML = statuses.map(s=>`<option value="${s}">${STATUS_LABEL[s]}</option>`).join('');
    $('#doc-status').value = editing.status;
    updatePaidVisibility();

    // clients
    fillClientSelect($('#doc-client'), editing.clientId);

    renderLines();
    $('#deleteDoc').hidden  = !editing.id;
    // convertir : seulement pour un devis existant accepté/envoyé
    $('#convertDoc').hidden = !(editing.type==='devis' && editing.id);
    $('#askReview').hidden  = !editing.id;

    openModal('#docModal');
}
function updatePaidVisibility(){
    const isFac = editing.type==='facture';
    const paid = $('#doc-status').value==='payee';
    $('#doc-paid-wrap').style.display = (isFac && paid) ? '' : 'none';
    if(isFac && paid && !$('#doc-paid').value) $('#doc-paid').value = todayISO();
}
function fillClientSelect(sel, current){
    sel.innerHTML = DB.clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')
        + `<option value="__new">+ Nouveau client…</option>`;
    sel.value = current || (DB.clients[0]?.id||'__new');
}

function renderLines(){
    const wrap = $('#doc-lines');
    wrap.innerHTML = editing.lines.map((l,i)=>`
        <div class="line-row" data-i="${i}">
            <input class="line-desc" data-f="designation" value="${esc(l.designation)}" placeholder="Désignation de la prestation">
            <input data-f="qty"  type="number" min="0" step="0.5" value="${l.qty}">
            <input data-f="unit" value="${esc(l.unit)}" placeholder="unité">
            <input data-f="pu"   type="number" min="0" step="0.01" value="${l.pu}">
            <span class="line-total">${euro((Number(l.qty)||0)*(Number(l.pu)||0))}</span>
            <button class="line-del" title="Supprimer">✕</button>
        </div>`).join('');
    $$('.line-row', wrap).forEach(row=>{
        const i = +row.dataset.i;
        $$('input', row).forEach(inp=> inp.oninput = ()=>{
            editing.lines[i][inp.dataset.f] = inp.value;
            row.querySelector('.line-total').textContent = euro((Number(editing.lines[i].qty)||0)*(Number(editing.lines[i].pu)||0));
            updateTotals();
        });
        row.querySelector('.line-del').onclick = ()=>{
            editing.lines.splice(i,1);
            if(!editing.lines.length) editing.lines.push({designation:'',qty:1,unit:'forfait',pu:0});
            renderLines(); updateTotals();
        };
    });
    updateTotals();
}
function updateTotals(){
    const t = docTotal(editing);
    $('#doc-totalht').textContent  = euro(t);
    $('#doc-totalnet').textContent = euro(t);
}
function collectDoc(){
    editing.number   = $('#doc-number').value.trim();
    editing.date     = $('#doc-date').value;
    editing.validity = $('#doc-validity').value;
    editing.status   = $('#doc-status').value;
    editing.clientId = $('#doc-client').value;
    editing.notes    = $('#doc-notes').value;
    if(editing.type==='facture'){
        editing.dueDate  = $('#doc-echeance').value;
        editing.paidDate = $('#doc-status').value==='payee' ? ($('#doc-paid').value||todayISO()) : '';
    }
}
function saveDoc(){
    collectDoc();
    if(editing.clientId === '__new'){ toast('Choisissez ou créez un client d’abord.', 'err'); return; }
    if(!editing.clientId){ toast('Sélectionnez un client.', 'err'); return; }
    editing.lines = editing.lines.filter(l=> (l.designation||'').trim() !== '');
    if(!editing.lines.length){ toast('Ajoutez au moins une ligne.', 'err'); return; }

    if(editing.id){
        const idx = DB.documents.findIndex(d=>d.id===editing.id);
        DB.documents[idx] = editing;
    }else{
        editing.id = uid('doc');
        DB.documents.push(editing);
        if(pendingNumberKey) commitNumber(pendingNumberKey.key, pendingNumberKey.n);
    }
    save(); closeModal('#docModal');
    toast('Document enregistré', 'ok');
    showView(editing.type==='facture'?'factures':'devis');
}
function deleteDoc(){
    if(!editing.id) return;
    if(!confirm('Supprimer définitivement ce document ?')) return;
    DB.documents = DB.documents.filter(d=>d.id!==editing.id);
    save(); closeModal('#docModal'); toast('Document supprimé');
    showView(editing.type==='facture'?'factures':'devis');
}
function convertToFacture(){
    collectDoc();
    const { number, key, n } = nextNumber('facture');
    commitNumber(key, n);
    const fac = {
        id: uid('doc'), type:'facture', number, status:'brouillon',
        date: todayISO(), validity:'',
        dueDate: addDaysISO(todayISO(), DB.settings.paydays), paidDate:'',
        clientId: editing.clientId,
        lines: structuredClone(editing.lines), notes: editing.notes,
        sourceDevis: editing.number
    };
    DB.documents.push(fac);
    // marquer le devis accepté
    if(editing.id){
        editing.status='accepte';
        const idx=DB.documents.findIndex(d=>d.id===editing.id);
        if(idx>=0) DB.documents[idx]=editing;
    }
    save(); closeModal('#docModal');
    toast('Facture '+number+' créée', 'ok');
    openDoc(fac.id);
}

/* ============================================================
   IMPRESSION / PDF
   ============================================================ */
function printDoc(){
    collectDoc();
    const s = DB.settings, c = clientById(editing.clientId) || {};
    const isFac = editing.type==='facture';
    const total = docTotal(editing);
    const rows = editing.lines.map((l,i)=>`
        <tr>
            <td>${i+1}</td>
            <td>${esc(l.designation)}</td>
            <td class="r">${l.qty}</td>
            <td>${esc(l.unit)}</td>
            <td class="r">${euro(l.pu)}</td>
            <td class="r">${euro((Number(l.qty)||0)*(Number(l.pu)||0))}</td>
        </tr>`).join('');

    $('#printArea').innerHTML = `
    <div class="doc-sheet">
        <div class="doc-top">
            <div class="doc-company">
                ${s.logo?`<img class="doc-logo" src="${s.logo}" alt="logo">`:''}
                <div class="dc-name">${escNameBrand(s.name)}</div>
                <p>${esc(s.owner)}</p>
                <p>${esc(s.address)}</p>
                <p>SIRET : ${esc(s.siret)}</p>
                <p>${esc(s.email)} · ${esc(s.phone)}</p>
            </div>
            <div class="doc-meta">
                <div class="dm-type">${isFac?'Facture':'Devis'}</div>
                <p class="dm-num">N° ${esc(editing.number)}</p>
                <p>Date : ${frDate(editing.date)}</p>
                ${!isFac && editing.validity ? `<p>Validité : ${esc(editing.validity)}</p>`:''}
                ${isFac && editing.dueDate ? `<p>Échéance : ${frDate(editing.dueDate)}</p>`:''}
                ${isFac && editing.sourceDevis ? `<p>Réf. devis : ${esc(editing.sourceDevis)}</p>`:''}
            </div>
        </div>

        <div class="doc-parties">
            <div class="doc-client-box">
                <div class="dcb-title">Client</div>
                <div class="dcb-name">${esc(c.name||'—')}</div>
                ${c.address?`<p>${esc(c.address)}</p>`:''}
                ${c.siret?`<p>SIRET : ${esc(c.siret)}</p>`:''}
                ${c.contact?`<p>${esc(c.contact)}</p>`:''}
                ${c.email?`<p>${esc(c.email)}</p>`:''}
            </div>
        </div>

        <table class="doc-table">
            <thead><tr><th>#</th><th>Désignation</th><th class="r">Qté</th><th>Unité</th><th class="r">P.U. HT</th><th class="r">Total HT</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>

        <div class="doc-totals">
            <table>
                <tr><td class="tt-label">Total HT</td><td class="tt-val">${euro(total)}</td></tr>
                <tr class="tt-net"><td>Net à payer</td><td class="tt-val">${euro(total)}</td></tr>
            </table>
        </div>
        <div class="doc-tva">${esc(s.tva)}</div>

        <div class="doc-conditions">
            <h4>Conditions de règlement</h4>
            <p>${esc(s.payterms)}</p>
            <p>Pénalités de retard : 3 × taux d'intérêt légal. Indemnité forfaitaire de recouvrement : 40 €.</p>
            ${s.iban?`<p>IBAN : ${esc(s.iban)}</p>`:''}
        </div>

        ${!isFac ? `<div class="doc-sign">
            <div class="ds-box">Date et signature du client précédées de la mention « Bon pour accord » :
                <div class="ds-line"></div>
            </div>
        </div>`:''}

        <div class="doc-foot">${esc(s.legal)}</div>
    </div>`;

    setTimeout(()=> window.print(), 60);
}
function escNameBrand(name){
    // met en valeur le 2e mot comme sur le logo
    const parts = esc(name).split(' ');
    if(parts.length>1) return `${parts[0]} <span class="dot">${parts.slice(1).join(' ')}</span>`;
    return esc(name);
}

/* ============================================================
   BILAN ANNUEL
   ============================================================ */
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
function availableYears(){
    const ys = new Set(DB.documents.filter(d=>d.type==='facture'&&d.date).map(d=>d.date.slice(0,4)));
    ys.add(String(new Date().getFullYear()));
    return [...ys].sort().reverse();
}
function renderBilan(){
    const sel = $('#bilanYear');
    const years = availableYears();
    const current = sel.value && years.includes(sel.value) ? sel.value : years[0];
    sel.innerHTML = years.map(y=>`<option value="${y}">${y}</option>`).join('');
    sel.value = current;

    const factures = DB.documents.filter(d=>d.type==='facture' && (d.date||'').startsWith(current));
    const paid = factures.filter(f=>f.status==='payee');
    const caFacture = factures.reduce((s,f)=>s+docTotal(f),0);
    const caPaye = paid.reduce((s,f)=>s+docTotal(f),0);
    const devisAcc = DB.documents.filter(d=>d.type==='devis'&&d.status==='accepte'&&(d.date||'').startsWith(current)).length;

    $('#bilanKpi').innerHTML = `
        ${kpi('CA facturé '+current, euro(caFacture), `${factures.length} facture(s)`)}
        ${kpi('Encaissé '+current, euro(caPaye), `${paid.length} payée(s)`)}
        ${kpi('Reste à encaisser', euro(caFacture-caPaye), `${factures.length-paid.length} en attente`)}
        ${kpi('Devis acceptés', devisAcc, current)}
    `;

    // détail mensuel : facturé (par date d'émission), encaissé (par date de paiement)
    const fByM = Array(12).fill(0), fCount = Array(12).fill(0), pByM = Array(12).fill(0);
    factures.forEach(f=>{ const m=+f.date.slice(5,7)-1; fByM[m]+=docTotal(f); fCount[m]++; });
    paid.forEach(f=>{ const d=f.paidDate||f.date; const m=+d.slice(5,7)-1; pByM[m]+=docTotal(f); });

    $('#bilanTable').innerHTML = `
        <thead><tr><th>Mois</th><th class="amount">Factures</th><th class="amount">CA facturé HT</th><th class="amount">Encaissé HT</th></tr></thead>
        <tbody>${MONTHS.map((m,i)=>`<tr><td>${m}</td><td class="amount">${fCount[i]||''}</td><td class="amount">${fByM[i]?euro(fByM[i]):'—'}</td><td class="amount">${pByM[i]?euro(pByM[i]):'—'}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td>Total ${current}</td><td class="amount">${factures.length}</td><td class="amount">${euro(caFacture)}</td><td class="amount">${euro(caPaye)}</td></tr></tfoot>`;
}
function exportCsv(){
    const year = $('#bilanYear').value;
    const rows = [['Numéro','Date','Échéance','Client','Statut','Date encaissement','Montant HT']];
    DB.documents.filter(d=>d.type==='facture'&&(d.date||'').startsWith(year))
        .sort((a,b)=>(a.number||'').localeCompare(b.number||''))
        .forEach(f=>{ const c=clientById(f.clientId);
            rows.push([f.number, frDate(f.date), frDate(f.dueDate), c?c.name:'', STATUS_LABEL[f.status], frDate(f.paidDate), docTotal(f).toFixed(2)]);
        });
    const csv = '﻿' + rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = `erp-conseil-factures-${year}.csv`; a.click(); URL.revokeObjectURL(a.href);
    toast('Export CSV généré', 'ok');
}

/* ============================================================
   SATISFACTION CLIENT
   ============================================================ */
let satCache = null;   // dernières réponses chargées
const starStr = n => '★★★★★☆☆☆☆☆'.slice(5-Math.round(n), 10-Math.round(n));

function buildReviewUrl(client, mission){
    let base = (DB.settings.formurl||'').trim();
    if(!base) base = location.href.replace(/[^/]*$/, '') + 'satisfaction.html';
    const q = new URLSearchParams();
    if(mission) q.set('mission', mission);
    if(client)  q.set('client', client);
    return base + (q.toString() ? '?'+q.toString() : '');
}

function renderSatisfaction(force){
    const body = $('#satBody');
    const ep = (DB.settings.satendpoint||'').trim();
    if(!ep){
        body.innerHTML = satSetupHtml();
        $('#satOpenAt').onclick = ()=> window.open('https://airtable.com/appxtRiMOwwHlRk1k','_blank');
        $('#satGoSettings').onclick = ()=> showView('settings');
        return;
    }
    if(satCache && !force){ renderSatData(satCache); return; }
    body.innerHTML = `<div class="setup"><p class="muted">Chargement des avis…</p></div>`;
    fetch(ep, { method:'GET' })
        .then(r=>r.json())
        .then(d=>{
            if(!d.ok) throw new Error(d.error||'Réponse invalide');
            satCache = (d.records||[]);
            renderSatData(satCache);
        })
        .catch(err=>{
            body.innerHTML = `<div class="setup">
                <h2>Impossible de charger les avis</h2>
                <p class="muted small">${esc(String(err.message||err))}</p>
                <p class="muted small">Vérifiez l'URL du relais dans Réglages → Satisfaction, et que le déploiement Apps Script est accessible « à tout le monde ».</p>
                <div class="settings-actions" style="margin-top:16px"><button class="btn btn-secondary" id="satRetry">Réessayer</button>
                <button class="btn btn-outline" id="satOpenAt">Voir dans Airtable</button></div>
            </div>`;
            $('#satRetry').onclick = ()=> renderSatisfaction(true);
            $('#satOpenAt').onclick = ()=> window.open('https://airtable.com/appxtRiMOwwHlRk1k','_blank');
        });
}
function satSetupHtml(){
    return `<div class="setup">
        <h2>⚙ Activer la collecte des avis</h2>
        <p class="muted">Votre base Airtable « ERP Conseil — Satisfaction » est prête. Pour collecter et afficher les avis :</p>
        <ol>
            <li>Ouvrez <code>google-apps-script/Code.gs</code> et suivez les 4 étapes (jeton Airtable + déploiement).</li>
            <li>Collez l'URL <code>/exec</code> obtenue dans <b>satisfaction.html</b> (constante ENDPOINT) puis dans <b>Réglages → Satisfaction</b>.</li>
            <li>Renseignez aussi le <b>lien public du formulaire</b> dans Réglages.</li>
        </ol>
        <p class="muted small">En attendant, vous pouvez déjà générer et tester un lien d'avis ci-dessus, et consulter les réponses directement dans Airtable.</p>
        <div class="settings-actions" style="margin-top:8px">
            <button class="btn btn-outline" id="satOpenAt">Ouvrir la base Airtable</button>
            <button class="btn btn-secondary" id="satGoSettings">Aller aux réglages</button>
        </div></div>`;
}
function renderSatData(records){
    const body = $('#satBody');
    if(!records.length){
        body.innerHTML = `<div class="empty"><div class="big">⭐</div>Aucun avis pour l'instant.<br><br>
            <button class="btn btn-primary" id="genLink2">🔗 Générer un lien d'avis</button></div>`;
        $('#genLink2').onclick = ()=> openLinkModal('', '');
        return;
    }
    const notes = records.map(r=> Number(r['Note globale'])||0).filter(Boolean);
    const avg = notes.reduce((s,n)=>s+n,0)/notes.length;
    const dist = [5,4,3,2,1].map(n=> ({n, c: notes.filter(x=>x===n).length}));
    const recoYes = records.filter(r=> r['Recommandation']==='Oui').length;
    const recoPct = records.length ? Math.round(recoYes/records.length*100) : 0;

    body.innerHTML = `
        <div class="sat-top">
            <div class="sat-big"><div class="sb-val">${avg.toFixed(1)}<span style="font-size:1.1rem;color:var(--text-muted)">/5</span></div><div class="sb-stars">${starStr(avg)}</div><div class="sb-label">Note moyenne</div></div>
            <div class="sat-big"><div class="sb-val">${records.length}</div><div class="sb-label">Avis reçus</div></div>
            <div class="sat-big"><div class="sb-val">${recoPct}%</div><div class="sb-label">Recommandent ERP Conseil</div></div>
        </div>
        <div class="dash-cols">
            <div class="card">
                <div class="card-head"><h2>Répartition des notes</h2></div>
                ${dist.map(d=>`<div class="dist-row"><span class="dist-lab">${d.n} ★</span><div class="dist-bar"><span style="width:${records.length?Math.round(d.c/notes.length*100):0}%"></span></div><span class="dist-n">${d.c}</span></div>`).join('')}
            </div>
            <div class="card">
                <div class="card-head"><h2>À publier sur le site</h2></div>
                <p class="muted small">${records.filter(r=>r['Publier sur le site']).length} avis autorisé(s) à la publication.</p>
            </div>
        </div>
        <h2 style="margin:6px 0 14px">Derniers avis</h2>
        ${records.slice(0,30).map(r=>`
            <div class="review">
                <div class="review-head">
                    <span class="rv-name">${esc(r['Client']||'Anonyme')}</span>
                    <span class="rv-stars">${starStr(Number(r['Note globale'])||0)}</span>
                </div>
                <div class="rv-meta">${r['Mission']?esc(r['Mission'])+' · ':''}${r['Date']?frDate(String(r['Date']).slice(0,10)):''}</div>
                ${r['Commentaire']?`<div class="rv-text">« ${esc(r['Commentaire'])} »</div>`:''}
                <div class="rv-badges">
                    ${r['Recommandation']?`<span class="badge ${r['Recommandation']==='Oui'?'accepte':r['Recommandation']==='Non'?'refuse':'envoye'}">Recommande : ${esc(r['Recommandation'])}</span>`:''}
                    ${r['Publier sur le site']?`<span class="badge facture">Publiable</span>`:''}
                </div>
            </div>`).join('')}
    `;
}

/* ---------- Modale lien d'avis ---------- */
function openLinkModal(client, mission){
    $('#lk-client').value  = client || '';
    $('#lk-mission').value = mission || '';
    updateLinkUrl();
    $('#lk-warn').textContent = (DB.settings.formurl||'').trim() ? '' :
        '⚠ Renseignez le « lien public du formulaire » dans Réglages pour un lien définitif.';
    openModal('#linkModal');
}
function updateLinkUrl(){ $('#lk-url').value = buildReviewUrl($('#lk-client').value.trim(), $('#lk-mission').value.trim()); }

/* ============================================================
   CLIENTS
   ============================================================ */
function renderClients(){
    const q = ($('#clientsSearch').value||'').toLowerCase();
    let list = DB.clients;
    if(q) list = list.filter(c=> c.name.toLowerCase().includes(q));
    $('#clientsCount').textContent = `${DB.clients.length} client${DB.clients.length>1?'s':''}`;
    const grid = $('#clientsGrid');
    if(!list.length){ grid.innerHTML = `<div class="empty"><div class="big">👥</div>Aucun client.</div>`; return; }
    grid.innerHTML = list.map(c=>{
        const docs = DB.documents.filter(d=>d.clientId===c.id);
        const ca = docs.filter(d=>d.type==='facture').reduce((s,d)=>s+docTotal(d),0);
        return `<div class="client-card" data-edit="${c.id}">
            <h3>${esc(c.name)}</h3>
            ${c.contact?`<p>${esc(c.contact)}</p>`:''}
            ${c.email?`<p>${esc(c.email)}</p>`:''}
            ${c.phone?`<p>${esc(c.phone)}</p>`:''}
            <div class="cc-stats"><span><b>${docs.filter(d=>d.type==='devis').length}</b> devis</span><span><b>${euro(ca)}</b> facturé</span></div>
        </div>`;
    }).join('');
    $$('.client-card', grid).forEach(card=> card.onclick=()=> editClient(card.dataset.edit));
}

let editingClient = null;
function newClient(returnToDoc=false){
    editingClient = {id:null, name:'', address:'', siret:'', contact:'', email:'', phone:''};
    editingClient._returnToDoc = returnToDoc;
    fillClientForm(); openModal('#clientModal');
}
function editClient(id){
    editingClient = structuredClone(DB.clients.find(c=>c.id===id));
    fillClientForm(); openModal('#clientModal');
}
function fillClientForm(){
    $('#clientModalTitle').textContent = editingClient.id ? 'Modifier le client' : 'Nouveau client';
    $('#cl-name').value=editingClient.name; $('#cl-address').value=editingClient.address;
    $('#cl-siret').value=editingClient.siret; $('#cl-contact').value=editingClient.contact;
    $('#cl-email').value=editingClient.email; $('#cl-phone').value=editingClient.phone;
    $('#deleteClient').hidden = !editingClient.id;
}
function saveClient(){
    const name = $('#cl-name').value.trim();
    if(!name){ toast('Le nom est obligatoire.', 'err'); return; }
    Object.assign(editingClient,{
        name, address:$('#cl-address').value.trim(), siret:$('#cl-siret').value.trim(),
        contact:$('#cl-contact').value.trim(), email:$('#cl-email').value.trim(), phone:$('#cl-phone').value.trim()
    });
    let id = editingClient.id;
    if(id){ const i=DB.clients.findIndex(c=>c.id===id); DB.clients[i]={...editingClient}; }
    else { id = editingClient.id = uid('cl'); DB.clients.push({...editingClient}); }
    save(); closeModal('#clientModal'); toast('Client enregistré', 'ok');

    if(editingClient._returnToDoc){            // revenu depuis l'éditeur de doc
        editing.clientId = id;
        fillClientSelect($('#doc-client'), id);
    } else { renderClients(); }
}
function deleteClient(){
    if(!editingClient.id) return;
    const used = DB.documents.some(d=>d.clientId===editingClient.id);
    if(used){ toast('Client utilisé par des documents : suppression impossible.', 'err'); return; }
    if(!confirm('Supprimer ce client ?')) return;
    DB.clients = DB.clients.filter(c=>c.id!==editingClient.id);
    save(); closeModal('#clientModal'); toast('Client supprimé'); renderClients();
}

/* ============================================================
   RÉGLAGES
   ============================================================ */
function fillSettings(){
    const s = DB.settings;
    $('#set-name').value=s.name; $('#set-owner').value=s.owner; $('#set-address').value=s.address;
    $('#set-siret').value=s.siret; $('#set-email').value=s.email; $('#set-phone').value=s.phone;
    $('#set-iban').value=s.iban||''; $('#set-paydays').value=s.paydays??30;
    $('#set-tva').value=s.tva; $('#set-payterms').value=s.payterms;
    $('#set-legal').value=s.legal; $('#set-validity').value=s.validity;
    $('#set-devprefix').value=s.devprefix; $('#set-facprefix').value=s.facprefix;
    $('#set-formurl').value=s.formurl||''; $('#set-satendpoint').value=s.satendpoint||'';
    renderLogoPreview(); updateNumPreview();
}
function renderLogoPreview(){
    const box = $('#logoPreview');
    if(DB.settings.logo){
        box.innerHTML = `<img src="${DB.settings.logo}" alt="logo">`;
        $('#logoRemove').hidden = false;
    }else{
        box.innerHTML = `<span class="muted small">Aucun logo</span>`;
        $('#logoRemove').hidden = true;
    }
}
function setLogo(file){
    if(file.size > 1024*1024){ toast('Image trop lourde (max 1 Mo).', 'err'); return; }
    const r = new FileReader();
    r.onload = ()=>{ DB.settings.logo = r.result; save(); renderLogoPreview(); toast('Logo enregistré', 'ok'); };
    r.readAsDataURL(file);
}
function removeLogo(){ DB.settings.logo=''; save(); renderLogoPreview(); toast('Logo retiré'); }
function updateNumPreview(){
    const y=new Date().getFullYear();
    $('#numPreview').textContent = `${$('#set-devprefix').value||'DEV'}-${y}-001  ·  ${$('#set-facprefix').value||'FAC'}-${y}-001`;
}
function saveSettings(){
    const s = DB.settings;
    s.name=$('#set-name').value; s.owner=$('#set-owner').value; s.address=$('#set-address').value;
    s.siret=$('#set-siret').value; s.email=$('#set-email').value; s.phone=$('#set-phone').value;
    s.iban=$('#set-iban').value; s.paydays=Math.max(0,parseInt($('#set-paydays').value)||0);
    s.tva=$('#set-tva').value; s.payterms=$('#set-payterms').value;
    s.legal=$('#set-legal').value; s.validity=$('#set-validity').value;
    s.devprefix=$('#set-devprefix').value.trim()||'DEV'; s.facprefix=$('#set-facprefix').value.trim()||'FAC';
    s.formurl=$('#set-formurl').value.trim(); s.satendpoint=$('#set-satendpoint').value.trim();
    satCache=null;
    save(); refreshBrand(); toast('Réglages enregistrés', 'ok');
}
function refreshBrand(){
    $('#sideCompany').textContent = DB.settings.name;
    $('#sideOwner').textContent   = DB.settings.owner;
}

/* ---------- Export / Import / Reset ---------- */
function exportData(){
    const blob = new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `erp-conseil-sauvegarde-${todayISO()}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    toast('Sauvegarde exportée', 'ok');
}
function importData(file){
    const r = new FileReader();
    r.onload = () => {
        try{
            const data = JSON.parse(r.result);
            if(!data.settings || !Array.isArray(data.documents)) throw 0;
            if(!confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return;
            DB = data;
            DB.settings = Object.assign({}, DEFAULTS.settings, DB.settings);
            DB.settings.counters = DB.settings.counters||{};
            save(); refreshBrand(); showView('dashboard'); toast('Sauvegarde importée', 'ok');
        }catch(e){ toast('Fichier invalide.', 'err'); }
    };
    r.readAsText(file);
}
function resetData(){
    if(!confirm('Tout réinitialiser ? Cette action est irréversible (pensez à exporter une sauvegarde avant).')) return;
    DB = structuredClone(DEFAULTS); save(); refreshBrand(); showView('dashboard'); toast('Données réinitialisées');
}

/* ============================================================
   MODALES
   ============================================================ */
function openModal(sel){ $(sel).classList.add('open'); }
function closeModal(sel){ $(sel).classList.remove('open'); }

/* ============================================================
   ÉVÉNEMENTS
   ============================================================ */
function bindNewButtons(){
    $$('[data-new]').forEach(b=> b.onclick = ()=> newDoc(b.dataset.new==='facture'?'facture':'devis'));
}
function init(){
    load(); refreshBrand();

    // navigation
    $$('.nav-item').forEach(b=> b.onclick = ()=> showView(b.dataset.view));
    $$('[data-view-link]').forEach(b=> b.onclick = ()=> showView(b.dataset.viewLink));
    $('#burger').onclick = ()=> $('#sidebar').classList.toggle('open');

    // boutons « nouveau »
    bindNewButtons();
    $('#newClientBtn').onclick = ()=> newClient(false);

    // recherches
    $('#devisSearch').oninput    = ()=> renderDocList('devis');
    $('#facturesSearch').oninput = ()=> renderDocList('facture');
    $('#clientsSearch').oninput  = ()=> renderClients();

    // éditeur doc
    $('#addLine').onclick   = ()=>{ editing.lines.push({designation:'',qty:1,unit:'forfait',pu:0}); renderLines(); };
    $('#saveDoc').onclick   = saveDoc;
    $('#deleteDoc').onclick = deleteDoc;
    $('#printDoc').onclick  = printDoc;
    $('#convertDoc').onclick= convertToFacture;
    $('#askReview').onclick = ()=>{ const c=clientById(editing.clientId); openLinkModal(c?c.name:'', editing.number); };
    $('#doc-client').onchange = e=>{ if(e.target.value==='__new'){ newClient(true);} else { editing.clientId=e.target.value; } };
    $('#doc-status').onchange = updatePaidVisibility;

    // éditeur client
    $('#saveClient').onclick   = saveClient;
    $('#deleteClient').onclick = deleteClient;

    // réglages
    $('#saveSettings').onclick = saveSettings;
    $('#set-devprefix').oninput = updateNumPreview;
    $('#set-facprefix').oninput = updateNumPreview;
    $('#logoBtn').onclick = ()=> $('#logoFile').click();
    $('#logoFile').onchange = e=>{ if(e.target.files[0]) setLogo(e.target.files[0]); e.target.value=''; };
    $('#logoRemove').onclick = removeLogo;

    // bilan
    $('#bilanYear').onchange = renderBilan;
    $('#exportCsv').onclick  = exportCsv;

    // satisfaction
    $('#refreshSat').onclick = ()=> renderSatisfaction(true);
    $('#genLink').onclick    = ()=> openLinkModal('', '');
    $('#lk-client').oninput  = updateLinkUrl;
    $('#lk-mission').oninput = updateLinkUrl;
    $('#lk-copy').onclick = ()=>{ const t=$('#lk-url'); t.select(); navigator.clipboard?.writeText(t.value).then(()=>toast('Lien copié','ok'),()=>{document.execCommand('copy');toast('Lien copié','ok');}); };
    $('#lk-open').onclick = ()=> window.open($('#lk-url').value,'_blank');
    $$('[data-close-link]').forEach(b=> b.onclick = ()=> closeModal('#linkModal'));
    $('#exportData').onclick = exportData;
    $('#importData').onclick = ()=> $('#importFile').click();
    $('#importFile').onchange = e=>{ if(e.target.files[0]) importData(e.target.files[0]); e.target.value=''; };
    $('#resetData').onclick = resetData;

    // fermeture modales
    $$('[data-close]').forEach(b=> b.onclick = ()=>{ closeModal('#docModal'); closeModal('#clientModal'); });
    $$('.modal-overlay').forEach(o=> o.onclick = e=>{ if(e.target===o) o.classList.remove('open'); });
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') $$('.modal-overlay').forEach(o=>o.classList.remove('open')); });

    showView('dashboard');
}
document.addEventListener('DOMContentLoaded', init);
})();
