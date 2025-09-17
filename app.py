import re, textwrap, json, requests
from collections import Counter
from urllib.parse import urlparse, quote
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required
from flask_babel import Babel, gettext as _

app = Flask(__name__)
app.config['SECRET_KEY'] = 'kamar-secret-2025'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///kamar.db'
app.config['BABEL_DEFAULT_LOCALE'] = 'ar'

db   = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
babel = Babel(app)

# --------------------------------------------------
# نماذج قاعدة البيانات
# --------------------------------------------------
class User(UserMixin, db.Model):
    id       = db.Column(db.Integer, primary_key=True)
    email    = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

class Result(db.Model):
    id       = db.Column(db.Integer, primary_key=True)
    user_id  = db.Column(db.Integer, db.ForeignKey('user.id'))
    keyword  = db.Column(db.String(200))
    lang     = db.Column(db.String(5))
    data     = db.Column(db.Text)

with app.app_context():
    db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@babel.localeselector
def get_locale():
    return session.get('lang', 'ar')

# --------------------------------------------------
# صفحات النظام
# --------------------------------------------------
@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        email, pwd = request.form['email'], request.form['password']
        if User.query.filter_by(email=email).first():
            flash(_('Email already registered'))
            return redirect(url_for('register'))
        user = User(email=email, password=pwd)
        db.session.add(user); db.session.commit()
        login_user(user)
        return redirect(url_for('dashboard'))
    return render_template('register.html')

@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        user = User.query.filter_by(email=request.form['email'], password=request.form['password']).first()
        if user:
            login_user(user)
            return redirect(url_for('dashboard'))
        flash(_('Invalid credentials'))
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

# --------------------------------------------------
# Google Custom Search API
# --------------------------------------------------
def google_custom_search(query, lang='ar', num=10):
    API_KEY = "AIzaSyA9bBsg-IpyX_orQMhteCRITT4jXrAi3Tk"   # ضع API Key تبعك
    CX      = "f1d6e8c7515c545d4"                        # Search Engine ID

    url = f"https://www.googleapis.com/customsearch/v1?key={API_KEY}&cx={CX}&q={quote(query)}&lr=lang_{lang}&num={num}"
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        raise RuntimeError(f'فشل الاتصال بـ Google API: {str(e)}')

    items = []
    for it in data.get("items", []):
        items.append({
            "title": it.get("title", ""),
            "snippet": it.get("snippet", ""),
            "link": it.get("link", "")
        })
    return items

# --------------------------------------------------
#  endpoint التحليل
# --------------------------------------------------
@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    payload = request.get_json(silent=True) or {}
    keyword = payload.get('keyword', '').strip()
    lang    = payload.get('lang', 'ar')
    if not keyword:
        return jsonify({'error': 'أدخل كلمة مفتاحية'}), 400

    try:
        items = google_custom_search(keyword, lang=lang, num=10)
    except Exception as e:
        return jsonify({'error': str(e)}), 502

    if not items:
        return jsonify({'error': 'لم يتم العثور على نتائج'}), 404

    # دمج النصوص للتحليل
    full_text = ' '.join([it['title'] + ' ' + it['snippet'] for it in items])
    refs      = [it['link'] for it in items]

    # معالجة النصوص
    stop = {"تعرف","تعلم","اكتشف","احصل","لا تفوّت","سرّ","خدعة","مذهل","رائع",
            "أفضل 10","best","discover","amazing","top 10","secret","trick"}
    def clean(t): return ' '.join(w for w in t.split() if w.lower() not in stop)
    def build_meta(t): return textwrap.shorten(clean(t), 155, placeholder='...')
    def build_snip(t): return textwrap.shorten(clean(t.split('.')[0]), 155, placeholder='...')
    def nlp_kw(t):
        bi = re.findall(r'\b\w+\s\w+\b', t.lower())
        return '، '.join([w for w,_ in Counter(bi).most_common(12)])
    def outline(t):
        sents = [s.strip() for s in re.split(r'[.؟!]', t) if len(s.strip()) > 20][:6]
        return [{'tag':'h3','text':s[:70]} for s in sents]
    def title(t):
        w = t.split()
        if len(w) < 3: return keyword + ': دليلك الشامل'
        top = Counter(w).most_common(3)
        return f"{top[0][0]} {top[1][0]} {top[2][0]}: اختيارك حسب الاختبار والتجربة"

    result = {
        'suggested_title'  : clean(title(full_text)),
        'meta_description' : build_meta(full_text),
        'snippet_text'     : build_snip(full_text),
        'nlp_keywords'     : nlp_kw(full_text),
        'featured_snippets': list({urlparse(u).hostname for u in refs if u}),
        'outline'          : outline(full_text)
    }

    return jsonify(result)

# --------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True)
