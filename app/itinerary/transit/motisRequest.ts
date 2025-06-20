import { motisServerUrl } from '@/app/serverUrls'
import transportIcon, {
	isMotisTrainMode,
} from '@/components/transit/modeCorrespondance'
import {
	decodeStepModeParams,
	stepModeParamsToMotis,
} from '@/components/transit/modes'
import { lightenColor } from '@/components/utils/colors'
import { booleanContains, distance, point } from '@turf/turf'
import { handleColor, trainColors } from './colors'
import { defaultRouteColor, nowStamp, stamp } from './utils'
import { hexagonePerimeter } from '@/components/transit/hexagoneMotisPerimeter'

export const computeMotisTrip = async (
	start,
	destination,
	date,
	searchParams = {}
) => {
	const body = buildRequestBody(start, destination, date, searchParams)
	console.log('indigo motis body', searchParams, start, destination)

	const startDestinationLine = {
		type: 'Feature',
		geometry: {
			type: 'LineString',
			coordinates: [
				[+start.lng, +start.lat],
				[+destination.lng, +destination.lat],
			],
		},
		properties: {},
	}

	console.log('indigo line', startDestinationLine)
	const isInHexagone = booleanContains(hexagonePerimeter, startDestinationLine)
	const dynamicServerUrl = isInHexagone
		? motisServerUrl
		: `https://api.transitous.org`

	const credits = isInHexagone
		? 'calculateur de transports de Cartes.app basé sur Motis'
		: 'calculateur de transports européen Transitous basé sur Motis'

	try {
		const request = await fetch(
			dynamicServerUrl + '/api/v2/plan?' + new URLSearchParams(body).toString(),
			{
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
			}
		)
		if (!request.ok) {
			console.error('Error fetching motis server')
			const json = await request.json()
			console.log('cyan', json)

			const motisReason = json.content?.reason
			const reason = errorCorrespondance[motisReason]

			return { state: 'error', reason }
		}
		const json = await request.json()
		console.log('indigo motis', json)
		console.log('motis statistics', JSON.stringify(json.debugOutput))

		const augmentedItineraries = await Promise.all(
			json.itineraries.map(async (itinerary) => {
				const { legs } = itinerary
				const augmentedLegs = legs.map((leg) => {
					const { tripId: rawTripId } = leg
					if (!rawTripId) return leg

					const tripId = rawTripId.replace(
						/(\d\d\d\d\d\d\d\d_\d\d:\d\d)_(.+)\|([^_]+)\_(.+)/,
						(correspondance, p0, p1, p2, p3, decalage, chaine) => p1 + p3
					)

					const isTrain = isMotisTrainMode(leg.mode)

					const isBretagneTGV = tripId.startsWith('bretagne_SNCF2')

					const isOUIGO =
						leg.from.stopId.includes('OUIGO') || leg.to.stopId.includes('OUIGO') // well, on fait avec ce qu'on a
					const isTGVStop =
						leg.from.stopId.includes('TGV INOUI') ||
						leg.to.stopId.includes('TGV INOUI') // well, on fait avec ce qu'on a
					const isTGV = isTGVStop || isBretagneTGV

					//TODO this should be a configuration file that sets not only main
					//colors, but gradients, icons (ouigo, inoui, tgv, ter, etc.)
					const sourceGtfs = tripId.split('_')[0],
						prefix = sourceGtfs && sourceGtfs.split('|')[0],
						frenchTrainType = isOUIGO
							? 'OUIGO'
							: isTGV
							? 'TGV'
							: prefix
							? prefix === 'fr-x-sncf-ter'
								? 'TER'
								: prefix === 'fr-x-sncf-tgv'
								? 'TGV'
								: prefix === 'fr-x-sncf-intercites'
								? 'INTERCITES'
								: isTrain && !prefix.startsWith('fr-x-sncf')
								? 'TER'
								: null
							: null

					const customAttributes = {
						routeColor: isTGV
							? trainColors.TGV['color']
							: isOUIGO
							? trainColors.OUIGO['color']
							: frenchTrainType === 'TER'
							? trainColors.TER['color']
							: handleColor(leg.routeColor, defaultRouteColor),
						routeTextColor: isTGV
							? '#fff'
							: isOUIGO
							? '#fff'
							: handleColor(leg.routeTextColor, '#000000'),
						icon: transportIcon(frenchTrainType, prefix),
					}

					/* Temporal aspect */

					const shortName = frenchTrainType || leg.routeShortName
					const result = {
						...leg,
						...customAttributes,
						routeColorDarker: customAttributes.routeColor
							? lightenColor(customAttributes.routeColor, -20)
							: '#5b099f',
						tripId,
						frenchTrainType,
						shortName,
					}
					console.log('indigo motis', result)
					return result
				})
				/* TODO, useless now, v1 had no duration agregaed value ?
				const seconds = augmentedLegs.reduce(
					(memo, next) => memo + next.seconds,
					0
				)
				*/

				return {
					...itinerary,
					legs: augmentedLegs,
				}
			})
		)
		const augmentedResponse = {
			...json,
			itineraries: augmentedItineraries,
			credits,
		}
		return augmentedResponse
	} catch (e) {
		// Can happen when no transit found, the server returns a timeout
		// e.g. for Rennes -> Port Navalo on a sunday...
		// Erratum : there was a problem on the server. Anyway, this error state is
		// useful
		console.error('Error fetching motis server', e)
		return { state: 'error' }
	}
}

