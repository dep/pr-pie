const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classify } = require('../src/classifier.js');

test('test files win over language', () => {
  assert.equal(classify('applications/react/src/components/App.test.js'), 'Tests');
  assert.equal(classify('src/util.spec.ts'), 'Tests');
  assert.equal(classify('pkg/server_test.go'), 'Tests');
  assert.equal(classify('spec/models/user_spec.rb'), 'Tests');
  assert.equal(classify('src/__tests__/helpers.js'), 'Tests');
  assert.equal(classify('test/fixtures/data.js'), 'Tests');
});

test('docs by extension or directory', () => {
  assert.equal(classify('README.md'), 'Docs');
  assert.equal(classify('docs/guide/setup.rst'), 'Docs');
  assert.equal(classify('notes.txt'), 'Docs');
});

test('config: extensions, dotfiles, lockfiles, *.config.*', () => {
  assert.equal(classify('package.json'), 'Config');
  assert.equal(classify('.eslintrc'), 'Config');
  assert.equal(classify('Gemfile.lock'), 'Config');
  assert.equal(classify('jest.config.js'), 'Config');
  assert.equal(classify('config/settings.yml'), 'Config');
});

test('assets and styles', () => {
  assert.equal(classify('src/images/nico_launch/hero.webp'), 'Assets');
  assert.equal(classify('assets/fonts/inter.woff2'), 'Assets');
  assert.equal(classify('src/styles/login.scss'), 'Styles');
  assert.equal(classify('app.css'), 'Styles');
});

test('languages by extension', () => {
  assert.equal(classify('src/components/App.jsx'), 'JavaScript');
  assert.equal(classify('lib/service.ts'), 'TypeScript');
  assert.equal(classify('app/models/user.rb'), 'Ruby');
  assert.equal(classify('Gemfile'), 'Ruby');
  assert.equal(classify('cmd/main.go'), 'Go');
});

test('unknown files fall through to Other', () => {
  assert.equal(classify('LICENSE'), 'Other');
  assert.equal(classify('bin/weird.xyz123'), 'Other');
});
