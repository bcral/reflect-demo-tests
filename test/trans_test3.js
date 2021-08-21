
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('DEMO - trans_test3.js', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
  });

    /////////////////////////////////////////////////////////////////////
  // Global setup variables
  var totalSupply;
  var originalSupply;
  var walletSupply;
  // wallet addresses
  var walletB;
  var walletC;
  var walletD;
  var walletE;
  // values for holding larger numbers, to prevent typos
  var total = new BigNumber(1000000000000000000000);
  var tenP = new BigNumber(total).times(0.1);
  var eightyP = new BigNumber(total).times(0.8);

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`1. Fetch total coin supply.`, async function () {

    // Get total token supply(in contract)
    originalSupply = await config.reflect.totalSupply.call({from: config.owner});

    assert.equal(BigNumber(originalSupply), total.toString(), "Fetches the total coin supply");

  });

  it(`2. Transfer 10% of total from owner to walletB and 80% of total to walletC`, async function () {

    // Set walletB - G address
    walletB = config.testAddresses[1];
    walletC = config.testAddresses[2];
    walletD = config.testAddresses[3];
    walletE = config.testAddresses[4];

    // Transfer one trillion coins from owner to walletB - G
    await config.reflect.transfer(walletB, tenP, {from: config.owner});
    await config.reflect.transfer(walletC, eightyP, {from: config.owner});

    // Get total balance of walletB - C
    let BSupply = await config.reflect.balanceOf.call(walletB, {from: config.owner});
    let CSupply = await config.reflect.balanceOf.call(walletC, {from: config.owner});
    // Add up both wallets to ensure accurate total
    walletSupply = new BigNumber.sum(BSupply, CSupply);
    
    assert.equal(walletSupply.toString(), BigNumber(total).times(0.9).toString(), "Total of all wallets should be 90% of total.");

  });

  /****************************************************************************************/
  /* Test Reflection AFTER Transfers From Owner                                           */
  /****************************************************************************************/

  it(`3. Just checking total supply.`, async function () {

    // Find the total supply
    totalSupply = await config.reflect.totalSupply.call({from: config.owner});

    assert.equal(BigNumber(totalSupply).toString(), total.toString(), "Total supply should be 1000000000000000000000");
  });

  it(`4. Check sum of all wallets vs. total supply.`, async function () {

    // Get balance of Owner - E
    let ownerSupply = await config.reflect.balanceOf.call(config.owner, {from: config.owner});
    let BSupply = await config.reflect.balanceOf.call(walletB, {from: config.owner});
    let CSupply = await config.reflect.balanceOf.call(walletC, {from: config.owner});
    let DSupply = await config.reflect.balanceOf.call(walletD, {from: config.owner});
    let ESupply = await config.reflect.balanceOf.call(walletE, {from: config.owner});

    // Get total token supply
    totalSupply = await config.reflect.totalSupply.call({from: config.owner});

    // Add up all wallets to ensure total supply is correct
    let allWalletSupply = new BigNumber.sum(ownerSupply, BSupply, CSupply, DSupply, ESupply);

    console.log('Sum of all wallets: ', allWalletSupply);    
    console.log('Total supply: ', BigNumber(totalSupply));  

    // Use Math.floor() to simulate Solidity's natural rounding down of decimals
    assert.equal(BigNumber(totalSupply), Math.floor(allWalletSupply), "Sum of all wallets should equal total supply.");
  
  });

  /****************************************************************************************/
  /* Test Reflection AFTER Transfers From Non-Exempt Wallets                           */
  /****************************************************************************************/


  it(`5 Transfer between wallets C and D to check reflection on walletE`, async function () {

    // transfer between walletC and walletD
    await config.reflect.transfer(walletD, BigNumber(total).times(0.7), {from: walletC});
    await config.reflect.transfer(walletC, BigNumber(total).times(0.6), {from: walletD});
    await config.reflect.transfer(walletD, BigNumber(total).times(0.5), {from: walletC});
    await config.reflect.transfer(walletC, BigNumber(total).times(0.4), {from: walletD});
    await config.reflect.transfer(walletD, BigNumber(total).times(0.3), {from: walletC});

    let ESupply = await config.reflect.balanceOf.call(walletE, {from: config.owner});
    
    assert.equal(BigNumber(ESupply), 0, "If this test passes, there was no reflection to walletE(which has 0 balance).");

  });

  it(`6 Transfer 10% of total to walletE to create a balance, and check reflection.`, async function () {

    // Transfer 10% of total tokens to walletE
    await config.reflect.transfer(walletE, tenP, {from: config.owner});

    // Get balances of all wallets for logging
    let BSupply = await config.reflect.balanceOf.call(walletB, {from: config.owner});
    let CSupply = await config.reflect.balanceOf.call(walletC, {from: config.owner});
    let DSupply = await config.reflect.balanceOf.call(walletD, {from: config.owner});
    let ESupply = await config.reflect.balanceOf.call(walletE, {from: config.owner});

    // Log balances of all wallets for reference
    console.log("walletB balance = ", BSupply.toString());
    console.log("walletC balance = ", CSupply.toString());
    console.log("walletD balance = ", DSupply.toString());
    console.log("walletE balance = ", ESupply.toString());
    
    assert.equal(tenP.toString(), ESupply.toString(), "Ensure that there was no reflection to walletE.");

  });

  it(`7. Check sum of all wallets vs. total supply.`, async function () {

    // Get balance of owner address
    let ownerSupply = await config.reflect.balanceOf.call(config.owner, {from: config.owner});
    let BSupply = await config.reflect.balanceOf.call(walletB, {from: config.owner});
    let CSupply = await config.reflect.balanceOf.call(walletC, {from: config.owner});
    let DSupply = await config.reflect.balanceOf.call(walletD, {from: config.owner});
    let ESupply = await config.reflect.balanceOf.call(walletE, {from: config.owner});

    // Get total token supply
    totalSupply = await config.reflect.totalSupply.call({from: config.owner});

    let allWalletSupply = new BigNumber.sum(ownerSupply, BSupply, CSupply, DSupply, ESupply);

    console.log('Sum of all wallets: ', allWalletSupply);    
    console.log('Total supply: ', BigNumber(totalSupply).toString());  

    // Use Math.floor() to simulate Solidity's natural rounding down of decimals
    assert.equal(totalSupply.toString(), allWalletSupply.toString(), "Sum of all wallets should equal total supply.");
  
  });

});