import { supabase } from './supabase.ts';

export async function uploadReceiptImage(registrationId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `receipts/${registrationId}.${ext}`;

  const { error } = await supabase.storage
    .from('receipts')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;
  return path;
}

export function getReceiptUrl(path: string): string {
  const { data } = supabase.storage.from('receipts').getPublicUrl(path);
  return data.publicUrl;
}
