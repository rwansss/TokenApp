export class TomlGenerator {
  static generateToml(tokenData, issuerAddress) {
    return `[[ISSUERS]]
address = "${issuerAddress}"
name = "${tokenData.name}"
desc = "${tokenData.description || `Issuer of ${tokenData.name} token on XRPL.`}"

[[TOKENS]]
issuer = "${issuerAddress}"
currency = "${tokenData.symbol}"
name = "${tokenData.name}"
desc = "${tokenData.description || `${tokenData.name} is a token on the XRP Ledger.`}"
${tokenData.iconUrl ? `icon = "${tokenData.iconUrl}"` : ''}
${tokenData.bannerUrl ? `banner = "${tokenData.bannerUrl}"` : ''}

${tokenData.website ? `[[TOKENS.WEBLINKS]]
url = "${tokenData.website}"
type = "website"
title = "Official Website"
` : ''}

${tokenData.twitter ? `[[TOKENS.WEBLINKS]]
url = "https://twitter.com/${tokenData.twitter.replace('@', '')}"
type = "socialmedia"
title = "Twitter"
` : ''}

${tokenData.telegram ? `[[TOKENS.WEBLINKS]]
url = "https://t.me/${tokenData.telegram.replace('@', '')}"
type = "socialmedia"
title = "Telegram"
` : ''}`;
  }

  static downloadToml(content, symbol) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${symbol.toLowerCase()}.toml`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  static async verifyTomlUrl(domain) {
    try {
      const response = await fetch(`https://${domain}/.well-known/xrp-ledger.toml`);
      return response.ok;
    } catch (error) {
      console.error('Error verifying TOML:', error);
      return false;
    }
  }
} 