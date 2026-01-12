import { StateGraph, Annotation, messagesStateReducer, MemorySaver } from '@langchain/langgraph';
import { BaseMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { getHyperliquidTools } from './agent/tools';
import { SystemPrompt } from './agent/system-prompt';

/**
 * Step 1: Define the state
 * The state keeps track of all messages in the conversation
 */
export const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => [],
    }),
});

/**
 * Step 2: Create the agent node
 * This node calls the AI model with access to Hyperliquid tools
 */
async function callAgent(state: typeof StateAnnotation.State) {
    // Get the tools
    const tools = getHyperliquidTools();

    // Create the AI model
    const model = new ChatOpenAI({
        modelName: process.env.MODEL_NAME || 'gpt-4o-mini',
        temperature: 0,
    });

    // Bind the tools to the model
    const modelWithTools = model.bindTools(tools);

    // Build the messages array with a system message
    const messages = [
        {
            role: 'system',
            content: SystemPrompt,
        } as any,
        ...state.messages,
    ];

    // Call the model with the conversation history
    const response = await modelWithTools.invoke(messages);

    // Return the response to add it to the state
    return { messages: [response] };
}

/**
 * Step 3: Create the tools node
 * This node executes the tools that the AI requested
 */
async function callTools(state: typeof StateAnnotation.State) {
    const tools = getHyperliquidTools();

    // Get the last message (which should be from the AI)
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

    // Get the tool calls from the AI's message
    const toolCalls = lastMessage.tool_calls || [];

    // Execute each tool call
    const toolMessages: ToolMessage[] = [];
    for (const toolCall of toolCalls) {
        // Find the tool
        const tool = tools.find((t) => t.name === toolCall.name);

        if (tool) {
            // Execute the tool
            const result = await tool.invoke(toolCall.args);

            // Create a tool message with the result
            toolMessages.push(
                new ToolMessage({
                    content: result,
                    tool_call_id: toolCall.id,
                }),
            );
        }
    }

    return { messages: toolMessages };
}

/**
 * Step 4: Create the routing function
 * This decides whether to call tools or end the conversation
 */
function shouldContinue(state: typeof StateAnnotation.State) {
    const lastMessage = state.messages[state.messages.length - 1];

    // If the AI wants to use tools, route to the tools node
    if (lastMessage._getType() === 'ai') {
        const aiMessage = lastMessage as AIMessage;
        if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
            return 'tools';
        }
    }

    // Otherwise, end the conversation
    return '__end__';
}

/**
 * Step 5: Build the graph
 * This connects all the pieces together
 */
const workflow = new StateGraph(StateAnnotation)
    // Add the nodes
    .addNode('agent', callAgent)
    .addNode('tools', callTools)

    // Define the flow
    .addEdge('__start__', 'agent')  // Start with the agent
    .addConditionalEdges('agent', shouldContinue)  // Agent decides what's next
    .addEdge('tools', 'agent');  // After tools, go back to agent

/**
 * Step 6: Compile the graph
 * This creates the final runnable agent
 */
export const graph = workflow.compile({
    checkpointer: new MemorySaver(),  // Saves conversation history
});

graph.name = 'Hyperliquid Agent';
