import Introduction from '@/components/Introduction'
import MapContent from '@/components/MapContent'
import PaymentBlock from '@/components/PaymentBlock'
import { ContentLoaderWrapper, Loader } from '@/components/loader'
import useSetSearchParams from '@/components/useSetSearchParams'
import { getThumb } from '@/components/wikidata'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import BookmarkButton from './BookmarkButton'
import Bookmarks from './Bookmarks'
import ClickedPoint from './ClickedPoint'
import { ContentSection, ContentWrapper } from './ContentUI'
import ElectionsContent from './Elections'
import { FeatureImage } from './FeatureImage'
import OsmFeature from './OsmFeature'
import { PlaceButtonList } from './PlaceButtonsUI'
import PlaceSearch from './PlaceSearch'
import QuickBookmarks from './QuickBookmarks'
import { getMinimumQuickSearchZoom } from './QuickFeatureSearchUI'
import SetDestination from './SetDestination'
import ShareButton from './ShareButton'
import { DialogButton, ModalCloseButton } from './UI'
import { ZoneImages } from './ZoneImages'
import Itinerary from './itinerary/Itinerary'
import { getHasStepBeingSearched } from './itinerary/Steps'
import getUrl from './osm/getUrl'
import StyleChooser from './styles/StyleChooser'
import { defaultAgencyFilter } from './transport/AgencyFilter'
import { defaultTransitFilter } from './transport/TransitFilter'
import TransportMap from './transport/TransportMap'
import useOgImageFetcher from './useOgImageFetcher'

