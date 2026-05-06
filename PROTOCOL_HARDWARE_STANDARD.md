# 🛰️ Aqua Station Hardware Protocol Standard (AQ-001)

> [!IMPORTANT]
> **STRICT NOTICE: DO NOT MODIFY THIS PROTOCOL.**
> This document defines the verified communication standard between the Tablet (JavaScript) and the Hardware Boards (C-based Logic/Pump boards). Any modification to the packet structure, BCC calculation, or byte offsets will break the dispensing system.

## 1. Packet Structure (Big-Endian Length / XOR-BCC)
Every packet MUST follow the exact 8+ byte structure defined in the hardware's native `IO_Data_Send` C-function.

| Byte Index | Field | Value | Description |
| :--- | :--- | :--- | :--- |
| 0 | **STX** | `0x02` | Start of Text |
| 1 | **MY_ADD** | `0x01` | Tablet Address |
| 2 | **LEN_HI** | `(size+1) >> 8` | Data length (High Byte) |
| 3 | **LEN_LO** | `(size+1) & 0xFF` | Data length (Low Byte) |
| 4 | **TYPE** | `0x4D` ('M') | Fixed Message Type |
| 5 | **ADDR** | `0xC1 / 0xC3 / 0xC6` | Target Board Address |
| 6 | **CMD** | `0x53('S'), 0x50('P'), 0x52('R')` | Operation Code |
| 7 to N | **DATA** | `[params]` | Payload (e.g., target pulses) |
| N+1 | **ETX** | `0x03` | End of Text |
| N+2 | **BCC** | `XOR sum` | XOR of all bytes from STX to ETX |

---

## 2. Verified Board Addresses
| Hardware | Hex Address | Name | Role |
| :--- | :--- | :--- | :--- |
| **Logic Board** | `0xC1` / `0xC3` | Board 193/195 | Water Valve & Flow Counter |
| **Pump Board** | `0xC6` | Board 198 | High-Pressure Pump Control |

---

## 3. Telemetry Byte Offsets (AQ-001 V1.62 Strict)
When receiving a response (RX), the data payload starts at index `p[7]` (JS `dataBytes[0]`).

| Byte Index (Data) | Field | Description | Type |
| :--- | :--- | :--- | :--- |
| **0-1** | **Level** | Water Tank Level | uint16_t (LE) |
| **2-3** | **CNT_Flow** | Current Flow Pulses | uint16_t (LE) |
| **4-5** | **TDS_IN** | Input Water TDS | uint16_t (LE) |
| **6-7** | **TDS_OUT** | Output Water TDS | uint16_t (LE) |
| **8** | **Status** | Machine Status | uint8_t |
| **9** | **V_FW** | Firmware Version | uint8_t |
| **10-11** | **CNT_Flow_Set** | Target Flow/Pulse | uint16_t (LE) |
| **12** | **LOW_PRESSURE** | Low Pressure Sensor | uint8_t |

---

## 4. Operational Constants
- **K-Factor (1L)**: `570` Pulses.
- **Baud Rate**: `115200`.
- **Port Path**: `/dev/ttyS4`.

---

## 5. Revision History
- **V1.1 (2026-04-08)**: Finalized C-Protocol standard. Aligned JS `buildPacket` and `processRxBuffer` with verified hardware timing and Big-Endian length requirement.

---
**Verified by AI: C-Protocol Stabilization Phase.**
