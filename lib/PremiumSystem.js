import fs from 'fs';
import path from 'path';

const PREMIUM_DB = './data/premium-users.json';

// Ensure data directory exists
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
}

export class PremiumSystem {
  static loadDatabase() {
    try {
      if (fs.existsSync(PREMIUM_DB)) {
        return JSON.parse(fs.readFileSync(PREMIUM_DB, 'utf-8'));
      }
    } catch (e) {
      console.error('Error loading premium database:', e);
    }
    return { users: {} };
  }

  static saveDatabase(data) {
    try {
      fs.writeFileSync(PREMIUM_DB, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Error saving premium database:', e);
    }
  }

  static getUserStatus(userId) {
    const db = this.loadDatabase();
    const user = db.users[userId] || {
      tier: 'free',
      premiumExpiresAt: null,
      joinedAt: new Date().toISOString(),
      totalPremiumDays: 0
    };

    // Auto-expire premium if date passed
    if (user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
      user.tier = 'free';
      user.premiumExpiresAt = null;
      db.users[userId] = user;
      this.saveDatabase(db);
    }

    return user;
  }

  static upgradeToPremium(userId, days = 1) {
    const db = this.loadDatabase();
    const user = this.getUserStatus(userId);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    user.tier = 'premium';
    user.premiumExpiresAt = expiresAt.toISOString();
    user.totalPremiumDays = (user.totalPremiumDays || 0) + days;
    user.lastPremiumDate = now.toISOString();

    db.users[userId] = user;
    this.saveDatabase(db);

    return {
      success: true,
      user: user,
      expiresAt: expiresAt
    };
  }

  static isPremium(userId) {
    const user = this.getUserStatus(userId);
    return user.tier === 'premium' && user.premiumExpiresAt && new Date(user.premiumExpiresAt) > new Date();
  }

  static getDaysRemaining(userId) {
    const user = this.getUserStatus(userId);
    if (!user.premiumExpiresAt) return 0;
    
    const now = new Date();
    const expires = new Date(user.premiumExpiresAt);
    const diffTime = expires - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  static getStats() {
    const db = this.loadDatabase();
    let totalUsers = 0;
    let premiumUsers = 0;
    let freeUsers = 0;

    for (const userId in db.users) {
      totalUsers++;
      if (this.isPremium(userId)) {
        premiumUsers++;
      } else {
        freeUsers++;
      }
    }

    return { totalUsers, premiumUsers, freeUsers };
  }
}

export default PremiumSystem;