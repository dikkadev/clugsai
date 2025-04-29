import 'openai/shims/web'
import OpenAI from 'openai'
import { marked } from 'marked';

const DIV = 'ai-main-container'

let key = ''
const apiKeyStorageKey = 'L2VnTsJG7BYcMOy&oj'
let ai: OpenAI

let SYSTEM_MSG: string
const SYSTEM_MSG_FALLBACK = `You are to act as a Search Engine AI. Answer like one. Always answer! Keep answers brief and pragmatic.`
// Model selection with fallback from storage
let MODEL = 'o4-mini'

let settingsLoaded = false;
chrome.storage.sync.get([apiKeyStorageKey, 'model', 'systemPrompt'], (data) => {
    key = data[apiKeyStorageKey] || '';
    MODEL = data['model'] || 'o4-mini';
    SYSTEM_MSG = data['systemPrompt'] || SYSTEM_MSG_FALLBACK;

    if (!key) {
        console.error('No API Key found');
    }
    settingsLoaded = true;
    console.debug(`Loaded settings: Key found? ${!!key}, Model: ${MODEL}, System Prompt: ${SYSTEM_MSG}`);
});

enum Position {
    just_results = 'just_results',
    with_sidecard = 'with_sidecard',
    with_web_sources = 'with_web_sources',
}

Object.defineProperty(Position, "ToString", {
    value: function(position: Position): string {
        switch (position) {
            case Position.just_results:
                return "Just Results"
            case Position.with_sidecard:
                return "With Sidecard"
            case Position.with_web_sources:
                return "With Web Sources"
        }
    },
    writable: false,
    enumerable: false,
    configurable: false
})

let position: Position | undefined = undefined
function decidePosition(rcnt: HTMLElement): Position {
    if (rcnt.children.length === 1) {
        return Position.just_results
    } else if (rcnt.children.length >= 2) {
        let isOneOfTheChildATheSidecard = false
        for (let child of rcnt.children) {
            if (child.id === "rhs") {
                isOneOfTheChildATheSidecard = true
                break
            }
        }
        if (isOneOfTheChildATheSidecard) {
            return Position.with_sidecard
        } else {
            return Position.with_web_sources
        }
    } else {
        return Position.just_results
    }
}

function placeDivInRcnt(rcnt: HTMLElement, newDiv: HTMLDivElement, position: Position) {
    switch (position) {
        case Position.just_results:
            // just put next to center column that holds the search results
            rcnt.appendChild(newDiv)
            break
        case Position.with_sidecard:
            const rhs = rcnt.querySelector("#rhs")!
            rhs.insertBefore(newDiv, rhs.firstChild)
            break
        case Position.with_web_sources:
            // wrap id center_col in another div and then also put our div in there
            const centerCol = rcnt.querySelector("#center_col")!
            const wrapper = document.createElement("div")
            wrapper.className = "flex flex-row space-x-10"
            wrapper.appendChild(centerCol)
            wrapper.appendChild(newDiv)
            rcnt.appendChild(wrapper)
            break
    }
}

function getSearchQUery(): string {
    let queryInput = document.querySelector("textarea[name='q']") as HTMLTextAreaElement
    if (queryInput) {
        return queryInput.value
    } else {
        console.warn("Query input not found")
        return ""
    }
}

let isFirstMessage = true
interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

let chatHistory: ChatMessage[] = [];
async function makeAiRespond(msg: string, updateFunc: (string) => void) {
    if (isFirstMessage) {
        isFirstMessage = false
        msg = `${SYSTEM_MSG}\n${msg}`;
    }

    chatHistory.push({ role: 'user', content: msg });

    const stream = await ai.chat.completions.create({
        model: MODEL,
        messages: chatHistory as any,
        stream: true,
    });

    let aiResponse = '';
    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        aiResponse += content;
        updateFunc(content);
    }

    chatHistory.push({ role: 'assistant', content: aiResponse });
}

function msgDiv(role: string): [HTMLDivElement, string, (string) => void] {
    const div = document.createElement("div")
    const id = `ai-msg-${Math.random().toString(36).substring(7)}`
    div.id = id
    div.className = "border border-emerald-500 bg-emerald-950 px-4 min-h-[2ch] rounded-xl text-emerald-100 w-4/5 mb-4"
    if (role === "user") {
        div.className += " self-end"
    }

    const content = document.createElement("div")

    div.appendChild(content)

    const updateFunc = async (msg: string) => {
        let old = content.getAttribute('raw') || ''
        let raw = old + msg
        content.setAttribute('raw', raw)

        content.innerHTML = await marked(raw)
    }

    return [div, id, updateFunc]
}

