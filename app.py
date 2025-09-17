import requests, json, re, textwrap, os
from collections import Counter
from urllib.parse import urlparse

API_BASE = "https://api.openwebninja.com/google-ai-mode/ai-mode"
API_KEY  = "ak_is7pbn7gl4g8mbaupwynpkfbr6lm9yfh8iurpdpuk4noou1"

STOP_FLAIR = {"تعرف","تعلم","اكتشف","احصل","لا تفوّت","سرّ","خدعة","مذهل","رائع","أفضل 10","best","discover","amazing","top 10","secret","trick"}

def clean_flair(text):
    words = text.split()
    return " ".join(w for w in words if w.lower() not in STOP_FLAIR)

def build_meta(text):
    return textwrap.shorten(clean_flair(text), 155, placeholder="...")

def build_snippet(text):
    sent = re.split(r'[.؟!]', text)[0]
    return textwrap.shorten(clean_flair(sent), 155, placeholder="...")

def nlp_keywords(text):
    bigrams = re.findall(r'\b\w+\s\w+\b', text.lower())
    freq = Counter(bigrams)
    cleaned = [b for b in freq if not any(f in b for f in STOP_FLAIR)]
    return "، ".join(cleaned[:12])

def suggest_title(text):
    words = text.split()
    top = Counter(words).most_common(3)
    return f"{top[0][0]} {top[1][0]} {top[2][0]}: اختيارك حسب الاختبار والتجربة"

def extract_outline(text):
    sentences = re.split(r'[.؟!]', text)
    outline = []
    for sent in sentences[:6]:
        if len(sent.strip()) > 20:
            outline.append({"tag": "h3", "text": sent.strip()[:70]})
    return outline

# ---------- المسار الجديد (الوكيل) ----------
@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    data   = request.get_json(silent=True) or {}
    keyword= data.get('keyword','').strip()
    lang   = data.get('lang','ar')
    gl     = data.get('gl','sa')

    if not keyword:
        return jsonify({'error':'أدخل كلمة مفتاحية'}), 400

    params = {'prompt':keyword, 'hl':lang, 'gl':gl, 'x-api-key':API_KEY}
    r = requests.get(API_BASE, params=params, timeout=15)

    if r.status_code != 200:
        return jsonify({'error':'خطأ في الاستجابة من الخادم الخارجي'}), 502

    ans   = r.json().get('answer','')
    refs  = r.json().get('references',[])

    result = {
        'suggested_title': clean_flair(suggest_title(ans)),
        'meta_description': build_meta(ans),
        'snippet_text': build_snippet(ans),
        'nlp_keywords': nlp_keywords(ans),
        'featured_snippets': list({urlparse(u).hostname for u in refs}),
        'outline': extract_outline(ans)
    }
    return jsonify(result)