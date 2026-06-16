import { NextResponse } from 'next/server'

export async function GET() {
  const apiToken = process.env.API_FOOTBALL_KEY
  if (!apiToken) {
    return NextResponse.json({ error: 'Missing API Token' }, { status: 500 })
  }

  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/WC/scorers?limit=10', {
      headers: {
        'X-Auth-Token': apiToken
      },
      next: { revalidate: 3600 } // Cachear por 1 hora (3600 segundos)
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'API Fetch failed' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data.scorers || [])
  } catch (error) {
    console.error('Scorers API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
