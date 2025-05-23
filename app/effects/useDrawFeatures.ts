import useSetSearchParams from '@/components/useSetSearchParams'
import { colors } from '@/components/utils/colors'
import parseOpeningHours from 'opening_hours'
import { useEffect, useState } from 'react'
import { buildAllezPart } from '../SetDestination'
import { decodePlace, encodePlace } from '../utils'
import buildSvgImage from './buildSvgImage'
import { safeRemove } from './utils'

export default function useDrawFeatures(
	map,
	features,
	showOpenOnly,
	category,
	setOsmFeature = () => null,
	backgroundColor = colors['color'],
	invert = false
) {
	const setSearchParams = useSetSearchParams()
	const baseId = `features-${category.name}-`

	const [sources, setSources] = useState(null)

	const hasFeatures = features && features.length > 0

	useEffect(() => {
		// on annule si la carte ou les features sont manquants
		if (!map) return
		if (!hasFeatures) return

		// on reconstruit le nom de l'icone : l'alias si précisé, sinon le nom du svg
		const imageFilename = category.icon
		const imageFinalFilename = category['icon alias']
		const iconName = imageFinalFilename || imageFilename
		// et le nom avec lequel l'image a été ajoutée dans maplibre
		const mapImageName = 'cartesapp-' + iconName // avoid collisions

		const mapImage = map.getImage(mapImageName)
		let unsubscribeEvents = () => null
		if (mapImage)
			unsubscribeEvents = draw(
				map,
				baseId,
				setSearchParams,
				setSources,
				mapImageName,
				setOsmFeature,
				category
			)
		else {
			buildSvgImage(
				imageFilename,
				imageFinalFilename,
				(img) => {
					map.addImage(mapImageName, img)

					unsubscribeEvents = draw(
						map,
						baseId,
						setSearchParams,
						setSources,
						mapImageName,
						setOsmFeature,
						category
					)
				},
				backgroundColor,
				category.iconSize
			)
		}

		// for cleaning ?
		const cleanup = () => {
			unsubscribeEvents && unsubscribeEvents()
			safeRemove(map)(
				[
					baseId + 'points',
					baseId + 'points-is-open',
					baseId + 'ways-outlines',
					baseId + 'ways',
				],
				[baseId + 'points', baseId + 'ways']
			)
		}

		return cleanup
	}, [map, category, baseId, setSources, setOsmFeature, hasFeatures])

	useEffect(() => {
		// on annule si carte ou sources ou features pas encore chargés
		if (!map) return
		if (!sources) return
		// je crois que cette condition était problématique et l'enlever n'a que des
		// avantages
		//if (!features?.length) return

		const isOpenByDefault = category['open by default']
		const featuresWithOpen = (features || []).map((f) => {
			if (!f.tags || !f.tags.opening_hours) {
				return { ...f, isOpen: null }
			}
			try {
				const oh = new parseOpeningHours(f.tags.opening_hours, {
					address: { country_code: 'fr' },
				})
				return { ...f, isOpen: oh.getState() }
			} catch (e) {
				return { ...f, isOpen: null }
			}
		})

		const shownFeatures = showOpenOnly
			? featuresWithOpen.filter((f) => f.isOpen)
			: featuresWithOpen

		const pointsData = {
			type: 'FeatureCollection',
			features: shownFeatures
				.map((feature) => {
					if (!feature.center) return null
					const tags = feature.tags || {}
					const isOpenColor = {
						true: '#4ce0a5ff',
						false: '#e95748ff',
						null: isOpenByDefault ? false : 'beige',
					}[feature.isOpen]

					const [featureType, id] = decodePlace(feature.osmCode)
					const { geometry } = feature.center
					return {
						type: 'Feature',
						geometry,
						properties: {
							id,
							tags,
							name: tags.name,
							featureType,
							isOpenColor: isOpenColor,
						},
					}
				})
				.filter(Boolean),
		}
		const waysData = {
			type: 'FeatureCollection',
			features: shownFeatures
				.map((f) => {
					const shape = f.polygon || f.geojson
					if (!shape) return null
					console.log('indigo debug geojson', shape)
					const tags = f.tags || {}
					const feature = {
						type: 'Feature',
						geometry: !invert
							? shape.geometry
							: // thanks ! https://stackoverflow.com/questions/43561504/mapbox-how-to-get-a-semi-transparent-mask-everywhere-but-on-a-specific-area
							  {
									type: 'Polygon',
									coordinates: [
										[
											[-180, -90],
											[-180, 90],
											[180, 90],
											[180, -90],
											[-180, -90],
										],
										shape.geometry.coordinates[0],
									],
							  },
						properties: {
							id: f.id,
							tags,
							name: tags.name,
						},
					}
					return feature
				})
				.filter(Boolean),
		}
		sources.ways.setData(waysData)
		sources.points.setData(pointsData)
	}, [category, features, showOpenOnly, sources])
}

