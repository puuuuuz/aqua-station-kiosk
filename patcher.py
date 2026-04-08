import os

path = 'app.html'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# 1. REMOVE 'P' and 'R' FROM AUTO-END (Case A/B Final Kill)
# We want to be VERY strict: Only end if pulses are close to target.
text = text.replace(\"if (['R', 'P', 'E'].includes(stChar)\", \"if (['E'].includes(stChar)\")
text = text.replace(\"if (['R', 'E'].includes(stChar)\", \"if (['E'].includes(stChar)\")

# 2. CAPTURE Pulse on FIRST Packet (even if status is P)
text = text.replace(\"if (!dispenseSession.startFlowCaptured && stChar === 'S')\", \"if (!dispenseSession.startFlowCaptured)\")

# 3. Increase Timeout to 30s (No rush)
text = text.replace('Timeout: 3000', 'Timeout: 30000')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('ULTIMATE PATCH B SUCCESSFUL')
