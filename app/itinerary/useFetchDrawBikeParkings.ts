import { useEffect, useState } from 'react'
import useDrawFeatures from '../effects/useDrawFeatures'
import { resilientOverpassFetch } from '../overpassFetcher'

const category = {
	name: 'Arceaux vélo',
	icon: 'parking',
	group: 'Déplacements',
	'open by default': true,
}

const radius = 120 // metres
const getLastPoint = (features) => features[0].geometry.coordinates.slice(-1)[0]
export default function useFetchDrawBikeParkings(map, cycling) {
	const [features, setFeatures] = useState(null)
	const lastPoint = cycling?.features && getLastPoint(cycling.features)

	// build overpass query
	const query =
		lastPoint &&
		`[out:json];
		node(around:${radius}, ${lastPoint[1]}, ${lastPoint[0]})["bicycle_parking"];
		out body; >; out skel qt;`

	useEffect(() => {
		if (!query) return

		const doFetch = async () => {
			const json = await resilientOverpassFetch(query)

			console.log('vélo', json)

			setFeatures(json.elements)
		}
		doFetch()

		// search area
		//
		// overpass bbox
		// overpass query -> points
		// draw on map -> v1
	}, [query, setFeatures])

	const backgroundColor = '#57bff5'
	useDrawFeatures(
		map,
		cycling && features,
		false,
		category,
		() => null,
		backgroundColor
	)
}
