#![no_std]

use odra::prelude::*;

// ============================================
// Data structures for RWA Token
// ============================================

#[odra::odra_type]
#[derive(Default)]
pub struct RWAInfo {
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
    pub asset_type: String,
}

#[odra::odra_type]
#[derive(Default)]
pub struct TokenMetadata {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: u64,
}

// ============================================
// Main RWA Token Contract
// ============================================

#[odra::module(events = [Transfer, Approval, AssetTokenized, PaymentAuthorized], errors = Error)]
pub struct RWAToken {
    name: Var<String>,
    symbol: Var<String>,
    decimals: Var<u8>,
    total_supply: Var<u64>,
    balances: Mapping<Address, u64>,
    allowances: Mapping<(Address, Address), u64>,
    asset_info: Var<RWAInfo>,
    used_nonces: Mapping<(Address, [u8; 32]), bool>,
}

#[odra::module]
impl RWAToken {
    // ============================================
    // Constructor - Initialize Token
    // ============================================
    pub fn init(&mut self, name: String, symbol: String, decimals: u8, initial_supply: u64, asset_type: String) {
        let owner = self.env().caller();
        
        self.name.set(name.clone());
        self.symbol.set(symbol.clone());
        self.decimals.set(decimals);
        self.total_supply.set(initial_supply);
        
        self.balances.set(&owner, initial_supply);
        
        self.asset_info.set(RWAInfo {
            name: name.clone(),
            symbol: symbol.clone(),
            total_supply: initial_supply,
            asset_type: asset_type.clone(),
        });
        
        self.env().emit_event(AssetTokenized {
            owner,
            asset_type,
            amount: initial_supply,
        });
    }

    // ============================================
    // Getter Functions
    // ============================================
    pub fn name(&self) -> String {
        self.name.get_or_default()
    }

    pub fn symbol(&self) -> String {
        self.symbol.get_or_default()
    }

    pub fn decimals(&self) -> u8 {
        self.decimals.get_or_default()
    }

    pub fn total_supply(&self) -> u64 {
        self.total_supply.get_or_default()
    }

    pub fn balance_of(&self, owner: &Address) -> u64 {
        self.balances.get_or_default(owner)
    }

    pub fn allowance(&self, owner: &Address, spender: &Address) -> u64 {
        self.allowances.get_or_default(&(*owner, *spender))
    }

    pub fn get_asset_info(&self) -> RWAInfo {
        self.asset_info.get_or_default()
    }

    // ============================================
    // Token Transfer Functions
    // ============================================
    pub fn transfer(&mut self, recipient: &Address, amount: u64) {
        let sender = self.env().caller();
        self.transfer_internal(&sender, recipient, amount);
    }

    pub fn transfer_from(&mut self, owner: &Address, recipient: &Address, amount: u64) {
        let spender = self.env().caller();
        self.spend_allowance(owner, &spender, amount);
        self.transfer_internal(owner, recipient, amount);
    }

    pub fn approve(&mut self, spender: &Address, amount: u64) {
        let owner = self.env().caller();
        self.allowances.set(&(owner, *spender), amount);
        
        self.env().emit_event(Approval {
            owner,
            spender: *spender,
            amount,
        });
    }

    // ============================================
    // x402 Payment Integration
    // ============================================

