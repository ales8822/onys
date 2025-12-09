#Requires AutoHotkey v2.0

; -------------------------------------------------------------------
; CONFIGURATION
; -------------------------------------------------------------------
; 1. ROOT PATHS (Adjust if your username is different)
RootDir := "C:\Users\AlAr\my_progs\Onys"
backendDir := RootDir "\backend"
frontendDir := RootDir "\frontend"

; 2. URLS
frontendURL := "http://localhost:5174"

; -------------------------------------------------------------------
; GUI SETUP
; -------------------------------------------------------------------
MainGui := Gui("+Resize", "Onys AI Launcher")
MainGui.SetFont("s10", "Segoe UI")

MainGui.AddText("xm w280 center ", "⚫ ONYS WORKSPACE AI")
MainGui.AddText("xm w280 center cGray", "Dev Environment Control")

; --- LAUNCH BUTTON ---
; Launches Windows Terminal with 2 tabs (Backend & Frontend)
MainGui.AddButton("xm w280 h45", "🚀 Launch Dev Environment").OnEvent("Click", StartDevMode)

MainGui.AddText("xm w280 center", "--- QUICK TOOLS ---")

; Open Browser
MainGui.AddButton("xm w280", "🌍 Open Frontend (Port 5174)").OnEvent("Click", (*) => Run(frontendURL))

; Kill Processes (Panic Button)
MainGui.AddButton("xm w280", "💀 Kill All (Node/Python)").OnEvent("Click", KillAll)

; Exit
MainGui.AddButton("xm w280", "❌ Exit Launcher").OnEvent("Click", (*) => ExitApp())

MainGui.Show("w300 h350")

; -------------------------------------------------------------------
; LOGIC FUNCTIONS
; -------------------------------------------------------------------

StartDevMode(*) {
    ; COMMAND EXPLANATION:
    ; 1. wt.exe: Windows Terminal
    ; 2. -w 0 new-tab: Create first tab
    ; 3. Backend Logic: Go to backend folder -> Activate Venv (in root) -> Run Uvicorn on 8004
    ; 4. Split-pane: Create second pane
    ; 5. Frontend Logic: Go to frontend folder -> Run npm dev forcing port 5174
    
    ; Note: We use '..\venv' because we are inside 'backend/' but venv is in root 'Onys/'
    backendCmd := 'cmd /k "title ONYS BACKEND (8004) && ..\venv\Scripts\activate && uvicorn main:app --reload --port 8004"'
    
    ; Note: We add '-- --port 5174' to force Vite to use that specific port
    frontendCmd := 'cmd /k "title ONYS FRONTEND (5174) && npm run dev -- --port 5174"'

    fullCommand := 'wt.exe -w 0 new-tab --title "Onys Dev" -d "' backendDir '" ' backendCmd ' `; split-pane -V --title "Frontend" -d "' frontendDir '" ' frontendCmd

    try {
        Run(fullCommand)
    } catch {
        MsgBox("Error: Windows Terminal (wt.exe) not found on this system.", "Error", "IconX")
    }
}

KillAll(*) {
    ; Forcefully closes node (React), python (FastAPI), and uvicorn processes
    if MsgBox("This will kill ALL Node.js and Python processes.`nAre you sure?", "Confirm Kill", "YesNo IconExclamation") = "Yes" {
        try {
            RunWait("taskkill /F /IM uvicorn.exe /T",, "Hide")
            RunWait("taskkill /F /IM python.exe /T",, "Hide")
            RunWait("taskkill /F /IM node.exe /T",, "Hide")
            MsgBox("Processes terminated.", "Success", "Iconi")
        } catch as err {
            MsgBox("Failed to kill processes: " err.Message)
        }
    }
}