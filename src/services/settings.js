export async function getSettings(supabase) {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'global')
    .single()
  if (error) throw error
  return data
}

export async function updateSettings(supabase, patch) {
  const { data, error } = await supabase
    .from('settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 'global')
    .select()
    .single()
  if (error) throw error
  return data
}
