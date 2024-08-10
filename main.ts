import 'openai/shims/web'
import OpenAI from 'openai'
import { marked } from 'marked';

const DIV = 'ai-main-container'

let key = ''
let triedGettingKey = false
const storageKey = 'L2VnTsJG7BYcMOy&oj'
let ai: OpenAI

const SYSTEM_MSG = `You are a highly knowledgeable and articulate artificial intelligence, designed to provide accurate and detailed answers to a wide range of questions. You're expected to provide clear, concise, and informative responses. In the very possible case that you are not 150% sure about the answer, say so and provide alternative search queries that may lead to better results. Only answer questions that you are confident about. If you are unsure, do not provide an answer.

Instructions:
Read the question carefully to understand what information is being asked for.
Provide a direct, informative answer that is easy to understand.
Include relevant details but avoid unnecessary information.
Do not ask follow up questions or engage in conversation. Only answer or provide alternative search queries if you do not have a high confidence in any answer.

The question will be provided in the first user message.`

chrome.storage.sync.get(storageKey, (data) => {
    const apiKey = data[storageKey]
    if (apiKey) {
        console.log('Retrieved API Key:', apiKey)
        key = apiKey
    } else {
        console.log('No API Key found')
    }
    triedGettingKey = true
})


enum Position {
    STANDALONE = 'STANDALONE',
    SIDEBAR = 'SIDEBAR'
}

let position: Position | undefined = undefined
function decidePosition(rcnt: HTMLElement): Position {
    if (rcnt.children.length === 1) {
        return Position.STANDALONE
    } else if (rcnt.children.length >= 2) {
        return Position.SIDEBAR
    } else {
        return Position.STANDALONE
    }
}

function placeDivInRcnt(rcnt: HTMLElement, newDiv: HTMLDivElement, position: Position) {
    if (position === Position.STANDALONE) {
        rcnt.appendChild(newDiv)
    } else if (position === Position.SIDEBAR) {
        const secondChild = rcnt.children[1]
        if (secondChild.children.length > 0) {
            secondChild.insertBefore(newDiv, secondChild.firstChild)
        } else {
            secondChild.appendChild(newDiv)
        }
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

async function makeAiRespond(msg: string, updateFunc: (string) => void) {
    const stream = await ai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: msg }],
        stream: true,
    })
    for await (const chunk of stream) {
        updateFunc(chunk.choices[0]?.delta?.content || '')
    }
}

function msgDiv(role: string): [HTMLDivElement, string, (string) => void] {
    const div = document.createElement("div")
    const id = `ai-msg-${Math.random().toString(36).substring(7)}`
    div.id = id
    div.className = "border border-emerald-500 bg-emerald-950 px-4 min-h-[2ch] rounded-xl text-emerald-100 w-4/5 mb-4"
    if (role === "user") {
        div.className += " self-end"
    }


    const content = document.createElement("p")

    div.appendChild(content)

    const updateFunc = async (msg: string) => {
        // apppend msg to 'raw' attribute
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
    let classes = ["flex", "flex-col", "rounded-xl", "p-2", "min-w-[10rem]", "border", "border-emerald-800", "prose-sm"]

    if (position === Position.SIDEBAR) {
        classes = classes.concat(["min-h-32", "w-full", "my-4"])
    } else if (position === Position.STANDALONE) {
        classes = classes.concat(["h-[min-content]", "max-w-[33%]", "ml-[var(--rhs-margin)]"])
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

    console.log(`query: ${getSearchQUery()}`)

    if (rcnt) {
        rcnt.className += ' !max-w-full'
        position = decidePosition(rcnt)
        console.warn(`position: ${position}`)

        const newDiv = createDiv()

        placeDivInRcnt(rcnt, newDiv, position)
    } else {
        console.warn("Element with id 'rcnt' not found")
    }

    while (!triedGettingKey) {
        await new Promise(r => setTimeout(r, 500))
    }

    if (!key) {
        DisplayError("API Key not found")
        return
    }

    const query = getSearchQUery()

    ai = new OpenAI({
        apiKey: key,
        dangerouslyAllowBrowser: true,
    })

     ai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: SYSTEM_MSG }],
        stream: false,
    })

    const [quebbinDiv, , quebbinUpdate] = msgDiv('user')
    addMessageToDiv(quebbinDiv)

    for (let word of query.split(" ")) {
        quebbinUpdate(' ' + word)
        await new Promise(r => setTimeout(r, 75))
    }

    const [aiDiv, , aiUpdate] = msgDiv('ai')
    addMessageToDiv(aiDiv)
    makeAiRespond(query, aiUpdate)

}
