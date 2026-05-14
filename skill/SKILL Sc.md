---
name: web-security
description: >
  ใช้ skill นี้ทุกครั้งที่งานเกี่ยวข้องกับการรักษาความปลอดภัยของเว็บแอปพลิเคชันในทุกระดับ ครอบคลุม:
  การ audit และ review code เพื่อหาช่องโหว่, การสร้างระบบ authentication/authorization ที่ปลอดภัย,
  การป้องกัน OWASP Top 10, การตั้งค่า security headers, การทำ input validation/sanitization,
  การเข้ารหัสข้อมูล, การป้องกัน injection attacks (SQL, XSS, CSRF, SSRF, XXE),
  การออกแบบ secure architecture, การทำ penetration testing แบบ defensive,
  การจัดการ secrets และ credentials, การตั้งค่า CSP, CORS, HTTPS/TLS,
  และการ harden ระบบ production ทุกประเภท ทริกเกอร์เมื่อผู้ใช้พูดถึง "security", "ช่องโหว่",
  "แฮก", "ป้องกัน", "authentication", "authorization", "SQL injection", "XSS", "CSRF",
  "encrypt", "hash password", "JWT", "session", "firewall", "WAF", หรือขอให้ review code ด้านความปลอดภัย
---

# Web Security Skill — Enterprise-Grade

## หลักการสำคัญ (Security Principles)

ใช้ **Defense in Depth** เสมอ — อย่าพึ่งพาการป้องกันชั้นเดียว ทุก layer ต้องมีการป้องกันของตัวเอง

```
[Internet] → [WAF/CDN] → [Load Balancer/TLS] → [API Gateway] → [App Layer] → [DB Layer]
               ↓               ↓                     ↓              ↓             ↓
           DDoS/Bot         HTTPS Only           Rate Limit      Validation    Encryption
           Protection       HSTS                 Auth Check      Sanitize      Least Priv
```

---

## 1. Authentication & Session Management

### Password Hashing
```python
# ✅ ถูกต้อง — ใช้ bcrypt, argon2, หรือ scrypt เท่านั้น
import bcrypt
from argon2 import PasswordHasher

ph = PasswordHasher(
    time_cost=3,        # iterations
    memory_cost=65536,  # 64MB RAM
    parallelism=4,
    hash_len=32,
    salt_len=16
)
hashed = ph.hash(password)

# ❌ ห้ามเด็ดขาด
import hashlib
hashed = hashlib.md5(password).hexdigest()   # MD5 — crack ได้ใน seconds
hashed = hashlib.sha256(password).hexdigest() # SHA-256 ไม่มี salt/cost — ยังไม่ปลอดภัย
```

### JWT ที่ปลอดภัย
```javascript
// ✅ ถูกต้อง
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,   // ต้องยาว ≥ 256 bits, สุ่มจาก crypto
  {
    algorithm: 'RS256',     // ใช้ asymmetric key ดีกว่า HS256
    expiresIn: '15m',       // access token สั้น
    issuer: 'api.yourdomain.com',
    audience: 'app.yourdomain.com'
  }
);

// Refresh Token Pattern
// - Access token: 15 นาที, เก็บใน memory
// - Refresh token: 7 วัน, เก็บใน httpOnly cookie + rotation

// ❌ ห้าม
const token = jwt.sign(payload, 'secret');          // secret ง่ายเกินไป
const token = jwt.sign(payload, key, { algorithm: 'none' }); // ไม่มี signature
```

### Secure Session
```python
# Flask/Django — session config
SESSION_COOKIE_SECURE = True       # HTTPS only
SESSION_COOKIE_HTTPONLY = True     # JavaScript อ่านไม่ได้
SESSION_COOKIE_SAMESITE = 'Strict' # ป้องกัน CSRF
SESSION_COOKIE_MAX_AGE = 900       # 15 นาที
PERMANENT_SESSION_LIFETIME = 900

# สร้าง session ID ด้วย crypto-safe random
import secrets
session_id = secrets.token_urlsafe(32)  # 256-bit entropy
```

