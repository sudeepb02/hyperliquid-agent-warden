# Self-Hosting Guide

Deploy the Hyperliquid Agent on your own infrastructure using Docker.

## Quick Start (No Databases)

**For stateless funding rate queries - the simplest deployment!**

This agent responds to instant requests without needing persistent conversation history. Perfect for quick funding rate lookups and stateless API responses.

### Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Your API key ready:
  - OpenAI API key from [platform.openai.com](https://platform.openai.com/)

### Setup

1. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```bash
   OPENAI_API_KEY=your_actual_openai_api_key
   AGENT_API_KEY=your_secure_agent_api_key
   ```

   **Generate a secure API key:**
   ```bash
   # On macOS/Linux
   openssl rand -base64 32

   # Or use a strong random password
   ```

2. **Start the agent:**
   ```bash
   docker compose up -d
   ```

3. **Access Studio UI:**
   - Go to [https://smith.langchain.com/studio](https://smith.langchain.com/studio)
   - Click "Connect to Server"
   - Enter: `http://localhost:8000`
   - **Add authentication header:**
     - Click on "Headers" or "Advanced"
     - Add header: `x-api-key: your_secure_agent_api_key`
   - Start asking funding rate questions!

### Managing Your Deployment

```bash
# View logs
docker compose logs -f

# Stop the agent
docker compose stop

# Remove completely
docker compose down
```

---

## Adding Persistent History

**Enable conversation history that survives restarts.**

Use persistent storage if you need multi-turn conversations, conversation history across restarts, or separate conversation threads.

### Setup

1. **Start full stack (Agent + Redis + PostgreSQL):**
   ```bash
   docker compose -f docker-compose.full.yml up -d
   ```

2. **Verify services are healthy:**
   ```bash
   docker compose -f docker-compose.full.yml ps
   ```

3. **Test persistence:**
   - Ask a question in Studio
   - Restart: `docker compose -f docker-compose.full.yml restart hyperliquid-agent`
   - Reconnect - your conversation history is preserved!

### Managing the Full Stack

```bash
# View logs
docker compose -f docker-compose.full.yml logs -f

# Stop all services
docker compose -f docker-compose.full.yml down

# Remove all data (⚠️ deletes conversation history)
docker compose -f docker-compose.full.yml down -v
```

### Backup

```bash
# Backup database
docker compose -f docker-compose.full.yml exec postgres pg_dump \
  -U langgraph langgraph > backup-$(date +%Y%m%d).sql

# Restore
docker compose -f docker-compose.full.yml exec -T postgres psql \
  -U langgraph langgraph < backup-20250108.sql
```

---

## Security

### API Key Authentication

The agent is protected with API key authentication. All requests must include the `x-api-key` header:

```bash
# Test with curl
curl -H "x-api-key: your_secure_agent_api_key" http://localhost:8000/
```

**Security Best Practices:**
- ✅ Generate a strong, random API key (use `openssl rand -base64 32`)
- ✅ Keep your API key secret (never commit `.env` to git)
- ✅ Rotate keys periodically
- ✅ Use HTTPS in production (not covered in this setup)
- ⚠️ If `AGENT_API_KEY` is not set, authentication is disabled (not recommended!)

---

## Using the API

### With LangSmith Studio

1. Visit [https://smith.langchain.com/studio](https://smith.langchain.com/studio)
2. Click "Connect to Server"
3. Enter server URL: `http://localhost:8000`
4. Add authentication header: `x-api-key: your_secure_agent_api_key`
5. Start asking questions!

### With cURL

```bash
# Example: Get current funding rate for BTC
curl -X POST http://localhost:8000/runs/stream \
  -H "x-api-key: your_secure_agent_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "hyperliquid_agent",
    "input": {
      "messages": [
        {
          "role": "user",
          "content": "What is the current funding rate for BTC?"
        }
      ]
    }
  }'
```

### With Python

```python
import requests

url = "http://localhost:8000/runs/stream"
headers = {
    "x-api-key": "your_secure_agent_api_key",
    "Content-Type": "application/json"
}
data = {
    "assistant_id": "hyperliquid_agent",
    "input": {
        "messages": [
            {
                "role": "user",
                "content": "What are the top 5 funding rates right now?"
            }
        ]
    }
}

response = requests.post(url, headers=headers, json=data, stream=True)
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
```

### With TypeScript/JavaScript

```typescript
const response = await fetch('http://localhost:8000/runs/stream', {
  method: 'POST',
  headers: {
    'x-api-key': 'your_secure_agent_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    assistant_id: 'hyperliquid_agent',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Compare funding rates of ETH and SOL',
        },
      ],
    },
  }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
```

---

## Configuration

All configuration via `.env` file:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here
AGENT_API_KEY=your_secure_agent_api_key  # To protect your agent

# Optional
MODEL_NAME=gpt-4o-mini              # AI model (gpt-4o, gpt-3.5-turbo)
TEMPERATURE=0                        # Response creativity (0-1)
POSTGRES_PASSWORD=secure_password    # Change in production!

# Optional: LangSmith tracing
LANGSMITH_API_KEY=your_langsmith_key
LANGSMITH_PROJECT=hyperliquid-agent
LANGSMITH_TRACING=true
```

**Change default port:**
Edit `docker-compose.yml`:
```yaml
services:
  hyperliquid-agent:
    ports:
      - "3000:8000"  # Access on port 3000
```

---

## Production Deployment

### Recommended Setup

For production deployments:

1. **Use the full stack** (`docker-compose.full.yml`) for persistence
2. **Enable HTTPS** with a reverse proxy (nginx, Caddy, Traefik)
3. **Use strong passwords** for PostgreSQL and API keys
4. **Enable monitoring** (see below)
5. **Set up backups** for the PostgreSQL database
6. **Use a production-grade OpenAI plan** for higher rate limits

### Reverse Proxy Example (nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name agent.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Monitoring

Add health checks to your monitoring system:

```bash
# Health check endpoint
curl -H "x-api-key: your_api_key" http://localhost:8000/health

# Expected: 200 OK
```

### Resource Requirements

**Minimal (Simple deployment):**
- CPU: 1 core
- RAM: 512 MB
- Storage: 1 GB

**Recommended (Full deployment with persistence):**
- CPU: 2 cores
- RAM: 2 GB
- Storage: 10 GB (for conversation history)

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 8000
lsof -i :8000

# Change port in docker-compose.yml
ports:
  - "8001:8000"
```

### Cannot Connect to the Agent
1. Check container is running: `docker compose ps`
2. Check logs: `docker compose logs hyperliquid-agent`
3. Test connection: `curl -H "x-api-key: your_api_key" http://localhost:8000/`
4. Verify you're providing the correct `x-api-key` header

### Build Failures
```bash
# Clean build
docker compose build --no-cache

# Check disk space
df -h
```

### Database Connection Errors
```bash
# Check database is healthy
docker compose -f docker-compose.full.yml exec postgres pg_isready

# Check connection string
docker compose -f docker-compose.full.yml logs hyperliquid-agent
```

### Out of Memory Errors
```bash
# Increase Docker memory limit in Docker Desktop settings
# Or edit docker-compose.yml to add memory limits:
services:
  hyperliquid-agent:
    mem_limit: 1g
```

### Hyperliquid API Issues

The Hyperliquid API is public and doesn't require authentication, but can sometimes be rate-limited or slow. If you experience issues:

1. Check Hyperliquid's status: https://hyperliquid.xyz/
2. Verify your network can reach Hyperliquid's endpoints
3. Add retry logic in your application if needed

---

## Scaling

### Horizontal Scaling

Run multiple agent instances behind a load balancer:

```yaml
# docker-compose.scale.yml
services:
  hyperliquid-agent:
    # ... same config ...
    deploy:
      replicas: 3  # Run 3 instances
```

Then use nginx or a cloud load balancer to distribute requests.

### Caching

Consider adding Redis caching for frequently requested funding rates to reduce API calls and improve response times.

---

## Costs

### Infrastructure Costs

**Cloud VPS (e.g., DigitalOcean, AWS EC2):**
- Small instance: ~$5-10/month
- Medium instance: ~$20-40/month

**OpenAI API:**
- With gpt-4o-mini: ~$0.0001 per request
- 10,000 requests/month ≈ $1

**Total estimated cost:** $6-41/month depending on scale

---

## Support

**Issues?**
- Check logs first: `docker compose logs -f`
- Review this guide thoroughly
- Open an issue on GitHub with logs and configuration (sanitize sensitive data!)

**Want to contribute?**
- Improve documentation
- Add features
- Report bugs
- Share your deployment experiences

---

**Happy deploying! 🚀**

For more information, see the main [README.md](README.md)
