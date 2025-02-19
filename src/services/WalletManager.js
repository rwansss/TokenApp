import { Client, Wallet } from 'xrpl';

export class WalletManager {
  static MAINNET_URL = 'wss://xrplcluster.com';

  static async generateWallet() {
    const client = new Client(this.MAINNET_URL);
    await client.connect();
    try {
      // Generate a new wallet without funding (since this is mainnet)
      const wallet = Wallet.generate();
      
      // Return wallet info
      return {
        address: wallet.address,
        seed: wallet.seed,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey
      };
    } finally {
      await client.disconnect();
    }
  }

  static async saveWallet(wallet) {
    try {
      // Save to localStorage for web persistence
      const existingWallets = JSON.parse(localStorage.getItem('xrpl_wallets') || '[]');
      existingWallets.push({
        address: wallet.address,
        seed: wallet.seed,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('xrpl_wallets', JSON.stringify(existingWallets));

      // Create downloadable files
      const jsonContent = JSON.stringify(existingWallets, null, 2);
      const seedsContent = existingWallets
        .map(w => `Address: ${w.address}\nSeed: ${w.seed}\nTimestamp: ${w.timestamp}\n\n`)
        .join('---\n');

      // Create and trigger downloads
      this.downloadFile('wallets.json', jsonContent);
      this.downloadFile('seeds.txt', seedsContent);
    } catch (error) {
      console.error('Error saving wallet:', error);
      throw error;
    }
  }

  static downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
} 