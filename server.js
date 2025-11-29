const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendDiscordMessage({ botToken, channelId, message }) {
  while (true) {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${botToken}`
      },
      body: JSON.stringify({ content: message })
    });

    if (response.status === 429) {
      const retryAfterHeader = parseFloat(response.headers.get('retry-after'));
      let retryMs = Number.isFinite(retryAfterHeader) ? retryAfterHeader * 1000 : 1000;

      const body = await response.json().catch(() => ({}));
      if (body && Number.isFinite(body.retry_after)) {
        retryMs = body.retry_after * 1000;
      }

      await sleep(retryMs);
      continue;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const detail = errorBody.message || `Discord error (${response.status})`;
      throw new Error(detail);
    }

    return;
  }
}

app.post('/send-message', async (req, res) => {
  try {
    const { botToken, channelId, message, repeatCount = 1 } = req.body;

    if (!botToken || !channelId || !message || !Number.isInteger(repeatCount) || repeatCount < 1) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    for (let i = 0; i < repeatCount; i++) {
      await sendDiscordMessage({ botToken, channelId, message });
    }

    res.json({ message: `${repeatCount} message(s) sent successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
