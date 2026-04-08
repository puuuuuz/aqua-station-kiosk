import os

# Create clean app.html from V115 status (90KB)
os.system('git show fb3ac9e:app.html > app.html')

with open('app.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# 1. Update K_FACTOR for 670 pulses/L
text = text.replace('FLOW_K_FACTOR = 570', 'FLOW_K_FACTOR = 670')

# 2. THE ULTIMATE FIX: Capture base pulses on FIRST packet (regardless of status P, S, etc)
# This prevents the 2.9L jump when the board status isn't 'S' yet.
text = text.replace("if (!dispenseSession.startFlowCaptured && stChar === 'S')", "if (!dispenseSession.startFlowCaptured)")

# 3. THE SAFETY LOCK: Only end on 'E' (End) or if user presses Stop
# This ignores 'R' and 'P' at the start of dispense.
text = text.replace("if (['R', 'P', 'E'].includes(stChar)", "if (['E'].includes(stChar)")
text = text.replace("if (['R', 'E'].includes(stChar)", "if (['E'].includes(stChar)")

# 4. Add logs for base pulse capture
text = text.replace("dispenseSession.startFlow = t.flow || 0;", 
                   "dispenseSession.startFlow = t.flow || 0; logToScreen('<span style=\"color:#2ecc71\">📍 BASE PULSES SET: ' + dispenseSession.startFlow + '</span>');")

with open('app.html', 'w', encoding='utf-8') as f:
    f.write(text)
print('IRON DISPENSE PATCH SUCCESSFUL')
