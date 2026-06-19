import { PremiumSystem } from '../lib/PremiumSystem.js';

export default {
  command: 'premiuminfo',
  aliases: ['pinfo', 'mystatus', 'checkpremium'],
  category: 'premium',
  description: 'Cek status premium Anda',
  usage: '.premiuminfo',
  
  async handler(sock, message, args, context = {}) {
    const {
      chatId,
      senderId,
      channelInfo
    } = context;

    try {
      const user = PremiumSystem.getUserStatus(senderId);
      const isPremium = PremiumSystem.isPremium(senderId);
      const daysRemaining = PremiumSystem.getDaysRemaining(senderId);

      let response = `╔════════════════════════════╗\n`;
      response += `║  📊 STATUS PREMIUM 📊      ║\n`;
      response += `╚════════════════════════════╝\n\n`;

      response += `👤 *Informasi Pengguna:*\n`;
      response += `├ ID: ${senderId.split('@')[0]}\n`;
      response += `├ Bergabung: ${new Date(user.joinedAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}\n\n`;

      if (isPremium) {
        response += `⭐ *Status: PREMIUM USER* ⭐\n`;
        response += `├ Sisa Waktu: ${daysRemaining} hari\n`;
        response += `├ Berlaku Hingga: ${new Date(user.premiumExpiresAt).toLocaleDateString('id-ID')}\n`;
        response += `├ Jam Exp: ${new Date(user.premiumExpiresAt).toLocaleTimeString('id-ID')}\n\n`;
      } else {
        response += `👤 *Status: FREE USER* 👤\n`;
        response += `├ Upgrade untuk unlock premium features\n\n`;
      }

      response += `📈 *Statistik:*\n`;
      response += `├ Total Hari Premium: ${user.totalPremiumDays} hari\n`;
      
      if (user.lastPremiumDate) {
        response += `├ Terakhir Upgrade: ${new Date(user.lastPremiumDate).toLocaleDateString('id-ID')}\n`;
      }

      response += `\n💎 *Fitur ${isPremium ? 'Aktif' : 'Unlock'} di Premium:*\n`;
      response += `${isPremium ? '✅' : '🔒'} AI Chatbot Unlimited\n`;
      response += `${isPremium ? '✅' : '🔒'} Video Download HD\n`;
      response += `${isPremium ? '✅' : '🔒'} Music Download Unlimited\n`;
      response += `${isPremium ? '✅' : '🔒'} Remove Background\n`;
      response += `${isPremium ? '✅' : '🔒'} Image Enhancement 8K\n`;
      response += `${isPremium ? '✅' : '🔒'} Premium Stickers\n`;
      response += `${isPremium ? '✅' : '🔒'} Priority Support\n\n`;

      if (!isPremium) {
        response += `💰 *Upgrade Sekarang!*\n`;
        response += `🎯 Ketik: .buypremium\n`;
        response += `📧 Hubungi admin untuk promo special\n`;
      }

      await sock.sendMessage(chatId, {
        text: response,
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('Error in premiuminfo command:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${error.message}`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};