# Quick Survey

A dark-mode survey page that sends responses to a Discord webhook through a server-side proxy.

## Setup

1. Install dependencies:
   - npm install
2. Create a .env file at the project root:
   - DISCORD_WEBHOOK_URL=your_discord_webhook_url
3. Start the dev server:
   - npm run dev

## Notes

- The frontend never calls Discord directly.
- The server route reads DISCORD_WEBHOOK_URL from the environment.
