// script.js - المنطق الأساسي للتطبيق

// دالة رئيسية لبدء التحليل عند النقر على الزر
document.getElementById('analyzeBtn').addEventListener('click', initiateAnalysis);

// دالة لبدء عملية التحليل
async function initiateAnalysis() {
    const keywordInput = document.getElementById('keywordInput');
    const errorMessage = document.getElementById('errorMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsSection = document.getElementById('resultsSection');

    // إعادة تعيين رسائل الخطأ
    errorMessage.textContent = '';
    // إخفاء قسم النتائج
    resultsSection.style.display = 'none';

    const keyword = keywordInput.value.trim();

    if (!keyword) {
        errorMessage.textContent = '❌ يرجى إدخال كلمة مفتاحية قبل بدء التحليل.';
        return;
    }

    // تعطيل الزر وإظهار مؤشر التحميل
    const analyzeBtn = document.getElementById('analyzeBtn');
    analyzeBtn.disabled = true;
    loadingIndicator.style.display = 'block';

    try {
        // الخطوة 1: جلب نتائج البحث من Google
        const searchResults = await fetchSearchResults(keyword);

        if (!searchResults || searchResults.length === 0) {
            throw new Error('لم يتم العثور على نتائج بحث لهذه الكلمة المفتاحية.');
        }

        // الخطوة 2: تحليل النتائج لاستخراج البيانات المطلوبة
        const analysisData = analyzeSearchResults(searchResults);

        // الخطوة 3: عرض النتائج في واجهة المستخدم
        displayAnalysisResults(analysisData);

        // إظهار قسم النتائج
        resultsSection.style.display = 'block';

    } catch (error) {
        console.error('Error during analysis:', error);
        errorMessage.textContent = `❌ ${error.message || 'حدث خطأ غير متوقع أثناء التحليل.'}`;
    } finally {
        // إعادة تمكين الزر وإخفاء مؤشر التحميل
        analyzeBtn.disabled = false;
        loadingIndicator.style.display = 'none';
    }
}

// دالة لجلب نتائج البحث من Google Custom Search JSON API
async function fetchSearchResults(keyword) {
    const API_KEY = 'AIzaSyA9bBsg-IpyX_orQMhteCRITT4jXrAi3Tk'; // مفتاحك
    const CX = 'f1d6e8c7515c545d4'; // معرّف محرك البحث الخاص بك
    const MAX_RESULTS = 10; // نريد فقط 10 نتائج

    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(keyword)}&num=${MAX_RESULTS}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            // إذا كان هناك خطأ في الاستجابة (مثل 403، 429، 500)
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`فشل الاتصال بخادم جوجل: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
        }

        const data = await response.json();
        return data.items || []; // إرجاع مصفوفة النتائج

    } catch (fetchError) {
        // معالجة أخطاء الشبكة مثل TypeError: Failed to fetch
        if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
            throw new Error('فشل في الاتصال بخادم جوجل. تحقق من اتصال الإنترنت أو جرب مرة أخرى لاحقًا.');
        }
        throw fetchError; // إعادة رمي الأخطاء الأخرى
    }
}

// دالة لتحليل نتائج البحث واستخراج البيانات المطلوبة
function analyzeSearchResults(results) {
    // 1. استخراج الروابط العشرة
    const topLinks = results.map(item => ({
        title: item.title || 'بدون عنوان',
        link: item.link || '#'
    }));

    // 2. استخراج الكلمات والعبارات ذات الصلة (من العناوين وأوصاف النتائج)
    const relatedTerms = extractRelatedTerms(results);

    // 3. توليد عنوان جذاب (بناءً على العناوين المتصدرة)
    const suggestedTitle = generateSuggestedTitle(results);

    // 4. توليد وصف Meta (بناءً على أوصاف النتائج)
    const metaDescription = generateMetaDescription(results);

    // 5. توليد هيكل المقال (H2, H3) - هذا مثال مبسط
    const articleOutline = generateArticleOutline(results);

    // 6. استخراج 30 عبارة NLP (من العناوين والأوصاف والمحتوى المقتبس)
    const nlpPhrases = extractNLPPhrases(results);

    return {
        topLinks,
        relatedTerms,
        suggestedTitle,
        metaDescription,
        articleOutline,
        nlpPhrases
    };
}

// دالة مساعدة لاستخراج الكلمات والعبارات ذات الصلة
function extractRelatedTerms(results) {
    const terms = new Set(); // استخدام Set لتجنب التكرار

    results.forEach(item => {
        // تقسيم العنوان إلى كلمات
        if (item.title) {
            item.title.split(/\s+/).forEach(word => {
                if (word.length > 3) { // تجاهل الكلمات القصيرة جدًا
                    terms.add(word.replace(/[^\w\s]/gi, '')); // إزالة علامات الترقيم
                }
            });
        }
        // تقسيم الوصف إلى كلمات
        if (item.snippet) {
            item.snippet.split(/\s+/).forEach(word => {
                if (word.length > 3) {
                    terms.add(word.replace(/[^\w\s]/gi, ''));
                }
            });
        }
    });

    // تحويل Set إلى مصفوفة وفرزها
    return Array.from(terms).sort((a, b) => b.length - a.length).slice(0, 20); // نأخذ 20 الأكثر طولاً كمثال
}

// دالة مساعدة لتوليد عنوان جذاب
function generateSuggestedTitle(results) {
    if (results.length === 0) return 'لا يمكن توليد عنوان بدون نتائج بحث.';

    // نأخذ أول 3 عناوين ونحاول دمجها أو اختيار الأطول
    const titles = results.slice(0, 3).map(item => item.title).filter(title => title);
    if (titles.length === 0) return 'عنوان مقترح بناءً على تحليل المنافسين';

    // طريقة بسيطة: نأخذ العنوان الأول ونضيف له "دليل شامل" أو "2025"
    let baseTitle = titles[0];
    if (baseTitle.length < 50) {
        baseTitle += ' - دليل شامل';
    }
    return baseTitle;
}

// دالة مساعدة لتوليد وصف Meta
function generateMetaDescription(results) {
    if (results.length === 0) return 'وصف Meta مُحسّن لجذب الزوار.';

    // نأخذ أوصاف أول نتيجتين ونجمعهما
    const snippets = results.slice(0, 2).map(item => item.snippet).filter(snippet => snippet);
    if (snippets.length === 0) return 'اكتشف أفضل المحتوى حول هذا الموضوع من خلال تحليلنا الشامل للمنافسين.';

    let desc = snippets.join(' ').substring(0, 155); // نقصّر ليتناسب مع حدود Meta Description
    if (desc.length > 150) {
        desc = desc.substring(0, 150) + '...';
    }
    return desc;
}

// دالة مساعدة لتوليد هيكل المقال (H2, H3)
function generateArticleOutline(results) {
    let outline = '<h2>مقدمة</h2>\n<p>...</p>\n\n';

    // ننشئ عناوين فرعية H2 من العناوين الرئيسية للنتائج
    results.slice(0, 5).forEach((item, index) => {
        if (item.title) {
            outline += `<h2>${item.title}</h2>\n`;
            outline += `<h3>تفاصيل ${index + 1}</h3>\n<p>...</p>\n\n`;
        }
    });

    outline += '<h2>الخاتمة</h2>\n<p>...</p>';
    return outline;
}

// دالة مساعدة لاستخراج عبارات NLP
function extractNLPPhrases(results) {
    const phrases = [];

    results.forEach(item => {
        // نأخذ جمل من العنوان
        if (item.title) {
            const titleSentences = item.title.split(/[.!?،]/).filter(s => s.trim().length > 10);
            phrases.push(...titleSentences.map(s => s.trim()));
        }
        // نأخذ جمل من الوصف
        if (item.snippet) {
            const snippetSentences = item.snippet.split(/[.!?،]/).filter(s => s.trim().length > 10);
            phrases.push(...snippetSentences.map(s => s.trim()));
        }
    });

    // نزيل التكرارات ونعيد أول 30
    return [...new Set(phrases)].slice(0, 30);
}

// دالة لعرض نتائج التحليل في واجهة المستخدم
function displayAnalysisResults(data) {
    // عرض الروابط العشرة
    const topLinksContainer = document.getElementById('topLinksContainer');
    topLinksContainer.innerHTML = data.topLinks.map(item =>
        `<div class="link-item"><a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a></div>`
    ).join('');

    // عرض الكلمات ذات الصلة
    const relatedTermsContainer = document.getElementById('relatedTermsContainer');
    relatedTermsContainer.innerHTML = data.relatedTerms.map(term =>
        `<span class="term-tag">${term}</span>`
    ).join('');

    // عرض العنوان المقترح
    document.getElementById('suggestedTitleContainer').textContent = data.suggestedTitle;

    // عرض وصف الميتا
    document.getElementById('metaDescriptionContainer').textContent = data.metaDescription;

    // عرض هيكل المقال
    document.getElementById('articleOutlineContainer').textContent = data.articleOutline;

    // عرض عبارات NLP
    const nlpPhrasesContainer = document.getElementById('nlpPhrasesContainer');
    nlpPhrasesContainer.innerHTML = data.nlpPhrases.map(phrase =>
        `<div class="nlp-phrase">${phrase}</div>`
    ).join('');
}