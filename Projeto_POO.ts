class BankAccount {
    accountNumber: string;
    ownerName: string;
    balance: number;

    constructor(accountNumber: string, ownerName: string, initialBalance: number) {
        this.accountNumber = accountNumber;
        this.ownerName = ownerName;
        this.balance = initialBalance;
    }

    deposit(amount: number): void {
        if (amount > 0) {
            this.balance += amount;
            console.log(`Deposit of ${amount} successful. New balance: ${this.balance}`);
        } else {
            console.log("Deposit amount must be positive.");
        }
    }

    withdraw(amount: number): void {
        if (amount > 0) {
            if (this.balance >= amount) {
                this.balance -= amount;
                console.log(`Withdrawal of ${amount} successful. New balance: ${this.balance}`);
            } else {
                console.log("Insufficient funds.");
            }
        } else {
            console.log("Withdrawal amount must be positive.");
        }
    }

    checkBalance(): void {
        console.log(`Current balance for ${this.ownerName} (Account: ${this.accountNumber}): ${this.balance}`);
    }
}

// Example Usage
const myAccount = new BankAccount("12345", "Alice Smith", 1000);
myAccount.checkBalance();
myAccount.deposit(500);
myAccount.withdraw(200);
myAccount.withdraw(1500); // Should show insufficient funds
myAccount.checkBalance();
