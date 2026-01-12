# Hyperliquid Funding Rate Agent

An AI-powered agent that analyzes funding rates on the Hyperliquid perpetual futures exchange. Get real-time funding rate data, identify arbitrage opportunities, and understand market trends.

## What Does This Agent Do?

Ask questions like:
- "What is the current funding rate for BTC?"
- "Are there any arbitrage opportunities based on current funding rates?"
- "Which token has the highest funding rate APR right now?"
- "Compare the funding rates of ETH and SOL"
- "Show me the funding rate history for BTC over the last 24 hours"

The agent will:
1. ✅ Fetch real-time funding rate data from Hyperliquid
2. ✅ Calculate annualized funding rate APRs
3. ✅ Analyze trends and identify opportunities
4. ✅ Provide insights with confidence levels

## Features

- Real-time funding rate data from Hyperliquid DEX
- AI-powered analysis using OpenAI GPT models
- Structured response format with confidence levels
- Funding rate history analysis
- Multi-token comparison
- Arbitrage opportunity identification
- API endpoint for integration

## Quick Start (2 minutes)

### Step 1: Get Your API Key

You need one free API key:

**OpenAI** (for the AI brain)
- Sign up: https://platform.openai.com/
- Create an API key in your account settings

### Step 2: Install and Configure

```bash
# Navigate to the hyperliquid-agent directory
cd agents/hyperliquid-agent

# Install dependencies
yarn install

# Create your environment file
cp .env.example .env
```

Now edit the `.env` file and add your API key:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional (for API deployment)
AGENT_API_KEY=your_secure_api_key_here

# Optional: Model Configuration
MODEL_NAME=gpt-4o-mini
TEMPERATURE=0
```

### Step 3: Run the Agent

**Command Line:**
```bash
# Run the agent in your terminal
yarn start
```

You'll see the agent answer funding rate questions!

**As an API Server:**
```bash
# Start the development server
yarn dev
```

Then open your browser to:
- **LangSmith Studio**: https://smith.langchain.com/studio?baseUrl=http://localhost:2024

In the Studio, you can:
- Chat with the agent in real-time
- See how it thinks and makes decisions
- Watch it call the Hyperliquid API
- Debug any issues

## Self-Hosting with Docker

Want to deploy this agent as an API on your own server? Check out the **[Self-Hosting Guide](SELF-HOSTING.md)** for:

- 🐳 **Quick Start** - Deploy with Docker in 3 commands (no databases needed!)
- 💾 **Persistent History** - Add Redis + PostgreSQL for conversation storage
- 🔒 **Production Setup** - Security, scaling, and monitoring best practices

**Quick deploy:**
```bash
cp .env.example .env  # Add your API keys
docker compose up -d  # Start the agent
# Open Studio: https://smith.langchain.com/studio → Connect to http://localhost:8000
```

See **[SELF-HOSTING.md](SELF-HOSTING.md)** for complete documentation.

## Available Tools

The agent has access to five specialized tools:

**1. `get_current_funding_rate`**
- Gets the latest funding rate for a specific token
- Returns: funding rate, APR, timestamp

**2. `get_funding_history`**
- Retrieves historical funding rates for analysis
- Useful for trend identification

**3. `get_available_markets`**
- Lists all active perpetual markets on Hyperliquid
- Shows available tokens and max leverage

**4. `get_multiple_funding_rates`**
- Fetches funding rates for multiple tokens at once
- Perfect for comparison and screening

**5. `get_top_funding_rates`**
- Finds the highest/lowest funding rates across all markets
- Great for arbitrage opportunity discovery

## Output Structure

The agent provides structured responses with:

- **answer** - Main answer to your question
- **fundingData** - Array of funding rate data for relevant tokens
- **analysis** - Additional insights and trend analysis
- **confidence** - Confidence level (high/medium/low)

### Example Response

```json
{
  "answer": "BTC currently has a funding rate of 0.01% (2.92% APR). This is relatively neutral, indicating balanced long/short positioning.",
  "fundingData": [
    {
      "token": "BTC",
      "fundingRate": 0.0001,
      "apr": 2.92
    }
  ],
  "analysis": "The positive funding rate suggests slightly more long positions, but the low APR indicates market equilibrium. No significant arbitrage opportunities at this rate.",
  "confidence": "high"
}
```

See [EXAMPLES.md](./EXAMPLES.md) for complete examples of agent output.

## Understanding the Code

### The Main Files

**`src/graph.ts`** - LangGraph workflow (for API deployment)
- Defines the agent's decision-making flow
- Handles tool execution and response generation

**`src/agent/index.ts`** - Core agent logic (for CLI usage)
- Configures the LLM and tools
- Processes questions through the agent

**`src/agent/tools.ts`** - Hyperliquid API integrations
- Five specialized tools for funding rate analysis
- Direct integration with Hyperliquid's public API

**`src/agent/api.ts`** - API client for Hyperliquid
- Fetches data from Hyperliquid endpoints
- Processes and formats funding rate information

## Project Structure

```
hyperliquid-agent/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── graph.ts              # LangGraph workflow for API
│   ├── auth.ts               # API authentication
│   ├── agent/
│   │   ├── index.ts          # Agent logic
│   │   ├── tools.ts          # Hyperliquid tools
│   │   ├── api.ts            # API client
│   │   ├── system-prompt.ts  # Agent instructions
│   │   ├── output-structure.ts # Response schema
│   │   └── types.ts          # TypeScript types
│   └── common/               # Shared utilities
├── .env                      # Your config (you create this)
├── .env.example              # Template
├── langgraph.json            # LangGraph server config
├── Dockerfile                # Container definition
├── docker-compose.yml        # Simple deployment
├── docker-compose.full.yml   # With persistence
├── package.json              # Dependencies
└── README.md                 # This file
```

## Configuration Options

Edit your `.env` file to change settings:

```bash
# Required
OPENAI_API_KEY=your_key

