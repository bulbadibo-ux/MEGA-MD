import { PremiumSystem } from '../lib/PremiumSystem.js';
import fs from 'fs';

export default {
  command: 'premiumstats',
  aliases: ['pstats', 'premiumanalytic'],
  category: 'admin',
  description: 'Lihat statistik premium users (Owner/Sudo only)',
  usage: '.premiumstats',
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
          text: `❌ Hanya owner/sudo yang bisa menggunakan command ini!`,
          ...channelInfo
        }, { quoted: message });
      }

      const stats = PremiumSystem.getStats();
      const db = PremiumSystem.loadDatabase();

      // Hitung statistik detail
      let activeExpiringSoon = 0;
      let expiredToday = 0;
      let totalActivePremiumDays = 0;
      const premiumUsers = [];

      for (const userId in db.users) {
        const user = db.users[userId];
        const isPremium = PremiumSystem.isPremium(userId);
        
        if (isPremium) {
          premiumUsers.push({
            userId,
            expiresAt: user.premiumExpiresAt,
            daysRemaining: PremiumSystem.getDaysRemaining(userId)
          });
          
          const remaining = PremiumSystem.getDaysRemaining(userId);
          if (remaining <= 1 && remaining > 0) {
            activeExpiringSoon++;
          }
          totalActivePremiumDays += remaining;
        }
      }

      // Sort by expiry date
      premiumUsers.sort((a, b) => 
        new Date(a.expiresAt) - new Date(b.expiresAt)
      );

      let response = `╔═══════════════════════════════╗\n`;
      response += `║  📊 PREMIUM STATISTICS 📊     ║\n`;
      response += `╚═══════════════════════════════╝\n\n`;

      // Summary
      response += `📈 *RINGKASAN:*\n`;
      response += `├ Total Users: ${stats.totalUsers}\n`;
      response += `├ Premium Users: ${stats.premiumUsers} (${((stats.premiumUsers/stats.totalUsers)*100).toFixed(1)}%)\n`;
      response += `├ Free Users: ${stats.freeUsers} (${((stats.freeUsers/stats.totalUsers)*100).toFixed(1)}%)\n`;
      response += `├ Expiring Soon (1 hari): ${activeExpiringSoon}\n`;
      response += `├ Total Premium Days Active: ${totalActivePremiumDays}\n\n`;

      // Top expiring users
      if (premiumUsers.length > 0) {
        response += `⏳ *PREMIUM USERS (Expiry Soon):*\n`;
        const topExpiring = premiumUsers.slice(0, 5);
        topExpiring.forEach((user, idx) => {
          const symbol = idx === topExpiring.length - 1 ? '└' : '├';
          response += `${symbol} ${user.userId.split('@')[0]} - ${user.daysRemaining} hari\n`;
        });
        response += `\n`;
      }

      // Revenue estimate (jika harga 1000 per hari)
      const estimatedRevenue = stats.premiumUsers * 1000;
      response += `💰 *ESTIMASI REVENUE:*\n`;
      response += `├ Est. Daily: Rp ${estimatedRevenue.toLocaleString('id-ID')}\n`;
      response += `├ Est. Monthly: Rp ${(estimatedRevenue * 30).toLocaleString('id-ID')}\n\n`;

      // File info
      const dbPath = './data/premium-users.json';
      if (fs.existsSync(dbPath)) {
        const dbSize = fs.statSync(dbPath).size;
        const lastModified = fs.statSync(dbPath).mtime;
        
        response += `💾 *DATABASE:*\n`;
        response += `├ File Size: ${(dbSize/1024).toFixed(2)} KB\n`;
        response += `├ Last Update: ${lastModified.toLocaleDateString('id-ID')}\n`;
        response += `└ Path: ${dbPath}\n`;
      }

      await sock.sendMessage(chatId, {
        text: response,
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('Error in premiumstats command:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${error.message}`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};