---

## 2. Input Validation & Injection Prevention

### SQL Injection
```python
# ✅ ใช้ Parameterized Query เสมอ
cursor.execute("SELECT * FROM users WHERE email = %s AND active = %s", (email, True))

# ✅ ORM (SQLAlchemy)
user = db.session.query(User).filter_by(email=email, active=True).first()

# ❌ String formatting — ห้ามเด็ดขาด
query = f"SELECT * FROM users WHERE email = '{email}'"  # SQL Injection ทันที
query = "SELECT * FROM users WHERE email = '" + email + "'"
```

### XSS Prevention
```javascript
// ✅ Output encoding
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Sanitize ก่อน render HTML
const clean = purify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
  ALLOWED_ATTR: []
});

// React — ใช้ JSX แทน dangerouslySetInnerHTML
// ✅
<p>{userInput}</p>  // auto-escaped

// ❌
<p dangerouslySetInnerHTML={{ __html: userInput }} />
```

### Command Injection
```python
# ✅ ใช้ subprocess กับ list args ไม่ใช่ string
import subprocess
result = subprocess.run(['ls', '-la', user_dir], capture_output=True, shell=False)

# ❌
os.system(f"ls -la {user_dir}")   # Command injection
subprocess.run(f"ls {user_dir}", shell=True)
```

### Path Traversal
```python
import os
from pathlib import Path

BASE_DIR = Path('/var/app/uploads').resolve()

def safe_path(filename: str) -> Path:
    # Sanitize filename
    filename = os.path.basename(filename)  # strip directories
    full_path = (BASE_DIR / filename).resolve()
    
    # ตรวจสอบว่า path อยู่ใน BASE_DIR เสมอ
    if not str(full_path).startswith(str(BASE_DIR)):
        raise ValueError("Path traversal detected")
    return full_path
```

---

## 3. Security Headers

ใส่ header เหล่านี้ทุก HTTP response:

```nginx
# Nginx config
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self)" always;
add_header X-XSS-Protection "1; mode=block" always;

# Content Security Policy — สำคัญมาก
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'nonce-{RANDOM_NONCE}';
  style-src 'self' 'nonce-{RANDOM_NONCE}';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.yourdomain.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
" always;
```

```javascript
// Express.js — ใช้ helmet
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      styleSrc: ["'self'"],
      frameAncestors: ["'none'"],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));
```

---

## 4. CSRF Protection

```python
# Django — ใช้ built-in CSRF middleware (เปิดไว้เสมอ)
# settings.py
MIDDLEWARE = [
    'django.middleware.csrf.CsrfViewMiddleware',  # อย่าเอาออก
    ...
]

# API endpoints — ใช้ Double Submit Cookie pattern
import secrets
from functools import wraps

def csrf_protect(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token_cookie = request.cookies.get('csrf_token')
        token_header = request.headers.get('X-CSRF-Token')
        if not token_cookie or not secrets.compare_digest(token_cookie, token_header):
            abort(403)
        return f(*args, **kwargs)
    return decorated
```

```javascript
// Axios — ส่ง CSRF token อัตโนมัติ
axios.defaults.headers.common['X-CSRF-Token'] = getCsrfTokenFromCookie();

// SameSite Cookie ก็ช่วยป้องกัน CSRF ได้
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
```

---

## 5. Rate Limiting & Brute Force Protection

