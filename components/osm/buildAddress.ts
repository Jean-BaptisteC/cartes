export const buildAddress = (t: object, noPrefix = false) => {
	const g = (key) => {
		const value = noPrefix ? t[key] : t[`addr:` + key] || t['contact:' + key]
		return value || ''
	}

	// This bit of code is ugly, sorry, but had to make it work fast, there's
	// plenty of things more important than a beautiful address for now
	const firstPart =
		g('housenumber') || g('street') ? `${g('housenumber')} ${g('street')}` : ''
	const address = `${firstPart}${
		firstPart && (g('postcode') || g('city') || g('state')) ? ', ' : ''
	} ${g('postcode')} ${g('city')} ${g('state')}
`
	if (address.trim() === '') return null
	return address
}

export function buildPhotonAddress(geocoded) {
	const p = geocoded.properties

	const address = p.city + ', ' + p.state + ', ' + p.country

	return address
}
