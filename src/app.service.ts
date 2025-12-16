import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): {
    status: string;
    message: string;
    data: any;
    timestamp: string;
  } {
    return {
      status: 'success',
      message: 'Welcome to Wallet Service 🚀',
      data: {
        title: 'Wallet Service – Manage Your Finances Seamlessly',
        description:
          'Wallet Service provides a robust platform to manage wallets, perform fund transfers and track transactions efficiently.',
        features: [
          '💳 Wallet Management – Create, view, and manage wallets with multiple currencies',
          '🔄 Fund Transfers – Transfer money securely between wallets with idempotency protection',
          '📈 Transaction Tracking – Keep a full history of credits, debits, and transfers',
          '🛡️ Exception Handling – Prevent insufficient funds, currency mismatches, and invalid operations',
          '✅ High Test Coverage – Fully tested modules with unit and integration tests',
        ],
        getStarted:
          'https://www.postman.com/planetary-trinity-671710/wallet/overview',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
