#!/usr/bin/env -S npx tsx
/**
 * Deletes cached variants left in the old flat layout (`cache/{md5}.{ext}`).
 * Since variants moved under their original (`cache/{path}/{md5}.{ext}`),
 * nothing reads the old keys: every variant is regenerated in the new layout
 * on its first request. Run once the upgraded instance has been serving for a
 * while. Originals under public/ and current-layout variants are never touched.
 *
 * Usage:
 *   pnpm --filter api exec tsx scripts/cleanup-legacy-cache.ts          # dry run
 *   pnpm --filter api exec tsx scripts/cleanup-legacy-cache.ts --yes    # delete
 */
import "dotenv/config";
import { createStorageClientFromEnv } from "../src/config/storage";

async function main() {
  const dryRun = !process.argv.includes("--yes");

  const storage = createStorageClientFromEnv();
  if (!storage) {
    console.error("Storage configuration incomplete. Aborting.");
    process.exit(1);
  }

  console.log(`Bucket: ${process.env.STORAGE_BUCKET_NAME || ""}`);
  const { count, size } = await storage.deleteLegacyCache(dryRun);
  const mb = (size / 1024 / 1024).toFixed(1);

  if (dryRun) {
    console.log(`Found ${count} legacy cache objects (${mb} MB). Re-run with --yes to delete them.`);
  } else {
    console.log(`Deleted ${count} legacy cache objects (${mb} MB).`);
  }
}

main()
  .then(() => process.exit(0)) // the S3 client's keep-alive HTTPS agent would otherwise hold the process open
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
