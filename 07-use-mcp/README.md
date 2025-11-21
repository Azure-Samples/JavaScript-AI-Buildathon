# 🔗 Quest: Create an AI Agent with Tools from an MCP Server

## 📋 Pre-requisites

1. A GitHub account
2. [Visual Studio Code](https://code.visualstudio.com/) installed
3. [Node.js](https://nodejs.org/en) installed
4. An Azure subscription. Use the [free trial](https://azure.microsoft.com/free/) if you don't have one, or [Azure for Students](https://azure.microsoft.com/free/students/) if you are a student.
5. [Azure Developer CLI](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd?tabs=winget-windows%2Cbrew-mac%2Cscript-linux&pivots=os-windows) installed


## 📝 Overview

This quest will guide you through the process of creating an AI Agent with tools from an MCP (Model Context Protocol) server using the AI Toolkit extension for Visual Studio Code.

## Step 1️⃣: Add a tool-compatible model

You must first select a model from the model catalog that will power your agent. Note, that **not all models providers support tools**, so you need to ensure that the model you select is compatible with the tools you will use.

1. Click on the **AI Toolkit** icon in the left sidebar to open the AI Toolkit view.

2. Under the **Catalog** tab, click on **Models** to discover the available models.

    Note, that **not all models providers support tools**, so you need to ensure that the model you select is compatible with the tools you will use. _Recommended providers include OpenAI and GitHub._

3. Click on the **Add** button next to the model you want to use. This will add the model to your workspace (My models).

    ![Add model to workspace](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/add-to-my-models.png?raw=true)

## Step 2️⃣: Create an agent

The AI Tooklit extension provides a space where you can create and customize your own AI Agent, the **Agent (Prompt) Builder**. This is where you can define the behavior and personality of your agent, as well as the tools it can use.

1. Under the **Tools** tab, click on **Agent (Prompt) Builder** to open the agent builder view.

    ![Agent builder](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/agent-builder.png?raw=true)

    - a. **Model** - You can select a model to power your agent from the **My models** tab. The **Settings** button next to it allows you to configure the model settings, such as temperature and max tokens.
    - b. **Prompts** - Define the behavior and personality of your agent (System prompt) and where you pass the user input (User prompt). 
    - c. **Variables** - Enter prompt that can include dynamic variables using the double brace syntax: {{variable}}.
    - d. **Tools** - Select the tools you want your agent to use.
    - e. **Structure output** - Define the output format of your agent's response. 

2. Click the **+ New Builder** button. The extension will launch a setup wizard via the Command Palette. Enter the name **OS Patrol**

3. Select the **Model** you added in Step 1 (or any other compatible model) from the dropdown list.

4. For the **Prompts** section, enter the following `System prompt`

    > You are a helpful agent that provides real-time updates and insights about the user's operating system.

    _Note: The Agent Builder provides a **Generate system prompt** feature that you can use to describe the agent's intended behavior and personality, then have the model generate a system prompt for you._

5. For the **User prompt**, enter the following:

    > What is my machine type?

    ![OS Patrol prompts](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/os-patrol-prompts.png?raw=true)

6. Scroll down and leave the **Structure output** format as **text**, then click **Run** to test the agent. 

    The agent will respond saying it doesn't have access to your system but will give you instructions on how to check your machine type.

    ![OS Patrol response no tools](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/os-patrol-no-tools.png?raw=true)

## Step 3️⃣: Add tools to your agent

This next step is where you will add tools to your agent, allowing it to perform actions and access external data. You will build an MCP server that will expose the tools you want to use. 

1. On the **Tools** tab, click on **+ MCP Server**, then select the following
    -  Add tools from MCP server: **+ Add Server**

        ![OS Patrol add server](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/add-server.png?raw=true)

    -  Select how you want to use MCP server: **Create a New MCP Server**

        ![OS Patrol create new server](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/create-new-server.png?raw=true)

    -  Select an MCP Server template: **typescript-weather**

        ![OS Patrol server template](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/server-template.png?raw=true)

    -  Select a folder to save the MCP server template: **Browse** 
        
        Select the `packages` folder in your workspace.

    -  Input an MCP server name: **node-os-mcp**

       A new window will open with mcp-server template code.

        ![MCP server template](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/node-os-mcp-aitk.png?raw=true)

### Build the MCP server

At the root of the `node-os-mcp` folder, you will find a `package.json` file which contains the dependencies and scripts needed to run the MCP server.

Run `npm install` to install the dependencies for the MCP server.

1. Open the `src/server.ts`. This is where you will define the tools that your agent will use. Replace the template code with the following:

    You will use the MCP Typescript SDK to create a server that exposes the tools you want to use. The SDK provides a set of APIs that allow you to define the tools, their inputs and outputs, and how they interact with the agent.

    ```typescript
    import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
    import * as os from "os";
    ```
    Create a new instance of the MCP server

    ```typescript
    const server = new McpServer({
        name: "node-os-mcp",
        description: "A server that provides tools to get information about the operating system.",
        version: "0.0.1",
    });
    ```

    Define a `cpu_average_usage` tool that returns the average CPU usage of the system.

    ```typescript
    server.tool(
    "cpu_average_usage",
    "Get the average CPU usage percentage on the local machine",
    {},
    async () => {
        // Calculate average CPU usage over 100ms
        function cpuAverage() {
        const cpus = os.cpus();
        let totalIdle = 0, totalTick = 0;

        for (const cpu of cpus) {
            for (const type in cpu.times) {
            totalTick += cpu.times[type as keyof typeof cpu.times];
            }
            totalIdle += cpu.times.idle;
        }
        return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
        }

        const start = cpuAverage();
        await new Promise(res => setTimeout(res, 100));
        const end = cpuAverage();

        const idleDiff = end.idle - start.idle;
        const totalDiff = end.total - start.total;
        const usage = totalDiff > 0 ? (1 - idleDiff / totalDiff) * 100 : 0;

        return {
        content: [{
            type: "text",
            text: `Average CPU usage: ${usage.toFixed(2)}%`
        }],
        isError: false
        };
    }
    );
    ```

    Define a `get_hostname` tool that returns the hostname of the system.

    ```typescript
    server.tool(
    "get_hostname",
    "Get the hostname of the local machine",
    {},
    async () => ({
        content: [{
        type: "text",
        text: `Hostname: ${os.hostname()}`
        }],
        isError: false
        })
    );
    ```

    Define a `get_architecture` tool that returns the architecture of the system.

    ```typescript
    server.tool(
    "get_architecture",
    "Get the architecture of the local machine",
    {},
    async () => ({
        content: [{
        type: "text",
        text: `Architecture: ${os.arch()}`
        }],
        isError: false
        })
    );
    ```

    Define a `get_uptime` tool that returns the uptime of the system.

    ```typescript
    server.tool(
    "get_uptime",
    "Get the uptime of the local machine in seconds",
    {},
    async () => ({
        content: [{
        type: "text",
        text: `Uptime: ${os.uptime()} seconds`
        }],
        isError: false
        })
    );
    ``` 

    Export the server instance to use it in the `index.ts` file.

    ```typescript
    export { server };
    ```
2. The code in `src/index.ts` is all set up to run the MCP server. 

### Debug in the Agent Builder

1. Open VS Code Debug panel. Select **Debug in Agent Builder** and press F5 to start debugging the MCP server.

    ![Debug in Agent Builder](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/debug-in-agent-builder.png?raw=true)

    The MCP Server will be auto-connected to the Agent Builder. If you scroll down, to the **Tools** section, you will see the tools you defined in the MCP server.

    ![OS Patrol tools](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/local-mcp-server.png?raw=true)

2. Re-use the previous user prompt `What is my machine type` and click **Run** to test the AI Agent with the tools.

    The Agent will determine which tool to use based on your prompt. In this case, it will use the `get_architecture` tool to get the machine type.

    ![OS Patrol response with tools](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/os-patrol-with-tools.png?raw=true)

3. To simulate a natural conversation maintaining the context, click on the **Add to Prompts** button under the Model Response to add the response from the agent as an **Assistant prompt**. Now, when you run the agent again, or with a new user prompt, the previous response will be included in the prompt and the model will reference it as conversation history.

    ![Add to prompts](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/os-summary-response.png?raw=true)

## 📚 Further Reading

Here are some additional resources to help you learn more about the Model Context Protocol (MCP) and how to use it with the AI Toolkit extension for Visual Studio Code:

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Build agents and prompts in AI Toolkit](https://code.visualstudio.com/docs/intelligentapps/agentbuilder)