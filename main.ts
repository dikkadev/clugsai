import OpenAI from 'openai'
import { marked } from 'marked';

const DIV = 'ai-main-container'

let key = ''
const apiKeyStorageKey = 'L2VnTsJG7BYcMOy&oj'
let ai: OpenAI

let SYSTEM_MSG: string
const SYSTEM_MSG_FALLBACK = `You are a concise search companion for Google queries.
Behavior:
- Answer directly first; then give 3–6 tight bullet points with key facts, tradeoffs, and next steps.
- Keep it brief and pragmatic. Avoid filler, hedging, and disclaimers unless safety-critical.
- If the query is ambiguous, state the top interpretation you’re using and continue.
- Prefer recent, broadly accepted knowledge; note if uncertainty is material.
- Format for fast scanning: short sentences, bold keywords, links only when essential.
- No roleplay, no theatrics. Output should fit well in a compact sidebar.
`
// Model selection with fallback from storage
let MODEL = 'gpt-5-nano'

let settingsLoaded = false;
chrome.storage.sync.get([apiKeyStorageKey, 'model', 'systemPrompt'], (data) => {
    key = data[apiKeyStorageKey] || '';
    MODEL = data['model'] || 'gpt-5-nano';
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
    div.className = "py-3 min-h-[2ch] rounded-xl mb-4 border text-gray-100"
    if (role === "user") {
        div.className += " self-end w-4/5 px-4 ai-msg-user"
    } else {
        // slightly smaller left padding to reduce perceived indent
        div.className += " ai-msg ai-msg-assistant pl-3 pr-4"
    }

    const loader = document.createElement("div")
    if (role !== "user") {
        loader.className = "ai-typing"
        loader.innerHTML = '<span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span>'
    }

    const content = document.createElement("div")
    content.className = "prose-sm"

    if (role !== "user") {
        div.appendChild(loader)
    }
    div.appendChild(content)

    const updateFunc = async (msg: string) => {
        let old = content.getAttribute('raw') || ''
        let raw = old + msg
        content.setAttribute('raw', raw)

        if (role !== "user") {
            if (raw.length > 0) {
                loader.style.display = 'none'
            }
        }

        content.innerHTML = await marked(raw)
    }

    return [div, id, updateFunc]
}

function createDiv(): HTMLDivElement {
    const div = document.createElement("div")
    div.id = DIV
    let classes = [
        "flex",
        "flex-col",
        "rounded-2xl",
        "min-w-[30rem]",
        "border",
        "text-gray-100",
        "shadow-lg",
        "ai-panel"
    ]

    if (position === Position.with_sidecard) {
        classes = classes.concat([ "w-full", "my-4"])
    } else if (position === Position.just_results) {
        classes = classes.concat(["max-w-[33%]", "h-min", "ml-[var(--rhs-margin)]"])
    } else if (position === Position.with_web_sources) {

    }
    div.className = classes.join(" ")
    ;(div.style as any).minWidth = '32rem'

    // Drag handle bar (top)
    const dragBar = document.createElement("div")
    dragBar.className = "ai-drag-handle"
    const dragIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    dragIcon.setAttribute("viewBox", "0 0 24 14")
    dragIcon.setAttribute("aria-hidden", "true")
    dragIcon.classList.add("ai-drag-icon")
    const circlePositions = [
        [4,5],[12,5],[20,5],
        [4,11],[12,11],[20,11]
    ]
    for (const [cx, cy] of circlePositions) {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        c.setAttribute("cx", String(cx))
        c.setAttribute("cy", String(cy))
        c.setAttribute("r", "1.4")
        dragIcon.appendChild(c)
    }
    dragBar.appendChild(dragIcon)

    // Header (content)
    const header = document.createElement("div")
    header.className = "flex items-center justify-between mb-2"
    const left = document.createElement("div")
    left.className = "flex items-center gap-2"
    const title = document.createElement("span")
    title.textContent = "AI Assistant"
    title.className = "text-sm font-medium text-gray-200"
    const modelPill = document.createElement("span")
    modelPill.className = "text-xs px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-200"
    modelPill.textContent = MODEL
    left.appendChild(title)
    left.appendChild(modelPill)

    const right = document.createElement("div")
    right.className = "flex items-center gap-2"
    const regenBtn = document.createElement("button")
    regenBtn.textContent = "Regenerate"
    regenBtn.className = "text-xs px-2 py-1 rounded-md border border-gray-700 text-gray-200 hover:bg-gray-800"
    right.appendChild(regenBtn)
    header.appendChild(left)
    header.appendChild(right)

    const msgsDiv = document.createElement("div")
    msgsDiv.id = "ai-msgs"
    msgsDiv.className = "flex flex-col px-2"

    const inputDiv = document.createElement("div")
    inputDiv.className = "flex flex-row mt-2"
    const input = document.createElement("textarea")
    input.className = "border border-gray-700 bg-gray-900 text-gray-100 rounded-xl p-2 w-full h-20"
    input.placeholder = "Ask a follow-up question… (Shift+Enter for newline)"
    inputDiv.appendChild(input)
    const sendButton = document.createElement("button")
    sendButton.innerText = "Send"
    sendButton.className = "bg-gray-700 hover:bg-gray-600 text-white rounded-xl px-3 py-2 ml-2"
    let lastUserPrompt = ""
    sendButton.onclick = async () => {
        const [userDiv, , userUpdate] = msgDiv('user')
        addMessageToDiv(userDiv)
        let msg = input.value
        userUpdate(msg)
        input.value = ""
        lastUserPrompt = msg

        const [aiDiv, , aiUpdate] = msgDiv('ai')
        addMessageToDiv(aiDiv)
        makeAiRespond(msg, aiUpdate)
        input.focus()
    }
    input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendButton.click()
        }
    })
    inputDiv.appendChild(sendButton)

    regenBtn.onclick = () => {
        if (!lastUserPrompt) return
        const [aiDiv, , aiUpdate] = msgDiv('ai')
        addMessageToDiv(aiDiv)
        makeAiRespond(lastUserPrompt, aiUpdate)
        input.focus()
    }

    div.appendChild(dragBar)
    const bodyDiv = document.createElement("div")
    bodyDiv.className = "ai-panel-body"
    bodyDiv.appendChild(header)
    bodyDiv.appendChild(msgsDiv)
    bodyDiv.appendChild(inputDiv)
    div.appendChild(bodyDiv)

    // Initialize draggable behavior after element is attached
    queueMicrotask(() => initDraggable(div, dragBar))

    return div
}

