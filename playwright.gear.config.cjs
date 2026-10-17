const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests',
  testMatch:'gear-repair.spec.cjs',
  timeout:60000,
  expect:{timeout:16000},
  retries:1,workers:1,
  use:{baseURL:'https://usarockhounding.com',trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[
    {name:'desktop',use:{...devices['Desktop Chrome']}},
    {name:'mobile',use:{...devices['Pixel 7']}}
  ]
});
