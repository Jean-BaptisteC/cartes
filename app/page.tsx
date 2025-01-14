// Server components here
import fetchOgImage from '@/components/fetchOgImage'
import { geocodeGetAddress } from '@/components/geocodeLatLon'
import buildDescription from '@/components/osm/buildDescription'
import fetchAgency, {
	buildAgencyMeta,
} from '@/components/transport/fetchAgency'
import { ResolvingMetadata } from 'next/dist/lib/metadata/types/metadata-interface'
import { Props } from 'next/script'
import { Suspense } from 'react'
import Container from './Container'
import PaymentBanner from './PaymentBanner'
import getName from './osm/getName'
import getUrl from './osm/getUrl'
import { gtfsServerUrl } from './serverUrls'
import { stepOsmRequest } from './stepOsmRequest'
import OsmFeature from './OsmFeature'

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata
): Promise<Metadata> {
	console.log('Rendering server side app/page')
	const searchParams = await props.searchParams

	if (searchParams.style === 'elections')
		return {
			title:
				'Cartes des résultats du premier tour, des circonscriptions et des candidat(e)s aux législatives 2024',
			description:
				'Qui est arrivé en tête dans ma circonscription ? Trouvez en un clic votre circonscription et la liste des candidats et leur score au vote des législatives 2024 le 30 juin 2024',
			openGraph: {
				images: ['/resultats-1er-tour-legislatives-2024.png'],
				url: '/elections-legislatives-2024',
			},
		}

	/* A main goal of indexatoin : transit maps */
	const agencyMeta = await buildAgencyMeta(searchParams)
	if (agencyMeta) return agencyMeta

	/* Now the indexation of places, the second main goal */
	const allez = searchParams.allez?.split('->')

	if (!allez?.length) return null
	const vers = allez[allez.length - 1]
	const step = await stepOsmRequest(vers, undefined, true)

	if (!step) return null

	const osmFeature = step.osmFeature
	const { lat, lon } = osmFeature || {}

	const tags = osmFeature?.tags || {}
	const modifiedTime = osmFeature?.timestamp
	const title = step.name || getName(tags),
		descriptionFromOsm = buildDescription(step.osmFeature)

	const image = tags.image || (await fetchOgImage(getUrl(tags)))

	const searchParamsString = new URLSearchParams(searchParams).toString()
	const placeMap =
		lat && lon && `${gtfsServerUrl}/placeMap/?lat=${lat}&lon=${lon}&zoom=13`

	const address = step.photonAddress
	const description = address
		? descriptionFromOsm + '. ' + address
		: descriptionFromOsm

	const metadata = {
		title: title,
		description,
		openGraph: {
			images: image ? [image] : placeMap ? [placeMap] : [],
			modifiedTime,
			type: 'article',
			// TODO next doesn't understand this link with only searchParams. Could be
			// symtomatic of a bad choice we made : the id / name should be in the
			// path, not the searchParams ? Could it lead to RSC generation ?
			//url: '/?' + searchParamsString,
		},
	}
	return metadata
}

const Page = async (props) => {
	const searchParams = await props.searchParams
	const allez = searchParams.allez ? searchParams.allez.split('->') : []

	const newPoints = allez.map((point) => stepOsmRequest(point, undefined, true))
	const state = await Promise.all(newPoints).catch((error) => {
		console.log('Error fetching osm nodes from "allez" searchParam ', allez)
		console.log(error)
		return [] // fallback to client side
	})
	console.log('lightgreen state from ssr rendering of osm node', state)

	const agencyEntry = await fetchAgency(searchParams)

	// can't use next-yak for RSC where there is generateMetadata https://github.com/jantimon/next-yak/issues/112#issuecomment-2217800543

	const vers = state?.slice(-1)[0]
	const osmFeature = vers?.osmFeature
	return (
		<main
			style={{
				height: '100%',
				minHeight: '100vh',
			}}
		>
			<Suspense>
				<PaymentBanner parameter={searchParams.abonnement} />

				<Container
					searchParams={searchParams}
					state={state}
					agencyEntry={agencyEntry}
				/>
			</Suspense>
		</main>
	)
}

export default Page
