import * as cheerio from 'cheerio'
import { writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'

const DB_PATH = path.join(process.cwd(), './db')
const TEAMS = await readFile(DB_PATH + '/teams.json', 'utf-8').then(JSON.parse)

const URLS = {
  leaderBoard: 'https://kingsleague.pro/estadisticas/clasificacion/'
}

async function scrape (url) {
  const res = await fetch(url)
  const html = await res.text()

  return cheerio.load(html)
}

async function getLeaderBoard () {
  const $ = await scrape(URLS.leaderBoard)
  const $rows = $('table tbody tr')

  const LEARDERBOARD_SELECTORS = {
    team: { selector: '.fs-table-text_3', typeOf: 'string' },
    victories: { selector: '.fs-table-text_4', typeOf: 'number' },
    defeats: { selector: '.fs-table-text_5', typeOf: 'number' },
    goalsScored: { selector: '.fs-table-text_6', typeOf: 'number' },
    goalsConceded: { selector: '.fs-table-text_7', typeOf: 'number' },
    yellowCards: { selector: '.fs-table-text_8', typeOf: 'number' },
    redCards: { selector: '.fs-table-text_9', typeOf: 'number' }
  }

  const getTeamFrom = ({ name }) => TEAMS.find(team => team.name === name)

  const cleanText = text =>
    text
      .replace(/\t|\n|\s:/g, '')
      .replace(/.*:/g, ' ')
      .trim()

  const leaderboardSelectorEntries = Object.entries(LEARDERBOARD_SELECTORS)

  const leaderboard = []
  $rows.each((_, el) => {
    const leaderboardEntries = leaderboardSelectorEntries.map(
      ([key, { selector, typeOf }]) => {
        const rawValue = $(el).find(selector).text()
        const cleanedValue = cleanText(rawValue)
        const value = typeOf === 'number' ? Number(cleanedValue) : cleanedValue
        return [key, value]
      }
    )
    const { team: teamName, ...leaderboardForTeam } =
      Object.fromEntries(leaderboardEntries)

    const team = getTeamFrom({ name: teamName })

    leaderboard.push({
      team,
      ...leaderboardForTeam
    })
  })

  return leaderboard
}

const lb = await getLeaderBoard()

await writeFile(
  DB_PATH + '/leaderboard.json',
  JSON.stringify(lb, null, 2),
  'utf-8'
)
