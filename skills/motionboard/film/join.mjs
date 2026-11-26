// Joins the shot renders of a launch film into one MP4 with hard cuts, lays a music bed under it and mixes in
// sound effects.
// Usage: node join.mjs <film.json>
// film.json: { "out": "launch-film.mp4", "fade": 0, "music": { "file": "chill-wave.mp3", "start": 0 },
//              "shots": [{ "dir": "shots/01-light-reveal", "in": 0, "out": 4.4, "render": "renders/final.mp4",
//                          "sfx": [{ "file": "click", "at": 2.3, "gain": -6 }] }, ...] }
// Each shot is cut to [in, out) seconds of its render: `render` (relative to the shot dir) when given, otherwise the
// newest MP4 in <dir>/renders/. `fade` (seconds, default 0) adds a fade from and to black at the film's ends only.
// `music.file` (relative to film.json, or a bare name from this skill's film/music/) is cut from `music.start` seconds
// (default 0) to the film's length, faded out over the last 1.5 s and levelled to -16 LUFS. No `music` and no `sfx`:
// no audio track.
// Cuts on the beat: when the track's tempo is known (the bundled tracks, or `music.bpm` and `music.beat`, the time of
// its first beat), each cut moves to the nearest beat by changing that shot's `out` (by at most half a beat; the
// previous beat when the render is too short). `"snap": false` in `music` keeps the cuts as written.
// `sfx` cues sit on the shot's own render clock (the clock of `in`/`out`); a cue outside [in, out) is not heard.
// `file` is a name from this skill's film/sfx/ (see CREDITS.md there; a name without its number rotates through the
// variants) or a path relative to film.json. `gain` in dB (default 0); `every` and `count` repeat it (typing).
// Paths are relative to film.json. Needs ffmpeg and ffprobe.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
// Tempo and first beat (seconds) of the bundled tracks
const TRACKS = {
  'chill-wave.mp3': { bpm: 100, beat: 0.02 },
  'digital-lemonade.mp3': { bpm: 120, beat: 0.02 },
  'inspired.mp3': { bpm: 120, beat: 0.02 },
}
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

const lens = []
const inputs = plan.shots.map((s) => {
  const file = renderOf(s)
  const len = duration(file)
  if (!(s.in >= 0 && s.out > s.in && s.out <= len + 0.01))
    throw new Error(`join: ${s.dir}: in ${s.in} / out ${s.out} do not fit its render (${len.toFixed(2)}s, ${file})`)
  lens.push(len)
  return file
})

const musicFile = plan.music && (existsSync(join(root, plan.music.file)) ? join(root, plan.music.file) : join(here, 'music', plan.music.file))
const tempo = plan.music && (plan.music.bpm ? { bpm: plan.music.bpm, beat: plan.music.beat ?? 0 } : TRACKS[plan.music.file])
if (tempo && plan.music.snap !== false) {
  const beat = 60 / tempo.bpm
  const start = plan.music.start ?? 0
  let t = 0
  for (const [i, s] of plan.shots.entries()) {
    const end = start + t + (s.out - s.in)
    const near = tempo.beat + Math.round((end - tempo.beat) / beat) * beat
    let out = s.out + near - end
    if (out > lens[i] || out - s.in < 1) out -= beat
    s.out = Math.round(out * 1000) / 1000
    t += s.out - s.in
  }
}
for (const s of plan.shots) console.log(`join: ${s.dir}: ${s.in}–${s.out}s`)
const total = plan.shots.reduce((t, s) => t + (s.out - s.in), 0)
const parts = plan.shots.map(
  (s, i) =>
    `[${i}:v]trim=start=${s.in}:end=${s.out},setpts=PTS-STARTPTS,fps=${FPS},scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p[v${i}]`,
)
const fades = FADE > 0 ? `fade=t=in:st=0:d=${FADE},fade=t=out:st=${(total - FADE).toFixed(3)}:d=${FADE}` : 'null'
let filter =
  parts.join(';') + `;${plan.shots.map((_, i) => `[v${i}]`).join('')}concat=n=${plan.shots.length}:v=1:a=0[cat];[cat]${fades}[out]`

// Sound effects: one input per file, split to its cues, delayed to film time and mixed.
const cues = []
const turn = {}
const sfxFile = (name) => {
  if (existsSync(join(root, name))) return join(root, name)
  const dir = join(here, 'sfx')
  const files = readdirSync(dir).sort()
  const exact = files.find((f) => f.replace(/\.\w+$/, '') === name)
  if (exact) return join(dir, exact)
  const variants = files.filter((f) => new RegExp(`^${name}-\\d+\\.\\w+$`).test(f))
  if (!variants.length) throw new Error(`join: no sound effect "${name}" in ${dir}`)
  turn[name] = (turn[name] ?? -1) + 1
  return join(dir, variants[turn[name] % variants.length])
}
{
  let t = 0
  for (const s of plan.shots) {
    for (const c of s.sfx ?? [])
      for (let k = 0; k < (c.count ?? 1); k++) {
        const at = c.at + k * (c.every ?? 0)
        if (at >= s.in && at < s.out) cues.push({ file: sfxFile(c.file), t: t + at - s.in, gain: c.gain ?? 0 })
      }
    t += s.out - s.in
  }
}

const extra = []
let audio = ['-an']
const mix = []
let next = plan.shots.length
if (musicFile) {
  const start = plan.music.start ?? 0
  if (duration(musicFile) < start + total) throw new Error(`join: music ${musicFile} is shorter than ${start} + ${total.toFixed(2)}s`)
  filter += `;[${next}:a]atrim=start=${start}:duration=${total.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=out:st=${Math.max(0, total - 1.5).toFixed(3)}:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,aformat=channel_layouts=stereo[music]`
  extra.push('-i', musicFile)
  mix.push('[music]')
  next++
  console.log(`join: music ${musicFile} from ${start}s${tempo && plan.music.snap !== false ? `, cuts on its ${tempo.bpm} BPM beat` : ''}`)
}
const files = [...new Set(cues.map((c) => c.file))]
for (const f of files) {
  const mine = cues.filter((c) => c.file === f)
  extra.push('-i', f)
  filter += `;[${next}:a]aresample=48000,aformat=channel_layouts=stereo,asplit=${mine.length}${mine.map((_, k) => `[f${next}_${k}]`).join('')}`
  mine.forEach((c, k) => {
    const ms = Math.round(c.t * 1000)
    filter += `;[f${next}_${k}]adelay=${ms}|${ms},volume=${c.gain}dB[c${mix.length}]`
    mix.push(`[c${mix.length}]`)
  })
  next++
}
if (mix.length) {
  filter += `;${mix.join('')}amix=inputs=${mix.length}:normalize=0:duration=longest,apad,atrim=duration=${total.toFixed(3)},alimiter=limit=0.89[aout]`
  audio = ['-map', '[aout]', '-c:a', 'aac', '-b:a', '192k']
}
if (cues.length) console.log(`join: ${cues.length} sound effects`)

const out = join(root, plan.out ?? 'launch-film.mp4')
execFileSync(
  'ffmpeg',
  ['-y', '-v', 'error', ...inputs.flatMap((f) => ['-i', f]), ...extra, '-filter_complex', filter, '-map', '[out]', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', ...audio, '-movflags', '+faststart', out],
  { stdio: 'inherit' },
)
console.log(`join: ${out} (${plan.shots.length} shots, ${total.toFixed(2)}s${musicFile ? ', music' : ''}${cues.length ? `, ${cues.length} sound effects` : ''})`)
