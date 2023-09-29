const args = require('minimist')(process.argv.slice(2))
const { resolve } = require('path')
const { build } = require('esbuild')

console.log(` ================== args ================= `, args)

const target = args._[0] || 'reactivity'
const format = args.f || 'global'
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))
const outputFormat =
  format === 'global' ? 'iife' : format === 'cjs' ? 'cjs' : 'esm'
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
)

build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
  outfile,
  bundle: true, // 全部打包到一起
  sourcemap: true,
  format: outputFormat,
  globalName: pkg.buildOptions?.name, // 打包的全局名字
  platform: format === 'cjs' ? 'node' : 'browser',
  watch: {
    onRebuild(error) {
      if (!error) console.log(`rebuilt~~~~`)
    }
  }
}).then(() => {
  console.log('watching~~~')
})
