// rollup.config.js
import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

const vendors = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies || {}),
]

const makeExternalPredicate = (externalArr) => {
  if (externalArr.length === 0) {
    return () => false
  }
  const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`)
  return (id) => pattern.test(id)
}

export default ['esm', 'cjs'].map((format) => ({
  input: 'src/index.ts',
  output: {
    format,
    dir: 'lib',
    entryFileNames: '[name].[format].js',
    exports: 'named',
  },
  external: makeExternalPredicate(vendors),
  plugins: [typescript()],
}))
