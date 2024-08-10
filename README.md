# **CLUGSAI (Clear Lightweight Untracked Google Search AI)**

## **1\. Introduction**

CLUGSAI is a lightweight Chrome extension designed to enhance your Google Search experience by integrating AI-powered assistance directly into the search results page. It is built with privacy in mind, ensuring no unnecessary data tracking while providing clear and concise answers to your queries.

## **2\. Features**

- **AI Integration**: Get quick, AI-generated responses alongside your Google Search results.
- **Lightweight and Efficient**: Minimal impact on browsing speed and system resources.
- **Customizable**: Easily configure your API key via the extension's options page.

## **3\. Installation**

1. **Download**: Clone or download the repository to your local machine.
2. **Load the Extension**:
    - Open Chrome and go to `chrome://extensions/`.
    - Enable "Developer mode" in the top right corner.
    - Click "Load unpacked" and select the directory where the extension is located.
3. **Permissions**: The extension requires access to storage for saving your API key.

## **4\. Usage**

1. **Set Up API Key**:
    - Navigate to the extension's options page.
    - Enter your OpenAI API key and click "Save".
2. **Search with Google**:
    - Perform a Google search as usual.
    - View AI-powered responses directly on the search results page.

## **5\. Development**

### **Getting Started**

- **Build the Project**:
    - Use the `just build` command to compile the TypeScript files into a content script.
    - Use the `just tailwind` command to build the CSS styles with Tailwind.
- **Codebase Overview**:
    - `main.ts`: Contains the logic for integrating AI responses into the search results.
    - `options.html` and `options.js`: Handles API key input and storage.
    - `manifest.json`: Defines the extension's settings and permissions.
