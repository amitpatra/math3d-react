// @flow
import { timeout } from 'utils/functions'

type LoopAPI = {
  running: boolean,
  start: () => void,
  stop: () => void
}
type ThreeStrap = {
  Loop: LoopAPI,
  canvas: HTMLCanvasElement
}

export default class LoopManager {

  /**
   * For managing the animation loop. Let's us enter/exit a 'slow mode' which
   * is useful when to reduce CPU consumption when no updates are expected.
   *
   * Note: we use 'slow mode' rather than turning the loop off entirely because
   * I don't know how to detect exactly when the scene has finished rendering
   */

  enterSlowMode: () => void
  exitSlowMode: () => void
  isInSlowMode: boolean
  isSlowModeBlocked: boolean
  Loop: LoopAPI
  slowOnTime: number
  slowOffTime: number
  canvas: HTMLCanvasElement
  static scrollTime = 3000

  constructor(threestrap: ThreeStrap, slowOnTime: number = 10, slowOffTime: number = 500) {
    this.Loop = threestrap.Loop
    this.canvas = threestrap.canvas
    this.isInSlowMode = false
    this.slowOffTime = slowOffTime
    this.slowOnTime = slowOnTime

    this.canvas.addEventListener('mousedown', this.downHandler)
    this.canvas.addEventListener('touchstart', this.downHandler)
    this.canvas.addEventListener('mouseup', this.upHandler)
    this.canvas.addEventListener('touchend', this.touchExitHandler)
    this.canvas.addEventListener('mousewheel', this.wheelHandler)
    this.canvas.addEventListener('wheel', this.wheelHandler)
  }

  unbindEventListeners = () => {
    this.canvas.removeEventListener('mousedown', this.downHandler)
    this.canvas.removeEventListener('touchstart', this.downHandler)
    this.canvas.removeEventListener('mouseup', this.enterSlowMode)
    this.canvas.removeEventListener('touchend', this.touchExitHandler)
    this.canvas.removeEventListener('mousewheel', this.wheelHandler)
    this.canvas.removeEventListener('wheel', this.wheelHandler)
  }

  slowModeCycle = async () => {
    this.Loop.start()
    await timeout(this.slowOnTime)
    if (this.isInSlowMode) { this.Loop.stop() }
    await timeout(this.slowOffTime)
    if (this.isInSlowMode) { this.slowModeCycle() }
  }

  downHandler = () => {
    this.isSlowModeBlocked = true
    this.exitSlowMode()
  }

  upHandler = () => {
    this.isSlowModeBlocked = false
    this.enterSlowMode()
  }

  touchExitHandler = async (event: TouchEvent) => {
    if (event.touches.length > 0) { return }
    this.isSlowModeBlocked = false
    await timeout(LoopManager.scrollTime)
    this.enterSlowMode()
  }

  wheelHandler = async () => {
    this.exitSlowMode()
    this.isSlowModeBlocked = true
    await timeout(LoopManager.scrollTime)
    this.enterSlowMode()
    this.isSlowModeBlocked = false
  }

  enterSlowMode = () => {
    if (this.isInSlowMode || this.isSlowModeBlocked) { return }
    this.isInSlowMode = true
    this.slowModeCycle()
  }

  exitSlowMode = () => {
    this.isInSlowMode = false
    this.Loop.start()
  }

}