export default function Content(props) {
	const {
		setLatLngClicked,
		zoneImages,
		bboxImages,
		bbox,
		panoramaxImages,
		resetZoneImages,
		state,
		setState,
		zoom,
		setZoom,
		sideSheet, // This gives us the indication that we're on the desktop version, where the Content is on the left, always visible, as opposed to the mobile version where a pull-up modal is used
		searchParams,
		snap,
		setSnap = (snap) => null,
		openSheet = () => null,
		setStyleChooser,
		style,
		styleKey,
		styleChooser,
		itinerary,
		transportStopData,
		geocodedClickedPoint,
		resetClickedPoint,
		transportsData,
		geolocation,
		focusImage,
		vers,
		similarNodes,
		quickSearchFeaturesMap,
		setDisableDrag,
		wikidata,
		wikipediaInfoboxImages,
		resetWikipediaInfoboxImages,
		center,
		mapContent,
		chargement,
		setChargement,
	} = props

	//useWhatChanged(props, 'Render component Content')

	const tags = vers?.tags
	const url = tags && getUrl(tags)

	const ogImages = useOgImageFetcher(url),
		ogImage = ogImages[url],
		tagImage = tags?.image,
		mainImage = tagImage || ogImage // makes a useless request for ogImage that won't be displayed to prefer mainImage : TODO also display OG

	const [featureImageError, setFeatureImageError] = useState(false)

	const [tutorials, setTutorials] = useLocalStorage(
		'tutorials',
		{},
		{ initializeWithValue: false }
	)

	const introductionRead = tutorials.introduction,
		clickTipRead = true || tutorials.clickTip

	const setSearchParams = useSetSearchParams()

	const wikidataPictureUrl = wikidata?.pictureUrl
	const wikiFeatureImage =
		!wikipediaInfoboxImages && // too much risk of collision. Wikipedia infobox images are awesome
		!tagImage && // We can't easily detect if tagImage is the same as wiki* image
		// e.g.
		// https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Cathédrale Sainte-Croix d'Orléans 2008 PD 33.JPG&width=500
		// https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Cathédrale_Sainte-Croix_d'Orléans_2008_PD_33.JPG/300px-Cathédrale_Sainte-Croix_d'Orléans_2008_PD_33.JPG
		// are the same but with a different URL
		// hence prefer tag image, but this is questionable
		vers &&
		(vers.tags?.wikimedia_commons
			? getThumb(vers.tags.wikimedia_commons, 500)
			: wikidataPictureUrl)

	const content = [
		vers && vers.requestState === 'success',
		zoneImages,
		bboxImages,
		panoramaxImages,
		!clickTipRead,
		geocodedClickedPoint,
		searchParams.gare,
		searchParams.abonnement,
		chargement,
		mapContent,
	]

	const hasContent = content.some(
		(el) => el && (!Array.isArray(el) || el.length > 0)
	)

	const elections = searchParams.style === 'elections'

	const showContent =
		hasContent &&
		// treat the case click on a OSM feature -> feature card -> click on "go
		// there" -> it's ok to keep the card -> click on origin -> state.length ===
		// 2 -> useless destination card
		// Note : what we wanted to do would need a filter(Boolean), but in practice
		// removing the card after the destination click is good too
		!(itinerary.isItineraryMode && state.length >= 2) &&
		!elections

	const bookmarkable = geocodedClickedPoint || vers?.center // later : choice

	const hasDestination = vers?.center || geocodedClickedPoint
	//TODO haha these two variables are similar. Is the order really relevant ?

	const nullEntryInState = state.findIndex(
		(el) => el == null || el.allezValue == null
	)
	const hasNullEntryInState = nullEntryInState > -1

	const isItineraryModeNoSteps =
		itinerary.isItineraryMode &&
		(state.length === 0 ||
			!state.find((step) => step?.choice || step?.allezValue))

	const beingSearchedIndex = state?.findIndex(
			(step) => step?.stepBeingSearched
		),
		searchStepIndex =
			beingSearchedIndex > -1 ? beingSearchedIndex : nullEntryInState

	const hasStepBeingSearched = getHasStepBeingSearched(state)
	const showSearch =
		!styleChooser &&
		// In itinerary mode, user is filling or editing one of the itinerary steps
		(hasStepBeingSearched || !(vers?.center || itinerary.isItineraryMode)) // at first, on desktop, we kept the search bar considering we have room. But this divergence brings dev complexity

	const minimumQuickSearchZoom = getMinimumQuickSearchZoom(!sideSheet)

	useEffect(() => {
		if (geocodedClickedPoint) {
			setSnap(1, 'Content')
		}
	}, [geocodedClickedPoint, setSnap])

	useEffect(() => {
		if (!chargement) return
		if (snap > 1) setSnap(1)
	}, [chargement, setSnap])

	useEffect(() => {
		if (!showSearch) return
		if (snap === 3)
			if (zoom > minimumQuickSearchZoom) {
				setSnap(2, 'Content')
			}
	}, [showSearch, zoom, snap])

	const showIntroductionLink = !introductionRead

	const showIntroduction = searchParams.intro

	const { abonnement } = searchParams
	useEffect(() => {
		if (!showIntroduction && !abonnement) return

		setTimeout(() => setSnap(1), 200)
	}, [showIntroduction, setSnap, abonnement])

	if (showIntroduction)
		return (
			<Introduction
				{...{
					setTutorials,
					tutorials,
					setSearchParams,
					setSnap,
				}}
			/>
		)

	if (searchParams.abonnement)
		return <PaymentBlock {...{ setSearchParams, openSheet }} />

	return (
		<ContentWrapper>
			{chargement && (
				<ContentLoaderWrapper>
					<Loader flexDirection="column">
						<p>
							Chargement
							{chargement.name && (
								<span>
									{' '}
									de <strong>{chargement.name}</strong>
								</span>
							)}
						</p>
					</Loader>
				</ContentLoaderWrapper>
			)}
			{showSearch && (
				<section>
					<PlaceSearch
						{...{
							state,
							setState,
							sideSheet,
							setSnap,
							zoom,
							setSearchParams,
							searchParams,
							autoFocus: hasStepBeingSearched,
							stepIndex: searchStepIndex,
							geolocation,
							placeholder: isItineraryModeNoSteps ? 'Votre destination' : null,
							minimumQuickSearchZoom,
							vers,
							snap,
							quickSearchFeaturesMap,
							center,
							setChargement,
							bbox,
						}}
					/>
					{searchParams.favoris !== 'oui' &&
						searchParams.style !== 'transports' && (
							<QuickBookmarks oldAllez={searchParams.allez} />
						)}
				</section>
			)}

			{styleChooser ? (
				<StyleChooser
					{...{ setStyleChooser, style, setSnap, searchParams, zoom, setZoom }}
				/>
			) : (
				showContent && (
					<ContentSection>
						{vers?.requestState === 'success' && (
							<ModalCloseButton
								title="Fermer l'encart point d'intérêt"
								onClick={() => {
									console.log('will yo')
									setSearchParams({ allez: undefined })
									setLatLngClicked(null)
									resetZoneImages()
									resetWikipediaInfoboxImages()
									console.log('will set default stat')
									openSheet(false)
								}}
							/>
						)}
						{!wikipediaInfoboxImages && mainImage && !featureImageError && (
							<FeatureImage
								src={mainImage}
								onError={() => setFeatureImageError(true)}
								$isHeaderImage={true}
							/>
						)}
						{wikiFeatureImage && (
							<FeatureImage src={wikiFeatureImage} $isHeaderImage={true} />
						)}
						{wikipediaInfoboxImages && (
							<ZoneImages
								displayImages={false}
								zoneImages={wikipediaInfoboxImages.map((title) => ({
									title,
								}))} // bbox includes zone, usually
								focusImage={focusImage}
							/>
						)}
						<ZoneImages
							displayImages={searchParams.photos != null}
							zoneImages={
								searchParams.photos != null && bboxImages?.length > 0
									? bboxImages
									: zoneImages
							} // bbox includes zone, usually
							panoramaxImages={panoramaxImages}
							focusImage={focusImage}
							allPhotos={searchParams.photos === 'toutes'}
						/>
						{(hasDestination || bookmarkable) && (
							<PlaceButtonList>
								{hasDestination && (
									<SetDestination
										geocodedClickedPoint={geocodedClickedPoint}
										geolocation={geolocation}
										searchParams={searchParams}
										vers={vers}
									/>
								)}
								{bookmarkable && (
									<BookmarkButton
										geocodedClickedPoint={geocodedClickedPoint}
										osmFeature={vers}
									/>
								)}
								{bookmarkable && (
									<ShareButton
										{...{ geocodedClickedPoint, osmFeature: vers }}
									/>
								)}
							</PlaceButtonList>
						)}
						{vers?.requestState === 'success' ? (
							<OsmFeature
								data={vers}
								transportStopData={transportStopData}
								photonFeature={vers.photonFeature}
								similarNodes={similarNodes}
							/>
						) : geocodedClickedPoint ? (
							<>
								<ModalCloseButton
									title="Fermer l'encart point d'intéret"
									onClick={() => {
										resetClickedPoint()
									}}
								/>
								<ClickedPoint
									geocodedClickedPoint={geocodedClickedPoint}
									geolocation={geolocation}
								/>
							</>
						) : (
							!clickTipRead && (
								<div>
									<p
										style={{
											maxWidth: '20rem',
										}}
									>
										Cliquez sur un point d'intérêt ou saisissez une destination
										puis explorez les gares autour.
									</p>
									<DialogButton
										onClick={() =>
											setTutorials({ ...tutorials, clickTip: true })
										}
									>
										OK
									</DialogButton>
								</div>
							)
						)}
						<MapContent content={mapContent} />
					</ContentSection>
				)
			)}
			{elections && (
				<ElectionsContent searchParams={searchParams} setSnap={setSnap} />
			)}
			{searchParams.favoris === 'oui' && <Bookmarks />}
			{styleKey === 'transports' &&
				!itinerary.isItineraryMode &&
				transportsData && (
					<TransportMap
						{...{
							bbox,
							day: searchParams.day,
							data: transportsData,
							selectedAgency: searchParams.agence,
							routesParam: searchParams.routes,
							stop: searchParams.arret,
							trainType: searchParams['type de train'],
							transitFilter: searchParams['filtre'] || defaultTransitFilter,
							agencyFilter: searchParams['gamme'] || defaultAgencyFilter,
							setIsItineraryMode: itinerary.setIsItineraryMode,
						}}
					/>
				)}

			<Itinerary
				{...{
					itinerary,
					searchParams,
					setSnap,
					close: () => {
						itinerary.reset()
						itinerary.setIsItineraryMode(false)
					},
					state,
					setState,
					setDisableDrag,
				}}
			/>
			{!sideSheet && (
				<Link
					href={setSearchParams({ intro: true }, true)}
					style={{
						float: 'right',
						marginTop: '1rem',
						color: 'var(--lighterColor)',
						padding: '0rem .3rem .05rem .3rem',
						lineHeight: '1rem',
						border: '2px solid var(--lighterColor)',
						borderRadius: '2rem',
						fontWeight: 'bold',
						zIndex: 1000,
						width: '1.4rem',
						height: '1.4rem',
						marginBottom: '1rem',
					}}
				>
					<small>?</small>
				</Link>
			)}
		</ContentWrapper>
	)
}
