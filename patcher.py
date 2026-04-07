import os

path = 'app.html'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# 1. Capture base pulses on FIRST packet regardless of status code
# THE FIX: Removed the status 'S' requirement.
text = text.replace("if (!dispenseSession.startFlowCaptured && stChar === 'S')", "if (!dispenseSession.startFlowCaptured)")

# 2. Update K_FACTOR to 670
text = text.replace('factor = 570', 'factor = 670')
text = text.replace('Factor = 570', 'Factor = 670')
text = text.replace('K_FACTOR = 570', 'K_FACTOR = 670')
text = text.replace('FLOW_K_FACTOR = 570', 'FLOW_K_FACTOR = 670')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('ULTIMATE PATCH SUCCESSFUL')
