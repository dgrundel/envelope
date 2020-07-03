# Transaction Linking

This doc describes (in rough form) the ways that imported bank and credit card transactions
can be linked to other accounts/transactions

**Account and envelope types used below:**

- Deposit Accounts (Checking, Savings, etc)
- Credit Card Accounts
- User(-defined) Envelopes
- (Credit Card) Payment Envelopes
- Unallocated Envelope (aka "Ready to Budget")

## Imported Transaction Types

### Credit Card/Credit (Payment or Refund)

**Can Link to:**

- Deposit Account (as transfer, only if payment)
- Unallocated Envelope (as incoming money, only if refund)
- User Envelopes (as incoming money, only if refund)

### Credit Card/Debit (Purchase)

**Can Link to:**

- User Envelopes (as traditional purchase)

### Bank/Credit

**Can Link to:**

- Unallocated Envelope (as incoming money)
- Other Deposit Account (only as transfer)

### Bank/Debit

**Can Link to:**

- User Envelopes (as traditional purchase)
- Payment Envelopes  (as credit card payment)
- Other Deposit Account (only as transfer)






