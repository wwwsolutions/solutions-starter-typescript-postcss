const fs = require('fs')
const path = require('path')

const appDirectory = fs.realpathSync(process.cwd());
const resolveAbs = relativePath => path.resolve(appDirectory, relativePath);


module.exports = resolveAbs;

