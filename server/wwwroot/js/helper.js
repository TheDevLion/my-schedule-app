const apiRequest = async (path, options = {}) => {
    const response = await fetch(path, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    })

    return response
}

const apiGet = async (path) => {
    return apiRequest(path, { method: "GET" })
}

const apiPost = async (path, body) => {
    return apiRequest(path, {
        method: "POST",
        body: JSON.stringify(body)
    })
}

const apiDelete = async (path) => {
    return apiRequest(path, { method: "DELETE" })
}

const translations = {
    "pt-br": {
        appTitle: "MyTasks",
        titleLogin: "MyTasks - Login",
        titleTasks: "MyTasks",
        loginHeading: "MyTasks",
        loginSubtitle: "Entre com sua conta Google para continuar.",
        googleLogin: "Entrar com Google",
        alertTitle: "Aviso",
        okButton: "Ok",
        cancelButton: "Cancelar",
        confirmButton: "Confirmar",
        signOff: "Sair",
        signOffConfirm: "Deseja sair agora?",
        taskPlaceholder: "Nova tarefa",
        addTask: "Adicionar",
        pauseAll: "Pausar tudo",
        pauseTask: "Pausar",
        deleteTask: "Excluir",
        confirmDelete: "Deseja excluir esta tarefa?",
        tableTitle: "Título",
        tableAction: "Ações",
        tableHistory: "Histórico",
        tableTotal: "Total",
        startTask: "Iniciar",
        taskCreated: "Tarefa criada com sucesso!",
        taskNameRequired: "Tarefa precisa ter um nome!",
        taskPaused: "Tarefa pausada!",
        taskDeleted: "Tarefa excluída."
    },
    "en-us": {
        appTitle: "MyTasks",
        titleLogin: "MyTasks - Login",
        titleTasks: "MyTasks",
        loginHeading: "MyTasks",
        loginSubtitle: "Sign in with your Google account to continue.",
        googleLogin: "Sign in with Google",
        alertTitle: "Notice",
        okButton: "Ok",
        cancelButton: "Cancel",
        confirmButton: "Confirm",
        signOff: "Sign off",
        signOffConfirm: "Do you want to sign off now?",
        taskPlaceholder: "New task",
        addTask: "Add",
        pauseAll: "Pause all",
        pauseTask: "Pause",
        deleteTask: "Delete",
        confirmDelete: "Do you want to delete this task?",
        tableTitle: "Title",
        tableAction: "Actions",
        tableHistory: "History",
        tableTotal: "Total",
        startTask: "Start",
        taskCreated: "Task created successfully!",
        taskNameRequired: "Task needs a name!",
        taskPaused: "Task paused!",
        taskDeleted: "Task deleted."
    }
}

const getSavedLanguage = () => {
    return localStorage.getItem("MyTask_lang") || "en-us"
}

let currentLang = getSavedLanguage()

const applyTranslations = () => {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n")
        el.textContent = t(key)
    })

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder")
        el.setAttribute("placeholder", t(key))
    })

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
        const key = el.getAttribute("data-i18n-title")
        const title = t(key)
        el.textContent = title
        document.title = title
    })
}

const updateLangToggle = () => {
    const toggle = document.getElementById("lang_toggle")
    if (!toggle) return
    toggle.textContent = currentLang === "pt-br" ? "EN-US" : "PT-BR"
}

const setLanguage = (lang) => {
    currentLang = lang
    localStorage.setItem("MyTask_lang", lang)
    document.documentElement.setAttribute("lang", lang)
    applyTranslations()
    updateLangToggle()
}

const t = (key) => {
    return translations[currentLang]?.[key] || translations["en-us"]?.[key] || key
}

const initLanguageToggle = () => {
    currentLang = getSavedLanguage()
    document.documentElement.setAttribute("lang", currentLang)
    applyTranslations()
    updateLangToggle()

    const toggle = document.getElementById("lang_toggle")
    if (toggle) {
        toggle.addEventListener("click", () => {
            const nextLang = currentLang === "pt-br" ? "en-us" : "pt-br"
            setLanguage(nextLang)
        })
    }
}

document.addEventListener("DOMContentLoaded", initLanguageToggle)

window.t = t

const ensureToastContainer = () => {
    let container = document.getElementById("toast_stack")
    if (container) return container

    container = document.createElement("div")
    container.id = "toast_stack"
    document.body.appendChild(container)
    return container
}

