const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests', timeout:60000, workers:2,
 reporter:[['list'],['html',{outputFolder:'reports/playwright',open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
 webServer:{command:'node ../tools/serve.js --port 4173',url:'http://127.0.0.1:4173',reuseExistingServer:false},
 projects:[{name:'chromium',use:{browserName:'chromium'}}]
});
