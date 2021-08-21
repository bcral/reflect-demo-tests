
var REFLECT = artifacts.require("DEMO");

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0x518e4fc4fF59439110Cb23735976A03d58eF3b51",
        "0x6eA0287fed663D2201e93Cb9f51D3424F1d66c9E",
        "0xaE12d8252dC9087BC6eD967c8655F87F68bAE9Ed",
        "0x51aAcA743e4E1B5648D20F4294618A13411b4D81",
        "0xBf15037DffF7c07c776A955F3346005ecEe7af83",
        "0x7d875f8bdd01fA61370D292f3aa426df12B50EC4",
        "0x4B428eff5383CA6D47E126771c8732d08AEa7cf8",
        "0xfC96E0A541D4f68f71fD586e098b6605a4Ab1ecF",
        "0x5F3EA03E6BB1730FdD90aF1E69453181f465B6e4",
        "0x746DDd1EC9739774e6e851D596895995c96c73d8"
    ];

    // Wallets
    let owner = accounts[0];

    // Throw constructor data as args in the .new() function
    let reflect = await REFLECT.new();

    return {
        owner: owner,
        reflect: reflect,
        testAddresses: testAddresses,
    }
}

module.exports = {
    Config: Config
};