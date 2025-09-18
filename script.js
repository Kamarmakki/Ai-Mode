const API_KEY = 'AIzaSyA9bBsg-IpyX_orQMhteCRITT4jXrAi3Tk';
const SEARCH_ENGINE_ID = 'f1d6e8c7515c545d4';

async function analyze() {
  const keyword = document.getElementById('keyword').value.trim();
  if (!keyword) return alert('يرجى إدخال كلمة مفتاحية');

  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');

  const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(keyword)}&num=10`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items || data.items.length === 0) throw new Error('لا توجد نتائج');

    const pages = data.items.map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    }));

    // جلب المحتوى الحقيقي من أول 3 روابط
    const contents = await Promise.all(pages.slice(0, 3).map(p => fetchText(p.link)));

    // تحليل حقيقي
    const outline = generateDynamicOutline(contents);
    const nlp = extractNLPKeywords(contents);
    const suggestedTitle = generateSmartTitle(pages.map(p => p.title));
    const suggestedMeta = generateSmartMeta(pages.map(p => p.snippet));

    displayResults(
      pages.map(p => p.title),
      suggestedTitle,
      suggestedMeta,
      outline,
      nlp
    );

  } catch (error) {
    alert('❌ حدث خطأ: ' + error.message);
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
}

// جلب النص من الصفحة (CORS-proxy)
async function fetchText(url) {
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxy);
  const data = await res.json();
  const html = data.contents;
  const text = html.replace(/<script[^>]*>.*?<\/script>/gs, '')
                   .replace(/<style[^>]*>.*?<\/style>/gs, '')
                   .replace(/<[^>]+>/g, ' ')
                   .replace(/\s+/g, ' ')
                   .trim();
  return text.slice(0, 5000); // أول 5000 حرف فقط
}

// توليد عنوان ذكي
function generateSmartTitle(titles) {
  const common = getCommonPhrases(titles);
  return `دليل ${common} | أفضل النصائح والمقارنات لعام 2025`;
}

// توليد وصف ميتا ذكي
function generateSmartMeta(snippets) {
  const combined = snippets.join(' ').slice(0, 200);
  return `اكتشف ${combined}... دليل شامل يشمل المميزات، العيوب، والأسعار لعام 2025.`;
}

// توليد أوت لاين ديناميكي
function generateDynamicOutline(texts) {
  const headings = [];
  texts.forEach(text => {
    const lines = text.split('\n').filter(l => l.length > 20 && l.length < 80);
    lines.slice(0, 6).forEach(l => headings.push(l.trim()));
  });

  const unique = [...new Set(headings)].slice(0, 6);
  return unique.map((h, i) => `H${i % 2 + 2}: ${h}`).join('\n');
}

// استخراج كلمات NLP ذكية
function extractNLPKeywords(texts) {
  const all = texts.join(' ').split(' ');
  const freq = {};
  all.forEach(w => {
    const clean = w.replace(/[،.؟!]/g, '');
    if (clean.length > 4 && !isStopWord(clean)) {
      freq[clean] = (freq[clean] || 0) + 1;
    }
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(e => e[0])
    .join('، ');
}

// كلمات مكررة غير مفيدة
function isStopWord(word) {
  const stops = ['التي', 'الذي', 'هذا', 'تكون', 'يمكن', 'أو', 'في', 'من', 'إلى', 'على', 'بعد', 'قبل'];
  return stops.includes(word);
}

// العبارات المشتركة
function getCommonPhrases(titles) {
  const words = titles.join(' ').split(' ');
  const freq = {};
  words.forEach(w => {
    const clean = w.replace(/[،.؟!]/g, '');
    if (clean.length > 3) freq[clean] = (freq[clean] || 0) + 1;
  });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]).join(' ');
}

// عرض النتائج
function displayResults(titles, suggestedTitle, suggestedMeta, outline, nlpKeywords) {
  const ul = document.getElementById('titles');
  ul.innerHTML = '';
  titles.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t;
    ul.appendChild(li);
  });

  document.getElementById('suggestedTitle').value = suggestedTitle;
  document.getElementById('suggestedMeta').value = suggestedMeta;
  document.getElementById('outline').value = outline;
  document.getElementById('nlpKeywords').value = nlpKeywords;

  document.getElementById('results').classList.remove('hidden');
}
