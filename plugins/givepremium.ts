import { PremiumSystem } from '../lib/PremiumSystem.js';

export default {
  command: 'givepremium',
  aliases: ['addpremium', 'premiumgrant'],
  category: 'admin',
  description: 'Berikan premium ke user (Owner/Sudo only)',
  usage: '.givepremium @user 1 (memberikan 1 hari premium)',
  ownerOnly: true,
  
  async handler(sock, message, args, context = {}) {
    const {
      chatId,
      senderId,
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

      // Ambil user dari mention atau argument
      const mentionedJid = message?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const targetUser = mentionedJid || args[0]?.replace('@', '') + '@s.whatsapp.net';
      const days = parseInt(args[1]) || 1;

      if (!targetUser) {
        return await sock.sendMessage(chatId, {
          text: `❌ Gunakan: .givepremium @user 1`,
          ...channelInfo
        }, { quoted: message });
      }

      // Validate days
      if (days < 1 || days > 365) {
        return await sock.sendMessage(chatId, {
          text: `❌ Jumlah hari harus 1-365!`,
          ...channelInfo
        }, { quoted: message });
      }

      const result = PremiumSystem.upgradeToPremium(targetUser, days);

      let response = `✅ *Premium Granted!*\n\n`;
      response += `👤 User: ${targetUser.split('@')[0]}\n`;
      response += `⏰ Durasi: ${days} hari\n`;
      response += `⌛ Berlaku Hingga: ${new Date(result.expiresAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}\n`;
      response += `\n📊 Status User:\n`;
      response += `├ Tier: ⭐ PREMIUM\n`;
      response += `├ Sisa: ${PremiumSystem.getDaysRemaining(targetUser)} hari\n`;
      response += `├ Total Premium Pernah: ${result.user.totalPremiumDays} hari`;

      await sock.sendMessage(chatId, {
        text: response,
        ...channelInfo
      }, { quoted: message });

      // Notify user (jika ada di chat)
      try {
        await sock.sendMessage(targetUser, {
          text: `✨ *Selamat!* ✨\n\nAnda telah diupgrade ke PREMIUM!\n\n⏰ Durasi: ${days} hari\n⌛ Berlaku hingga: ${new Date(result.expiresAt).toLocaleDateString('id-ID')}\n\n💎 Nikmati semua fitur premium!\n\nKetik .premiuminfo untuk cek status`,
          ...channelInfo
        });
      } catch (e) {
        console.log('Could not notify user');
      }

    } catch (error) {
      console.error('Error in givepremium command:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${error.message}`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};