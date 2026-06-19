import { PremiumSystem } from '../lib/PremiumSystem.js';

export default {
  command: 'managepremium',
  aliases: ['manageprem', 'premiummanage'],
  category: 'admin',
  description: 'Kelola premium users (extend, revoke, check) - Owner/Sudo only',
  usage: `.managepremium extend @user 3
.managepremium revoke @user
.managepremium check @user`,
  ownerOnly: true,
  
  async handler(sock, message, args, context = {}) {
    const {
      chatId,
      senderIsOwnerOrSudo,
      channelInfo
    } = context;

    try {
      if (!senderIsOwnerOrSudo) {
        return await sock.sendMessage(chatId, {
          text: `❌ Hanya owner/sudo!`,
          ...channelInfo
        }, { quoted: message });
      }

      const action = args[0]?.toLowerCase();
      const mentionedJid = message?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const targetUser = mentionedJid || args[1]?.replace('@', '') + '@s.whatsapp.net';

      if (!action || !['extend', 'revoke', 'check', 'reset'].includes(action)) {
        let help = `❌ Action tidak valid\n\n`;
        help += `📋 *Gunakan:*\n`;
        help += `├ .managepremium extend @user 3 → Add 3 hari\n`;
        help += `├ .managepremium revoke @user → Revoke premium\n`;
        help += `├ .managepremium check @user → Cek detail\n`;
        help += `└ .managepremium reset @user → Reset to free\n`;
        
        return await sock.sendMessage(chatId, {
          text: help,
          ...channelInfo
        }, { quoted: message });
      }

      if (!targetUser) {
        return await sock.sendMessage(chatId, {
          text: `❌ Mention user terlebih dahulu!`,
          ...channelInfo
        }, { quoted: message });
      }

      let response = ``;

      switch (action) {
        case 'extend': {
          const days = parseInt(args[2]) || 1;
          if (days < 1) {
            return await sock.sendMessage(chatId, {
              text: `❌ Jumlah hari minimal 1!`,
              ...channelInfo
            }, { quoted: message });
          }

          const result = PremiumSystem.upgradeToPremium(targetUser, days);
          response = `✅ *Premium Extended*\n\n`;
          response += `👤 User: ${targetUser.split('@')[0]}\n`;
          response += `➕ Tambahan: +${days} hari\n`;
          response += `⌛ Total Expire: ${new Date(result.expiresAt).toLocaleDateString('id-ID')}\n`;
          response += `📊 Status: ${PremiumSystem.isPremium(targetUser) ? '✅ ACTIVE' : '❌ EXPIRED'}\n`;
          break;
        }

        case 'revoke': {
          const db = PremiumSystem.loadDatabase();
          if (db.users[targetUser]) {
            db.users[targetUser].tier = 'free';
            db.users[targetUser].premiumExpiresAt = null;
            PremiumSystem.saveDatabase(db);
          }
          
          response = `🔴 *Premium Revoked*\n\n`;
          response += `👤 User: ${targetUser.split('@')[0]}\n`;
          response += `📊 Status: Free User\n`;
          response += `⏰ Revoked At: ${new Date().toLocaleTimeString('id-ID')}\n`;
          break;
        }

        case 'check': {
          const user = PremiumSystem.getUserStatus(targetUser);
          const isPremium = PremiumSystem.isPremium(targetUser);
          const daysRemaining = PremiumSystem.getDaysRemaining(targetUser);

          response = `🔍 *Premium Details*\n\n`;
          response += `👤 User: ${targetUser.split('@')[0]}\n`;
          response += `📊 Tier: ${isPremium ? '⭐ PREMIUM' : '👤 FREE'}\n`;
          
          if (isPremium) {
            response += `⏳ Sisa: ${daysRemaining} hari\n`;
            response += `⌛ Exp: ${new Date(user.premiumExpiresAt).toLocaleDateString('id-ID')}\n`;
          }
          
          response += `📈 Total Premium Days: ${user.totalPremiumDays} hari\n`;
          response += `📅 Joined: ${new Date(user.joinedAt).toLocaleDateString('id-ID')}\n`;
          break;
        }

        case 'reset': {
          const db = PremiumSystem.loadDatabase();
          if (db.users[targetUser]) {
            db.users[targetUser] = {
              tier: 'free',
              premiumExpiresAt: null,
              joinedAt: new Date().toISOString(),
              totalPremiumDays: 0,
              lastPremiumDate: null
            };
            PremiumSystem.saveDatabase(db);
          }
          
          response = `🔄 *User Reset*\n\n`;
          response += `👤 User: ${targetUser.split('@')[0]}\n`;
          response += `📊 Status: Reset to Free\n`;
          response += `💾 All data cleared\n`;
          break;
        }
      }

      await sock.sendMessage(chatId, {
        text: response,
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('Error in managepremium command:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${error.message}`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};