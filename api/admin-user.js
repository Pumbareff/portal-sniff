import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return res.status(500).json({ error: 'Service role key nao configurada' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // UPDATE user email/password/name
  if (req.method === 'PUT') {
    const { user_id, email, password, full_name } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id obrigatorio' });

    const updates = {};
    if (email) updates.email = email;
    if (password) {
      if (password.length < 6) return res.status(400).json({ error: 'Senha deve ter no minimo 6 caracteres' });
      updates.password = password;
    }

    // Update auth user
    if (Object.keys(updates).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(user_id, updates);
      if (authError) return res.status(400).json({ error: authError.message });
    }

    // Update profile
    const profileUpdates = {};
    if (email) profileUpdates.email = email;
    if (full_name !== undefined) profileUpdates.full_name = full_name;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase.from('profiles').update(profileUpdates).eq('id', user_id);
      if (profileError) return res.status(400).json({ error: 'Auth atualizado mas erro no perfil: ' + profileError.message });
    }

    return res.status(200).json({ success: true });
  }

  // DELETE user
  if (req.method === 'DELETE') {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id obrigatorio' });

    // Delete profile first
    await supabase.from('profiles').delete().eq('id', user_id);

    // Delete auth user
    const { error } = await supabase.auth.admin.deleteUser(user_id);
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
