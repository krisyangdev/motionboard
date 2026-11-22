// Joins the shot renders of a launch film into one MP4 with hard cuts.
// Usage: node join.mjs <film.json>
// film.json: { "out": "launch-film.mp4", "fade": 0, "shots": [{ "dir": "shots/01-light-reveal", "in": 0, "out": 4.4, "render": "renders/final.mp4" }, ...] }
// Each shot is cut to [in, out) seconds of its render: `render` (relative to the shot dir) when given, otherwise the
// newest MP4 in <dir>/renders/. `fade` (seconds, default 0) adds a fade from and to black at the film's ends only.
// Paths are relative to film.json. Needs ffmpeg and ffprobe.
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const planPath = resolve(process.argv[2] ?? 'film.json')
const root = dirname(planPath)
const plan = JSON.parse(readFileSync(planPath, 'utf8'))
const FPS = 30
const FADE = plan.fade ?? 0

const renderOf = (shot) => {
  if (shot.render) return join(root, shot.dir, shot.render)
  const renders = join(root, shot.dir, 'renders')
  const mp4s = readdirSync(renders)
    .filter((f) => f.endsWith('.mp4'))
    .map((f) => join(renders, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  if (!mp4s.length) throw new Error(`join: no render in ${renders}`)
  return mp4s[0]
}
const duration = (file) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }))

const inputs = plan.shots.map((s) => {
  const file = renderOf(s)
  const len = duration(file)
  if (!(s.in >= 0 && s.out > s.in && s.out <= len + 0.01))
    throw new Error(`join: ${s.dir}: in ${s.in} / out ${s.out} do not fit its render (${len.toFixed(2)}s, ${file})`)
  console.log(`join: ${s.dir}: ${s.in}–${s.out}s of ${file}`)
  return file
})
const total = plan.shots.reduce((t, s) => t + (s.out - s.in), 0)
const parts = plan.shots.map(
  (s, i) =>
    `[${i}:v]trim=start=${s.in}:end=${s.out},setpts=PTS-STARTPTS,fps=${FPS},scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p[v${i}]`,
)
const fades = FADE > 0 ? `fade=t=in:st=0:d=${FADE},fade=t=out:st=${(total - FADE).toFixed(3)}:d=${FADE}` : 'null'
const filter =
  parts.join(';') + `;${plan.shots.map((_, i) => `[v${i}]`).join('')}concat=n=${plan.shots.length}:v=1:a=0[cat];[cat]${fades}[out]`

const out = join(root, plan.out ?? 'launch-film.mp4')
execFileSync(
  'ffmpeg',
  ['-y', '-v', 'error', ...inputs.flatMap((f) => ['-i', f]), '-filter_complex', filter, '-map', '[out]', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out],
  { stdio: 'inherit' },
)
console.log(`join: ${out} (${plan.shots.length} shots, ${total.toFixed(2)}s)`)
