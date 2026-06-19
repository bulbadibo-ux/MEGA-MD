import { PremiumSystem } from '../lib/PremiumSystem.js';

export default {
  command: 'buypremium',
  aliases: ['premium', 'upgradefee'],
  category: 'premium',
  description: 'Upgrade ke premium selama 1 hari dengan fee',
  usage: '.buypremium (otomatis 1 hari) atau .buypremium 3 (untuk 3 hari)',
  
  async handler(sock, message, args, context = {}) {
    const {
      chatId,
      senderId,
      channelInfo
    } = context;

    try {
      // Parse days (default 1 hari)
      let days = parseInt(args[0]) || 1;
      
      // Limit maksimal 30 hari per transaksi
      if (days > 30) {
        days = 30;
      }
      if (days < 1) {
        days = 1;
      }

      // Hitung fee: 1000 per hari (bisa disesuaikan)
      const FEE_PER_DAY = 1000;
      const totalFee = days * FEE_PER_DAY;

      // Cek status user saat ini
      const currentStatus = PremiumSystem.getUserStatus(senderId);
      const isPremium = PremiumSystem.isPremium(senderId);
      const daysRemaining = PremiumSystem.getDaysRemaining(senderId);

      // Generate payment ID unik
      const paymentId = `PREMIUM_${senderId.split('@')[0]}_${Date.now()}`;

      let responseText = `╔════════════════════════════╗\n`;
      responseText += `║  💎 PREMIUM UPGRADE 💎     ║\n`;
      responseText += `╚════════════════════════════╝\n\n`;

      responseText += `📊 *Status Saat Ini:*\n`;
      responseText += `├ Tier: ${isPremium ? '⭐ PREMIUM' : '👤 FREE'}\n`;
      
      if (isPremium) {
        responseText += `├ Sisa: ${daysRemaining} hari\n`;
        responseText += `├ Exp: ${new Date(currentStatus.premiumExpiresAt).toLocaleDateString('id-ID')}\n`;
      }
      
      responseText += `├ Total Premium: ${currentStatus.totalPremiumDays} hari\n\n`;

      responseText += `💰 *Paket Premium ${days} Hari:*\n`;
      responseText += `├ Harga: Rp ${totalFee.toLocaleString('id-ID')}\n`;
      responseText += `├ Payment ID: ${paymentId}\n\n`;

      responseText += `✨ *Benefit Premium:*\n`;
      responseText += `├ ✓ AI Unlimited\n`;
      responseText += `├ ✓ Video Download HD\n`;
      responseText += `├ ✓ Music Search Unlimited\n`;
      responseText += `├ ✓ Remove BG Unlimited\n`;
      responseText += `├ ✓ Image Enhance 8K\n`;
      responseText += `├ ✓ Premium Stickers\n`;
      responseText += `├ ✓ Priority Support\n\n`;

      responseText += `📱 *Cara Pembayaran:*\n`;
      responseText += `┌─ Transfer ke nomor terdaftar\n`;
      responseText += `├ Sebutkan Payment ID saat transfer\n`;
      responseText += `├ Tunggu konfirmasi dari owner\n`;
      responseText += `└ Premium langsung aktif!\n\n`;

      responseText += `📞 *Hubungi Owner:*\n`;
      responseText += `└ ${context.config?.BOT_OWNER || 'Admin MEGA-MD'}\n`;

      await sock.sendMessage(chatId, {
        text: responseText,
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('Error in buypremium command:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${error.message}`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};