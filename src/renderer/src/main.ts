import { Application, Assets, Ticker } from 'pixi.js'
import { Spine, TrackEntry } from '@esotericsoftware/spine-pixi-v8'
import '@pixi/unsafe-eval'
import Config from './config'

let isDragging = false
let startX: number, startY: number
let randomIntervalTimer: NodeJS.Timeout | null = null
let spine: Spine

function init(): void {
  window.addEventListener('DOMContentLoaded', async () => {
    await afterLoaded()
  })
}

function onMouseMove(e: MouseEvent): void {
  const deltaX = Math.abs(e.clientX - startX)
  const deltaY = Math.abs(e.clientY - startY)
  if (deltaX > 3 || deltaY > 3) {
    isDragging = true
    window.electron.ipcRenderer.send('move-window', {
      x: e.screenX - startX,
      y: e.screenY - startY
    })
  }
}

function onMouseUp(): void {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  if (!isDragging) {
    console.info('Clicked')
  }
}

function getRandomIntInclusive(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function scheduleRandomAnimation(spine: Spine, config: Config): Promise<void> {
  if (randomIntervalTimer) {
    clearTimeout(randomIntervalTimer)
    randomIntervalTimer = null
  }
  const delay = getRandomIntInclusive(config.frequencyMin, config.frequencyMax) * 1000
  console.info(`Next random animation delay: ${delay}ms`)
  randomIntervalTimer = setTimeout(async () => {
    if (!spine.destroyed && config.randoms?.length) {
      if (config.enableWalk) {
        if (Math.random() < config.walkProbability) {
          console.info('Trigger walk')
          let direction = Math.random() < 0.5 ? -1 : 1
          const size = await window.electron.ipcRenderer.invoke('get-screen-size')
          const position = await window.electron.ipcRenderer.invoke('get-position')
          if (direction == 1 && position.x - 200 <= 0) {
            direction = -1
          } else if (direction == -1 && position.x + 200 >= size.width) {
            direction = 1
          }
          console.info(`Confirm direction: ${direction == 1 ? 'left' : 'right'}`)
          flip(direction)
          const walk_entry = spine.state.setAnimation(0, config.walkAnim, false)
          await walk(-direction, walk_entry, config)
          spine.state.addAnimation(0, config.idle, true, 0)
          setTimeout(() => scheduleRandomAnimation(spine, config))
          return
        }
      }
      const randomAnim = config.randoms[Math.floor(Math.random() * config.randoms.length)]
      console.info(`Do animation: ${randomAnim}`)
      spine.state.setAnimation(0, randomAnim, false)
      spine.state.addAnimation(0, config.idle, true, 0)
    }
    setTimeout(() => scheduleRandomAnimation(spine, config))
  }, delay)
}

async function afterLoaded(): Promise<void> {
  const overlay = document.getElementById('drag-overlay') as HTMLDivElement
  overlay.addEventListener('mousedown', (e) => {
    isDragging = false
    startX = e.clientX
    startY = e.clientY
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  })
  const applicationWrapper = document.getElementById('app') as HTMLDivElement
  const app = new Application()
  await app.init({
    backgroundAlpha: 0,
    width: 150,
    height: 200,
    autoDensity: true,
    antialias: true,
    resolution: window.devicePixelRatio || 1
  })
  app.canvas.id = 'app-canvas'
  applicationWrapper.appendChild(app.canvas)
  const data = await (await fetch('app://get/model/config.json')).text()
  const config: Config = JSON.parse(data)
  console.info('config', config)
  Assets.add({ alias: 'skeleton-data', src: 'app://get/model/model.json' })
  Assets.add({ alias: 'skeleton-atlas', src: 'app://get/model/sekai_atlas.atlas' })
  await Assets.load(['skeleton-data', 'skeleton-atlas'])
  spine = Spine.from({ skeleton: 'skeleton-data', atlas: 'skeleton-atlas' })
  spine.pivot.set(0.5)
  spine.scale.set(0.3)
  spine.x = app.screen.width / 2
  spine.y = app.screen.height / 1.1
  spine.state.setAnimation(0, config.idle, true)
  setTimeout(() => {
    scheduleRandomAnimation(spine, config)
  })
  app.stage.addChild(spine)
}

async function in_ticker(
  on_step: (ticker: Ticker) => void,
  when_finish: (ticker: Ticker) => boolean,
  on_finish: () => void
): Promise<void> {
  const task = new Promise<void>((resolve) => {
    const ticker = new Ticker()
    ticker.add(() => {
      on_step(ticker)
      if (when_finish(ticker)) {
        on_finish()
        resolve()
        ticker.destroy()
      }
    })
    ticker.start()
  })
  await task
}

async function run_walk(
  animation: (now_x: number) => void,
  time_ms: number,
  direction: number,
  size: { width: number; height: number },
  position: { x: number; y: number },
  on_finish: () => void
): Promise<void> {
  let progress = 0
  let now_x = position.x
  const step = 2
  if (time_ms >= 30) {
    await in_ticker(
      (ticker) => {
        progress = progress + ticker.elapsedMS / time_ms
        progress = Math.min(progress, 1)
        now_x += (step * direction) / 2
        animation(now_x)
      },
      () => progress >= 1 || now_x + 165 >= size.width,
      () => on_finish()
    )
  }
  animation(now_x)
}

async function walk(direction: number, entry: TrackEntry, config: Config): Promise<void> {
  const size = await window.electron.ipcRenderer.invoke('get-screen-size')
  const position = await window.electron.ipcRenderer.invoke('get-position')
  await run_walk(
    (now_x: number) => {
      window.electron.ipcRenderer.send('move-window', {
        x: now_x,
        y: position.y
      })
    },
    entry.animation!.duration * 1000,
    direction,
    size,
    position,
    () => {
      spine.state.setAnimation(0, config.idle, true)
    }
  )
}

function flip(direction: number): void {
  spine.scale.x = Math.abs(spine.scale.x) * direction
}

init()
