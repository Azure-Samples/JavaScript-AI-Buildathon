# 🤖 Quest: I want to build an AI Agent

## 📋 Pre-requisites

1. A GitHub account
2. [Visual Studio Code](https://code.visualstudio.com/) installed
3. [Node.js](https://nodejs.org/en) installed
4. An Azure subscription. Use the [free trial](https://azure.microsoft.com/free/) if you don't have one, or [Azure for Students](https://azure.microsoft.com/free/students/) if you are a student.
5. [Azure Developer CLI](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd?tabs=winget-windows%2Cbrew-mac%2Cscript-linux&pivots=os-windows) installed


## 📝 Overview

In this step, you will learn how to build a basic AI agent using the AI Foundry VS Code extension. An AI agent is a program powered by AI models that can understand instructions, make decisions, and perform tasks autonomously.

### Assumption ⚠️

This step assumes you have already completed previous steps and that you have the Microsoft Foundry VS Code extension installed with a default project set up. 

## Step 1️⃣: Create an Agent

**‼️IMPORTANT NOTE**

Currently, agents are only supported in the following regions: **australiaeast, centraluseuap, eastus, eastus2, francecentral, japaneast, norwayeast, southindia, swedencentral, uksouth, westus, westus3**

At a later stage, you will add **bing grounding** to your agent, a service that works with **all Azure OpenAI models except _gpt-4o-mini, 2024-07-18_**. We therefore recommend using the _gpt-4o_ model for this quest.

If you used a different region, please [create a new Microsoft Foundry project](https://ai.azure.com/build), _(On the Microsoft Foundry portal)_, in one of the supported regions and deploy a model, (gpt-4o), there.

**‼️END OF NOTE**

1.  **Update your working directory** 

    Create a new folder called `agent` in the `packages` directory of your project. This folder will contain the configuration files for your agent.

2.  **Create & configure an Agent** 

    Click on the AI Foundry icon in the Activity Bar. Under resources, ensure your default AI Foundry project is selected. Hover over the "Agents" section title and click the "+" (Create Agent) icon that appears.

    ![Create Agent Button](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/create-agent.png?raw=true)

    You'll be prompted to save the agent's configuration file. Assign the name `my-agent.agent.yaml` and save the file in the agents folder you created earlier. Once saved, the yaml file and the Agent Designer will open for you to configure your agent.
    
    **Security Note 🔐**

    Add the `my-agent.agent.yaml` file to your `.gitignore` file to prevent it from being committed to your repository. This file will contain sensitive information such as your subscription ID and agent ID, which should not be shared publicly.

    On the Agent Designer, 
    - Give your agent a name. i.e `my-agent` _that will have been auto-populated for you._
    - Enter a foundation model for your agent from your model list. This model will power the agent's core reasoning and language capabilities. _Example. gpt-4o_
    - System instructions for your agent. This tells the agent how it should behave. Enter the following:

      ```
      You are a helpful agent who loves emojis 😊. Be friendly and concise in your responses.
      ```
    - Parameters, i.e _temparature: 0.7_ 

    The yaml configuration file should look like this:
    
      ````yaml
      version: 1.0.0
      name: my-agent
      description: Description of the agent
      id: ''
      model:
        id: gpt-4o
        options:
          temperature: 0.7
          top_p: 1
      instructions: >-
        You are a helpful agent who loves emojis 😊. Be friendly and concise in your
        responses.
      tools: [] # We'll add tools later
      ````
3.  **Create Agent** 

    Click on the **Create Agent on Microsoft Foundry** button in the Agent Designer to create and deploy your agent to Microsoft Foundry. Once created, the agent will pop up in the AI Foundry extension under the "Agents" section.

    ![Deploy to Microsoft Foundry Button](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/deploy-to-ai-foundry.png?raw=true)

## Step 2️⃣: Test the Agent in the Playground

Now that you've created and deployed your agent, you can test it in the Playground - an interface that allows you to interact with your agent and see how it responds to different inputs.

1.  **Open the Playground** 

    Right-click on the agent you just created in the "Agents" section and select **Open Playground**. Alternatively, you can expand the "Tools" section and click on "Agent Playground", then select your agent from the list.

    ![Agent Playground in tools](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/agent-playground-in-tools.png?raw=true)

2.  **Test the Agent** 

    In the Playground, you can start chatting with your agent. Try sending it a few messages to see how it responds. For example:
    - "Hi there!" 
    - Expect a friendly response with emojis 😎.

      ![Agent Playground](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/agent-playground.png?raw=true)

    - Then, try a prompt like _"What's the weather in Nairobi right now?"_
    - Expect a response like "I can't check live weather, but you can check a weather website for the latest updates! 🌤️"

      ![Agent Playground - weather response](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/agent-weather-response.png?raw=true)

The agent currently has limitations including not being able to access real-time information or perform specific tasks. It can only respond based on the instructions and the model's knowledge.

So in the next step, we will add a tool to the agent to make it more useful.

## Step 3️⃣: Add a Tool to the Agent

Tools calling is a powerful feature that allows your agent to perform specific tasks or access external data. In this step, we will add a tool to our agent that can use Bing Search to fetch real-time information. This will enable the agent to provide more accurate and up-to-date responses.

### Create a Bing Search resource

1. On the Azure portal, [create a bing resource](https://portal.azure.com/#create/Microsoft.BingGroundingSearch) (Grounding with Bing Search). Follow the prompts to create the resource. 

2. Open the [AI Foundry portal](https://ai.azure.com/), navigate to the left navigation menu towards the bottom, select Management center.

    ![Management Center](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/management-center.png?raw=true)

3. In the **Connected resources** section, select **+ New connection**.

4. In the Add a connection to external assets window, scroll to the **Knowledge section** and select **Grounding with Bing Search**.

5. In the Connect a Grounding with Bing Search Account window, select **Add connection** next to your Grounding with Bing resource.

    ![Add connection](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/add-connection.png?raw=true)

6. Once connected, click **close**

### Add bing tool to your Agent
With your `my-agent.agent.yaml` file open, click on the Foundry icon at the top right corner to open the Agent Designer.

![Open Agent Designer](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/open-agent-designer.png?raw=true)

On the `yaml` file, scroll down to the `tools` section and delete the empty array `[]`, then: -

- Click **Enter** followed by **-** to invoke the YAML IntelliSense that will help you add a new tool configuration easily.

  ![Open Agent Designer](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/new-tool-intellisense.png?raw=true)

- Select the `Agent Tool - Bing Grounding` tool from the list of available built-in tools, and this will add the configuration for the Bing Search API tool to your agent configuration file.

- To add the connection to the Bing resource you created earlier, type the **/** character after the **-** under **tool_connections**, and start typing `subscriptions`, and you'll see the IntelliSense kick in with your own subscription details. Select to complete the connection selection.

  ![Subscription aware intelliSense](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/sub-intellisense.png?raw=true)

  If the intelliSense fails, paste in the following
  
  `/subscriptions/<subscription_ID>/resourceGroups/<resource_group_name>/providers/Microsoft.MachineLearningServices/workspaces/<project_name>/connections/<bing_grounding_connection_name>`
  
  and replace the placeholders with your information:
   - `subscription_ID` = Your Azure Subscription ID
   - `resource_group_name` = Your Resource Group name
   - `project_name` = Your Project name on AI Foundry
   - `bing_grounding_connection_name` = The connection name **NOT** the bing resource name

- A Bing Grounding connection should appear under the **Tool** section on the Agent Designer. Click on **Update Agent on Microsoft Foundry** to update your agent with the new tool configuration.

Now that you've added the Bing Grounding to your agent, you can test it in the Playground. Open the "Agent Playground" and send the agent a message like _"What's the weather in Nairobi right now?"_ The agent should use the Bing Search API tool to fetch the current weather information and respond with a friendly message.

![Weather with Bing](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/weather-with-bing.png?raw=true)


## Step 4️⃣: Agent playground to Code

The Agent Playground is a great way to test your agent's capabilities, but it's not the only way to interact with it. In this step, you will update our application to use the agent you just created.

### Get Agent code
Open the **Agent Playground** on the [AI Foundry portal](https://ai.azure.com/) and click on **View Code**. This will show you the code that is used to interact with the agent. 

![View code](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/view-code.png?raw=true)

Switch to the **JavaScript** tab, copy and paste the code into a new file called `agent.js` in the `packages/webapi` directory of your project. The code will already have the necessary setup for the agent, including your hard-coded connection string and agent ID.

Run the code using `node agent.js` and you should see the output in the terminal.

To send a message to the agent, you can update the `client.agents.createMessage` method to include the message you want to send. For example, you can replace the content with "Give me a summary of this year's Keynote at Microsoft Build" and run the code again. You should see the agent's response in the terminal.

````javascript
const message = await client.agents.createMessage(thread.id, {
  role: "user",
  content: "Give me a summary of this year's Keynote at Microsoft Build",
});
console.log(`Created message, message ID: ${message.id}`);
````

**Security Note 🔐**
 
The code you copied from the Playground contains your Azure credentials (connection string). Make sure to keep this information secure and do not share it with anyone. You can use environment variables or a secrets manager to store sensitive information securely.

### Create an AgentService Module

To implement Agent mode in your current application, you will create a new module called `agentService.js` in the `packages/webapi` directory that will encapsulate the agent functionality. This module will handle the interaction with the agent and provide methods to send messages and receive responses.


<details> <summary>Click to expand the `agentService.js` code</summary>

```javascript
import { AIProjectsClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import dotenv from "dotenv";

dotenv.config();

const agentThreads = {};

export class AgentService {
  constructor() {
    this.client = AIProjectsClient.fromConnectionString(
      "<YOUR_CONNECTION_STRING>",
      new DefaultAzureCredential()
    );
    
    // You can get the agent ID from your my-agent.agent.yaml file or the sample code
    this.agentId = "<YOUR_AGENT_ID>";
  }

  async getOrCreateThread(sessionId) {
    if (!agentThreads[sessionId]) {
      const thread = await this.client.agents.createThread();
      agentThreads[sessionId] = thread.id;
      return thread.id;
    }
    return agentThreads[sessionId];
  }

  async processMessage(sessionId, message) {
    try {
      const threadId = await this.getOrCreateThread(sessionId);

      const createdMessage = await this.client.agents.createMessage(threadId, {
        role: "user",
        content: message,
      });

      let run = await this.client.agents.createRun(threadId, this.agentId);
      
      while (run.status === "queued" || run.status === "in_progress") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        run = await this.client.agents.getRun(threadId, run.id);
      }
      
      if (run.status !== "completed") {
        console.error(`Run failed with status: ${run.status}`);
        return {
          reply: `Sorry, I encountered an error (${run.status}). Please try again.`,
        };
      }
      
      const messages = await this.client.agents.listMessages(threadId);
      
      const assistantMessages = messages.data
        .filter(msg => msg.role === "assistant")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      if (assistantMessages.length === 0) {
        return { 
          reply: "I don't have a response at this time. Please try again.",
        };
      }

      let responseText = "";
      for (const contentItem of assistantMessages[0].content) {
        if (contentItem.type === "text") {
          responseText += contentItem.text.value;
        }
      }
      
      return {
        reply: responseText,
      };
    } catch (error) {
      console.error("Agent error:", error);
      return {
        reply: "Sorry, I encountered an error processing your request. Please try again.",
      };
    }
  }
}
```
</details>

### Update the server.js file

Let's update the `server.js` file to use the new `AgentService` module. First, import the `AgentService` module at the top of the file

```javascript
import { AgentService } from "./agentService.js";
```
Right before the `app.post("/chat", ...)` route, create an instance of the `AgentService` class:

```javascript
const agentService = new AgentService();
```

Inside the `try` block of the `/chat` route before `let sources = []`, add the following code to extract the mode from the request body and route to the agent service if the mode is set to "agent":

```javascript
const mode = req.body.mode || "basic";

// If agent mode is selected, route to agent service
if (mode === "agent") {
  const agentResponse = await agentService.processMessage(sessionId, userMessage);
  return res.json({
    reply: agentResponse.reply,
    sources: []
  });
}
```

Restart your server.

### Update Chat UI

_You'll first update the UI, then implement the logic later. So don't worry if the changes don't work immediately._

First, modify the ChatInterface class in `webapp/src/components/chat.js` Add a new property for mode (basic vs agent) 

```javascript
chatMode: { type: String } // Add new property for mode
```

In the constructor, set the default mode to "basic":

```javascript
this.chatMode = "basic"; // Set default mode to basic
```

In the render method, between the `Clear Chat button` and the `RAG-toggle component`, add a model-selector component. 

```javascript
<div class="mode-selector">
  <label>Mode:</label>
    <select @change=${this._handleModeChange}>
      <option value="basic" ?selected=${this.chatMode === 'basic'}>Basic AI</option>
      <option value="agent" ?selected=${this.chatMode === 'agent'}>Agent</option>
    </select>
</div>
```

![Switch modes](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/switch-modes.png?raw=true)

Update the `RAG toggle` to be disabled when the mode is set to "agent". 


```javascript
<label class="rag-toggle ${this.chatMode === 'agent' ? 'disabled' : ''}">
  <input type="checkbox" 
    ?checked=${this.ragEnabled} 
    @change=${this._toggleRag}
    ?disabled=${this.chatMode === 'agent'}>
Use Employee Handbook
</label>
```

![Disable RAG toggle in Agent mode](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/disable-rag-toggle.png?raw=true)

Let's make the placeholder text conditional based on the selected mode, by updating the _chat-input_ component in the render method:

```javascript
<input 
  type="text" 
  placeholder=${this.chatMode === 'basic' ? 
    "Ask about company policies, benefits, etc..." : 
    "Ask Agent"}
  .value=${this.inputMessage}
  @input=${this._handleInput}
  @keyup=${this._handleKeyUp}
/>
```

![Agent mode placeholder text](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/ask-agent.png?raw=true)

and the message sender display to show **Agent** instead of **AI** when the mode is set to 'agent'. Update the _chat-message_ component 

```javascript
<span class="message-sender">${message.role === 'user' ? 'You' : (this.chatMode === 'agent' ? 'Agent' : 'AI')}</span>
```

![Agent mode placeholder](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/agent.png?raw=true)

Add a new method `_handleModeChange` to handle the mode change event after the render method:

```javascript
_handleModeChange(e) {
  const newMode = e.target.value;
  if (newMode !== this.chatMode) {
    this.chatMode = newMode;
    
    // Disable RAG when switching to agent mode
    if (newMode === 'agent') {
      this.ragEnabled = false;
    }
    
    clearMessages();
    this.messages = [];
  }
}
```

Update the `_apiCall` method to send the selected mode to the server:

```javascript
async _apiCall(message) {
  const res = await fetch("http://localhost:3001/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      message,
      useRAG: this.ragEnabled,
      mode: this.chatMode // Send the selected mode to the server
    }),
  });
  const data = await res.json();
  return data;
}
```

Let's improve the styling of the mode selector. Add the following CSS to `webapp/src/components/chat.css` after `.rag-toggle` styles:

```css
.mode-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  background: rgba(50,50,50,0.5);
  padding: 6px 12px;
  border-radius: 18px;
  margin-right: auto;
}

.mode-selector label {
  color: #e0e0e0;
  white-space: nowrap;
}

.mode-selector select {
  background: #18191a;
  color: #fff;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 0.9rem;
  outline: none;
}

.mode-selector select:focus {
  border-color: #1e90ff;
}

.rag-toggle.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rag-toggle.disabled input[type="checkbox"] {
  cursor: not-allowed;
}
```

### Test Agent Mode in the app

In the terminal, navigate to the `packages/webapi` directory and run `npm start` to start the server. In another terminal, navigate to the `packages/webapp` directory and run `npm run dev` to start the web application. 

On the app, select the **Agent** mode from the dropdown. Type a message in the input box and hit enter. The agent should respond with a friendly message.

If you ask the agent a question that requires real-time information, such as _"What's the current weather in Spain?"_, the agent should ground its response using the Bing Search API and provide you with the latest information.

![Weather in Spain in Agent mode](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/weather-in-spain.png?raw=true)

## 📚 Further Reading

Here are some additional resources to help you learn more about building AI agents and extending their capabilities with tools:
- [Azure AI Agents JavaScript examples](https://github.com/Azure-Samples/azure-ai-agents-javascript)
- [Your First AI Agent in JS with Azure AI Agent Service](https://www.youtube.com/live/RNphlRKvmJQ?si=I3rUp-LmnvS008ym)
- [Create a new Agent - JS/TS](https://learn.microsoft.com/en-us/azure/ai-services/agents/quickstart?pivots=programming-language-javascript)
- [📹 DEMFP781: From Prompt to Product: Build an AI Agent That Generates UI](https://build.microsoft.com/en-US/sessions/DEMFP781?source=sessions)