// Registers a provider burner through the public API (Confirm-email is OFF on the
// deployed backend, so it gets a session at once and a provider_profiles row is
// seeded from category_id). Inputs, as flow env: EMAIL, PASSWORD, CATEGORY_ID
// (defaults to 1, Plumbing). Fails the flow if the API refuses.
var res = http.post('https://taskbuddy-kpek.onrender.com/auth/register', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
    role: 'provider',
    full_name: 'Burner Provider',
    category_id: typeof CATEGORY_ID === 'undefined' ? 1 : Number(CATEGORY_ID),
    consented_terms: true,
    consented_privacy: true,
    consented_data_collection: true,
  }),
});
if (!res.ok) {
  throw new Error('provider burner register failed: HTTP ' + res.status + ' ' + res.body);
}
