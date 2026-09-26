/** Site colour-scheme preference, stored per browser. Isomorphic constants + a pre-hydration script. */
export type SchemePreference = 'light' | 'dark' | 'auto';

export const SCHEME_STORAGE_KEY = 'strata-docs-scheme';

/** Runs in <head> before first paint so a stored preference never flashes the wrong scheme. */
export const SCHEME_SCRIPT = `(function(){try{var s=localStorage.getItem('${SCHEME_STORAGE_KEY}');if(s==='light'||s==='dark'){document.documentElement.setAttribute('data-strata-scheme',s)}}catch(e){}})();`;
