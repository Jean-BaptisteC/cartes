'use client'
import { styled } from 'next-yak'
import Highlighter from 'react-highlight-words'
import Icon from './Icon'
import { buildAddress } from './osm/buildAddress'
import { omit } from './utils/utils'

// Beware, this file is shared by the Map app, and the carbon footprint / € calculators

const hash = (item) =>
	Object.entries(
		omit(
			['osmId', 'latitude', 'longitude', 'extent', 'osm_value', 'osm_key'],
			item
		)
	).join('')

const removeDuplicates = (elements) =>
	elements.reduce((memo, next) => {
		const duplicate = memo.find((el) => hash(el) === hash(next))
		return [...memo, ...(duplicate ? [] : [next])]
	}, [])

export default function GeoInputOptions({
	whichInput,
	data,
	updateState,
	rulesPath = '',
	icons,
}) {
	return (
		<ul>
			{removeDuplicates(data.results)
				.slice(0, 5)
				.map((option) => (
					<Option
						key={option.osmId}
						{...{
							whichInput,
							option,
							updateState,
							rulesPath,
							data,
							icons,
						}}
					/>
				))}
		</ul>
	)
}

const safe = (text) => (text != null ? text : '')
export const buildLocationText = (item) => {
	if (item.street) return buildAddress(item, true)

	const nameIncludes = (what) => {
		if (!what) return true
		return (
			item.name && item.name.toLowerCase().includes((what || '').toLowerCase())
		)
	}

	const displayCity = !nameIncludes(item.city),
		displayCountry = !nameIncludes(item.country) && item.country !== 'France' // these web apps are mostly designed for metropolitan France
	const displayDépartement = item.country === 'France' // French people will probably not search for cities with the same name, hence small, abroad

	// This is far from perfect, to iterate
	const locationText = `${safe(item.name)} ${
		displayCity ? safe(item.city) + (displayCountry ? ' - ' : '') : ''
	} ${displayDépartement ? safe(item.county) : ''} ${
		displayCountry ? safe(item.country) : ''
	}`

	if (locationText.includes('undefined'))
		console.log('blue', item, locationText)
	return locationText
}

const Option = ({
	whichInput,
	option,
	updateState,
	rulesPath,
	data,
	icons,
}) => {
	const choice = option.choice,
		inputValue = data.inputValue

	const { osm_key: osmKey, osm_value: osmValue } = option

	const locationText = buildLocationText(option)

	return (
		<Li $chosen={choice && choice.name === option.name}>
			<button
				onClick={(e) => {
					const newState = { ...data, choice: { ...option, inputValue } }

					updateState(newState)
				}}
			>
				{' '}
				<Icon k={osmKey} v={osmValue} icons={icons} />
				<span>
					<Highlighter
						autoEscape={true}
						searchWords={[inputValue]}
						textToHighlight={option.name ?? locationText}
						highlightStyle={highlightStyle}
					/>
					{option.name && (
						<Highlighter
							autoEscape={true}
							highlightStyle={highlightStyle}
							searchWords={[inputValue]}
							textToHighlight={locationText}
						/>
					)}
				</span>
			</button>
		</Li>
	)
}

const highlightStyle = {
	background: 'var(--lighterColor)',
}

const Li = styled.li`
	padding: 0;
	border-radius: 0;
	${(p) =>
		p.$chosen ? 'background: var(--color); color: var(--textColor)' : ''};
	border-bottom: 1px solid var(--lightestColor);
	button {
		font-size: 90%;
		line-height: 130%;
		display: flex;
		align-items: center;
		text-align: left;
		width: 100%;
		padding: 0.5rem;
		border-radius: 0;
	}
	button > span {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0 0.9rem;
		align-items: center;
		width: 100%;
	}

	button > span > span:nth-of-type(2) {
		flex-grow: 1;
		text-align: right;
		opacity: 0.6;
		font-size: 80%;
	}

	button:hover {
		background: var(--lightestColor);
	}
	button > img {
		width: 1.2rem;
		height: 1.2rem;
		margin-right: 0.6rem;
	}
`
