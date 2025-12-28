const ensureSession = async () => {
    const response = await apiGet("/api/me")
    if (!response.ok) window.location.href = "index.html"
}

ensureSession()

const runningTasks = new Map()

const getTaskId = (tr) => {
    return tr.dataset.taskId
}

const updatePauseAllButton = () => {
    const pauseAllButton = document.getElementById("pause_all_button")
    if (pauseAllButton) pauseAllButton.disabled = runningTasks.size === 0
}

const updateAddButtonState = () => {
    const input = document.getElementById("task_input_add")
    const addButton = document.getElementById("add_task_button")
    if (!input || !addButton) return
    addButton.disabled = !input.value.trim()
}

const getUserDayTasks = async (date) => {
    const targetDate = !date ? getCurrentDayStr() : date
    const response = await apiGet(`/api/tasks?date=${encodeURIComponent(targetDate)}`)
    if (!response.ok) return
    const result = await response.json()
    renderLoadedTasksFromDB(result)
}

getUserDayTasks()

const renderLoadedTasksFromDB = (tasks) => {
    const tbody = document.getElementById("tbody")

    for (let task of tasks) {
        const tr = createTaskRow(task)
        tbody.appendChild(tr)
    }
}

const addTaskInDB = async (title) => {
    const newDate = document.getElementById("input_date").value
    const response = await apiPost("/api/tasks", { title: title, date: newDate })
    if (!response.ok) return undefined
    const data = await response.json()
    const result = data?.id
    if (result) showToast(t("taskCreated"), { variant: "success" })
    return result
}

const validateTaskAddInput = (taskTitle) => {
    if (taskTitle) return true
    return false
}

const addTask = async () => {
    const input = document.getElementById("task_input_add")
    const taskTitle = input.value.trim()
    if (validateTaskAddInput(taskTitle))
    {
        const tbody = document.getElementById("tbody")
        const taskid = await addTaskInDB(taskTitle)

        const tr = createTaskRow({ id: taskid, title: taskTitle, historic: [] })
        tbody.appendChild(tr)
        input.value = ""
        updateAddButtonState()
        input.focus()
        
    } else {
        showModal(t("taskNameRequired"), { variant: "warning" })
    }
}

const createTaskRow = (task) => {
    const title = task.title
    const historic = task.historic

    let historicHTML = ""
    let totalTS = 0
    if (historic) {
        for (let hist of historic) {
            historicHTML += `
            <div>
                <span>${hist.interval}</span>
                <input type='text' value='${hist.description}' disabled />
            </div>
            `

            h1 = createDateFromTimeString(hist.interval.slice(0, 8))
            h2 = createDateFromTimeString(hist.interval.slice(11, 19))
            diff = h1 - h2
            totalTS += diff
        }
    }

    const tr = document.createElement("tr")
    tr.dataset.taskId = task.id
    tr.dataset.running = "false"
    tr.innerHTML = `
        <td>${title}</td>
        <td>
            <div class="row-actions">
                <button class="btn-start" data-i18n="startTask">${t("startTask")}</button>
                <button class="btn-pause" data-i18n="pauseTask" disabled>${t("pauseTask")}</button>
                <button class="btn-delete" data-i18n="deleteTask">${t("deleteTask")}</button>
            </div>
        </td>
        <td>${historicHTML}</td>
        <td style="display: none">${task.id}</td>
        <td>${formatDateDiff(new Date(totalTS), false)}</td>
    `

    const startButton = tr.querySelector(".btn-start")
    const pauseButton = tr.querySelector(".btn-pause")
    const deleteButton = tr.querySelector(".btn-delete")

    startButton.disabled = !isButtonStartTaskEnabled()

    startButton.addEventListener("click", () => startTaskClock(tr))
    pauseButton.addEventListener("click", () => pauseTaskRow(tr))
    deleteButton.addEventListener("click", () => deleteTask(tr))

    return tr
}

const startTaskClock = (tr) => {
    if (!isButtonStartTaskEnabled() || tr.dataset.running === "true") return

    const td = tr.children[2]
    const currentTs = new Date()

    const startTaskString = formatDateDiff(currentTs)
    const div = document.createElement("div")
    div.innerHTML = `
        <span>${startTaskString}</span>
        <input type='text' />
    `

    const intervalId = setInterval(() => {
        const newDateTaskString = formatDateDiff(currentTs)
        div.children[0].textContent = newDateTaskString
        updateTotals(tr)
    }, 1000)

    td.appendChild(div)
    runningTasks.set(getTaskId(tr), { intervalId, row: tr })
    tr.dataset.running = "true"
    updateRowButtons(tr)
    updatePauseAllButton()
}

