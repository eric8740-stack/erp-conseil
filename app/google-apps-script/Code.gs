/**
 * ERP Conseil — Relais Satisfaction (Google Apps Script → Airtable)
 * --------------------------------------------------------------
 * Rôle : recevoir les avis du formulaire (satisfaction.html) et les écrire
 * dans Airtable, et renvoyer les avis à l'application (tableau de bord).
 * La clé Airtable reste ICI (côté serveur), jamais dans le dépôt public.
 *
 * MISE EN PLACE (une seule fois) :
 * 1. Créez un jeton Airtable (Personal Access Token) sur
 *    https://airtable.com/create/tokens
 *    Scopes : data.records:read  ET  data.records:write
 *    Accès  : la base « ERP Conseil — Satisfaction »
 * 2. Sur script.google.com → Nouveau projet → collez ce fichier.
 * 3. Menu Projet → Propriétés du script → ajoutez une propriété :
 *       AIRTABLE_TOKEN = (votre jeton)
 * 4. Déployer → Nouveau déploiement → type « Application Web »
 *       Exécuter en tant que : moi   |   Accès : Tout le monde
 *    Copiez l'URL /exec obtenue :
 *       - collez-la dans satisfaction.html (constante ENDPOINT)
 *       - collez-la dans l'app : Réglages → Satisfaction → URL du relais
 */

const BASE_ID = 'appxtRiMOwwHlRk1k';   // ERP Conseil — Satisfaction
const TABLE   = 'Satisfaction';

function token_(){ return PropertiesService.getScriptProperties().getProperty('AIRTABLE_TOKEN'); }
function json_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Réception d'un avis depuis le formulaire */
function doPost(e){
  try{
    const d = JSON.parse(e.postData.contents);
    const fields = {
      'Client'             : d.client || '',
      'Mission'            : d.mission || '',
      'Note globale'       : Number(d.note) || null,
      'Commentaire'        : d.commentaire || '',
      'Email'              : d.email || '',
      'Date'               : d.date || new Date().toISOString().slice(0,10),
      'Publier sur le site': !!d.publier
    };
    if(d.recommandation) fields['Recommandation'] = d.recommandation;

    const res = UrlFetchApp.fetch('https://api.airtable.com/v0/' + BASE_ID + '/' + encodeURIComponent(TABLE), {
      method: 'post', contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token_() },
      payload: JSON.stringify({ fields: fields, typecast: true }),
      muteHttpExceptions: true
    });
    return json_({ ok: res.getResponseCode() === 200, status: res.getResponseCode() });
  }catch(err){
    return json_({ ok: false, error: String(err) });
  }
}

/** Lecture des avis pour le tableau de bord de l'application */
function doGet(){
  try{
    const out = []; let offset = '';
    do{
      const url = 'https://api.airtable.com/v0/' + BASE_ID + '/' + encodeURIComponent(TABLE) +
                  '?pageSize=100&sort%5B0%5D%5Bfield%5D=Date&sort%5B0%5D%5Bdirection%5D=desc' +
                  (offset ? '&offset=' + offset : '');
      const res = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token_() }, muteHttpExceptions: true });
      const data = JSON.parse(res.getContentText());
      (data.records || []).forEach(r => out.push(r.fields));
      offset = data.offset || '';
    }while(offset);
    return json_({ ok: true, records: out });
  }catch(err){
    return json_({ ok: false, error: String(err) });
  }
}
