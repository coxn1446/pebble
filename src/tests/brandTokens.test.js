import fs from 'fs';
import path from 'path';
import tailwindConfig from '../../tailwind.config.js';

const repoRoot = path.resolve(__dirname, '..', '..');
const colors = tailwindConfig.theme.extend.colors;
const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
const indexCss = fs.readFileSync(path.join(repoRoot, 'src', 'index.css'), 'utf8');
const manifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'public', 'manifest.json'), 'utf8')
);
const capacitorConfig = fs.readFileSync(path.join(repoRoot, 'capacitor.config.js'), 'utf8');

describe('pebble brand tokens', () => {
  test('exposes the brand guideline palette', () => {
    expect(colors.slate).toBe('#334155');
    expect(colors.ocean).toBe('#2563EB');
    expect(colors.pebble).toBe('#A8A29E');
    expect(colors.moss).toBe('#5B7C4D');
    expect(colors.sandstone).toBe('#D6B37A');
  });

  test('maps semantic tokens to brand colors', () => {
    expect(colors.ink).toBe(colors.slate);
    expect(colors.muted).toBe(colors.pebble);
    expect(colors.accent).toBe(colors.ocean);
    expect(colors['accent-hover']).toBe(colors['ocean-hover']);
    expect(colors.surface).toBe('#FFFFFF');
    expect(colors.background).toBe('#F5F6F8');
  });

  test('uses a rounded brand font stack', () => {
    expect(tailwindConfig.theme.extend.fontFamily.sans[0]).toBe('Nunito');
    expect(tailwindConfig.theme.extend.fontFamily.display[0]).toBe('Nunito');
  });

  test('includes brand motion tokens', () => {
    expect(tailwindConfig.theme.extend.animation.float).toContain('float');
    expect(tailwindConfig.theme.extend.animation['fade-up']).toContain('fade-up');
    expect(tailwindConfig.theme.extend.animation['soft-pulse']).toContain('soft-pulse');
  });

  test('index.css @theme mirrors every brand and semantic color token', () => {
    expect(indexCss).toMatch(/@theme\s*\{/);
    for (const [name, value] of Object.entries(colors)) {
      expect(indexCss.toLowerCase()).toContain(`--color-${name}: ${value.toLowerCase()}`);
    }
  });
});

describe('chrome colors stay on brand tokens', () => {
  test('index.html theme-color matches the background token', () => {
    const match = indexHtml.match(
      /<meta\s+name="theme-color"\s+content="(#[0-9a-fA-F]{6})"\s*\/?\s*>/
    );
    expect(match).not.toBeNull();
    expect(match[1].toUpperCase()).toBe(colors.background.toUpperCase());
  });

  test('initial-loader uses background and muted brand tokens', () => {
    expect(indexHtml).toMatch(new RegExp(`background:\\s*${colors.background}`, 'i'));
    expect(indexHtml).toMatch(new RegExp(`color:\\s*${colors.muted}`, 'i'));
  });

  test('manifest theme and background colors match the background token', () => {
    expect(manifest.theme_color.toUpperCase()).toBe(colors.background.toUpperCase());
    expect(manifest.background_color.toUpperCase()).toBe(colors.background.toUpperCase());
  });

  test('capacitor shell background matches the background token', () => {
    expect(capacitorConfig).toContain(`backgroundColor: '${colors.background}'`);
  });

  test('index.html loads the Nunito brand font', () => {
    expect(indexHtml).toMatch(/fonts\.googleapis\.com\/css2\?family=Nunito/);
  });
});
