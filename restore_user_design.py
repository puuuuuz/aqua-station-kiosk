import os

# Restore Your Original 90KB Design
os.system('cp app.html.bak app.html')

with open('app.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# 1. THE HIDDEN LOGIC FIXES (NO UI CHANGES!)
# Restore pulse capture on VERY first packet (removed stChar check)
text = text.replace("if (!dispenseSession.startFlowCaptured && stChar === 'S')", 
                   "if (!dispenseSession.startFlowCaptured)")

# Reset all session states when returning to standby screen
reset_trigger = """        if (name === 'standby') {
            dispenseSession.active = false;
            dispenseSession.startFlowCaptured = false;
            dispenseSession.targetReached = false;
            dispenseSession.wasRunning = false;
            dispenseSession.startFlow = -1;
        }
"""
text = text.replace("currentScreenName = name;", "currentScreenName = name;" + reset_trigger)

# Ensure K=670 is used EVERYWHERE
text = text.replace('factor = 570', 'factor = 670')
text = text.replace('Factor = 570', 'Factor = 670')
text = text.replace('K_FACTOR = 570', 'K_FACTOR = 670')
text = text.replace('FLOW_K_FACTOR = 570', 'FLOW_K_FACTOR = 670')

with open('app.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('USER DESIGN RESTORED + HIDDEN LOGIC PATCHED')
