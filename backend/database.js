const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'nexus.db'));

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversationId TEXT,
    role TEXT,
    content TEXT,
    analysis TEXT,
    optimizedCode TEXT,
    language TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversationId) REFERENCES conversations(id)
  );

  CREATE TABLE IF NOT EXISTS knowledge_base (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_name TEXT,
    description TEXT,
    solution TEXT,
    tags TEXT
  );
`);

// Seed Knowledge Base with common optimizations
const seedKnowledge = () => {
    const row = db.prepare('SELECT count(*) as count FROM knowledge_base').get();
    if (row.count === 0) {
        const insert = db.prepare('INSERT INTO knowledge_base (pattern_name, description, solution, tags) VALUES (?, ?, ?, ?)');
        
        const patterns = [
            [
                'React useEffect Missing Cleanup',
                'useEffect hooks that subscribe to events or start timers without a cleanup function cause memory leaks.',
                'Always return a cleanup function () => { ... } to unsubscribe or clear intervals.',
                'react,performance'
            ],
            [
                'Vulnerable InnerHTML',
                'Setting innerHTML with untrusted user input leads to XSS vulnerabilities.',
                'Use textContent or a sanitization library like DOMPurify.',
                'security,vulnerability'
            ],
            [
                'Synchronous Loop on Large Arrays',
                'Using forEach or map on massive arrays in the main thread can block the UI.',
                'Consider using Web Workers or processing in chunks with requestIdleCallback.',
                'performance,optimization'
            ],
            [
                'Missing window Checks (SSR)',
                'Accessing window or localStorage in code that might run on the server (like Next.js) throws errors.',
                'Wrap in if (typeof window !== "undefined") checks.',
                'ssr,bug'
            ]
        ];

        for (const p of patterns) {
            insert.run(...p);
        }
        console.log('Knowledge Base Seeded.');
    }
};

seedKnowledge();

module.exports = {
    // Conversation methods
    getConversation: (id) => db.prepare('SELECT * FROM conversations WHERE id = ?').get(id),
    createConversation: (id, title) => db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run(id, title),
    
    // Message methods
    getMessagesByConversation: (conversationId) => db.prepare('SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC').all(conversationId),
    saveMessage: (msg) => {
        const { conversationId, role, content, analysis, optimizedCode, language } = msg;
        return db.prepare(`
            INSERT INTO messages (conversationId, role, content, analysis, optimizedCode, language)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(conversationId, role, content, JSON.stringify(analysis), optimizedCode, language);
    },

    // RAG Retrieval
    searchKnowledge: (query) => {
        // Basic keyword search for now
        const terms = query.toLowerCase().split(' ').filter(t => t.length > 3);
        if (terms.length === 0) return [];
        
        const placeholders = terms.map(() => '(pattern_name LIKE ? OR description LIKE ? OR tags LIKE ?)').join(' OR ');
        const params = [];
        terms.forEach(t => params.push(`%${t}%`, `%${t}%`, `%${t}%`));
        
        return db.prepare(`SELECT * FROM knowledge_base WHERE ${placeholders} LIMIT 3`).all(...params);
    }
};
