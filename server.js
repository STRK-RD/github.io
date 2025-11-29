const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/send-message', async (req, res) => {
  try {
    const { botToken, channelId, message, repeatCount = 1 } = req.body;

    if (!botToken || !channelId || !message || !Number.isInteger(repeatCount) || repeatCount < 1) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    for (let i = 0; i < repeatCount; i++) {
      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${botToken}`
        },
        body: JSON.stringify({ content: message })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const detail = errorBody.message || `Discord error (${response.status})`;
        return res.status(response.status).json({ message: detail });
      }
    }

    res.json({ message: `${repeatCount} message(s) sent successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