    /// Transfer tokens with authorization (for x402 payments)
    /// This allows a third party (facilitator) to transfer tokens
    /// on behalf of the token owner using a signed authorization
    pub fn transfer_with_authorization(
        &mut self,
        from: Address,
        to: Address,
        value: u64,
        valid_after: u64,
        valid_before: u64,
        nonce: [u8; 32],
        _signature: [u8; 65],
    ) {
        let env = self.env();
        let current_time = env.get_block_time();

        // Validate time constraints
        if current_time < valid_after {
            env.revert(Error::AuthorizationNotYetValid);
        }
        if current_time > valid_before {
            env.revert(Error::AuthorizationExpired);
        }

        // Check if nonce has been used
        let nonce_key = (from, nonce);
        if self.used_nonces.get(&nonce_key).unwrap_or(false) {
            env.revert(Error::NonceAlreadyUsed);
        }

        // Verify the signature
        // In production, use proper EIP-712 signature verification
        // For now, we verify that the caller is the facilitator
        let caller = env.caller();
        if caller != from {
            env.revert(Error::InvalidSigner);
        }

        // Mark nonce as used
        self.used_nonces.set(&nonce_key, true);

        // Execute the transfer
        self.transfer_internal(&from, &to, value);

        // Emit event
        env.emit_event(PaymentAuthorized {
            from,
            to,
            amount: value,
            nonce,
        });
    }

    /// Check if a nonce has been used for a given address
    pub fn is_nonce_used(&self, from: Address, nonce: [u8; 32]) -> bool {
        self.used_nonces.get(&(from, nonce)).unwrap_or(false)
    }

    // ============================================
    // Internal Functions
    // ============================================
    fn transfer_internal(&mut self, sender: &Address, recipient: &Address, amount: u64) {
        let sender_balance = self.balances.get_or_default(sender);
        if sender_balance < amount {
            self.env().revert(Error::InsufficientBalance);
        }
        
        self.balances.set(sender, sender_balance - amount);
        let recipient_balance = self.balances.get_or_default(recipient);
        self.balances.set(recipient, recipient_balance + amount);
        
        self.env().emit_event(Transfer {
            from: *sender,
            to: *recipient,
            amount,
        });
    }

    fn spend_allowance(&mut self, owner: &Address, spender: &Address, amount: u64) {
        let current_allowance = self.allowances.get_or_default(&(*owner, *spender));
        if current_allowance < amount {
            self.env().revert(Error::InsufficientAllowance);
        }
        self.allowances.set(&(*owner, *spender), current_allowance - amount);
        
        self.env().emit_event(Approval {
            owner: *owner,
            spender: *spender,
            amount: current_allowance - amount,
        });
    }
}

// ============================================
// Events
// ============================================

#[odra::event]
pub struct Transfer {
    pub from: Address,
    pub to: Address,
    pub amount: u64,
}

#[odra::event]
pub struct Approval {
    pub owner: Address,
    pub spender: Address,
    pub amount: u64,
}

#[odra::event]
pub struct AssetTokenized {
    pub owner: Address,
    pub asset_type: String,
    pub amount: u64,
}

#[odra::event]
pub struct PaymentAuthorized {
    pub from: Address,
    pub to: Address,
    pub amount: u64,
    pub nonce: [u8; 32],
}

// ============================================
// Errors
// ============================================

#[odra::odra_error]
pub enum Error {
    InsufficientBalance = 1,
    InsufficientAllowance = 2,
    AuthorizationNotYetValid = 3,
    AuthorizationExpired = 4,
    NonceAlreadyUsed = 5,
    InvalidSigner = 6,
}