```python
# Redis-based rate limiter
from redis import Redis
import time

redis = Redis()

def rate_limit(key: str, limit: int, window: int) -> bool:
    """Returns True if request is allowed"""
    pipe = redis.pipeline()
    now = time.time()
    pipe.zremrangebyscore(key, 0, now - window)
    pipe.zadd(key, {str(now): now})
    pipe.zcard(key)
    pipe.expire(key, window)
    _, _, count, _ = pipe.execute()
    return count <= limit

# Login endpoint
@app.route('/login', methods=['POST'])
def login():
    ip = request.remote_addr
    email = request.json.get('email', '')
    
    # Rate limit: 5 attempts per IP per 15 minutes
    if not rate_limit(f"login:ip:{ip}", 5, 900):
        return jsonify(error="Too many attempts"), 429
    
    # Rate limit: 10 attempts per account per hour  
    if not rate_limit(f"login:user:{email}", 10, 3600):
        return jsonify(error="Account temporarily locked"), 429
    
    # ... authentication logic
```

```nginx
# Nginx rate limiting
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

location /api/auth/login {
    limit_req zone=login burst=3 nodelay;
    limit_req_status 429;
}

location /api/ {
    limit_req zone=api burst=20 nodelay;
}
```

---

## 6. Cryptography

```python
# ✅ การเข้ารหัสข้อมูล
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

# Symmetric encryption (AES-256-GCM)
key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)
nonce = os.urandom(12)  # 96-bit nonce, ต้องสุ่มใหม่ทุกครั้ง
ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), associated_data)

# ✅ Key derivation จาก password
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

kdf = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,
    salt=os.urandom(16),
    iterations=600000  # NIST recommended minimum 2023
)
key = kdf.derive(password.encode())

# ✅ Secure random generation
import secrets
token = secrets.token_urlsafe(32)     # URL-safe token
otp = secrets.randbelow(1000000)      # 6-digit OTP
```

---

## 7. CORS Configuration

```python
# Flask-CORS — ตั้งค่าให้เข้มงวด
from flask_cors import CORS

CORS(app, 
    origins=["https://app.yourdomain.com"],  # ระบุ whitelist เสมอ
    methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"],
    supports_credentials=True,
    max_age=3600
)

# ❌ ห้ามใช้
CORS(app, origins="*", supports_credentials=True)  # credentials + wildcard = ช่องโหว่
```

---

## 8. File Upload Security

```python
import magic
import hashlib
from PIL import Image
import io

ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'application/pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def secure_upload(file_data: bytes, filename: str) -> dict:
    # 1. ตรวจขนาด
    if len(file_data) > MAX_FILE_SIZE:
        raise ValueError("File too large")
    
    # 2. ตรวจ MIME type จาก magic bytes (ไม่ใช่จาก filename)
    mime = magic.from_buffer(file_data, mime=True)
    if mime not in ALLOWED_MIME_TYPES:
        raise ValueError(f"File type not allowed: {mime}")
    
    # 3. สำหรับรูปภาพ — re-encode เพื่อกำจัด malicious metadata
    if mime.startswith('image/'):
        img = Image.open(io.BytesIO(file_data))
        output = io.BytesIO()
        img.save(output, format=img.format, exif=b'')  # strip EXIF
        file_data = output.getvalue()
    
    # 4. สร้าง safe filename
    safe_name = secrets.token_hex(16) + get_extension(mime)
    
    # 5. เก็บนอก webroot หรือใน isolated storage
    storage_path = f"/var/secure-uploads/{safe_name}"
    
    return {'path': storage_path, 'hash': hashlib.sha256(file_data).hexdigest()}
```

---

## 9. Database Security

```sql
-- ✅ Principle of Least Privilege
-- สร้าง user แยกต่างหากสำหรับแต่ละ service
CREATE USER 'app_readonly'@'localhost' IDENTIFIED BY '<strong_password>';
GRANT SELECT ON myapp.* TO 'app_readonly'@'localhost';

CREATE USER 'app_write'@'localhost' IDENTIFIED BY '<strong_password>';
GRANT SELECT, INSERT, UPDATE ON myapp.users TO 'app_write'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON myapp.sessions TO 'app_write'@'localhost';
-- ห้าม GRANT ALL PRIVILEGES

-- ✅ Encrypt sensitive columns
ALTER TABLE users ADD COLUMN ssn_encrypted VARBINARY(256);
-- เข้ารหัสใน application layer ก่อน store
```

