import { useEffect, useState } from 'react'
import { fetchOverpassRequest, fetchSimilarNodes } from './fetchOverpassRequest'

export default function useOverpassRequest(bbox, categories) {
	const [features, setFeatures] = useState({})

	useEffect(() => {
		if (!bbox || !categories) return

		categories.map(async (category) => {
			const nodeElements = await fetchOverpassRequest(bbox, category)

			setFeatures((features) => ({
				...features,
				[category.name]: nodeElements,
			}))
		})
	}, [
		categories && categories.join((category) => category.name),
		bbox && bbox.join('|'),
	])

	return [features]
}

export function useFetchSimilarNodes(step, givenSimilarNodes) {
	const [similarNodes, setSimilarNodes] = useState(givenSimilarNodes)

	useEffect(() => {
		const doFetch = async () => {
			if (!step?.osmCode || !step?.center) return
			const features = await fetchSimilarNodes(step)
			setSimilarNodes(features)
		}

		doFetch()
	}, [step?.osmCode, step?.center])

	return similarNodes
}
