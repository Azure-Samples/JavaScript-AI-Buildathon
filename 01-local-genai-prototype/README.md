
# 🤖 Quest: I want to build a local Gen AI prototype

## 📋 Pre-requisites

1. A GitHub account
2. [Visual Studio Code](https://code.visualstudio.com/) installed
3. [Node.js](https://nodejs.org/en) installed

## 📝 Overview
You will build a **local Gen AI prototype** using JavaScript and TypeScript. This prototype will allow you to experiment with different AI models, parameters, and prompts.

## 🧠 GitHub Models

GitHub Models is a FREE service that provides access to a variety of AI models from different providers and a playground to experiment with them. You can use these models to build your own AI applications (prototypes), or just to learn more about how AI works.

With GitHub Models, you can use GitHub Personal Access Tokens (PAT) to authenticate and access the models locally, or use a single API key to access all the models.

1. Right click [GitHub Models](https://github.com/marketplace/models) and open in a new tab

> [!NOTE]  
> Open the link IN A NEW TAB so you can keep this page open for reference. You can use the _Split Screen_ feature on Edge to have this instructions and GitHub Models/ VS Code open side-by-side

2. Click on **explore the full model catalog** to see the available models.

    ![GH Models full catalog](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/ghm-full-catalog.png?raw=true)

    You will see a broad range of models listed in the catalog.

    🤔 _But which model should you use for what?_

3. Scroll down to the **Filter section** to see the available filters. You can filter the models by:
    - **Publisher:** Cohere, DeepSeek, Meta, Mistral AI, Microsoft _(research)_, Azure OpenAI Service, and more.
    - **Category:** Conversation _(models optimized for dialogue use cases)_, Agents, Multimodal _(models capable of processing input in multiple formats - audio, visual etc.)_, Reasoning, and more.

4. Select a model from the list to open the model card. The model card provides detailed information about the model, and may include:
    
    ### A. README
    - **Model Abstract:** A brief description of the model and its capabilities.
    - **Model Architecture:** The data used to train the model and their modalities for input and output _(text-image pairs)_, the model size _(parameters)_, model context length _(how much text the model can process at once)_, training date _(knowledge cut-off date/data freshness for the model)_, supported languages,  and more.
  
      ![Model Architecture](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/model-readme.png?raw=true)

    ### B. Transparency Note
    - **Model Use cases:** Primary and out-of-scope use cases for the model, responsible AI considerations, content filtering configurations and more.
  
      ![Model Transparency notice](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/model-transparency-notice.png?raw=true)

    ### C. License 
    - **Model License:** The license under which the model is released, including any restrictions on use or distribution.

      ![Model License notice](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/model-license.png?raw=true)

    ### D. Evaluation Report
    - **Model Benchmarks:** A summary of the model's performance on various benchmarks, including accuracy, speed, and other relevant metrics.
    - **Model Benchmarks:** A list of benchmarks used to evaluate the model's performance, including details on how the model performed on each benchmark. Metrics may include:
      - MMLU Pass@1 (Measuring Massive Multitask Language Understanding) - _Knowledge and reasoning across science, math, and humanities_.
      - DROP - _Measures reading comprehension and numerical reasoning capabilities_
      - among others

      ![Model Evaluation](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/model-evaluation.png?raw=true)

5. After selecting a model and reviewing the model card, you can use the **Playground** to experiment with the model. The playground provides a user-friendly interface for testing the model's capabilities and understanding how it works.

    ![Playground button](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/model-playground-button.png?raw=true)

    You can directly send questions (prompts) to the model and see how it responds. Throughout the session, you can monitor the token usage and the model's response time at the top of the chat UI.

    ![Playground token usage note](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/playground-token-usage.png?raw=true)

6. To check your token usage against your GitHub Models free quota (input/ output tokens, latency), click on the **Input: Output: Time** note at the top right of the chat UI to open Model usage insights.

    ![Playground token usage card](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/model-usage-insights.png?raw=true)

7. Before going further, on the right side of the playground, switch from **Details** to **Parameters** to see the available parameters that you can adjust to change the model's behavior. 

    ![Playground parameters](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/model-parameters.png?raw=true)

    The parameters include:
    - **Max Tokens:** The maximum number of tokens the model can generate in response to a prompt. Adjusting this parameter can help control the length of the model's output. 
    - **Temperature:** Controls the randomness of the model's output. A higher temperature (e.g., 0.8) makes the output more random, while a lower temperature (e.g., 0.2) makes it more focused and deterministic.
    - **Top P:** Controls the diversity of the model's output. A higher value (e.g., 0.9) allows for more diverse outputs, while a lower value (e.g., 0.1) makes the output more focused on the most likely tokens.
    - **Presence Penalty:** Controls the model's tendency to repeat itself. A higher value (e.g., 1.0) discourages repetition, while a lower value (e.g., 0.0) allows for more repetition.
    - **Frequency Penalty:** Similar to the penalty penalty, this parameter controls the model's tendency to repeat the same words or phrases. 
    - **Stop:** A list of tokens that, when generated, will stop the model's output. 

    You can continue interacting with the model in the playground, as you adjust the parameters to ensure you get the desired output.

  🤔 _How do models compare across different prompts and parameters?_

7. GitHub Models provides a **Compare** feature that allows you to compare the performance of different models on the same prompt. This is useful for understanding how different models respond to the same input and can help you choose the best model for your specific use case.

    Click on the **Compare** button at the top right of the playground.

    ![Compare](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/compare-button.png?raw=true)

    Select the models you want to compare from the list of available models from the drop-down.

    This will open a chat UI for the selected models side by side, and your prompt will be sent to both models. 

    ![Compare chat example](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/compare-chat.png?raw=true)

    In the example provided, you can compare the performance of a reasoning model and a conversation model on the same prompt to understand their strengths and limitations.

## 👨‍💻 Playground to VS Code

Now that you have a better understanding of the models from the GitHub Models playground, let's look at how to use them in JavaScript code.

### Clone the repository

1. Clone the repository to your local machine using the following command:

    ```bash
    git clone <your-repo-url>
    ```
    Replace `<your-repo-url>` with the URL of your GitHub repository.

2. Open the cloned repository in Visual Studio Code.

   ```bash
   cd <your-repo-name>
   code .
   ```
   Replace `<your-repo-name>` with the name of your cloned repository.

### Get sample code

1. On the far right, click on **Use this model** and select **Language: JavaScript** and **SDK: Azure AI Inference SDK**. 

    ![Use model](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/use-this-model-button.png?raw=true)

    Follow the instructions provided to:
    - Get a free developer key, (Personal Access Token (classic)) and store it in an environment variable either using bash, PowerShell or command line.
    - Install dependencies 
    - Run basic code sample. **This quest assumes the file is named `sample.js`**

      ![Run node sample file](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/node-sample.png?raw=true)

## 📌 Exercise: Convert a hand-drawn sketch to a web page

1. Download the contoso website hand-drawn sketch from [this link](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/contoso_layout_sketch.jpg), _(right click and open in new tab)_. and save it `contoso_layout_sketch.jpg` in the same directory as your `sample.js` file.

    > **Note**
    >
    > If you aren't using a muiltimodal model, swap out the `modelName` in the code sample with a multimodal model of your choice. You can find a list of multimodal models in the GitHub Models catalog.

  2. Update the code to pass the image to the model as input.

      > **Note**
      > You can use [GitHub Copilot](https://github.com/features/copilot) to help you with this task.
      >
      > ![Update code with GitHub Copilot](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/github-copilot.png?raw=true)

  3. Run the code and check the output in the console.

      ![Run sample passing image](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/run-sample-for-code.png?raw=true)

## 🧰 Use AI Toolkit in VS Code

The AI Toolkit in Visual Studio Code is a powerful extension that provides a set of tools and features to help you build AI applications more efficiently. 

1. Click on the **Extensions** icon in the left sidebar of Visual Studio Code, search for **AI Toolkit** and **install**.

2. Similar to GitHub Models, with the AI Toolkit now installed, you can browse through the catalog of available models, and use the **Playground** to experiment with the models, all on VS Code.

    ![AI Toolkit catalog](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/ai-toolkit.png?raw=true)

    Let's execute the exercise above using the AI Toolkit in VS Code.

3. Select a multimodal model from the catalog and open the **Playground**.

    In the playground, upload the `contoso_layout_sketch.jpg` image and enter a prompt to write the HTML code for the website.

4. On the generated code, click on the **New file** icon to copy the generated code into a new file. Save it as `index.html` in the same directory as your `sample.js` file.

    ![AI Toolkit -html](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/ai-toolkit-html.png?raw=true)

    Do the same for the CSS code and save it as `style.css` in the same directory.

    You can preview the generated code and iterate on the code to improve it (optionally using GitHub Copilot).

    ![AI Toolkit - html preview](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/html-preview.png?raw=true)


## 📚 Further Reading

Here are some additional resources to help you learn more about experimenting with AI models and building prototypes:

- [About GitHub Models](https://docs.github.com/en/github-models/about-github-models)
- [Choosing the right AI model for your task](https://docs.github.com/en/copilot/using-github-copilot/ai-models/choosing-the-right-ai-model-for-your-task)
- [Introducing GitHub Models: A new generation of AI engineers building on GitHub](https://github.blog/news-insights/product-news/introducing-github-models/)
- [📹 DEM500: Prototype, build, and deploy AI apps quickly with GitHub Models](https://build.microsoft.com/en-US/sessions/DEM500?source=sessions)
- [What is the AI Toolkit for Visual Studio Code?](https://learn.microsoft.com/en-us/windows/ai/toolkit/)
- [Lesson 1: Introduction to Generative AI and LLMs for JavaScript Developers](https://github.com/microsoft/generative-ai-with-javascript/tree/main/lessons/01-intro-to-genai#lesson-1-introduction-to-generative-ai-and-llms-for-javascript-developers)
- [Lesson 2: Writing your first AI app](https://github.com/microsoft/generative-ai-with-javascript/blob/main/lessons/02-first-ai-app/README.md#lesson-2-writing-your-first-ai-app)
- [Lesson 3: Prompt Engineering](https://github.com/microsoft/generative-ai-with-javascript/blob/main/lessons/03-prompt-engineering/README.md)
- [Microsoft AI Tools Extension Pack](https://marketplace.visualstudio.com/items?itemName=ms-windows-ai-studio.microsoft-ai-tools-pack), a curated set of essential extensions for building generative AI applications and agents in VS Code