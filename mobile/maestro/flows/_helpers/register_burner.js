// Registers a client burner through the public API (Confirm-email is OFF on the
// deployed backend, so it gets a session at once). Inputs, as flow env: EMAIL,
// PASSWORD. Fails the flow if the API refuses.
var res = http.post('https://taskbuddy-kpek.onrender.com/auth/register', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
    role: 'client',
    full_name: 'Burner Password',
    consented_terms: true,
    consented_privacy: true,
    consented_data_collection: true,
  }),
});
if (!res.ok) {
  throw new Error('burner register failed: HTTP ' + res.status + ' ' + res.body);
}
