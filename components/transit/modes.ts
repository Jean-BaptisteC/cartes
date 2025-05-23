import { hours, minutes } from '@/app/itinerary/transit/utils'

export const getTimePart = (searchParam) =>
	searchParam.split('-')[1].split('min')[0]

const decodeStepModeParam = (param) => {
	if (param == null) return { time: null, mode: null }
	const [modeStart, timeStartRaw] = param.split('-')
	const timeStart = timeStartRaw.split('min')[0]
	return { time: timeStart, mode: modeStart }
}
export const decodeStepModeParams = (searchParams) => {
	try {
		const { debut, fin } = searchParams

		const start = decodeStepModeParam(debut)
		const end = decodeStepModeParam(fin)

		const result = {
			start,
			end,
		}
		console.log('indigo decoded', result)
		return result
	} catch (e) {
		console.error('Error decoding start mode, start time, or end...', e)
	}
}

export const stepModeParamsToMotis = (
	stepModeParams,
	distance,
	whichPart: 'start' | 'end'
) => {
	const { mode, time } = stepModeParams

	const modeKey = `${whichPart === 'start' ? 'pre' : 'post'}TransitModes`

	const durationKey = `max${whichPart === 'start' ? 'Pre' : 'Post'}TransitTime`

	if (mode?.startsWith('marche') && time)
		return {
			[modeKey]: ['WALK'],

			PedestrianProfile: mode.startsWith('marchereduite')
				? 'WHEELCHAIR' // It looks like the default profile is already tuned for handicaped people, but I could be wrong. We miss a documentation of the profiles here https://github.com/motis-project/ppr/tree/master/profiles
				: // TODO add the accessibility / wheelchair and other options.
				  // Does it incur a processing cost and file weight ? Yes,
				  // profiles need to be set before compilation https://github.com/motis-project/motis/issues/364
				  // MAJ : It looks like PPR profiles are in the config file but
				  // do not occur a new rebuilding of the PPR cache data :)
				  'FOOT',

			[durationKey]: minutes(time),
		}

	if (mode === 'vélo' && time)
		return {
			[modeKey]: ['BIKE'],
			[durationKey]: minutes(time),
		}

	if (mode === 'voiture' && time)
		return {
			[modeKey]: ['Car'],
			[durationKey]: minutes(time),
		}

	// If no mode is set by the user, we're trying to provide a multimodal view
	// that covers a large range of possibilities, giving the user perspectives
	// that we cannot guess precisely.
	//
	// This is the state of the art of our comprehension of how to use Motis to
	// produce useful intermodal results in France, letting the user find the
	// closest train station for more long range requests
	// See https://github.com/cartesapp/cartes/issues/416
	//
	// Here we set a threshold in km (50) for either not asking a trip starting with a bike
	// segment because we expect the user will use local transit, or ask it with a
	// max bike duration request depending on the distance :
	// 1h of bike ~= 20km for trips lower than 200 km
	// 2h and 40 km for trips more than 200 km
	//
	// With thiese settings, we should cover most of the hexagone.
	const bikeTrainSearchDistance = //0 * 60
		hours(distance < 10 ? 0 : distance < 200 ? 1 : 2)
	// Motis v2 cannot set a specific max_duration per pre-transit mode. It's
	// shared. So we cannot ask Motis to give us walk trips with max 10 minutes walk
	// + bike trips with 30 minutes, for our "by default" large cover mode
	//
	//
	//
	// WALK is 2 km/h
	// BIKE is 20 km/h, x10
	// CAR is 50 to 100 km/h, x3 to x5, so final x 30 or x 50
	//
	// This leads to the necessity to make multiple parallel requests and then
	// analyse and summarize the results

	const modes = [
		{
			[modeKey]: ['WALK'],

			PedestrianProfile: 'FOOT',
			[durationKey]: minutes(15),
		},
		bikeTrainSearchDistance > 0 && {
			[modeKey]: 'BIKE',
			max_duration: bikeTrainSearchDistance,
		},
	].filter(Boolean)

	console.log('lightgreen motis intermodal', {
		distance,
		bikeTrainSearchDistance: bikeTrainSearchDistance / 60 + ' min',
	})

	return modes[0] //TODO code the possibility to make multiple requests
}
