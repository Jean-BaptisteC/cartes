import { fromHTML } from '@/components/utils/htmlUtils'
import fs from 'fs'
import { optimize } from 'svgo'

export async function GET(request) {
	const requestUrl = new URL(request.url),
		svgFilename = requestUrl.searchParams.get('svgFilename'),
		background = requestUrl.searchParams.get('background')

	const data = fs.readFileSync('./public/icons/' + svgFilename + '.svg', 'utf8')

	const result = optimize(data, {})

	const optimizedSvgString = result.data
	const imgSrc = fromSvgToImgSrc(optimizedSvgString, background)
	return new Response(imgSrc)
}

export const fromSvgToImgSrc = (imageText, background) => {
	const svg = fromHTML(imageText)

	/*
	;[...svg.querySelectorAll('*')].map((element) => {
		const name = svg.querySelector(element.localName.replace(/:/g, '\\:'))
		try {
			if (element.localName.includes(':')) {
				svg.removeChild(name)
			}
		} catch (e) {
			console.log('error removing', element.localName, e)
		}
	})
	*/

	let svgSize = svg.getAttribute('width') // Icons must be square !

	if (!svgSize) {
		const viewBox = svg.getAttribute('viewBox')
		const dimensions = viewBox.split(' ')
		const startsAtZero = dimensions[0] === dimensions[1] && dimensions[0] == 0
		const sameExtend = dimensions[2] === dimensions[3]
		if (!startsAtZero || !sameExtend)
			throw new Error(
				'The SVG should have width and height attributes and a corresponding viewBox'
			)
		svgSize = dimensions[2]
	}

	const xyr = svgSize / 2
	const backgroundDisk = `<circle
     style="fill:${encodeURIComponent(background)};fill-rule:evenodd"
     cx="${xyr}"
     cy="${xyr}"
     r="${xyr}" />`
	const newInner = `${backgroundDisk}<g style="fill:white;" transform="scale(.7)" transform-origin="center" transform-box="fill-box">${svg.innerHTML}</g>`
	svg.innerHTML = newInner
	//console.log('svg', newInner)
	//console.log('svg', svg.outerHTML)
	const svgTextRaw = svg.outerHTML
	const svgText = svgTextRaw.replace('stroke:#000', 'stroke:#fff')

	const src = svgTextToDataImage(svgText)
	return src
}

export const svgTextToDataImage = (svgText) => {
	const formatted = svgText
		.replaceAll(/#/g, '%23')
		.replaceAll(/"/g, "'")
		.replaceAll(/&/g, '&amp;')

	const src = 'data:image/svg+xml;charset=utf-8,' + formatted
	return src
}