function addMessageToDiv(div: HTMLDivElement) {
    document.querySelector(`#ai-msgs`)?.appendChild(div)
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

    if (rcnt) {
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
            console.debug("Initial API connection successful.")
        } catch (error) {
            console.error("Error during initial API connection test:", error)
            // @ts-ignore
            DisplayError(`Failed to connect to the API. Please check your API key and network connection. Error: ${error.message}`)
            return
        }

        const [quebbinDiv, , quebbinUpdate] = msgDiv('user')
        addMessageToDiv(quebbinDiv)

        for (let word of query.split(" ")) {
            quebbinUpdate(' ' + word)
            await new Promise(r => setTimeout(r, 75))
        }

        const [aiDiv, , aiUpdate] = msgDiv('assistant')
        aiDiv.classList.add('ai-msg-assistant')
        addMessageToDiv(aiDiv)
        makeAiRespond(query, aiUpdate)
    }
}

// Draggable overlay implementation
function initDraggable(panel: HTMLDivElement, handle: HTMLElement) {
    let isFixed = false
    let isDragging = false
    let startX = 0
    let startY = 0
    let startLeft = 0
    let startTop = 0
    let placeholder: HTMLDivElement | null = null

    const onPointerDown = (ev: PointerEvent) => {
        // Don’t start drag from interactive elements inside the handle
        const target = ev.target as HTMLElement
        if (target.closest('button, a, input, textarea, select')) return

        const rect = panel.getBoundingClientRect()
        if (!isFixed) {
            // Insert placeholder to keep layout
            placeholder = document.createElement('div')
            placeholder.style.width = rect.width + 'px'
            placeholder.style.height = rect.height + 'px'
            placeholder.style.visibility = 'hidden'
            const parent = panel.parentElement
            if (parent) {
                parent.insertBefore(placeholder, panel)
            }
            panel.style.position = 'fixed'
            panel.style.left = rect.left + 'px'
            panel.style.top = rect.top + 'px'
            panel.style.width = rect.width + 'px'
            panel.style.zIndex = '2147483647'
            isFixed = true
            panel.classList.add('ai-panel--floating')
        }

        isDragging = true
        startX = ev.clientX
        startY = ev.clientY
        startLeft = parseFloat(panel.style.left || '0')
        startTop = parseFloat(panel.style.top || '0')
        document.body.style.userSelect = 'none'
        handle.classList.add('dragging')
        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp, { once: true })
    }

    const onPointerMove = (ev: PointerEvent) => {
        if (!isDragging) return
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        const viewW = window.innerWidth
        const viewH = window.innerHeight
        const rect = panel.getBoundingClientRect()
        let nextLeft = startLeft + dx
        let nextTop = startTop + dy
        // clamp inside viewport with small gutter
        const gutter = 8
        // allow panel to slide partially off-left without causing page horizontal scroll
        const minLeft = -Math.max(0, rect.width - 48) // keep at least 48px visible
        nextLeft = Math.max(minLeft, Math.min(viewW - gutter, nextLeft))
        nextTop = Math.max(gutter, Math.min(viewH - gutter, nextTop))
        panel.style.left = nextLeft + 'px'
        panel.style.top = nextTop + 'px'
    }

    const onPointerUp = () => {
        isDragging = false
        document.body.style.userSelect = ''
        handle.classList.remove('dragging')
        window.removeEventListener('pointermove', onPointerMove)
    }

    handle.addEventListener('pointerdown', onPointerDown)

    // Re-clamp on resize
    window.addEventListener('resize', () => {
        if (!isFixed) return
        const rect = panel.getBoundingClientRect()
        const gutter = 8
        const minLeft = -Math.max(0, rect.width - 48)
        const left = Math.min(Math.max(minLeft, rect.left), window.innerWidth - gutter)
        const top = Math.min(Math.max(gutter, rect.top), window.innerHeight - gutter)
        panel.style.left = left + 'px'
        panel.style.top = top + 'px'
    })
}
