
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('DEMO - black_test.js', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
  });

    /////////////////////////////////////////////////////////////////////
  // Global setup variables
  var totalSupply;
  var originalSupply;
  // wallet addresses
  var walletB;
  var walletC;
  var walletD;
  // values for holding larger numbers, to prevent typos
  var startValue = new BigNumber(100000000000000000000);
  var value1 = new BigNumber(10000000000000000000);

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`1. Blacklist walletB, transfer tokens to accounts`, async function () {

    walletB = config.testAddresses[1];
    walletC = config.testAddresses[2];
    walletD = config.testAddresses[3];
    walletE = config.testAddresses[4];
    walletF = config.testAddresses[5];

    // Blacklist walletB
    await config.reflect.blackList(walletB, {from: config.owner});
    // Transfer 1^28 tokens to walletB, walletC, and walletD
    await config.reflect.transfer(walletB, startValue, {from: config.owner});
    await config.reflect.transfer(walletC, startValue, {from: config.owner});
    await config.reflect.transfer(walletD, startValue, {from: config.owner});
    await config.reflect.transfer(walletE, startValue, {from: config.owner});
    await config.reflect.transfer(walletF, startValue, {from: config.owner});

    let BSupply = await config.reflect.balanceOf.call(walletB, {from: config.owner});

    console.log("BSupply - ", BSupply.toString());
    assert.equal(BigNumber(BSupply).toString(), startValue.toString(), "Ensure that walletB did not recieve reflection from initial transfers.");
  });

  it(`2. Transfer tokens from D to E to create reflection for walletC`, async function () {

    // Transfer tokens from D to E
    await config.reflect.transfer(walletE, 1000000000000, {from: walletD});
    await config.reflect.transfer(walletD, 10000000000000, {from: walletE});
    await config.reflect.transfer(walletD, 1500000000000000, {from: walletF});
    // Get balance of walletC before blacklisting, but after transfers
    let CBefore = await config.reflect.balanceOf.call(walletC, {from: config.owner});
    // Blacklist walletC
    await config.reflect.blackList(walletC, {from: config.owner});
    // Get balance of walletC after blacklisting
    let CAfter = await config.reflect.balanceOf.call(walletC, {from: config.owner});

    console.log("CBefore - ", CBefore);
    console.log("CAfter - ", CAfter);
    assert.equal(BigNumber(CBefore).toString(), BigNumber(CAfter).toString(), "WalletC should have recieved reflection from transfers, and value shouldn't have changed from blacklisting.");
  });

  it(`3. Check walletC balance before and after unblacklist and transfers`, async function () {

    // Get balance of walletC before transfers
    let CBefore = await config.reflect.balanceOf.call(walletC, {from: config.owner});

    // un-blacklist walletC
    await config.reflect.unBlackList(walletC, {from: config.owner});

    // Transfer tokens from D to E
    await config.reflect.transfer(walletE, 1000000000000, {from: walletD});
    await config.reflect.transfer(walletD, 10000000000000, {from: walletE});
    await config.reflect.transfer(walletD, 1500000000000000, {from: walletF});

    // Get balance of walletC after transfers
    let CAfter = await config.reflect.balanceOf.call(walletC, {from: config.owner});

    console.log("CBefore - (un-blacklisted)", CBefore);
    console.log("CAfter - (un-blacklisted)", CAfter);
    assert.notEqual(BigNumber(CBefore), BigNumber(CAfter), "walletC should have earned reflection after transfers.");
  });

  it(`4. Ensure that walletB hasn't recieved any reflection.`, async function () {

    let BSupply = await config.reflect.balanceOf.call(walletB, {from: config.owner});

    console.log("walletB balance = ", BSupply);
    assert.equal(BigNumber(BSupply).toString(), startValue.toString(), "walletB should not have earned reflection after transfers.");
  });

  it(`5. Test minting with blacklist/unblacklist`, async function () {

    // Get balance of walletC before minting 
    let CBefore = await config.reflect.balanceOf.call(walletC, {from: config.owner});
    
    // Get balance of walletB
    let BSupply = await config.reflect.balanceOf.call(walletB, {from: config.owner});
    console.log("walletB balance(before unBlackList) = ", BSupply);

    // un-blacklist walletB and check for no change in balance
    await config.reflect.unBlackList(walletB, {from: config.owner});
    BSupply = await config.reflect.balanceOf.call(walletB, {from: config.owner});
    console.log("walletB balance(after unBlackList) = ", BSupply);

    // blacklist walletC
    await config.reflect.blackList(walletC, {from: config.owner});
    // Mint tokens to walletC
    await config.reflect.mint(walletC, value1, {from: config.owner});
    // Mint tokens to walletD
    await config.reflect.mint(walletD, value1, {from: config.owner});

    // Get balance of walletC after minting
    let CAfter = await config.reflect.balanceOf.call(walletC, {from: config.owner});

    assert.equal(new BigNumber.sum(CBefore, value1).toString(), BigNumber(CAfter).toString(), "walletC should have the original balance plus minted amount.");
  });

  it(`6. Test amount of reflection.`, async function () {

    // Get balance of walletB before transfer
    let BBefore = await config.reflect.balanceOf.call(walletB, {from: config.owner});
    
    // Transfer tokens from D to E
    await config.reflect.transfer(walletE, 1000000000000, {from: walletD});
    await config.reflect.transfer(walletD, 10000000000000, {from: walletE});
    await config.reflect.transfer(walletD, 1500000000000000, {from: walletF});

    // Get balance of walletB after transfer
    let BAfter = await config.reflect.balanceOf.call(walletB, {from: config.owner});
    console.log("walletB balance = ", BAfter);

    assert.notEqual(BBefore, BAfter, "walletB balance should have increased from reflection.");
  });

  it(`7. Check sum of all wallets vs. total supply.`, async function () {

    // Get balance of owner address
    let ownerSupply = await config.reflect.balanceOf.call(config.owner, {from: config.owner});
    let BSupply = await config.reflect.balanceOf.call(walletB, {from: config.owner});
    let CSupply = await config.reflect.balanceOf.call(walletC, {from: config.owner});
    let DSupply = await config.reflect.balanceOf.call(walletD, {from: config.owner});
    let ESupply = await config.reflect.balanceOf.call(walletE, {from: config.owner});
    let FSupply = await config.reflect.balanceOf.call(walletF, {from: config.owner});

    // Get total token supply(in contract)
    totalSupply = await config.reflect.totalSupply.call({from: config.owner});

    let allWalletSupply = new BigNumber.sum(ownerSupply, BSupply, CSupply, DSupply, ESupply, FSupply);

    console.log('Sum of all wallets: ', allWalletSupply);    
    console.log('Total supply: ', totalSupply);  

    // Use Math.floor() to simulate Solidity's natural rounding down of decimals
    assert.equal(BigNumber(totalSupply).toString(), allWalletSupply.toString(), "Sum of all wallets should equal total supply.");
  
  });

});