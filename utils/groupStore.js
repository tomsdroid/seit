const fs = require('fs');
const path = require('path');
const storePath = path.join(__dirname, '../groups.json');

module.exports = {
    saveGroup: (title, id, threadId = null) => {
        let data = {};
        if (fs.existsSync(storePath)) {
            data = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
        }

        data[title] = {
            chat_id: id,
            thread_id: threadId
        };

        fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
    },
    getGroup: (title) => {
        if (!fs.existsSync(storePath)) return null;
        const data = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
        return data[title] || null;
    }
};
