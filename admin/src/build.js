'use strict';
const {assets,writePage,build,DIST,packageSite} = require('../../tools/lib/refonte-build');
const {lirePage} = require('./content');
function regenerer(slug) {
  assets();
  const result=writePage(lirePage(slug));
  packageSite();
  return result;
}
function regenererTout() {
  return {pages:build(),fichiersDeSortie:true};
}
module.exports={DIST,regenerer,regenererTout};
