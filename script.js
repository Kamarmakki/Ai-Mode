const API_KEY = 'AIzaSyA9bBsg-IpyX_orQMhteCRITT4jXrAi3Tk';
const SEARCH_ENGINE_ID = 'f1d6e8c7515c545d4';

async function analyze() {
  const keyword = document.getElementById('keyword').value.trim();
  if (!keyword) return alert('أدخل كلمة مفتاحية');

  toggleLoading(true);
  try {
    const data  = await googleSearch(keyword);
    const items = data.items;

    const titles   = items.map(i => i.title);
    const snippets = items.map(i => i.snippet);
    const links    = items.map(i => i.link);

    const smartTitle = cleanTitle(titles, keyword);
    const smartMeta  = cleanMeta(snippets);
    const nlpWords   = extractNLP(snippets);

    displayResults(titles, links, smartTitle, smartMeta, nlpWords);
  } catch (e) {
    alert('❌ ' + e.message);
  } finally {
    toggleLoading(false);
  }
}

/* ---------- البحث الأساسي ---------- */
async function googleSearch(q) {
  const url = `https://www.googleapis.com/customsearch/v1` +
              `?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}` +
              `&q=${encodeURIComponent(q)}&num=10`;
  const r = await fetch(url);
  const d = await r.json();
  if (!d.items?.length) throw new Error('لا توجد نتائج');
  return d;
}

/* ---------- عنوان نظيف ---------- */
function cleanTitle(titles, kw) {
  const glue = frequentPhrase(titles, 3);
  return `${kw} | ${glue}`;
}

/* ---------- وصف خالٍ من الكليشيهات ---------- */
function cleanMeta(snippets) {
  const raw = snippets.join(' ').replace(/\s+/g, ' ').trim();
  const withoutBuzz = removeBuzz(raw);
  return sliceSentence(withoutBuzz, 160);
}

function removeBuzz(text) {
  const buzz = [
    /تعرف على/g, /اكتشف/g, /تعلّم/g, /كل ما تحتاج/g,
    /دليل شامل/g, /افضل النصائح/g, /موثوق/g
  ];
  buzz.forEach(b => text = text.replace(b, ''));
  return text.trim();
}

function sliceSentence(text, max) {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(' ', max);
  return (cut > 0 ? text.slice(0, cut) : text.slice(0, max)) + '…';
}

/* ---------- كلمات NLP ---------- */
function extractNLP(snippets) {
  const words = snippets.join(' ').split(' ');
  const freq = {};
  words.forEach(w => {
    const c = w.replace(/[،.؟!]/g, '');
    if (c.length > 3 && !isStop(c)) freq[c] = (freq[c] || 0) + 1;
  });
  return Object.entries(freq)
               .sort((a, b) => b[1] - a[1])
               .slice(0, 30)
               .map(e => e[0])
               .join('، ');
}

function frequentPhrase(arr, n) {
  const f = {};
  arr.join(' ').split(' ').forEach(w => {
    const c = w.replace(/[،.؟!]/g, '');
    if (c.length > 3) f[c] = (f[c] || 0) + 1;
  });
  return Object.entries(f)
               .sort((a, b) => b[1] - a[1])
               .slice(0, n)
               .map(e => e[0])
               .join(' ');
}

function isStop(w) {
  const s = ['التي', 'الذي', 'هذا', 'تكون', 'يمكن', 'أو', 'في', 'من', 'إلى', 'على'];
  return s.includes(w);
}

/* ---------- عرض النتائج ---------- */
function displayResults(titles, links, smartTitle, smartMeta, nlpList) {
  // عناوين + روابط
  const ul = document.getElementById('topLinks');
  ul.innerHTML = '';
  links.forEach((lnk, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${lnk}" target="_blank" rel="noopener">${titles[i]}</a>`;
    ul.appendChild(li);
  });

  document.getElementById('suggestedTitle').value = smartTitle;
  document.getElementById('suggestedMeta').value  = smartMeta;
  document.getElementById('nlpKeywords').value    = nlpList;

  toggleLoading(false);
}

function toggleLoading(on) {
  document.getElementById('loading').classList.toggle('hidden', !on);
  document.getElementById('results').classList.toggle('hidden', on);
}