export { stamp }

export const notTransitType = ['WALK', 'BIKE', 'CAR']
export const filterTransitLegs = (connection) => ({
	...connection,
	legs: connection.legs.filter((leg) => !notTransitType.includes(leg.mode)),
})
export const isNotTransitItinerary = (itinerary) =>
	itinerary.legs.every((leg) => notTransitType.includes(leg.mode))

// For onTrip, see https://github.com/motis-project/motis/issues/471#issuecomment-2247099832
const buildRequestBody = (start, destination, date, searchParams) => {
	const { correspondances, planification, tortue } = searchParams

	// TODO How to set planification ? How to trigger the appearance of the setter
	// button ?
	const forcePreTrip = planification === 'oui'

	const now = nowStamp(),
		dateStamp = stamp(date),
		difference = dateStamp - now,
		threshold = 60 * 60 //... seconds = 1h

	const preTrip =
		forcePreTrip ||
		//!debut && // not sure why debut
		difference >= threshold // I'm afraid the onTrip mode, though way quicker, could result in only one result in some cases. We should switch to preTrip in thoses cases, to search again more thoroughly

	const requestDistance = distance(
		point([start.lng, start.lat]),
		point([destination.lng, destination.lat])
	)

	const { start: startModeParam, end: endModeParam } =
		decodeStepModeParams(searchParams)

	const startModes = stepModeParamsToMotis(
		startModeParam,
		requestDistance,
		'start'
	)
	const destinationModes = stepModeParamsToMotis(
		endModeParam,
		requestDistance,
		'end'
	)

	console.log(
		'itinerary distance',
		requestDistance,
		startModes,
		destinationModes
	)

	const allModes = [
		...new Set([
			...startModes.preTransitModes,
			...destinationModes.postTransitModes,
		]),
	]

	const body = {
		timetableView: preTrip,
		fromPlace: [
			start.lat,
			start.lng, //TODO start.z is supported by Motis
		],
		directModes: allModes, // setting BIKE here for the general case would make some transit trips that are slower than bike direct route not appear in the results... even if they can be very useful for people without a bike
		maxDirectTime: 10 * 60 * 60, //TODO setting this quite high, 10 hours of bike ~ 200 km
		// but the API's result is going to be heavy in ko, even more for
		// trans-France trips. In these cases, rely on the direct point to point
		// distance
		toPlace: [destination.lat, destination.lng],
		//searchWindow: 6 * 60 * 60, //hours by default but 8 hours if telescope ?
		//previously in v1 : end = datePlusHours(date, 1) // TODO This parameter should probably be modulated depending on the transit offer in the simulation setup. Or, query for the whole day at once, and filter them in the UI
		time: date + '00.000Z',
		...startModes,
		...destinationModes,
		// for pretrip mode :
		//min_connection_count: 5,
		/* Update nov 2024 : the doc is not online anymore, Motis v2 is the
		 * way to go. Setting it to 5 in pretrip now that we have a default
		 * onTrip. We'll see this matter again for the migration */
		/* I do not understand these options. E.g. in Rennes, from 16h30 to
		 * 18h30, setting this and min_connection_count to 5 leads to results
		 * at 23h30 ! Way too much.
		 * https://motis-project.de/docs/features/routing.html#intermodal-and-timetable-routing-from-door-to-door
		 * Also this issue : https://github.com/motis-project/motis/issues/443#issuecomment-1951297984
		 * Is 5 "pareto optimal" connections asking much ? I don't understand
		 * what it is. Hence we set it to 1.
		 */
		//extend_interval_earlier: true,
		//extend_interval_later: true,
		...(correspondances == null
			? {}
			: {
					maxTransfers: +correspondances + 1,
			  }),
		...(tortue
			? {
					transferTimeFactor: tortue,
			  }
			: {}),
	}

	return body
}

const errorCorrespondance = {
	'access: timestamp not in schedule':
		'Notre serveur a eu un problème de mise à jour des données de transport en commun :-/',
}
