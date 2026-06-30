import { supabase } from './supabase';

async function currentUserId() {
  // Every database write is tied to the signed-in Supabase user.
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const id = data.user?.id;
  if (!id) throw new Error('You need to be signed in to save changes.');
  return id;
}

function unwrap(result) {
  // Supabase returns { data, error }; this keeps page code smaller.
  if (result.error) throw result.error;
  return result.data;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function inRange(row, range) {
  // Calendar views pass date ranges; the API keeps filtering logic in one place.
  if (!range?.from && !range?.to) return true;
  const ref = row.deadline || row.start_time || row.created_at;
  if (!ref) return true;
  const time = new Date(ref).getTime();
  if (range.from && time < new Date(range.from).getTime()) return false;
  if (range.to && time >= new Date(range.to).getTime()) return false;
  return true;
}

export const api = {
  profile: {
    async get() {
      const userId = await currentUserId();
      const existing = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) return existing.data;

      // Older accounts may not have a profile row yet, so create one lazily.
      return unwrap(
        await supabase
          .from('profiles')
          .insert({ id: userId })
          .select()
          .single(),
      );
    },

    async update(patch) {
      const userId = await currentUserId();
      const existing = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (existing.error) throw existing.error;
      const current = existing.data ?? {};

      // Upsert lets the same call create or update the user's profile row.
      return unwrap(
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            username: normalizeText(patch.username ?? current.username) || null,
            display_name: normalizeText(patch.display_name ?? current.display_name) || null,
            avatar_url: patch.avatar_url ?? current.avatar_url ?? null,
            banner_url: patch.banner_url ?? current.banner_url ?? null,
            bio: patch.bio ?? current.bio ?? null,
            age: patch.age === '' || patch.age === undefined ? current.age ?? null : Number(patch.age) || null,
            birthplace: normalizeText(patch.birthplace ?? current.birthplace) || null,
            school: normalizeText(patch.school ?? current.school) || null,
            study_program: normalizeText(patch.study_program ?? current.study_program) || null,
            study_year: normalizeText(patch.study_year ?? current.study_year) || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
          .select()
          .single(),
      );
    },
  },

  tasks: {
    async list(range = {}) {
      const userId = await currentUserId();
      const rows = unwrap(
        await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .order('start_time', { ascending: true, nullsFirst: false })
          .order('deadline', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true }),
      );
      return rows.filter((row) => inRange(row, range));
    },

    async create(data) {
      const userId = await currentUserId();
      return unwrap(
        await supabase
          .from('tasks')
          .insert({
            user_id: userId,
            category_id: null,
            title: normalizeText(data.title),
            description: data.description || null,
            start_time: null,
            end_time: null,
            deadline: data.deadline || null,
            priority: data.priority || 'medium',
            status: data.status || 'open',
          })
          .select()
          .single(),
      );
    },

    async update(id, data) {
      return unwrap(
        await supabase
          .from('tasks')
          .update({
            category_id: null,
            title: normalizeText(data.title),
            description: data.description || null,
            start_time: null,
            end_time: null,
            deadline: data.deadline || null,
            priority: data.priority || 'medium',
            status: data.status || 'open',
          })
          .eq('id', id)
          .select()
          .single(),
      );
    },

    async remove(id) {
      return unwrap(await supabase.from('tasks').delete().eq('id', id));
    },
  },

  notes: {
    async list() {
      const userId = await currentUserId();
      return unwrap(
        await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('pinned', { ascending: false })
          .order('updated_at', { ascending: false }),
      );
    },

    async create(data) {
      const userId = await currentUserId();
      return unwrap(
        await supabase
          .from('notes')
          .insert({
            user_id: userId,
            title: normalizeText(data.title),
            body: data.body || '',
            pinned: Boolean(data.pinned),
          })
          .select()
          .single(),
      );
    },

    async update(id, data) {
      return unwrap(
        await supabase
          .from('notes')
          .update({
            title: normalizeText(data.title),
            body: data.body || '',
            pinned: Boolean(data.pinned),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single(),
      );
    },

    async remove(id) {
      return unwrap(await supabase.from('notes').delete().eq('id', id));
    },
  },
};
