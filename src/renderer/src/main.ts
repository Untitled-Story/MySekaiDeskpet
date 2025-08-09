import { Application, Assets } from 'pixi.js'
import { Spine } from '@esotericsoftware/spine-pixi-v8'
import '@pixi/unsafe-eval'
import Config from './config'

let isDragging = false
let startX: number, startY: number
let randomIntervalTimer: NodeJS.Timeout | null = null

function init(): void {
  window.addEventListener('DOMContentLoaded', async () => {
    await doAThing()
  })
}

function onMouseMove(e: MouseEvent): void {
  const deltaX = Math.abs(e.clientX - startX)
  const deltaY = Math.abs(e.clientY - startY)

  if (deltaX > 10 || deltaY > 10) {
    isDragging = true
    window.electron.ipcRenderer.send('move-window', {
      x: e.screenX - startX,
      y: e.screenY - startY
    })
  }
}

function onMouseUp(_e: unknown): void {
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

  randomIntervalTimer = setTimeout(() => {
    if (!spine.destroyed && config.randoms?.length) {
      const randomAnim = config.randoms[Math.floor(Math.random() * config.randoms.length)]
      console.info(`Do animation: ${randomAnim}`)
      spine.state.setAnimation(0, randomAnim, false)
      spine.state.addAnimation(0, config.idle, true, 0)
    }
    scheduleRandomAnimation(spine, config)
  }, delay)
}

async function doAThing(): Promise<void> {
  const overlay = document.getElementById('drag-overlay') as HTMLDivElement
  overlay.addEventListener('mousedown', (e) => {
    isDragging = false
    startX = e.clientX
    startY = e.clientY

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  })

  const applicationWrapper = document.getElementById('app')! as HTMLDivElement
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
  const spine = Spine.from({
    skeleton: 'skeleton-data',
    atlas: 'skeleton-atlas'
  })
  spine.pivot.set(0.5)
  spine.scale.set(0.3)
  spine.x = app.canvas.width / 2
  spine.y = app.canvas.height / 1.1
  spine.state.setAnimation(0, config.idle, true)
  setTimeout(() => {
    scheduleRandomAnimation(spine, config)
  })
  app.stage.addChild(spine)
}

init()
