import type { MetadataRoute } from 'next'
import { getRecentInterestingNodes } from '@/components/watchOsmPlaces.ts'
import { gtfsServerUrl } from './serverUrls'
import { getLastEdit } from './blog/utils'
import { generateFeed } from '@/lib/rss'
import { downloadIssues } from '@/lib/githubIssues'
import { blogArticles } from './blog/blogArticles'

export const domain = 'https://cartes.app'

const basePaths = [
	'',
	'/blog',
	'/elections-legislatives-2024',
	'/presentation',
	'/presentation/state-of-the-map-2024',
	'/itineraire',
	'/transport-en-commun',
	'/a-propos',
	'/documentation/tickets',
	'/lieux',
]

const generateAgencies = async () => {
	try {
		const request = await fetch(gtfsServerUrl + '/agencies')
		const json = await request.json()
		const entries = Object.entries(json)

		return entries.map(
			([agency_id]) => `/?style=transports&agence=${agency_id}`
		)
	} catch (e) {
		console.error('Error generating agency sitemap')
		console.error(
			'🔴🔴🔴 Attention, le serveur.cartes.app NPM est probablement cassé'
		)
		console.error(e)
	}
}

export default async function sitemap(): MetadataRoute.Sitemap {
	const fetchNewNodes = process.env.NEXT_SITEMAP_NO_DOWNLOAD ? false : true
	let newNodes = []
	if (fetchNewNodes) {
		const recent = await getRecentInterestingNodes()
		newNodes = recent
	}

	const blogEntries = await Promise.all(
		blogArticles.map(async ({ url, date, _raw: { flattenedPath } }) => {
			const lastEdit = await getLastEdit(flattenedPath)

			return {
				url: escapeXml(domain + url),
				lastModified: new Date(lastEdit),
			}
		})
	)
	const agencies = await generateAgencies()
	const issues = await downloadIssues()
	const entries = [
		...basePaths.map((path) => ({
			url: escapeXml(domain + path),
		})),
		...forceUpdate(
			agencies.map((path) => ({
				url: escapeXml(domain + path),
			}))
		),
		...blogEntries,
		...issues.map((issue) => ({
			url: domain + '/documentation/tickets/' + issue.number,
			lastModified: new Date(issue.updated_at),
		})),
		...forceUpdate(newNodes),
	]

	return entries
}

generateFeed()

const lastForcedUpdate = new Date('2024-07-31T10:07:01.358Z')
const forceUpdate = (list) =>
	list.map((el) => ({
		...el,
		lastModified:
			el.lastModified > lastForcedUpdate ? el.lastModified : lastForcedUpdate,
	}))

export function escapeXml(unsafe) {
	return unsafe.replace(/[<>&'"]/g, function (c) {
		switch (c) {
			case '<':
				return '&lt;'
			case '>':
				return '&gt;'
			case '&':
				return '&amp;'
			case "'":
				return '&apos;'
			case '"':
				return '&quot;'
		}
	})
}
