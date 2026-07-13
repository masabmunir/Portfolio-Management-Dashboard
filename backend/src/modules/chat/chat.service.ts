import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { AppDataSource } from '../../config/data-source';
import { Portfolio } from '../../entities/Portfolio';
import * as portfolioService from '../portfolios/portfolio.service';

const genAI = new GoogleGenerativeAI(env.gemini.apiKey);

async function buildSystemPrompt(userId: string): Promise<string> {
  const portfolios = await AppDataSource.getRepository(Portfolio).find({
    where: { userId },
    order: { createdAt: 'ASC' },
  });

  let portfolioContext = '';

  if (portfolios.length > 0) {
    const summaries = await Promise.all(
      portfolios.map((p) =>
        portfolioService.getSummary(p.id, userId).catch(() => null),
      ),
    );

    portfolioContext = summaries
      .filter(Boolean)
      .map((s) => {
        if (!s) return '';
        return `
Portfolio: "${s.portfolio.name}"
  Total Market Value: $${s.totals.marketValue}
  Cost Basis: $${s.totals.costBasis}
  Unrealized Gain: $${s.totals.unrealizedGain} (${s.totals.unrealizedGainPct}%)
  Holdings Count: ${s.totals.holdingsCount}
  Holdings:
  ${s.holdings
    .map(
      (h) =>
        `  - ${h.symbol} (${h.assetType}): qty=${h.quantity}, ` +
        `avg cost=$${h.avgCost}, current=$${h.currentPrice}, ` +
        `value=$${h.marketValue}, gain=$${h.unrealizedGain}`,
    )
    .join('\n')}
        `.trim();
      })
      .join('\n\n');
  }

  return `You are a helpful portfolio management assistant for a financial dashboard app.

${
  portfolioContext
    ? `Here is the user's current portfolio data:\n\n${portfolioContext}`
    : 'The user has no portfolios yet.'
}

Your role:
- Answer questions about their portfolio performance
- Explain financial concepts clearly
- Give general investment education (NOT personalized advice)
- Help them understand their gains, losses, and holdings
- Be concise and friendly — 2-4 sentences max unless detail needed

Important:
- NEVER give specific investment advice
- Always clarify you provide education, not financial advice
- Keep responses short and clear`;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chat(
  userId: string,
  messages: ChatMessage[],
): Promise<string> {
  const systemPrompt = await buildSystemPrompt(userId);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  });

  // Filter out assistant messages from the START of history
  // Gemini requires history to start with 'user' role
  const allMessages = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Last message is current user input
  const lastMessage = allMessages[allMessages.length - 1];

  // History = all messages EXCEPT the last one
  // Also filter leading 'model' messages (initial greeting)
  let history = allMessages.slice(0, -1);

  // Remove leading assistant/model messages
  // (Gemini history must start with 'user')
  while (history.length > 0 && history[0].role === 'model') {
    history = history.slice(1);
  }

  const chatSession = model.startChat({ history });
  const result = await chatSession.sendMessage(lastMessage.parts[0].text);

  return result.response.text();
}