// ============================================
// Tests
// ============================================

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostEnv};

    fn setup() -> (HostEnv, RWATokenHostRef) {
        let env = odra_test::env();
        let contract = RWAToken::deploy(
            &env,
            RWATokenInitArgs {
                name: "RealEstate Token".to_string(),
                symbol: "RET".to_string(),
                decimals: 0,
                initial_supply: 1000,
                asset_type: "RealEstate".to_string(),
            },
        );
        (env, contract)
    }

    #[test]
    fn test_initialization() {
        let (env, contract) = setup();
        
        assert_eq!(contract.name(), "RealEstate Token");
        assert_eq!(contract.symbol(), "RET");
        assert_eq!(contract.decimals(), 0);
        assert_eq!(contract.total_supply(), 1000);
        
        let owner = env.get_account(0);
        assert_eq!(contract.balance_of(&owner), 1000);
        
        let asset_info = contract.get_asset_info();
        assert_eq!(asset_info.name, "RealEstate Token");
        assert_eq!(asset_info.symbol, "RET");
        assert_eq!(asset_info.total_supply, 1000);
        assert_eq!(asset_info.asset_type, "RealEstate");
    }

    #[test]
    fn test_transfer() {
        let (env, mut contract) = setup();
        let owner = env.get_account(0);
        let recipient = env.get_account(1);
        
        assert_eq!(contract.balance_of(&owner), 1000);
        assert_eq!(contract.balance_of(&recipient), 0);
        
        contract.transfer(&recipient, 100);
        
        assert_eq!(contract.balance_of(&owner), 900);
        assert_eq!(contract.balance_of(&recipient), 100);
    }

    #[test]
    fn test_transfer_insufficient_balance() {
        let (env, mut contract) = setup();
        let owner = env.get_account(0);
        let recipient = env.get_account(1);
        
        let result = contract.try_transfer(&recipient, 2000);
        assert!(result.is_err());
        
        assert_eq!(contract.balance_of(&owner), 1000);
        assert_eq!(contract.balance_of(&recipient), 0);
    }

    #[test]
    fn test_approve_and_transfer_from() {
        let (env, mut contract) = setup();
        let owner = env.get_account(0);
        let spender = env.get_account(1);
        let recipient = env.get_account(2);
        
        contract.approve(&spender, 300);
        assert_eq!(contract.allowance(&owner, &spender), 300);
        
        env.set_caller(spender);
        contract.transfer_from(&owner, &recipient, 100);
        
        assert_eq!(contract.balance_of(&owner), 900);
        assert_eq!(contract.balance_of(&recipient), 100);
        assert_eq!(contract.allowance(&owner, &spender), 200);
    }

    #[test]
    fn test_approve_and_transfer_from_insufficient_allowance() {
        let (env, mut contract) = setup();
        let owner = env.get_account(0);
        let spender = env.get_account(1);
        let recipient = env.get_account(2);
        
        contract.approve(&spender, 300);
        
        env.set_caller(spender);
        let result = contract.try_transfer_from(&owner, &recipient, 500);
        assert!(result.is_err());
        
        assert_eq!(contract.balance_of(&owner), 1000);
        assert_eq!(contract.balance_of(&recipient), 0);
        assert_eq!(contract.allowance(&owner, &spender), 300);
    }

    #[test]
    fn test_x402_transfer_with_authorization() {
        let (env, mut contract) = setup();
        let owner = env.get_account(0);
        let recipient = env.get_account(1);
        let nonce = [1u8; 32];
        let signature = [2u8; 65];

        // Set caller as owner (simulating facilitator)
        env.set_caller(owner);
        
        // Transfer with authorization
        contract.transfer_with_authorization(
            owner,
            recipient,
            100,
            0,      // valid_after - always valid
            999999, // valid_before - far in future
            nonce,
            signature,
        );

        assert_eq!(contract.balance_of(&owner), 900);
        assert_eq!(contract.balance_of(&recipient), 100);
        assert!(contract.is_nonce_used(owner, nonce));
    }

    #[test]
    fn test_x402_nonce_reuse_prevention() {
        let (env, mut contract) = setup();
        let owner = env.get_account(0);
        let recipient = env.get_account(1);
        let nonce = [3u8; 32];
        let signature = [4u8; 65];

        env.set_caller(owner);

        // First transfer should succeed
        contract.transfer_with_authorization(
            owner,
            recipient,
            50,
            0,
            999999,
            nonce,
            signature,
        );

        // Second transfer with same nonce should fail
        let result = contract.try_transfer_with_authorization(
            owner,
            recipient,
            50,
            0,
            999999,
            nonce,
            signature,
        );
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            Error::NonceAlreadyUsed.into()
        );
    }
}

// ============================================
// Panic Handler for WASM
// ============================================

#[cfg(target_arch = "wasm32")]
#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}