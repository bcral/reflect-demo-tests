
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('DEMO - trans_test2.js', async (accounts) => {

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
  var walletF;
  var walletG;
  // values for holding larger numbers, to prevent typos
  var oneT = new BigNumber(100000000000000000000);
  var oneM = 1000000;

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`1. Fetch total coin supply.`, async function () {

    // Get total token supply(in contract)
    originalSupply = await config.reflect.totalSupply.call({from: config.owner});

    // Set walletB address
    walletB = config.testAddresses[1];

    // Blacklist walletB before any transfers are made
    await config.reflect.blackList(walletB, {from: config.owner});

    assert.equal(BigNumber(originalSupply).toString(), 1000000000000000000000, "Fetches the total coin supply");

  });

  it(`2. Transfer 1T from owner to walletB, C, D, E, F, and G`, async function () {

    // Set walletC - G address
    walletC = config.testAddresses[2];
    walletD = config.testAddresses[3];
    walletE = config.testAddresses[4];
    walletF = config.testAddresses[5];
    walletG = config.testAddresses[6];

    // Transfer one trillion coins from owner to walletB - G
    await config.reflect.transfer(walletB, oneT, {from: config.owner});
    await config.reflect.transfer(walletC, oneT, {from: config.owner});
    await config.reflect.transfer(walletD, oneT, {from: config.owner});
    await config.reflect.transfer(walletE, oneT, {from: config.owner});
    await config.reflect.transfer(walletF, oneT, {from: config.owner});
    await config.reflect.transfer(walletG, oneT, {from: config.owner});

    // Get total balance of walletB - G
    let BSupply = await config.reflect.balanceOf.call(walletB, {from: config.owner});
    let CSupply = await config.reflect.balanceOf.call(walletC, {from: config.owner});
    let DSupply = await config.reflect.balanceOf.call(walletD, {from: config.owner});
    let ESupply = await config.reflect.balanceOf.call(walletE, {from: config.owner});
    let FSupply = await config.reflect.balanceOf.call(walletF, {from: config.owner});
    let GSupply = await config.reflect.balanceOf.call(walletG, {from: config.owner});

    walletSupply = new BigNumber.sum(BSupply, CSupply, DSupply, ESupply, FSupply, GSupply);
    
    assert.equal(walletSupply, BigNumber(oneT).times(6).toString(), "Total of all wallets should be 6T");

  });

  /****************************************************************************************/
  /* Test Reflection AFTER Transfers From Owner                                           */
  /****************************************************************************************/

  it(`3. Just checking total supply.`, async function () {

    // Find the total supply
    totalSupply = await config.reflect.totalSupply.call({from: config.owner});

    assert.equal(totalSupply.toString(), 1000000000000000000000, "Total supply should be 1000000000000000000000");
  });

  it(`4. Check sum of all wallets vs. total supply.`, async function () {

    // Get balance of owner address
    let ownerSupply = await config.reflect.balanceOf.call(config.owner, {from: config.owner});
    let BSupply = await config.reflect.balanceOf.call(walletB, {from: config.owner});
    let CSupply = await config.reflect.balanceOf.call(walletC, {from: config.owner});
    let DSupply = await config.reflect.balanceOf.call(walletD, {from: config.owner});
    let ESupply = await config.reflect.balanceOf.call(walletD, {from: config.owner});
    let FSupply = await config.reflect.balanceOf.call(walletD, {from: config.owner});
    let GSupply = await config.reflect.balanceOf.call(walletD, {from: config.owner});

    // Get total token supply(in contract)
    totalSupply = await config.reflect.totalSupply.call({from: config.owner});

    let allWalletSupply = new BigNumber.sum(ownerSupply, BSupply, CSupply, DSupply, ESupply, FSupply, GSupply);

    console.log('Sum of all wallets: ', allWalletSupply);    
    console.log('Total supply: ', BigNumber(totalSupply));  

    // Use Math.floor() to simulate Solidity's natural rounding down of decimals
    assert.equal(totalSupply, Math.floor(allWalletSupply), "Sum of all wallets should equal total supply.");
  
  });

  /****************************************************************************************/
  /* Test Reflection AFTER Transfers From Non-Exempt Wallets                           */
  /****************************************************************************************/

  it(`5. Transfer tokens from wallet to wallet`, async function () {

    // Transfer to and from any wallet but B or C
    await config.reflect.transfer(walletD, BigNumber(500000000000000000), {from: walletF});
    // Blacklist walletC after transfer
    await config.reflect.blackList(walletC, {from: config.owner});

    // Get total balance of walletB - D
    let BSupply = await config.reflect.balanceOf.call(walletB, {from: config.owner});
    let CSupply = await config.reflect.balanceOf.call(walletC, {from: config.owner});
    let DSupply = await config.reflect.balanceOf.call(walletD, {from: config.owner});
    let ESupply = await config.reflect.balanceOf.call(walletE, {from: config.owner});

    console.log("BSupply = ", BSupply);
    console.log("CSupply = ", CSupply);
    console.log("DSupply = ", DSupply);
    console.log("ESupply = ", ESupply);
    
    assert.notEqual(ESupply, oneT, "If this number is the same, there was no reflection to walletE.");

  });

  it(`6 Transfer tokens from wallet to wallet`, async function () {

    // Check C balance before transfer
    let CBefore = await config.reflect.balanceOf.call(walletC, {from: config.owner});

    // Transfer to and from any wallet but B or C
    await config.reflect.transfer(walletE, BigNumber(7000000000000000), {from: walletD});

    // Check C balance after transfer
    let CAfter = await config.reflect.balanceOf.call(walletC, {from: config.owner});

    console.log("CBefore = ", CBefore);
    console.log("CAfter = ", CAfter);
    
    assert.equal(BigNumber(CBefore).toString(), BigNumber(CAfter).toString(), "If this test passes, there was no reflection to walletC.");

  });

});