//! Deploy RWA Token contract on Casper Livenet
use odra::host::Deployer;
use odra::prelude::*;
use agentic_rwa::{RWAToken, RWATokenInitArgs};

fn main() {
    let env = odra_casper_livenet_env::env();
    
    // Get the deployer account
    let deployer = env.caller();
    println!("Deployer: {:?}", deployer);

    // Deploy the contract
    let init_args = RWATokenInitArgs {
        name: "RWA Token".to_string(),
        symbol: "RWA".to_string(),
        decimals: 0,
        initial_supply: 1000000,
        asset_type: "RealEstate".to_string(),
    };

    env.set_gas(450_000_000_000u64);
    let contract = RWAToken::deploy(&env, init_args);
    
    let contract_address = contract.address();
    println!("✅ Contract deployed at: {:?}", contract_address);
    println!("🔗 View on explorer: https://testnet.cspr.live/contract-package/{:?}", contract_address);
}
