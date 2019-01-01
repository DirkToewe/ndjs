const path = require('path'),
   webpack = require('webpack')

const cfg_module = {
  rules: [{
    test: /\.js$/,
    include: path.resolve(__dirname, 'src'),
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env'],
        plugins: [
          '@babel/transform-runtime'
        ]
      }
    }
  }]
}

module.exports = [
  {
    mode: 'development',
    entry: './src/help.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'nd.js',
      library: 'nd',
      libraryTarget: 'umd',
      globalObject: "this"
    },
    module: cfg_module
  },
  {
    mode: 'production',
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'nd.min.js',
      library: 'nd',
      libraryTarget: 'umd',
      globalObject: "this"
    },
    module: cfg_module
  }
]
