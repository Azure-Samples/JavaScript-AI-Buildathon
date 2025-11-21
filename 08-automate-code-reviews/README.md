# ⚙️ Quest: I want to automate code reviews

## 📋 Pre-requisites

1. A GitHub account
2. [Visual Studio Code](https://code.visualstudio.com/) installed
3. [Node.js](https://nodejs.org/en) installed

## 📝 Overview

You will build an **automated code review system** that uses AI to analyze code changes and provide feedback. This system will help you ensure that your code meets the quality standards best practices of your project, while also learning how to use AI to automate some of your development tasks.

## 🧠 Use GenAIScript in VS Code

[GenAIScript](https://microsoft.github.io/genaiscript/) is an extension of the JavaScript language that allows you to write scripts that can interact with AI models. You can create advanced AI agents and workflows in very few lines of code, making it easier to build AI applications. It comes with a Command Line Interface (CLI) that allows you to run scripts, and a Visual Studio Code extension that provides an interactive editor for writing and running your scripts.

Let's start by installing the GenAIScript extension in Visual Studio Code:

1. Click on the **Extensions** icon in the left sidebar of Visual Studio Code, search for **GenAIScript** and **install**.

2. After installation, you will see a new **GenAIScript** icon in the left sidebar and also in the status bar at the bottom of the window. Click on the **GenAIScript** icon in the status bar and select **Start GenAIScript server**.

3. It will take some time to start the server, as it first install all the required dependencies.

### Set up GitHub token

To use GenAIScript with GitHub Models, you need to set up a GitHub token.

1. Open [this link](https://github.com/marketplace/models/azure-openai/gpt-4-1/playground) in a new tab and click on the **Use this model** button.

    ![Use model](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/use-gh-model.png?raw=true)

    Follow the instructions provided to get a free developer key, named Personal Access Token (classic).

2. Create a new file in your project root called `.env` and add the following line:

    ```text
    GITHUB_TOKEN=<your_github_token_here>
    ```

## ✅ Activity: Create a code review script

Now that you have GenAIScript installed, let's create a script that will analyze code changes and provide feedback.

1. Create a new file in your project directory called `code-review.genai.js`.

2. Open the file and add the following code:

```javascript
const changes = await git.diff({ staged: true });

defDiff("CODE_CHANGES", changes);

$`## Role
You are a senior developer whose job is to review code changes and provide meaningful feedback.

## Task
Review <CODE_CHANGES>, point out possible mistakes or bad practices, and provide suggestions for improvement.
- Be specific about what's wrong and why it's wrong
- Reference proper coding standards and best practices
- Be brief to get your point across
`;
```

Let's break down what this script does:
- It uses the `git.diff()` function to get the staged changes in your Git repository.
- The `defDiff()` function defines a variable `CODE_CHANGES` that contains the code changes, to provide context to the AI model.
- The `$` template literal is used to define the prompt AI model. It instructs the model to review the code changes, point out mistakes, and provide suggestions for improvement.

### Test the code review script

Open the terminal in Visual Studio Code and run the following command to add some changes to your Git repository:

```bash
git add .
```

Then while your `code-review.genai.js` file is open, select the **Run GenAIScript** button at the top right corner of the editor, or use the command palette (Ctrl+Shift+P) and type `GenAIScript: Run Script`.

![Run GenAIScript button](https://github.com/Azure-Samples/JS-AI-Build-a-thon/blob/assets/jsai-buildathon-assets/run-genaiscript.png?raw=true)

You should then see a new tab open with the AI's code review feedback. It should point out a few things since the model has no knowledge of GenAIScript here, but you can use this as a starting point. Experiment with tweaking the prompt to get more specific feedback based on your coding standards and practices.

## 📚 Further Reading

Here are some additional resources to help you learn more about GenAIScript:

- [More automation ideas with GenAIScript sample collection](https://microsoft.github.io/genaiscript/samples/)
- [Learn about Generative AI with JavaScript on YouTube](https://aka.ms/genai-js)
