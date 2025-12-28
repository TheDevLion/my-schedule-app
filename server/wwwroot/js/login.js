const loginWithGoogle = () => {
    window.location.href = "/api/login/google"
}

const checkSession = async () => {
    const response = await apiGet("/api/me")
    if (response.ok) window.location.href = "tasks.html"
}

checkSession()

document.addEventListener("DOMContentLoaded", () => {
    const googleButton = document.getElementById("google_login")
    if (googleButton) {
        googleButton.addEventListener("click", loginWithGoogle)
    }
})
