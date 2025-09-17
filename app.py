# app.py – نسخة Google Custom Search بدل OpenWebNinja
import os, re, textwrap, json, requests
from collections import Counter
from urllib.parse import urlparse
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required
from flask_babel import Babel, gettext as _

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///kamar.db'
app.config['BABEL_DEFAULT_LOCALE'] = 'ar'

db   = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
babel = Babel(app)

# ========== أضف مفاتيحك هنا ==========
GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"   # <— غيّرها
GOOGLE_CSE_ID  = "YOUR_CUSTOM_CSE_ID"    # <— غيّرها
# ======================================

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
#  صفحات الأنظمة (كما هي)
# --------------------------------------------------
@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        email, password = request.form['email'], request.form['password']
        if User.query.filter_by(email=email).first():
            flash(_('Email already registered'))
            return redirect(url_for('register'))
        user = User(email=email, password=password)
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
#  البحث في Google + التحليل
# --------------------------------------------------
@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    payload = request.get_json(silent=True) or {}
    keyword = payload.get('keyword', '').strip()
    lang    = payload.get('lang', 'ar')
    gl      = payload.get('gl', 'sa')

    if not keyword:
        return jsonify({'error': 'أدخل كلمة مفتاحية'}), 400

    # 1) جلب نتائج Google
    try:
        r = requests.get(
            "https://www.googleapis.com/customsearch/v1",
            params={
                'key': GOOGLE_API_KEY,
                'cx': GOOGLE_CSE_ID,
                'q': keyword,
                'hl': lang,
                'gl': gl,
                'num': 10
            },
            timeout=15
        )
        if r.status_code != 200:
            return jsonify({'error': 'فشل الاستعلام عن Google'}), 502
        items = r.json().get('items', [])
    except Exception as e:
        return jsonify({'error': 'فشل الاتصال بـ Google'}), 502

    # 2) دمج العناوين + المقتطفات لتحليلها
    full_text = ' '.join(
        [item.get('title', '') + ' ' + item.get('snippet', '') for item in items]
    )
    refs      = [item.get('link', '') for item in items]

    # 3) دوال المعالجة (نفس المنطق السابق)
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
        return [{'tag': 'h3', 'text': s[:70]} for s in sents]
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