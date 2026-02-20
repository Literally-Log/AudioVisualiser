export class BeatDetector {
  private energyHistory: number[] = []
  private readonly historySize = 43 // ~1 second at 43fps
  private lastBeatTime = 0
  private readonly minBeatInterval = 200 // ms

  detect(frequencyData: Uint8Array): boolean {
    let energy = 0
    const len = Math.min(frequencyData.length, 10)
    for (let i = 0; i < len; i++) {
      energy += frequencyData[i] * frequencyData[i]
    }
    energy /= len

    this.energyHistory.push(energy)
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift()
    }

    if (this.energyHistory.length < 10) return false

    const avg = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length
    const now = performance.now()

    if (energy > avg * 1.5 && now - this.lastBeatTime > this.minBeatInterval) {
      this.lastBeatTime = now
      return true
    }

    return false
  }

  reset() {
    this.energyHistory = []
    this.lastBeatTime = 0
  }
}
