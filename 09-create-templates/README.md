# ⚡️ Quest: I want a Production-Ready Template to customize

## 📋 Pre-requisites

1. A GitHub account
2. [Visual Studio Code](https://code.visualstudio.com/) installed
3. [Node.js](https://nodejs.org/en) installed
4. An Azure subscription. Use the [free trial](https://azure.microsoft.com/free/) if you don't have one, or [Azure for Students](https://azure.microsoft.com/free/students/) if you are a student.
5. [Azure Developer CLI](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd?tabs=winget-windows%2Cbrew-mac%2Cscript-linux&pivots=os-windows) installed

## 📝 Overview


Throughout all quests in this project, you have been following a minimalistic approach to building functional AI applications. However, in today's fast-paced world of technology, building robust production-ready AI solutions demands the use of the right tools and frameworks, and adoption of industry best practices.

This can be a daunting task, often requiring:-
- Too many decisions to make
- Difficulty in identifying and implementing shifting industry best practices
- Need for repeatable and scalable solutions
- Familiarity with the latest tools, services, and frameworks

To address these challenges, this quest introduces you azd-templates, a collection of production-ready templates that can be used to quickly build and deploy AI applications. These templates are designed to be easy to use and customizable, allowing you to focus on building your application rather than worrying about the underlying infrastructure.

## 🧰 Azure Developer CLI (azd)

The Azure Developer CLI (azd) is an open-source, developer-centric command-line (CLI) tool, part of a wider ecosystem to help you accelerate the provisioning and deployment of applications to Azure. Long gone are the many arguments and flags typically used, azd uses intuitive, developer-friendly commands that represent key development stages, boosting your overall productivity.

| azd command | Objective |
|-------------|-------------|
| `azd auth`  | Authenticate with Azure |
| `azd init`  | Initializes a new project |
| `azd package`  | Packages the application's code to be deployed to Azure. |
| `azd provision`  | Provision the Azure resources for an application. |
| `azd deploy`  | Deploy the application's code to Azure. |
| `azd up`    | Provisions and deploys the application |
| `azd down`  | Deletes the Azure resources for an application.

## 📚 azd Templates

azd templates are a collection of application code (samples) and azd configuration files that can be used to quickly customize and deploy production-ready applications to Azure. 

Each template includes:-
- **Proof-of-concept (PoC) starter code** to help you kickstart your project without starting from scratch. These templates go beyond ‘hello-world’ examples, demonstrating how to build complex systems, allowing you to customize the code, or completely replace with your own,
- Everything you need to get a **Fully managed end-to-end system/ application** running on Azure, with configuration files to handle one-click deployments,
- **Reusable Infrastructure as Code (IaC) assets** to provision and maintain cloud services

With azd templates, you can: -
- Focus on writing the best code and deployment infrastructure for your application all in one context
- Quickly create prototypes and proof-of-concept applications, accelerating innovation
- Learn industry best practices and patterns for building production-ready AI applications

## ✅ Activity: Browse through JS/TS AI Templates

The key to identifying the right template for your project is to understand the requirements of your application. The templates are designed to be flexible and customizable, allowing you to choose the one that best fits your needs.

Then:-
1. Visit the [AI app template](https://azure.github.io/ai-app-templates/?tags=javascript&tags=typescript) gallery to browse through the available templates.

    ![AI App templates](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/ai-templates.png?raw=true)

2. Once you have identified a template that meets your needs, click on it to view the details and find instructions on how to use it.

    ![Gen AI chat frontend templates](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/genai-chat-frontend-template.png?raw=true)

Some of the popular templates for JavaScript developers are:-
- [Serverless GenAI assistant with LangChain](https://azure.github.io/ai-app-templates/repo/azure-samples/serverless-chat-langchainjs/)
- [GenAI chat frontend including debug, restyle, and revisit](https://azure.github.io/ai-app-templates/repo/azure-samples/azure-openai-chat-frontend/)
- [Build RAG apps with LlamaIndex](https://azure.github.io/ai-app-templates/repo/azure-samples/llama-index-javascript/)
- [RAG chat with Azure AI Search + JavaScript](https://azure.github.io/ai-app-templates/repo/azure-samples/azure-search-openai-javascript/)
- [Serverless GenAI assistant using function calling](https://azure.github.io/ai-app-templates/repo/azure-samples/azure-openai-assistant-javascript/)

## ✅ Activity: Submit your customized project idea for community voting
### Quest Checklist

To complete this final challenge and unlock the true power of **AI + Cloud**, you'll pick a ready-made Azure Developer CLI (azd)/ AI template and customize it to solve a problem you care about.

**Checklist**

- [ ] Think of a problem that matters to you

    This can be personal, societal, climate-related, educational — anything that gets you thinking creatively and purposefully.

- [ ] Browse the azd/ AI template gallery

    Find a template that provides a strong starting point for solving your chosen problem. You can explore app types like:

    - Gen AI copilots
    - Chat-enabled apps
    - Data summarizers
    - RAG implementations
    - Serverless APIs
    - Full-stack web apps

- [ ] Follow the setup instructions provided in your chosen template
- [ ] Customize it to fit your vision
    
    Tweak the front end, update the backend, change the model, connect external data — anything goes. This is where your creativity and dev skills shine.

- [ ] Push your code

    Make sure your new project has a README.md explaining:

    - The problem you’re solving
    - Why you picked the template
    - What customizations you made

- [ ] Open a New Issue using the **🛠️ Project Submission - Build-a-thon** issue template
- [ ] Encourage your peers to upvote your issue for the **People’s Choice spotlight**!

    ⏳ After submission: Keep updating your project as you build. You can edit your issue to reflect new progress and keep your voters informed.

## 📚 Further Reading

Here are some additional resources to help you learn more about the Azure Developer CLI (azd) and the templates available:

- [Kickstart JS/TS projects with azd Templates](https://techcommunity.microsoft.com/blog/azuredevcommunityblog/kickstart-projects-with-azd-templates/4295235)
- [Kickstart your JavaScript projects with azd on YouTube](https://www.youtube.com/playlist?list=PLmsFUfdnGr3zzLIPdJsfdSwymIwOsyQ9Z)
