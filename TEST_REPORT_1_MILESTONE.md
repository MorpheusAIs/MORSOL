# Test Report: Morpheus Token Program
---


## 1. **Initialize Global Config**

### **Description**:
The test initializes the `GlobalConfig` account.

<img src="https://cryptologos.cc/logos/solana-sol-logo.png?v=022" alt="Solana Logo" width="25" height="25">

### **Logs**:
- Generating Global Config PDA...
- **Global Config Address**: 👁[View Account on Solana Explorer](https://explorer.solana.com/address/8mb6v8y7pkQJAXsySTd4bSLsPhnHzxJ5yG9s2QrSk4xa?cluster=devnet)
- **Transaction Signature**: 👁[View Transaction on Solana Explorer](https://explorer.solana.com/tx/5mFSQrefmMrv2Ry2wE9WpKXjneXNLNbeFgkgdidJ344Xc9HrAy36eGP45pzgmZMd6jDVxtzom2AZth1uRE6Kb3Xc?cluster=devnet)

- **Global Config Account Data**:
  ```json
  {
    "admin": "AwaK517AuviY4K5RfVxBQJWtpHPAAYrSUfGaimG21kDy",
    "transferManagerBumps": 255,
    "mintBumps": 255,
    "transferManager": "6Qfrazzzqifu3e4Ff1J6WB4765yjZC1AbnQJ4bzhdUYb",
    "mint": "Gt41GseFWhefDMwS8gKs3PBz2NQBpuVL6kiGTRRi6srN"
  }
  ```

### **Outcome**:
✅ All assertions passed. Global Config initialized successfully.

---

## 2. **Create Token**

### **Description**:
The test creates a token and its associated metadata.

### **Logs**:
- Fetching Global Config...
- **Global Config Account**:
  ```json
  {
    "admin": "AwaK517AuviY4K5RfVxBQJWtpHPAAYrSUfGaimG21kDy",
    "transferManagerBumps": 255,
    "mintBumps": 255,
    "transferManager": "6Qfrazzzqifu3e4Ff1J6WB4765yjZC1AbnQJ4bzhdUYb",
    "mint": "Gt41GseFWhefDMwS8gKs3PBz2NQBpuVL6kiGTRRi6srN"
  }
  ```
- Starting transaction to create a token...
- **Transaction Signature**: 👁[View Transaction on Solana Explorer](https://explorer.solana.com/tx/4H5uZnRx7byBmVwKXGCb5UdgMcSqKoUHxZqUDtv6yaXykkHuccJ3vc5BHdZbvMQjth3CUEiRXgyoy62mqkLinbv3?cluster=devnet)
- Fetching newly created Mint Account...
- **Mint Account Info**:
  ```json
  {
    "address": "Gt41GseFWhefDMwS8gKs3PBz2NQBpuVL6kiGTRRi6srN",
    "mintAuthority": "6Qfrazzzqifu3e4Ff1J6WB4765yjZC1AbnQJ4bzhdUYb",
    "supply": 0,
    "decimals": 9,
    "isInitialized": true,
    "freezeAuthority": "6Qfrazzzqifu3e4Ff1J6WB4765yjZC1AbnQJ4bzhdUYb"
  }
  ```

### **Outcome**:
✅ Token successfully created and validated.

---

## 3. **Mint Tokens**

### **Description**:
The test mints tokens to an associated token account.

### **Logs**:
- Fetching Global Config...
- Fetching or creating Associated Token Account...
- **Associated Token Account Address**: 👁[View Account on Solana Explorer](https://explorer.solana.com/address/38qoL6hKoTJzne9AN3i2CXrEs67chz83ZKtZt7nvp55E?cluster=devnet)
- Starting transaction to mint tokens...
- **Transaction Signature**: 👁[View Transaction on Solana Explorer](https://explorer.solana.com/tx/2NVVrGm6JSKK3zEcKprDEXehdzrT3sU5KvMusjW4GNVe6Z3WiySpu6jaxvjEQ3WinwDQY66KDuLiSzTL1WyhdB1y?cluster=devnet)

- Fetching Associated Token Account Info...
- **Associated Token Account Info** (After Mint):
  ```json
  {
    "address": "38qoL6hKoTJzne9AN3i2CXrEs67chz83ZKtZt7nvp55E",
    "mint": "Gt41GseFWhefDMwS8gKs3PBz2NQBpuVL6kiGTRRi6srN",
    "owner": "AwaK517AuviY4K5RfVxBQJWtpHPAAYrSUfGaimG21kDy",
    "amount": 1000000000000000,
    "isInitialized": true,
    "isFrozen": false
  }
  ```

### **Outcome**:
✅ Tokens minted successfully and validated.

---

## 4. **Burn Tokens**

### **Description**:
The test burns tokens from an associated token account.


### **Logs**:
- Fetching Global Config...
- Fetching or creating Associated Token Account...
- **Associated Token Account Address**: 👁[View Account on Solana Explorer](https://explorer.solana.com/address/38qoL6hKoTJzne9AN3i2CXrEs67chz83ZKtZt7nvp55E?cluster=devnet)
- **Token Account Info (Before Burn)**:
  ```json
  {
    "amount": 1000000000000000
  }
  ```
- Burning tokens...
- **Transaction Signature**: 👁[View Transaction on Solana Explorer](https://explorer.solana.com/tx/2zcW2N1y2m5pTCuocu1T3G25jZAKoxiuuxbfnutC1cgnPUJMqhR6ZoKqArBhCVxRxuDNWFYRhyYnymNmh7JFmE6z?cluster=devnet)
- **Token Account Info (After Burn)**:
  ```json
  {
    "amount": 999500000000000
  }
  ```

### **Outcome**:
✅ Burn successful. Tokens burned as expected.

---

## Summary:
- **Total Tests**: 4
- **Passed**: 4
- **Failed**: 0
- **Execution Time**: ~15s
---
