// Keeps the zone's "add trailing slash to page paths" redirect rule in step with public/_redirects.
// That rule runs at the edge before the Worker's _redirects, so without this an old slug without the
// trailing slash took two hops (/recipes/old -> /recipes/old/ -> /recipes/new/). Those paths are
// left out of the rule, so _redirects answers them in one hop. Runs in `npm run deploy` after the build.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { SITE } from '../src/site.config.ts'

const RULE = 'add trailing slash to page paths'
// Every page path without a trailing slash that public/_redirects (written by scripts/recipes.mjs) answers.
const oldPaths = readFileSync(new URL('../public/_redirects', import.meta.url), 'utf8')
  .split('\n')
  .map((line) => line.split(' ')[0])
  .filter((from) => from && !from.endsWith('/') && !from.includes('.'))
const expression =
  `(http.host eq "${SITE.domain}" and not ends_with(http.request.uri.path, "/") and not http.request.uri.path contains "."` +
  ` and not starts_with(http.request.uri.path, "/_serverFn") and not starts_with(http.request.uri.path, "/cdn-cgi")` +
  ` and not http.request.uri.path in {${oldPaths.map((p) => `"${p}"`).join(' ')}})`

const cf = (...args) => execFileSync('cf', [...args, '--zone', SITE.domain], { encoding: 'utf8' })
const sets = JSON.parse(cf('rulesets', 'list'))
const set = sets.find((s) => s.phase === 'http_request_dynamic_redirect' && s.kind === 'zone')
if (!set) throw new Error('zone-redirects: no dynamic redirect ruleset on the zone')
const rule = JSON.parse(cf('rulesets', 'get', set.id)).rules.find((r) => r.description === RULE)
if (!rule) throw new Error(`zone-redirects: rule "${RULE}" not found`)

if (rule.expression === expression) console.log(`zone-redirects: up to date (${oldPaths.length} old paths excluded)`)
else {
  const { action, action_parameters, description, enabled } = rule
  cf('rulesets', 'rules', 'update', rule.id, '--ruleset-id', set.id, '--body', JSON.stringify({ action, action_parameters, description, enabled, expression }))
  console.log(`zone-redirects: updated (${oldPaths.length} old paths excluded)`)
}
