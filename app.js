(function () {
  'use strict';

  /* ---------- Config ---------- */
  var KEY = 'smart-expense-tracker.v1';
  var CATS = {
    'Food':          { icon: '🍽️', color: '#ea580c', kw: ['food','zomato','swiggy','restaurant','dinner','lunch','breakfast','cafe','chai','tea','coffee','snack','biryani','pizza','burger','dhaba','canteen','mess','grocery','groceries','vegetable','fruit','milk','kirana','bigbasket','blinkit','zepto'] },
    'Transport':     { icon: '🚌', color: '#2563eb', kw: ['petrol','diesel','fuel','bus','metro','auto','cab','uber','ola','rapido','taxi','train','irctc','fastag','toll','parking','bike','service','puncture','ticket'] },
    'Shopping':      { icon: '🛍️', color: '#c026d3', kw: ['amazon','flipkart','myntra','meesho','clothes','shirt','jeans','shoes','shopping','mall','gift','watch','bag'] },
    'Bills':         { icon: '💡', color: '#ca8a04', kw: ['recharge','electricity','bill','wifi','broadband','jio','airtel','vi ','rent','gas','cylinder','water','emi','loan','insurance','dth','mobile'] },
    'Health':        { icon: '💊', color: '#dc2626', kw: ['medicine','doctor','hospital','pharmacy','medical','clinic','dental','test','lab','gym','protein'] },
    'Education':     { icon: '📚', color: '#7c3aed', kw: ['book','books','fees','fee','course','tuition','exam','form','coaching','notes','stationery','pen','udemy','college','school','neet','cuet'] },
    'Entertainment': { icon: '🎬', color: '#db2777', kw: ['movie','netflix','hotstar','spotify','youtube','game','gaming','pvr','concert','party','subscription','prime'] },
    'Travel':        { icon: '🏔️', color: '#0d9488', kw: ['trek','trip','hotel','hostel','camp','flight','travel','tour','homestay','permit','guide'] },
    'Other':         { icon: '📦', color: '#64748b', kw: [] }
  };
  var INCOME = { icon: '💰', color: '#0f766e' };

  /* ---------- Helpers ---------- */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function ym(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function inr(n) { return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function prettyDate(s) { var p = s.split('-'); return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function monthName(m) { var p = m.split('-'); return new Date(p[0], p[1] - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }); }
  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- Storage ---------- */
  var state = load();
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.tx)) return s; } catch (e) {}
    return { tx: [], budget: 0 };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast('Could not save. Storage is full or blocked.'); } }

  /* ---------- Smart categorizer ---------- */
  function guess(note) {
    var text = ' ' + note.toLowerCase() + ' ';
    var best = 'Other', hits = 0;
    Object.keys(CATS).forEach(function (name) {
      var n = 0;
      CATS[name].kw.forEach(function (k) { if (text.indexOf(k) !== -1) n++; });
      if (n > hits) { hits = n; best = name; }
    });
    return best;
  }

  /* ---------- Setup form ---------- */
  var catSel = $('#cat'), filterSel = $('#filterCat');
  catSel.innerHTML = '<option value="auto">Auto-detect</option>' +
    Object.keys(CATS).map(function (c) { return '<option>' + c + '</option>'; }).join('');
  filterSel.innerHTML = '<option value="all">All categories</option><option>Income</option>' +
    Object.keys(CATS).map(function (c) { return '<option>' + c + '</option>'; }).join('');
  $('#date').value = ymd(new Date());
  $('#repMonth').value = ym(new Date());
  $('#budgetInput').value = state.budget || '';

  function currentType() { return $('input[name=type]:checked').value; }

  function updateHint() {
    var hint = $('#catHint');
    if (currentType() === 'income') { catSel.disabled = true; hint.textContent = 'Saved under Income.'; return; }
    catSel.disabled = false;
    var note = $('#note').value.trim();
    hint.textContent = (catSel.value === 'auto' && note) ? 'Will be saved as ' + guess(note) + '.' : '';
  }
  $('#note').addEventListener('input', updateHint);
  catSel.addEventListener('change', updateHint);
  $$('input[name=type]').forEach(function (r) { r.addEventListener('change', updateHint); });

  $('#addForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var amount = parseFloat($('#amount').value);
    if (!(amount > 0)) { toast('Enter an amount greater than 0.'); return; }
    var type = currentType(), note = $('#note').value.trim();
    var cat = type === 'income' ? 'Income' : (catSel.value === 'auto' ? guess(note) : catSel.value);
    state.tx.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: type, amount: Math.round(amount * 100) / 100, cat: cat, note: note, date: $('#date').value
    });
    save();
    $('#amount').value = ''; $('#note').value = ''; catSel.value = 'auto'; updateHint();
    toast('Saved under ' + cat);
    renderAll();
  });

  $('#budgetForm').addEventListener('submit', function (e) {
    e.preventDefault();
    state.budget = Math.max(0, parseFloat($('#budgetInput').value) || 0);
    save(); toast(state.budget ? 'Budget saved' : 'Budget removed'); renderHome();
  });

  /* ---------- Tabs ---------- */
  $$('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.tabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
      $$('.view').forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + b.dataset.view); });
      if (b.dataset.view === 'reports') renderReports();
      window.scrollTo(0, 0);
    });
  });

  /* ---------- Rendering ---------- */
  function sum(list) { return list.reduce(function (a, t) { return a + t.amount; }, 0); }
  function inMonth(m) { return state.tx.filter(function (t) { return t.date.slice(0, 7) === m; }); }
  function iconFor(t) { return t.type === 'income' ? INCOME.icon : (CATS[t.cat] || CATS.Other).icon; }

  function rowHtml(t, withDelete) {
    return '<li><div class="dot">' + iconFor(t) + '</div>' +
      '<div class="meta"><b>' + esc(t.note || t.cat) + '</b><span>' + esc(t.cat) + ' · ' + prettyDate(t.date) + '</span></div>' +
      '<span class="amt ' + (t.type === 'income' ? 'in' : 'out') + '">' + (t.type === 'income' ? '+' : '−') + inr(t.amount) + '</span>' +
      (withDelete ? '<button class="del" data-id="' + t.id + '" aria-label="Delete transaction">✕</button>' : '') + '</li>';
  }

  function sorted(list) {
    return list.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1); });
  }

  function renderHome() {
    var m = ym(new Date());
    $('#monthLabel').textContent = monthName(m);
    var spent = sum(inMonth(m).filter(function (t) { return t.type === 'expense'; }));
    $('#hSpent').textContent = inr(spent);
    var fill = $('#budgetFill');
    if (state.budget > 0) {
      var left = state.budget - spent, pct = Math.min(100, spent / state.budget * 100);
      $('#hLeft').textContent = left >= 0 ? inr(left) : inr(-left) + ' over';
      fill.style.width = pct + '%';
      fill.className = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : '';
    } else {
      $('#hLeft').textContent = '–'; fill.style.width = '0'; fill.className = '';
    }
    var recent = sorted(state.tx).slice(0, 5);
    $('#recentList').innerHTML = recent.length ? recent.map(function (t) { return rowHtml(t, false); }).join('')
      : '<li class="empty">No transactions yet. Add your first one above.</li>';
  }

  function renderHistory() {
    var q = $('#search').value.trim().toLowerCase(), c = filterSel.value;
    var list = sorted(state.tx).filter(function (t) {
      return (c === 'all' || t.cat === c) && (!q || (t.note + ' ' + t.cat).toLowerCase().indexOf(q) !== -1);
    });
    $('#historyList').innerHTML = list.length ? list.map(function (t) { return rowHtml(t, true); }).join('')
      : '<li class="empty">Nothing matches.</li>';
  }
  $('#search').addEventListener('input', renderHistory);
  filterSel.addEventListener('change', renderHistory);
  $('#historyList').addEventListener('click', function (e) {
    var id = e.target.getAttribute && e.target.getAttribute('data-id');
    if (!id) return;
    if (!confirm('Delete this transaction?')) return;
    state.tx = state.tx.filter(function (t) { return t.id !== id; });
    save(); toast('Deleted'); renderAll();
  });

  var pie, bar;
  function renderReports() {
    var m = $('#repMonth').value || ym(new Date());
    var list = inMonth(m);
    var inc = sum(list.filter(function (t) { return t.type === 'income'; }));
    var exp = list.filter(function (t) { return t.type === 'expense'; });
    var spent = sum(exp);
    $('#rIncome').textContent = inr(inc);
    $('#rExpense').textContent = inr(spent);
    $('#rSaved').textContent = inr(inc - spent);

    // category totals
    var totals = {};
    exp.forEach(function (t) { totals[t.cat] = (totals[t.cat] || 0) + t.amount; });
    var names = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; });

    // insight
    var ins = $('#insight');
    if (!exp.length) ins.textContent = 'No expenses recorded for ' + monthName(m) + '.';
    else {
      var top = names[0], text = 'Biggest spend: ' + top + ' (' + inr(totals[top]) + ', ' + Math.round(totals[top] / spent * 100) + '% of expenses).';
      if (inc > 0) text += ' You kept ' + Math.max(0, Math.round((inc - spent) / inc * 100)) + '% of your income.';
      var days = new Date(m.slice(0, 4), m.slice(5, 7), 0).getDate();
      text += ' Average ' + inr(spent / days) + ' per day.';
      ins.textContent = text;
    }

    $('#catBreakdown').innerHTML = names.length ? names.map(function (n) {
      var c = CATS[n] || CATS.Other;
      return '<li><div class="dot">' + c.icon + '</div><div class="meta"><b>' + esc(n) + '</b></div>' +
        '<span class="pct">' + Math.round(totals[n] / spent * 100) + '%</span><span class="amt">' + inr(totals[n]) + '</span></li>';
    }).join('') : '';

    if (typeof Chart === 'undefined') return; // offline: lists still work
    var ink = getComputedStyle(document.body).color;
    Chart.defaults.color = ink;
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;

    if (pie) pie.destroy();
    pie = new Chart($('#pieChart'), {
      type: 'doughnut',
      data: { labels: names, datasets: [{ data: names.map(function (n) { return totals[n]; }), backgroundColor: names.map(function (n) { return (CATS[n] || CATS.Other).color; }), borderWidth: 0 }] },
      options: { maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } }
    });

    // last 6 months
    var labels = [], incs = [], exps = [], base = new Date(m.slice(0, 4), m.slice(5, 7) - 1, 1);
    for (var i = 5; i >= 0; i--) {
      var d = new Date(base.getFullYear(), base.getMonth() - i, 1), key = ym(d), L = inMonth(key);
      labels.push(d.toLocaleDateString('en-IN', { month: 'short' }));
      incs.push(sum(L.filter(function (t) { return t.type === 'income'; })));
      exps.push(sum(L.filter(function (t) { return t.type === 'expense'; })));
    }
    if (bar) bar.destroy();
    bar = new Chart($('#barChart'), {
      type: 'bar',
      data: { labels: labels, datasets: [
        { label: 'Income', data: incs, backgroundColor: '#0f9d8f', borderRadius: 4 },
        { label: 'Expenses', data: exps, backgroundColor: '#e2692f', borderRadius: 4 }
      ] },
      options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(128,128,128,.2)' } }, x: { grid: { display: false } } } }
    });
  }
  $('#repMonth').addEventListener('change', renderReports);

  function renderAll() { renderHome(); renderHistory(); if ($('#view-reports').classList.contains('active')) renderReports(); }

  /* ---------- Data tools ---------- */
  $('#exportBtn').addEventListener('click', function () {
    if (!state.tx.length) { toast('Nothing to export yet.'); return; }
    var rows = [['Date', 'Type', 'Category', 'Note', 'Amount']].concat(sorted(state.tx).map(function (t) {
      return [t.date, t.type, t.cat, t.note, t.amount];
    }));
    var csv = rows.map(function (r) {
      return r.map(function (v) { v = String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'expenses-' + ymd(new Date()) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
  });

  $('#sampleBtn').addEventListener('click', function () {
    if (state.tx.length && !confirm('Add sample entries to your existing data?')) return;
    var samples = [['expense', 'Zomato dinner', 420], ['expense', 'Metro recharge', 300], ['expense', 'Jio recharge', 299],
      ['expense', 'Amazon headphones', 1299], ['expense', 'Petrol', 500], ['expense', 'Medicine', 180],
      ['expense', 'Coaching fees', 2500], ['expense', 'Trek permit', 600], ['income', 'Pocket money', 8000]];
    var now = new Date();
    samples.forEach(function (s, i) {
      var d = new Date(now.getFullYear(), now.getMonth() - (i % 3), Math.min(1 + i * 2, 27));
      state.tx.push({ id: 's' + Date.now().toString(36) + i, type: s[0], amount: s[2], cat: s[0] === 'income' ? 'Income' : guess(s[1]), note: s[1], date: ymd(d) });
    });
    save(); toast('Sample data added'); renderAll(); renderReports();
  });

  $('#clearBtn').addEventListener('click', function () {
    if (!confirm('Delete ALL transactions and budget? This cannot be undone.')) return;
    state = { tx: [], budget: 0 }; save(); $('#budgetInput').value = ''; toast('All data deleted'); renderAll(); renderReports();
  });

  updateHint();
  renderAll();
})();
