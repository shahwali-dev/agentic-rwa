//! This script demonstrates how to use the `odra-cli` tool to deploy and interact with the RWAToken smart contract.

use agentic_rwa::{RWAToken, RWATokenInitArgs};
use odra::host::HostEnv;
use odra::prelude::*;
use odra_cli::{
    deploy::DeployScript,
    DeployedContractsContainer, DeployerExt, OdraCli, 
};

/// Deploys the `RWAToken` contract and registers it into the deployment container.
pub struct RWADeployScript;

impl DeployScript for RWADeployScript {
    fn deploy(
        &self,
        env: &HostEnv,
        container: &mut DeployedContractsContainer
    ) -> Result<(), odra_cli::deploy::Error> {
        // Fetch active deployer address
        let _deployer_address = env.get_account(0);

        // Standard 500 CSPR gas fee limit for complex WASM deployment
        let gas_budget: u64 = 500_000_000_000;

        // Matching the contract's expected u64 supply limit strictly
        let initial_supply_u64: u64 = 100_000_000_000; 

        // Strictly matching the 5 constructor fields from src/lib.rs (No owner field)
        let _rwa = RWAToken::load_or_deploy(
            env,
            RWATokenInitArgs {
                name: String::from("RealEstate Token"),
                symbol: String::from("RET"),
                decimals: 9u8, 
                initial_supply: initial_supply_u64, 
                asset_type: String::from("RealEstate"),
            },
            container,
            gas_budget,
        )?;

        Ok(())
    }
}

/// Main entry point to initialize and execute the Odra CLI runtime.
pub fn main() {
    OdraCli::new()
        .about("CLI engine for the Agentic RWA asset tokenization platform")
        .deploy(RWADeployScript)
        .contract::<RWAToken>()
        .build()
        .run();
}