function createDiv(): HTMLDivElement {
    const div = document.createElement("div")
    div.id = DIV
    let classes = ["flex", "flex-col", "rounded-xl", "p-2", "min-w-[30rem]", "border", "border-emerald-800", "prose-sm"]

    if (position === Position.with_sidecard) {
        classes = classes.concat([ "w-full", "my-4"])
    } else if (position === Position.just_results) {
        classes = classes.concat(["max-w-[33%]", "h-min", "ml-[var(--rhs-margin)]"])
    } else if (position === Position.with_web_sources) {

    }
    div.className = classes.join(" ")

    const msgsDiv = document.createElement("div")
    msgsDiv.className = "flex flex-col"

    const inputDiv = document.createElement("div")
    inputDiv.className = "flex flex-row"
    const input = document.createElement("textarea")
    input.className = "border border-emerald-800 bg-emerald-950 text-emerald-100 rounded-xl p-2 w-full h-20"
    input.placeholder = "Ask a follow-up question..."
    inputDiv.appendChild(input)
    const sendButton = document.createElement("button")
    sendButton.innerText = "Send"
    sendButton.className = "bg-emerald-800 text-emerald-100 rounded-xl p-2 ml-2"
    sendButton.onclick = async () => {
        const [userDiv, , userUpdate] = msgDiv('user')
        addMessageToDiv(userDiv)
        let msg = input.value
        userUpdate(msg)
        input.value = ""

        const [aiDiv, , aiUpdate] = msgDiv('ai')
        addMessageToDiv(aiDiv)
        makeAiRespond(msg, aiUpdate)
        input.focus()
    }
    inputDiv.appendChild(sendButton)

    div.appendChild(msgsDiv)
    div.appendChild(inputDiv)

    return div
}

function addMessageToDiv(div: HTMLDivElement) {
    document.querySelector(`#${DIV} div`)?.appendChild(div)
}

function DisplayError(msg: string) {
    const error = document.createElement("div")
    error.className = "border border-red-500 bg-red-200 p-4 rounded-xl text-red-900"
    error.innerText = `Error: ${msg}!`

    const container = document.getElementById(DIV)

    if (container) {
        container.innerHTML = ""
        container.appendChild(error)
    } else {
        console.error("Container not found")
    }
    console.error(msg)
}

window.onload = async function() {
    const rcnt = document.getElementById("rcnt")

    if (!rcnt) {
        console.warn("Element with id 'rcnt' not found")
        return
    }

    console.debug(`query: ${getSearchQUery()}`)
    console.debug(`using system msg: ${SYSTEM_MSG}`)

    if (rcnt) 
        position = decidePosition(rcnt)
        console.debug(`position: ${position}`)
        if (position === Position.just_results) {
            rcnt.className += ' !max-w-full'
        }


        const newDiv = createDiv()

        placeDivInRcnt(rcnt, newDiv, position)
        while (!settingsLoaded) {
            await new Promise(r => setTimeout(r, 500))
            console.debug('Waiting for settings...');
        }

        // Check if the key is actually missing or just empty
        if (!key) {
            // Check if the key exists in storage but is empty
            chrome.storage.sync.get(apiKeyStorageKey, (data) => {
                if (apiKeyStorageKey in data) {
                    DisplayError("API Key is set but empty. Please provide a valid key in the extension options.");
                } else {
                    DisplayError("API Key not found. Please set it in the extension options.");
                }
            });
            return;
        }

        const query = getSearchQUery()

        ai = new OpenAI({
            apiKey: key,
            dangerouslyAllowBrowser: true,
        })

        // Test connection early and catch errors
        try {
            await ai.chat.completions.create({
                model: MODEL,
                messages: [{ role: 'system', content: SYSTEM_MSG }],
                stream: false, // Keep false for a simple check
            });
            console.debug("Initial API connection successful.");
        } catch (error) {
            console.error("Error during initial API connection test:", error);
            DisplayError(`Failed to connect to the API. Please check your API key and network connection. Error: ${error.message}`);
            return; // Stop execution if the initial check fails
        }

        const [quebbinDiv, , quebbinUpdate] = msgDiv('user')
        addMessageToDiv(quebbinDiv)

        for (let word of query.split(" ")) {
            quebbinUpdate(' ' + word)
            await new Promise(r => setTimeout(r, 75))
        }

        const [aiDiv, , aiUpdate] = msgDiv('assistant')
        addMessageToDiv(aiDiv)
        makeAiRespond(query, aiUpdate)

    }
}