const showToast = (message, options = {}) => {
    const { variant = "info", duration = 2500 } = options
    const container = ensureToastContainer()
    const toast = document.createElement("div")
    toast.className = `toast toast--${variant}`
    toast.setAttribute("role", "status")
    toast.textContent = message
    container.appendChild(toast)

    setTimeout(() => {
        toast.classList.add("toast--hide")
        toast.addEventListener("transitionend", () => toast.remove(), { once: true })
    }, duration)
}

const showModal = (message, options = {}) => {
    const { title = t("alertTitle"), variant = "info", buttonText = t("okButton") } = options
    const overlay = document.createElement("div")
    overlay.className = "message-overlay"
    overlay.setAttribute("role", "dialog")
    overlay.setAttribute("aria-modal", "true")

    const card = document.createElement("div")
    card.className = `message-card message-card--${variant}`

    if (title) {
        const heading = document.createElement("h2")
        heading.textContent = title
        card.appendChild(heading)
    }

    const body = document.createElement("p")
    body.textContent = message
    card.appendChild(body)

    const actions = document.createElement("div")
    actions.className = "message-actions"
    const button = document.createElement("button")
    button.type = "button"
    button.textContent = buttonText
    actions.appendChild(button)
    card.appendChild(actions)

    const close = () => {
        overlay.classList.add("message-overlay--hide")
        overlay.addEventListener("transitionend", () => overlay.remove(), { once: true })
    }

    button.addEventListener("click", close)
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) close()
    })

    overlay.appendChild(card)
    document.body.appendChild(overlay)
    button.focus()
}

const showConfirm = (message, options = {}) => {
    const { title = t("alertTitle"), variant = "warning", confirmText = t("confirmButton"), cancelText = t("cancelButton") } = options
    return new Promise((resolve) => {
        const overlay = document.createElement("div")
        overlay.className = "message-overlay"
        overlay.setAttribute("role", "dialog")
        overlay.setAttribute("aria-modal", "true")

        const card = document.createElement("div")
        card.className = `message-card message-card--${variant}`

        if (title) {
            const heading = document.createElement("h2")
            heading.textContent = title
            card.appendChild(heading)
        }

        const body = document.createElement("p")
        body.textContent = message
        card.appendChild(body)

        const actions = document.createElement("div")
        actions.className = "message-actions"

        const cancelButton = document.createElement("button")
        cancelButton.type = "button"
        cancelButton.className = "button-outline"
        cancelButton.textContent = cancelText

        const confirmButton = document.createElement("button")
        confirmButton.type = "button"
        confirmButton.textContent = confirmText

        actions.appendChild(cancelButton)
        actions.appendChild(confirmButton)
        card.appendChild(actions)

        const close = (result) => {
            overlay.classList.add("message-overlay--hide")
            overlay.addEventListener("transitionend", () => overlay.remove(), { once: true })
            resolve(result)
        }

        cancelButton.addEventListener("click", () => close(false))
        confirmButton.addEventListener("click", () => close(true))
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) close(false)
        })

        overlay.appendChild(card)
        document.body.appendChild(overlay)
        confirmButton.focus()
    })
}

window.showToast = showToast
window.showModal = showModal
window.showConfirm = showConfirm

const getCurrentDayStr = () => {
    const date = new Date()
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
}

function createDateFromTimeString(timeString) {
    // Obter a data atual
    const currentDate = new Date();
    
    // Extrair a parte da data no formato YYYY-MM-DD
    const datePart = currentDate.toISOString().split('T')[0];
    
    // Combinar a parte da data com a string de horas
    const dateTimeString = `${datePart}T${timeString}`;
    
    // Criar um objeto Date usando a string completa de data e hora
    const dateTime = new Date(dateTimeString);
    
    return dateTime;
}

const diffBetweenTimestampsIntraDay = (ts1 = "00:00:00", ts2 = "23:59:59") => {
    const baseDate = "1970-01-01T"

    const diff = new Date(Math.abs(new Date(baseDate + ts2 + "Z") -  new Date(baseDate + ts1  + "Z")))
    const hours = diff.getUTCHours()
    const minutes = diff.getUTCMinutes()
    const seconds = diff.getUTCSeconds()

    const hoursStr = hours ? hours.toString().padStart(2, "0") : ""
    const minutesStr = minutes ? minutes.toString().padStart(2, "0") : ""
    const secondsStr = seconds ? seconds.toString().padStart(2, "0") : ""

    const finalStr = `${hoursStr ? hoursStr + "h" : ""}${minutesStr ? minutesStr + "min " : ""}${secondsStr ? secondsStr + "s" : ""}`
    return finalStr
}
