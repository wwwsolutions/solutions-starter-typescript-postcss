/* eslint-disable @typescript-eslint/no-var-requires */

// UTILITIES
const currentTask = process.env.npm_lifecycle_event;
const fse = require('fs-extra');
const path = require('path');

// WEBPACK PLUGINS
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// POSTCSS PLUGINS
const colorModFunction = require('postcss-color-mod-function');
const atImport = require('postcss-import');
const atEach = require('postcss-each');
const atRulesVariables = require('postcss-at-rules-variables');
const atIf = require('postcss-conditionals');
const atFor = require('postcss-for');
const cssVariables = require('postcss-css-variables');
const cssSimpleVariables = require('postcss-simple-vars');
const nested = require('postcss-nested');
const autoprefixer = require('autoprefixer');
const mixins = require('postcss-mixins');
const math = require('postcss-math');

// POSTCSS PLUGINS CONFIG
const postcssPlugins = [
  atRulesVariables({ /* atRules: ['media'] */ }),
  atImport({
    plugins: [
      atRulesVariables({ /* options */ }),
      atImport()
    ]
  }),
  atEach(),
  atFor(),
  atIf(),
  mixins(),
  cssSimpleVariables(),
  cssVariables({ preserve: true }),
  math(),
  colorModFunction(),
  nested(),
  autoprefixer(),
];

// CONFIG
class RunAfterCompile {
  apply(compiler) {
    compiler.hooks.done.tap('Copy images', function () {
      fse.copySync('./src/assets/images', './dist/assets/images');
      fse.copySync('./src/assets/icons', './dist/assets/icons');
    });
  }
}

// CONFIG
let cssConfig = {
  test: /\.css$/i,
  use: [
    'css-loader?url=false',
    {
      loader: 'postcss-loader',
      options: {
        plugins: postcssPlugins,
      },
    },
  ],
};

// CONFIG
let eslintConfig = {
  test: /\.js$/,
  enforce: 'pre',
  exclude: /node_modules/,
  use: ['eslint-loader'],
};

// CONFIG
let pages = fse
  .readdirSync('src')
  .filter(function (file) {
    return file.endsWith('.html');
  })
  .map(function (page) {
    return new HtmlWebpackPlugin({
      filename: page,
      template: `./src/${page}`,
    });
  });

/* START COMMON CONFIGURATION
> > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > >
------------------------------------------------------------------------------------------------------------- */

// SET BASE CONFIGURATION
let config = {
  entry: './src/main.ts',
  plugins: pages,
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },  

  // configuration regarding modules
  module: {
    // rules for modules (configure loaders, parser options, etc.)
    rules: [cssConfig, eslintConfig],
  },
};

// ADD PLUGINS TO CONFIGURATION
config.plugins.push(
  new StyleLintPlugin({
    configFile: '.stylelintrc',
    context: 'src/styles/',
    files: ['**/*.css'],
    failOnError: false,
    quiet: false,
  })
); 

// ADD RULES TO CONFIGURATION
config.module.rules.push({
  test: /\.tsx?$/,
  exclude: /(node_modules)/,
  use: {
    // the loader which should be applied, it'll be resolved relative to the context
    loader: 'ts-loader',
  },
});

// END COMMON CONFIGURATION

/* START DEVELOPMENT CONFIGURATION
> > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > >
------------------------------------------------------------------------------------------------------------- */
if (currentTask == 'dev') {
  // add loader to start of array
  cssConfig.use.unshift('style-loader');

  // options related to how webpack emits results
  config.output = {
    filename: '[name].bundle.js',

    // the target directory for all output files
    // must be an absolute path (use the Node.js path module)
    path: path.resolve(__dirname, 'src'),
  };

  config.devServer = {
    before: function (app, server) {
      server._watch(`src/**/*.html`);
    },
    contentBase: path.resolve(__dirname, './src'),
    hot: true, // hot module replacement. Depends on HotModuleReplacementPlugin
    port: 3000,
    host: '0.0.0.0',
    noInfo: false, // only errors & warns on hot reload
    historyApiFallback: true, // for SPAs, always serve index.html
  };

  // Chosen mode tells webpack to use its built-in optimizations accordingly.
  config.mode = 'development';

  // set devtools with source maps
  config.devtool = 'source-map';

} 
// END DEVELOPMENT CONFIGURATION

/* START PRODUCTION CONFIGURATION
> > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > >
------------------------------------------------------------------------------------------------------------- */
if (currentTask == 'build') {
  // add loader to start of array
  cssConfig.use.unshift(MiniCssExtractPlugin.loader);

  // add plugin to end of postcss plugin array
  postcssPlugins.push(require('cssnano'));

  // options related to how webpack emits results
  config.output = {

    // the target directory for all output files
    // must be an absolute path (use the Node.js path module)
    path: path.resolve(__dirname, 'dist'),

    // the filename template for entry chunks
    filename: `[name].[hash:10].js`,
    chunkFilename: `./scripts/[name].js`,
  };

  // Chosen mode tells webpack to use its built-in optimizations accordingly.
  config.mode = 'production';

  config.optimization = {
    splitChunks: { chunks: 'all' },
  };

  config.plugins.push(
    new CleanWebpackPlugin(),

    new MiniCssExtractPlugin({
      // the filename template for entry chunks
      filename: `styles.[chunkhash].css`,
    }),

    new RunAfterCompile()
  );
} 
// END PRODUCTION CONFIGURATION

module.exports = config;
