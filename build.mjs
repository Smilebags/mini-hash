import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/main.ts'],
  outfile: 'dist/main.js',
  bundle: true,
});