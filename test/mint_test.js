
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('DEMO - mint_test.js', async (accounts) => {

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
  var oneT = new BigNumber(10000000000000000000);
  var oneM = new BigNumber(100000000000000000);
  // tokenomics
  var tax = 0.05;
  // store for global use
  var CSupply;

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`1. Fetch total coin supply.`, async function () {

    // Get total token supply(in contract)
    originalSupply = await config.reflect.totalSupply.call({from: config.owner});
    // Total supply should be 1 quadrillion, or 1,000,000,000,000,000
    console.log("TotalSupply = ", originalSupply.toString());
    assert.equal(BigNumber(originalSupply).toString(), 1000000000000000000000, "Fetches the total coin supply");

  });

  it(`2. Mint 10,000,000,000,000,000,000 new coins to walletB.`, async function () {

    // Set walletB address
    walletB = config.testAddresses[1];
    // Call mint function of SafeMoon contract
    await config.reflect.mint(walletB, oneT, {from: config.owner});
    // Find new expected supply
    let newSupply = new BigNumber.sum(originalSupply, oneT);
    console.log("NEW supply = ", newSupply);
    // Find actual current supply
    totalSupply = await config.reflect.totalSupply.call({from: config.owner});
    console.log("TotalSupply = ", totalSupply.toString());
    // total supply should be totalSupply + oneT
    assert.equal(BigNumber(totalSupply).toString(), newSupply, "New amount after first mint to walletB");

  });

  it(`3. Mint 100,000,000,000,000,000 new coins to walletC.`, async function () {

    // Set walletC address
    walletC = config.testAddresses[2];
    // Call mint function of SafeMoon contract
    await config.reflect.mint(walletC, oneM, {from: config.owner});
    // Find new expected supply
    let newSupply = new BigNumber.sum(totalSupply, oneM);
    // Find actual current supply
    totalSupply = await config.reflect.totalSupply.call({from: config.owner});
    // total supply should be totalSupply + oneT
    assert.equal(newSupply.toString(), BigNumber(totalSupply).toString(), "New amount after first mint to walletC");

  });

  it(`4. Check balance of walletB.`, async function () {

    // Get balance of walletB address
    let BSupply = await config.reflect.balanceOf.call(walletB, {from: config.owner});
    // walletB balance should be 10,000,000,000,000,000,000
    assert.equal(BigNumber(BSupply).toString(), oneT.toString(), "walletB contains 10000000000000000000 coins.");

  });
  
  it(`5. Check balance of walletC.`, async function () {

    // Get balance of walletC address
    let CSupply = await config.reflect.balanceOf.call(walletC, {from: config.owner});
    // walletC balance should be 100,000,000,000,000,000
    assert.equal(BigNumber(CSupply).toString(), oneM.toString(), "walletC contains 100000000000000000 coins.");

  });

  /****************************************************************************************/
  /* Test Reflection AFTER Minting                                                        */
  /****************************************************************************************/

  it(`6. Transfer 100,000,000,000,000,000 from walletB to walletD.`, async function () {

    // Get balance of walletC address BEFORE transfer - for use in next test
    CSupply = await config.reflect.balanceOf.call(walletC, {from: config.owner});

    // Set walletD address
    walletD = config.testAddresses[3];
    // Send 100,000,000,000,000,000 from walletB to walletD
    await config.reflect.transfer(walletD, oneM, {from: walletB});
    // Get balance of walletB address
    let DSupply = await config.reflect.balanceOf.call(walletD, {from: config.owner});
    // Find out what value is expected(value transfered - tax)
    let taxTotal = new BigNumber(oneM).times(tax)
    let res = new BigNumber.sum(oneM, -taxTotal);
    // Store distribution amount globaly
    distAmnt = BigNumber(oneM).times(tax);
    let reflection = BigNumber(res).dividedBy(totalSupply);
    let totalRef = BigNumber(reflection).times(distAmnt);
    res = BigNumber.sum(res, totalRef);
    console.log(Math.floor(res.toString()));
    // walletD balance should be 100,000,000,000,000,000 - 5% + reflection
    assert.equal(BigNumber(DSupply).toString(), Math.floor(res.toString()), "walletD contains 10,000,000,000,000,000,000 coins - tax + reflection.");

  });

  it(`7. Check distribution paid out to walletC.`, async function () {

    // Find out what value is expected(value transfered in test 6 + dist / perecentage of total)
    totalSupply = await config.reflect.totalSupply.call({from: config.owner});
    let percSupply = CSupply / totalSupply;
    let reward = oneM * tax;
    let res = reward * percSupply;
    let addedReward = new BigNumber.sum(res, CSupply);
    console.log(Math.floor(addedReward));
    // Current balance of walletC should be 1,000,000 + distribution
    let currentCSupply = await config.reflect.balanceOf.call(walletC, {from: config.owner});
    // Use Math.floor() to simulate Solidity's rounding down of decimals
    assert.equal(currentCSupply, Math.floor(addedReward), "walletC contains 100,000,000,000,000,000 coins + reflection.");
  });

});