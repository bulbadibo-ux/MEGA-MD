import { PremiumSystem } from '../lib/PremiumSystem.js';

export default {
  command: 'aichat',
  aliases: ['ai', 'gpt'],
  category: 'premium',
  description: 'Chat dengan AI (Unlimited untuk Premium)',
  usage: '.aichat <pertanyaan>',
  
  async handler(sock, message, args, context = {}) {
    const {
      chatId,
      senderId,
      rawText,
      channelInfo
    } = context;

    try {
      const prompt = args.join(' ');

      if (!prompt) {
        return await sock.sendMessage(chatId, {
          text: `❌ Gunakan: .aichat <pertanyaan Anda>`,
          ...channelInfo
        }, { quoted: message });
      }

      const isPremium = PremiumSystem.isPremium(senderId);
      const user = PremiumSystem.getUserStatus(senderId);

      // Hitung usage (contoh dari stored data)
      const dailyKey = `ai_usage_${senderId}_${new Date().toISOString().split('T')[0]}`;
      const usageData = user.aiUsage || {};
      const todayUsage = usageData[dailyKey] || 0;

      // FREE: 3 request per hari
      // PREMIUM: Unlimited
      const MAX_FREE_USAGE = 3;

      if (!isPremium && todayUsage >= MAX_FREE_USAGE) {
        return await sock.sendMessage(chatId, {
          text: `⚠️ *Batas Penggunaan Harian*\n\nAnda sudah menggunakan ${todayUsage}/${MAX_FREE_USAGE} AI chat hari ini.\n\n💎 Upgrade ke Premium untuk unlimited usage!\n\n.buypremium`,
          ...channelInfo
        }, { quoted: message });
      }

      // Simulate AI response (ganti dengan API OpenAI/Claude yang sebenarnya)
      const aiResponse = await getAIResponse(prompt);

      let response = `🤖 *AI Response*\n\n`;
      response += aiResponse;
      
      if (!isPremium) {
        response += `\n\n_${todayUsage + 1}/${MAX_FREE_USAGE} chat hari ini_`;
        response += `\n💎 Upgrade ke premium untuk unlimited!`;
      }

      await sock.sendMessage(chatId, {
        text: response,
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('Error in aichat command:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${error.message}`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};

// Dummy AI response function (ganti dengan API nyata)
async function getAIResponse(prompt) {
  // Ini contoh dummy response
  // Ganti dengan OpenAI API atau Claude API yang sebenarnya
  return `Saya mengerti pertanyaan Anda: "${prompt}"\n\nIni adalah response dummy. Silakan integrasikan dengan OpenAI API atau Claude API untuk response yang sebenarnya.`;
}