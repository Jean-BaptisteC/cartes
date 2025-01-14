import { buildAllezPartFromOsmFeature } from './app/SetDestination'
import getUrl from './app/osm/getUrl'
import { getFetchUrlBase } from './app/serverUrls'
import fetchOgImage from './components/fetchOgImage'

export default async function buildPlaceJsonLd(osmFeature, step) {
	const { tags = {} } = osmFeature
	const image = tags.image || (await fetchOgImage(getUrl(tags)))

	const { photonFeature } = step
	const addressProperties = photonFeature && photonFeature.properties

	const url =
		getFetchUrlBase() +
		'/?allez=' +
		encodeURIComponent(buildAllezPartFromOsmFeature(osmFeature))

	return {
		'@context': 'https://schema.org',
		'@type': 'Place', //TODO make this more precise with categories.yaml
		//TODO read this list of properties to see which we can fill
		//https://schema.org/Place
		//additionalType: ['http://www.productontology.org/id/G%C3%AEte'], //TODO
		//this too if useful
		//TODO put all tags not used as additionalProperty https://schema.org/additionalProperty
		//
		//
		image: image ? [image] : undefined,
		//TODO duplicate of image ?
		...(image
			? {
					photo: {
						'@type': 'ImageObject',
						contentUrl: image,
						name: osmFeature.name,
					},
			  }
			: {}),
		name: osmFeature.name,
		description: osmFeature.description,
		url,

		address: {
			'@type': 'PostalAddress',
			addressLocality: addressProperties.city,
			postalCode: addressProperties.postcode,
			addressRegion: addressProperties.state,
			addressCountry: addressProperties.countrycode,
		},
		geo: {
			'@type': 'GeoCoordinates',
			latitude: osmFeature.lat,
			longitude: osmFeature.lon,
		},
		hasMap: 'https://cartes.app/',
		//TODO
		//isAccessibleForFree
	}
}