```python
# Connection pooling with SSL
from sqlalchemy import create_engine

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "ssl": {
            "ca": "/path/to/ca-cert.pem",
            "cert": "/path/to/client-cert.pem",
            "key": "/path/to/client-key.pem",
        }
    },
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)
```

---

## 10. Secrets Management

```bash
# ✅ ใช้ Secret Manager (AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager)
# ❌ ห้าม hardcode หรือใส่ใน .env ที่ commit ขึ้น repo

# AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id prod/myapp/db-password
```

```python
# Python — ดึง secrets จาก Vault
import hvac

client = hvac.Client(url='https://vault.internal:8200')
client.auth.aws.iam_login(role='myapp-production')

secret = client.secrets.kv.v2.read_secret_version(
    path='myapp/database',
    mount_point='secret'
)
db_password = secret['data']['data']['password']
```

```yaml
# Kubernetes — ใช้ External Secrets Operator แทน plain Secrets
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: db-credentials
  data:
    - secretKey: password
      remoteRef:
        key: myapp/database
        property: password
```

---

## 11. Logging & Monitoring (Security Events)

```python
import logging
import json
from datetime import datetime

security_logger = logging.getLogger('security')

def log_security_event(event_type: str, severity: str, details: dict):
    """Log security events in structured format for SIEM"""
    event = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "severity": severity,  # INFO, WARNING, CRITICAL
        "source_ip": request.remote_addr,
        "user_agent": request.headers.get('User-Agent'),
        "user_id": getattr(g, 'user_id', None),
        "details": details
    }
    # ห้าม log sensitive data เช่น password, token, credit card
    security_logger.warning(json.dumps(event))

# Events ที่ต้อง log เสมอ
# - Failed login attempts
# - Successful login / logout
# - Password change / reset
# - Permission denied (403)
# - SQL errors (อาจเป็น injection attempt)
# - Unusual file access
# - Admin actions
```

---

## 12. TLS/HTTPS Configuration

```nginx
# Nginx — TLS 1.2+ เท่านั้น
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
ssl_prefer_server_ciphers off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 1.1.1.1 valid=300s;

# Session tickets
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;  # Forward secrecy
```

---

## Security Checklist ก่อน Deploy Production

### Authentication
- [ ] Passwords hashed ด้วย bcrypt/argon2 (cost factor ≥ 12)
- [ ] JWT ใช้ RS256 หรือ ES256, expire ≤ 15 นาที
- [ ] Refresh token rotation enabled
- [ ] MFA available สำหรับ admin accounts
- [ ] Account lockout หลัง failed attempts

### Input/Output
- [ ] ทุก query ใช้ parameterized statements
- [ ] HTML output ผ่าน encoding/sanitization
- [ ] File uploads ตรวจ MIME type จาก magic bytes
- [ ] Path traversal ป้องกันแล้ว

### Headers & Transport
- [ ] HSTS enabled (max-age ≥ 1 ปี)
- [ ] CSP policy กำหนดแล้ว
- [ ] X-Frame-Options: DENY
- [ ] TLS 1.2+ เท่านั้น
- [ ] Certificate สด ไม่หมดอายุ

### Infrastructure
- [ ] Dependencies อัปเดตล่าสุด (`pip audit`, `npm audit`)
- [ ] Secrets ไม่มีใน code หรือ environment variables ที่ expose ได้
- [ ] Database user มีสิทธิ์ขั้นต่ำเท่าที่จำเป็น
- [ ] Error messages ไม่เปิดเผย stack trace ใน production
- [ ] Rate limiting เปิดใช้งาน
- [ ] Security logging/alerting พร้อม

---

## อ้างอิง

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [NIST Password Guidelines SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Mozilla Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [CWE Top 25](https://cwe.mitre.org/top25/)
