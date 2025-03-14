const imagePrefix = 'indoorequal-'

const commonPoi = {
	type: 'symbol',
	'source-layer': 'poi',
	layout: {
		'icon-size': 0.6,
		'icon-image': [
			'coalesce',
			// on essaye les icones de cartes.app chargées dans la carte
			['image', ['concat', 'cartesapp-', ['get', 'subclass']]],
			['image', ['concat', 'cartesapp-', ['get', 'class']]],
			// sinon on essaye les sprites standards du style d'origine (pour être homogène avec le reste)
			['image', ['get', 'subclass']],
			['image', ['get', 'class']],
			// sinon on essaye les sprites fournis par indoorequal
			['image', ['concat', ['literal', imagePrefix], ['get', 'subclass']]],
			['image', ['concat', ['literal', imagePrefix], ['get', 'class']]],
			// sinon on affiche un point
			['image', 'dot'],
		],
		'text-anchor': 'top',
		'text-field': [
			'case',
			// aeroway=gate
			['==', ['get', 'class'], 'aeroway'],
			['get', 'ref'],
			// default
			['concat', ['get', 'name:latin'], '\n', ['get', 'name:nonlatin']],
		],
		'text-max-width': 9,
		'text-offset': [0, 0.6],
		'text-padding': 2,
		'text-size': 12,
	},
	paint: {
		'text-color': '#666',
		'text-halo-blur': 0.5,
		'text-halo-color': '#ffffff',
		'text-halo-width': 1,
	},
}

const rank2Class = [
	'waste_basket',
	'information',
	'vending_machine',
	'bench',
	'photo_booth',
	'ticket_validator',
]

const rawLayers = [
	{
		id: 'indoor-polygon',
		type: 'fill',
		'source-layer': 'area',
		filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'class', 'level']],
		paint: {
			'fill-color': [
				'case',
				// if private
				[
					'all',
					['has', 'access'],
					['in', ['get', 'access'], ['literal', ['no', 'private']]],
				],
				'#F2F1F0',
				// if POI
				[
					'any',
					[
						'all',
						['==', ['get', 'is_poi'], true],
						['!=', ['get', 'class'], 'corridor'],
					],
					[
						'in',
						['get', 'subclass'],
						[
							'literal',
							[
								'class',
								'laboratory',
								'office',
								'auditorium',
								'amphitheatre',
								'reception',
							],
						],
					],
				],
				'#D4EDFF',
				// if is a room
				['==', ['get', 'class'], 'room'],
				'#fefee2',
				// default
				'#fdfcfa',
			],
		},
	},
	{
		id: 'indoor-area',
		type: 'line',
		'source-layer': 'area',
		filter: ['all', ['in', 'class', 'area', 'corridor', 'platform']],
		paint: {
			'line-color': '#bfbfbf',
			'line-width': 1,
		},
	},
	{
		id: 'indoor-column',
		type: 'fill',
		'source-layer': 'area',
		filter: ['all', ['==', 'class', 'column']],
		paint: {
			'fill-color': '#bfbfbf',
		},
	},
	{
		id: 'indoor-lines',
		type: 'line',
		'source-layer': 'area',
		filter: ['all', ['in', 'class', 'room', 'wall']],
		paint: {
			'line-color': 'gray',
			'line-width': 2,
		},
	},
	{
		id: 'indoor-transportation',
		type: 'line',
		'source-layer': 'transportation',
		filter: ['all'],
		paint: {
			'line-color': 'gray',
			'line-dasharray': [0.4, 0.75],
			'line-width': {
				base: 1.4,
				stops: [
					[17, 2],
					[20, 10],
				],
			},
		},
	},
	{
		id: 'indoor-transportation-poi',
		type: 'symbol',
		'source-layer': 'transportation',
		filter: [
			'all',
			['in', '$type', 'Point', 'LineString'],
			['in', 'class', 'steps', 'elevator', 'escalator'],
		],
		layout: {
			'icon-image': [
				'case',
				['has', 'conveying'],
				imagePrefix + 'escalator',
				['concat', ['literal', imagePrefix], ['get', 'class']],
			],
			'symbol-placement': 'line-center',
			'icon-rotation-alignment': 'viewport',
		},
	},
	{
		id: 'indoor-poi-rank1',
		...commonPoi,
		minzoom: 17,
		filter: ['all', ['==', '$type', 'Point'], ['!in', 'class', ...rank2Class]],
	},
	{
		id: 'indoor-poi-rank2',
		...commonPoi,
		minzoom: 19,
		filter: ['all', ['==', '$type', 'Point'], ['in', 'class', ...rank2Class]],
	},
	{
		id: 'indoor-heat',
		type: 'heatmap',
		'source-layer': 'heat',
		filter: ['all'],
		paint: {
			'heatmap-color': [
				'interpolate',
				['linear'],
				['heatmap-density'],
				0,
				'rgba(102, 103, 173, 0)',
				0.1,
				'rgba(102, 103, 173, 0.2)',
				1,
				'rgba(102, 103, 173, 0.7)',
			],
			'heatmap-radius': [
				'interpolate',
				['linear'],
				['zoom'],
				0,
				3,
				13,
				20,
				17,
				40,
			],
			'heatmap-intensity': 1,
			'heatmap-opacity': [
				'interpolate',
				['linear'],
				['zoom'],
				1,
				0,
				16,
				0.1,
				17.1,
				0,
			],
		},
	},
	{
		id: 'indoor-name',
		type: 'symbol',
		'source-layer': 'area_name',
		filter: ['all'],
		layout: {
			'text-field': [
				'concat',
				['coalesce', ['get', 'name:latin'], ['get', 'ref']],
				'\n',
				['get', 'name:nonlatin'],
			],
			'text-max-width': 5,
			'text-size': 14,
		},
		paint: {
			'text-color': '#666',
			'text-halo-color': '#ffffff',
			'text-halo-width': 1,
		},
	},
]

export default rawLayers.map((layer) => {
	if (layer.type === 'symbol')
		return {
			...layer,
			layout: {
				...layer.layout,
				'text-font': ['RobotoRegular-NotoSansRegular'],
			},
		}
	else return layer
})
