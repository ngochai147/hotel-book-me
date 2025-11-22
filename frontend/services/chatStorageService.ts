import * as SQLite from 'expo-sqlite';

const DB_NAME = 'hotelBookingChat.db';

export interface StoredMessage {
  id: number;
  messageId: number;
  text: string;
  isUser: number; // SQLite stores as INTEGER (0 or 1)
  time: string;
  type?: string;
  hotelsData?: string; // JSON string
  roomsData?: string; // JSON string
  hotelName?: string;
  bookingData?: string; // JSON string
  createdAt: number;
}

class ChatStorageService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      
      // Create messages table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          messageId INTEGER NOT NULL,
          text TEXT NOT NULL,
          isUser INTEGER NOT NULL,
          time TEXT NOT NULL,
          type TEXT,
          hotelsData TEXT,
          roomsData TEXT,
          hotelName TEXT,
          bookingData TEXT,
          createdAt INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_createdAt ON messages(createdAt DESC);
      `);

      console.log('Chat database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize chat database:', error);
    }
  }

  async saveMessage(message: any) {
    if (!this.db) await this.init();
    
    try {
      await this.db?.runAsync(
        `INSERT INTO messages (messageId, text, isUser, time, type, hotelsData, roomsData, hotelName, bookingData, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          message.id,
          message.text,
          message.isUser ? 1 : 0,
          message.time,
          message.type || 'text',
          message.hotels ? JSON.stringify(message.hotels) : null,
          message.rooms ? JSON.stringify(message.rooms) : null,
          message.hotelName || null,
          message.bookingData ? JSON.stringify(message.bookingData) : null,
          Date.now()
        ]
      );
      
      console.log('Message saved to database:', message.id);
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }

  async loadMessages(limit: number = 100): Promise<any[]> {
    if (!this.db) await this.init();
    
    try {
      const results = await this.db?.getAllAsync<StoredMessage>(
        'SELECT * FROM messages ORDER BY createdAt DESC LIMIT ?',
        [limit]
      );

      if (!results) return [];

      // Convert stored messages back to Message format
      const messages = results.reverse().map(row => {
        const message: any = {
          id: row.messageId,
          text: row.text,
          isUser: row.isUser === 1,
          time: row.time,
          type: row.type || 'text',
        };

        if (row.hotelsData) {
          try {
            message.hotels = JSON.parse(row.hotelsData);
          } catch (e) {
            console.error('Failed to parse hotels data:', e);
          }
        }

        if (row.roomsData) {
          try {
            message.rooms = JSON.parse(row.roomsData);
          } catch (e) {
            console.error('Failed to parse rooms data:', e);
          }
        }

        if (row.hotelName) {
          message.hotelName = row.hotelName;
        }

        if (row.bookingData) {
          try {
            message.bookingData = JSON.parse(row.bookingData);
          } catch (e) {
            console.error('Failed to parse booking data:', e);
          }
        }

        return message;
      });

      console.log(`Loaded ${messages.length} messages from database`);
      return messages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }

  async clearAllMessages() {
    if (!this.db) await this.init();
    
    try {
      await this.db?.runAsync('DELETE FROM messages');
      console.log('All messages cleared from database');
    } catch (error) {
      console.error('Failed to clear messages:', error);
    }
  }

  async deleteOldMessages(daysToKeep: number = 30) {
    if (!this.db) await this.init();
    
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    try {
      await this.db?.runAsync(
        'DELETE FROM messages WHERE createdAt < ?',
        [cutoffTime]
      );
      console.log(`Deleted messages older than ${daysToKeep} days`);
    } catch (error) {
      console.error('Failed to delete old messages:', error);
    }
  }

  async getMessageCount(): Promise<number> {
    if (!this.db) await this.init();
    
    try {
      const result = await this.db?.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM messages'
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Failed to get message count:', error);
      return 0;
    }
  }
}

export const chatStorage = new ChatStorageService();
