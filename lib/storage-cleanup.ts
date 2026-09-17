import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { StorageCleanupStatus, ValidatedStorageObject } from '@/lib/storage-object-ref';

function groupPathsByBucket(objects: ValidatedStorageObject[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const object of objects) {
    const paths = grouped.get(object.bucket) ?? [];
    if (!paths.includes(object.path)) {
      paths.push(object.path);
    }
    grouped.set(object.bucket, paths);
  }
  return grouped;
}

export async function removeValidatedStorageObjects(
  objects: ValidatedStorageObject[]
): Promise<StorageCleanupStatus> {
  if (objects.length === 0) return 'none';

  const admin = getSupabaseAdmin();
  const grouped = groupPathsByBucket(objects);
  let failed = false;

  for (const [bucket, paths] of grouped) {
    const { error } = await admin.storage.from(bucket).remove(paths);
    if (error) {
      console.error('Storage cleanup failed', { bucket, count: paths.length });
      failed = true;
    }
  }

  return failed ? 'partial' : 'ok';
}