const formatDateDiff = (date1, isCurrentTS = true) => {
    const currentTs = isCurrentTS ? new Date() : new Date(0)

    const startDate = `${date1.getHours().toString().padStart(2, "0")}:${date1.getMinutes().toString().padStart(2, "0")}:${date1.getSeconds().toString().padStart(2, "0")}`
    const finalDate = `${currentTs.getHours().toString().padStart(2, "0")}:${currentTs.getMinutes().toString().padStart(2, "0")}:${currentTs.getSeconds().toString().padStart(2, "0")}`

    const diffHours = new Date(currentTs - date1).getUTCHours()
    const diffMinutes = new Date(currentTs - date1).getUTCMinutes()
    const diffSeconds = new Date(currentTs - date1).getUTCSeconds()

    const diffHoursString = diffHours > 0 ? `${diffHours}h ` : ''
    const diffMinutesString = diffMinutes > 0 ? `${diffMinutes}min ` : ''
    const diffSecondsString = diffSeconds > 0 ? `${diffSeconds}s` : ''

    return isCurrentTS ? `${startDate} - ${finalDate} [${diffHoursString}${diffMinutesString}${diffSecondsString}]` : `${diffHoursString}${diffMinutesString}${diffSecondsString}`
}

const pauseTaskRow = async (tr) => {
    const taskId = getTaskId(tr)
    const runningEntry = runningTasks.get(taskId)
    if (!runningEntry) return

    clearInterval(runningEntry.intervalId)
    runningTasks.delete(taskId)
    tr.dataset.running = "false"

    const lastEntry = tr.children[2].lastElementChild
    if (lastEntry) {
        const input = lastEntry.querySelector("input")
        if (input) input.disabled = true
    }

    await updateTaskInDB(tr)
    updateTotals(tr)
    updateRowButtons(tr)
    updatePauseAllButton()
}

const pauseAllTasks = async () => {
    const rows = Array.from(runningTasks.values()).map((entry) => entry.row)
    for (const row of rows) {
        await pauseTaskRow(row)
    }
}

const updateRowButtons = (tr) => {
    const startButton = tr.querySelector(".btn-start")
    const pauseButton = tr.querySelector(".btn-pause")
    const isRunning = tr.dataset.running === "true"
    if (startButton) startButton.disabled = isRunning || !isButtonStartTaskEnabled()
    if (pauseButton) pauseButton.disabled = !isRunning
}

const updateTaskInDB = async (tr) => {
    const taskHistoryId = tr.children[3].textContent
    const historicList = []

    for (let hist of tr.children[2].children) {
        const histDict = {}
        histDict.interval = hist.children[0].textContent
        histDict.description = hist.children[1].value
        historicList.push(histDict)
    }

    const response = await apiPost(`/api/tasks/${taskHistoryId}/pause`, { historic: historicList })
    if (response.ok) showToast(t("taskPaused"), { variant: "success" })
}

const deleteTask = async (tr) => {
    const confirmed = await showConfirm(t("confirmDelete"), { variant: "warning" })
    if (!confirmed) return

    const taskId = getTaskId(tr)
    if (runningTasks.has(taskId)) {
        await pauseTaskRow(tr)
    }

    const response = await apiDelete(`/api/tasks/${taskId}`)
    if (response.ok) {
        tr.remove()
        showToast(t("taskDeleted"), { variant: "success" })
    }
}

const updateTotals = (tr) => {
    const historic = tr.children[2].children
    let totalTS = 0
    if (historic) {
        for (let hist of historic) {
            const h1 = createDateFromTimeString(hist.children[0].textContent.slice(0, 8))
            const h2 = createDateFromTimeString(hist.children[0].textContent.slice(11, 19))
            const diff = h1 - h2
            totalTS += diff
        }
    }
    tr.children[4].textContent = formatDateDiff(new Date(totalTS), false)
}

const changeDate = async () => {
    if (runningTasks.size > 0) {
        await pauseAllTasks()
    }
    const newDate = document.getElementById("input_date").value
    document.getElementById("tbody").innerHTML = ""
    getUserDayTasks(newDate)
    updatePauseAllButton()
}

const isButtonStartTaskEnabled = () => {
    const newDate = document.getElementById("input_date").value
    if (newDate === getCurrentDayStr())
        return true

    return false
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("task_input_add")
    if (input) {
        input.addEventListener("input", updateAddButtonState)
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                addTask()
            }
        })
        updateAddButtonState()
    }

    const signoffButton = document.getElementById("signoff_button")
    if (signoffButton) {
        signoffButton.addEventListener("click", async () => {
            const confirmed = await showConfirm(t("signOffConfirm"), { variant: "warning" })
            if (!confirmed) return
            await apiPost("/api/logout", {})
            window.location.href = "index.html"
        })
    }
})
