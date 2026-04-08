import os

path = 'app.html'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Force absolute reset on showScreen('standby')
# This ensures every new button press starts from a CLEAN state
reset_code = """
        if (name === 'standby') {
            dispenseSession.active = false;
            dispenseSession.startFlowCaptured = false;
            dispenseSession.targetReached = false;
            dispenseSession.wasRunning = false;
            dispenseSession.startFlow = -1;
            console.log("♻️ SESSION RESET - Ready for next!");
        }
"""
text = text.replace("currentScreenName = name;", "currentScreenName = name;" + reset_code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('SESSION RESET PATCH SUCCESSFUL')
