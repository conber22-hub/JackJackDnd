/* OPTIONAL BUNDLED PRISM SOURCE — full owner-provided source packed as a deterministic gzip asset.
   GitHub repository visibility determines who can access this file: a private Vercel
   table link does not make a public Git repository private.
   The full source stays separate from the single-file offline build. The existing
   local/DM book import remains an override; nothing is sent to players before the
   existing game/library.js creatorPart filter has run. */
export const BUNDLED_PRISM_PATH = 'assets/compendium/all-you-need2026.prism.gz';
export const BUNDLED_PRISM_SHA256 = 'd0d4478a7557a91d1cee77654aca617d0daf4bcbf1ad8dfc084da6dac2d43ef6';
export const BUNDLED_PRISM_COUNTS = Object.freeze({
  languages:6, monsters:91, races:118, subraces:104, invocations:22,
  items:57, subclasses:181, feats:3285, magicItems:216, backgrounds:71,
  selectionGroup:136, spells:918, weapons:20, classes:17, armor:14,
});

export async function loadBundledPrism({
  fetcher = globalThis.fetch,
  path = BUNDLED_PRISM_PATH,
  Decompressor = globalThis.DecompressionStream,
} = {}) {
  if (typeof fetcher !== 'function') throw new Error('Bundled Prism fetch is unavailable');
  if (typeof Decompressor !== 'function') throw new Error('Bundled Prism needs gzip decompression');
  const res = await fetcher(path);
  if (!res?.ok) throw new Error(`Bundled Prism asset could not be loaded (${res?.status ?? 'network'})`);
  const source = await new Response(res.body.pipeThrough(new Decompressor('gzip'))).text();
  const data = JSON.parse(source);
  if (!data || !Array.isArray(data.classes) || !Array.isArray(data.spells) || !Array.isArray(data.races))
    throw new Error('Bundled Prism did not contain a valid compendium');
  return data;
}
