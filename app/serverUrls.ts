export const gtfsServerUrl =
	process.env.NEXT_PUBLIC_LOCAL_GTFS_SERVER === 'true'
		? 'http://localhost:3001'
		: 'https://serveur.cartes.app/gtfs'

export const pmtilesServerUrl =
	process.env.NEXT_PUBLIC_LOCAL_GTFS_SERVER === 'true'
		? 'http://localhost:3001'
		: 'https://serveur.cartes.app/pmtiles'

export const motisServerUrl =
	process.env.NEXT_PUBLIC_LOCAL_GTFS_SERVER === 'true'
		? 'http://localhost:3000'
		: 'https://serveur.cartes.app'

export const getFetchUrlBase = () => {
	const branchUrl = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL,
		isMaster = branchUrl?.includes('-git-master-'),
		domain = isMaster ? 'cartes.app' : branchUrl
	const urlBase =
		process.env.NEXT_PUBLIC_NODE_ENV === 'development'
			? 'http://localhost:8080'
			: 'https://' + domain
	return urlBase
}
