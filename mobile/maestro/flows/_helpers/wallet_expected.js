// Reads maestro.client@ (c1)'s wallet from the live API and formats the figures that p6 compares with the
// Wallet screen. The formatting copies the app: peso() in mobile/src/lib/format.ts (the peso sign, comma
// thousands, two decimals) and the sign HOWalletScreen prints ("-" for a debit, "+" otherwise).
// Only POST /auth/login and GET /wallet are called. Nothing is written to the API, so no job is created
// and no money moves. The token stays in a local variable: it is never stored in output or logged. Errors
// carry the HTTP status only.
// Outputs: output.W_BALANCE, output.W_ESCROW, output.W_TOP_TITLE, output.W_TOP_AMOUNT (plain text), and the
// same four as regex-escaped copies with an _RE suffix, for Maestro text matching (it matches regex).
// W_TOP_* is the first transaction in the GET /wallet array. The API orders created_at descending
// (backend/src/wallet/wallet.service.ts overview), and the All list renders that order.
var API = 'https://taskbuddy-kpek.onrender.com';
var PESO_SIGN = '₱';

function login(email) {
  var r = http.post(API + '/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: 'TestPass123!' }),
  });
  if (!r.ok) throw new Error('login failed for ' + email + ': HTTP ' + r.status);
  var j = json(r.body);
  var token = j.access_token || (j.session && j.session.access_token);
  if (!token) throw new Error('no access token returned for ' + email);
  return token;
}

// Same output as format.ts peso(): ₱ + thousands separators + two decimals.
function peso(amount) {
  var n = Number(amount || 0);
  var parts = Math.abs(n).toFixed(2).split('.');
  var grouped = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return PESO_SIGN + (n < 0 ? '-' : '') + grouped + '.' + parts[1];
}

// Escapes regex metacharacters so a plain figure or title matches itself exactly.
function reEsc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

var token = login('maestro.client@taskbuddy.test');

var w = http.get(API + '/wallet', { headers: { Authorization: 'Bearer ' + token } });
if (!w.ok) throw new Error('GET /wallet failed: HTTP ' + w.status);
var wj = json(w.body);
if (typeof wj.balance !== 'number') throw new Error('wallet response has no numeric balance');
if (typeof wj.in_escrow !== 'number') throw new Error('wallet response has no numeric in_escrow');
var txns = wj.transactions || [];
if (txns.length === 0) throw new Error('wallet has no transactions; p6 needs a newest row to compare');
var top = txns[0];
if (!top.title) throw new Error('newest wallet transaction has no title');

output.W_BALANCE = peso(wj.balance);
output.W_ESCROW = peso(wj.in_escrow);
output.W_TOP_TITLE = String(top.title);
output.W_TOP_AMOUNT = (top.direction === 'debit' ? '-' : '+') + peso(top.amount);

output.W_BALANCE_RE = reEsc(output.W_BALANCE);
output.W_ESCROW_RE = reEsc(output.W_ESCROW);
output.W_TOP_TITLE_RE = reEsc(output.W_TOP_TITLE);
output.W_TOP_AMOUNT_RE = reEsc(output.W_TOP_AMOUNT);
