(() => {
  const LANGUAGES = [
    ['JavaScript', ['js', 'jsx', 'mjs', 'cjs']],
    ['TypeScript', ['ts', 'tsx', 'mts', 'cts']],
    ['Ruby', ['rb', 'rake', 'erb', 'gemspec']],
    ['Python', ['py']],
    ['Go', ['go']],
    ['Java', ['java']],
    ['Kotlin', ['kt', 'kts']],
    ['Swift', ['swift']],
    ['PHP', ['php']],
    ['Rust', ['rs']],
    ['C/C++', ['c', 'h', 'cpp', 'hpp', 'cc']],
    ['C#', ['cs']],
    ['Shell', ['sh', 'bash', 'zsh']],
    ['HTML', ['html', 'htm']],
    ['SQL', ['sql']],
  ];
  const EXT_TO_LANGUAGE = new Map();
  for (const [lang, exts] of LANGUAGES) {
    for (const ext of exts) EXT_TO_LANGUAGE.set(ext, lang);
  }

  const RUBY_FILES = new Set(['gemfile', 'rakefile']);
  const DOC_EXTS = new Set(['md', 'mdx', 'rst', 'txt', 'adoc']);
  const CONFIG_EXTS = new Set(['json', 'yml', 'yaml', 'toml', 'ini', 'lock', 'env', 'properties']);
  const LOCKFILES = new Set([
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'gemfile.lock',
    'cargo.lock', 'poetry.lock', 'composer.lock', 'go.sum',
  ]);
  const ASSET_EXTS = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'avif',
    'woff', 'woff2', 'ttf', 'otf', 'eot', 'mp4', 'pdf',
  ]);
  const STYLE_EXTS = new Set(['css', 'scss', 'sass', 'less', 'styl']);
  const TEST_DIRS = new Set(['__tests__', '__mocks__', 'spec', 'specs', 'test', 'tests']);

  function classify(path) {
    const segments = path.toLowerCase().split('/');
    const name = segments[segments.length - 1];
    const dirs = segments.slice(0, -1);
    const ext = name.includes('.') ? name.split('.').pop() : '';

    if (
      /[._-](test|spec)\.[^.]+$/.test(name) ||
      /\.(test|spec)\./.test(name) ||
      dirs.some((d) => TEST_DIRS.has(d))
    ) return 'Tests';
    if (DOC_EXTS.has(ext) || dirs.includes('docs') || dirs.includes('doc')) return 'Docs';
    if (
      LOCKFILES.has(name) ||
      name.startsWith('.') ||
      /\.config\.[^.]+$/.test(name) ||
      CONFIG_EXTS.has(ext)
    ) return 'Config';
    if (ASSET_EXTS.has(ext)) return 'Assets';
    if (STYLE_EXTS.has(ext)) return 'Styles';
    if (RUBY_FILES.has(name)) return 'Ruby';
    return EXT_TO_LANGUAGE.get(ext) || 'Other';
  }

  const api = { classify };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.PRPie = Object.assign(globalThis.PRPie || {}, api);
})();