# Optional: API Authentication
AGENT_API_KEY=your_secure_key

# Optional: Choose different AI models
MODEL_NAME=gpt-4o-mini     # Fast and cheap (default)
# MODEL_NAME=gpt-4o        # Smarter but costs more
# MODEL_NAME=gpt-3.5-turbo # Cheaper alternative

# Optional: Creativity level (0 = consistent, 1 = creative)
TEMPERATURE=0

# Optional: For LangSmith tracing
LANGSMITH_API_KEY=your_key
LANGSMITH_PROJECT=hyperliquid-agent
LANGSMITH_TRACING=true
```

## Development

### Available Commands

```bash
# Run CLI agent
yarn start

# Start API server (development)
yarn dev

# Build the package
yarn build

# Run tests
yarn test

# Lint code
yarn lint

# Docker commands
yarn docker:up      # Start simple deployment
yarn docker:down    # Stop deployment
yarn docker:logs    # View logs
```

## Common Questions

### What is a funding rate?

Funding rates are periodic payments between long and short positions in perpetual futures. Positive rates mean longs pay shorts, negative rates mean shorts pay longs. They help keep perpetual prices aligned with spot prices.

### How is APR calculated?

APR = Funding Rate × 3 × 365 (since funding occurs every 8 hours)

### Can I use this for trading?

This agent is for **informational purposes only** and is **not financial advice**. Always do your own research and consult with financial professionals before trading.

### How much does it cost to run?

- **Hyperliquid API**: Completely free, no API key needed!
- **OpenAI**: You pay per request (around $0.0001 per question with gpt-4o-mini)

A typical funding rate question costs less than **1 cent**!

### Can I customize the analysis?

Yes! Open [src/agent/system-prompt.ts](src/agent/system-prompt.ts) and edit the system prompt to change how the agent analyzes data.

## Troubleshooting

**"OPENAI_API_KEY is required" error**
- Make sure your `.env` file exists in the `hyperliquid-agent` directory
- Check that you copied the API key correctly (no spaces or quotes)

**Agent gives weird responses**
- Try lowering the `TEMPERATURE` in `.env` (set it to 0)
- Make sure you're using a model like `gpt-4o-mini` that is good with tool calling

**"Cannot find module" errors**
- Run `yarn install` again
- Make sure you're in the `hyperliquid-agent` directory

## Technology Stack

- **TypeScript** - Type-safe JavaScript
- **LangGraph** - AI agent orchestration
- **LangChain** - AI application framework
- **OpenAI API** - Language models
- **Hyperliquid API** - Perpetual futures data

## Important Notes

- All funding rate data comes directly from Hyperliquid's public API
- Funding rates update every hour
- Analysis is for informational purposes only - **not financial advice**
- Always verify data before making trading decisions

## Help and Support

- **Questions?** Open an issue on GitHub
- **Found a bug?** Submit a pull request
- **Want to learn more?** Check the LangGraph documentation

## Contributing

Contributions welcome! Especially:
- Better analysis algorithms
- Additional data sources
- Improved documentation
- Bug fixes

## License

See the [LICENSE](LICENSE) file for details.

---

**Happy analyzing! 📊**

Built with ❤️ using [LangGraph](https://github.com/langchain-ai/langgraph) and [Hyperliquid](https://hyperliquid.xyz/)

