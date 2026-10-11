#!/usr/bin/env node
'use strict';
const count=require('./lib/refonte-build').packageSite();
console.log('Sitemap, robots et routes générés pour '+count+' pages.');
