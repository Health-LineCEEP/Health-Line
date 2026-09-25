(function () {
      // Menu mobile
      const navToggle = document.getElementById('navToggle'), navLinks = document.getElementById('navLinks');
      navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
      navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

      // Tema
      const themeBtn = document.getElementById('themeBtn');
      if (localStorage.getItem('health-theme') === 'dark') document.body.classList.add('dark');
      themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('health-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
        themeBtn.textContent = document.body.classList.contains('dark') ? '☀' : '☾';
      });
      themeBtn.textContent = document.body.classList.contains('dark') ? '☀' : '☾';

      const gEl = document.getElementById('heroGreeting');
      if (gEl) { const hr = new Date().getHours(); gEl.textContent = (hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite') + '. Vamos cuidar de você hoje?'; }

      // Scroll progress + reveal + nav highlight + header fixo
      document.body.style.overflow = '';
      document.documentElement.style.overflowY = 'auto';
      const scrollProgress = document.getElementById('scrollProgress');
      const siteHeader = document.getElementById('siteHeader') || document.querySelector('header');
      const revealEls = document.querySelectorAll('.reveal');
      const navAnchors = document.querySelectorAll('.navlinks a[data-section]');
      function onScrollUI() {
        const h = document.documentElement;
        const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
        if (scrollProgress) scrollProgress.style.width = Math.min(100, Math.max(0, pct)) + '%';
        if (siteHeader) siteHeader.classList.toggle('scrolled', window.scrollY > 8);
        const mid = window.scrollY + window.innerHeight * 0.35;
        let current = 'inicio';
        ['inicio', 'resumo', 'imc', 'nutricao', 'dieta', 'habitos'].forEach(id => {
          const el = document.getElementById(id);
          if (el && el.offsetTop <= mid) current = id;
        });
        navAnchors.forEach(a => a.classList.toggle('active', a.dataset.section === current));
        revealEls.forEach(el => {
          if (el.getBoundingClientRect().top < window.innerHeight * 0.88) el.classList.add('visible');
        });
      }
      window.addEventListener('scroll', onScrollUI, { passive: true });
      // Garante que o navegador pinte o estado inicial (opacidade 0) antes de
      // marcar as seções como visíveis — sem isso, a transição de entrada
      // nunca chega a ser vista (acontece antes da primeira pintura da página).
      requestAnimationFrame(() => requestAnimationFrame(onScrollUI));
      setTimeout(onScrollUI, 120);

      // IMC — funciona para todas as idades (menores de 20: referência aproximada)
      let lastProfile = null;
      document.getElementById('imcForm').addEventListener('submit', e => {
        e.preventDefault();
        const peso = parseFloat(document.getElementById('peso').value.replace(',', '.'));
        const alturaCm = parseFloat(document.getElementById('altura').value.replace(',', '.'));
        const idade = parseInt(document.getElementById('idade').value);
        const error = document.getElementById('imcError');
        if (!peso || !alturaCm || !idade || peso <= 0 || alturaCm <= 0 || idade < 1) {
          error.textContent = 'Preencha peso, altura e idade com valores válidos.';
          return;
        }
        error.textContent = '';
        const imc = peso / Math.pow(alturaCm / 100, 2);
        lastProfile = { peso, alturaCm, idade, imc };
        const imcValEl = document.getElementById('imcValue');
        imcValEl.textContent = imc.toFixed(1).replace('.', ',');
        imcValEl.classList.remove('pop');
        void imcValEl.offsetWidth;
        imcValEl.classList.add('pop');

        const cat = document.getElementById('imcCat');
        const tip = document.getElementById('imcTip');
        cat.style.visibility = 'visible';
        cat.className = 'badge';
        cat.style.background = '';
        cat.style.color = '';
        cat.classList.remove('appear');
        void cat.offsetWidth;
        cat.classList.add('appear');

        const menor = idade < 20;
        let faixa = '';
        let classe = '';
        let texto = '';

        if (imc < 18.5) {
          faixa = 'Abaixo da referência';
          classe = 'low';
          texto = menor
            ? 'Seu IMC está abaixo de 18,5. Em adolescentes isso pode ser normal conforme o crescimento, mas também pode pedir atenção se houver cansaço ou perda de peso sem motivo. A avaliação oficial usa curvas por idade e sexo — o ideal é conversar com um profissional.'
            : 'Seu IMC está abaixo da faixa 18,5–24,9. Isso pode refletir biotipo ou hábitos alimentares — não é um diagnóstico. Se notar cansaço, queda de cabelo ou perda de peso não intencional, vale conversar com um profissional.';
        } else if (imc < 25) {
          faixa = 'Faixa de referência';
          classe = 'ok';
          texto = menor
            ? 'Seu IMC está na faixa 18,5–24,9, usada como referência aproximada. Em menores de 20 anos a classificação oficial depende de idade e sexo (percentis). Continue observando sono, alimentação, movimento e como você se sente.'
            : 'O valor está dentro da faixa de referência (18,5–24,9) para adultos. Isso não significa automaticamente “saúde perfeita”. Continue observando sono, alimentação, movimento e bem-estar emocional.';
        } else if (imc < 30) {
          faixa = 'Acima da referência';
          classe = 'over';
          texto = menor
            ? 'Seu IMC está entre 25 e 29,9. Em adolescentes o corpo ainda muda bastante; a interpretação correta usa curvas de crescimento. Observar hábitos de sono, alimentação e movimento — sem pressa ou culpa — costuma ser mais útil do que focar só neste número.'
            : 'Seu IMC está na faixa 25–29,9. O IMC não distingue músculo de gordura. Observar sono, alimentação e movimento, sem pressa ou culpa, costuma ser mais útil do que focar apenas neste número.';
        } else {
          faixa = 'Bem acima da referência';
          classe = 'obese';
          texto = menor
            ? 'Seu IMC está acima de 30. Em menores de 20 anos esse valor isolado não conta toda a história do crescimento. Uma avaliação profissional pode usar percentis por idade e sexo, além de hábitos e exames, antes de qualquer recomendação.'
            : 'Seu IMC está acima de 30. Esse valor isolado não conta toda a história do seu corpo. Uma avaliação profissional pode considerar exames, composição corporal e hábitos de vida.';
        }

        cat.textContent = menor ? (faixa + ' · ref. aproximada') : faixa;
        cat.classList.add(classe);
        tip.textContent = texto;
        document.getElementById('dietAge').value = idade;
        // Preenche nutrição se ainda vazio (ajuda o plano a usar os mesmos dados)
        const idadeCal = document.getElementById('idadeCal');
        const pesoCal = document.getElementById('pesoCal');
        const alturaCal = document.getElementById('alturaCal');
        if (idadeCal && !idadeCal.value) idadeCal.value = idade;
        if (pesoCal && !pesoCal.value) pesoCal.value = peso;
        if (alturaCal && !alturaCal.value) alturaCal.value = alturaCm;
      });

      // Calorias estimadas (salva para o plano alimentar)
      let sex = 'f';
      let lastEnergy = null; // { tmb, tdee, atividade, sex, idade, peso, altura }
      document.getElementById('btnF').onclick = () => { sex = 'f'; document.getElementById('btnF').classList.add('active'); document.getElementById('btnM').classList.remove('active') };
      document.getElementById('btnM').onclick = () => { sex = 'm'; document.getElementById('btnM').classList.add('active'); document.getElementById('btnF').classList.remove('active') };
      document.getElementById('calForm').addEventListener('submit', e => {
        e.preventDefault();
        const idade = +document.getElementById('idadeCal').value;
        const peso = +document.getElementById('pesoCal').value;
        const altura = +document.getElementById('alturaCal').value;
        const atividade = +document.getElementById('atividade').value;
        if (!idade || !peso || !altura) return;
        const tmb = sex === 'm' ? 10 * peso + 6.25 * altura - 5 * idade + 5 : 10 * peso + 6.25 * altura - 5 * idade - 161;
        const total = tmb * atividade;
        lastEnergy = { tmb: Math.round(tmb), tdee: Math.round(total), atividade, sex, idade, peso, altura };
        document.getElementById('calBig').textContent = Math.round(total).toLocaleString('pt-BR') + ' kcal/dia';
        document.getElementById('calSmall').textContent = 'Estimativa pela fórmula de Mifflin-St Jeor. Não é uma meta alimentar.';
        document.getElementById('calResult').classList.add('show');
      });

      // Prefill nutrição a partir do IMC (quando o usuário calcular)
      function syncFormsFromProfile() {
        if (!lastProfile) return;
        const { peso, alturaCm, idade } = lastProfile;
        const idadeCal = document.getElementById('idadeCal');
        const pesoCal = document.getElementById('pesoCal');
        const alturaCal = document.getElementById('alturaCal');
        if (idadeCal && !idadeCal.value) idadeCal.value = idade;
        if (pesoCal && !pesoCal.value) pesoCal.value = peso;
        if (alturaCal && !alturaCal.value) alturaCal.value = alturaCm;
        const dietAge = document.getElementById('dietAge');
        if (dietAge) dietAge.value = idade;
      }


      // Resumo do dia — junta água, hábitos, refeições e IMC
      function renderSummary() {
        const g = document.getElementById('dayGrid');
        if (!g) return;
        try {
          const now = new Date();
          const label = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
          document.getElementById('dayTitle').textContent = label.charAt(0).toUpperCase() + label.slice(1);
          const wp = Math.min(100, Math.round(wMl / wGoal * 100));
          const total = habits.length, done = habits.filter(h => h.done).length;
          const hp = total ? Math.round(done / total * 100) : null;
          const score = hp === null ? wp : Math.round((wp + hp) / 2);
          document.getElementById('dayScore').textContent = score + '%';
          document.getElementById('dayScoreBar').style.width = score + '%';
          const card = (cls, title, big, bar, body, link, cta) =>
            '<article class="card day-card ' + cls + '"><h3>' + title + '</h3><div class="day-big">' + big + '</div>' +
            (bar === null ? '' : '<div class="day-bar"><i style="width:' + bar + '%"></i></div>') +
            body + '<a class="day-link" href="#' + link + '">' + cta + '</a></article>';

          const water = card('water', 'Água', wMl + ' <small>/ ' + wGoal + ' ml</small>', wp,
            '<p>' + (wMl >= wGoal ? 'Meta batida. Ótimo trabalho.' : 'Faltam ' + (wGoal - wMl) + ' ml, cerca de ' + Math.ceil((wGoal - wMl) / wGlass) + ' copos.') + '</p>', 'nutricao', 'Registrar água');
          const hab = card('habits', 'Hábitos', done + ' <small>de ' + total + ' hoje</small>', hp === null ? 0 : hp,
            '<p>' + (streak > 0 ? streak + (streak === 1 ? ' dia' : ' dias') + ' seguidos.' : 'Sua sequência começa ao concluir o dia.') + '</p>', 'habitos', 'Marcar hábitos');

          const idx = (now.getDay() + 6) % 7;
          const meals = lastDietState && lastDietState.week && lastDietState.week[idx];
          const mealCard = meals
            ? card('meals wide', 'Refeições de hoje', meals.length + ' <small>refeições planejadas</small>', null,
                '<ul class="day-list">' + meals.map(m => '<li><b>' + m.name + '</b> ' + m.desc + '</li>').join('') + '</ul>', 'dieta', 'Ver a semana toda')
            : card('meals wide', 'Refeições de hoje', 'Ainda sem plano', null, '<p>Monte sua semana de refeições e o cardápio de hoje aparece aqui.</p>', 'dieta', 'Criar minha semana');

          let imcCard;
          if (lastProfile) {
            const v = lastProfile.imc;
            imcCard = card('imc', 'IMC de referência', v.toFixed(1).replace('.', ',') + ' <small>kg/m²</small>', null,
              '<p>' + (v < 18.5 ? 'Abaixo da referência' : v < 25 ? 'Faixa de referência' : v < 30 ? 'Acima da referência' : 'Bem acima da referência') + '. É só um ponto de partida.</p>', 'imc', 'Refazer o cálculo');
          } else {
            imcCard = card('imc', 'IMC de referência', '--', null, '<p>Calcule para personalizar água e refeições.</p>', 'imc', 'Calcular IMC');
          }
          g.innerHTML = water + hab + imcCard + mealCard;
        } catch (_) { /* estados ainda não inicializados no primeiro carregamento */ }
      }

      // Hidratação — meta e copo personalizáveis (ml)
      const water = document.getElementById('waterGlasses');
      const $w = id => document.getElementById(id);
      let wGoal = 2000, wGlass = 250, wMl = 0, filled = 0, WATER_GOAL = 8;
      try {
        const d = JSON.parse(localStorage.getItem('health-water') || '{}');
        if (d.goal >= 500) wGoal = d.goal;
        if (d.glass > 0) wGlass = d.glass;
        if (d.date === new Date().toDateString()) wMl = d.ml >= 0 ? d.ml : (d.filled || 0) * 250;
      } catch (_) {}
      function saveWater() {
        try { localStorage.setItem('health-water', JSON.stringify({ date: new Date().toDateString(), ml: wMl, goal: wGoal, glass: wGlass })); } catch (_) {}
      }
      function buildGlasses() {
        WATER_GOAL = Math.min(20, Math.max(1, Math.ceil(wGoal / wGlass)));
        water.innerHTML = '';
        const P = 'M8 6h24l-2.2 34.5a4 4 0 0 1-4 3.5H14.2a4 4 0 0 1-4-3.5L8 6z';
        for (let i = 0; i < WATER_GOAL; i++) {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'glass'; b.dataset.i = i;
          b.setAttribute('aria-label', 'Copo ' + (i + 1) + ' de ' + WATER_GOAL);
          b.setAttribute('aria-pressed', 'false');
          b.innerHTML = '<span class="glass-cup" aria-hidden="true"><svg viewBox="0 0 40 48"><defs><clipPath id="cupClip' + i + '"><path d="' + P + '"/></clipPath></defs>' +
            '<path class="liquid" d="' + P + '" clip-path="url(#cupClip' + i + ')"/><path class="cup-outline" d="' + P + '"/>' +
            '<path class="cup-outline" d="M10 6V4.5A1.5 1.5 0 0 1 11.5 3h17A1.5 1.5 0 0 1 30 4.5V6"/><ellipse class="cup-shine" cx="16" cy="22" rx="3" ry="8"/></svg></span>' +
            '<span class="glass-num">' + (i + 1) + '</span>';
          water.appendChild(b);
        }
      }
      const ringCirc = 2 * Math.PI * 30;
      function renderWater(animateIndex) {
        const pct = Math.min(100, Math.round((wMl / wGoal) * 100));
        filled = Math.min(WATER_GOAL, Math.floor(wMl / wGlass + 0.001));
        water.querySelectorAll('.glass').forEach((g, i) => {
          const was = g.classList.contains('filled'), now = i < filled;
          g.classList.toggle('filled', now);
          g.setAttribute('aria-pressed', now ? 'true' : 'false');
          if (now && !was && animateIndex === i) { g.classList.remove('just-filled'); void g.offsetWidth; g.classList.add('just-filled'); setTimeout(() => g.classList.remove('just-filled'), 600); }
        });
        const big = $w('waterBig');
        big.innerHTML = wMl + ' <span>/ ' + wGoal + ' ml</span>';
        big.classList.remove('pop'); void big.offsetWidth; big.classList.add('pop');
        $w('waterSub').textContent = filled + ' de ' + WATER_GOAL + ' copos de ' + wGlass + ' ml' + (wMl > wGoal ? ' · +' + (wMl - wGoal) + ' ml acima da meta' : '');
        $w('waterLead').textContent = 'Toque nos copos para registrar. Cada um ≈ ' + wGlass + ' ml.';
        $w('waterRingFill').style.strokeDasharray = String(ringCirc);
        $w('waterRingFill').style.strokeDashoffset = String(ringCirc * (1 - pct / 100));
        $w('waterRingLabel').textContent = pct + '%';
        $w('waterRing').classList.toggle('complete', pct >= 100);
        $w('waterProgressFill').style.width = pct + '%';
        $w('waterProgressWave').style.width = pct + '%';
        $w('waterProgressWave').classList.toggle('active', wMl > 0 && pct < 100);
        $w('waterGoalMsg').hidden = pct < 100;
        $w('waterGoalMsg').textContent = 'Meta de ' + wGoal + ' ml atingida. Ótimo trabalho! 💧';
        $w('waterMinus').disabled = wMl <= 0;
        $w('waterPlus').disabled = wMl >= 10000;
        $w('waterGoalInput').value = wGoal;
        $w('waterGlassSize').value = String(wGlass);
        saveWater();
        renderSummary();
      }
      function setMl(n, idx) { const prev = wMl; wMl = Math.max(0, Math.min(10000, Math.round(n))); renderWater(idx != null ? idx : (wMl > prev ? Math.floor(wMl / wGlass) - 1 : null)); }
      function applyWaterConfig() {
        wGoal = Math.max(500, Math.min(8000, Math.round((+$w('waterGoalInput').value || wGoal) / 50) * 50));
        wGlass = +$w('waterGlassSize').value || 250;
        buildGlasses(); renderWater();
      }
      water.onclick = e => {
        const b = e.target.closest('.glass'); if (!b) return;
        const i = +b.dataset.i;
        i + 1 === filled ? setMl(i * wGlass) : setMl((i + 1) * wGlass, i);
      };
      $w('waterPlus').addEventListener('click', () => setMl(wMl + wGlass));
      $w('waterMinus').addEventListener('click', () => setMl(wMl - wGlass));
      $w('waterReset').addEventListener('click', () => setMl(0));
      $w('waterGoalInput').addEventListener('change', applyWaterConfig);
      $w('waterGlassSize').addEventListener('change', applyWaterConfig);
      $w('waterCustomAdd').addEventListener('click', () => {
        const v = +$w('waterCustom').value; if (!(v > 0)) return;
        setMl(wMl + v); $w('waterCustom').value = '';
      });
      $w('waterSuggest').addEventListener('click', () => {
        const kg = (lastProfile && lastProfile.peso) || parseFloat(($w('pesoCal').value || '').replace(',', '.'));
        if (!kg) { $w('waterHint').textContent = 'Calcule o IMC ou preencha o peso na estimativa de gasto para sugerirmos uma meta.'; return; }
        const goal = Math.max(1500, Math.min(5000, Math.round(kg * 35 / 50) * 50));
        $w('waterGoalInput').value = goal; applyWaterConfig();
        $w('waterHint').textContent = '35 ml × ' + kg + ' kg ≈ ' + goal + ' ml. Em dias quentes ou de treino, costuma valer beber um pouco mais.';
      });
      buildGlasses(); renderWater();

      // Alimentos — base local de mercados brasileiros + busca offline
      // Valores médios por 100 g (salvo indicação). Uso educativo.
      const FOOD_DB = [
        // Cereais e grãos
        { name: 'Arroz branco cozido', cat: 'cereais', icon: '🍚', kcal: 128, prot: 2.5, carb: 28.1, fat: 0.3, fiber: 1.1, sod: 1, tags: ['carboidrato', 'prato básico'], tip: 'Base do prato brasileiro. Combine com feijão e vegetais.' },
        { name: 'Arroz integral cozido', cat: 'cereais', icon: '🌾', kcal: 124, prot: 2.6, carb: 25.8, fat: 1.0, fiber: 2.7, sod: 1, tags: ['fibras', 'integral'], tip: 'Mais fibras que o branco; demora um pouco mais para cozinhar.' },
        { name: 'Aveia em flocos', cat: 'cereais', icon: '🥣', kcal: 394, prot: 13.9, carb: 66.6, fat: 8.5, fiber: 9.1, sod: 5, tags: ['fibras', 'café da manhã'], tip: 'Ótima no café da manhã com fruta ou iogurte.' },
        { name: 'Cuscuz de milho', cat: 'cereais', icon: '🌽', kcal: 112, prot: 2.2, carb: 25.0, fat: 0.4, fiber: 2.0, sod: 200, tags: ['nordeste', 'prático'], tip: 'Versão comum do dia a dia; sódio varia com o tempero.' },
        { name: 'Tapioca (goma hidratada)', cat: 'cereais', icon: '⚪', kcal: 160, prot: 0.2, carb: 40.0, fat: 0.1, fiber: 0.5, sod: 5, tags: ['sem glúten', 'lanche'], tip: 'Baixa em proteína; combine com ovo, queijo ou pasta de amendoim.' },
        { name: 'Pão francês', cat: 'cereais', icon: '🥖', kcal: 300, prot: 8.0, carb: 58.6, fat: 3.1, fiber: 2.3, sod: 640, tags: ['padaria', 'café'], tip: 'Um pão (~50 g) traz cerca de 150 kcal. Sódio alto.' },
        { name: 'Pão de forma integral', cat: 'cereais', icon: '🍞', kcal: 253, prot: 9.5, carb: 43.0, fat: 4.0, fiber: 6.0, sod: 450, tags: ['integral', 'fibras'], tip: 'Mais fibras que o pão branco; confira o rótulo do sódio.' },
        { name: 'Macarrão cozido', cat: 'cereais', icon: '🍝', kcal: 131, prot: 5.0, carb: 25.0, fat: 1.1, fiber: 1.5, sod: 1, tags: ['carboidrato'], tip: 'Valores do cozido sem molho; molho e queijo mudam bastante o prato.' },
        { name: 'Milho verde em conserva', cat: 'cereais', icon: '🌽', kcal: 98, prot: 3.2, carb: 17.1, fat: 1.2, fiber: 2.2, sod: 240, tags: ['conserva'], tip: 'Escorra bem para reduzir sódio.' },
        { name: 'Quinoa cozida', cat: 'cereais', icon: '🌿', kcal: 120, prot: 4.4, carb: 21.3, fat: 1.9, fiber: 2.8, sod: 7, tags: ['proteína vegetal', 'sem glúten'], tip: 'Boa fonte de proteína entre os grãos.' },
        // Leguminosas
        { name: 'Feijão carioca cozido', cat: 'leguminosas', icon: '🫘', kcal: 76, prot: 4.8, carb: 13.6, fat: 0.5, fiber: 8.5, sod: 2, tags: ['proteína vegetal', 'fibras'], tip: 'Clássico com arroz. Temperos e óleo mudam as calorias.' },
        { name: 'Feijão preto cozido', cat: 'leguminosas', icon: '🫘', kcal: 77, prot: 4.5, carb: 14.0, fat: 0.5, fiber: 8.4, sod: 2, tags: ['proteína vegetal', 'fibras'], tip: 'Muito usado em feijoada e no dia a dia.' },
        { name: 'Lentilha cozida', cat: 'leguminosas', icon: '🫘', kcal: 93, prot: 6.3, carb: 16.3, fat: 0.4, fiber: 7.9, sod: 2, tags: ['proteína vegetal', 'ferro'], tip: 'Cozinha mais rápido que o feijão.' },
        { name: 'Grão-de-bico cozido', cat: 'leguminosas', icon: '🟡', kcal: 164, prot: 8.9, carb: 27.4, fat: 2.6, fiber: 7.6, sod: 7, tags: ['proteína vegetal', 'húmus'], tip: 'Base do húmus e saladas.' },
        { name: 'Ervilha cozida', cat: 'leguminosas', icon: '🟢', kcal: 118, prot: 8.3, carb: 21.1, fat: 0.4, fiber: 8.3, sod: 3, tags: ['fibras'], tip: 'Fresca ou de lata (escorra a conserva).' },
        { name: 'Soja cozida', cat: 'leguminosas', icon: '🌱', kcal: 141, prot: 12.4, carb: 9.9, fat: 7.3, fiber: 6.0, sod: 1, tags: ['proteína vegetal'], tip: 'Alta em proteína e gordura vegetal.' },
        // Carnes e ovos
        { name: 'Peito de frango grelhado', cat: 'proteinas', icon: '🍗', kcal: 159, prot: 32.0, carb: 0, fat: 3.2, fiber: 0, sod: 60, tags: ['proteína', 'magra'], tip: 'Referência magra; tempero e óleo alteram o valor.' },
        { name: 'Coxa de frango assada', cat: 'proteinas', icon: '🍗', kcal: 215, prot: 25.0, carb: 0, fat: 12.0, fiber: 0, sod: 80, tags: ['proteína'], tip: 'Mais gordura que o peito por causa da pele e do corte.' },
        { name: 'Carne bovina magra grelhada', cat: 'proteinas', icon: '🥩', kcal: 220, prot: 32.0, carb: 0, fat: 10.0, fiber: 0, sod: 60, tags: ['proteína', 'ferro'], tip: 'Corte magro (pata, alcatra); ponto e gordura visível mudam.' },
        { name: 'Carne moída cozida (magra)', cat: 'proteinas', icon: '🥩', kcal: 210, prot: 26.0, carb: 0, fat: 12.0, fiber: 0, sod: 70, tags: ['proteína'], tip: 'Prefira com menos gordura aparente.' },
        { name: 'Ovo cozido', cat: 'proteinas', icon: '🥚', kcal: 146, prot: 13.0, carb: 0.6, fat: 9.5, fiber: 0, sod: 140, tags: ['proteína', 'prático'], tip: 'Um ovo médio (~50 g) ≈ 70–80 kcal.' },
        { name: 'Ovo frito', cat: 'proteinas', icon: '🍳', kcal: 196, prot: 13.5, carb: 0.8, fat: 15.0, fiber: 0, sod: 150, tags: ['proteína'], tip: 'O óleo da fritura eleva calorias e gordura.' },
        { name: 'Peixe tilápia grelhada', cat: 'proteinas', icon: '🐟', kcal: 128, prot: 26.0, carb: 0, fat: 2.7, fiber: 0, sod: 50, tags: ['proteína', 'peixe'], tip: 'Peixe magro comum no Brasil.' },
        { name: 'Sardinha em conserva (óleo escorrido)', cat: 'proteinas', icon: '🐟', kcal: 208, prot: 24.0, carb: 0, fat: 12.0, fiber: 0, sod: 400, tags: ['ômega-3', 'conserva'], tip: 'Escorra o óleo; sódio costuma ser alto.' },
        { name: 'Presunto magro', cat: 'proteinas', icon: '🥓', kcal: 109, prot: 18.0, carb: 1.5, fat: 3.5, fiber: 0, sod: 900, tags: ['embutido', 'sódio'], tip: 'Prático, mas sódio elevado — use com moderação.' },
        { name: 'Linguiça calabresa frita', cat: 'proteinas', icon: '🌭', kcal: 350, prot: 18.0, carb: 1.0, fat: 30.0, fiber: 0, sod: 1100, tags: ['embutido', 'sódio'], tip: 'Rica em gordura e sódio; porção pequena no dia a dia.' },
        // Laticínios
        { name: 'Leite integral', cat: 'laticinios', icon: '🥛', kcal: 61, prot: 3.2, carb: 4.7, fat: 3.3, fiber: 0, sod: 45, tags: ['cálcio'], tip: 'Por 100 ml. Versões desnatadas têm menos gordura.' },
        { name: 'Leite desnatado', cat: 'laticinios', icon: '🥛', kcal: 35, prot: 3.4, carb: 5.0, fat: 0.2, fiber: 0, sod: 45, tags: ['cálcio', 'baixo teor de gordura'], tip: 'Por 100 ml.' },
        { name: 'Iogurte natural integral', cat: 'laticinios', icon: '🥛', kcal: 70, prot: 4.0, carb: 5.5, fat: 3.5, fiber: 0, sod: 50, tags: ['probióticos', 'cálcio'], tip: 'Sem açúcar adicionado; combine com fruta.' },
        { name: 'Iogurte grego natural', cat: 'laticinios', icon: '🥛', kcal: 97, prot: 9.0, carb: 3.6, fat: 5.0, fiber: 0, sod: 40, tags: ['proteína', 'cálcio'], tip: 'Mais proteína que o iogurte comum.' },
        { name: 'Queijo minas frescal', cat: 'laticinios', icon: '🧀', kcal: 264, prot: 17.4, carb: 3.2, fat: 20.0, fiber: 0, sod: 30, tags: ['cálcio', 'brasileiro'], tip: 'Variedade típica; umidade e marca alteram o valor.' },
        { name: 'Queijo mussarela', cat: 'laticinios', icon: '🧀', kcal: 330, prot: 25.0, carb: 2.2, fat: 25.0, fiber: 0, sod: 550, tags: ['cálcio', 'sódio'], tip: 'Sódio alto; fatia fina já pesa nas calorias.' },
        { name: 'Requeijão cremoso', cat: 'laticinios', icon: '🧀', kcal: 260, prot: 8.0, carb: 4.0, fat: 24.0, fiber: 0, sod: 450, tags: ['gordura', 'lanche'], tip: 'Colher (~20 g) ≈ 50 kcal — fácil exagerar na colherada.' },
        { name: 'Manteiga', cat: 'laticinios', icon: '🧈', kcal: 717, prot: 0.5, carb: 0.1, fat: 81.0, fiber: 0, sod: 10, tags: ['gordura'], tip: 'Uma colher de chá (~5 g) ≈ 35 kcal.' },
        // Frutas
        { name: 'Banana prata', cat: 'frutas', icon: '🍌', kcal: 98, prot: 1.3, carb: 26.0, fat: 0.1, fiber: 2.0, sod: 0, tags: ['potássio', 'energia'], tip: 'Uma unidade média (~100 g polpa) ≈ 100 kcal.' },
        { name: 'Maçã com casca', cat: 'frutas', icon: '🍎', kcal: 56, prot: 0.3, carb: 15.0, fat: 0.2, fiber: 2.4, sod: 0, tags: ['fibras', 'lanche'], tip: 'Casca aumenta as fibras.' },
        { name: 'Laranja pera', cat: 'frutas', icon: '🍊', kcal: 46, prot: 1.0, carb: 11.5, fat: 0.1, fiber: 2.0, sod: 0, tags: ['vitamina C'], tip: 'Suco perde fibra; fruta inteira sacía mais.' },
        { name: 'Mamão papaia', cat: 'frutas', icon: '🟠', kcal: 40, prot: 0.5, carb: 10.0, fat: 0.1, fiber: 1.5, sod: 2, tags: ['digestão', 'vitamina A'], tip: 'Comum no café da manhã brasileiro.' },
        { name: 'Manga', cat: 'frutas', icon: '🥭', kcal: 64, prot: 0.5, carb: 16.7, fat: 0.3, fiber: 1.6, sod: 1, tags: ['vitamina A', 'doce'], tip: 'Polpa madura; porção generosa sobe rápido nas calorias.' },
        { name: 'Abacate', cat: 'frutas', icon: '🥑', kcal: 120, prot: 1.2, carb: 6.0, fat: 10.0, fiber: 6.0, tags: ['gorduras boas', 'fibras'], tip: 'Rico em gordura insaturada; meia unidade já é porção generosa.' },
        { name: 'Morango', cat: 'frutas', icon: '🍓', kcal: 30, prot: 0.8, carb: 7.0, fat: 0.3, fiber: 1.7, sod: 1, tags: ['vitamina C', 'baixo calórico'], tip: 'Leve e versátil em lanches e sobremesas.' },
        { name: 'Uva', cat: 'frutas', icon: '🍇', kcal: 67, prot: 0.6, carb: 17.0, fat: 0.2, fiber: 0.9, sod: 1, tags: ['açúcar natural'], tip: 'Cacho pequeno; fácil comer além da fome.' },
        { name: 'Melancia', cat: 'frutas', icon: '🍉', kcal: 30, prot: 0.6, carb: 7.5, fat: 0.1, fiber: 0.4, sod: 1, tags: ['hidratação'], tip: 'Muita água; refrescante no calor.' },
        { name: 'Abacaxi', cat: 'frutas', icon: '🍍', kcal: 48, prot: 0.5, carb: 12.0, fat: 0.1, fiber: 1.2, sod: 1, tags: ['vitamina C'], tip: 'Enzimas naturais; ótimo em sobremesa.' },
        { name: 'Goiaba', cat: 'frutas', icon: '🟢', kcal: 54, prot: 1.1, carb: 13.0, fat: 0.5, fiber: 5.0, sod: 1, tags: ['vitamina C', 'fibras'], tip: 'Casca e sementes aumentam as fibras.' },
        { name: 'Açaí polpa (sem açúcar)', cat: 'frutas', icon: '🫐', kcal: 58, prot: 0.8, carb: 6.0, fat: 3.9, fiber: 2.6, sod: 5, tags: ['antioxidantes', 'amazônia'], tip: 'Tigelas de lanchonete costumam ter muito açúcar e granola.' },
        // Vegetais
        { name: 'Alface crespa', cat: 'vegetais', icon: '🥬', kcal: 11, prot: 1.3, carb: 1.5, fat: 0.2, fiber: 1.5, sod: 5, tags: ['folhas', 'baixo calórico'], tip: 'Volume no prato com poucas calorias.' },
        { name: 'Tomate', cat: 'vegetais', icon: '🍅', kcal: 19, prot: 1.1, carb: 3.9, fat: 0.2, fiber: 1.2, sod: 3, tags: ['licopeno', 'salada'], tip: 'Base de saladas e molhos caseiros.' },
        { name: 'Cenoura crua', cat: 'vegetais', icon: '🥕', kcal: 34, prot: 0.9, carb: 7.7, fat: 0.2, fiber: 3.2, sod: 40, tags: ['vitamina A', 'fibras'], tip: 'Ótima crua em palitos ou ralada.' },
        { name: 'Brócolis cozido', cat: 'vegetais', icon: '🥦', kcal: 25, prot: 2.1, carb: 4.0, fat: 0.3, fiber: 2.5, sod: 10, tags: ['fibras', 'vitamina C'], tip: 'No vapor preserva melhor nutrientes.' },
        { name: 'Abobrinha cozida', cat: 'vegetais', icon: '🥒', kcal: 15, prot: 1.1, carb: 2.7, fat: 0.2, fiber: 1.2, sod: 2, tags: ['baixo calórico'], tip: 'Versátil em refogados e gratinados.' },
        { name: 'Batata cozida', cat: 'vegetais', icon: '🥔', kcal: 77, prot: 1.8, carb: 18.0, fat: 0.1, fiber: 1.5, sod: 3, tags: ['carboidrato'], tip: 'Sem pele e sem fritura; fritura multiplica as calorias.' },
        { name: 'Batata-doce cozida', cat: 'vegetais', icon: '🍠', kcal: 77, prot: 1.3, carb: 18.4, fat: 0.1, fiber: 2.2, sod: 10, tags: ['carboidrato', 'fibras'], tip: 'Índice glicêmico um pouco mais amigável que a batata inglesa.' },
        { name: 'Mandioca cozida', cat: 'vegetais', icon: '🌿', kcal: 125, prot: 0.6, carb: 30.0, fat: 0.3, fiber: 1.6, sod: 1, tags: ['carboidrato', 'brasileiro'], tip: 'Muito energética; porção moderada no prato.' },
        { name: 'Cebola', cat: 'vegetais', icon: '🧅', kcal: 39, prot: 1.1, carb: 8.9, fat: 0.1, fiber: 1.7, sod: 3, tags: ['tempero'], tip: 'Base de refogados brasileiros.' },
        { name: 'Alho', cat: 'vegetais', icon: '🧄', kcal: 113, prot: 6.0, carb: 24.0, fat: 0.5, fiber: 1.5, sod: 5, tags: ['tempero'], tip: 'Usado em pequenas quantidades; aroma e sabor intensos.' },
        // Oleaginosas e sementes
        { name: 'Amendoim torrado', cat: 'oleaginosas', icon: '🥜', kcal: 589, prot: 22.5, carb: 18.7, fat: 49.0, fiber: 7.5, sod: 5, tags: ['proteína', 'gorduras'], tip: 'Uma colher de sopa (~15 g) ≈ 90 kcal. Porção pequena.' },
        { name: 'Castanha-do-pará', cat: 'oleaginosas', icon: '🌰', kcal: 643, prot: 14.5, carb: 15.0, fat: 63.5, fiber: 7.9, sod: 2, tags: ['selênio', 'amazônia'], tip: '1–2 unidades/dia costumam bastar (selênio concentrado).' },
        { name: 'Castanha de caju', cat: 'oleaginosas', icon: '🌰', kcal: 570, prot: 15.0, carb: 29.0, fat: 46.0, fiber: 3.0, sod: 10, tags: ['nordeste', 'gorduras'], tip: 'Versão salgada sobe o sódio.' },
        { name: 'Nozes', cat: 'oleaginosas', icon: '🌰', kcal: 650, prot: 14.0, carb: 13.0, fat: 64.0, fiber: 6.5, sod: 2, tags: ['ômega-3'], tip: 'Pequena porção (3–4 unidades) já é lanche completo.' },
        { name: 'Semente de chia', cat: 'oleaginosas', icon: '⚫', kcal: 486, prot: 17.0, carb: 42.0, fat: 31.0, fiber: 34.0, sod: 16, tags: ['fibras', 'ômega-3'], tip: '1 colher de sopa no iogurte ou vitamina.' },
        { name: 'Semente de linhaça', cat: 'oleaginosas', icon: '🟤', kcal: 495, prot: 20.0, carb: 29.0, fat: 34.0, fiber: 27.0, sod: 30, tags: ['fibras', 'ômega-3'], tip: 'Moída absorve melhor; guarde na geladeira.' },
        // Óleos e gorduras
        { name: 'Azeite de oliva', cat: 'oleos', icon: '🫒', kcal: 884, prot: 0, carb: 0, fat: 100, fiber: 0, sod: 0, tags: ['gorduras boas'], tip: '1 colher de sopa (~13 ml) ≈ 115 kcal. Use para temperar.' },
        { name: 'Óleo de soja', cat: 'oleos', icon: '🧴', kcal: 884, prot: 0, carb: 0, fat: 100, fiber: 0, sod: 0, tags: ['cozinha'], tip: 'Comum em frituras; também denso em calorias.' },
        // Bebidas e outros
        { name: 'Café pronto (sem açúcar)', cat: 'bebidas', icon: '☕', kcal: 2, prot: 0.1, carb: 0.3, fat: 0, fiber: 0, sod: 2, tags: ['bebida'], tip: 'Calorias vêm do açúcar e do leite que você adiciona.' },
        { name: 'Suco de laranja natural', cat: 'bebidas', icon: '🧃', kcal: 45, prot: 0.7, carb: 10.5, fat: 0.1, fiber: 0.2, sod: 1, tags: ['vitamina C'], tip: 'Por 100 ml. Sem fibra da fruta inteira.' },
        { name: 'Refrigerante cola', cat: 'bebidas', icon: '🥤', kcal: 42, prot: 0, carb: 10.6, fat: 0, fiber: 0, sod: 5, tags: ['açúcar'], tip: 'Lata 350 ml ≈ 150 kcal só de açúcar.' },
        { name: 'Água de coco', cat: 'bebidas', icon: '🥥', kcal: 19, prot: 0.2, carb: 4.5, fat: 0, fiber: 0, sod: 100, tags: ['hidratação', 'eletrólitos'], tip: 'Refrescante; sódio e potássio naturais.' },
        { name: 'Chocolate ao leite', cat: 'doces', icon: '🍫', kcal: 535, prot: 7.0, carb: 59.0, fat: 30.0, fiber: 2.0, sod: 80, tags: ['doce'], tip: 'Uma barra pequena (25 g) ≈ 130 kcal.' },
        { name: 'Açúcar refinado', cat: 'doces', icon: '🧂', kcal: 387, prot: 0, carb: 100, fat: 0, fiber: 0, sod: 0, tags: ['açúcar'], tip: '1 colher de sopa (~15 g) ≈ 60 kcal.' },
        { name: 'Mel', cat: 'doces', icon: '🍯', kcal: 304, prot: 0.3, carb: 82.0, fat: 0, fiber: 0.2, sod: 4, tags: ['doce natural'], tip: 'Ainda é açúcar concentrado; use com moderação.' },
        { name: 'Biscoito cream cracker', cat: 'doces', icon: '🍪', kcal: 432, prot: 10.0, carb: 68.0, fat: 14.0, fiber: 2.5, sod: 700, tags: ['lanche', 'sódio'], tip: 'Pacote unitário varia; sódio costuma ser alto.' },
        // Pratos e preparações comuns
        { name: 'Feijoada (porção média)', cat: 'pratos', icon: '🍲', kcal: 180, prot: 10.0, carb: 12.0, fat: 10.0, fiber: 4.0, sod: 450, tags: ['brasileiro', 'festa'], tip: 'Estimativa por 100 g do prato pronto; varia muito com a receita.' },
        { name: 'Farofa pronta', cat: 'pratos', icon: '🧂', kcal: 380, prot: 3.5, carb: 55.0, fat: 16.0, fiber: 4.0, sod: 500, tags: ['acompanhamento'], tip: 'Farinha de mandioca com gordura e sal — porção pequena.' },
        { name: 'Vinagrete', cat: 'pratos', icon: '🥗', kcal: 40, prot: 0.8, carb: 6.0, fat: 1.5, fiber: 1.2, sod: 200, tags: ['acompanhamento'], tip: 'Tomate, cebola e vinagre; sódio do sal varia.' },
        { name: 'Salada de maionese', cat: 'pratos', icon: '🥗', kcal: 180, prot: 2.5, carb: 14.0, fat: 13.0, fiber: 1.5, sod: 350, tags: ['festa'], tip: 'Maionese eleva gordura e calorias.' },
        { name: 'Hambúrguer caseiro (carne)', cat: 'pratos', icon: '🍔', kcal: 250, prot: 20.0, carb: 2.0, fat: 18.0, fiber: 0, sod: 300, tags: ['proteína'], tip: 'Só o disco de carne (~100 g); pão e molhos somam à parte.' },
        { name: 'Pizza mussarela (fatia)', cat: 'pratos', icon: '🍕', kcal: 270, prot: 11.0, carb: 32.0, fat: 11.0, fiber: 1.5, sod: 550, tags: ['lanche'], tip: 'Estimativa por 100 g de fatia; borda e coberturas mudam.' },
        // Mais itens de mercado
        { name: 'Leite condensado', cat: 'laticinios', icon: '🥛', kcal: 330, prot: 8.0, carb: 56.0, fat: 8.0, fiber: 0, sod: 100, tags: ['doce', 'sobremesa'], tip: 'Muito concentrado em açúcar; colher (~15 g) ≈ 50 kcal.' },
        { name: 'Creme de leite', cat: 'laticinios', icon: '🥛', kcal: 230, prot: 2.0, carb: 3.5, fat: 23.0, fiber: 0, sod: 40, tags: ['gordura', 'receitas'], tip: 'Versões light reduzem gordura.' },
        { name: 'Margarina cremosa', cat: 'oleos', icon: '🧈', kcal: 540, prot: 0.2, carb: 0.5, fat: 60.0, fiber: 0, sod: 500, tags: ['gordura', 'sódio'], tip: '1 colher de chá (~5 g) ≈ 27 kcal.' },
        { name: 'Catchup', cat: 'pratos', icon: '🍅', kcal: 100, prot: 1.0, carb: 25.0, fat: 0.1, fiber: 0.5, sod: 900, tags: ['molho', 'sódio'], tip: 'Açúcar e sódio altos em porções generosas.' },
        { name: 'Mostarda', cat: 'pratos', icon: '🟡', kcal: 60, prot: 3.5, carb: 5.0, fat: 3.0, fiber: 2.0, sod: 1100, tags: ['molho', 'sódio'], tip: 'Poucas calorias, muito sódio.' },
        { name: 'Maionese', cat: 'oleos', icon: '🥪', kcal: 680, prot: 1.0, carb: 2.0, fat: 75.0, fiber: 0, sod: 600, tags: ['gordura'], tip: '1 colher de sopa (~15 g) ≈ 100 kcal.' },
        { name: 'Tofu firme', cat: 'proteinas', icon: '⬜', kcal: 80, prot: 8.0, carb: 2.0, fat: 4.5, fiber: 0.5, sod: 10, tags: ['proteína vegetal', 'vegano'], tip: 'Absorve temperos; bom substituto em refogados.' },
        { name: 'Atum em conserva (água)', cat: 'proteinas', icon: '🐟', kcal: 100, prot: 22.0, carb: 0, fat: 1.0, fiber: 0, sod: 300, tags: ['proteína', 'prático'], tip: 'Escorra o líquido; versão em óleo tem mais gordura.' },
        { name: 'Patê de frango', cat: 'proteinas', icon: '🥪', kcal: 220, prot: 10.0, carb: 4.0, fat: 18.0, fiber: 0, sod: 700, tags: ['lanche', 'sódio'], tip: 'Prático no pão; confira sódio no rótulo.' },
        { name: 'Iogurte de frutas (açúcar)', cat: 'laticinios', icon: '🥛', kcal: 95, prot: 3.0, carb: 15.0, fat: 2.5, fiber: 0, sod: 45, tags: ['açúcar'], tip: 'Muitos têm açúcar adicionado; natural + fruta é alternativa.' },
        { name: 'Granola', cat: 'cereais', icon: '🥣', kcal: 450, prot: 10.0, carb: 60.0, fat: 18.0, fiber: 7.0, sod: 20, tags: ['café da manhã', 'fibras'], tip: 'Calórica por causa de mel/açúcar e oleaginosas; porção de 30 g.' },
        { name: 'Whey protein (concentrado)', cat: 'proteinas', icon: '💪', kcal: 380, prot: 75.0, carb: 8.0, fat: 5.0, fiber: 0, sod: 200, tags: ['suplemento', 'proteína'], tip: 'Por 100 g de pó; dose típica 30 g ≈ 110 kcal e 22 g proteína. Não substitui refeição.' },
        { name: 'Aipim frito', cat: 'vegetais', icon: '🍟', kcal: 280, prot: 1.5, carb: 35.0, fat: 14.0, fiber: 1.5, sod: 10, tags: ['fritura'], tip: 'Cozido tem bem menos gordura e calorias.' },
        { name: 'Pastel assado de carne', cat: 'pratos', icon: '🥟', kcal: 280, prot: 10.0, carb: 30.0, fat: 13.0, fiber: 1.5, sod: 450, tags: ['lanche'], tip: 'Estimativa; frito costuma ter mais gordura.' },
        { name: 'Pão de queijo', cat: 'cereais', icon: '🧀', kcal: 350, prot: 8.0, carb: 38.0, fat: 18.0, fiber: 0.5, sod: 500, tags: ['mineiro', 'lanche'], tip: 'Um pão de queijo médio (~40 g) ≈ 140 kcal.' },
        { name: 'Beiju de tapioca com coco', cat: 'cereais', icon: '⚪', kcal: 220, prot: 1.0, carb: 40.0, fat: 6.0, fiber: 1.0, sod: 20, tags: ['nordeste', 'lanche'], tip: 'Coco e açúcar elevam as calorias.' },
        { name: 'Couve refogada', cat: 'vegetais', icon: '🥬', kcal: 50, prot: 2.5, carb: 5.0, fat: 2.5, fiber: 2.5, sod: 150, tags: ['folhas', 'ferro'], tip: 'Com alho e pouco óleo; clássico com feijoada.' },
        { name: 'Quiabo cozido', cat: 'vegetais', icon: '🟢', kcal: 22, prot: 1.5, carb: 4.5, fat: 0.2, fiber: 2.5, sod: 5, tags: ['fibras'], tip: 'Comum em pratos mineiros e nordestinos.' },
        { name: 'Jiló cozido', cat: 'vegetais', icon: '🟢', kcal: 30, prot: 1.4, carb: 6.5, fat: 0.2, fiber: 2.5, sod: 2, tags: ['amargo', 'fibras'], tip: 'Sabor característico da culinária brasileira.' },
        { name: 'Chuchu cozido', cat: 'vegetais', icon: '🟢', kcal: 19, prot: 0.7, carb: 4.0, fat: 0.1, fiber: 1.7, sod: 3, tags: ['baixo calórico'], tip: 'Muito leve; bom para volume no prato.' },
        { name: 'Berinjela cozida', cat: 'vegetais', icon: '🟣', kcal: 25, prot: 1.0, carb: 5.5, fat: 0.2, fiber: 2.5, sod: 2, tags: ['fibras'], tip: 'Grelhada ou em molhos absorve azeite com facilidade.' },
        { name: 'Pepino', cat: 'vegetais', icon: '🥒', kcal: 12, prot: 0.6, carb: 2.2, fat: 0.1, fiber: 0.7, sod: 2, tags: ['hidratação', 'salada'], tip: 'Quase só água — refrescante.' },
        { name: 'Pimentão', cat: 'vegetais', icon: '🫑', kcal: 25, prot: 1.0, carb: 5.5, fat: 0.2, fiber: 1.8, sod: 2, tags: ['vitamina C'], tip: 'Cores diferentes, nutrientes parecidos.' },
        { name: 'Limão', cat: 'frutas', icon: '🍋', kcal: 30, prot: 1.0, carb: 9.0, fat: 0.2, fiber: 2.5, sod: 1, tags: ['vitamina C', 'tempero'], tip: 'Usado em temperos e sucos; poucas calorias na prática.' },
        { name: 'Maracujá', cat: 'frutas', icon: '🟣', kcal: 68, prot: 2.0, carb: 12.0, fat: 0.7, fiber: 10.0, tags: ['fibras', 'suco'], tip: 'Polpa com sementes é rica em fibra.' },
        { name: 'Caju (fruta)', cat: 'frutas', icon: '🟧', kcal: 43, prot: 1.0, carb: 10.0, fat: 0.3, fiber: 1.7, sod: 2, tags: ['nordeste', 'vitamina C'], tip: 'A castanha é outro alimento (bem mais calórica).' },
        { name: 'Coco fresco (polpa)', cat: 'frutas', icon: '🥥', kcal: 350, prot: 3.5, carb: 15.0, fat: 33.0, fiber: 9.0, sod: 15, tags: ['gordura', 'fibras'], tip: 'Polpa é energética; água de coco é outra história.' },
        { name: 'Farinha de trigo', cat: 'cereais', icon: '🌾', kcal: 360, prot: 10.0, carb: 75.0, fat: 1.0, fiber: 2.5, sod: 2, tags: ['ingrediente'], tip: 'Base de pães e bolos; valores da farinha crua.' },
        { name: 'Farinha de mandioca', cat: 'cereais', icon: '🌿', kcal: 360, prot: 1.5, carb: 88.0, fat: 0.3, fiber: 5.0, sod: 5, tags: ['brasileiro'], tip: 'Base da farofa; quase só carboidrato.' },
        { name: 'Fubá de milho', cat: 'cereais', icon: '🌽', kcal: 360, prot: 7.0, carb: 78.0, fat: 2.0, fiber: 4.0, sod: 2, tags: ['bolo', 'polenta'], tip: 'Usado em bolo de fubá e polenta.' },
        { name: 'Amido de milho (maizena)', cat: 'cereais', icon: '⚪', kcal: 350, prot: 0.3, carb: 87.0, fat: 0.1, fiber: 0, sod: 5, tags: ['espessante'], tip: 'Quase só amido; pouca proteína e fibra.' },
        { name: 'Sal refinado', cat: 'temperos', icon: '🧂', kcal: 0, prot: 0, carb: 0, fat: 0, fiber: 0, sod: 40000, tags: ['sódio'], tip: '1 g de sal ≈ 400 mg de sódio. Use com parcimônia.' },
        { name: 'Orégano seco', cat: 'temperos', icon: '🌿', kcal: 265, prot: 9.0, carb: 69.0, fat: 4.0, fiber: 42.0, sod: 15, tags: ['tempero'], tip: 'Usado em pitadas; quase sem impacto calórico na prática.' },
        { name: 'Canela em pó', cat: 'temperos', icon: '🟤', kcal: 247, prot: 4.0, carb: 81.0, fat: 1.2, fiber: 53.0, sod: 10, tags: ['tempero'], tip: 'Aroma no café e na aveia sem açúcar extra.' }
      ];

      const FOOD_CATS = [
        { id: 'todos', label: 'Todos' },
        { id: 'cereais', label: 'Cereais' },
        { id: 'leguminosas', label: 'Leguminosas' },
        { id: 'proteinas', label: 'Proteínas' },
        { id: 'laticinios', label: 'Laticínios' },
        { id: 'frutas', label: 'Frutas' },
        { id: 'vegetais', label: 'Vegetais' },
        { id: 'oleaginosas', label: 'Oleaginosas' },
        { id: 'pratos', label: 'Pratos' },
        { id: 'bebidas', label: 'Bebidas' }
      ];

      // Exemplos estáticos (cards)
      const foods = [
        { name: 'Feijão carioca', icon: '🫘', desc: 'Fonte de proteínas vegetais e fibras. Combina bem com arroz, verduras e outros alimentos da refeição.', tags: ['proteína vegetal', 'fibras'] },
        { name: 'Morango', icon: '🍓', desc: 'Fruta versátil para lanches, café da manhã e sobremesas. Pode ser combinada com iogurte ou aveia.', tags: ['fruta', 'vitaminas'] },
        { name: 'Aveia', icon: '🌾', desc: 'Pode entrar em mingaus, iogurtes e frutas, ajudando a aumentar a presença de fibras na refeição.', tags: ['fibras', 'cereais'] },
        { name: 'Abacate', icon: '🥑', desc: 'Alimento fonte de gorduras insaturadas. Pode ser usado em preparações doces ou salgadas.', tags: ['gorduras', 'fruta'] },
        { name: 'Ovo', icon: '🥚', desc: 'Alimento versátil que fornece proteínas e pode fazer parte de diferentes refeições.', tags: ['proteína', 'prático'] },
        { name: 'Verduras e legumes', icon: '🥦', desc: 'Variar cores e tipos ajuda a ampliar a diversidade de nutrientes da alimentação.', tags: ['variedade', 'fibras'] }
      ];
      const grid = document.getElementById('foodGrid');
      foods.forEach((f, i) => {
        const el = document.createElement('article');
        el.className = 'card food-card';
        el.innerHTML = '<div class="food-icon" style="background:var(--' + (i % 2 ? 'blue-soft' : 'coral-soft') + ')">' + f.icon + '</div><h3>' + f.name + '</h3><p>' + f.desc + '</p><div class="food-meta">' + f.tags.map(t => '<span class="pill">' + t + '</span>').join('') + '</div>';
        el.onclick = () => openFood(f);
        grid.appendChild(el);
      });
      function openFood(f) {
        document.getElementById('modalTitle').textContent = f.name;
        document.getElementById('modalBody').innerHTML = '<p style="color:var(--soft);line-height:1.7">' + f.desc + '</p><div class="diet-tags">' + f.tags.map(t => '<span class="pill">' + t + '</span>').join('') + '</div><div class="disclaimer">As informações são gerais e não representam uma prescrição nutricional.</div>';
        document.getElementById('foodModal').classList.add('open');
      }
      document.getElementById('modalClose').onclick = () => {
        document.getElementById('foodModal').classList.remove('open');
        document.body.style.overflow = '';
      };
      document.getElementById('foodModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'foodModal') {
          document.getElementById('foodModal').classList.remove('open');
          document.body.style.overflow = '';
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const m = document.getElementById('foodModal');
          if (m?.classList.contains('open')) {
            m.classList.remove('open');
            document.body.style.overflow = '';
          }
        }
      });
      document.getElementById('foodModal').onclick = e => { if (e.target.id === 'foodModal') e.currentTarget.classList.remove('open'); };

      // ---------- Busca local (mercados brasileiros) ----------
      const foodSearchInput = document.getElementById('foodSearchInput');
      const foodSearchBtn = document.getElementById('foodSearchBtn');
      const foodSearchStatus = document.getElementById('foodSearchStatus');
      const foodSearchResult = document.getElementById('foodSearchResult');
      const foodCategoryChips = document.getElementById('foodCategoryChips');
      const foodSearchSuggestions = document.getElementById('foodSearchSuggestions');
      const foodResultsHead = document.getElementById('foodResultsHead');
      const foodFilterPanel = document.getElementById('foodFilterPanel');
      const foodFilterOpenBtn = document.getElementById('foodFilterOpenBtn');
      const foodBackBtn = document.getElementById('foodBackBtn');
      let activeFoodCat = 'todos';
      let activeFoodRestrict = new Set(); // restrições ativas na busca
      let lastFoodList = [];
      let lastFoodListTitle = '';

      const FOOD_RESTRICTS = [
        { id: 'lactose', label: 'Sem lactose', test: (f) => {
          const n = (f.name + ' ' + (f.cat || '')).toLowerCase();
          return f.cat === 'laticinios' || /leite|queijo|iogurte|requeij|manteiga|creme de leite|leite condensado/.test(n);
        }},
        { id: 'gluten', label: 'Sem glúten', test: (f) => {
          const n = f.name.toLowerCase();
          return /p[aã]o|macarr[aã]o|cuscuz|cream cracker|biscoito|farinha de trigo/.test(n);
        }},
        { id: 'ovo', label: 'Sem ovo', test: (f) => /ovo/.test(f.name.toLowerCase()) },
        { id: 'oleaginosas', label: 'Sem castanhas', test: (f) => {
          return f.cat === 'oleaginosas' || /castanha|amendoim|nozes|chia|linha[cç]a/.test(f.name.toLowerCase());
        }},
        { id: 'frutosdomar', label: 'Sem frutos do mar', test: (f) => {
          return /peixe|sardinha|atum|til[aá]pia|camarão|frutos do mar/.test(f.name.toLowerCase());
        }},
        { id: 'carne', label: 'Sem carne vermelha', test: (f) => {
          return /carne|bovina|hamb[uú]rguer|alcatra|patinho|feijoada/.test(f.name.toLowerCase());
        }},
        { id: 'frango', label: 'Sem frango', test: (f) => /frango/.test(f.name.toLowerCase()) },
        { id: 'porco', label: 'Sem porco', test: (f) => {
          return /porco|presunto|lingui[cç]a|calabresa/.test(f.name.toLowerCase());
        }},
        { id: 'acucar', label: 'Menos açúcar', test: (f) => {
          return f.cat === 'doces' || /a[cç][uú]car|chocolate|refrigerante|leite condensado|catchup/.test(f.name.toLowerCase());
        }}
      ];

      function foodPassesRestrict(f) {
        for (const id of activeFoodRestrict) {
          const rule = FOOD_RESTRICTS.find(r => r.id === id);
          if (rule && rule.test(f)) return false; // ocultar
        }
        return true;
      }

      function applyFoodFilters(list) {
        return list.filter(foodPassesRestrict);
      }

      // Preenche datalist com nomes
      if (foodSearchSuggestions) {
        FOOD_DB.forEach(f => {
          const opt = document.createElement('option');
          opt.value = f.name;
          foodSearchSuggestions.appendChild(opt);
        });
      }

      // Chips de categoria
      if (foodCategoryChips) {
        FOOD_CATS.forEach(c => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'food-cat-chip' + (c.id === 'todos' ? ' active' : '');
          b.textContent = c.label;
          b.dataset.cat = c.id;
          b.onclick = () => {
            activeFoodCat = c.id;
            foodCategoryChips.querySelectorAll('.food-cat-chip').forEach(x => x.classList.toggle('active', x.dataset.cat === c.id));
            if ((foodSearchInput.value || '').trim()) executarBuscaAlimento();
            else listarCategoria();
          };
          foodCategoryChips.appendChild(b);
        });
      }

      // Chips de restrições alimentares
      const foodRestrictChips = document.getElementById('foodRestrictChips');
      if (foodRestrictChips) {
        FOOD_RESTRICTS.forEach(r => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'food-restrict-chip';
          b.textContent = r.label;
          b.dataset.restrict = r.id;
          b.setAttribute('aria-pressed', 'false');
          b.onclick = () => {
            if (activeFoodRestrict.has(r.id)) {
              activeFoodRestrict.delete(r.id);
              b.classList.remove('active');
              b.setAttribute('aria-pressed', 'false');
            } else {
              activeFoodRestrict.add(r.id);
              b.classList.add('active');
              b.setAttribute('aria-pressed', 'true');
            }
            if ((foodSearchInput.value || '').trim()) executarBuscaAlimento();
            else listarCategoria();
          };
          foodRestrictChips.appendChild(b);
        });
      }

      function setFoodStatus(msg, type) {
        foodSearchStatus.hidden = !msg;
        foodSearchStatus.textContent = msg || '';
        foodSearchStatus.className = 'food-search-status' + (type ? ' ' + type : '');
      }

      function fmtNum(n, digits) {
        if (n == null || isNaN(n)) return '—';
        return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: digits != null ? digits : 1 });
      }

      function normalizeText(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      }

      function scoreFood(item, term) {
        const n = normalizeText(item.name);
        const t = normalizeText(term);
        if (!t) return 1;
        if (n === t) return 100;
        if (n.startsWith(t)) return 80;
        if (n.includes(t)) return 60;
        const tags = (item.tags || []).join(' ');
        if (normalizeText(tags).includes(t)) return 40;
        if (normalizeText(item.cat).includes(t)) return 30;
        // tokens
        const tokens = t.split(/\s+/).filter(Boolean);
        let hit = 0;
        tokens.forEach(tok => { if (n.includes(tok)) hit++; });
        if (hit) return 20 + hit * 5;
        return 0;
      }

      function showFoodBackButton() {
        if (foodBackBtn) foodBackBtn.hidden = false;
      }

      function resetFoodView() {
        foodSearchInput.value = '';
        activeFoodCat = 'todos';
        activeFoodRestrict.clear();
        foodCategoryChips?.querySelectorAll('.food-cat-chip').forEach(x => x.classList.toggle('active', x.dataset.cat === 'todos'));
        foodRestrictChips?.querySelectorAll('.food-restrict-chip').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
        foodSearchResult.hidden = true;
        if (foodResultsHead) foodResultsHead.hidden = true;
        if (foodBackBtn) foodBackBtn.hidden = true;
        setFoodStatus('');
        foodFilterPanel?.classList.remove('is-closed');
        if (foodFilterOpenBtn) foodFilterOpenBtn.hidden = true;
        foodSearchInput.focus();
      }

      function renderNutriLocal(item) {
        foodSearchResult.hidden = false;
        if (foodResultsHead) foodResultsHead.hidden = true;
        const tagsHtml = (item.tags || []).map(t => '<span class="pill">' + t + '</span>').join('');
        foodSearchResult.innerHTML =
          '<button type="button" class="food-detail-back" id="foodDetailBack">← Voltar para a lista de alimentos</button>' +
          '<div class="nutri-header">' +
            '<div class="nutri-emoji" aria-hidden="true">' + (item.icon || '🥗') + '</div>' +
            '<div>' +
              '<h4>' + item.name.replace(/</g, '&lt;') + '</h4>' +
              '<div class="nutri-meta">Categoria: ' + (item.cat || 'geral') + ' · valores médios por 100 g</div>' +
              '<div class="diet-tags" style="margin-top:8px">' + tagsHtml + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="nutri-macros">' +
            '<div class="nutri-macro kcal"><span class="val">' + fmtNum(item.kcal, 0) + '</span><span class="lbl">kcal</span></div>' +
            '<div class="nutri-macro prot"><span class="val">' + fmtNum(item.prot) + ' g</span><span class="lbl">proteínas</span></div>' +
            '<div class="nutri-macro carb"><span class="val">' + fmtNum(item.carb) + ' g</span><span class="lbl">carboidratos</span></div>' +
            '<div class="nutri-macro fat"><span class="val">' + fmtNum(item.fat) + ' g</span><span class="lbl">gorduras</span></div>' +
          '</div>' +
          '<div class="nutri-details">' +
            '<div>Fibras: <strong>' + fmtNum(item.fiber) + ' g</strong></div>' +
            '<div>Sódio: <strong>' + fmtNum(item.sod, 0) + ' mg</strong></div>' +
          '</div>' +
          (item.tip ? '<p class="explain-block" style="margin-top:4px">' + item.tip + '</p>' : '') +
          '<div class="nutri-source">Fonte: valores médios de referência (mercado / tabelas usuais no Brasil). Informação educativa — não substitui rótulo oficial nem orientação profissional.</div>';
        document.getElementById('foodDetailBack')?.addEventListener('click', () => {
          if (lastFoodList.length) renderFoodList(lastFoodList, lastFoodListTitle);
        });
      }

      function renderFoodList(list, title) {
        if (!list.length) {
          foodSearchResult.hidden = true;
          setFoodStatus('Nenhum alimento encontrado. Tente outro termo (ex.: “feijão”, “banana”, “pão”).', 'err');
          return;
        }
        setFoodStatus('');
        foodSearchResult.hidden = false;
        showFoodBackButton();
        lastFoodList = list.slice(0, 12);
        lastFoodListTitle = title || '';
        if (foodResultsHead) foodResultsHead.hidden = false;
        const items = list.slice(0, 12).map(f => {
          return '<button type="button" class="food-hit" data-name="' + f.name.replace(/"/g, '&quot;') + '">' +
            '<span class="food-hit-icon">' + (f.icon || '🥗') + '</span>' +
            '<span class="food-hit-body"><strong>' + f.name.replace(/</g, '&lt;') + '</strong>' +
            '<small>' + fmtNum(f.kcal, 0) + ' kcal · P ' + fmtNum(f.prot) + 'g · C ' + fmtNum(f.carb) + 'g · G ' + fmtNum(f.fat) + 'g</small></span>' +
            '<span class="food-hit-arrow">→</span></button>';
        }).join('');
        foodSearchResult.innerHTML =
          (title ? '<div class="nutri-meta" style="margin-bottom:10px">' + title + ' · ' + list.length + ' item(ns)</div>' : '') +
          '<div class="food-hit-list">' + items + '</div>' +
          '<div class="nutri-source" style="margin-top:12px">Clique em um alimento para ver o detalhe. Valores médios por 100 g.</div>';
        foodSearchResult.querySelectorAll('.food-hit').forEach(btn => {
          btn.onclick = () => {
            const found = FOOD_DB.find(x => x.name === btn.dataset.name);
            if (found) renderNutriLocal(found);
          };
        });
      }

      function listarCategoria() {
        let list = activeFoodCat === 'todos'
          ? FOOD_DB.slice()
          : FOOD_DB.filter(f => f.cat === activeFoodCat);
        list = applyFoodFilters(list).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        const label = FOOD_CATS.find(c => c.id === activeFoodCat)?.label || activeFoodCat;
        const restN = activeFoodRestrict.size;
        const restTxt = restN ? ' · ' + restN + ' restrição(ões)' : '';
        renderFoodList(list, (activeFoodCat === 'todos' ? 'Todos os alimentos' : 'Categoria: ' + label) + restTxt);
      }

      function executarBuscaAlimento() {
        const termo = (foodSearchInput.value || '').trim();
        if (!termo) {
          listarCategoria();
          return;
        }
        let list = FOOD_DB.map(f => ({ f, s: scoreFood(f, termo) }))
          .filter(x => x.s > 0)
          .sort((a, b) => b.s - a.s || a.f.name.localeCompare(b.f.name, 'pt-BR'))
          .map(x => x.f);
        if (activeFoodCat !== 'todos') {
          list = list.filter(f => f.cat === activeFoodCat);
        }
        list = applyFoodFilters(list);
        if (list.length === 1) {
          setFoodStatus('');
          renderNutriLocal(list[0]);
        } else {
          renderFoodList(list, 'Resultados para “' + termo.replace(/</g, '') + '”');
        }
      }

      foodFilterOpenBtn?.addEventListener('click', () => {
        foodFilterPanel?.classList.remove('is-closed');
        foodFilterOpenBtn.hidden = true;
      });
      foodBackBtn?.addEventListener('click', resetFoodView);

      foodSearchBtn?.addEventListener('click', executarBuscaAlimento);
;
      foodSearchInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          executarBuscaAlimento();
        }
      });
      // Lista inicial ao focar vazio
      foodSearchInput?.addEventListener('focus', () => {
        if (!(foodSearchInput.value || '').trim() && foodSearchResult.hidden) {
          // não força lista até o usuário buscar ou clicar categoria
        }
      });

      // Checkbox visual state (restrições)
      document.querySelectorAll('#restrictGrid .chk-option, #equipGrid .chk-option, #limitGrid .chk-option').forEach(opt => {
        const input = opt.querySelector('input');
        input.addEventListener('change', () => opt.classList.toggle('checked', input.checked));
      });

      // Plano alimentar educativo — visual + ícones de alimentos
      let dietSubmitted = false;
      let lastDietState = null; // para trocar refeições individuais

      // Alimentos com imagem (Unsplash) + emoji de fallback
      const FOOD_VISUAL = [
        { re: /arroz/i, e: '🍚', label: 'Arroz', img: 'img/arroz.jpg' },
        { re: /feij[aã]o/i, e: '🫘', label: 'Feijão', img: 'img/feijao.jpg' },
        { re: /lentilha/i, e: '🫘', label: 'Lentilha', img: 'img/lentilha.jpg' },
        { re: /gr[aã]o-?de-?bico|leguminos/i, e: '🫘', label: 'Grão-de-bico', img: 'img/grao-de-bico.jpg' },
        { re: /frango/i, e: '🍗', label: 'Frango', img: 'img/frango.jpg' },
        { re: /carne|bovina/i, e: '🥩', label: 'Carne', img: 'img/carne.jpg' },
        { re: /peixe|sardinha|atum|til[aá]pia/i, e: '🐟', label: 'Peixe', img: 'img/peixe.jpg' },
        { re: /ovo|omelete/i, e: '🥚', label: 'Ovo', img: 'img/ovo.jpg' },
        { re: /\btofu\b/i, e: '⬜', label: 'Tofu', img: 'img/tofu.jpg' },
        { re: /tapioca|cuscuz|beiju/i, e: '⚪', label: 'Tapioca', img: 'img/tapioca.jpg' },
        { re: /queijo|mussarela|minas/i, e: '🧀', label: 'Queijo', img: 'img/queijo.jpg' },
        { re: /iogurte/i, e: '🥛', label: 'Iogurte', img: 'img/iogurte.jpg' },
        { re: /leite|bebida vegetal/i, e: '🥛', label: 'Leite', img: 'img/leite.jpg' },
        { re: /p[aã]o|torrada|sandu[ií]che/i, e: '🍞', label: 'Pão', img: 'img/pao.jpg' },
        { re: /aveia|granola/i, e: '🥣', label: 'Aveia', img: 'img/aveia.jpg' },
        { re: /banana/i, e: '🍌', label: 'Banana', img: 'img/banana.jpg' },
        { re: /morango/i, e: '🍓', label: 'Morango', img: 'img/morango.jpg' },
        { re: /ma[cç][aã]/i, e: '🍎', label: 'Maçã', img: 'img/maca.jpg' },
        { re: /laranja/i, e: '🍊', label: 'Laranja', img: 'img/laranja.jpg' },
        { re: /abacate/i, e: '🥑', label: 'Abacate', img: 'img/abacate.jpg' },
        { re: /fruta/i, e: '🍎', label: 'Fruta', img: 'img/fruta.jpg' },
        { re: /salada|folhas|alface/i, e: '🥗', label: 'Salada', img: 'img/salada.jpg' },
        { re: /br[oó]colis/i, e: '🥦', label: 'Brócolis', img: 'img/brocolis.jpg' },
        { re: /cenoura/i, e: '🥕', label: 'Cenoura', img: 'img/cenoura.jpg' },
        { re: /tomate/i, e: '🍅', label: 'Tomate', img: 'img/tomate.jpg' },
        { re: /legume|verdura/i, e: '🥗', label: 'Vegetais', img: 'img/vegetais.jpg' },
        { re: /castanha|amendoim|semente|chia|linha[cç]a/i, e: '🥜', label: 'Oleaginosas', img: 'img/oleaginosas.jpg' },
        { re: /batata-doce/i, e: '🍠', label: 'Batata-doce', img: 'img/batata-doce.jpg' },
        { re: /batata|mandioca|aipim/i, e: '🥔', label: 'Batata', img: 'img/batata.jpg' },
        { re: /macarr[aã]o|massa/i, e: '🍝', label: 'Macarrão', img: 'macarrao.jpg' },
        { re: /quinoa/i, e: '🌾', label: 'Quinoa', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=200&q=80' },
        { re: /\bsopa\b/i, e: '🍲', label: 'Sopa', img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=200&q=80' },
        { re: /caf[eé]/i, e: '☕', label: 'Café', img: 'img/cafe.jpg' },
        { re: /\bch[aá]\b/i, e: '🍵', label: 'Chá', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=200&q=80' },
        { re: /vitamina|smoothie/i, e: '🥤', label: 'Vitamina', img: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=200&q=80' },
        { re: /h[uú]mus/i, e: '🫘', label: 'Húmus', img: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=200&q=80' },
        { re: /azeite/i, e: '🫒', label: 'Azeite', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80' },
        { re: /\bmel\b/i, e: '🍯', label: 'Mel', img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=200&q=80' },
        { re: /prote[ií]na/i, e: '🥩', label: 'Proteína', img: 'img/proteina.jpg' }
      ];

      function mealIconFor(name) {
        const n = name.toLowerCase();
        if (n.includes('café')) return { e: '🥐', cls: 'cafe' };
        if (n.includes('lanche da manhã')) return { e: '🍎', cls: 'lanche' };
        if (n.includes('almoço')) return { e: '🍲', cls: 'almoco' };
        if (n.includes('lanche da tarde')) return { e: '🥪', cls: 'lanche' };
        if (n.includes('jantar')) return { e: '🥗', cls: 'jantar' };
        if (n.includes('ceia')) return { e: '🌙', cls: 'ceia' };
        return { e: '🍽️', cls: '' };
      }


      const FOOD_LABEL_TO_DB = {
        'Arroz': 'Arroz branco cozido',
        'Feijão': 'Feijão carioca cozido',
        'Lentilha': 'Lentilha cozida',
        'Grão-de-bico': 'Grão-de-bico cozido',
        'Frango': 'Peito de frango grelhado',
        'Carne': 'Carne bovina magra grelhada',
        'Peixe': 'Peixe tilápia grelhada',
        'Ovo': 'Ovo cozido',
        'Tofu': 'Tofu firme',
        'Queijo': 'Queijo minas frescal',
        'Iogurte': 'Iogurte natural integral',
        'Leite': 'Leite integral',
        'Pão': 'Pão francês',
        'Tapioca': 'Tapioca (goma hidratada)',
        'Aveia': 'Aveia em flocos',
        'Banana': 'Banana prata',
        'Morango': 'Morango',
        'Maçã': 'Maçã com casca',
        'Laranja': 'Laranja pera',
        'Abacate': 'Abacate',
        'Fruta': 'Banana prata',
        'Salada': 'Alface crespa',
        'Brócolis': 'Brócolis cozido',
        'Cenoura': 'Cenoura crua',
        'Tomate': 'Tomate',
        'Vegetais': 'Brócolis cozido',
        'Oleaginosas': 'Amendoim torrado',
        'Batata-doce': 'Batata-doce cozida',
        'Batata': 'Batata cozida',
        'Macarrão': 'Macarrão cozido',
        'Quinoa': 'Quinoa cozida',
        'Sopa': 'Feijão carioca cozido',
        'Café': 'Café pronto (sem açúcar)',
        'Chá': 'Café pronto (sem açúcar)',
        'Vitamina': 'Banana prata',
        'Húmus': 'Grão-de-bico cozido',
        'Azeite': 'Azeite de oliva',
        'Mel': 'Mel',
        'Proteína': 'Peito de frango grelhado'
      };

      function findFoodByLabel(label) {
        const mapped = FOOD_LABEL_TO_DB[label];
        if (mapped) {
          const exact = FOOD_DB.find(f => f.name === mapped);
          if (exact) return exact;
        }
        const q = normalizeText(label || '');
        if (!q) return null;
        let best = null, bestScore = 0;
        FOOD_DB.forEach(f => {
          const s = scoreFood(f, q);
          if (s > bestScore) { bestScore = s; best = f; }
        });
        return bestScore > 0 ? best : null;
      }

      function openFoodDetail(label, img, emoji) {
        const item = findFoodByLabel(label);
        const modal = document.getElementById('foodModal');
        const title = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');
        if (!modal || !title || !body) return;

        title.textContent = (item && item.name) ? item.name : (label || 'Alimento');
        const pic = img
          ? ('<div class="food-detail-img-wrap"><img class="food-detail-img" src="' + img + '" alt="' + String(label || '').replace(/"/g, '') + '"></div>')
          : ('<div class="food-detail-img-wrap food-detail-emoji">' + (emoji || item?.icon || '🥗') + '</div>');

        let nutri = '';
        if (item) {
          const tagsHtml = (item.tags || []).map(t => '<span class="pill">' + t + '</span>').join('');
          nutri =
            '<div class="food-detail-meta">Categoria: ' + (item.cat || 'geral') + ' · valores médios por <strong>100 g</strong></div>' +
            '<div class="diet-tags" style="margin:10px 0 14px">' + tagsHtml + '</div>' +
            '<div class="nutri-macros food-detail-macros">' +
              '<div class="nutri-macro kcal"><span class="val">' + fmtNum(item.kcal, 0) + '</span><span class="lbl">kcal</span></div>' +
              '<div class="nutri-macro prot"><span class="val">' + fmtNum(item.prot) + ' g</span><span class="lbl">proteínas</span></div>' +
              '<div class="nutri-macro carb"><span class="val">' + fmtNum(item.carb) + ' g</span><span class="lbl">carboidratos</span></div>' +
              '<div class="nutri-macro fat"><span class="val">' + fmtNum(item.fat) + ' g</span><span class="lbl">gorduras</span></div>' +
            '</div>' +
            '<div class="nutri-details">' +
              '<div>Fibras: <strong>' + fmtNum(item.fiber) + ' g</strong></div>' +
              '<div>Sódio: <strong>' + fmtNum(item.sod, 0) + ' mg</strong></div>' +
            '</div>' +
            (item.tip ? '<p class="explain-block" style="margin-top:12px">' + item.tip + '</p>' : '') +
            '<div class="nutri-source" style="margin-top:12px">Informação educativa com base em valores médios. Não substitui o rótulo nem orientação profissional.</div>';
        } else {
          nutri = '<p style="color:var(--soft);margin-top:12px">Não encontramos detalhes nutricionais específicos para este item na base local. Use a busca em <strong>Nutrição</strong> para explorar outros alimentos.</p>';
        }

        body.innerHTML = pic + nutri;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }

      function bindFoodCardClicks(root) {
        if (!root) return;
        root.querySelectorAll('.food-card-clickable').forEach(btn => {
          btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openFoodDetail(btn.dataset.foodLabel, btn.dataset.foodImg, btn.dataset.foodEmoji);
          };
        });
      }

      function extractFoodChips(text) {
        const full = String(text || '');
        const seen = new Set();
        const found = [];
        // Varre a descrição inteira e guarda a posição de cada alimento no texto
        FOOD_VISUAL.forEach((f, order) => {
          const pos = full.search(f.re);
          if (pos !== -1 && !seen.has(f.label)) {
            seen.add(f.label);
            found.push({ pos, order, e: f.e, label: f.label, img: f.img || '' });
          }
        });
        // Ordena pela ordem em que aparecem na legenda (desempate: ordem da lista)
        found.sort((a, b) => a.pos - b.pos || a.order - b.order);
        return found.slice(0, 6).map(({ e, label, img }) => ({ e, label, img }));
      }

      function isAllowedDiet(text, restrictions, dislikes, filterMap) {
        const low = text.toLowerCase();
        for (const r of restrictions) {
          const re = filterMap[r];
          if (re && re.test(text)) return false;
        }
        for (const d of dislikes) {
          if (d && low.includes(d)) return false;
        }
        return true;
      }

      function pickDiet(options, restrictions, dislikes, filterMap) {
        const allowed = options.filter(t => isAllowedDiet(t, restrictions, dislikes, filterMap));
        const list = allowed.length ? allowed : options;
        return list[Math.floor(Math.random() * list.length)];
      }

      function mergeBank(base, extra) {
        if (!extra) return base;
        const out = {};
        for (const k of Object.keys(base)) {
          out[k] = extra[k] ? extra[k].concat(base[k]) : base[k].slice();
        }
        return out;
      }

      // Quantidades de referência apenas para deixar o exemplo do plano mais fácil de entender.
      // Não são metas individuais nem prescrição alimentar.
      const FOOD_PORTIONS = {
        'Arroz': '3 colheres de sopa (≈ 90 g)',
        'Feijão': '1 concha pequena (≈ 100 g)',
        'Lentilha': '1 concha pequena (≈ 100 g)',
        'Grão-de-bico': '1/2 xícara (≈ 80 g)',
        'Frango': '1 filé pequeno (≈ 100 g)',
        'Carne': '1 filé pequeno (≈ 100 g)',
        'Peixe': '1 filé pequeno (≈ 100 g)',
        'Ovo': '1 unidade',
        'Tofu': '1 fatia grossa (≈ 100 g)',
        'Queijo': '1 fatia (≈ 30 g)',
        'Iogurte': '1 pote (≈ 170 g)',
        'Leite': '1 copo (≈ 200 ml)',
        'Pão': '1 unidade',
        'Tapioca': '1 unidade média (≈ 50 g)',
        'Aveia': '2 colheres de sopa (≈ 20 g)',
        'Banana': '1 unidade média',
        'Morango': '1 xícara (≈ 100 g)',
        'Maçã': '1 unidade média',
        'Laranja': '1 unidade média',
        'Abacate': '2 colheres de sopa (≈ 50 g)',
        'Fruta': '1 unidade média',
        'Salada': '1 prato de sobremesa',
        'Brócolis': '1/2 xícara (≈ 80 g)',
        'Cenoura': '1/2 xícara (≈ 60 g)',
        'Tomate': '1 unidade pequena',
        'Vegetais': '1/2 xícara (≈ 80 g)',
        'Oleaginosas': '1 punhado pequeno (≈ 20 g)',
        'Batata-doce': '1 unidade pequena (≈ 100 g)',
        'Batata': '1 unidade pequena (≈ 100 g)',
        'Macarrão': '1 xícara (≈ 100 g cozido)',
        'Quinoa': '1/2 xícara (≈ 90 g cozida)',
        'Sopa': '1 prato fundo (≈ 300 ml)',
        'Café': '1 xícara (≈ 150 ml)',
        'Chá': '1 xícara (≈ 200 ml)',
        'Vitamina': '1 copo (≈ 250 ml)',
        'Húmus': '2 colheres de sopa (≈ 40 g)',
        'Azeite': '1 colher de chá (≈ 5 ml)',
        'Mel': '1 colher de chá (≈ 7 g)',
        'Proteína': '1 porção pequena (≈ 100 g)'
      };

      function buildMealHtml(name, desc, kcalNote, index) {
        const ic = mealIconFor(name);
        const chips = extractFoodChips(desc);
        const foodsHtml = chips.map((c, i) => {
          const portion = FOOD_PORTIONS[c.label] || '1 porção de referência';
          const imgBlock = c.img
            ? ('<div class="food-card-img-wrap">' +
                '<img class="food-card-img" src="' + c.img + '" alt="' + String(c.label).replace(/"/g, '') + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display=\'none\';var f=this.nextElementSibling;if(f)f.hidden=false">' +
                '<span class="food-card-emoji-fallback" hidden>' + c.e + '</span>' +
              '</div>')
            : ('<div class="food-card-img-wrap food-card-emoji-only"><span class="food-card-emoji-fallback">' + c.e + '</span></div>');
          return (
            '<button type="button" class="food-card food-card-clickable" style="animation-delay:' + (0.06 * i) + 's" data-food-label="' + String(c.label).replace(/"/g, '&quot;') + '" data-food-img="' + String(c.img || '').replace(/"/g, '&quot;') + '" data-food-emoji="' + c.e + '" title="Ver informações nutricionais">' +
              imgBlock +
              '<div class="food-card-name">' + c.label + '</div>' +
              '<div class="food-card-portion"><span>PORÇÃO DE REFERÊNCIA</span><strong>' + portion + '</strong></div>' +
              '<span class="food-card-hint">Ver nutrientes</span>' +
            '</button>'
          );
        }).join('');
        return (
          '<article class="meal meal-v2" data-meal-index="' + index + '">' +
            '<div class="meal-top">' +
              '<div class="meal-icon ' + ic.cls + '" aria-hidden="true">' + ic.e + '</div>' +
              '<div class="meal-info">' +
                '<h4>' + name +
                  (kcalNote ? '<span class="meal-kcal">' + kcalNote + '</span>' : '') +
                '</h4>' +
              '</div>' +
              '<button type="button" class="meal-swap" data-swap="' + index + '" title="Sugerir outra opção" aria-label="Trocar refeição">↻</button>' +
            '</div>' +
            '<p class="meal-desc">' + desc + '</p>' +
            (foodsHtml
              ? '<div class="meal-food-cards" role="list">' + foodsHtml + '</div>'
              : '') +
          '</article>'
        );
      }

      function renderDietPlan(state, noScroll) {
        setTimeout(renderSummary, 0);
        const r = document.getElementById('dietResult');
        if (!r || !state) return;
        r.classList.remove('empty');
        document.querySelector('.diet-grid')?.classList.add('has-result');

        const mealsHtml = state.meals.map((m, i) =>
          buildMealHtml(m.name, m.desc, m.kcalNote, i)
        ).join('');

        r.innerHTML =
          '<div class="diet-result-head">' +
            '<span class="eyebrow">PLANO SEMANAL • ' + state.mealsCount + ' REFEIÇÕES POR DIA</span>' +
            '<h3>Sua semana para ' + state.goalText + '</h3>' +
            '<p class="lead-soft">Sugestões ' + state.timeText + '. ' + state.profileLine + '</p>' +
          '</div>' +
          '<div class="diet-tags">' + state.tags.map(t => '<span class="pill">' + t + '</span>').join('') + '</div>' +
          '<div class="diet-portion-guide"><span class="diet-portion-guide-icon">⚖️</span><div><strong>Como ler as quantidades</strong><p>As medidas nos cards são porções de referência do exemplo, como gramas, ml, colheres e unidades. Elas ajudam a visualizar o prato e não representam uma meta individual.</p></div></div>' +
          (state.imcHint
            ? '<p class="diet-hint">' + state.imcHint +
              (state.portionHint ? ' <strong>' + state.portionHint + '</strong>' : '') + '</p>'
            : '') +
          state.energyBlock +
          '<div class="week-tabs" role="tablist" aria-label="Dias da semana">' + state.days.map((d, i) => '<button type="button" role="tab" class="week-tab' + (i === state.dayIdx ? ' active' : '') + '" aria-selected="' + (i === state.dayIdx) + '" data-day="' + i + '">' + d.slice(0, 3) + '</button>').join('') + '</div>' +
          '<h4 class="week-day-title">' + state.days[state.dayIdx] + '</h4>' +
          '<div class="diet-timeline">' + mealsHtml + '</div>' +
          '<div class="diet-actions">' +
            '<button type="button" class="btn btn-primary" id="dietRegenAll">Gerar outra semana</button>' +
            '<button type="button" class="btn btn-ghost" id="dietScrollForm">Ajustar preferências</button>' +
          '</div>' +
          '<div class="disclaimer"><b>Como usar:</b> este é um exemplo visual de organização com base nos dados informados — não é prescrição. ' +
          'Ajuste porções pela fome, cultura e orçamento. Confira ingredientes se houver alergia. ' +
          (state.minor ? 'Com menos de 20 anos, não use o plano para tentar perder peso ou restringir alimentação. ' : '') +
          'Em caso de dúvida, procure um nutricionista ou médico.</div>';

        bindFoodCardClicks(r);
        r.querySelectorAll('.week-tab').forEach(b => b.addEventListener('click', () => {
          state.dayIdx = +b.dataset.day; state.meals = state.week[state.dayIdx]; renderDietPlan(state, true);
        }));

        // Swap individual meal
        r.querySelectorAll('.meal-swap').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = +btn.dataset.swap;
            if (!lastDietState || !lastDietState.meals[idx]) return;
            const slot = lastDietState.meals[idx].slot;
            const options = lastDietState.bank[slot] || [];
            if (!options.length) return;
            let next = pickDiet(options, lastDietState.restrictions, lastDietState.dislikes, lastDietState.filterMap);
            // try not to repeat same text
            let tries = 0;
            while (next === lastDietState.meals[idx].desc && options.length > 1 && tries < 6) {
              next = pickDiet(options, lastDietState.restrictions, lastDietState.dislikes, lastDietState.filterMap);
              tries++;
            }
            lastDietState.meals[idx].desc = next;
            renderDietPlan(lastDietState);
            // highlight swapped card
            const card = document.querySelector('.meal[data-meal-index="' + idx + '"]');
            if (card) {
              card.style.outline = '2px solid var(--teal)';
              setTimeout(() => { card.style.outline = ''; }, 700);
            }
          });
        });

        document.getElementById('dietRegenAll')?.addEventListener('click', () => {
          document.getElementById('dietForm')?.requestSubmit();
        });
        document.getElementById('dietScrollForm')?.addEventListener('click', () => {
          document.getElementById('dietForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        // scroll result into view on mobile
        if (window.innerWidth <= 900 && !noScroll) {
          r.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.body.style.overflow = '';
        }
      }

      document.getElementById('dietForm').addEventListener('submit', e => {
        e.preventDefault();
        dietSubmitted = true;
        const age = +document.getElementById('dietAge').value;
        const goal = document.getElementById('dietGoal').value;
        const style = document.getElementById('dietStyle').value;
        const mealsCount = +document.getElementById('dietMeals').value;
        const time = document.getElementById('dietTime').value;
        const dislikesRaw = document.getElementById('dietDislikes').value.trim();
        const dislikes = dislikesRaw ? dislikesRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];
        const restrictions = Array.from(document.querySelectorAll('#restrictGrid input:checked')).map(i => i.value);
        if (!age) return;

        const minor = age < 20;
        const profile = lastProfile;
        const energy = lastEnergy;

        const banks = {
          brasileira: {
            breakfast: ['Pão + ovo ou queijo + fruta + café ou chá', 'Cuscuz ou tapioca + ovo + fruta', 'Aveia com leite + banana + canela'],
            lunch: ['Arroz + feijão + frango grelhado + legumes e verduras', 'Arroz + feijão + carne magra + salada colorida', 'Arroz + feijão + peixe + legumes no vapor'],
            snack1: ['Fruta + iogurte natural', 'Sanduíche simples de pão integral', 'Castanhas + fruta'],
            snack2: ['Vitamina de frutas', 'Queijo branco + torrada integral', 'Iogurte + granola'],
            dinner: ['Arroz ou batata + proteína + legumes', 'Sopa de legumes com proteína + pão integral', 'Omelete de legumes + salada']
          },
          vegetariana: {
            breakfast: ['Iogurte + aveia + banana + sementes', 'Pão integral + queijo + fruta', 'Vitamina de frutas com aveia'],
            lunch: ['Arroz + feijão + ovo + legumes variados', 'Arroz + lentilha + legumes + queijo', 'Quinoa + grão-de-bico + salada colorida'],
            snack1: ['Fruta + iogurte ou castanhas', 'Torrada integral + pasta de amendoim', 'Mix de castanhas + fruta seca'],
            snack2: ['Smoothie de frutas', 'Queijo + fruta', 'Iogurte com mel e granola'],
            dinner: ['Omelete com legumes + arroz ou pão integral', 'Sopa de legumes com queijo + torrada', 'Grão-de-bico refogado + salada']
          },
          vegana: {
            breakfast: ['Bebida vegetal + aveia + banana + sementes', 'Pão integral + pasta de amendoim + fruta', 'Vitamina de frutas com aveia e chia'],
            lunch: ['Arroz + feijão ou lentilha + legumes variados + tofu', 'Quinoa + grão-de-bico + legumes coloridos', 'Arroz + legumes salteados + tofu grelhado'],
            snack1: ['Fruta + castanhas', 'Torrada integral + pasta de amendoim', 'Mix de castanhas e frutas secas'],
            snack2: ['Smoothie de frutas com bebida vegetal', 'Húmus + palitos de legumes', 'Fruta + sementes'],
            dinner: ['Legumes refogados + tofu ou grão-de-bico + arroz', 'Sopa de legumes com lentilha', 'Salada completa com leguminosas e sementes']
          },
          simples: {
            breakfast: ['Pão + ovo ou queijo + fruta', 'Aveia com fruta', 'Tapioca + queijo + fruta'],
            lunch: ['Arroz + feijão + frango/ovo + salada pronta', 'Macarrão integral + proteína + legumes', 'Arroz + ovo + legumes rápidos no vapor'],
            snack1: ['Fruta + iogurte', 'Sanduíche simples', 'Castanhas'],
            snack2: ['Fruta', 'Iogurte', 'Torrada + queijo'],
            dinner: ['Arroz ou batata + proteína + legumes', 'Sanduíche natural + fruta', 'Omelete rápida + salada']
          }
        };

        const boostLow = {
          breakfast: ['Aveia generosa + banana + pasta de amendoim + leite ou bebida vegetal', 'Pão + ovo + queijo + fruta + iogurte'],
          snack1: ['Vitamina de frutas com aveia + castanhas', 'Sanduíche completo + fruta'],
          lunch: ['Arroz + feijão + proteína + legumes + azeite na salada'],
          dinner: ['Arroz ou batata + proteína + legumes + fruta de sobremesa']
        };
        const boostHigh = {
          breakfast: ['Aveia + fruta + iogurte natural (sem açúcar extra)', 'Ovos + leguminosas + muita salada no prato'],
          lunch: ['Arroz + feijão + proteína magra + metade do prato de legumes e folhas', 'Peixe ou frango + leguminosas + salada colorida abundante'],
          snack1: ['Fruta fresca + iogurte natural', 'Legumes crus + húmus'],
          dinner: ['Sopa de legumes com proteína + salada', 'Omelete de legumes + folhas verdes + batata ou arroz em porção moderada']
        };
        const boostSport = {
          breakfast: ['Aveia + banana + ovo ou iogurte + hidratação'],
          snack1: ['Fruta + iogurte ou sanduíche leve antes/depois do movimento'],
          lunch: ['Arroz + feijão + proteína + legumes — refeição completa no entorno do treino']
        };

        const filterMap = {
          lactose: /leite|queijo|iogurte|requeij[aã]o|manteiga|creme de leite|leite condensado/i,
          gluten: /p[aã]o|torrada|macarr[aã]o|cuscuz|tapioca|cream cracker|biscoito/i,
          ovo: /ovo|omelete/i,
          oleaginosas: /castanha|amendoim|nozes|chia|linha[cç]a|semente/i,
          frutosdomar: /peixe|sardinha|atum|til[aá]pia|frutos do mar/i,
          carne: /carne|bovina|hamb[uú]rguer|alcatra/i,
          frango: /frango|peito de frango|coxa de frango/i,
          porco: /porco|presunto|lingui[cç]a|calabresa/i
        };

        let bank = banks[style] || banks.brasileira;
        let imcHint = '';
        let portionHint = '';

        if (profile && !minor) {
          const imc = profile.imc;
          if (imc < 18.5) {
            bank = mergeBank(bank, boostLow);
            imcHint = 'Seu IMC está abaixo da referência: o exemplo reforça refeições regulares e combinações com boa densidade energética.';
            portionHint = 'Priorize não pular refeições e incluir proteína + carboidrato + gordura boa nas principais.';
          } else if (imc >= 25) {
            bank = mergeBank(bank, boostHigh);
            imcHint = 'Seu IMC está acima da referência: o exemplo destaca vegetais, fibras e proteínas magras — sem dieta restritiva.';
            portionHint = 'Monte o prato com metade de vegetais, um quarto de proteína e um quarto de carboidrato; ajuste pela fome.';
          } else {
            imcHint = 'Seu IMC está na faixa de referência: o foco é variedade, regularidade e prazer à mesa.';
            portionHint = 'Use a fome e a saciedade como guia.';
          }
        } else if (profile && minor) {
          imcHint = 'Como você tem menos de 20 anos, o IMC não foi usado para restringir a alimentação — só idade e preferências orientam o exemplo.';
          portionHint = 'Crescimento pede refeições regulares e variadas.';
        } else {
          imcHint = 'Calcule o IMC na seção correspondente para o plano considerar também o seu perfil (de forma educativa).';
        }

        if (goal === 'esporte') bank = mergeBank(bank, boostSport);
        if (goal === 'energia') bank = mergeBank(bank, boostLow);

        let energyBlock = '';
        if (energy && energy.tdee) {
          const tdee = energy.tdee;
          const minK = Math.round(tdee * 0.9);
          const maxK = Math.round(tdee * 1.1);
          const protG = Math.round((profile?.peso || energy.peso) * 1.2);
          energyBlock =
            '<div class="diet-energy-card">' +
            '<h4>⚡ Referência do seu gasto estimado</h4>' +
            '<p>Estimativa ~<strong>' + tdee.toLocaleString('pt-BR') + ' kcal/dia</strong> (TMB ~' +
            energy.tmb.toLocaleString('pt-BR') + ' kcal). Faixa educativa <strong>' +
            minK.toLocaleString('pt-BR') + '–' + maxK.toLocaleString('pt-BR') + ' kcal/dia</strong>. ' +
            'Não é meta de dieta.' +
            (profile ? ' Proteínas na casa de ~' + protG + ' g/dia (≈1,2 g/kg) é referência comum — ajuste com profissional.' : '') +
            '</p></div>';
        } else {
          energyBlock =
            '<div class="diet-energy-card">' +
            '<h4>⚡ Gasto energético</h4>' +
            '<p>Ainda não há estimativa. Calcule na seção <strong>Nutrição</strong> para ver uma faixa educativa de kcal no plano.</p></div>';
        }

        const goalText = {
          energia: 'priorizar energia ao longo do dia',
          equilibrio: 'equilíbrio entre grupos alimentares',
          esporte: 'apoiar a atividade física',
          rotina: 'facilitar escolhas no dia a dia'
        }[goal];
        const timeText = {
          rapido: 'com preparos rápidos',
          moderado: 'com preparos de tempo moderado',
          gosto: 'com espaço para cozinhar com calma'
        }[time];

        function mealNote(name) {
          if (!energy || !energy.tdee) return '';
          const shares = {
            'Café da manhã': 0.25,
            'Lanche da manhã': 0.10,
            'Almoço': 0.30,
            'Lanche da tarde': 0.10,
            'Jantar': 0.25,
            'Ceia leve': 0.08
          };
          const s = shares[name];
          if (!s) return '';
          return '~' + Math.round(energy.tdee * s).toLocaleString('pt-BR') + ' kcal ref.';
        }

        // Monta lista de refeições com slot para troca
        const plan = [];
        plan.push({ name: 'Café da manhã', slot: 'breakfast', desc: pickDiet(bank.breakfast, restrictions, dislikes, filterMap) });
        if (mealsCount >= 5) {
          plan.push({ name: 'Lanche da manhã', slot: 'snack2', desc: pickDiet(bank.snack2, restrictions, dislikes, filterMap) });
        }
        plan.push({ name: 'Almoço', slot: 'lunch', desc: pickDiet(bank.lunch, restrictions, dislikes, filterMap) });
        if (mealsCount >= 4) {
          plan.push({ name: 'Lanche da tarde', slot: 'snack1', desc: pickDiet(bank.snack1, restrictions, dislikes, filterMap) });
        }
        plan.push({ name: 'Jantar', slot: 'dinner', desc: pickDiet(bank.dinner, restrictions, dislikes, filterMap) });
        if (mealsCount >= 6) {
          plan.push({ name: 'Ceia leve', slot: 'snack2', desc: pickDiet(bank.snack2, restrictions, dislikes, filterMap) });
        }

        plan.forEach(m => { m.kcalNote = mealNote(m.name); });

        const restrictLabels = {
          lactose: 'Sem lactose', gluten: 'Sem glúten', ovo: 'Sem ovo',
          oleaginosas: 'Sem castanhas', frutosdomar: 'Sem frutos do mar', carne: 'Sem carne vermelha'
        };
        const styleLabel = { brasileira: 'Brasileiro', vegetariana: 'Vegetariano', vegana: 'Vegano', simples: 'Simples' }[style];

        const tags = [];
        if (minor) tags.push('Menor de 20 · IMC não restringe');
        else tags.push('Sem metas restritivas');
        tags.push(styleLabel);
        if (profile) tags.push('IMC ' + profile.imc.toFixed(1).replace('.', ','));
        if (profile) tags.push(profile.peso + ' kg');
        if (energy) tags.push('~' + energy.tdee.toLocaleString('pt-BR') + ' kcal est.');
        restrictions.forEach(rr => tags.push(restrictLabels[rr] || rr));
        if (dislikes.length) tags.push('Evitando: ' + dislikes.join(', '));

        const profileLine = profile
          ? ('Perfil: ' + profile.idade + ' anos, ' + profile.peso + ' kg, ' + profile.alturaCm + ' cm, IMC ' +
            profile.imc.toFixed(1).replace('.', ',') +
            (energy ? '; gasto ~' + energy.tdee.toLocaleString('pt-BR') + ' kcal/dia' : '') + '.')
          : (energy
            ? ('Gasto ~' + energy.tdee.toLocaleString('pt-BR') + ' kcal/dia (calcule o IMC para enriquecer o contexto).')
            : 'Preencha IMC e gasto em Nutrição para um plano mais alinhado ao seu corpo.');

        const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
        const usedMeals = new Set(plan.map(m => m.name + m.desc));
        const week = DAYS.map((dn, di) => di === 0 ? plan : plan.map(m => {
          let desc = m.desc, t = 0;
          do { desc = pickDiet(bank[m.slot], restrictions, dislikes, filterMap); t++; } while (usedMeals.has(m.name + desc) && t < 12);
          usedMeals.add(m.name + desc);
          return { ...m, desc };
        }));
        lastDietState = {
          week, days: DAYS, dayIdx: 0,
          meals: plan,
          mealsCount,
          goalText,
          timeText,
          profileLine,
          tags,
          imcHint,
          portionHint,
          energyBlock,
          minor,
          bank,
          restrictions,
          dislikes,
          filterMap
        };

        renderDietPlan(lastDietState);
      });


      document.getElementById('imcForm')?.addEventListener('submit', () => setTimeout(renderSummary, 60));

      // Hábitos — design + animações
      let habits = JSON.parse(localStorage.getItem('health-habits') || 'null') || [
        { name: 'Beber água ao longo do dia', done: false, emoji: '💧' },
        { name: 'Dormir o suficiente', done: false, emoji: '😴' },
        { name: 'Fazer algum movimento corporal', done: false, emoji: '🏃' },
        { name: 'Comer frutas ou vegetais', done: false, emoji: '🥗' },
        { name: 'Fazer uma pausa para respirar', done: false, emoji: '🌬️' }
      ];
      // migrate old habits without emoji
      habits = habits.map(h => ({
        ...h,
        emoji: h.emoji || guessHabitEmoji(h.name)
      }));
      let streak = Number(localStorage.getItem('health-streak') || 0);
      const rows = document.getElementById('habitRows');
      const RING_LEN = 2 * Math.PI * 52; // ~326.7

      function guessHabitEmoji(name) {
        const n = (name || '').toLowerCase();
        if (/agua|beber|hidrat/.test(n)) return '💧';
        if (/dorm|sono/.test(n)) return '😴';
        if (/moviment|caminh|treino|exerc|corr/.test(n)) return '🏃';
        if (/fruta|veget|salada|comida/.test(n)) return '🥗';
        if (/respir|medit|paus/.test(n)) return '🌬️';
        if (/ler|livro/.test(n)) return '📚';
        if (/along/.test(n)) return '🧘';
        return '✨';
      }

      function saveHabits() {
        localStorage.setItem('health-habits', JSON.stringify(habits));
        localStorage.setItem('health-streak', streak);
      }

      function updateHabitStats() {
        const done = habits.filter(h => h.done).length;
        const total = habits.length;
        const pct = total ? Math.round(done / total * 100) : 0;

        const fill = document.getElementById('progressFill');
        if (fill) fill.style.width = pct + '%';

        const pText = document.getElementById('progressText');
        if (pText) pText.textContent = done + ' de ' + total + ' concluídos';

        const badge = document.getElementById('habitPctBadge');
        if (badge) {
          badge.textContent = pct + '%';
          badge.classList.toggle('full', pct === 100 && total > 0);
        }

        const ring = document.getElementById('habitRingFg');
        if (ring) {
          ring.style.strokeDasharray = String(RING_LEN);
          ring.style.strokeDashoffset = String(RING_LEN * (1 - pct / 100));
          ring.classList.toggle('complete', pct === 100 && total > 0);
        }

        const closeBtn = document.getElementById('closeDayBtn');
        if (closeBtn) closeBtn.disabled = !(total && done === total);

        const sn = document.getElementById('streakNum');
        if (sn) sn.textContent = streak;

        const flame = document.getElementById('streakFlame');
        if (flame) flame.classList.toggle('on', streak > 0);

        const caption = document.getElementById('streakCaption');
        if (caption) {
          if (streak === 0) caption.textContent = 'Comece marcando um hábito';
          else if (streak === 1) caption.textContent = '1º dia completo — continue!';
          else if (streak < 7) caption.textContent = streak + ' dias seguidos — boa sequência';
          else caption.textContent = streak + ' dias! Constância em ação';
        }

        saveHabits();
        renderSummary();
      }

      function renderHabits(opts) {
        opts = opts || {};
        const animateIn = !!opts.animateIn;
        rows.innerHTML = '';
        habits.forEach((h, i) => {
          const row = document.createElement('div');
          row.className = 'habit-row' + (h.done ? ' done' : '');
          row.dataset.index = i;
          if (animateIn) row.style.animationDelay = (0.04 * i) + 's';
          else row.style.animation = 'none';
          row.innerHTML =
            '<div class="check ' + (h.done ? 'checked' : '') + '" data-i="' + i + '" role="checkbox" aria-checked="' + !!h.done + '" tabindex="0">' +
              (h.done ? '✓' : '') +
            '</div>' +
            '<div class="habit-emoji" aria-hidden="true">' + (h.emoji || '✨') + '</div>' +
            '<div class="habit-name">' + h.name + '</div>' +
            '<button type="button" class="remove" data-r="' + i + '" aria-label="Remover hábito">×</button>';
          rows.appendChild(row);
        });
        updateHabitStats();
      }

      function toggleHabit(i) {
        if (i < 0 || i >= habits.length) return;
        habits[i].done = !habits[i].done;
        const row = rows.querySelector('.habit-row[data-index="' + i + '"]');
        if (!row) {
          renderHabits();
          return;
        }
        const check = row.querySelector('.check');
        row.classList.toggle('done', habits[i].done);
        if (check) {
          check.classList.remove('checked', 'check-anim');
          void check.offsetWidth; // restart animation
          if (habits[i].done) {
            check.classList.add('checked', 'check-anim');
            check.setAttribute('aria-checked', 'true');
            check.textContent = '✓';
          } else {
            check.classList.add('check-anim-off');
            check.setAttribute('aria-checked', 'false');
            check.textContent = '';
            setTimeout(() => check.classList.remove('check-anim-off'), 280);
          }
        }
        row.classList.remove('pop');
        void row.offsetWidth;
        row.classList.add('pop');
        setTimeout(() => row.classList.remove('pop'), 400);
        updateHabitStats();
      }

      function removeHabit(i) {
        if (i < 0 || i >= habits.length) return;
        const row = rows.querySelector('.habit-row[data-index="' + i + '"]');
        if (row) {
          row.classList.add('habit-out');
          setTimeout(() => {
            habits.splice(i, 1);
            renderHabits();
          }, 220);
        } else {
          habits.splice(i, 1);
          renderHabits();
        }
      }

      rows.onclick = e => {
        const c = e.target.closest('.check');
        const r = e.target.closest('.remove');
        if (c) {
          e.preventDefault();
          toggleHabit(+c.dataset.i);
        }
        if (r) {
          e.preventDefault();
          removeHabit(+r.dataset.r);
        }
      };
      rows.addEventListener('keydown', e => {
        const c = e.target.closest('.check');
        if (c && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          toggleHabit(+c.dataset.i);
        }
      });

      function addHabit() {
        const input = document.getElementById('habitInput');
        const v = input.value.trim();
        if (!v) return;
        habits.push({ name: v, done: false, emoji: guessHabitEmoji(v) });
        input.value = '';
        renderHabits({ animateIn: false });
        // highlight last row
        const last = rows.querySelector('.habit-row:last-child');
        if (last) {
          last.classList.add('pop');
          setTimeout(() => last.classList.remove('pop'), 400);
        }
        input.focus();
      }
      document.getElementById('habitAddBtn').onclick = addHabit;
      document.getElementById('habitInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); addHabit(); }
      });

      document.getElementById('closeDayBtn').onclick = () => {
        streak++;
        habits.forEach(h => h.done = false);
        renderHabits({ animateIn: true });
        const sn = document.getElementById('streakNum');
        if (sn) {
          sn.classList.remove('bump');
          void sn.offsetWidth;
          sn.classList.add('bump');
        }
        const card = document.getElementById('streakCard');
        if (card) {
          card.classList.remove('celebrate');
          void card.offsetWidth;
          card.classList.add('celebrate');
          setTimeout(() => card.classList.remove('celebrate'), 1300);
        }
      };
      renderHabits({ animateIn: true });

      // ============================================
      // Assistente IA — Linha (redesign + melhor UX)
      // ============================================
      const aiFab = document.getElementById('aiFab');
      const aiPanel = document.getElementById('aiPanel');
      const aiBackdrop = document.getElementById('aiBackdrop');
      const aiClose = document.getElementById('aiClose');
      const aiMessages = document.getElementById('aiMessages');
      const aiInput = document.getElementById('aiInput');
      const aiSend = document.getElementById('aiSend');
      const aiContext = document.getElementById('aiContext');
      const aiSuggestions = document.getElementById('aiSuggestions');
      const aiCharCount = document.getElementById('aiCharCount');
      let aiStarted = false;
      let aiBusy = false;

      function getUserContext() {
        return {
          hasImc: !!lastProfile,
          peso: lastProfile?.peso,
          altura: lastProfile?.alturaCm,
          idade: lastProfile?.idade,
          imc: lastProfile?.imc,
          menor: lastProfile ? lastProfile.idade < 20 : false,
          waterFilled: typeof filled !== 'undefined' ? filled : 0,
          waterMl: typeof wMl !== 'undefined' ? wMl : 0,
          habitsDone: habits.filter(h => h.done).length,
          habitsTotal: habits.length,
          streak: streak,
          dietAge: +document.getElementById('dietAge')?.value || null,
          dietGoal: dietSubmitted ? document.getElementById('dietGoal')?.value || null : null,
          dietStyle: dietSubmitted ? document.getElementById('dietStyle')?.value || null : null,
          dietMeals: dietSubmitted ? document.getElementById('dietMeals')?.value || null : null,
          restrictions: Array.from(document.querySelectorAll('#restrictGrid input:checked')).map(i => i.value),
          hasEnergy: !!lastEnergy,
          tdee: lastEnergy?.tdee || null,
          tmb: lastEnergy?.tmb || null,
          activity: lastEnergy?.atividade || null
        };
      }

      function refreshAiContext() {
        const c = getUserContext();
        const chips = [];
        if (c.hasImc) {
          chips.push(`IMC ${c.imc.toFixed(1).replace('.', ',')}`);
          chips.push(`${c.idade} anos`);
          chips.push(`${c.peso} kg`);
        }
        if (c.hasEnergy && c.tdee) chips.push(`~${c.tdee.toLocaleString('pt-BR')} kcal`);
        if (c.waterFilled > 0) chips.push(`${c.waterMl} ml água`);
        if (c.habitsDone > 0) chips.push(`${c.habitsDone}/${c.habitsTotal} hábitos`);
        if (c.streak > 0) chips.push(`${c.streak} dias sequência`);
        if (c.dietStyle) {
          const styles = { brasileira: 'Brasileira', vegetariana: 'Vegetariana', vegana: 'Vegana', simples: 'Simples' };
          chips.push(styles[c.dietStyle] || c.dietStyle);
        }
        if (c.restrictions.length) chips.push(c.restrictions.length + ' restrição(ões)');
        aiContext.innerHTML = chips.length
          ? chips.map(t => `<span class="ai-chip on">${t}</span>`).join('')
          : '<span class="ai-chip">Calcule o IMC ou use as ferramentas para eu te acompanhar</span>';
      }

      function scrollAiToBottom(force) {
        requestAnimationFrame(() => {
          const nearBottom = aiMessages.scrollHeight - aiMessages.scrollTop - aiMessages.clientHeight < 120;
          if (force || nearBottom) aiMessages.scrollTop = aiMessages.scrollHeight;
        });
      }

      function addMsg(text, who) {
        const div = document.createElement('div');
        div.className = 'ai-msg ' + who;
        div.innerHTML = text;
        aiMessages.appendChild(div);
        scrollAiToBottom(true);
        return div;
      }

      function showTyping(show) {
        let t = document.getElementById('aiTyping');
        if (show) {
          if (!t) {
            t = document.createElement('div');
            t.id = 'aiTyping';
            t.className = 'ai-typing';
            t.innerHTML = '<div class="ai-typing-dots"><span></span><span></span><span></span></div><span class="ai-typing-label">Linha está pensando…</span>';
            aiMessages.appendChild(t);
          }
        } else if (t) t.remove();
        scrollAiToBottom(true);
      }

      function updateSendState() {
        const hasText = (aiInput.value || '').trim().length > 0;
        aiSend.disabled = !hasText || aiBusy;
        if (aiCharCount) {
          const len = (aiInput.value || '').length;
          if (len > 350) {
            aiCharCount.hidden = false;
            aiCharCount.textContent = len + '/500';
          } else {
            aiCharCount.hidden = true;
          }
        }
      }

      const goalLabels = {
        energia: 'ter mais energia',
        equilibrio: 'alimentação equilibrada',
        esporte: 'apoiar atividade física',
        rotina: 'organizar a rotina'
      };

      function randomOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

      function linhaResponderBase(pergunta) {
        const q = pergunta.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
        const c = getUserContext();
        const disc = '<span class="ai-disclaimer">Informação educativa. Não substitui orientação profissional.</span>';

        if (/^(oi|ola|olá|hey|eai|e ai|bom dia|boa tarde|boa noite|opa|fala|salve)\b/.test(q) || q.length < 4) {
          if (c.hasImc) {
            return `${randomOf([
              `Oi! Vi que seu IMC está em <strong>${c.imc.toFixed(1).replace('.', ',')}</strong> (${c.idade} anos)${c.hasEnergy ? ` e o gasto estimado em ~${c.tdee.toLocaleString('pt-BR')} kcal` : ''}.`,
              `Olá de novo! Seus dados aqui: IMC <strong>${c.imc.toFixed(1).replace('.', ',')}</strong>, ${c.idade} anos${c.hasEnergy ? `, gasto ~${c.tdee.toLocaleString('pt-BR')} kcal` : ''}.`
            ])} Posso explicar números, hidratação, hábitos ou o plano. O que você quer saber?` + disc;
          }
          return `${randomOf([
            `Oi! Eu sou a <strong>Linha</strong>. Quanto mais você usar IMC, água, hábitos e o plano, mais eu te acompanho de perto.`,
            `Olá! Aqui é a <strong>Linha</strong>. Posso explicar qualquer ferramenta do site ou só bater um papo sobre bem-estar.`
          ])} Pergunte sobre bem-estar, alimentação ou o site.` + disc;
        }

        if (/quem (e|é) voce|quem e vc|o que voce (e|é|faz)|voce e (uma )?ia|voce e real|robo|assistente virtual/.test(q)) {
          return `Sou a <strong>Linha</strong>, a assistente do Health Line. Leio os dados que você preenche no site (IMC, hidratação, hábitos, plano) e converso sobre eles de forma educativa. No modo local eu uso respostas prontas; se você conectar uma chave do Gemini, respondo com mais liberdade — sempre no mesmo tom acolhedor e sem prescrever dietas.` + disc;
        }

        if (/resumo|como estou|meu status|meu dia|progresso|acompanhamento/.test(q)) {
          const parts = [];
          if (c.hasImc) parts.push(`IMC <strong>${c.imc.toFixed(1).replace('.', ',')}</strong>`);
          if (c.hasEnergy) parts.push(`gasto ~<strong>${c.tdee.toLocaleString('pt-BR')} kcal</strong>`);
          parts.push(`água <strong>${c.waterMl} ml</strong>`);
          parts.push(`hábitos <strong>${c.habitsDone}/${c.habitsTotal}</strong>`);
          if (c.streak > 0) parts.push(`sequência de <strong>${c.streak}</strong> dia(s)`);
          return `Resumo rápido: ${parts.join(' · ')}. Use as seções para atualizar e eu reflito os dados aqui. Quer detalhar alguma parte?` + disc;
        }

        if (/\bimc\b|massa corporal|meu peso|estou gordo|estou magro|classificacao|faixa|abaixo do peso|sobrepeso/.test(q)) {
          if (!c.hasImc) return `Ainda não calculei seu IMC. Vá na seção <strong>IMC</strong>, preencha peso, altura e idade e clique em calcular — aí eu comento o resultado com você.` + disc;
          const faixa = c.imc < 18.5 ? 'abaixo da referência' : c.imc < 25 ? 'na faixa de referência' : c.imc < 30 ? 'acima da referência' : 'bem acima da referência';
          let tipFaixa = '';
          if (c.imc < 18.5) tipFaixa = ' Pode valer observar energia, regularidade das refeições e conversar com um profissional se houver cansaço ou perda de peso sem motivo.';
          else if (c.imc < 25) tipFaixa = ' Sozinho não garante saúde — continue olhando sono, movimento e como você se sente.';
          else if (c.imc < 30) tipFaixa = ' O IMC não separa músculo de gordura. Observar hábitos com calma costuma ser mais útil do que focar só no número.';
          else tipFaixa = ' Esse valor isolado não conta toda a história. Uma avaliação profissional considera exames, composição e hábitos.';
          const extra = c.menor ? ` Como você tem menos de 20 anos, esse valor é só uma <strong>referência aproximada</strong> (avaliação oficial usa percentis por idade e sexo).` : '';
          return `Seu IMC está em <strong>${c.imc.toFixed(1).replace('.', ',')}</strong> — ${faixa}.${extra}${tipFaixa} Quer saber o que o IMC <em>não</em> mostra?` + disc;
        }

        if (/nao mostra|nao mede|limitacao|limitacoes do imc|imc nao/.test(q)) {
          return `O IMC <strong>não</strong> separa músculo de gordura, não mede exames, sono, humor nem qualidade da alimentação. Atletas podem ter IMC alto sem excesso de gordura. Use-o só como ponto de partida, junto com outras informações.` + disc;
        }

        if (/agua|hidrata|copo|beber|sede|liquido/.test(q)) {
          const ml = c.waterMl;
          const faltam = Math.max(0, 8 - c.waterFilled);
          const status = ml >= 2000 ? 'Você já bateu a meta de referência de 2 litros hoje — ótimo!' :
            ml > 0 ? `Você registrou <strong>${ml} ml</strong> hoje (${c.waterFilled} de 8 copos). Faltam cerca de ${faltam} copo(s) para a referência de 2 L.` :
            `Ainda não registrei copos de água hoje. Cada copo na seção de hidratação vale cerca de 250 ml.`;
          return `${status} Beber aos poucos ao longo do dia costuma funcionar melhor. Frutas, sopas e clima quente mudam a necessidade — a meta de 2 L é só uma referência geral.` + disc;
        }

        if (/habito|habitos|sequencia|streak|consistencia|rotina diaria|marcar/.test(q)) {
          let dica = c.habitsDone === 0
            ? ' Que tal começar marcando só um hábito hoje? Pequenos passos mantêm a sequência viva.'
            : c.habitsDone === c.habitsTotal
              ? ' Dia completo — quando quiser, use “Concluir o dia” para somar à sequência.'
              : ' Continuar o que for possível já conta; não precisa ser perfeito.';
          return `Hoje: <strong>${c.habitsDone} de ${c.habitsTotal}</strong> hábitos. Sequência: <strong>${c.streak} dia(s)</strong>.${dica} Ideias simples: beber água, pausa para respirar, uma fruta, 10 minutos de movimento.` + disc;
        }

        if (/plano|dieta|refeicao|cardapio|o que comer|alimentacao|menu|cafe da manha|almoco|jantar/.test(q)) {
          if (c.dietStyle) {
            const estilo = { brasileira: 'comida brasileira', vegetariana: 'vegetariana', vegana: 'vegana', simples: 'refeições simples' }[c.dietStyle] || c.dietStyle;
            const objetivo = goalLabels[c.dietGoal] || 'equilíbrio';
            return `Você prefere <strong>${estilo}</strong>, foco em <strong>${objetivo}</strong>${c.dietMeals ? `, ~${c.dietMeals} refeições` : ''}${c.restrictions.length ? ' e com restrições marcadas' : ''}. O plano é um <em>exemplo educativo</em>, não dieta médica. Gere em <strong>Plano alimentar</strong> e ajuste por fome e rotina.` + disc;
          }
          return `Em <strong>Plano alimentar</strong> escolha objetivo, estilo (brasileira, vegetariana…), quantas refeições e restrições. Quanto mais dados (IMC + gasto em Nutrição), mais alinhado fica o exemplo.` + disc;
        }

        if (/lactose|gluten|alergia|restricao|sem gluten|sem lactose|vegano|vegetariano|castanha|ovo/.test(q)) {
          if (c.restrictions.length) {
            const labels = { lactose: 'lactose', gluten: 'glúten', ovo: 'ovo', oleaginosas: 'castanhas', frutosdomar: 'frutos do mar', carne: 'carne vermelha' };
            const lista = c.restrictions.map(r => labels[r] || r).join(', ');
            return `Restrições marcadas: <strong>${lista}</strong>. O gerador tenta evitar esses itens — sempre confira ingredientes na prática. Alergia confirmada pede orientação profissional.` + disc;
          }
          return `Marque restrições (lactose, glúten, ovo, etc.) no formulário do plano. Eu uso isso nas respostas quando estiver preenchido.` + disc;
        }

        if (/caloria|kcal|gasto energetico|metabolismo|tmb|quantas calorias|energia total|tdee/.test(q)) {
          if (c.hasEnergy) {
            return `Sua estimativa atual: TMB ~<strong>${c.tmb.toLocaleString('pt-BR')} kcal</strong> e gasto total ~<strong>${c.tdee.toLocaleString('pt-BR')} kcal/dia</strong> (Mifflin-St Jeor × atividade). É referência educativa, não meta rígida de dieta. O número varia com o dia e a pessoa.` + disc;
          }
          return `Na seção <strong>Nutrição</strong> calcule o gasto (idade, peso, altura, sexo e atividade). A fórmula de Mifflin-St Jeor dá uma ordem de grandeza — não uma prescrição de calorias.` + disc;
        }

        if (/preco|preço|quanto custa|mercado|supermercado|cosmos|marca do produto/.test(q)) {
          return `Na seção <strong>Nutrição</strong> você consulta uma <strong>base local</strong> de alimentos comuns em mercados brasileiros (arroz, feijão, frutas, carnes, laticínios…). Valores médios por 100 g, com busca por nome e filtros por categoria.` + disc;
        }

        if (/prote(i|í)na|carboidrato|gordura|fibra(s)?\b|macronutriente/.test(q)) {
          return `Proteínas ajudam na construção e reparo do corpo (carnes, ovos, feijões, tofu). Carboidratos são a principal fonte de energia (arroz, pão, tubérculos, frutas). Gorduras boas participam de hormônios e absorção de vitaminas (azeite, abacate, castanhas). Fibras ajudam a digestão e a saciedade (verduras, legumes, grãos integrais). O ideal é ter um pouco de cada grupo no prato, sem cortar nenhum por conta própria.` + disc;
        }

        if (/vitamina|calcio|cálcio|ferro\b|mineral(is)?|micronutriente/.test(q)) {
          return `Cálcio (leite, queijo, folhas verde-escuras) ajuda ossos e dentes. Ferro (carnes, feijão, folhas escuras) participa do transporte de oxigênio no sangue — vitamina C na mesma refeição ajuda a absorver o ferro vegetal. Vitaminas variam por alimento: frutas cítricas têm vitamina C, ovos e peixes têm vitamina D. Variar cores e tipos de alimento é o jeito mais simples de cobrir vários micronutrientes.` + disc;
        }

        if (/alimento|buscar|codigo de barras|open food|nutrientes|macros/.test(q)) {
          return `Na seção <strong>Nutrição</strong> há a busca local por nome em uma lista de alimentos de mercados brasileiros. Valores médios por 100 g (kcal, proteínas, carboidratos, gorduras, fibras e sódio), uso educativo.` + disc;
        }

        if (/receita|ideia de refeicao|o que fazer com|sugestao de prato/.test(q)) {
          return `Uma ideia simples: ${randomOf([
            'arroz, feijão, um ovo frito e salada colorida — rápido e completo',
            'tapioca com queijo e uma fruta de sobremesa',
            'omelete de legumes com uma fatia de pão integral',
            'salada de folhas com grão-de-bico, azeite e limão'
          ])}. Para algo pensado nas suas restrições e preferências, gere um exemplo completo em <strong>Plano alimentar</strong>.` + disc;
        }

        if (/sono|dormir|insonia|cansaco|cansado|noite/.test(q)) {
          return `Dormir o suficiente é um dos hábitos sugeridos. Sono irregular afeta energia, fome e humor. Horários mais regulares, menos telas antes de deitar e ambiente escuro costumam ajudar — sem pressão por “noite perfeita”.` + disc;
        }

        if (/exercicio|treino|academia|caminhar|movimento|esporte|atividade fisica|alongar|muscula/.test(q)) {
          return 'Aqui no site eu não monto treinos, mas converso sobre movimento no dia a dia. Para adultos, a OMS recomenda de 150 a 300 minutos por semana de atividade moderada. Comece pelo que é possível, como caminhadas curtas, e aumente aos poucos. Se houver dor, tontura ou condição de saúde, converse com um profissional antes.';
        }

        if (/obrigad|valeu|thanks|tchau|ate logo|flw|falou|ate mais|xau/.test(q)) {
          return randomOf([
            'Por nada! Quando quiser, é só chamar. Cuide-se no seu ritmo. 🌿',
            'Disponha! Volte sempre que quiser conversar ou atualizar seus dados. 🌿',
            'Foi um prazer! Até a próxima — e parabéns por cuidar de você hoje. 🌿'
          ]);
        }

        if (c.hasImc || c.hasEnergy || c.waterFilled > 0 || c.habitsDone > 0) {
          const bits = [];
          if (c.hasImc) bits.push(`IMC ${c.imc.toFixed(1).replace('.', ',')}`);
          if (c.hasEnergy) bits.push(`~${c.tdee.toLocaleString('pt-BR')} kcal`);
          bits.push(`água ${c.waterMl} ml`);
          bits.push(`hábitos ${c.habitsDone}/${c.habitsTotal}`);
          return `Entendi. Com o que sei agora: ${bits.join(' · ')}. Posso detalhar IMC, hidratação, gasto energético, hábitos ou o plano — reformule ou escolha uma dessas áreas.` + disc;
        }
        return `Posso ajudar com IMC, hidratação, hábitos, gasto energético, busca de alimentos e o plano alimentar educativo. Quanto mais dados você preencher, mais personalizada fica a conversa. O que você gostaria de entender melhor?` + disc;
      }

      function linhaResponder(pergunta) {
        const r = linhaResponderBase(pergunta);
        if (/^Posso ajudar com IMC|^Entendi\. Com o que sei agora/.test(r)) {
          return 'Sobre isso eu ainda não consigo responder por aqui. Posso ajudar com IMC, água, hábitos, gasto energético, alimentos e plano alimentar: escolha uma dessas áreas.';
        }
        return r;
      }

      function getDynamicSuggestions() {
        const c = getUserContext();
        const list = [];
        if (!c.hasImc) list.push('Por onde eu começo?');
        else list.push('O que significa meu IMC?');
        if (c.waterFilled === 0) list.push('Como está minha hidratação?');
        else list.push('Resumo do meu dia');
        list.push('Dicas de hábitos simples');
        if (c.hasEnergy) list.push('Explique meu gasto energético');
        else list.push('Como funciona o gasto energético?');
        list.push(c.dietStyle ? 'Comente meu plano alimentar' : 'Como funciona o plano alimentar?');
        if (c.hasImc) list.push('O que o IMC não mostra?');
        list.push('O que são proteínas e carboidratos?');
        if (aiOn()) list.splice(2, 0, 'Me sugira uma receita rápida para hoje');
        return list.slice(0, 5);
      }

      function renderSuggestions() {
        aiSuggestions.innerHTML = '';
        getDynamicSuggestions().forEach(s => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'ai-sug';
          b.textContent = s;
          b.onclick = () => { aiInput.value = s; updateSendState(); enviarAi(); };
          aiSuggestions.appendChild(b);
        });
      }

      // Groq (https://console.groq.com) — API rápida com cota gratuita
      // Chave: https://console.groq.com/keys
      // 1) window.HEALTH_GROQ_API_KEY = 'gsk_...'
      // 2) localStorage.setItem('health-groq-key', 'gsk_...')
      // Modelo padrão: openai/gpt-oss-20b (llama-3.3-70b foi descontinuado no plano free)
      // Outros: openai/gpt-oss-120b | qwen/qwen3.8-27b
      const groqKey = window.HEALTH_GROQ_API_KEY || localStorage.getItem('health-groq-key') || '';
      const AI_PROXY_URL = window.HEALTH_AI_PROXY || '';
      const GROQ_MODEL = window.HEALTH_GROQ_MODEL || 'openai/gpt-oss-20b';
      function aiOn() { return !!(groqKey || AI_PROXY_URL); }
      let chatHistory = [];
      try {
        const saved = localStorage.getItem('health-ai-history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) chatHistory = parsed.slice(-20);
        }
      } catch (_) {}

      const aiModeLabel = document.getElementById('aiModeLabel');

      function persistHistory() {
        try { localStorage.setItem('health-ai-history', JSON.stringify(chatHistory.slice(-20))); } catch (_) {}
      }

      function updateApiUi() {
        if (aiModeLabel) aiModeLabel.innerHTML = aiOn()
          ? '<span class="ai-status-dot on"></span>Assistente com IA'
          : '<span class="ai-status-dot"></span>Modo básico';
      }
      updateApiUi();

      function buildSystemPrompt() {
        const c = getUserContext();
        let dados = 'Dados atuais do usuário no site Health Line:\n';
        const hu = window.HealthUser && window.HealthUser.get();
        if (hu) dados += `- Cadastro: ${hu.nome}, ${hu.idade} anos, sexo ${hu.sexo === 'm' ? 'masculino' : 'feminino'}, ${hu.peso} kg, ${hu.altura} cm; objetivo: ${hu.objetivoLabel}; preferência alimentar: ${hu.estilo}${hu.restricoes && hu.restricoes.length ? '; restrições: ' + hu.restricoes.join(', ') : ''}\n`;
        if (c.hasImc) {
          dados += `- IMC: ${c.imc.toFixed(1)} (peso ${c.peso} kg, altura ${c.altura} cm, idade ${c.idade} anos)\n`;
          if (c.menor) dados += '- Menor de 20 anos: tratar IMC só como referência aproximada; avaliação oficial usa percentis.\n';
        } else dados += '- IMC ainda não calculado.\n';
        if (c.hasEnergy) dados += `- Gasto energético estimado: TMB ~${c.tmb} kcal, TDEE ~${c.tdee} kcal/dia (Mifflin-St Jeor)\n`;
        else dados += '- Gasto energético ainda não calculado.\n';
        dados += `- Hidratação hoje: ${c.waterMl} ml (meta definida pelo usuário: ${wGoal} ml)\n`;
        dados += `- Hábitos: ${c.habitsDone} de ${c.habitsTotal} concluídos hoje; sequência de ${c.streak} dia(s)\n`;
        if (c.dietStyle) {
          const styles = { brasileira: 'comida brasileira', vegetariana: 'vegetariana', vegana: 'vegana', simples: 'refeições simples' };
          const goals = { energia: 'mais energia', equilibrio: 'alimentação equilibrada', esporte: 'apoiar atividade física', rotina: 'organizar rotina' };
          dados += `- Preferência de plano: ${styles[c.dietStyle] || c.dietStyle}; objetivo: ${goals[c.dietGoal] || c.dietGoal}; refeições/dia: ${c.dietMeals || '?'}\n`;
        }
        if (c.restrictions.length) dados += `- Restrições marcadas: ${c.restrictions.join(', ')}\n`;

        return `Você é a Linha, a assistente do Health Line, e conversa com liberdade sobre QUALQUER assunto: saúde, alimentação e atividade física (sua especialidade), mas também estudos, tecnologia, programação, matemática, ciência, receitas, viagens, carreira, escrita, curiosidades, conselhos do dia a dia e tudo o mais que a pessoa perguntar. Nunca recuse um tema só por ele não ser de saúde.

COMO RESPONDER:
- Português do Brasil, tom acolhedor, natural e direto, sem enrolação e sem sermão.
- Dê o nível de detalhe que a pergunta pede: curto para perguntas simples, aprofundado e passo a passo quando pedirem ou quando o assunto for complexo.
- Seja precisa e honesta. Se não souber ou não tiver certeza, diga; nunca invente fatos, números ou fontes. Para informações atuais, use a busca na web quando disponível.
- Use os dados do usuário abaixo apenas quando forem relevantes para a pergunta; não os repita sem necessidade.
- Formate em Markdown simples: **negrito**, listas com "-", títulos curtos com "###" e blocos de código quando houver código.

CUIDADOS EM SAÚDE (só se aplicam quando o assunto for saúde):
- Informação educativa: sem diagnóstico, sem indicar medicamentos ou doses, sem dietas de emagrecimento restritivas, jejuns prolongados ou cargas máximas de treino.
- Com menores de 20 anos, não incentive perda de peso nem restrição alimentar.
- Diante de sinais de alerta (dor no peito, falta de ar, desmaio, sangramento intenso, pensamentos de se machucar), oriente a buscar atendimento imediato: SAMU 192, CVV 188 (24h, gratuito) ou pronto-socorro.

${dados}`;
      }

      // Markdown -> HTML seguro (escapa tudo antes de formatar)
      function mdToHtml(src) {
        const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const code = [];
        const t = String(src).replace(/```[\w-]*\n?([\s\S]*?)```/g, (m, c) => { code.push('<pre><code>' + esc(c.replace(/\n$/, '')) + '</code></pre>'); return '\u0000' + (code.length - 1) + '\u0000'; });
        const inline = s => esc(s)
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
          .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)&]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        const out = []; let list = null;
        const close = () => { if (list) { out.push('</' + list + '>'); list = null; } };
        t.split('\n').forEach(line => {
          let m;
          if ((m = line.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push('<li>' + inline(m[1]) + '</li>'); }
          else if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push('<li>' + inline(m[1]) + '</li>'); }
          else {
            close();
            if (/^\u0000\d+\u0000$/.test(line.trim())) out.push(line.trim());
            else if ((m = line.match(/^#{1,4}\s+(.*)/))) out.push('<p><strong>' + inline(m[1]) + '</strong></p>');
            else if (line.trim()) out.push('<p>' + inline(line) + '</p>');
          }
        });
        close();
        return out.join('').replace(/\u0000(\d+)\u0000/g, (m, i) => code[+i]);
      }

      async function chamarGroq(pergunta) {
        const system = buildSystemPrompt();

        const messages = [{ role: 'system', content: system }];
        chatHistory.slice(-16).forEach(h => {
          const role = h.role === 'user' ? 'user' : 'assistant';
          const t = String(h.text || '').trim();
          if (t) messages.push({ role, content: t });
        });
        messages.push({ role: 'user', content: pergunta });

        const body = {
          model: GROQ_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 2048
        };

        const extract = d => {
          try { return (d?.choices?.[0]?.message?.content || '').trim(); }
          catch (_) { return ''; }
        };

        if (AI_PROXY_URL) {
          let r = null;
          for (let i = 0; i < 2; i++) {
            try {
              r = await fetch(AI_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: 'groq', ...body })
              });
            } catch (_) { r = null; }
            if (r && (r.ok || r.status === 429 || r.status === 400)) break;
            await new Promise(res => setTimeout(res, 700));
          }
          if (!r) throw new Error('Sem conexão com a Groq. Verifique sua internet.');
          if (r.status === 401 || r.status === 403) throw new Error('Chave da Groq inválida ou sem permissão.');
          if (r.status === 429) throw new Error('Limite da API da Groq atingido. Tente novamente em instantes.');
          if (!r.ok) throw new Error('A Groq está indisponível no momento (' + r.status + ').');
          const d = await r.json();
          const t = d.text || extract(d);
          if (!t) throw new Error('A Groq não retornou resposta. Tente reformular a pergunta.');
          return t;
        }

        if (!groqKey) {
          throw new Error('Groq não configurado. Defina HEALTH_GROQ_API_KEY ou localStorage health-groq-key.');
        }

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + groqKey
          },
          body: JSON.stringify(body)
        });

        if (res.status === 401 || res.status === 403) {
          throw new Error('Chave da Groq inválida ou sem permissão. Confira em https://console.groq.com/keys');
        }
        if (res.status === 429) {
          throw new Error('Limite da API da Groq atingido. Tente novamente em instantes.');
        }
        if (!res.ok) {
          let detail = '';
          try { detail = (await res.json()).error?.message || ''; } catch (_) {}
          throw new Error('Falha na API da Groq (' + res.status + ')' + (detail ? ': ' + detail : '.'));
        }

        const d = await res.json();
        const t = extract(d);
        if (!t) throw new Error('A Groq não retornou resposta. Tente reformular a pergunta.');
        return t;
      }

      async function enviarAi() {
        const texto = (aiInput.value || '').trim();
        if (!texto || aiBusy) return;
        aiBusy = true;
        updateSendState();
        aiSend.classList.add('sending');

        addMsg(texto.replace(/</g, '&lt;'), 'user');
        aiInput.value = '';
        updateSendState();
        aiSuggestions.innerHTML = '';
        showTyping(true);
        refreshAiContext();

        try {
          let resposta;
          if (aiOn()) {
            resposta = mdToHtml(await chamarGroq(texto));
            chatHistory.push({ role: 'user', text: texto });
            chatHistory.push({ role: 'model', text: resposta.replace(/<[^>]+>/g, ' ') });
          } else {
            await new Promise(r => setTimeout(r, 350 + Math.random() * 400));
            resposta = linhaResponder(texto);
            chatHistory.push({ role: 'user', text: texto });
            chatHistory.push({ role: 'model', text: resposta.replace(/<[^>]+>/g, ' ') });
          }
          persistHistory();
          showTyping(false);
          addMsg(resposta, 'bot');
        } catch (err) {
          console.warn(err);
          showTyping(false);
          const local = linhaResponder(texto);
          addMsg(`<em style="color:var(--faint);font-size:12px">${(err && err.message) || 'API indisponível.'} Resposta local:</em><br><br>` + local, 'bot');
          chatHistory.push({ role: 'user', text: texto });
          chatHistory.push({ role: 'model', text: local.replace(/<[^>]+>/g, ' ') });
          persistHistory();
        } finally {
          aiBusy = false;
          aiSend.classList.remove('sending');
          updateSendState();
          renderSuggestions();
          aiInput.focus();
        }
      }

      let aiScrollLocked = false;
      function openAi() {
        aiPanel.hidden = false;
        if (aiBackdrop) {
          aiBackdrop.hidden = false;
          requestAnimationFrame(() => aiBackdrop.classList.add('show'));
        }
        requestAnimationFrame(() => {
          aiPanel.classList.add('open');
          aiFab.classList.add('open');
        });
        refreshAiContext();
        updateApiUi();
        if (!aiStarted) {
          aiStarted = true;
          if (chatHistory.length >= 2 && aiMessages.children.length === 0) {
            chatHistory.slice(-6).forEach(h => {
              if (h.role === 'user') addMsg(String(h.text).replace(/</g, '&lt;'), 'user');
              else addMsg(h.text, 'bot');
            });
          }
          if (aiMessages.children.length === 0) {
            const c = getUserContext();
            const intro = c.hasImc
              ? `Olá! Sou a <strong>Linha</strong>. Já vi seu IMC (${c.imc.toFixed(1).replace('.', ',')}) e estou aqui para tirar dúvidas com calma — sem dietas milagrosas. O que você quer saber?`
              : `Olá! Sou a <strong>Linha</strong>, sua companheira de bem-estar neste site. Posso explicar IMC, água, hábitos e o plano alimentar. Use as ferramentas e eu acompanho seus dados.`;
            const apiHint = aiOn() ? '<br><br>Pode me perguntar sobre <strong>qualquer assunto</strong>: saúde, estudos, receitas, tecnologia, o que quiser.' : '';
            addMsg(intro + apiHint + '<span class="ai-disclaimer">Informação educativa. Não substitui orientação profissional.</span>', 'bot');
          }
          renderSuggestions();
        }
        setTimeout(() => aiInput.focus(), 120);
        // Usa a trava de rolagem compartilhada (definida em conta.js) quando
        // disponível, para não conflitar com outros modais (ex.: conta/login)
        // que também travam o scroll da página. Sem ela, cai no comportamento
        // antigo direto no body.
        if (window.innerWidth <= 560) {
          aiScrollLocked = true;
          if (window.ScrollLock) window.ScrollLock.lock(); else document.body.style.overflow = 'hidden';
        } else if (aiScrollLocked) {
          aiScrollLocked = false;
          if (window.ScrollLock) window.ScrollLock.unlock(); else document.body.style.overflow = '';
        }
      }

      function closeAi() {
        aiPanel.classList.remove('open');
        aiFab.classList.remove('open');
        if (aiBackdrop) aiBackdrop.classList.remove('show');
        setTimeout(() => {
          if (!aiPanel.classList.contains('open')) {
            aiPanel.hidden = true;
            if (aiBackdrop) aiBackdrop.hidden = true;
          }
        }, 300);
        if (aiScrollLocked) {
          aiScrollLocked = false;
          if (window.ScrollLock) window.ScrollLock.unlock(); else document.body.style.overflow = '';
        } else {
          document.body.style.overflow = '';
        }
      }

      aiFab.addEventListener('click', () => {
        if (aiPanel.classList.contains('open')) closeAi();
        else openAi();
      });
      aiClose?.addEventListener('click', closeAi);
      aiBackdrop?.addEventListener('click', closeAi);
      aiSend.addEventListener('click', () => { enviarAi(); });
      aiInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarAi(); }
      });
      aiInput.addEventListener('input', updateSendState);
      updateSendState();

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && aiPanel.classList.contains('open')) closeAi();
      });

      document.getElementById('aiClearChat')?.addEventListener('click', () => {
        chatHistory = [];
        persistHistory();
        aiMessages.innerHTML = '';
        aiStarted = false;
        openAi();
      });

      document.getElementById('imcForm')?.addEventListener('submit', () => setTimeout(refreshAiContext, 50));
      document.getElementById('calForm')?.addEventListener('submit', () => setTimeout(refreshAiContext, 50));
      document.getElementById('waterGlasses')?.addEventListener('click', () => setTimeout(refreshAiContext, 50));
      document.getElementById('closeDayBtn')?.addEventListener('click', () => setTimeout(refreshAiContext, 80));
      document.getElementById('habitRows')?.addEventListener('click', () => setTimeout(refreshAiContext, 50));
      setTimeout(renderSummary, 0);
})();