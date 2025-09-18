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

    const titles = data.items.map(item => item.title);
    const snippets = data.items.map(item => item.snippet);

    // عنوان مقترح
    const suggestedTitle = generateTitle(titles);

    // وصف ميتا
    const suggestedMeta = generateMeta(snippets);

    // هيكل المقال
    const outline = generateOutline(keyword, titles);

    // كلمات NLP
    const nlpKeywords = extractNLP(snippets);

    // عرض النتائج
    displayResults(titles, suggestedTitle, suggestedMeta, outline, nlpKeywords);

  } catch (error) {
    alert('❌ حدث خطأ: ' + error.message);
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
}

function generateTitle(titles) {
  const words = titles.join(' ').split(' ');
  const freq = {};
  words.forEach(w => {
    const clean = w.replace(/[،.؟!]/g, '');
    if (clean.length > 3) freq[clean] = (freq[clean] || 0) + 1;
  });
  const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
  return `دليل شامل: ${topWords.join(' ')} - كل ما تحتاج معرفته`;
}

function generateMeta(snippets) {
  const combined = snippets.join(' ').slice(0, 150);
  return `اكتشف أفضل المعلومات حول الموضوع. ${combined}... اقرأ المزيد لتحصل على دليل شامل وموثوق.`;
}

function generateOutline(keyword, titles) {
  return `
H2: مقدمة عن ${keyword}
H2: أهمية ${keyword}
H3: لماذا يهتم الجميع بـ ${keyword}؟
H2: أفضل الخيارات لـ ${keyword}
H3: المعايير المستخدمة في التقييم
H2: مقارنة بين الخيارات المتاحة
H2: الخلاصة والتوصيات
  `.trim();
}

function extractNLP(snippets) {
  const words = snippets.join(' ').split(' ');
  const nlp = [...new Set(words.filter(w => w.length > 4))].slice(0, 30);
  return nlp.join('، ');
}

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