const draw = (
	map,
	baseId,
	setSearchParams,
	setSources,
	mapImageName,
	setOsmFeature,
	category
) => {
	if (map.getSource(baseId + 'points')) return
	console.log('chartreuse draw ', baseId + 'points')

	// on prépare les sources qui vont contenir les ways et les points renvoyés par overpass
	const geojsonPlaceholder = { type: 'FeatureCollection', features: [] }
	map.addSource(baseId + 'points', {
		type: 'geojson',
		data: geojsonPlaceholder,
	})
	map.addSource(baseId + 'ways', {
		type: 'geojson',
		data: geojsonPlaceholder,
	})
	setSources({
		points: map.getSource(baseId + 'points'),
		ways: map.getSource(baseId + 'ways'),
	})

	// on ajoute les layers qui vont permettre de dessiner les données
	// l'intérieur des ways
	map.addLayer({
		id: baseId + 'ways',
		type: 'fill',
		source: baseId + 'ways',
		layout: {},
		paint: {
			'fill-color': colors['lightestColor'],
			'fill-opacity': 0.3,
		},
	})
	// la bordure des ways
	map.addLayer({
		id: baseId + 'ways-outlines',
		type: 'line',
		source: baseId + 'ways',
		layout: {},
		paint: {
			'line-color': colors['color'],
			'line-width': 2,
		},
	})
	// les points
	map.addLayer({
		id: baseId + 'points',
		type: 'symbol',
		source: baseId + 'points',
		layout: {
			'icon-image': mapImageName, // en utilisant l'image déjà chargée pour le fond de carte
			'icon-size': 1,
			'text-field': ['get', 'name'],
			'text-offset': [0, 1.25],
			'text-font': ['RobotoBold-NotoSansBold'],
			'text-size': 15,
			'text-anchor': category.iconAnchor === 'bottom' ? 'center' : 'top',
			'icon-anchor': category.iconAnchor || 'center',
		},
		paint: {
			'text-color': '#503f38',
			'text-halo-blur': 0.5,
			'text-halo-color': 'white',
			'text-halo-width': 1,
			//
			'icon-halo-color': 'white',
			'icon-halo-width': 40,
			'icon-halo-blur': 10,
		},
	})
	// les petits cercles pour indiquer si le lieu est ouvert
	map.addLayer({
		id: baseId + 'points-is-open',
		type: 'circle',
		source: baseId + 'points',
		paint: {
			'circle-radius': 4,
			'circle-color': ['get', 'isOpenColor'],
			'circle-stroke-color': colors['color'],
			'circle-stroke-width': 1.5,
			'circle-translate': [12, -12],
		},
		filter: ['!=', 'isOpenColor', false],
	})

	// gestion des actions en cas de clic sur un POI (l'icone ou le cercle d'ouverture)
	const onClickHandler = async (e) => {
		//on teste si le clic a eu lieu dans l'un des 2 layers possibles, sinon on arrête
		const features = map.queryRenderedFeatures(e.point, {
			layers: [baseId + 'points', baseId + 'points-is-open'],
		})
		if (!features.length) return
		console.log('point trouvé au clic dans ' + baseId)

		// on charge les infos sur le POI
		const feature = features[0]
		const { lng: longitude, lat: latitude } = e.lngLat
		const properties = feature.properties,
			tagsRaw = properties.tags
		console.log('quickSearchOSMfeatureClick', feature)
		const tags = typeof tagsRaw === 'string' ? JSON.parse(tagsRaw) : tagsRaw

		// on change l'URL affichée dans le navigateur
		setTimeout(
			() =>
				setSearchParams({
					allez: buildAllezPart(
						tags?.name || 'sans nom',
						encodePlace(properties.featureType, properties.id),
						longitude,
						latitude
					),
				}),
			200
		)

		//TODO not sure this works with our osmFeature refacto
		// on charge les données et on les affiche ?
		const osmFeature = { ...properties, tags }
		console.log(
			'will set OSMfeature after quickSearch marker click, ',
			osmFeature
		)
		setOsmFeature(osmFeature)
	}
	map.on('click', onClickHandler)

	// change pointer when entering or leaving a POI
	map.on('mouseenter', baseId + 'points', () => {
		map.getCanvas().style.cursor = 'pointer'
	})
	map.on('mouseleave', baseId + 'points', () => {
		map.getCanvas().style.cursor = ''
	})
	map.on('mouseenter', baseId + 'points-is-open', () => {
		map.getCanvas().style.cursor = 'pointer'
	})
	map.on('mouseleave', baseId + 'points-is-open', () => {
		map.getCanvas().style.cursor = ''
	})

	return () => {
		map.off('click', onClickHandler)
		//not unsubscribing other events because they do not trigger an error
		//TODO why ? do they work ?
	}
}
