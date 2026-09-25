/* Health Line — contas locais (cadastro, login, perfil, backup).
   Sem servidor: os dados ficam no localStorage deste navegador. */
(function () {
  'use strict';
  // Trava de rolagem compartilhada: tanto este modal de conta quanto o painel
  // do assistente (script.js) mexem em document.body.style.overflow. Sem um
  // contador em comum, um dos dois podia "destravar" o scroll que o outro
  // ainda precisava manter travado (ou vice-versa), deixando a rolagem da
  // página presa e as animações que dependem do scroll paradas.
  window.ScrollLock = window.ScrollLock || (function () {
    let n = 0;
    return {
      lock() { n++; document.body.style.overflow = 'hidden'; },
      unlock() { n = Math.max(0, n - 1); if (n === 0) document.body.style.overflow = ''; }
    };
  })();
  const $ = id => document.getElementById(id);
  const K_USERS = 'health-users', K_SESSION = 'health-session';
  const KEEP = [K_USERS, K_SESSION, 'health-theme', 'health-gemini-key'];
  const GOALS = {
    energia: { diet: 'energia', label: 'Ter mais energia no dia a dia' },
    equilibrio: { diet: 'equilibrio', label: 'Alimentação equilibrada' },
    forca: { diet: 'esporte', label: 'Ganhar força' },
    resistencia: { diet: 'esporte', label: 'Melhorar a resistência' },
    mobilidade: { diet: 'rotina', label: 'Mobilidade e flexibilidade' }
  };
  const RESTR = [['lactose', 'Sem lactose'], ['gluten', 'Sem glúten'], ['ovo', 'Sem ovo'], ['oleaginosas', 'Sem castanhas'], ['frutosdomar', 'Sem frutos do mar'], ['carne', 'Sem carne vermelha'], ['frango', 'Sem frango'], ['porco', 'Sem porco']];

  const users = () => { try { return JSON.parse(localStorage.getItem(K_USERS)) || {}; } catch (_) { return {}; } };
  const saveUsers = u => localStorage.setItem(K_USERS, JSON.stringify(u));
  const current = () => { const e = localStorage.getItem(K_SESSION); return e ? users()[e] || null : null; };
  const dataKeys = () => Object.keys(localStorage).filter(k => k.startsWith('health-') && !KEEP.includes(k));
  const snapshot = () => { const o = {}; dataKeys().forEach(k => { o[k] = localStorage.getItem(k); }); return o; };
  const clearData = () => dataKeys().forEach(k => localStorage.removeItem(k));
  const first = n => String(n || '').trim().split(/\s+/)[0];
  const rand = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
  const ageOf = iso => { const b = new Date(iso), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a; };

  async function hash(pass, salt) {
    const buf = new TextEncoder().encode(salt + ':' + pass);
    if (window.crypto && crypto.subtle) {
      const h = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, '0')).join('');
    }
    let x = 5381; buf.forEach(b => { x = ((x << 5) + x + b) >>> 0; }); return 'f' + x.toString(16);
  }

  function persist() {
    const u = current(); if (!u) return;
    const all = users(); const em = u.profile.email;
    all[em].data = snapshot(); all[em].updatedAt = Date.now(); saveUsers(all);
  }

  window.HealthUser = {
    get() {
      const u = current(); if (!u) return null;
      const p = u.profile, g = GOALS[p.objetivo];
      return Object.assign({}, p, { idade: ageOf(p.nascimento), objetivoLabel: g ? g.label : p.objetivo });
    }
  };

  // ---------- integração com as ferramentas do site ----------
  // opts.calculate = true dispara o cálculo (e a animação de resultado) na hora —
  // use isso só quando o usuário está olhando para a seção (ex.: acabou de salvar
  // o perfil). Sem essa opção, os campos são preenchidos em silêncio e o cálculo
  // fica "armado" para acontecer quando a seção entrar na tela pela primeira vez,
  // preservando a animação de entrada em vez de queimá-la ainda fora da viewport.
  function applyProfile(p, opts) {
    opts = opts || {};
    try {
      const set = (id, v) => { const el = $(id); if (el && v !== '' && v != null) el.value = v; };
      const age = ageOf(p.nascimento);
      set('peso', p.peso); set('altura', p.altura); set('idade', age);
      set('idadeCal', age); set('pesoCal', p.peso); set('alturaCal', p.altura); set('atividade', p.atividade);
      (p.sexo === 'm' ? $('btnM') : $('btnF')).click();
      const g = GOALS[p.objetivo]; if (g) { set('dietGoal', g.diet); }
      set('dietStyle', p.estilo);
      document.querySelectorAll('#restrictGrid input').forEach(i => { i.checked = (p.restricoes || []).includes(i.value); });
      if (opts.calculate) {
        $('imcForm').requestSubmit();
        $('calForm').requestSubmit();
      } else {
        armRevealTriggers();
      }
    } catch (e) { console.warn('Perfil não aplicado:', e); }
  }

  // Dispara o cálculo automático do IMC e das calorias só quando a seção
  // correspondente entra na tela, uma única vez cada.
  let revealArmed = false;
  function armRevealTriggers() {
    if (revealArmed) return;
    revealArmed = true;
    const imcSection = document.getElementById('imc');
    const calForm = $('calForm');
    const calSection = calForm ? calForm.closest('section') : null;
    if (!('IntersectionObserver' in window)) {
      // Sem suporte a IntersectionObserver: melhor calcular direto do que nunca calcular.
      if ($('imcForm')) $('imcForm').requestSubmit();
      if (calForm) calForm.requestSubmit();
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (entry.target === imcSection && $('imcForm')) $('imcForm').requestSubmit();
        if (entry.target === calSection && calForm) calForm.requestSubmit();
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.3 });
    if (imcSection) io.observe(imcSection);
    if (calSection && calSection !== imcSection) io.observe(calSection);
  }

  // ---------- interface ----------
  let view = 'register', lastFocus = null;
  const VIEWS = {
    register: ['Criar sua conta', 'Seus dados ficam salvos neste dispositivo e personalizam IMC, água e refeições.', 'Criar conta'],
    login: ['Entrar', 'Use o e-mail e a senha da conta criada neste dispositivo.', 'Entrar'],
    profile: ['Meu perfil', 'Atualize seus dados. Eles alimentam IMC, água, plano alimentar e a assistente Linha.', 'Salvar alterações']
  };

  function build() {
    const opt = (o, sel) => Object.keys(o).map(k => '<option value="' + k + '">' + o[k] + '</option>').join('');
    document.body.insertAdjacentHTML('beforeend',
      '<div class="auth-overlay" id="authOverlay" role="dialog" aria-modal="true" aria-labelledby="authTitle"><div class="auth-box">' +
      '<button class="auth-x" id="authX" type="button" aria-label="Fechar">×</button>' +
      '<div class="auth-tabs" id="authTabs"><button type="button" data-view="register">Criar conta</button><button type="button" data-view="login">Entrar</button></div>' +
      '<h2 id="authTitle"></h2><p class="auth-lead" id="authLead"></p>' +
      '<form id="authForm" novalidate><div class="auth-grid">' +
      '<label class="auth-f full" data-v="register profile">Nome<input id="cNome" autocomplete="given-name" maxlength="60"></label>' +
      '<label class="auth-f full" data-v="register login">E-mail<input id="cEmail" type="email" autocomplete="email"></label>' +
      '<label class="auth-f full" data-v="register login">Senha<input id="cSenha" type="password" minlength="6"><small data-v="register">Mínimo de 6 caracteres. Não há recuperação de senha: guarde um backup.</small></label>' +
      '<label class="auth-f" data-v="register profile">Data de nascimento<input id="cNasc" type="date" min="1900-01-01"></label>' +
      '<label class="auth-f" data-v="register profile">Sexo<select id="cSexo"><option value="f">Feminino</option><option value="m">Masculino</option></select></label>' +
      '<label class="auth-f" data-v="register profile">Peso (kg)<input id="cPeso" type="number" step=".1" inputmode="decimal" placeholder="70"></label>' +
      '<label class="auth-f" data-v="register profile">Altura (cm)<input id="cAlt" type="number" inputmode="decimal" placeholder="170"></label>' +
      '<label class="auth-f full" data-v="register profile">Nível de atividade<select id="cAtiv"><option value="1.2">Pouco ativo, pouco ou nenhum exercício</option><option value="1.375">Levemente ativo, 1 a 3x por semana</option><option value="1.55" selected>Moderadamente ativo, 3 a 5x por semana</option><option value="1.725">Muito ativo, quase todos os dias</option></select></label>' +
      '<label class="auth-f" data-v="register profile">Objetivo<select id="cObj">' + opt(Object.fromEntries(Object.entries(GOALS).map(([k, v]) => [k, v.label]))) + '</select></label>' +
      '<label class="auth-f" data-v="register profile">Preferência alimentar<select id="cEstilo"><option value="brasileira">Comida brasileira</option><option value="vegetariana">Vegetariana</option><option value="vegana">Vegana</option><option value="simples">Refeições simples</option></select></label>' +
      '<fieldset class="auth-f full" data-v="register profile"><legend>Restrições alimentares (opcional)</legend><div class="auth-chks">' +
      RESTR.map(r => '<label><input type="checkbox" value="' + r[0] + '">' + r[1] + '</label>').join('') + '</div></fieldset>' +
      '<label class="auth-consent full" data-v="register"><input type="checkbox" id="cOk"><span>Concordo em salvar meus dados de saúde neste dispositivo para personalizar o Health Line. Nada é enviado a um servidor.</span></label>' +
      '</div><p class="auth-err" id="authErr" role="alert"></p><button class="btn btn-primary auth-submit" id="authSubmit" type="submit"></button></form>' +
      '<div class="auth-extra" id="authExtra"></div></div></div>' +
      '<input type="file" id="authImport" accept="application/json,.json" hidden>');

    $('authX').onclick = closeModal;
    $('authOverlay').addEventListener('mousedown', e => { if (e.target.id === 'authOverlay') closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('authOverlay').classList.contains('open')) closeModal(); });
    $('authTabs').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); });
    $('authForm').addEventListener('submit', onSubmit);
    $('authImport').addEventListener('change', e => { if (e.target.files[0]) importFile(e.target.files[0]); e.target.value = ''; });
    $('authExtra').addEventListener('click', e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'import') $('authImport').click();
      if (act === 'export') exportData();
      if (act === 'logout') { persist(); localStorage.removeItem(K_SESSION); clearData(); location.reload(); }
      if (act === 'delete' && confirm('Excluir sua conta e todos os dados salvos neste dispositivo? Isso não pode ser desfeito.')) {
        const all = users(); delete all[current().profile.email]; saveUsers(all);
        localStorage.removeItem(K_SESSION); clearData(); location.reload();
      }
    });
    $('accountBtn').addEventListener('click', () => openModal(current() ? 'profile' : 'register'));
    document.addEventListener('click', e => { if (e.target.id === 'dayCta') openModal('register'); });
  }

  const err = m => { $('authErr').textContent = m || ''; };
  function toast(m) {
    const t = document.createElement('div'); t.className = 'auth-toast'; t.textContent = m; t.setAttribute('role', 'status');
    document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
  }

  function setView(v) {
    view = v; err('');
    const [title, lead, cta] = VIEWS[v];
    $('authTitle').textContent = title; $('authLead').textContent = lead; $('authSubmit').textContent = cta;
    $('authTabs').hidden = v === 'profile';
    $('authTabs').querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    $('authForm').querySelectorAll('[data-v]').forEach(el => { el.hidden = !el.dataset.v.split(' ').includes(v); });
    $('cSenha').autocomplete = v === 'register' ? 'new-password' : 'current-password';
    const ex = $('authExtra');
    if (v === 'register') ex.innerHTML = '<p>Sem servidor: seus dados ficam só neste navegador. Se limpar os dados do navegador, você perde a conta, por isso exporte um backup em Meu perfil.</p>';
    if (v === 'login') ex.innerHTML = '<button class="btn btn-ghost" type="button" data-act="import">Importar backup</button><p>Criou a conta em outro aparelho? Exporte o backup lá e importe aqui antes de entrar.</p>';
    if (v === 'profile') {
      const u = current(); if (!u) return; const p = u.profile;
      $('cNome').value = p.nome; $('cNasc').value = p.nascimento; $('cSexo').value = p.sexo; $('cPeso').value = p.peso; $('cAlt').value = p.altura;
      $('cAtiv').value = p.atividade; $('cObj').value = p.objetivo; $('cEstilo').value = p.estilo;
      $('authForm').querySelectorAll('.auth-chks input').forEach(i => { i.checked = (p.restricoes || []).includes(i.value); });
      ex.innerHTML = '<button class="btn btn-ghost" type="button" data-act="export">Exportar meus dados</button><button class="btn btn-ghost" type="button" data-act="logout">Sair</button><button class="btn btn-ghost danger" type="button" data-act="delete">Excluir conta</button><p>Conta: ' + p.email.replace(/</g, '&lt;') + '. O arquivo exportado contém seus dados de saúde, guarde-o com cuidado.</p>';
    }
  }

  function openModal(v) {
    lastFocus = document.activeElement; setView(v);
    $('authOverlay').classList.add('open'); window.ScrollLock.lock();
    setTimeout(() => { const f = $('authForm').querySelector('input:not([hidden]),select'); const vis = Array.from($('authForm').querySelectorAll('input,select')).find(el => !el.closest('[hidden]')); (vis || f).focus(); }, 30);
  }
  function closeModal() {
    $('authOverlay').classList.remove('open'); window.ScrollLock.unlock();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function readProfile() {
    const num = id => parseFloat(String($(id).value).replace(',', '.'));
    return {
      nome: $('cNome').value.trim(), nascimento: $('cNasc').value, sexo: $('cSexo').value, peso: num('cPeso'), altura: num('cAlt'),
      atividade: $('cAtiv').value, objetivo: $('cObj').value, estilo: $('cEstilo').value,
      restricoes: Array.from($('authForm').querySelectorAll('.auth-chks input:checked')).map(i => i.value)
    };
  }
  function validate(p) {
    if (p.nome.length < 2) return 'Informe seu nome.';
    const a = p.nascimento ? ageOf(p.nascimento) : NaN;
    if (!(a >= 10 && a <= 120)) return 'Informe uma data de nascimento válida (idade entre 10 e 120 anos).';
    if (!(p.peso >= 20 && p.peso <= 400)) return 'Informe um peso entre 20 e 400 kg.';
    if (!(p.altura >= 80 && p.altura <= 250)) return 'Informe uma altura entre 80 e 250 cm.';
    return '';
  }

  async function onSubmit(e) {
    e.preventDefault(); err('');
    const all = users();
    if (view === 'login') {
      const email = $('cEmail').value.trim().toLowerCase(), u = all[email];
      if (!u || (await hash($('cSenha').value, u.salt)) !== u.hash) return err('E-mail ou senha incorretos. Se a conta foi criada em outro aparelho, importe o backup antes.');
      localStorage.setItem(K_SESSION, email); clearData();
      Object.keys(u.data || {}).forEach(k => localStorage.setItem(k, u.data[k]));
      location.reload(); return;
    }
    const p = readProfile(), bad = validate(p); if (bad) return err(bad);
    if (view === 'register') {
      const email = $('cEmail').value.trim().toLowerCase(), pass = $('cSenha').value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Digite um e-mail válido.');
      if (pass.length < 6) return err('A senha precisa ter pelo menos 6 caracteres.');
      if (!$('cOk').checked) return err('Marque a caixa de consentimento para criar a conta.');
      if (all[email]) return err('Já existe uma conta com este e-mail neste dispositivo. Use a aba Entrar.');
      p.email = email; const salt = rand();
      all[email] = { profile: p, salt, hash: await hash(pass, salt), createdAt: Date.now(), data: snapshot() };
      saveUsers(all); localStorage.setItem(K_SESSION, email);
      toast('Conta criada. Bem-vindo(a), ' + first(p.nome) + '!');
    } else {
      const u = current(); if (!u) return err('Sessão expirada. Entre novamente.');
      p.email = u.profile.email; all[p.email].profile = p; saveUsers(all); toast('Perfil atualizado.');
    }
    closeModal(); refreshUI(); applyProfile(p, { calculate: true });
  }

  function exportData() {
    persist(); const u = current(); if (!u) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(u, null, 2)], { type: 'application/json' }));
    a.download = 'health-line-' + u.profile.email.replace(/[^a-z0-9]/gi, '_') + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function importFile(file) {
    try {
      const r = JSON.parse(await file.text()); const em = r && r.profile && r.profile.email;
      if (!em || !r.hash || !r.salt) throw new Error('formato');
      const all = users(); all[em] = r; saveUsers(all); setView('login'); $('cEmail').value = em;
      toast('Backup importado. Digite a senha da conta para entrar.');
    } catch (_) { err('Arquivo inválido. Use um backup exportado pelo Health Line.'); }
  }

  function refreshUI() {
    const u = current(), b = $('accountBtn');
    b.textContent = u ? first(u.profile.nome) : 'Entrar';
    b.classList.toggle('logged', !!u);
    b.setAttribute('aria-label', u ? 'Abrir meu perfil' : 'Entrar ou criar conta');
    const g = $('heroGreeting');
    if (g && u) { const h = new Date().getHours(); g.textContent = (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite') + ', ' + first(u.profile.nome) + '. Vamos cuidar de você hoje?'; }
    const cta = $('dayCta'); if (cta) cta.hidden = !!u;
  }

  // ---------- início ----------
  build();
  const sub = document.querySelector('.day-sub');
  if (sub) sub.insertAdjacentHTML('afterend', '<button type="button" class="btn btn-ghost" id="dayCta" style="margin-top:14px">Criar conta para salvar meus dados</button>');
  refreshUI();
  const u0 = current(); if (u0) applyProfile(u0.profile);
  setInterval(persist, 4000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
  window.addEventListener('pagehide', persist);
})();